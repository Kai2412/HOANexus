-- =============================================
-- Insert Stakeholder Dropdown Choices
-- =============================================
-- This script inserts all default stakeholder dropdown choices
-- Types and AccessLevels are system-managed (immutable)
-- SubTypes are editable (customizable)
-- =============================================

USE hoa_nexus_testclient;
GO

-- Only insert if table is empty (avoid duplicates)
IF NOT EXISTS (SELECT 1 FROM dbo.cor_DynamicDropChoices WHERE TableName = 'cor_Stakeholders')
BEGIN
    PRINT 'Inserting stakeholder dropdown choices...';
    
    -- Declare variables to store Type ChoiceIDs
    DECLARE @ResidentTypeID uniqueidentifier;
    DECLARE @StaffTypeID uniqueidentifier;
    DECLARE @VendorTypeID uniqueidentifier;
    DECLARE @OtherTypeID uniqueidentifier;
    
    -- Declare variables to store AccessLevel ChoiceIDs
    DECLARE @ViewAccessLevelID uniqueidentifier;
    DECLARE @ViewWriteAccessLevelID uniqueidentifier;
    DECLARE @ViewWriteDeleteAccessLevelID uniqueidentifier;
    
    -- =============================================
    -- Step 1: Insert Types (System-Managed)
    -- =============================================
    SET @ResidentTypeID = NEWID();
    INSERT INTO dbo.cor_DynamicDropChoices (ChoiceID, TableName, ColumnName, ChoiceValue, DisplayOrder, IsDefault, IsActive, IsSystemManaged, CreatedOn)
    VALUES (@ResidentTypeID, 'cor_Stakeholders', 'Type', 'Resident', 1, 1, 1, 1, SYSUTCDATETIME());
    
    SET @StaffTypeID = NEWID();
    INSERT INTO dbo.cor_DynamicDropChoices (ChoiceID, TableName, ColumnName, ChoiceValue, DisplayOrder, IsDefault, IsActive, IsSystemManaged, CreatedOn)
    VALUES (@StaffTypeID, 'cor_Stakeholders', 'Type', 'Staff', 2, 0, 1, 1, SYSUTCDATETIME());
    
    SET @VendorTypeID = NEWID();
    INSERT INTO dbo.cor_DynamicDropChoices (ChoiceID, TableName, ColumnName, ChoiceValue, DisplayOrder, IsDefault, IsActive, IsSystemManaged, CreatedOn)
    VALUES (@VendorTypeID, 'cor_Stakeholders', 'Type', 'Vendor', 3, 0, 1, 1, SYSUTCDATETIME());
    
    SET @OtherTypeID = NEWID();
    INSERT INTO dbo.cor_DynamicDropChoices (ChoiceID, TableName, ColumnName, ChoiceValue, DisplayOrder, IsDefault, IsActive, IsSystemManaged, CreatedOn)
    VALUES (@OtherTypeID, 'cor_Stakeholders', 'Type', 'Other', 4, 0, 1, 1, SYSUTCDATETIME());
    
    PRINT '   ✅ Inserted Types (Resident, Staff, Vendor, Other)';
    
    -- =============================================
    -- Step 2: Insert AccessLevels (System-Managed)
    -- =============================================
    SET @ViewAccessLevelID = NEWID();
    INSERT INTO dbo.cor_DynamicDropChoices (ChoiceID, TableName, ColumnName, ChoiceValue, DisplayOrder, IsDefault, IsActive, IsSystemManaged, CreatedOn)
    VALUES (@ViewAccessLevelID, 'cor_Stakeholders', 'AccessLevel', 'View', 1, 0, 1, 1, SYSUTCDATETIME());
    
    SET @ViewWriteAccessLevelID = NEWID();
    INSERT INTO dbo.cor_DynamicDropChoices (ChoiceID, TableName, ColumnName, ChoiceValue, DisplayOrder, IsDefault, IsActive, IsSystemManaged, CreatedOn)
    VALUES (@ViewWriteAccessLevelID, 'cor_Stakeholders', 'AccessLevel', 'View+Write', 2, 0, 1, 1, SYSUTCDATETIME());
    
    SET @ViewWriteDeleteAccessLevelID = NEWID();
    INSERT INTO dbo.cor_DynamicDropChoices (ChoiceID, TableName, ColumnName, ChoiceValue, DisplayOrder, IsDefault, IsActive, IsSystemManaged, CreatedOn)
    VALUES (@ViewWriteDeleteAccessLevelID, 'cor_Stakeholders', 'AccessLevel', 'View+Write+Delete', 3, 1, 1, 1, SYSUTCDATETIME());
    
    PRINT '   ✅ Inserted AccessLevels (View, View+Write, View+Write+Delete)';
    
    -- =============================================
    -- Step 3: Insert SubTypes (Editable - defaults only)
    -- =============================================
    
    -- Resident SubTypes
    INSERT INTO dbo.cor_DynamicDropChoices (ChoiceID, TableName, ColumnName, ChoiceValue, DisplayOrder, IsDefault, IsActive, IsSystemManaged, ParentChoiceID, CreatedOn)
    VALUES
        (NEWID(), 'cor_Stakeholders', 'SubType', 'Owner', 1, 1, 1, 0, @ResidentTypeID, SYSUTCDATETIME()),
        (NEWID(), 'cor_Stakeholders', 'SubType', 'Family Member', 2, 0, 1, 0, @ResidentTypeID, SYSUTCDATETIME()),
        (NEWID(), 'cor_Stakeholders', 'SubType', 'Guest', 3, 0, 1, 0, @ResidentTypeID, SYSUTCDATETIME());
    
    PRINT '   ✅ Inserted Resident SubTypes (Owner, Family Member, Guest)';
    
    -- Staff SubTypes (Departments - editable)
    INSERT INTO dbo.cor_DynamicDropChoices (ChoiceID, TableName, ColumnName, ChoiceValue, DisplayOrder, IsDefault, IsActive, IsSystemManaged, ParentChoiceID, CreatedOn)
    VALUES
        (NEWID(), 'cor_Stakeholders', 'SubType', 'Community Management', 1, 0, 1, 0, @StaffTypeID, SYSUTCDATETIME()),
        (NEWID(), 'cor_Stakeholders', 'SubType', 'Accounting', 2, 0, 1, 0, @StaffTypeID, SYSUTCDATETIME()),
        (NEWID(), 'cor_Stakeholders', 'SubType', 'IT', 3, 0, 1, 0, @StaffTypeID, SYSUTCDATETIME()),
        (NEWID(), 'cor_Stakeholders', 'SubType', 'Maintenance', 4, 0, 1, 0, @StaffTypeID, SYSUTCDATETIME()),
        (NEWID(), 'cor_Stakeholders', 'SubType', 'Customer Service', 5, 0, 1, 0, @StaffTypeID, SYSUTCDATETIME()),
        (NEWID(), 'cor_Stakeholders', 'SubType', 'Executive', 6, 0, 1, 0, @StaffTypeID, SYSUTCDATETIME());
    
    PRINT '   ✅ Inserted Staff SubTypes (Departments - editable)';
    
    -- Vendor SubTypes
    INSERT INTO dbo.cor_DynamicDropChoices (ChoiceID, TableName, ColumnName, ChoiceValue, DisplayOrder, IsDefault, IsActive, IsSystemManaged, ParentChoiceID, CreatedOn)
    VALUES
        (NEWID(), 'cor_Stakeholders', 'SubType', 'Contractors', 1, 0, 1, 0, @VendorTypeID, SYSUTCDATETIME()),
        (NEWID(), 'cor_Stakeholders', 'SubType', 'Service Providers', 2, 0, 1, 0, @VendorTypeID, SYSUTCDATETIME()),
        (NEWID(), 'cor_Stakeholders', 'SubType', 'Suppliers', 3, 0, 1, 0, @VendorTypeID, SYSUTCDATETIME());
    
    PRINT '   ✅ Inserted Vendor SubTypes (Contractors, Service Providers, Suppliers)';
    
    -- Other has no SubTypes (empty)
    
    -- =============================================
    -- Step 4: Insert Other Dropdown Choices
    -- =============================================
    
    -- PreferredContactMethod
    INSERT INTO dbo.cor_DynamicDropChoices (ChoiceID, TableName, ColumnName, ChoiceValue, DisplayOrder, IsDefault, IsActive, IsSystemManaged, CreatedOn)
    VALUES
        (NEWID(), 'cor_Stakeholders', 'PreferredContactMethod', 'Email', 1, 1, 1, 0, SYSUTCDATETIME()),
        (NEWID(), 'cor_Stakeholders', 'PreferredContactMethod', 'Phone', 2, 0, 1, 0, SYSUTCDATETIME()),
        (NEWID(), 'cor_Stakeholders', 'PreferredContactMethod', 'Mobile', 3, 0, 1, 0, SYSUTCDATETIME()),
        (NEWID(), 'cor_Stakeholders', 'PreferredContactMethod', 'Text', 4, 0, 1, 0, SYSUTCDATETIME()),
        (NEWID(), 'cor_Stakeholders', 'PreferredContactMethod', 'Mail', 5, 0, 1, 0, SYSUTCDATETIME());
    
    PRINT '   ✅ Inserted PreferredContactMethod choices';
    
    -- Status
    INSERT INTO dbo.cor_DynamicDropChoices (ChoiceID, TableName, ColumnName, ChoiceValue, DisplayOrder, IsDefault, IsActive, IsSystemManaged, CreatedOn)
    VALUES
        (NEWID(), 'cor_Stakeholders', 'Status', 'Active', 1, 1, 1, 0, SYSUTCDATETIME()),
        (NEWID(), 'cor_Stakeholders', 'Status', 'Inactive', 2, 0, 1, 0, SYSUTCDATETIME()),
        (NEWID(), 'cor_Stakeholders', 'Status', 'Pending', 3, 0, 1, 0, SYSUTCDATETIME()),
        (NEWID(), 'cor_Stakeholders', 'Status', 'Suspended', 4, 0, 1, 0, SYSUTCDATETIME());
    
    PRINT '   ✅ Inserted Status choices';
    
    PRINT '=============================================';
    PRINT 'Stakeholder dropdown choices inserted successfully!';
    PRINT '=============================================';
END
ELSE
BEGIN
    PRINT 'Stakeholder dropdown choices already exist. Skipping insertion.';
END
GO

