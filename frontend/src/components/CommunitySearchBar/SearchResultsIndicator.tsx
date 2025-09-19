import React from 'react';

interface SearchResultsIndicatorProps {
  searchTerm: string;
  resultCount: number;
  onClear: () => void;
  className?: string;
}

const SearchResultsIndicator: React.FC<SearchResultsIndicatorProps> = ({
  searchTerm,
  resultCount,
  onClear,
  className = ""
}) => {
  if (!searchTerm.trim()) {
    return null;
  }

  return (
    <div className={`flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg ${className}`}>
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Search results for "{searchTerm}"
          </span>
        </div>
        <span className="text-sm text-blue-700 dark:text-blue-300">
          {resultCount} {resultCount === 1 ? 'match' : 'matches'} found
        </span>
      </div>
      
      <button
        onClick={onClear}
        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors duration-200"
        aria-label="Clear search"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default SearchResultsIndicator;
