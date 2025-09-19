import React, { useState, useRef, useEffect } from 'react';
import SimpleAddressInput from './SimpleAddressInput';

interface PlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected?: (place: any) => void;
  placeholder?: string;
  className?: string;
}

interface PlacePrediction {
  placePrediction: {
    place: string;
    text: {
      text: string;
      matches: any[];
    };
  };
}

const HTTPPlacesAutocomplete: React.FC<PlacesAutocompleteProps> = ({
  value,
  onChange,
  onPlaceSelected,
  placeholder = "Start typing an address...",
  className = ""
}) => {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounced search function
  const searchPlaces = async (query: string) => {
    if (!query || query.length < 3) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': import.meta.env.VITE_GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': 'suggestions.placePrediction.place,suggestions.placePrediction.text'
        },
        body: JSON.stringify({
          input: query,
          includedRegionCodes: ['US'],
          languageCode: 'en'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.suggestions && data.suggestions.length > 0) {
        setPredictions(data.suggestions);
        setShowPredictions(true);
      } else {
        setPredictions([]);
        setShowPredictions(false);
      }
    } catch (error) {
      console.error('❌ Error searching places:', error);
      setPredictions([]);
      setShowPredictions(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    onChange(query);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new debounce
    debounceRef.current = setTimeout(() => {
      searchPlaces(query);
    }, 300);
  };

  // Handle place selection
  const handlePlaceSelect = async (prediction: PlacePrediction) => {
    try {
      // Get full place details using the correct place ID
      const placeId = prediction.placePrediction.place;
      const response = await fetch(`https://places.googleapis.com/v1/${placeId}`, {
        method: 'GET',
        headers: {
          'X-Goog-Api-Key': import.meta.env.VITE_GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': 'displayName,formattedAddress,addressComponents'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const placeDetails = await response.json();
      
      // Update the input with formatted address
      const formattedAddress = placeDetails.formattedAddress || prediction.placePrediction.text.text;
      onChange(formattedAddress);
      
      // Call the callback with place details
      if (onPlaceSelected) {
        onPlaceSelected(placeDetails);
      }
      
      // Hide predictions
      setShowPredictions(false);
      setPredictions([]);
      
    } catch (error) {
      console.error('Error getting place details:', error);
      // Fallback to just using the prediction
      onChange(prediction.placePrediction.text.text);
      if (onPlaceSelected) {
        onPlaceSelected(prediction);
      }
      setShowPredictions(false);
      setPredictions([]);
    }
  };

  // Handle click outside to close predictions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click is outside both the input and the dropdown
      const target = event.target as Node;
      const isClickInsideInput = inputRef.current?.contains(target);
      const isClickInsideDropdown = document.querySelector('.places-dropdown')?.contains(target);
      
      if (!isClickInsideInput && !isClickInsideDropdown) {
        setShowPredictions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200 ${className}`}
        autoComplete="off"
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-500"></div>
        </div>
      )}
      
      {/* Predictions dropdown */}
      {showPredictions && predictions.length > 0 && (
        <div className="places-dropdown absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto backdrop-blur-sm">
          {predictions.map((prediction, index) => {
            // Extract display text from the correct structure
            const displayText = prediction.placePrediction?.text?.text || 'Unknown address';
            
            return (
              <div
                key={index}
                className="px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors duration-150 ease-in-out group"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handlePlaceSelect(prediction);
                }}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {displayText}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HTTPPlacesAutocomplete;
