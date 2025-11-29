-- =============================================
-- ONE-OFF TABLE UPDATES & NEW TABLE CREATION
-- =============================================
-- This file is used for:
-- 1. Creating new tables incrementally (without running full create-client-database.sql)
-- 2. Adding columns to existing tables
-- 3. Creating indexes on new tables
-- 4. Inserting seed data for new tables
--
-- WORKFLOW:
-- 1. Add your table creation/update SQL here
-- 2. Test it in development
-- 3. Periodically update create-client-database.sql to include these changes
-- 4. Clear this file after changes are merged into create-client-database.sql
--
-- NOTE: This file is meant to be temporary - changes should eventually
-- be merged into the main create-client-database.sql script.
-- =============================================

USE hoa_nexus_testclient;
GO

-- =============================================
-- ADD YOUR TABLE CREATIONS/UPDATES BELOW
-- =============================================

-- =============================================
-- Create cor_BillingInformation Table
-- =============================================
IF OBJECT_ID('dbo.cor_BillingInformation', 'U') IS NOT NULL
BEGIN
    -- Drop foreign key first
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

-- Create indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_cor_BillingInformation_CommunityID' AND object_id = OBJECT_ID('dbo.cor_BillingInformation'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_cor_BillingInformation_CommunityID 
        ON dbo.cor_BillingInformation(CommunityID);
    PRINT 'Created index IX_cor_BillingInformation_CommunityID.';
END
GO

PRINT 'Created cor_BillingInformation table.';
GO

-- =============================================
-- Create cor_BoardInformation Table
-- =============================================
IF OBJECT_ID('dbo.cor_BoardInformation', 'U') IS NOT NULL
BEGIN
    -- Drop foreign key first
    IF OBJECT_ID('FK_cor_BoardInformation_Community', 'F') IS NOT NULL
        ALTER TABLE dbo.cor_BoardInformation DROP CONSTRAINT FK_cor_BoardInformation_Community;
    
    DROP TABLE dbo.cor_BoardInformation;
    PRINT 'Dropped existing cor_BoardInformation table.';
END
GO

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

-- Create indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_cor_BoardInformation_CommunityID' AND object_id = OBJECT_ID('dbo.cor_BoardInformation'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_cor_BoardInformation_CommunityID 
        ON dbo.cor_BoardInformation(CommunityID);
    PRINT 'Created index IX_cor_BoardInformation_CommunityID.';
END
GO

PRINT 'Created cor_BoardInformation table.';
GO

-- =============================================
-- ADD YOUR UPDATES ABOVE
-- =============================================

PRINT 'One-off table updates completed.';
GO

