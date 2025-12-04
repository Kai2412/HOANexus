-- =============================================
-- HOA NEXUS - CLIENT DATABASE TEMPLATE/SEED SCRIPT
-- =============================================
-- This script creates the TEST CLIENT database which serves as:
-- 1. Template for creating new client databases
-- 2. Seed/development database for testing
-- 3. Reference for the standard client database structure
-- 
-- When creating new clients, use this as the base structure
-- =============================================

-- Step 1: Create the Test Client Database (Template)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'hoa_nexus_testclient')
BEGIN
    CREATE DATABASE hoa_nexus_testclient;
    PRINT 'Database hoa_nexus_testclient created successfully.';
    PRINT 'This database will serve as the template/seed for all future client databases.';
END
ELSE
BEGIN
    PRINT 'Database hoa_nexus_testclient already exists.';
END
GO

-- Switch to the test client database
USE hoa_nexus_testclient;
GO

-- =============================================
-- CLEANUP: Drop existing objects if they exist
-- =============================================
-- Drop tables in correct order (respecting foreign keys)
IF OBJECT_ID('dbo.cor_BillingInformation', 'U') IS NOT NULL
BEGIN
    -- Drop foreign keys first
    IF OBJECT_ID('FK_cor_BillingInformation_Community', 'F') IS NOT NULL
        ALTER TABLE dbo.cor_BillingInformation DROP CONSTRAINT FK_cor_BillingInformation_Community;
    IF OBJECT_ID('FK_cor_BillingInformation_BillingFrequency', 'F') IS NOT NULL
        ALTER TABLE dbo.cor_BillingInformation DROP CONSTRAINT FK_cor_BillingInformation_BillingFrequency;
    IF OBJECT_ID('FK_cor_BillingInformation_NoticeRequirement', 'F') IS NOT NULL
        ALTER TABLE dbo.cor_BillingInformation DROP CONSTRAINT FK_cor_BillingInformation_NoticeRequirement;
    
    DROP TABLE dbo.cor_BillingInformation;
    PRINT 'Dropped existing cor_BillingInformation table.';
END
GO

IF OBJECT_ID('dbo.cor_ManagementFees', 'U') IS NOT NULL
BEGIN
    -- Drop foreign keys first
    IF OBJECT_ID('FK_cor_ManagementFees_Community', 'F') IS NOT NULL
        ALTER TABLE dbo.cor_ManagementFees DROP CONSTRAINT FK_cor_ManagementFees_Community;
    IF OBJECT_ID('FK_cor_ManagementFees_FeeType', 'F') IS NOT NULL
        ALTER TABLE dbo.cor_ManagementFees DROP CONSTRAINT FK_cor_ManagementFees_FeeType;
    
    DROP TABLE dbo.cor_ManagementFees;
    PRINT 'Dropped existing cor_ManagementFees table.';
END
GO

IF OBJECT_ID('dbo.cor_Communities', 'U') IS NOT NULL
BEGIN
    -- Drop foreign keys first
    IF OBJECT_ID('FK_cor_Communities_ClientType', 'F') IS NOT NULL
        ALTER TABLE dbo.cor_Communities DROP CONSTRAINT FK_cor_Communities_ClientType;
    IF OBJECT_ID('FK_cor_Communities_ServiceType', 'F') IS NOT NULL
        ALTER TABLE dbo.cor_Communities DROP CONSTRAINT FK_cor_Communities_ServiceType;
    IF OBJECT_ID('FK_cor_Communities_ManagementType', 'F') IS NOT NULL
        ALTER TABLE dbo.cor_Communities DROP CONSTRAINT FK_cor_Communities_ManagementType;
    IF OBJECT_ID('FK_cor_Communities_DevelopmentStage', 'F') IS NOT NULL
        ALTER TABLE dbo.cor_Communities DROP CONSTRAINT FK_cor_Communities_DevelopmentStage;
    IF OBJECT_ID('FK_cor_Communities_AcquisitionType', 'F') IS NOT NULL
        ALTER TABLE dbo.cor_Communities DROP CONSTRAINT FK_cor_Communities_AcquisitionType;
    
    DROP TABLE dbo.cor_Communities;
    PRINT 'Dropped existing cor_Communities table.';
END
GO

IF OBJECT_ID('dbo.cor_DynamicDropChoices', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.cor_DynamicDropChoices;
    PRINT 'Dropped existing cor_DynamicDropChoices table.';
END
GO

IF OBJECT_ID('dbo.cor_Stakeholders', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.cor_Stakeholders;
    PRINT 'Dropped existing cor_Stakeholders table.';
END
GO

-- =============================================
-- Step 2: Create Dynamic Drop Choices Table FIRST
-- =============================================
-- This must be created before Communities because Communities
-- has foreign keys referencing DynamicDropChoices

CREATE TABLE dbo.cor_DynamicDropChoices (
    ChoiceID            uniqueidentifier NOT NULL 
        CONSTRAINT PK_cor_DynamicDropChoices PRIMARY KEY DEFAULT NEWID(),
    GroupID             varchar(100) NOT NULL,
    ChoiceValue         varchar(150) NOT NULL,
    DisplayOrder        int NOT NULL,
    IsDefault           bit NOT NULL DEFAULT 0,
    IsActive            bit NOT NULL DEFAULT 1,
    IsSystemManaged     bit NOT NULL DEFAULT 0,
    CreatedOn           datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy           uniqueidentifier NULL,
    ModifiedOn          datetime2 NULL,
    ModifiedBy          uniqueidentifier NULL
);
GO

-- Create filtered unique index (SQL Server doesn't support WHERE in UNIQUE constraints)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_cor_DynamicDropChoices_GroupValue_Active' AND object_id = OBJECT_ID('dbo.cor_DynamicDropChoices'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UQ_cor_DynamicDropChoices_GroupValue_Active 
        ON dbo.cor_DynamicDropChoices(GroupID, ChoiceValue)
        WHERE IsActive = 1;
END
GO

-- Create index on GroupID for performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_cor_DynamicDropChoices_GroupID' AND object_id = OBJECT_ID('dbo.cor_DynamicDropChoices'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_cor_DynamicDropChoices_GroupID 
        ON dbo.cor_DynamicDropChoices(GroupID);
END
GO

-- =============================================
-- Step 3: Create Stakeholders Table (with GUIDs)
-- =============================================

CREATE TABLE dbo.cor_Stakeholders (
    StakeholderID       uniqueidentifier NOT NULL 
        CONSTRAINT PK_cor_Stakeholders PRIMARY KEY DEFAULT NEWID(),
    Type                nvarchar(50) NOT NULL,
    SubType             nvarchar(50) NULL,
    FirstName           nvarchar(100) NULL,
    LastName            nvarchar(100) NULL,
    CompanyName         nvarchar(255) NULL,
    Email               nvarchar(255) NULL,
    Phone               nvarchar(30) NULL,
    MobilePhone         nvarchar(30) NULL,
    PreferredContactMethod nvarchar(20) NULL,
    Status              nvarchar(20) NULL,
    AccessLevel         nvarchar(50) NULL,
    Department          nvarchar(100) NULL,
    Title               nvarchar(100) NULL,
    CommunityID         uniqueidentifier NULL,
    PortalAccessEnabled bit NOT NULL DEFAULT 0,
    LastLoginDate       datetime2 NULL,
    Notes               nvarchar(500) NULL,
    CreatedOn           datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy           uniqueidentifier NULL,
    ModifiedOn          datetime2 NULL,
    ModifiedBy          uniqueidentifier NULL,
    IsActive            bit NOT NULL DEFAULT 1
);
GO

-- =============================================
-- Step 4: Create Communities Table (uses GUIDs for dropdowns)
-- =============================================
-- This must be created AFTER DynamicDropChoices because it has
-- foreign keys referencing DynamicDropChoices

CREATE TABLE dbo.cor_Communities (
    CommunityID         uniqueidentifier NOT NULL 
        CONSTRAINT PK_cor_Communities PRIMARY KEY DEFAULT NEWID(),
    PropertyCode        nvarchar(50) NULL,
    DisplayName         nvarchar(150) NULL,
    LegalName           nvarchar(200) NULL,
    Active              bit NULL,
    ContractStart       date NULL,
    ContractEnd         date NULL,
    Address             nvarchar(200) NULL,
    Address2            nvarchar(200) NULL,
    City                nvarchar(100) NULL,
    State               nvarchar(50) NULL,
    Zipcode             nvarchar(20) NULL,
    ThirdPartyIdentifier nvarchar(100) NULL,
    Market              nvarchar(100) NULL,
    Office              nvarchar(100) NULL,
    Website             nvarchar(200) NULL,
    TaxID               nvarchar(30) NULL,
    StateTaxID          nvarchar(30) NULL,
    SOSFileNumber       nvarchar(30) NULL,
    TaxReturnType       nvarchar(50) NULL,
    -- Dropdown fields now store GUIDs (ChoiceID) instead of text
    ClientTypeID        uniqueidentifier NULL,
    ServiceTypeID       uniqueidentifier NULL,
    ManagementTypeID    uniqueidentifier NULL,
    DevelopmentStageID  uniqueidentifier NULL,
    AcquisitionTypeID   uniqueidentifier NULL,
    BuiltOutUnits       int NULL,
    CommunityStatus     nvarchar(100) NULL,
    PreferredContactInfo nvarchar(200) NULL,
    CreatedOn           datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy           uniqueidentifier NULL,
    ModifiedOn          datetime2 NULL,
    ModifiedBy          uniqueidentifier NULL,
    
    -- Foreign keys to DynamicDropChoices
    CONSTRAINT FK_cor_Communities_ClientType 
        FOREIGN KEY (ClientTypeID) 
        REFERENCES dbo.cor_DynamicDropChoices(ChoiceID),
    CONSTRAINT FK_cor_Communities_ServiceType 
        FOREIGN KEY (ServiceTypeID) 
        REFERENCES dbo.cor_DynamicDropChoices(ChoiceID),
    CONSTRAINT FK_cor_Communities_ManagementType 
        FOREIGN KEY (ManagementTypeID) 
        REFERENCES dbo.cor_DynamicDropChoices(ChoiceID),
    CONSTRAINT FK_cor_Communities_DevelopmentStage 
        FOREIGN KEY (DevelopmentStageID) 
        REFERENCES dbo.cor_DynamicDropChoices(ChoiceID),
    CONSTRAINT FK_cor_Communities_AcquisitionType 
        FOREIGN KEY (AcquisitionTypeID) 
        REFERENCES dbo.cor_DynamicDropChoices(ChoiceID)
);
GO

-- =============================================
-- Step 5: Create Indexes
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_cor_Stakeholders_Type' AND object_id = OBJECT_ID('dbo.cor_Stakeholders'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_cor_Stakeholders_Type 
        ON dbo.cor_Stakeholders(Type);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_cor_Stakeholders_Email' AND object_id = OBJECT_ID('dbo.cor_Stakeholders'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_cor_Stakeholders_Email 
        ON dbo.cor_Stakeholders(Email) WHERE Email IS NOT NULL;
END
GO

-- Foreign key constraint for CommunityID
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_cor_Stakeholders_CommunityID' AND parent_object_id = OBJECT_ID('dbo.cor_Stakeholders'))
BEGIN
    ALTER TABLE dbo.cor_Stakeholders
        ADD CONSTRAINT FK_cor_Stakeholders_CommunityID
        FOREIGN KEY (CommunityID) REFERENCES dbo.cor_Communities(CommunityID);
END
GO

-- Unique constraint on Email for stakeholders with portal access
-- This ensures one email = one user account
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_cor_Stakeholders_Email_PortalAccess' AND object_id = OBJECT_ID('dbo.cor_Stakeholders'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UQ_cor_Stakeholders_Email_PortalAccess 
        ON dbo.cor_Stakeholders(Email) 
        WHERE PortalAccessEnabled = 1 AND Email IS NOT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_cor_Communities_DisplayName' AND object_id = OBJECT_ID('dbo.cor_Communities'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_cor_Communities_DisplayName 
        ON dbo.cor_Communities(DisplayName);
END
GO

-- =============================================
-- Step 5b: Create Management Fees Table
-- =============================================

CREATE TABLE dbo.cor_ManagementFees (
    ManagementFeesID     uniqueidentifier NOT NULL 
        CONSTRAINT PK_cor_ManagementFees PRIMARY KEY DEFAULT NEWID(),
    CommunityID          uniqueidentifier NOT NULL,
    ManagementFee        decimal(12,2) NULL,
    PerUnitFee           decimal(12,2) NULL,
    FeeTypeID            uniqueidentifier NULL,
    IncreaseType         nvarchar(50) NULL,
    IncreaseEffective    date NULL,
    BoardApprovalRequired bit NOT NULL DEFAULT 0,
    AutoIncrease         nvarchar(50) NULL,
    FixedCost            decimal(12,2) NULL,
    CreatedOn            datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy            uniqueidentifier NULL,
    ModifiedOn           datetime2 NULL,
    ModifiedBy           uniqueidentifier NULL,
    IsActive             bit NOT NULL DEFAULT 1,
    
    CONSTRAINT FK_cor_ManagementFees_Community 
        FOREIGN KEY (CommunityID) 
        REFERENCES dbo.cor_Communities(CommunityID),
    CONSTRAINT FK_cor_ManagementFees_FeeType 
        FOREIGN KEY (FeeTypeID) 
        REFERENCES dbo.cor_DynamicDropChoices(ChoiceID)
);
GO

-- Create index on CommunityID for performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_cor_ManagementFees_CommunityID' AND object_id = OBJECT_ID('dbo.cor_ManagementFees'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_cor_ManagementFees_CommunityID 
        ON dbo.cor_ManagementFees(CommunityID);
END
GO

-- =============================================
-- Step 5c: Create Billing Information Table
-- =============================================

CREATE TABLE dbo.cor_BillingInformation (
    BillingInformationID  uniqueidentifier NOT NULL 
        CONSTRAINT PK_cor_BillingInformation PRIMARY KEY DEFAULT NEWID(),
    CommunityID            uniqueidentifier NOT NULL,
    BillingFrequencyID     uniqueidentifier NULL,
    BillingMonth           int NULL,
    BillingDay             int NULL,
    NoticeRequirementID    uniqueidentifier NULL,
    Coupon                 bit NOT NULL DEFAULT 0,
    CreatedOn              datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy              uniqueidentifier NULL,
    ModifiedOn             datetime2 NULL,
    ModifiedBy             uniqueidentifier NULL,
    IsActive               bit NOT NULL DEFAULT 1,
    
    CONSTRAINT FK_cor_BillingInformation_Community 
        FOREIGN KEY (CommunityID) 
        REFERENCES dbo.cor_Communities(CommunityID),
    CONSTRAINT FK_cor_BillingInformation_BillingFrequency 
        FOREIGN KEY (BillingFrequencyID) 
        REFERENCES dbo.cor_DynamicDropChoices(ChoiceID),
    CONSTRAINT FK_cor_BillingInformation_NoticeRequirement 
        FOREIGN KEY (NoticeRequirementID) 
        REFERENCES dbo.cor_DynamicDropChoices(ChoiceID),
    CONSTRAINT CK_cor_BillingInformation_BillingMonth 
        CHECK (BillingMonth IS NULL OR (BillingMonth >= 1 AND BillingMonth <= 12)),
    CONSTRAINT CK_cor_BillingInformation_BillingDay 
        CHECK (BillingDay IS NULL OR (BillingDay >= 1 AND BillingDay <= 31))
);
GO

-- Create index on CommunityID for performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_cor_BillingInformation_CommunityID' AND object_id = OBJECT_ID('dbo.cor_BillingInformation'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_cor_BillingInformation_CommunityID 
        ON dbo.cor_BillingInformation(CommunityID);
END
GO

-- =============================================
-- Step 5d: Create Board Information Table
-- =============================================

CREATE TABLE dbo.cor_BoardInformation (
    BoardInformationID      uniqueidentifier NOT NULL 
        CONSTRAINT PK_cor_BoardInformation PRIMARY KEY DEFAULT NEWID(),
    CommunityID             uniqueidentifier NOT NULL,
    AnnualMeetingFrequency  nvarchar(100) NULL,
    RegularMeetingFrequency nvarchar(100) NULL,
    BoardMembersRequired    int NULL,
    Quorum                  int NULL,
    TermLimits              nvarchar(200) NULL,
    CreatedOn               datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy               uniqueidentifier NULL,
    ModifiedOn              datetime2 NULL,
    ModifiedBy              uniqueidentifier NULL,
    IsActive                bit NOT NULL DEFAULT 1,
    
    CONSTRAINT FK_cor_BoardInformation_Community 
        FOREIGN KEY (CommunityID) 
        REFERENCES dbo.cor_Communities(CommunityID)
);
GO

-- Create index on CommunityID for performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_cor_BoardInformation_CommunityID' AND object_id = OBJECT_ID('dbo.cor_BoardInformation'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_cor_BoardInformation_CommunityID 
        ON dbo.cor_BoardInformation(CommunityID);
END
GO

-- =============================================
-- Step 5e: Create Fee Master Table
-- =============================================
-- Master catalog of standard fees used across all communities

CREATE TABLE dbo.cor_FeeMaster (
    FeeMasterID        uniqueidentifier NOT NULL 
        CONSTRAINT PK_cor_FeeMaster PRIMARY KEY DEFAULT NEWID(),
    FeeName             nvarchar(200) NOT NULL,
    DefaultAmount       decimal(12,2) NOT NULL,
    DisplayOrder        int NOT NULL DEFAULT 0,
    IsActive            bit NOT NULL DEFAULT 1,
    CreatedOn           datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy           uniqueidentifier NULL,
    ModifiedOn          datetime2 NULL,
    ModifiedBy          uniqueidentifier NULL
);
GO

-- Index for sorting/display
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_cor_FeeMaster_DisplayOrder' AND object_id = OBJECT_ID('dbo.cor_FeeMaster'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_cor_FeeMaster_DisplayOrder 
        ON dbo.cor_FeeMaster(DisplayOrder, IsActive);
END
GO

-- =============================================
-- Step 5f: Create Community Fee Variances Table
-- =============================================
-- Allows communities to override master fees or mark them as not billed

CREATE TABLE dbo.cor_CommunityFeeVariances (
    CommunityFeeVarianceID  uniqueidentifier NOT NULL 
        CONSTRAINT PK_cor_CommunityFeeVariances PRIMARY KEY DEFAULT NEWID(),
    CommunityID             uniqueidentifier NOT NULL,
    FeeMasterID             uniqueidentifier NOT NULL,
    VarianceType            nvarchar(50) NOT NULL,
    CustomAmount            decimal(12,2) NULL,
    Notes                   nvarchar(500) NULL,
    IsActive                bit NOT NULL DEFAULT 1,
    CreatedOn               datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy               uniqueidentifier NULL,
    ModifiedOn              datetime2 NULL,
    ModifiedBy               uniqueidentifier NULL,
    
    CONSTRAINT FK_cor_CommunityFeeVariances_Community 
        FOREIGN KEY (CommunityID) 
        REFERENCES dbo.cor_Communities(CommunityID),
    CONSTRAINT FK_cor_CommunityFeeVariances_FeeMaster 
        FOREIGN KEY (FeeMasterID) 
        REFERENCES dbo.cor_FeeMaster(FeeMasterID),
    CONSTRAINT CK_cor_CommunityFeeVariances_VarianceType 
        CHECK (VarianceType IN ('Standard', 'Not Billed', 'Custom')),
    CONSTRAINT CK_cor_CommunityFeeVariances_CustomAmount 
        CHECK (
            (VarianceType = 'Custom' AND CustomAmount IS NOT NULL) OR
            (VarianceType != 'Custom' AND CustomAmount IS NULL)
        )
);
GO

-- Indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_cor_CommunityFeeVariances_CommunityID' AND object_id = OBJECT_ID('dbo.cor_CommunityFeeVariances'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_cor_CommunityFeeVariances_CommunityID 
        ON dbo.cor_CommunityFeeVariances(CommunityID);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_cor_CommunityFeeVariances_FeeMasterID' AND object_id = OBJECT_ID('dbo.cor_CommunityFeeVariances'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_cor_CommunityFeeVariances_FeeMasterID 
        ON dbo.cor_CommunityFeeVariances(FeeMasterID);
END
GO

-- Unique constraint: One variance per fee per community (only active ones)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_cor_CommunityFeeVariances_Community_Fee' AND object_id = OBJECT_ID('dbo.cor_CommunityFeeVariances'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UQ_cor_CommunityFeeVariances_Community_Fee 
        ON dbo.cor_CommunityFeeVariances(CommunityID, FeeMasterID)
        WHERE IsActive = 1;
END
GO

-- =============================================
-- Step 5g: Create Commitment Fees Table
-- =============================================
-- Tracks HOA commitment fees by commitment type (hybrid fees)
-- Each community can have multiple fees per commitment type

CREATE TABLE dbo.cor_CommitmentFees (
    CommitmentFeeID     uniqueidentifier NOT NULL 
        CONSTRAINT PK_cor_CommitmentFees PRIMARY KEY DEFAULT NEWID(),
    CommunityID         uniqueidentifier NOT NULL,
    CommitmentTypeID    uniqueidentifier NOT NULL,
    EntryType           nvarchar(50) NOT NULL DEFAULT 'Compensation',
    FeeName             nvarchar(200) NOT NULL,
    Value               decimal(12,2) NULL,
    Notes               nvarchar(500) NULL,
    IsActive            bit NOT NULL DEFAULT 1,
    CreatedOn           datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy           uniqueidentifier NULL,
    ModifiedOn          datetime2 NULL,
    ModifiedBy          uniqueidentifier NULL,
    
    CONSTRAINT FK_cor_CommitmentFees_Community 
        FOREIGN KEY (CommunityID) 
        REFERENCES dbo.cor_Communities(CommunityID),
    CONSTRAINT FK_cor_CommitmentFees_CommitmentType 
        FOREIGN KEY (CommitmentTypeID) 
        REFERENCES dbo.cor_DynamicDropChoices(ChoiceID),
    CONSTRAINT CK_cor_CommitmentFees_EntryType 
        CHECK (EntryType IN ('Compensation', 'Commitment'))
);
GO

-- Indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_cor_CommitmentFees_CommunityID' AND object_id = OBJECT_ID('dbo.cor_CommitmentFees'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_cor_CommitmentFees_CommunityID 
        ON dbo.cor_CommitmentFees(CommunityID);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_cor_CommitmentFees_CommitmentTypeID' AND object_id = OBJECT_ID('dbo.cor_CommitmentFees'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_cor_CommitmentFees_CommitmentTypeID 
        ON dbo.cor_CommitmentFees(CommitmentTypeID);
END
GO

-- =============================================
-- Step 6: Insert Default Dynamic Drop Choices
-- =============================================
-- Insert dropdown choices AFTER tables are created
-- All default dropdown options organized by GroupID
-- Only insert if table is empty (avoid duplicates)
IF NOT EXISTS (SELECT 1 FROM dbo.cor_DynamicDropChoices)
BEGIN
    INSERT INTO dbo.cor_DynamicDropChoices
        (ChoiceID, GroupID, ChoiceValue, DisplayOrder, IsDefault, IsActive, IsSystemManaged, CreatedOn, CreatedBy)
    VALUES
        -- =============================================
        -- COMMUNITY DROPDOWNS
        -- =============================================
        
        -- Client Types
        (NEWID(), 'client-types', 'HOA', 1, 1, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'client-types', 'Condominium', 2, 0, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'client-types', 'Commercial', 3, 0, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'client-types', 'Commercial Condominium', 4, 0, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'client-types', 'Mixed Use', 5, 0, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'client-types', 'Townhome', 6, 0, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'client-types', 'Master Planned', 7, 0, 1, 0, SYSUTCDATETIME(), NULL),
        
        -- Service Types
        (NEWID(), 'service-types', 'Full Service', 1, 1, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'service-types', 'Hybrid', 2, 0, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'service-types', 'Accounting Only', 3, 0, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'service-types', 'Compliance Only', 4, 0, 1, 0, SYSUTCDATETIME(), NULL),
        
        -- Management Types
        (NEWID(), 'management-types', 'Portfolio', 1, 1, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'management-types', 'Onsite', 2, 0, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'management-types', 'Hybrid', 3, 0, 1, 0, SYSUTCDATETIME(), NULL),
        
        -- Development Stages
        (NEWID(), 'development-stages', 'Homeowner Controlled', 1, 1, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'development-stages', 'Declarant Controlled', 2, 0, 1, 0, SYSUTCDATETIME(), NULL),
        
        -- Acquisition Types
        (NEWID(), 'acquisition-types', 'Organic', 1, 1, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'acquisition-types', 'Acquisition', 2, 0, 1, 0, SYSUTCDATETIME(), NULL),
        
        -- Fee Types
        (NEWID(), 'fee-types', 'Flat Rate', 1, 1, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'fee-types', 'Tiered', 2, 0, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'fee-types', 'Per Unit', 3, 0, 1, 0, SYSUTCDATETIME(), NULL),
        
        -- Billing Frequency
        (NEWID(), 'billing-frequency', 'Annual', 1, 1, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'billing-frequency', 'Monthly', 2, 0, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'billing-frequency', 'Semi-Annual', 3, 0, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'billing-frequency', 'Quarterly', 4, 0, 1, 0, SYSUTCDATETIME(), NULL),
        
        -- Notice Requirements
        (NEWID(), 'notice-requirements', '30 Days', 1, 1, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'notice-requirements', '60 Days', 2, 0, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'notice-requirements', '90 Days', 3, 0, 1, 0, SYSUTCDATETIME(), NULL),
        
        -- =============================================
        -- STAKEHOLDER DROPDOWNS
        -- =============================================
        
        -- Stakeholder Types (System-Managed)
        (NEWID(), 'stakeholder-types', 'Resident', 1, 1, 1, 1, SYSUTCDATETIME(), NULL),
        (NEWID(), 'stakeholder-types', 'Staff', 2, 0, 1, 1, SYSUTCDATETIME(), NULL),
        (NEWID(), 'stakeholder-types', 'Vendor', 3, 0, 1, 1, SYSUTCDATETIME(), NULL),
        (NEWID(), 'stakeholder-types', 'Other', 4, 0, 1, 1, SYSUTCDATETIME(), NULL),
        
        -- Stakeholder SubTypes - Resident
        (NEWID(), 'stakeholder-subtypes-resident', 'Owner', 1, 1, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'stakeholder-subtypes-resident', 'Family Member', 2, 0, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'stakeholder-subtypes-resident', 'Guest', 3, 0, 1, 0, SYSUTCDATETIME(), NULL),
        
        -- Stakeholder SubTypes - Staff (Departments)
        (NEWID(), 'stakeholder-subtypes-staff', 'Community Management', 1, 0, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'stakeholder-subtypes-staff', 'Accounting', 2, 0, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'stakeholder-subtypes-staff', 'IT', 3, 0, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'stakeholder-subtypes-staff', 'Maintenance', 4, 0, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'stakeholder-subtypes-staff', 'Customer Service', 5, 0, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'stakeholder-subtypes-staff', 'Executive', 6, 0, 1, 0, SYSUTCDATETIME(), NULL),
        
        -- Stakeholder SubTypes - Vendor
        (NEWID(), 'stakeholder-subtypes-vendor', 'Contractors', 1, 0, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'stakeholder-subtypes-vendor', 'Service Providers', 2, 0, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'stakeholder-subtypes-vendor', 'Suppliers', 3, 0, 1, 0, SYSUTCDATETIME(), NULL),
        
        -- Preferred Contact Methods
        (NEWID(), 'preferred-contact-methods', 'Email', 1, 1, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'preferred-contact-methods', 'Phone', 2, 0, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'preferred-contact-methods', 'Mobile', 3, 0, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'preferred-contact-methods', 'Text', 4, 0, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'preferred-contact-methods', 'Mail', 5, 0, 1, 0, SYSUTCDATETIME(), NULL),
        
        -- Status
        (NEWID(), 'status', 'Active', 1, 1, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'status', 'Inactive', 2, 0, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'status', 'Pending', 3, 0, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'status', 'Suspended', 4, 0, 1, 0, SYSUTCDATETIME(), NULL),
        
        -- Access Levels (System-Managed)
        (NEWID(), 'access-levels', 'None', 1, 1, 1, 1, SYSUTCDATETIME(), NULL),
        (NEWID(), 'access-levels', 'View', 2, 0, 1, 1, SYSUTCDATETIME(), NULL),
        (NEWID(), 'access-levels', 'View+Write', 3, 0, 1, 1, SYSUTCDATETIME(), NULL),
        (NEWID(), 'access-levels', 'View+Write+Delete', 4, 0, 1, 1, SYSUTCDATETIME(), NULL),
        
        -- =============================================
        -- TICKET SYSTEM DROPDOWNS
        -- =============================================
        
        -- Ticket Statuses
        (NEWID(), 'ticket-statuses', 'Pending', 1, 1, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'ticket-statuses', 'InProgress', 2, 0, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'ticket-statuses', 'Hold', 3, 0, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'ticket-statuses', 'Completed', 4, 0, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'ticket-statuses', 'Rejected', 5, 0, 1, 0, SYSUTCDATETIME(), NULL),
        
        -- =============================================
        -- FEE MANAGEMENT DROPDOWNS
        -- =============================================
        
        -- Commitment Types (for hybrid fees)
        (NEWID(), 'commitment-types', 'Manager Monthly', 1, 0, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'commitment-types', 'Lifestyle Monthly', 2, 0, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'commitment-types', 'Assistant Monthly', 3, 0, 1, 0, SYSUTCDATETIME(), NULL),
        (NEWID(), 'commitment-types', 'Fixed Compensation', 4, 0, 1, 0, SYSUTCDATETIME(), NULL);
    
    PRINT 'Inserted all default dropdown choices.';
END
ELSE
BEGIN
    PRINT 'Dropdown choices already exist. Skipping insert.';
END
GO

-- =============================================
-- Step 7: Insert Master Fees (Seed Data)
-- =============================================
-- Populate the master fee catalog with standard fees
-- Only insert if fees don't already exist
IF NOT EXISTS (SELECT 1 FROM dbo.cor_FeeMaster WHERE IsActive = 1)
BEGIN
    INSERT INTO dbo.cor_FeeMaster (FeeName, DefaultAmount, DisplayOrder, IsActive, CreatedOn)
    VALUES
        ('Copies', 0.20, 1, 1, SYSUTCDATETIME()),
        ('Envelopes', 0.35, 2, 1, SYSUTCDATETIME()),
        ('Coupons', 10.00, 3, 1, SYSUTCDATETIME()),
        ('Handling: Mailed Correspondence', 1.00, 4, 1, SYSUTCDATETIME()),
        ('Handling: E-Statements', 1.25, 5, 1, SYSUTCDATETIME()),
        ('Handling: Payables', 2.50, 6, 1, SYSUTCDATETIME()),
        ('Handling: Physical Checks', 2.50, 7, 1, SYSUTCDATETIME()),
        ('Handling: Rushed Payables', 25.00, 8, 1, SYSUTCDATETIME()),
        ('Handling: Returned Mail', 10.00, 9, 1, SYSUTCDATETIME()),
        ('Handling: Certified Mail', 10.00, 10, 1, SYSUTCDATETIME()),
        ('Handling: Deed Restriction Letters', 2.00, 11, 1, SYSUTCDATETIME()),
        ('Postage', 5.00, 12, 1, SYSUTCDATETIME()),
        ('Amenity Access Device Processing', 20.00, 13, 1, SYSUTCDATETIME()),
        ('Gate Administration', 45.00, 14, 1, SYSUTCDATETIME()),
        ('1099 Processing', 40.00, 15, 1, SYSUTCDATETIME()),
        ('Tax Return', 375.00, 16, 1, SYSUTCDATETIME()),
        ('State Governance', 250.00, 17, 1, SYSUTCDATETIME()),
        ('Tech Fee', 45.00, 18, 1, SYSUTCDATETIME()),
        ('Special Assessment Administration', 150.00, 19, 1, SYSUTCDATETIME()),
        ('Payment Plan Administration', 25.00, 20, 1, SYSUTCDATETIME()),
        ('Petty Cash Account', 50.00, 21, 1, SYSUTCDATETIME()),
        ('Board Controlled Account', 50.00, 22, 1, SYSUTCDATETIME()),
        ('Transition Fee', 650.00, 23, 1, SYSUTCDATETIME());
    
    PRINT 'Inserted ' + CAST(@@ROWCOUNT AS varchar(10)) + ' master fees.';
END
ELSE
BEGIN
    PRINT 'Master fees already exist. Skipping insert.';
END
GO

PRINT '=============================================';
PRINT 'Test Client Database (Template) setup complete!';
PRINT '=============================================';
PRINT 'Created database: hoa_nexus_testclient';
PRINT 'This serves as the template/seed for all future clients.';
PRINT '';
-- =============================================
-- Step 10: Create File Storage Tables
-- =============================================

-- cor_Folders: Stores folder structure for file organization
IF OBJECT_ID('dbo.cor_Folders', 'U') IS NOT NULL
BEGIN
    IF OBJECT_ID('FK_cor_Folders_ParentFolder', 'F') IS NOT NULL
        ALTER TABLE dbo.cor_Folders DROP CONSTRAINT FK_cor_Folders_ParentFolder;
    IF OBJECT_ID('FK_cor_Folders_Community', 'F') IS NOT NULL
        ALTER TABLE dbo.cor_Folders DROP CONSTRAINT FK_cor_Folders_Community;
    DROP TABLE dbo.cor_Folders;
    PRINT 'Dropped existing cor_Folders table.';
END
GO

CREATE TABLE dbo.cor_Folders (
    FolderID              uniqueidentifier NOT NULL 
        CONSTRAINT PK_cor_Folders PRIMARY KEY DEFAULT NEWID(),
    CommunityID           uniqueidentifier NULL, -- NULL = global/corporate folder, NOT NULL = community-specific
    ParentFolderID        uniqueidentifier NULL,
    FolderName            nvarchar(255) NOT NULL,
    FolderPath            nvarchar(1000) NULL, -- Full path like "/Invoices/2024/January"
    FolderType            nvarchar(50) NOT NULL DEFAULT 'Community', -- 'Community', 'Corporate', 'Global'
    DisplayOrder          int NOT NULL DEFAULT 0,
    IsActive              bit NOT NULL DEFAULT 1,
    CreatedOn             datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy             uniqueidentifier NULL,
    ModifiedOn            datetime2 NULL,
    ModifiedBy            uniqueidentifier NULL,
    
    CONSTRAINT FK_cor_Folders_Community 
        FOREIGN KEY (CommunityID) 
        REFERENCES dbo.cor_Communities(CommunityID),
    CONSTRAINT FK_cor_Folders_ParentFolder 
        FOREIGN KEY (ParentFolderID) 
        REFERENCES dbo.cor_Folders(FolderID),
    CONSTRAINT CK_cor_Folders_FolderType 
        CHECK (FolderType IN ('Community', 'Corporate', 'Global')),
    CONSTRAINT CK_cor_Folders_FolderType_CommunityID 
        CHECK (
            (FolderType = 'Community' AND CommunityID IS NOT NULL) OR
            (FolderType IN ('Corporate', 'Global') AND CommunityID IS NULL)
        )
);
GO

-- Indexes for cor_Folders
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_cor_Folders_CommunityID' AND object_id = OBJECT_ID('dbo.cor_Folders'))
    CREATE INDEX IX_cor_Folders_CommunityID ON dbo.cor_Folders(CommunityID);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_cor_Folders_ParentFolderID' AND object_id = OBJECT_ID('dbo.cor_Folders'))
    CREATE INDEX IX_cor_Folders_ParentFolderID ON dbo.cor_Folders(ParentFolderID);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_cor_Folders_FolderType' AND object_id = OBJECT_ID('dbo.cor_Folders'))
    CREATE INDEX IX_cor_Folders_FolderType ON dbo.cor_Folders(FolderType);
GO

-- cor_Files: Stores file metadata (actual files stored in blob storage)
IF OBJECT_ID('dbo.cor_Files', 'U') IS NOT NULL
BEGIN
    IF OBJECT_ID('FK_cor_Files_Folder', 'F') IS NOT NULL
        ALTER TABLE dbo.cor_Files DROP CONSTRAINT FK_cor_Files_Folder;
    IF OBJECT_ID('FK_cor_Files_Community', 'F') IS NOT NULL
        ALTER TABLE dbo.cor_Files DROP CONSTRAINT FK_cor_Files_Community;
    DROP TABLE dbo.cor_Files;
    PRINT 'Dropped existing cor_Files table.';
END
GO

CREATE TABLE dbo.cor_Files (
    FileID                 uniqueidentifier NOT NULL 
        CONSTRAINT PK_cor_Files PRIMARY KEY DEFAULT NEWID(),
    FolderID               uniqueidentifier NULL,
    CommunityID            uniqueidentifier NULL, -- NULL = corporate file, NOT NULL = community file
    FileName               nvarchar(255) NOT NULL, -- Original filename
    FileNameStored         nvarchar(255) NOT NULL, -- Filename as stored (with GUID or sanitized)
    FilePath                nvarchar(1000) NOT NULL, -- Full path to file in blob storage or local
    FileSize                bigint NOT NULL, -- Size in bytes
    FolderType             nvarchar(50) NOT NULL DEFAULT 'Community', -- 'Community', 'Corporate'
    MimeType               nvarchar(100) NULL, -- e.g., "application/pdf", "image/jpeg"
    FileType               nvarchar(50) NULL, -- e.g., "invoice", "document", "image"
    IsActive                bit NOT NULL DEFAULT 1,
    CreatedOn               datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy               uniqueidentifier NULL,
    ModifiedOn              datetime2 NULL,
    ModifiedBy              uniqueidentifier NULL,
    
    CONSTRAINT FK_cor_Files_Folder 
        FOREIGN KEY (FolderID) 
        REFERENCES dbo.cor_Folders(FolderID),
    CONSTRAINT FK_cor_Files_Community 
        FOREIGN KEY (CommunityID) 
        REFERENCES dbo.cor_Communities(CommunityID),
    CONSTRAINT CK_cor_Files_FolderType 
        CHECK (FolderType IN ('Community', 'Corporate')),
    CONSTRAINT CK_cor_Files_FolderType_CommunityID 
        CHECK (
            (FolderType = 'Community' AND CommunityID IS NOT NULL) OR
            (FolderType = 'Corporate' AND CommunityID IS NULL)
        )
);
GO

-- Indexes for cor_Files
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_cor_Files_FolderID' AND object_id = OBJECT_ID('dbo.cor_Files'))
    CREATE INDEX IX_cor_Files_FolderID ON dbo.cor_Files(FolderID);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_cor_Files_CommunityID' AND object_id = OBJECT_ID('dbo.cor_Files'))
    CREATE INDEX IX_cor_Files_CommunityID ON dbo.cor_Files(CommunityID);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_cor_Files_FolderType' AND object_id = OBJECT_ID('dbo.cor_Files'))
    CREATE INDEX IX_cor_Files_FolderType ON dbo.cor_Files(FolderType);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_cor_Files_FileType' AND object_id = OBJECT_ID('dbo.cor_Files'))
    CREATE INDEX IX_cor_Files_FileType ON dbo.cor_Files(FileType);
GO

PRINT 'File storage tables (cor_Folders, cor_Files) created successfully.';
GO

-- =============================================
-- Step 11: Create Invoice Tables
-- =============================================
-- Simple snapshot-based invoice system for proof-of-concept

-- cor_Invoices: Invoice header/master record
IF OBJECT_ID('dbo.cor_Invoices', 'U') IS NOT NULL
BEGIN
    IF OBJECT_ID('FK_cor_Invoices_Community', 'F') IS NOT NULL
        ALTER TABLE dbo.cor_Invoices DROP CONSTRAINT FK_cor_Invoices_Community;
    IF OBJECT_ID('FK_cor_Invoices_File', 'F') IS NOT NULL
        ALTER TABLE dbo.cor_Invoices DROP CONSTRAINT FK_cor_Invoices_File;
    DROP TABLE dbo.cor_Invoices;
    PRINT 'Dropped existing cor_Invoices table.';
END
GO

CREATE TABLE dbo.cor_Invoices (
    InvoiceID           uniqueidentifier NOT NULL 
        CONSTRAINT PK_cor_Invoices PRIMARY KEY DEFAULT NEWID(),
    CommunityID         uniqueidentifier NOT NULL,
    InvoiceNumber       varchar(50) NOT NULL,
    InvoiceDate         date NOT NULL,
    Total               decimal(12,2) NOT NULL,
    Status              varchar(50) NOT NULL DEFAULT 'Draft',
    FileID              uniqueidentifier NULL,
    CreatedOn           datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy           uniqueidentifier NULL,
    ModifiedOn          datetime2 NULL,
    ModifiedBy          uniqueidentifier NULL,
    
    CONSTRAINT FK_cor_Invoices_Community 
        FOREIGN KEY (CommunityID) 
        REFERENCES dbo.cor_Communities(CommunityID),
    CONSTRAINT FK_cor_Invoices_File 
        FOREIGN KEY (FileID) 
        REFERENCES dbo.cor_Files(FileID)
);
GO

-- Indexes for cor_Invoices
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_cor_Invoices_CommunityID' AND object_id = OBJECT_ID('dbo.cor_Invoices'))
    CREATE INDEX IX_cor_Invoices_CommunityID ON dbo.cor_Invoices(CommunityID);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_cor_Invoices_InvoiceNumber' AND object_id = OBJECT_ID('dbo.cor_Invoices'))
    CREATE UNIQUE INDEX UQ_cor_Invoices_InvoiceNumber ON dbo.cor_Invoices(InvoiceNumber);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_cor_Invoices_InvoiceDate' AND object_id = OBJECT_ID('dbo.cor_Invoices'))
    CREATE INDEX IX_cor_Invoices_InvoiceDate ON dbo.cor_Invoices(InvoiceDate);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_cor_Invoices_Status' AND object_id = OBJECT_ID('dbo.cor_Invoices'))
    CREATE INDEX IX_cor_Invoices_Status ON dbo.cor_Invoices(Status);
GO

-- cor_InvoiceCharges: Individual line items on invoices (snapshot-based)
IF OBJECT_ID('dbo.cor_InvoiceCharges', 'U') IS NOT NULL
BEGIN
    IF OBJECT_ID('FK_cor_InvoiceCharges_Invoice', 'F') IS NOT NULL
        ALTER TABLE dbo.cor_InvoiceCharges DROP CONSTRAINT FK_cor_InvoiceCharges_Invoice;
    DROP TABLE dbo.cor_InvoiceCharges;
    PRINT 'Dropped existing cor_InvoiceCharges table.';
END
GO

CREATE TABLE dbo.cor_InvoiceCharges (
    InvoiceChargeID     uniqueidentifier NOT NULL 
        CONSTRAINT PK_cor_InvoiceCharges PRIMARY KEY DEFAULT NEWID(),
    InvoiceID           uniqueidentifier NOT NULL,
    Description         varchar(200) NOT NULL,
    Amount              decimal(12,2) NOT NULL,
    DisplayOrder        int NOT NULL DEFAULT 0,
    CreatedOn           datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy           uniqueidentifier NULL,
    ModifiedOn          datetime2 NULL,
    ModifiedBy          uniqueidentifier NULL,
    
    CONSTRAINT FK_cor_InvoiceCharges_Invoice 
        FOREIGN KEY (InvoiceID) 
        REFERENCES dbo.cor_Invoices(InvoiceID)
        ON DELETE CASCADE
);
GO

-- Indexes for cor_InvoiceCharges
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_cor_InvoiceCharges_InvoiceID' AND object_id = OBJECT_ID('dbo.cor_InvoiceCharges'))
    CREATE INDEX IX_cor_InvoiceCharges_InvoiceID ON dbo.cor_InvoiceCharges(InvoiceID);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_cor_InvoiceCharges_DisplayOrder' AND object_id = OBJECT_ID('dbo.cor_InvoiceCharges'))
    CREATE INDEX IX_cor_InvoiceCharges_DisplayOrder ON dbo.cor_InvoiceCharges(InvoiceID, DisplayOrder);
GO

PRINT 'Invoice tables (cor_Invoices, cor_InvoiceCharges) created successfully.';
GO

PRINT 'Created tables:';
PRINT '  - cor_Stakeholders (with GUIDs)';
PRINT '  - cor_Communities';
PRINT '  - cor_ManagementFees';
PRINT '  - cor_BillingInformation';
PRINT '  - cor_BoardInformation';
PRINT '  - cor_FeeMaster (with seed data)';
PRINT '  - cor_CommunityFeeVariances';
PRINT '  - cor_CommitmentFees';
PRINT '  - cor_DynamicDropChoices (with sample data)';
PRINT '  - cor_Folders';
PRINT '  - cor_Files';
PRINT '  - cor_Invoices';
PRINT '  - cor_InvoiceCharges';
PRINT '';
PRINT 'Next steps:';
PRINT '  1. Update backend connection strings to use hoa_nexus_testclient';
PRINT '  2. Test the login system';
PRINT '  3. When creating new clients, use this database as a template';
PRINT '  4. Copy structure and seed data to new client databases';
PRINT '=============================================';
GO

