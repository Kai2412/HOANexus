import React, { useState, useEffect } from 'react';

interface CommunitySearchBarProps {
  onSearch: (searchTerm: string) => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
}

const CommunitySearchBar: React.FC<CommunitySearchBarProps> = ({
  onSearch,
  onClear,
  placeholder = "Search addresses, names, postal codes...",
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, onSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleClear = () => {
    setSearchTerm('');
    onClear();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Icon */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg 
          className="w-5 h-5 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
          />
        </svg>
      </div>

      {/* Search Input */}
      <input
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={`
          w-full pl-12 pr-12 py-3 
          border border-gray-300 dark:border-gray-600 
          rounded-lg 
          bg-white dark:bg-gray-700 
          text-gray-900 dark:text-gray-100 
          placeholder-gray-500 dark:placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
          dark:focus:border-blue-400
          transition-all duration-200
          ${isFocused ? 'shadow-lg' : 'shadow-sm'}
        `}
        autoComplete="off"
      />

      {/* Clear Button */}
      {searchTerm && (
        <button
          onClick={handleClear}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 
                     text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                     transition-colors duration-200"
          aria-label="Clear search"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Search Tips */}
      {isFocused && !searchTerm && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 
                        bg-white dark:bg-gray-800 
                        border border-gray-200 dark:border-gray-600 
                        rounded-lg shadow-lg z-10">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <div className="font-medium mb-2">Search tips:</div>
            <ul className="space-y-1 text-xs">
              <li>• Type "Community Code" to find Basic Information</li>
              <li>• Type "State" or "City" to find Geographic Information</li>
              <li>• Type "Tax ID" to find Legal Information</li>
              <li>• Type "Contract Start" to find Contract Details</li>
              <li>• Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Esc</kbd> to clear</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunitySearchBar;
