-- Check indexing status of all PDF files
-- This helps identify why files were skipped during indexing

SELECT 
    f.FileID,
    f.FileName,
    f.MimeType,
    f.IsIndexed,
    f.ForceReindex,
    f.IndexingError,
    f.LastIndexedDate,
    f.FileHash,
    f.ChunkCount,
    c.DisplayName AS CommunityName,
    c.PropertyCode,
    fo.FolderName,
    f.FolderType,
    CASE 
        WHEN f.MimeType != 'application/pdf' THEN 'Not a PDF'
        WHEN f.IsIndexed = 1 AND f.ForceReindex = 0 THEN 'Already indexed'
        WHEN f.IndexingError IS NOT NULL AND f.ForceReindex = 0 THEN 'Previous error'
        WHEN f.IsIndexed = 0 THEN 'Not indexed'
        WHEN f.ForceReindex = 1 THEN 'Force reindex flag set'
        ELSE 'Unknown'
    END AS IndexingStatus,
    CASE 
        WHEN f.MimeType != 'application/pdf' THEN 'Will be skipped - not a PDF'
        WHEN f.IsIndexed = 1 AND f.ForceReindex = 0 THEN 'Will be skipped - already indexed'
        WHEN f.IndexingError IS NOT NULL AND f.ForceReindex = 0 THEN 'Will be skipped - has error (use Reset Failed Files)'
        WHEN f.IsIndexed = 0 THEN 'Will be indexed'
        WHEN f.ForceReindex = 1 THEN 'Will be re-indexed'
        ELSE 'Unknown'
    END AS NextRunAction
FROM cor_Files f
LEFT JOIN cor_Communities c ON f.CommunityID = c.CommunityID
LEFT JOIN cor_Folders fo ON f.FolderID = fo.FolderID
WHERE f.MimeType = 'application/pdf'
    AND f.IsActive = 1
ORDER BY 
    CASE 
        WHEN f.IsIndexed = 0 THEN 1  -- Not indexed first
        WHEN f.ForceReindex = 1 THEN 2  -- Force reindex second
        WHEN f.IsIndexed = 1 THEN 3  -- Already indexed last
    END,
    f.FileName;

