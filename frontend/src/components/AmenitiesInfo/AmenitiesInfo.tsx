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
import amenityService from '../../services/amenityService';
import AmenityDetailsModal from './AmenityDetailsModal';
import type { Community, Amenity } from '../../types';

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

  const loadAmenities = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await amenityService.getAmenities(community.id);
      setAmenities(response.data || []);
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

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal-600 mx-auto mb-4"></div>
          <p className="text-secondary">Loading amenities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
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
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-primary">Community Amenities</h2>
            <p className="text-secondary mt-1">
              {filteredAmenities.length} amenities available
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-tertiary" />
          <input
            type="text"
            placeholder="Search amenities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-primary rounded-lg bg-surface text-primary placeholder-tertiary focus:border-royal-500 focus:ring-1 focus:ring-royal-500 focus:outline-none theme-transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-tertiary hover:text-primary"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Amenities Grid */}
      <div className="flex-1 overflow-auto">
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
      </div>

      {/* Amenity Details Modal */}
      <AmenityDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        amenity={selectedAmenity}
      />
    </div>
  );
};

export default AmenitiesInfo;
