-- =============================================
-- Add Document Indexing Metadata to cor_Files
-- =============================================
-- This script adds columns to track PDF document indexing status
-- for the AI document search feature (RAG - Retrieval Augmented Generation)

USE [YourDatabaseName]; -- Replace with your actual database name
GO

-- Check if columns already exist before adding
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.cor_Files') AND name = 'IsIndexed')
BEGIN
    ALTER TABLE dbo.cor_Files
    ADD IsIndexed BIT NOT NULL DEFAULT 0;
    PRINT 'Added IsIndexed column to cor_Files.';
END
ELSE
BEGIN
    PRINT 'IsIndexed column already exists.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.cor_Files') AND name = 'LastIndexedDate')
BEGIN
    ALTER TABLE dbo.cor_Files
    ADD LastIndexedDate DATETIME2 NULL;
    PRINT 'Added LastIndexedDate column to cor_Files.';
END
ELSE
BEGIN
    PRINT 'LastIndexedDate column already exists.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.cor_Files') AND name = 'IndexingVersion')
BEGIN
    ALTER TABLE dbo.cor_Files
    ADD IndexingVersion INT NULL DEFAULT 1;
    PRINT 'Added IndexingVersion column to cor_Files.';
END
ELSE
BEGIN
    PRINT 'IndexingVersion column already exists.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.cor_Files') AND name = 'FileHash')
BEGIN
    ALTER TABLE dbo.cor_Files
    ADD FileHash NVARCHAR(64) NULL; -- SHA-256 hash (64 hex characters)
    PRINT 'Added FileHash column to cor_Files.';
END
ELSE
BEGIN
    PRINT 'FileHash column already exists.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.cor_Files') AND name = 'IndexingError')
BEGIN
    ALTER TABLE dbo.cor_Files
    ADD IndexingError NVARCHAR(MAX) NULL;
    PRINT 'Added IndexingError column to cor_Files.';
END
ELSE
BEGIN
    PRINT 'IndexingError column already exists.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.cor_Files') AND name = 'ChunkCount')
BEGIN
    ALTER TABLE dbo.cor_Files
    ADD ChunkCount INT NULL DEFAULT 0;
    PRINT 'Added ChunkCount column to cor_Files.';
END
ELSE
BEGIN
    PRINT 'ChunkCount column already exists.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.cor_Files') AND name = 'ForceReindex')
BEGIN
    ALTER TABLE dbo.cor_Files
    ADD ForceReindex BIT NOT NULL DEFAULT 0;
    PRINT 'Added ForceReindex column to cor_Files.';
END
ELSE
BEGIN
    PRINT 'ForceReindex column already exists.';
END
GO

-- Create index for faster queries on unindexed files
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_cor_Files_IsIndexed' AND object_id = OBJECT_ID('dbo.cor_Files'))
BEGIN
    CREATE INDEX IX_cor_Files_IsIndexed ON dbo.cor_Files(IsIndexed) 
    WHERE IsIndexed = 0; -- Filtered index for unindexed files only
    PRINT 'Created index IX_cor_Files_IsIndexed.';
END
ELSE
BEGIN
    PRINT 'Index IX_cor_Files_IsIndexed already exists.';
END
GO

-- Create index for FileHash lookups (for change detection)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_cor_Files_FileHash' AND object_id = OBJECT_ID('dbo.cor_Files'))
BEGIN
    CREATE INDEX IX_cor_Files_FileHash ON dbo.cor_Files(FileHash) 
    WHERE FileHash IS NOT NULL;
    PRINT 'Created index IX_cor_Files_FileHash.';
END
ELSE
BEGIN
    PRINT 'Index IX_cor_Files_FileHash already exists.';
END
GO

PRINT '';
PRINT '========================================';
PRINT 'Document indexing columns added successfully!';
PRINT '========================================';
PRINT '';
PRINT 'New columns:';
PRINT '  - IsIndexed: Tracks if file has been indexed (BIT, default 0)';
PRINT '  - LastIndexedDate: When file was last indexed (DATETIME2, nullable)';
PRINT '  - IndexingVersion: Version of indexing logic used (INT, default 1)';
PRINT '  - FileHash: SHA-256 hash of file content for change detection (NVARCHAR(64), nullable)';
PRINT '  - IndexingError: Error message if indexing failed (NVARCHAR(MAX), nullable)';
PRINT '  - ChunkCount: Number of text chunks created during indexing (INT, default 0)';
PRINT '  - ForceReindex: Admin flag to force re-indexing (BIT, default 0)';
PRINT '';
PRINT 'Indexes created:';
PRINT '  - IX_cor_Files_IsIndexed: Fast lookup of unindexed files';
PRINT '  - IX_cor_Files_FileHash: Fast hash comparison for change detection';
PRINT '';
GO

