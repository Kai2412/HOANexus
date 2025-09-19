-- HOA NEXUS - AMENITIES SYSTEM DATABASE SCHEMA
-- This script creates all tables needed for the amenities management system

-- ==============================================
-- CORE TABLES (Already exist, but included for reference)
-- ==============================================

-- Communities table (core)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='cor_Communities' AND xtype='U')
CREATE TABLE cor_Communities (
    CommunityID int IDENTITY(1,1) PRIMARY KEY,
    Pcode nvarchar(10) NOT NULL UNIQUE,
    Name nvarchar(255) NOT NULL,
    Status nvarchar(50) NOT NULL DEFAULT 'Active',
    Units int,
    Address nvarchar(500),
    City nvarchar(100),
    State nvarchar(50),
    ZipCode nvarchar(20),
    CreatedDate datetime2 DEFAULT GETDATE(),
    ModifiedDate datetime2 DEFAULT GETDATE()
);

-- Properties table (core)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='cor_Properties' AND xtype='U')
CREATE TABLE cor_Properties (
    PropertyID int IDENTITY(1,1) PRIMARY KEY,
    CommunityID int NOT NULL,
    UnitNumber nvarchar(50) NOT NULL,
    Address nvarchar(500),
    Status nvarchar(50) NOT NULL DEFAULT 'Occupied',
    CreatedDate datetime2 DEFAULT GETDATE(),
    ModifiedDate datetime2 DEFAULT GETDATE(),
    FOREIGN KEY (CommunityID) REFERENCES cor_Communities(CommunityID)
);

-- Stakeholders table (core)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='cor_Stakeholders' AND xtype='U')
CREATE TABLE cor_Stakeholders (
    StakeholderID int IDENTITY(1,1) PRIMARY KEY,
    CommunityID int NOT NULL,
    PropertyID int NULL,
    FirstName nvarchar(100) NOT NULL,
    LastName nvarchar(100) NOT NULL,
    Email nvarchar(255),
    Phone nvarchar(50),
    StakeholderType nvarchar(50) NOT NULL, -- 'Resident', 'Owner', 'BoardMember', 'PropertyManager'
    Status nvarchar(50) NOT NULL DEFAULT 'Active',
    CreatedDate datetime2 DEFAULT GETDATE(),
    ModifiedDate datetime2 DEFAULT GETDATE(),
    FOREIGN KEY (CommunityID) REFERENCES cor_Communities(CommunityID),
    FOREIGN KEY (PropertyID) REFERENCES cor_Properties(PropertyID)
);

-- ==============================================
-- SECURITY & PERMISSIONS TABLES
-- ==============================================

-- User Accounts (Auth0 integration)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='sec_UserAccounts' AND xtype='U')
CREATE TABLE sec_UserAccounts (
    UserID int IDENTITY(1,1) PRIMARY KEY,
    Auth0ID nvarchar(255) NOT NULL UNIQUE, -- Auth0 user ID
    Email nvarchar(255) NOT NULL UNIQUE,
    FirstName nvarchar(100),
    LastName nvarchar(100),
    IsActive bit NOT NULL DEFAULT 1,
    LastLoginDate datetime2,
    CreatedDate datetime2 DEFAULT GETDATE(),
    ModifiedDate datetime2 DEFAULT GETDATE()
);

-- Permissions system
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='sec_Permissions' AND xtype='U')
CREATE TABLE sec_Permissions (
    PermissionID int IDENTITY(1,1) PRIMARY KEY,
    PermissionName nvarchar(100) NOT NULL UNIQUE, -- 'amenities:view', 'amenities:create', etc.
    Description nvarchar(255),
    Category nvarchar(50) NOT NULL, -- 'amenities', 'reservations', 'communities'
    IsActive bit NOT NULL DEFAULT 1
);

-- User Roles
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='sec_UserRoles' AND xtype='U')
CREATE TABLE sec_UserRoles (
    UserRoleID int IDENTITY(1,1) PRIMARY KEY,
    UserID int NOT NULL,
    CommunityID int NOT NULL,
    Role nvarchar(50) NOT NULL, -- 'resident', 'board_member', 'manager', 'admin'
    IsActive bit NOT NULL DEFAULT 1,
    CreatedDate datetime2 DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES sec_UserAccounts(UserID),
    FOREIGN KEY (CommunityID) REFERENCES cor_Communities(CommunityID),
    UNIQUE(UserID, CommunityID, Role)
);

-- ==============================================
-- OPERATIONAL TABLES - AMENITIES SYSTEM
-- ==============================================

-- Assets (Buildings, equipment, infrastructure)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='op_Assets' AND xtype='U')
CREATE TABLE op_Assets (
    AssetID int IDENTITY(1,1) PRIMARY KEY,
    CommunityID int NOT NULL,
    AssetName nvarchar(255) NOT NULL,
    AssetType nvarchar(100) NOT NULL, -- Links to cfg_AssetTypes
    Status nvarchar(50) NOT NULL DEFAULT 'Active', -- Links to cfg_StatusTypes
    Description nvarchar(1000),
    Location nvarchar(255),
    PurchaseDate date,
    WarrantyExpires date,
    CreatedDate datetime2 DEFAULT GETDATE(),
    ModifiedDate datetime2 DEFAULT GETDATE(),
    FOREIGN KEY (CommunityID) REFERENCES cor_Communities(CommunityID)
);

-- Amenities (Pools, clubhouse, gym, tennis courts)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='op_Amenities' AND xtype='U')
CREATE TABLE op_Amenities (
    AmenityID int IDENTITY(1,1) PRIMARY KEY,
    CommunityID int NOT NULL,
    Name nvarchar(255) NOT NULL,
    AmenityType nvarchar(100) NOT NULL, -- Links to cfg_AmenityTypes
    Status nvarchar(50) NOT NULL DEFAULT 'Active', -- Links to cfg_StatusTypes
    Description nvarchar(1000),
    Location nvarchar(255),
    Capacity int,
    IsReservable bit NOT NULL DEFAULT 1,
    RequiresApproval bit NOT NULL DEFAULT 0,
    ReservationFee decimal(10,2) DEFAULT 0,
    CreatedDate datetime2 DEFAULT GETDATE(),
    ModifiedDate datetime2 DEFAULT GETDATE(),
    FOREIGN KEY (CommunityID) REFERENCES cor_Communities(CommunityID)
);

-- Amenity Schedules (Operating hours, seasonal schedules)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='op_AmenitySchedules' AND xtype='U')
CREATE TABLE op_AmenitySchedules (
    ScheduleID int IDENTITY(1,1) PRIMARY KEY,
    AmenityID int NOT NULL,
    DayOfWeek int NOT NULL, -- 0=Sunday, 1=Monday, etc.
    OpenTime time,
    CloseTime time,
    IsOpen bit NOT NULL DEFAULT 1,
    EffectiveStartDate date NOT NULL,
    EffectiveEndDate date, -- NULL = ongoing
    CreatedDate datetime2 DEFAULT GETDATE(),
    FOREIGN KEY (AmenityID) REFERENCES op_Amenities(AmenityID)
);

-- Amenity Features (Equipment within amenities)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='op_AmenityFeatures' AND xtype='U')
CREATE TABLE op_AmenityFeatures (
    FeatureID int IDENTITY(1,1) PRIMARY KEY,
    AmenityID int NOT NULL,
    FeatureName nvarchar(255) NOT NULL,
    Description nvarchar(500),
    Status nvarchar(50) NOT NULL DEFAULT 'Active',
    CreatedDate datetime2 DEFAULT GETDATE(),
    ModifiedDate datetime2 DEFAULT GETDATE(),
    FOREIGN KEY (AmenityID) REFERENCES op_Amenities(AmenityID)
);

-- Amenity Reservations (Booking system with conflict prevention)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='op_AmenityReservations' AND xtype='U')
CREATE TABLE op_AmenityReservations (
    ReservationID int IDENTITY(1,1) PRIMARY KEY,
    AmenityID int NOT NULL,
    UserID int NOT NULL,
    ReservationDate date NOT NULL,
    StartTime time NOT NULL,
    EndTime time NOT NULL,
    Status nvarchar(50) NOT NULL DEFAULT 'Confirmed', -- 'Pending', 'Confirmed', 'Cancelled'
    AttendeeCount int DEFAULT 1,
    Purpose nvarchar(500),
    SpecialRequests nvarchar(1000),
    Fee decimal(10,2) DEFAULT 0,
    ApprovedBy int NULL, -- UserID of approver
    ApprovedDate datetime2 NULL,
    CreatedDate datetime2 DEFAULT GETDATE(),
    ModifiedDate datetime2 DEFAULT GETDATE(),
    FOREIGN KEY (AmenityID) REFERENCES op_Amenities(AmenityID),
    FOREIGN KEY (UserID) REFERENCES sec_UserAccounts(UserID),
    FOREIGN KEY (ApprovedBy) REFERENCES sec_UserAccounts(UserID)
);

-- Work Orders (Maintenance and repair requests)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='op_WorkOrders' AND xtype='U')
CREATE TABLE op_WorkOrders (
    WorkOrderID int IDENTITY(1,1) PRIMARY KEY,
    CommunityID int NOT NULL,
    AmenityID int NULL, -- If related to an amenity
    AssetID int NULL, -- If related to an asset
    RequestedBy int NOT NULL, -- UserID
    AssignedTo int NULL, -- UserID of technician/contractor
    Title nvarchar(255) NOT NULL,
    Description nvarchar(2000) NOT NULL,
    Priority nvarchar(50) NOT NULL DEFAULT 'Normal', -- Links to cfg_PriorityLevels
    Status nvarchar(50) NOT NULL DEFAULT 'Open', -- Links to cfg_StatusTypes
    RequestType nvarchar(100) NOT NULL, -- Links to cfg_RequestTypes
    EstimatedCost decimal(10,2),
    ActualCost decimal(10,2),
    ScheduledDate datetime2,
    CompletedDate datetime2,
    CreatedDate datetime2 DEFAULT GETDATE(),
    ModifiedDate datetime2 DEFAULT GETDATE(),
    FOREIGN KEY (CommunityID) REFERENCES cor_Communities(CommunityID),
    FOREIGN KEY (AmenityID) REFERENCES op_Amenities(AmenityID),
    FOREIGN KEY (AssetID) REFERENCES op_Assets(AssetID),
    FOREIGN KEY (RequestedBy) REFERENCES sec_UserAccounts(UserID),
    FOREIGN KEY (AssignedTo) REFERENCES sec_UserAccounts(UserID)
);

-- ==============================================
-- DYNAMIC CONFIGURATION TABLES
-- ==============================================

-- Amenity Types
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='cfg_AmenityTypes' AND xtype='U')
CREATE TABLE cfg_AmenityTypes (
    AmenityTypeID int IDENTITY(1,1) PRIMARY KEY,
    TypeName nvarchar(100) NOT NULL UNIQUE,
    Description nvarchar(255),
    IconClass nvarchar(100), -- For UI icons
    DefaultCapacity int,
    IsActive bit NOT NULL DEFAULT 1
);

-- Asset Types
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='cfg_AssetTypes' AND xtype='U')
CREATE TABLE cfg_AssetTypes (
    AssetTypeID int IDENTITY(1,1) PRIMARY KEY,
    TypeName nvarchar(100) NOT NULL UNIQUE,
    Description nvarchar(255),
    Category nvarchar(100), -- 'Building', 'Equipment', 'Landscape'
    IsActive bit NOT NULL DEFAULT 1
);

-- Status Types
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='cfg_StatusTypes' AND xtype='U')
CREATE TABLE cfg_StatusTypes (
    StatusTypeID int IDENTITY(1,1) PRIMARY KEY,
    StatusName nvarchar(50) NOT NULL UNIQUE,
    Description nvarchar(255),
    Category nvarchar(100), -- 'General', 'Amenities', 'WorkOrders'
    ColorCode nvarchar(10), -- Hex color for UI
    IsActive bit NOT NULL DEFAULT 1
);

-- Priority Levels
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='cfg_PriorityLevels' AND xtype='U')
CREATE TABLE cfg_PriorityLevels (
    PriorityLevelID int IDENTITY(1,1) PRIMARY KEY,
    PriorityName nvarchar(50) NOT NULL UNIQUE,
    Description nvarchar(255),
    SortOrder int NOT NULL,
    ColorCode nvarchar(10), -- Hex color for UI
    IsActive bit NOT NULL DEFAULT 1
);

-- Request Types
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='cfg_RequestTypes' AND xtype='U')
CREATE TABLE cfg_RequestTypes (
    RequestTypeID int IDENTITY(1,1) PRIMARY KEY,
    TypeName nvarchar(100) NOT NULL UNIQUE,
    Description nvarchar(255),
    Category nvarchar(100), -- 'Repair', 'Maintenance', 'Inspection'
    DefaultPriority nvarchar(50),
    IsActive bit NOT NULL DEFAULT 1
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- Amenities indexes
CREATE NONCLUSTERED INDEX IX_Amenities_CommunityID ON op_Amenities(CommunityID);
CREATE NONCLUSTERED INDEX IX_Amenities_Type_Status ON op_Amenities(AmenityType, Status);

-- Reservations indexes
CREATE NONCLUSTERED INDEX IX_Reservations_AmenityID_Date ON op_AmenityReservations(AmenityID, ReservationDate);
CREATE NONCLUSTERED INDEX IX_Reservations_UserID ON op_AmenityReservations(UserID);
CREATE NONCLUSTERED INDEX IX_Reservations_DateTime ON op_AmenityReservations(ReservationDate, StartTime, EndTime);

-- Work Orders indexes
CREATE NONCLUSTERED INDEX IX_WorkOrders_CommunityID ON op_WorkOrders(CommunityID);
CREATE NONCLUSTERED INDEX IX_WorkOrders_Status_Priority ON op_WorkOrders(Status, Priority);
CREATE NONCLUSTERED INDEX IX_WorkOrders_AssignedTo ON op_WorkOrders(AssignedTo);

-- User Roles indexes
CREATE NONCLUSTERED INDEX IX_UserRoles_UserID_Community ON sec_UserRoles(UserID, CommunityID);
CREATE NONCLUSTERED INDEX IX_UserRoles_Community_Role ON sec_UserRoles(CommunityID, Role);

PRINT 'HOA Nexus Amenities Database Schema Created Successfully';
