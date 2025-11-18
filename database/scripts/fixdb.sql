-- =============================================
-- Add ParentChoiceID to cor_DynamicDropChoices
-- This enables hierarchical dropdown relationships
-- (e.g., SubType depends on Type)
-- =============================================
USE hoa_nexus_testclient;
GO

-- Add ParentChoiceID column if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.cor_DynamicDropChoices') 
    AND name = 'ParentChoiceID'
)
BEGIN
    ALTER TABLE dbo.cor_DynamicDropChoices
        ADD ParentChoiceID uniqueidentifier NULL;
    PRINT 'Added ParentChoiceID column to cor_DynamicDropChoices.';
END
ELSE
BEGIN
    PRINT 'ParentChoiceID column already exists in cor_DynamicDropChoices.';
END
GO

-- Add foreign key constraint if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM sys.foreign_keys 
    WHERE name = 'FK_cor_DynamicDropChoices_ParentChoice' 
    AND parent_object_id = OBJECT_ID('dbo.cor_DynamicDropChoices')
)
BEGIN
    ALTER TABLE dbo.cor_DynamicDropChoices
        ADD CONSTRAINT FK_cor_DynamicDropChoices_ParentChoice
        FOREIGN KEY (ParentChoiceID) REFERENCES dbo.cor_DynamicDropChoices(ChoiceID);
    PRINT 'Added foreign key constraint FK_cor_DynamicDropChoices_ParentChoice.';
END
ELSE
BEGIN
    PRINT 'Foreign key constraint FK_cor_DynamicDropChoices_ParentChoice already exists.';
END
GO

-- Add index for performance (filtered index for non-null values)
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'IX_cor_DynamicDropChoices_ParentChoiceID' 
    AND object_id = OBJECT_ID('dbo.cor_DynamicDropChoices')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_cor_DynamicDropChoices_ParentChoiceID
        ON dbo.cor_DynamicDropChoices(ParentChoiceID)
        WHERE ParentChoiceID IS NOT NULL;
    PRINT 'Added index IX_cor_DynamicDropChoices_ParentChoiceID.';
END
ELSE
BEGIN
    PRINT 'Index IX_cor_DynamicDropChoices_ParentChoiceID already exists.';
END
GO

-- Add IsSystemManaged column if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.cor_DynamicDropChoices') 
    AND name = 'IsSystemManaged'
)
BEGIN
    ALTER TABLE dbo.cor_DynamicDropChoices
        ADD IsSystemManaged bit NOT NULL DEFAULT 0;
    PRINT 'Added IsSystemManaged column to cor_DynamicDropChoices.';
END
ELSE
BEGIN
    PRINT 'IsSystemManaged column already exists in cor_DynamicDropChoices.';
END
GO

PRINT '=============================================';
PRINT 'Updated cor_DynamicDropChoices table!';
PRINT 'Added ParentChoiceID column for hierarchical relationships.';
PRINT 'Added IsSystemManaged column for system-controlled choices.';
PRINT '=============================================';
GO

