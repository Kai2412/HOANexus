-- =============================================
-- DYNAMIC DROPDOWN TABLE UPDATES
-- =============================================
-- This file is used for:
-- 1. Adding new dropdown groups to cor_DynamicDropChoices
-- 2. Adding new choices to existing groups
-- 3. Updating existing choices (values, display order, defaults)
-- 4. Marking choices as system-managed
--
-- WORKFLOW:
-- 1. Add your dropdown updates here
-- 2. Test it in development
-- 3. Periodically update create-client-database.sql to include these changes
-- 4. Clear this file after changes are merged into create-client-database.sql
--
-- NOTE: This file is meant to be temporary - changes should eventually
-- be merged into the main create-client-database.sql script.
-- =============================================

USE hoa_nexus_testclient;
GO

-- Verify we're in the correct database
IF DB_NAME() != 'hoa_nexus_testclient'
BEGIN
    PRINT 'ERROR: Not in hoa_nexus_testclient database. Current database: ' + DB_NAME();
    RETURN;
END
GO

-- Verify table exists
IF OBJECT_ID('dbo.cor_DynamicDropChoices', 'U') IS NULL
BEGIN
    PRINT 'ERROR: Table dbo.cor_DynamicDropChoices does not exist in database ' + DB_NAME();
    PRINT 'Please run create-client-database.sql first to create the base tables.';
    RETURN;
END
GO

-- =============================================
-- ADD YOUR DROPDOWN UPDATES BELOW
-- =============================================

PRINT 'Dynamic dropdown table updates completed.';
GO
