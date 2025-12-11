const Community = require('../../models/community');
const { logger } = require('../../utils/logger');

/**
 * Community Detection Service
 * Detects which community a user is asking about from their question
 */
class CommunityDetectionService {
  constructor() {
    this.communitiesCache = null;
    this.cacheExpiry = null;
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get all communities (cached)
   * @returns {Promise<Array>} Array of communities with ID, DisplayName, LegalName, PropertyCode
   */
  async getAllCommunities() {
    // Return cached data if still valid
    if (this.communitiesCache && this.cacheExpiry && Date.now() < this.cacheExpiry) {
      return this.communitiesCache;
    }

    try {
      const communities = await Community.getAll();
      
      // Cache the communities with their searchable names
      this.communitiesCache = communities.map(comm => ({
        id: comm.CommunityID,
        displayName: comm.DisplayName || '',
        legalName: comm.LegalName || '',
        propertyCode: comm.PropertyCode || '',
        // Create searchable text (all names combined, lowercased)
        searchText: [
          comm.DisplayName,
          comm.LegalName,
          comm.PropertyCode
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
      }));

      this.cacheExpiry = Date.now() + this.CACHE_DURATION;
      
      logger.info('Communities loaded for detection', 'CommunityDetectionService', {
        count: this.communitiesCache.length
      });

      return this.communitiesCache;
    } catch (error) {
      logger.error('Error loading communities', 'CommunityDetectionService', {}, error);
      return [];
    }
  }

  /**
   * Detect which community(s) are mentioned in a question
   * @param {string} question - User's question
   * @param {string} defaultCommunityId - Default community ID (currently selected)
   * @returns {Promise<Object>} { detectedCommunityId, confidence, method }
   */
  async detectCommunity(question, defaultCommunityId = null) {
    if (!question || typeof question !== 'string') {
      return {
        detectedCommunityId: defaultCommunityId,
        confidence: 'none',
        method: 'default'
      };
    }

    const communities = await this.getAllCommunities();
    if (communities.length === 0) {
      return {
        detectedCommunityId: defaultCommunityId,
        confidence: 'none',
        method: 'default'
      };
    }

    const questionLower = question.toLowerCase();
    
    // Check for exact matches first (highest confidence)
    for (const comm of communities) {
      // Check if question contains the display name, legal name, or property code
      if (comm.displayName && questionLower.includes(comm.displayName.toLowerCase())) {
        return {
          detectedCommunityId: comm.id,
          confidence: 'high',
          method: 'name_match',
          matchedName: comm.displayName
        };
      }
      if (comm.legalName && questionLower.includes(comm.legalName.toLowerCase())) {
        return {
          detectedCommunityId: comm.id,
          confidence: 'high',
          method: 'name_match',
          matchedName: comm.legalName
        };
      }
      if (comm.propertyCode && questionLower.includes(comm.propertyCode.toLowerCase())) {
        return {
          detectedCommunityId: comm.id,
          confidence: 'high',
          method: 'code_match',
          matchedName: comm.propertyCode
        };
      }
    }

    // Check for partial matches (medium confidence)
    const partialMatches = [];
    for (const comm of communities) {
      const searchTerms = [
        comm.displayName,
        comm.legalName,
        comm.propertyCode
      ].filter(Boolean);

      for (const term of searchTerms) {
        const termWords = term.toLowerCase().split(/\s+/);
        // Check if at least 2 words from the community name appear in the question
        const matchingWords = termWords.filter(word => 
          word.length > 3 && questionLower.includes(word)
        );
        
        if (matchingWords.length >= 2) {
          partialMatches.push({
            id: comm.id,
            name: term,
            matchCount: matchingWords.length
          });
        }
      }
    }

    if (partialMatches.length > 0) {
      // Use the best match (most matching words)
      const bestMatch = partialMatches.reduce((best, current) => 
        current.matchCount > best.matchCount ? current : best
      );
      
      return {
        detectedCommunityId: bestMatch.id,
        confidence: 'medium',
        method: 'partial_match',
        matchedName: bestMatch.name
      };
    }

    // No community detected - use default or return null
    return {
      detectedCommunityId: defaultCommunityId,
      confidence: 'none',
      method: 'default'
    };
  }

  /**
   * Clear the communities cache (useful for testing or when communities are updated)
   */
  clearCache() {
    this.communitiesCache = null;
    this.cacheExpiry = null;
  }
}

module.exports = new CommunityDetectionService();

