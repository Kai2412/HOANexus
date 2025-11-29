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

-- =============================================
-- Add Notice Requirements Dropdown Group
-- =============================================
IF NOT EXISTS (SELECT 1 FROM dbo.cor_DynamicDropChoices WHERE GroupID = 'notice-requirements')
BEGIN
    INSERT INTO dbo.cor_DynamicDropChoices
        (GroupID, ChoiceValue, DisplayOrder, IsDefault, IsActive, IsSystemManaged, CreatedOn)
    VALUES
        ('notice-requirements', '30 Days', 1, 1, 1, 0, SYSUTCDATETIME()),
        ('notice-requirements', '60 Days', 2, 0, 1, 0, SYSUTCDATETIME()),
        ('notice-requirements', '90 Days', 3, 0, 1, 0, SYSUTCDATETIME());
    PRINT 'Added new dropdown group: notice-requirements';
END
ELSE
BEGIN
    PRINT 'Dropdown group notice-requirements already exists.';
END
GO

-- Example: Adding choices to existing group
-- IF NOT EXISTS (SELECT 1 FROM dbo.cor_DynamicDropChoices WHERE GroupID = 'client-types' AND ChoiceValue = 'New Type')
-- BEGIN
--     INSERT INTO dbo.cor_DynamicDropChoices
--         (GroupID, ChoiceValue, DisplayOrder, IsDefault, IsActive, IsSystemManaged, CreatedOn)
--     VALUES
--         ('client-types', 'New Type', 8, 0, 1, 0, SYSUTCDATETIME());
--     PRINT 'Added new choice to client-types group';
-- END
-- GO

-- Example: Updating existing choice (e.g., change display order or default)
-- UPDATE dbo.cor_DynamicDropChoices
-- SET DisplayOrder = 5,
--     ModifiedOn = SYSUTCDATETIME(),
--     ModifiedBy = NULL -- Set to actual stakeholder ID if needed
-- WHERE GroupID = 'client-types' 
--     AND ChoiceValue = 'Some Value';
-- GO

-- Example: Soft-deleting a choice (set IsActive = 0)
-- UPDATE dbo.cor_DynamicDropChoices
-- SET IsActive = 0,
--     ModifiedOn = SYSUTCDATETIME(),
--     ModifiedBy = NULL
-- WHERE GroupID = 'client-types' 
--     AND ChoiceValue = 'Old Value';
-- GO

-- =============================================
-- ADD YOUR UPDATES ABOVE
-- =============================================

PRINT 'Dynamic dropdown table updates completed.';
GO

