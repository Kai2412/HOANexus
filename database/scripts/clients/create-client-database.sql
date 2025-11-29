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
        (NEWID(), 'ticket-statuses', 'Rejected', 5, 0, 1, 0, SYSUTCDATETIME(), NULL);
    
    PRINT 'Inserted all default dropdown choices.';
END
ELSE
BEGIN
    PRINT 'Dropdown choices already exist. Skipping insert.';
END
GO

PRINT '=============================================';
PRINT 'Test Client Database (Template) setup complete!';
PRINT '=============================================';
PRINT 'Created database: hoa_nexus_testclient';
PRINT 'This serves as the template/seed for all future clients.';
PRINT '';
PRINT 'Created tables:';
PRINT '  - cor_Stakeholders (with GUIDs)';
PRINT '  - cor_Communities';
PRINT '  - cor_ManagementFees';
PRINT '  - cor_BillingInformation';
PRINT '  - cor_BoardInformation';
PRINT '  - cor_DynamicDropChoices (with sample data)';
PRINT '';
PRINT 'Next steps:';
PRINT '  1. Update backend connection strings to use hoa_nexus_testclient';
PRINT '  2. Test the login system';
PRINT '  3. When creating new clients, use this database as a template';
PRINT '  4. Copy structure and seed data to new client databases';
PRINT '=============================================';
GO

