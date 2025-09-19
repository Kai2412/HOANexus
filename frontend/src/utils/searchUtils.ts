// Search utility functions for community data

// Interfaces moved to useCommunitySearch.ts to avoid import issues

/**
 * Search through community data and return matching items
 * Searches through field labels to find matching cards
 */
export const searchCommunityData = (
  data: any[],
  searchTerm: string
): any[] => {
  if (!searchTerm.trim()) {
    return [];
  }

  const term = searchTerm.toLowerCase().trim();
  const results: any[] = [];

  data.forEach(item => {
    const matches: string[] = [];
    let score = 0;

    // Search through the labels array
    if (item.labels && Array.isArray(item.labels)) {
      item.labels.forEach((label: string) => {
        const labelLower = label.toLowerCase();
        
        // Check for exact matches first
        if (labelLower === term) {
          matches.push(label);
          score += 100;
        }
        // Check if label contains the search term
        else if (labelLower.includes(term)) {
          matches.push(label);
          score += 50;
        }
        // Check if search term contains part of the label
        else if (term.includes(labelLower)) {
          matches.push(label);
          score += 30;
        }
      });
    }

    if (matches.length > 0) {
      results.push({
        id: item.id,
        matches,
        score
      });
    }
  });

  // Sort by score (highest first)
  return results.sort((a, b) => b.score - a.score);
};

/**
 * Highlight search terms in text
 */
export const highlightSearchTerm = (text: string, searchTerm: string): string => {
  if (!searchTerm.trim()) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>');
};

/**
 * Get search suggestions based on common search patterns
 */
export const getSearchSuggestions = (data: any[]): string[] => {
  return [
    'Community Code',
    'Display Name',
    'Legal Name',
    'Status',
    'State',
    'City',
    'Address',
    'Postal Code',
    'Tax ID',
    'Formation Date',
    'Contract Start',
    'Contract End',
    'Time Zone',
    'Record ID'
  ];
};
