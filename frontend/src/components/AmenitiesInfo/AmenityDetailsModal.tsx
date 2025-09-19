import React from 'react';
import {
  MapPinIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ClockIcon,
  InformationCircleIcon,
  BuildingLibraryIcon,
  TagIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import Modal from '../Modal';
import type { Amenity } from '../../types';

interface AmenityDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  amenity: Amenity | null;
}

const AmenityDetailsModal: React.FC<AmenityDetailsModalProps> = ({
  isOpen,
  onClose,
  amenity
}) => {
  if (!amenity) return null;

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return null;
    
    try {
      // Convert to string if it's not already
      const timeStr = String(timeString);
      
      let hours, minutes;
      
      // Check if it's a full datetime string (contains 'T' or looks like ISO date)
      if (timeStr.includes('T') || timeStr.includes('-')) {
        // Parse as Date object and extract time
        const date = new Date(timeStr);
        hours = date.getHours();
        minutes = date.getMinutes().toString().padStart(2, '0');
      } else if (timeStr.includes(':')) {
        // Format: HH:MM:SS or HH:MM
        const timeParts = timeStr.split(':');
        hours = parseInt(timeParts[0]);
        minutes = timeParts[1] || '00';
      } else if (timeStr.length === 6) {
        // Format: HHMMSS
        hours = parseInt(timeStr.substring(0, 2));
        minutes = timeStr.substring(2, 4);
      } else if (timeStr.length === 4) {
        // Format: HHMM
        hours = parseInt(timeStr.substring(0, 2));
        minutes = timeStr.substring(2, 4);
      } else {
        throw new Error('Unknown time format');
      }
      
      const period = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      
      return `${hour12}:${minutes} ${period}`;
    } catch (error) {
      // Silently handle time formatting errors and return original value
      return timeString;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="3xl"
      title={amenity.Name}
    >
      <div className="space-y-6">
        {/* Amenity Header */}
        <div className="flex items-start space-x-4">
          <div className="p-4 bg-royal-100 dark:bg-royal-900/30 rounded-xl theme-transition text-4xl">
            {getAmenityIcon(amenity.AmenityType)}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold text-primary">{amenity.Name}</h2>
              <span className={`px-4 py-2 rounded-full text-sm font-medium border theme-transition ${getStatusColor(amenity.Status)}`}>
                {amenity.Status}
              </span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-secondary">
              <div className="flex items-center space-x-1">
                <TagIcon className="w-4 h-4" />
                <span>{amenity.AmenityType}</span>
              </div>
              {amenity.AmenityID && (
                <div className="flex items-center space-x-1">
                  <span className="text-tertiary">•</span>
                  <span>ID: {amenity.AmenityID}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {amenity.Description && (
          <div className="bg-surface-secondary rounded-lg p-4 theme-transition">
            <div className="flex items-start space-x-2">
              <InformationCircleIcon className="w-5 h-5 text-tertiary mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-primary mb-1">Description</h3>
                <p className="text-secondary leading-relaxed">{amenity.Description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Key Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Location & Capacity */}
          <div className="space-y-4">
            <h3 className="font-semibold text-primary text-lg border-b border-primary pb-2">Location & Capacity</h3>
            
            {amenity.Location && (
              <div className="flex items-start space-x-3">
                <MapPinIcon className="w-5 h-5 text-tertiary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-primary">Location</p>
                  <p className="text-secondary">{amenity.Location}</p>
                </div>
              </div>
            )}

            {amenity.Capacity && (
              <div className="flex items-start space-x-3">
                <UsersIcon className="w-5 h-5 text-tertiary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-primary">Capacity</p>
                  <p className="text-secondary">{amenity.Capacity} people</p>
                </div>
              </div>
            )}
          </div>

          {/* Reservation & Access */}
          <div className="space-y-4">
            <h3 className="font-semibold text-primary text-lg border-b border-primary pb-2">Reservation & Access</h3>
            
            <div className="flex items-start space-x-3">
              <CurrencyDollarIcon className="w-5 h-5 text-tertiary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-primary">Reservation Fee</p>
                <p className="text-secondary">{formatFee(amenity.ReservationFee)}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <ClockIcon className="w-5 h-5 text-tertiary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-primary">Access Type</p>
                <p className="text-secondary">
                  {amenity.IsReservable ? 'Reservation Required' : 'Open Access'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Operating Hours */}
        {amenity.schedule && amenity.schedule.length > 0 && (
          <div className="bg-surface-secondary rounded-lg p-4 theme-transition">
            <h3 className="font-semibold text-primary text-lg mb-3 flex items-center space-x-2">
              <ClockIcon className="w-5 h-5" />
              <span>Operating Hours</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {amenity.schedule.map((schedule, index) => {
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                return (
                  <div key={index} className="flex justify-between items-center p-2 bg-surface rounded border border-primary">
                    <span className="font-medium text-primary">{dayNames[schedule.DayOfWeek]}</span>
                    <span className="text-secondary text-sm">
                      {schedule.IsOpen 
                        ? `${formatTime(schedule.OpenTime)} - ${formatTime(schedule.CloseTime)}`
                        : 'Closed'
                      }
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Additional Features */}
        {amenity.features && amenity.features.length > 0 && (
          <div className="bg-surface-secondary rounded-lg p-4 theme-transition">
            <h3 className="font-semibold text-primary text-lg mb-3 flex items-center space-x-2">
              <TagIcon className="w-5 h-5" />
              <span>Features</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {amenity.features.map((feature) => (
                <div key={feature.FeatureID} className="flex items-center justify-between p-3 bg-surface rounded border border-primary">
                  <div>
                    <p className="font-medium text-primary">{feature.FeatureName}</p>
                    {feature.Description && (
                      <p className="text-sm text-secondary">{feature.Description}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border theme-transition ${getStatusColor(feature.Status)}`}>
                    {feature.Status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Access & Requirements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-secondary rounded-lg p-4 theme-transition">
            <h3 className="font-semibold text-primary text-lg mb-3 flex items-center space-x-2">
              <CheckBadgeIcon className="w-5 h-5" />
              <span>Access Requirements</span>
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-primary">Reservation Required</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  amenity.IsReservable 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                }`}>
                  {amenity.IsReservable ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-primary">Approval Required</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  amenity.RequiresApproval 
                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                }`}>
                  {amenity.RequiresApproval ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="bg-surface-secondary rounded-lg p-4 theme-transition">
            <h3 className="font-semibold text-primary text-lg mb-3 flex items-center space-x-2">
              <BuildingLibraryIcon className="w-5 h-5" />
              <span>System Information</span>
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="font-medium text-primary">Created</p>
                <p className="text-secondary">{formatDate(amenity.CreatedDate)}</p>
              </div>
              {amenity.ModifiedDate && (
                <div>
                  <p className="font-medium text-primary">Last Updated</p>
                  <p className="text-secondary">{formatDate(amenity.ModifiedDate)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Future: Attachments section */}
        <div className="border-t border-primary pt-4">
          <div className="text-center text-sm text-tertiary">
            <p>💡 File attachments and additional resources coming soon</p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AmenityDetailsModal;
