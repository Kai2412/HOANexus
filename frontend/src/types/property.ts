// Property-related types for the HOA Nexus application

export interface DatabaseProperty {
  ID: number;
  CommunityID: number;
  AddressLine1: string;
  AddressLine2?: string;
  City: string;
  State: string;
  PostalCode: string;
  Country: string;
  PropertyType: string;
  SquareFootage?: number;
  Bedrooms?: number;
  Bathrooms?: number;
  YearBuilt?: number;
  LotSize?: number;
  ParcelID?: string;
  AssessmentPercentage?: number;
  IsActiveDevelopment: boolean;
  VotingInterest?: number;
  Status: string;
  IsActive: boolean;
}

export interface Property {
  id: number;
  communityId: number;
  unit?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  propertyType: string;
  squareFootage?: number;
  squareFeet?: number; // Alias for squareFootage
  bedrooms?: number;
  bathrooms?: number;
  yearBuilt?: number;
  lotSize?: number;
  parcelId?: string;
  assessmentPercentage?: number;
  isActiveDevelopment: boolean;
  votingInterest?: number;
  status: string;
  isActive: boolean;
  ownerName?: string;
}

export interface CreatePropertyData {
  communityId: number;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  propertyType: string;
  squareFootage?: number;
  bedrooms?: number;
  bathrooms?: number;
  yearBuilt?: number;
  lotSize?: number;
  parcelId?: string;
  assessmentPercentage?: number;
  isActiveDevelopment?: boolean;
  votingInterest?: number;
  status?: string;
}

export interface UpdatePropertyData extends Partial<CreatePropertyData> {
  id: number;
}
