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
    TableName           varchar(100) NOT NULL,
    ColumnName          varchar(100) NOT NULL,
    ChoiceValue         varchar(150) NOT NULL,
    DisplayOrder        int NOT NULL,
    IsDefault           bit NOT NULL DEFAULT 0,
    IsActive            bit NOT NULL DEFAULT 1,
    CreatedOn           datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy           uniqueidentifier NULL,
    ModifiedOn          datetime2 NULL,
    ModifiedBy          uniqueidentifier NULL
);
GO

-- Create filtered unique index (SQL Server doesn't support WHERE in UNIQUE constraints)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_cor_DynamicDropChoices_TableColumnValue_Active' AND object_id = OBJECT_ID('dbo.cor_DynamicDropChoices'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UQ_cor_DynamicDropChoices_TableColumnValue_Active 
        ON dbo.cor_DynamicDropChoices(TableName, ColumnName, ChoiceValue)
        WHERE IsActive = 1;
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

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_cor_DynamicDropChoices_TableColumn' AND object_id = OBJECT_ID('dbo.cor_DynamicDropChoices'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_cor_DynamicDropChoices_TableColumn 
        ON dbo.cor_DynamicDropChoices(TableName, ColumnName);
END
GO

-- =============================================
-- Step 6: Insert Sample Dynamic Drop Choices
-- =============================================
-- Insert dropdown choices AFTER tables are created
-- All dropdown options for Communities table
-- Only insert if table is empty (avoid duplicates)
IF NOT EXISTS (SELECT 1 FROM dbo.cor_DynamicDropChoices)
BEGIN
    INSERT INTO dbo.cor_DynamicDropChoices
  (ChoiceID, TableName, ColumnName, ChoiceValue, DisplayOrder, IsDefault, IsActive, CreatedOn, CreatedBy)
VALUES
  -- Client Type
  (NEWID(), 'cor_Communities', 'ClientType', 'HOA',                      1, 1, 1, SYSUTCDATETIME(), NULL),
  (NEWID(), 'cor_Communities', 'ClientType', 'Condominium',              2, 0, 1, SYSUTCDATETIME(), NULL),
  (NEWID(), 'cor_Communities', 'ClientType', 'Commercial',               3, 0, 1, SYSUTCDATETIME(), NULL),
  (NEWID(), 'cor_Communities', 'ClientType', 'Commercial Condominium',   4, 0, 1, SYSUTCDATETIME(), NULL),
  (NEWID(), 'cor_Communities', 'ClientType', 'Mixed Use',                5, 0, 1, SYSUTCDATETIME(), NULL),
  (NEWID(), 'cor_Communities', 'ClientType', 'Townhomes',                6, 0, 1, SYSUTCDATETIME(), NULL),
  (NEWID(), 'cor_Communities', 'ClientType', 'Other',                    7, 0, 1, SYSUTCDATETIME(), NULL),

  -- Service Type
  (NEWID(), 'cor_Communities', 'ServiceType', 'Full Service',      1, 1, 1, SYSUTCDATETIME(), NULL),
  (NEWID(), 'cor_Communities', 'ServiceType', 'Hybrid',            2, 0, 1, SYSUTCDATETIME(), NULL),
  (NEWID(), 'cor_Communities', 'ServiceType', 'Accounting Only',   3, 0, 1, SYSUTCDATETIME(), NULL),
  (NEWID(), 'cor_Communities', 'ServiceType', 'Compliance Only',   4, 0, 1, SYSUTCDATETIME(), NULL),

  -- Management Type
  (NEWID(), 'cor_Communities', 'ManagementType', 'Portfolio',      1, 1, 1, SYSUTCDATETIME(), NULL),
  (NEWID(), 'cor_Communities', 'ManagementType', 'Onsite',         2, 0, 1, SYSUTCDATETIME(), NULL),
  (NEWID(), 'cor_Communities', 'ManagementType', 'Hybrid',         3, 0, 1, SYSUTCDATETIME(), NULL),

  -- Development Stage
  (NEWID(), 'cor_Communities', 'DevelopmentStage', 'Homeowner Controlled', 1, 1, 1, SYSUTCDATETIME(), NULL),
  (NEWID(), 'cor_Communities', 'DevelopmentStage', 'Declarant Controlled', 2, 0, 1, SYSUTCDATETIME(), NULL),

  -- Acquisition Type
  (NEWID(), 'cor_Communities', 'AcquisitionType', 'Organic',       1, 1, 1, SYSUTCDATETIME(), NULL),
  (NEWID(), 'cor_Communities', 'AcquisitionType', 'Acquisition',   2, 0, 1, SYSUTCDATETIME(), NULL);
    
    PRINT 'Inserted all dropdown choices.';
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
PRINT '  - cor_DynamicDropChoices (with sample data)';
PRINT '';
PRINT 'Next steps:';
PRINT '  1. Update backend connection strings to use hoa_nexus_testclient';
PRINT '  2. Test the login system';
PRINT '  3. When creating new clients, use this database as a template';
PRINT '  4. Copy structure and seed data to new client databases';
PRINT '=============================================';
GO

