-- =============================================
-- HOA NEXUS - MASTER DATABASE CREATION SCRIPT
-- =============================================
-- This script creates the master database for managing
-- users, organizations, and client database mappings.
-- 
-- SAFETY: This creates a NEW database and does NOT
-- modify or affect any existing databases (like gmi3).
-- =============================================

-- Step 1: Create the master database
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'hoa_nexus_master')
BEGIN
    CREATE DATABASE hoa_nexus_master;
    PRINT 'Database hoa_nexus_master created successfully.';
END
ELSE
BEGIN
    PRINT 'Database hoa_nexus_master already exists.';
END
GO

-- Switch to the new database
USE hoa_nexus_master;
GO

-- =============================================
-- Step 2: Create Organizations Table
-- =============================================
-- Stores all client organizations and their database mappings

-- Drop foreign keys first if they exist
IF OBJECT_ID('FK_sec_UserAccounts_Organization', 'F') IS NOT NULL
    ALTER TABLE dbo.sec_UserAccounts DROP CONSTRAINT FK_sec_UserAccounts_Organization;
GO

IF OBJECT_ID('FK_cor_OrganizationSettings_Organization', 'F') IS NOT NULL
    ALTER TABLE dbo.cor_OrganizationSettings DROP CONSTRAINT FK_cor_OrganizationSettings_Organization;
GO

-- Drop tables in correct order (respecting foreign keys)
IF OBJECT_ID('dbo.sec_UserAccounts', 'U') IS NOT NULL
    DROP TABLE dbo.sec_UserAccounts;
GO

IF OBJECT_ID('dbo.cor_OrganizationSettings', 'U') IS NOT NULL
    DROP TABLE dbo.cor_OrganizationSettings;
GO

IF OBJECT_ID('dbo.cor_Organizations', 'U') IS NOT NULL
    DROP TABLE dbo.cor_Organizations;
GO

CREATE TABLE dbo.cor_Organizations (
    OrganizationID      uniqueidentifier NOT NULL 
        CONSTRAINT PK_cor_Organizations PRIMARY KEY DEFAULT NEWID(),
    OrganizationName    nvarchar(255) NOT NULL,
    DatabaseName        nvarchar(100) NOT NULL,  -- e.g., 'hoa_nexus_client_a'
    Subdomain           nvarchar(100) NULL,      -- e.g., 'client-a' for client-a.hoanexus.com
    IsActive            bit NOT NULL DEFAULT 1,
    CreatedOn           datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy           uniqueidentifier NULL,
    ModifiedOn          datetime2 NULL,
    ModifiedBy          uniqueidentifier NULL,
    Notes               nvarchar(max) NULL,
    
    CONSTRAINT UQ_cor_Organizations_DatabaseName UNIQUE (DatabaseName),
    CONSTRAINT UQ_cor_Organizations_Subdomain UNIQUE (Subdomain)
);
GO

-- =============================================
-- Step 3: Create User Accounts Table
-- =============================================
-- Stores all users across all organizations
IF OBJECT_ID('dbo.sec_UserAccounts', 'U') IS NOT NULL
    DROP TABLE dbo.sec_UserAccounts;
GO

CREATE TABLE dbo.sec_UserAccounts (
    UserAccountID       uniqueidentifier NOT NULL 
        CONSTRAINT PK_sec_UserAccounts PRIMARY KEY DEFAULT NEWID(),
    OrganizationID      uniqueidentifier NOT NULL,
    Username            nvarchar(255) NOT NULL,  -- Email address (used as username)
    PasswordHash        nvarchar(255) NOT NULL,
    Email               nvarchar(255) NOT NULL,   -- Required (same as Username)
    FirstName           nvarchar(100) NULL,
    LastName            nvarchar(100) NULL,
    StakeholderID       uniqueidentifier NULL,   -- Link to client DB stakeholder
    MustChangePassword  bit NOT NULL DEFAULT 1,  -- Force password change on first login
    TempPasswordExpiry  datetime2 NULL,          -- Expire temp passwords after X days
    IsActive            bit NOT NULL DEFAULT 1,
    LastLoginDate       datetime2 NULL,
    FailedLoginAttempts int NOT NULL DEFAULT 0,
    AccountLocked       bit NOT NULL DEFAULT 0,
    LockReason          nvarchar(255) NULL,
    PasswordLastChanged datetime2 NULL,
    CreatedOn           datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy           uniqueidentifier NULL,
    ModifiedOn          datetime2 NULL,
    ModifiedBy          uniqueidentifier NULL,
    
    CONSTRAINT FK_sec_UserAccounts_Organization 
        FOREIGN KEY (OrganizationID) 
        REFERENCES dbo.cor_Organizations(OrganizationID),
    CONSTRAINT UQ_sec_UserAccounts_Username UNIQUE (Username),
    CONSTRAINT UQ_sec_UserAccounts_Email UNIQUE (Email),
    CONSTRAINT CK_sec_UserAccounts_UsernameIsEmail 
        CHECK (Username = Email)  -- Ensure Username always equals Email
);
GO

-- =============================================
-- Step 4: Create Organization Settings Table
-- =============================================
-- Stores client-specific configuration settings
IF OBJECT_ID('dbo.cor_OrganizationSettings', 'U') IS NOT NULL
    DROP TABLE dbo.cor_OrganizationSettings;
GO

CREATE TABLE dbo.cor_OrganizationSettings (
    SettingID           uniqueidentifier NOT NULL 
        CONSTRAINT PK_cor_OrganizationSettings PRIMARY KEY DEFAULT NEWID(),
    OrganizationID      uniqueidentifier NOT NULL,
    SettingKey          nvarchar(100) NOT NULL,  -- e.g., 'theme_color', 'logo_url'
    SettingValue         nvarchar(max) NULL,
    SettingType          nvarchar(50) NULL,       -- 'string', 'number', 'boolean', 'json'
    IsActive            bit NOT NULL DEFAULT 1,
    CreatedOn           datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ModifiedOn          datetime2 NULL,
    
    CONSTRAINT FK_cor_OrganizationSettings_Organization 
        FOREIGN KEY (OrganizationID) 
        REFERENCES dbo.cor_Organizations(OrganizationID),
    CONSTRAINT UQ_cor_OrganizationSettings_OrgKey 
        UNIQUE (OrganizationID, SettingKey)
);
GO

-- =============================================
-- Step 5: Create Indexes for Performance
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_sec_UserAccounts_OrganizationID' AND object_id = OBJECT_ID('dbo.sec_UserAccounts'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_sec_UserAccounts_OrganizationID 
        ON dbo.sec_UserAccounts(OrganizationID);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_sec_UserAccounts_Username' AND object_id = OBJECT_ID('dbo.sec_UserAccounts'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_sec_UserAccounts_Username 
        ON dbo.sec_UserAccounts(Username);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_sec_UserAccounts_Email' AND object_id = OBJECT_ID('dbo.sec_UserAccounts'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_sec_UserAccounts_Email 
        ON dbo.sec_UserAccounts(Email);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_sec_UserAccounts_StakeholderID' AND object_id = OBJECT_ID('dbo.sec_UserAccounts'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_sec_UserAccounts_StakeholderID 
        ON dbo.sec_UserAccounts(StakeholderID) WHERE StakeholderID IS NOT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_cor_OrganizationSettings_OrganizationID' AND object_id = OBJECT_ID('dbo.cor_OrganizationSettings'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_cor_OrganizationSettings_OrganizationID 
        ON dbo.cor_OrganizationSettings(OrganizationID);
END
GO

-- =============================================
-- Step 6: Insert a Test Organization (Optional)
-- =============================================
-- This creates a test organization pointing to our test client database
-- This serves as the template organization for development/testing
-- Only insert if it doesn't already exist
IF NOT EXISTS (SELECT 1 FROM dbo.cor_Organizations WHERE DatabaseName = 'hoa_nexus_testclient' OR Subdomain = 'testclient')
BEGIN
    INSERT INTO dbo.cor_Organizations 
        (OrganizationID, OrganizationName, DatabaseName, Subdomain, IsActive)
    VALUES
        (NEWID(), 'HOA Nexus Test Client', 'hoa_nexus_testclient', 'testclient', 1);
    PRINT 'Inserted test organization.';
END
ELSE
BEGIN
    PRINT 'Test organization already exists. Skipping insert.';
END
GO

PRINT '=============================================';
PRINT 'Master database setup complete!';
PRINT '=============================================';
PRINT 'Created tables:';
PRINT '  - cor_Organizations (client list)';
PRINT '  - sec_UserAccounts (all users)';
PRINT '  - cor_OrganizationSettings (client configs)';
PRINT '';
PRINT 'Next steps:';
PRINT '  1. Review the tables in hoa_nexus_master';
PRINT '  2. Create client databases as needed';
PRINT '  3. Update your backend to use this structure';
PRINT '=============================================';
GO

