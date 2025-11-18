import React, { useState, useEffect } from 'react';
import { 
  HomeIcon, 
  MagnifyingGlassIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';
// import dataService from '../../services/dataService'; // Temporarily disabled - using placeholder data
import type { Community, Property } from '../../types';
import { getPropertyStatusColor } from '../../utils/statusColors';

interface ResidentInfoProps {
  community: Community;
}

interface PropertyCardProps {
  property: Property;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const formatStatus = (status: string | undefined): string => {
    if (!status) return 'Unknown';
    
    switch (status.toLowerCase()) {
      case 'forsale':
        return 'For Sale';
      case 'forrent':
        return 'For Rent';
      case 'underconstruction':
        return 'Under Construction';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const formatPropertyType = (type: string | undefined): string => {
    if (!type) return 'Unknown';
    
    switch (type.toLowerCase()) {
      case 'singlefamily':
        return 'Single Family';
      case 'townhome':
        return 'Town Home';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const formatAddress = (): string => {
    const parts = [
      property.addressLine1,
      property.addressLine2,
      property.city,
      property.state,
      property.postalCode
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  return (
    <div className="bg-surface rounded-lg shadow-sm border border-primary hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-1 theme-transition">
      <div className="p-6">
        {/* Property Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-royal-100 dark:bg-royal-900/30 rounded-lg theme-transition">
              <HomeIcon className="w-6 h-6 text-royal-600 dark:text-royal-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary">
                {property.unit || 'Unit N/A'}
              </h3>
              <p className="text-sm text-secondary">
                {formatPropertyType(property.propertyType)}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium theme-transition ${getPropertyStatusColor(property.status)}`}>
            {formatStatus(property.status)}
          </span>
        </div>

        {/* Property Details */}
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-primary mb-2">Address</h4>
            <p className="text-sm text-secondary">
              {formatAddress() || 'Address not available'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-primary">Bedrooms</h4>
              <p className="text-sm text-secondary">{property.bedrooms || 'N/A'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-primary">Bathrooms</h4>
              <p className="text-sm text-secondary">{property.bathrooms || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-primary">Square Feet</h4>
              <p className="text-sm text-secondary">
                {property.squareFeet ? property.squareFeet.toLocaleString() : 'N/A'}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-primary">Lot Size</h4>
              <p className="text-sm text-secondary">{property.lotSize || 'N/A'}</p>
            </div>
          </div>

          {property.ownerName && (
            <div>
              <h4 className="text-sm font-medium text-primary">Owner</h4>
              <p className="text-sm text-secondary">{property.ownerName}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ResidentInfo: React.FC<ResidentInfoProps> = ({ community }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (community?.id) {
      loadProperties();
    }
  }, [community?.id]);

  useEffect(() => {
    // Filter properties based on search term
    if (!searchTerm.trim()) {
      setFilteredProperties(properties);
    } else {
      const filtered = properties.filter(property => 
        property.unit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.addressLine1?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.status?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProperties(filtered);
    }
  }, [searchTerm, properties]);

  // Placeholder data - will be replaced when new property table is ready
  const getPlaceholderProperties = (): Property[] => {
    return [
      {
        id: 1,
        communityId: 1,
        unit: '101',
        addressLine1: '123 Main Street',
        addressLine2: 'Unit 101',
        city: 'San Diego',
        state: 'CA',
        postalCode: '92101',
        country: 'USA',
        propertyType: 'Condominium',
        squareFeet: 1200,
        bedrooms: 2,
        bathrooms: 2,
        lotSize: undefined,
        status: 'Occupied',
        isActive: true,
        ownerName: 'John Smith'
      },
      {
        id: 2,
        communityId: 1,
        unit: '102',
        addressLine1: '123 Main Street',
        addressLine2: 'Unit 102',
        city: 'San Diego',
        state: 'CA',
        postalCode: '92101',
        country: 'USA',
        propertyType: 'Condominium',
        squareFeet: 1500,
        bedrooms: 3,
        bathrooms: 2.5,
        lotSize: undefined,
        status: 'Occupied',
        isActive: true,
        ownerName: 'Sarah Johnson'
      },
      {
        id: 3,
        communityId: 1,
        unit: '201',
        addressLine1: '123 Main Street',
        addressLine2: 'Unit 201',
        city: 'San Diego',
        state: 'CA',
        postalCode: '92101',
        country: 'USA',
        propertyType: 'Townhome',
        squareFeet: 1800,
        bedrooms: 3,
        bathrooms: 3,
        lotSize: undefined,
        status: 'Vacant',
        isActive: true,
        ownerName: undefined
      },
      {
        id: 4,
        communityId: 1,
        unit: '202',
        addressLine1: '123 Main Street',
        addressLine2: 'Unit 202',
        city: 'San Diego',
        state: 'CA',
        postalCode: '92101',
        country: 'USA',
        propertyType: 'Condominium',
        squareFeet: 1100,
        bedrooms: 1,
        bathrooms: 1,
        lotSize: undefined,
        status: 'ForRent',
        isActive: true,
        ownerName: 'Michael Chen'
      },
      {
        id: 5,
        communityId: 1,
        unit: '301',
        addressLine1: '123 Main Street',
        addressLine2: 'Unit 301',
        city: 'San Diego',
        state: 'CA',
        postalCode: '92101',
        country: 'USA',
        propertyType: 'Condominium',
        squareFeet: 2000,
        bedrooms: 4,
        bathrooms: 3,
        lotSize: undefined,
        status: 'Occupied',
        isActive: true,
        ownerName: 'Emily Rodriguez'
      },
      {
        id: 6,
        communityId: 1,
        unit: '302',
        addressLine1: '123 Main Street',
        addressLine2: 'Unit 302',
        city: 'San Diego',
        state: 'CA',
        postalCode: '92101',
        country: 'USA',
        propertyType: 'Townhome',
        squareFeet: 1600,
        bedrooms: 2,
        bathrooms: 2,
        lotSize: undefined,
        status: 'ForSale',
        isActive: true,
        ownerName: 'David Kim'
      }
    ];
  };

  const loadProperties = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Using placeholder data - API will be reconnected when new property table is ready
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      const placeholderData = getPlaceholderProperties();
      setProperties(placeholderData);
    } catch (err) {
      setError('Failed to load properties. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  if (!community) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-lg font-medium text-secondary">
          Select a community to view resident information
        </h3>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary mb-2">
          Resident Information
        </h1>
        <p className="text-secondary">
          Properties and residents for {community.displayName}
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-tertiary" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-10 py-3 border border-primary rounded-lg focus:ring-royal-500 focus:border-royal-500 bg-surface text-primary placeholder-tertiary theme-transition"
            placeholder="Search by unit, address, owner, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <XMarkIcon className="h-5 w-5 text-tertiary hover:text-secondary theme-transition" />
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal-600 mx-auto mb-4"></div>
            <p className="text-secondary">Loading properties...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 theme-transition">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-800 dark:text-red-200">{error}</span>
          </div>
          <button
            onClick={loadProperties}
            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline theme-transition"
          >
            Try again
          </button>
        </div>
      )}

      {/* Properties Grid */}
      {!loading && !error && (
        <div className="flex-1">
          {/* Stats */}
          <div className="mb-6 p-4 bg-surface-secondary rounded-lg theme-transition">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-royal-600 dark:text-royal-400">
                  {filteredProperties.length}
                </div>
                <div className="text-sm text-secondary">
                  {searchTerm ? 'Filtered' : 'Total'} Properties
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {filteredProperties.filter(p => p.status?.toLowerCase() === 'occupied').length}
                </div>
                <div className="text-sm text-secondary">Occupied</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {filteredProperties.filter(p => p.status?.toLowerCase() === 'vacant').length}
                </div>
                <div className="text-sm text-secondary">Vacant</div>
              </div>
            </div>
          </div>

          {/* Properties List */}
          <div className="overflow-y-auto">
            {filteredProperties.length === 0 ? (
              <div className="text-center py-12">
                <HomeIcon className="mx-auto h-12 w-12 text-tertiary mb-4" />
                <h3 className="text-lg font-medium text-primary mb-2">
                  {searchTerm ? 'No properties found' : 'No properties available'}
                </h3>
                <p className="text-secondary">
                  {searchTerm 
                    ? 'Try adjusting your search criteria.' 
                    : 'This community does not have any properties yet.'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentInfo;
