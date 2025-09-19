// Amenity types and interfaces
export interface Amenity {
  AmenityID: number;
  Name: string;
  AmenityType: string;
  Status: string;
  Description?: string;
  Location?: string;
  Capacity?: number;
  IsReservable: boolean;
  RequiresApproval: boolean;
  ReservationFee: number;
  CreatedDate: string;
  ModifiedDate: string;
  CommunityName: string;
  CommunityCode: string;
  CommunityID: number;
  features?: AmenityFeature[];
  schedule?: AmenitySchedule[];
}

export interface AmenityFeature {
  FeatureID: number;
  FeatureName: string;
  Description?: string;
  Status: string;
}

export interface AmenitySchedule {
  DayOfWeek: number;
  OpenTime: string;
  CloseTime: string;
  IsOpen: boolean;
}

export interface AmenityType {
  TypeName: string;
  Description?: string;
  IconClass?: string;
  DefaultCapacity?: number;
}

export interface StatusType {
  StatusName: string;
  Description?: string;
  ColorCode?: string;
}

export interface CreateAmenityRequest {
  name: string;
  amenityType: string;
  status?: string;
  description?: string;
  location?: string;
  capacity?: number;
  isReservable?: boolean;
  requiresApproval?: boolean;
  reservationFee?: number;
  features?: Array<{
    name: string;
    description?: string;
  }>;
  schedule?: Array<{
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isOpen: boolean;
  }>;
}

export interface UpdateAmenityRequest {
  name?: string;
  amenityType?: string;
  status?: string;
  description?: string;
  location?: string;
  capacity?: number;
  isReservable?: boolean;
  requiresApproval?: boolean;
  reservationFee?: number;
}

export interface AmenityFilters {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  search?: string;
}

export interface AmenitiesResponse {
  success: boolean;
  data: Amenity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AmenityResponse {
  success: boolean;
  data: Amenity;
}

export interface AmenityTypesResponse {
  success: boolean;
  data: AmenityType[];
}

export interface StatusTypesResponse {
  success: boolean;
  data: StatusType[];
}

// Day of week constants
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
] as const;

// Common amenity status values
export const AMENITY_STATUS = {
  AVAILABLE: 'Available',
  MAINTENANCE: 'Maintenance',
  CLOSED: 'Closed',
  INACTIVE: 'Inactive'
} as const;

// Common amenity types
export const AMENITY_TYPES = {
  POOL: 'Pool',
  CLUBHOUSE: 'Clubhouse',
  GYM: 'Gym/Fitness Center',
  TENNIS_COURT: 'Tennis Court',
  BASKETBALL_COURT: 'Basketball Court',
  PLAYGROUND: 'Playground',
  DOG_PARK: 'Dog Park',
  WALKING_TRAIL: 'Walking Trail',
  PARKING: 'Parking Area',
  MEETING_ROOM: 'Meeting Room',
  OTHER: 'Other'
} as const;
