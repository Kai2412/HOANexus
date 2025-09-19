import { useState, useCallback, useMemo } from 'react';
import { searchCommunityData } from '../utils/searchUtils';

// Define the interfaces locally to avoid import issues
interface SearchableData {
  id: string;
  [key: string]: any;
}

interface SearchResult {
  id: string;
  matches: string[];
  score: number;
}

interface UseCommunitySearchProps {
  data: SearchableData[];
}

interface UseCommunitySearchReturn {
  searchTerm: string;
  searchResults: SearchResult[];
  highlightedCards: string[];
  isSearching: boolean;
  hasResults: boolean;
  search: (term: string) => void;
  clearSearch: () => void;
  getCardHighlightClass: (cardId: string) => string;
}

export const useCommunitySearch = ({ data }: UseCommunitySearchProps): UseCommunitySearchReturn => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Memoized search results
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) {
      return [];
    }
    return searchCommunityData(data, searchTerm);
  }, [data, searchTerm]);

  // Get highlighted card IDs
  const highlightedCards = useMemo(() => {
    return searchResults.map(result => result.id);
  }, [searchResults]);

  // Check if we have results
  const hasResults = searchResults.length > 0;

  // Search function
  const search = useCallback((term: string) => {
    setSearchTerm(term);
    setIsSearching(term.length > 0);
  }, []);

  // Clear search function
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setIsSearching(false);
  }, []);

  // Get highlight class for a card
  const getCardHighlightClass = useCallback((cardId: string) => {
    if (!isSearching || !highlightedCards.includes(cardId)) {
      return '';
    }
    
    // Check if this is a high-priority match (exact match or starts with)
    const result = searchResults.find(r => r.id === cardId);
    if (result && result.score >= 50) {
      return 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 dark:bg-blue-900/20';
    }
    
    return 'ring-1 ring-blue-300 ring-opacity-30 bg-blue-25 dark:bg-blue-900/10';
  }, [isSearching, highlightedCards, searchResults]);

  return {
    searchTerm,
    searchResults,
    highlightedCards,
    isSearching,
    hasResults,
    search,
    clearSearch,
    getCardHighlightClass
  };
};
