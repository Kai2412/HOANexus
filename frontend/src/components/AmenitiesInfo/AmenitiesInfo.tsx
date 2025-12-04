import React, { useState, useEffect } from 'react';
import { 
  BuildingLibraryIcon, 
  MagnifyingGlassIcon,
  MapPinIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
// import amenityService from '../../services/amenityService'; // Temporarily disabled - using placeholder data
import AmenityDetailsModal from './AmenityDetailsModal';
import type { Community, Amenity } from '../../types';
import InfoViewTemplate from '../InfoViewTemplate';
import { SearchResultsIndicator } from '../CommunitySearchBar';

interface AmenitiesInfoProps {
  community: Community;
}

interface AmenityCardProps {
  amenity: Amenity;
  onClick: (amenity: Amenity) => void;
}

const AmenityCard: React.FC<AmenityCardProps> = ({ amenity, onClick }) => {
  const getAmenityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pool':
        return '🏊‍♂️';
      case 'clubhouse':
        return '🏛️';
      case 'gym':
        return '💪';
      case 'tennis court':
        return '🎾';
      case 'basketball court':
        return '🏀';
      case 'playground':
        return '🛝';
      case 'dog park':
        return '🐕';
      case 'bbq area':
        return '🔥';
      case 'meeting room':
        return '👥';
      case 'theater room':
        return '🎬';
      default:
        return '🏢';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700';
      case 'out of service':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700';
      case 'seasonal closed':
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const formatFee = (fee: number) => {
    return fee > 0 ? `$${fee.toFixed(2)}` : 'Free';
  };

  return (
    <div 
      className="bg-surface rounded-lg shadow-sm border border-primary hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-1 theme-transition"
      onClick={() => onClick(amenity)}
    >
      <div className="p-6">
        {/* Amenity Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-royal-100 dark:bg-royal-900/30 rounded-lg theme-transition text-2xl">
              {getAmenityIcon(amenity.AmenityType)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary">
                {amenity.Name}
              </h3>
              <p className="text-sm text-secondary">
                {amenity.AmenityType}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium border theme-transition ${getStatusColor(amenity.Status)}`}>
            {amenity.Status}
          </span>
        </div>

        {/* Amenity Details */}
        <div className="space-y-3">
          {amenity.Description && (
            <div>
              <p className="text-sm text-secondary line-clamp-2">
                {amenity.Description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {amenity.Location && (
              <div className="flex items-center space-x-2">
                <MapPinIcon className="w-4 h-4 text-tertiary" />
                <div>
                  <p className="text-xs font-medium text-primary">Location</p>
                  <p className="text-sm text-secondary">{amenity.Location}</p>
                </div>
              </div>
            )}
            
            {amenity.Capacity && (
              <div className="flex items-center space-x-2">
                <UsersIcon className="w-4 h-4 text-tertiary" />
                <div>
                  <p className="text-xs font-medium text-primary">Capacity</p>
                  <p className="text-sm text-secondary">{amenity.Capacity}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-primary">
            <div className="flex items-center space-x-2">
              <CurrencyDollarIcon className="w-4 h-4 text-tertiary" />
              <span className="text-sm font-medium text-primary">
                {formatFee(amenity.ReservationFee)}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <ClockIcon className="w-4 h-4 text-tertiary" />
              <span className="text-sm text-secondary">
                {amenity.IsReservable ? 'Reservable' : 'Open Access'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AmenitiesInfo: React.FC<AmenitiesInfoProps> = ({ community }) => {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load amenities when community changes
  useEffect(() => {
    if (community?.id) {
      loadAmenities();
    }
  }, [community?.id]);

  // Placeholder data - will be replaced when new amenity table is ready
  const getPlaceholderAmenities = (): Amenity[] => {
    return [
      {
        AmenityID: 1,
        Name: 'Main Pool',
        AmenityType: 'Pool',
        Status: 'Available',
        Description: 'Large outdoor swimming pool with diving board and shallow end for children.',
        Location: 'Building A, Ground Floor',
        Capacity: 50,
        IsReservable: false,
        RequiresApproval: false,
        ReservationFee: 0,
        CreatedDate: new Date().toISOString(),
        ModifiedDate: new Date().toISOString(),
        CommunityName: community.displayName || 'Community',
        CommunityCode: community.propertyCode || '',
        CommunityID: 1
      },
      {
        AmenityID: 2,
        Name: 'Community Clubhouse',
        AmenityType: 'Clubhouse',
        Status: 'Available',
        Description: 'Spacious clubhouse perfect for events, parties, and community gatherings. Includes kitchen facilities.',
        Location: 'Building B, First Floor',
        Capacity: 100,
        IsReservable: true,
        RequiresApproval: true,
        ReservationFee: 150.00,
        CreatedDate: new Date().toISOString(),
        ModifiedDate: new Date().toISOString(),
        CommunityName: community.displayName || 'Community',
        CommunityCode: community.propertyCode || '',
        CommunityID: 1
      },
      {
        AmenityID: 3,
        Name: 'Fitness Center',
        AmenityType: 'Gym',
        Status: 'Available',
        Description: 'Fully equipped gym with cardio machines, free weights, and yoga space.',
        Location: 'Building C, Ground Floor',
        Capacity: 20,
        IsReservable: false,
        RequiresApproval: false,
        ReservationFee: 0,
        CreatedDate: new Date().toISOString(),
        ModifiedDate: new Date().toISOString(),
        CommunityName: community.displayName || 'Community',
        CommunityCode: community.propertyCode || '',
        CommunityID: 1
      },
      {
        AmenityID: 4,
        Name: 'Tennis Court #1',
        AmenityType: 'Tennis Court',
        Status: 'Available',
        Description: 'Professional-grade tennis court with lighting for evening play.',
        Location: 'Outdoor Recreation Area',
        Capacity: 4,
        IsReservable: true,
        RequiresApproval: false,
        ReservationFee: 25.00,
        CreatedDate: new Date().toISOString(),
        ModifiedDate: new Date().toISOString(),
        CommunityName: community.displayName || 'Community',
        CommunityCode: community.propertyCode || '',
        CommunityID: 1
      },
      {
        AmenityID: 5,
        Name: 'Basketball Court',
        AmenityType: 'Basketball Court',
        Status: 'Available',
        Description: 'Full-size basketball court with adjustable hoops.',
        Location: 'Outdoor Recreation Area',
        Capacity: 10,
        IsReservable: false,
        RequiresApproval: false,
        ReservationFee: 0,
        CreatedDate: new Date().toISOString(),
        ModifiedDate: new Date().toISOString(),
        CommunityName: community.displayName || 'Community',
        CommunityCode: community.propertyCode || '',
        CommunityID: 1
      },
      {
        AmenityID: 6,
        Name: 'Children\'s Playground',
        AmenityType: 'Playground',
        Status: 'Available',
        Description: 'Safe, modern playground equipment for children of all ages.',
        Location: 'Central Park Area',
        Capacity: 30,
        IsReservable: false,
        RequiresApproval: false,
        ReservationFee: 0,
        CreatedDate: new Date().toISOString(),
        ModifiedDate: new Date().toISOString(),
        CommunityName: community.displayName || 'Community',
        CommunityCode: community.propertyCode || '',
        CommunityID: 1
      },
      {
        AmenityID: 7,
        Name: 'Dog Park',
        AmenityType: 'Dog Park',
        Status: 'Available',
        Description: 'Fenced dog park with separate areas for large and small dogs.',
        Location: 'North End of Property',
        Capacity: 20,
        IsReservable: false,
        RequiresApproval: false,
        ReservationFee: 0,
        CreatedDate: new Date().toISOString(),
        ModifiedDate: new Date().toISOString(),
        CommunityName: community.displayName || 'Community',
        CommunityCode: community.propertyCode || '',
        CommunityID: 1
      },
      {
        AmenityID: 8,
        Name: 'BBQ Area',
        AmenityType: 'BBQ Area',
        Status: 'Maintenance',
        Description: 'Outdoor BBQ area with multiple grills and picnic tables.',
        Location: 'Pool Deck Area',
        Capacity: 25,
        IsReservable: true,
        RequiresApproval: false,
        ReservationFee: 50.00,
        CreatedDate: new Date().toISOString(),
        ModifiedDate: new Date().toISOString(),
        CommunityName: community.displayName || 'Community',
        CommunityCode: community.propertyCode || '',
        CommunityID: 1
      },
      {
        AmenityID: 9,
        Name: 'Meeting Room',
        AmenityType: 'Meeting Room',
        Status: 'Available',
        Description: 'Conference room with AV equipment and seating for meetings.',
        Location: 'Building B, Second Floor',
        Capacity: 15,
        IsReservable: true,
        RequiresApproval: true,
        ReservationFee: 75.00,
        CreatedDate: new Date().toISOString(),
        ModifiedDate: new Date().toISOString(),
        CommunityName: community.displayName || 'Community',
        CommunityCode: community.propertyCode || '',
        CommunityID: 1
      }
    ];
  };

  const loadAmenities = async () => {
    try {
      setLoading(true);
      setError(null);
      // Using placeholder data - API will be reconnected when new amenity table is ready
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      const placeholderData = getPlaceholderAmenities();
      setAmenities(placeholderData);
    } catch (err) {
      setError('Failed to load amenities');
    } finally {
      setLoading(false);
    }
  };

  const handleAmenityClick = (amenity: Amenity) => {
    setSelectedAmenity(amenity);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAmenity(null);
  };

  // Filter amenities based on search term
  const filteredAmenities = amenities.filter(amenity =>
    amenity.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    amenity.AmenityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (amenity.Description && amenity.Description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const hasSearchResults = searchTerm.trim().length > 0;

  // Build header content
  const headerContent = (
    <>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Community Amenities</h1>
          <p className="text-secondary">
            {filteredAmenities.length} {filteredAmenities.length === 1 ? 'amenity' : 'amenities'} available
          </p>
        </div>
        <div className="w-full md:w-80">
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <MagnifyingGlassIcon className="w-5 h-5 text-tertiary" />
            </div>
            <input
              type="text"
              placeholder="Search amenities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchTerm('');
                }
              }}
              className="w-full pl-12 pr-12 py-3 border border-primary rounded-lg bg-surface text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-royal-600 focus:border-royal-600 transition-all"
              autoComplete="off"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-tertiary hover:text-primary transition-colors"
                aria-label="Clear search"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
      {hasSearchResults && (
        <SearchResultsIndicator 
          searchTerm={searchTerm} 
          resultCount={filteredAmenities.length} 
          onClear={() => setSearchTerm('')} 
        />
      )}
    </>
  );

  return (
    <InfoViewTemplate
      header={headerContent}
      hasSearchResults={hasSearchResults}
      maxHeightOffset={300}
    >
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal-600 mx-auto mb-4"></div>
            <p className="text-secondary">Loading amenities...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <BuildingLibraryIcon className="w-12 h-12 text-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-primary mb-2">Error Loading Amenities</h3>
            <p className="text-secondary mb-4">{error}</p>
            <button
              onClick={loadAmenities}
              className="px-4 py-2 bg-royal-600 text-white rounded-lg hover:bg-royal-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Amenities Content */}
      {!loading && !error && (
        <>
          {filteredAmenities.length === 0 ? (
            <div className="text-center py-12">
              <BuildingLibraryIcon className="w-16 h-16 text-tertiary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-primary mb-2">
                {searchTerm ? 'No matching amenities found' : 'No amenities available'}
              </h3>
              <p className="text-secondary">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'This community does not have any amenities configured yet.'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAmenities.map((amenity) => (
                <AmenityCard
                  key={amenity.AmenityID}
                  amenity={amenity}
                  onClick={handleAmenityClick}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Amenity Details Modal */}
      <AmenityDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        amenity={selectedAmenity}
      />
    </InfoViewTemplate>
  );
};

export default AmenitiesInfo;
