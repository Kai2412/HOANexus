-- =============================================
-- Update CHECK constraint to allow Corporate files to have CommunityID
-- This enables Corporate files (like invoices) to be linked to communities
-- while still appearing in Corporate folder structure
-- =============================================

USE [hoa_nexus_testclient];
GO

-- Drop the existing constraint
IF EXISTS (
    SELECT * FROM sys.check_constraints 
    WHERE name = 'CK_cor_Files_FolderType_CommunityID' 
    AND parent_object_id = OBJECT_ID('dbo.cor_Files')
)
BEGIN
    ALTER TABLE dbo.cor_Files
    DROP CONSTRAINT CK_cor_Files_FolderType_CommunityID;
    
    PRINT 'Dropped existing constraint CK_cor_Files_FolderType_CommunityID';
END
GO

-- Add the updated constraint
-- New rule: Community files MUST have CommunityID, Corporate files CAN have CommunityID (for linking)
ALTER TABLE dbo.cor_Files
ADD CONSTRAINT CK_cor_Files_FolderType_CommunityID 
    CHECK (
        (FolderType = 'Community' AND CommunityID IS NOT NULL) OR
        (FolderType = 'Corporate')
    );
GO

PRINT 'Added updated constraint CK_cor_Files_FolderType_CommunityID';
PRINT '  - Community files: MUST have CommunityID (not null)';
PRINT '  - Corporate files: CAN have CommunityID (nullable, for linked files)';
GO

