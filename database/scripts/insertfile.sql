-- =============================================
-- INSERT DATA FOR NEW TABLES
-- =============================================
-- This file is used for inserting seed/test data into new tables
-- as we create them. Use this to populate data for testing.
--
-- WORKFLOW:
-- 1. Add your INSERT statements here
-- 2. Test in development
-- 3. Periodically update create-client-database.sql or create separate seed files
-- 4. Clear this file after data is stable
-- =============================================

USE hoa_nexus_testclient;
GO

-- =============================================
-- Insert Billing Information for Existing Communities
-- =============================================
-- Each community gets one billing information record
-- Only insert if the community doesn't already have billing information
-- =============================================

-- Get the BillingFrequencyID for 'Monthly' (default)
DECLARE @MonthlyBillingFrequencyID uniqueidentifier;
SELECT @MonthlyBillingFrequencyID = ChoiceID 
FROM dbo.cor_DynamicDropChoices 
WHERE GroupID = 'billing-frequency' AND ChoiceValue = 'Monthly' AND IsActive = 1;

-- Insert billing information for all communities that don't have one yet
INSERT INTO dbo.cor_BillingInformation (
    BillingInformationID,
    CommunityID,
    BillingFrequencyID,
    BillingMonth,
    BillingDay,
    NoticeRequirementID,
    Coupon,
    CreatedOn,
    IsActive
)
SELECT 
    NEWID() AS BillingInformationID,
    c.CommunityID,
    -- BillingFrequencyID: Random selection from available frequencies
    (SELECT TOP 1 ChoiceID 
     FROM dbo.cor_DynamicDropChoices 
     WHERE GroupID = 'billing-frequency' 
     AND IsActive = 1 
     ORDER BY NEWID()) AS BillingFrequencyID,
    -- BillingMonth: Heavily weighted towards January (1) or December (12), with chance for other months
    CASE (ABS(CHECKSUM(NEWID())) % 10)
        WHEN 0 THEN 1  -- January (30%)
        WHEN 1 THEN 1  -- January
        WHEN 2 THEN 1  -- January
        WHEN 3 THEN 12 -- December (30%)
        WHEN 4 THEN 12 -- December
        WHEN 5 THEN 12 -- December
        ELSE 1 + (ABS(CHECKSUM(NEWID())) % 12) -- Other months (40%)
    END AS BillingMonth,
    -- BillingDay: 1st, 15th, or 30th with chance to be random day
    CASE (ABS(CHECKSUM(NEWID())) % 10)
        WHEN 0 THEN 1   -- 1st (30%)
        WHEN 1 THEN 1   -- 1st
        WHEN 2 THEN 1   -- 1st
        WHEN 3 THEN 15  -- 15th (30%)
        WHEN 4 THEN 15  -- 15th
        WHEN 5 THEN 15  -- 15th
        WHEN 6 THEN 30  -- 30th (20%)
        WHEN 7 THEN 30  -- 30th
        ELSE 1 + (ABS(CHECKSUM(NEWID())) % 28) -- Random day 1-28 (20%)
    END AS BillingDay,
    -- NoticeRequirementID: Random selection from one of the 3 notice requirements (30, 60, 90 Days)
    (SELECT TOP 1 ChoiceID 
     FROM dbo.cor_DynamicDropChoices 
     WHERE GroupID = 'notice-requirements' 
     AND IsActive = 1 
     ORDER BY NEWID()) AS NoticeRequirementID,
    -- Coupon: 30% chance of true
    CASE WHEN (ABS(CHECKSUM(NEWID())) % 10) < 3 THEN 1 ELSE 0 END AS Coupon,
    SYSUTCDATETIME() AS CreatedOn,
    1 AS IsActive
FROM dbo.cor_Communities c
WHERE 
    -- Only insert if community doesn't already have billing information
    NOT EXISTS (
        SELECT 1 
        FROM dbo.cor_BillingInformation bi 
        WHERE bi.CommunityID = c.CommunityID 
        AND bi.IsActive = 1
    );
GO

PRINT 'Inserted billing information for ' + CAST(@@ROWCOUNT AS varchar(10)) + ' communities.';
GO

-- =============================================
-- Insert Board Information for Existing Communities
-- =============================================
-- Each community gets one board information record
-- Only insert if the community doesn't already have board information
-- =============================================

INSERT INTO dbo.cor_BoardInformation (
    BoardInformationID,
    CommunityID,
    AnnualMeetingFrequency,
    RegularMeetingFrequency,
    BoardMembersRequired,
    Quorum,
    TermLimits,
    CreatedOn,
    IsActive
)
SELECT 
    NEWID() AS BoardInformationID,
    c.CommunityID,
    -- AnnualMeetingFrequency: Random selection from common frequencies
    CASE (ABS(CHECKSUM(NEWID())) % 5)
        WHEN 0 THEN 'Annual'
        WHEN 1 THEN 'Bi-Annual'
        WHEN 2 THEN 'Quarterly'
        WHEN 3 THEN 'As Needed'
        ELSE 'Annual'
    END AS AnnualMeetingFrequency,
    -- RegularMeetingFrequency: Random selection from common frequencies
    CASE (ABS(CHECKSUM(NEWID())) % 6)
        WHEN 0 THEN 'Monthly'
        WHEN 1 THEN 'Bi-Monthly'
        WHEN 2 THEN 'Quarterly'
        WHEN 3 THEN 'Semi-Annual'
        WHEN 4 THEN 'As Needed'
        ELSE 'Monthly'
    END AS RegularMeetingFrequency,
    -- BoardMembersRequired: Random between 3 and 7
    3 + (ABS(CHECKSUM(NEWID())) % 5) AS BoardMembersRequired,
    -- Quorum: Random between 2 and 5 (typically less than BoardMembersRequired)
    2 + (ABS(CHECKSUM(NEWID())) % 4) AS Quorum,
    -- TermLimits: Random selection from common term limits
    CASE (ABS(CHECKSUM(NEWID())) % 4)
        WHEN 0 THEN '2 Years'
        WHEN 1 THEN '3 Years'
        WHEN 2 THEN 'No Term Limits'
        ELSE '2 Years'
    END AS TermLimits,
    SYSUTCDATETIME() AS CreatedOn,
    1 AS IsActive
FROM dbo.cor_Communities c
WHERE 
    -- Only insert if community doesn't already have board information
    NOT EXISTS (
        SELECT 1 
        FROM dbo.cor_BoardInformation bi 
        WHERE bi.CommunityID = c.CommunityID 
        AND bi.IsActive = 1
    );
GO

PRINT 'Inserted board information for ' + CAST(@@ROWCOUNT AS varchar(10)) + ' communities.';
GO

-- =============================================
-- ADD YOUR INSERT STATEMENTS ABOVE
-- =============================================

PRINT 'Data insertion completed.';
GO

