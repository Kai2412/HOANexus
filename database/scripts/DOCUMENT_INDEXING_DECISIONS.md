# Document Indexing - Design Decisions

## Questions & Answers

### 1. Database Approach
**Decision:** ✅ **Add columns to `cor_Files` table**

**Reasoning:**
- Indexing status is file metadata
- Simpler queries (no joins needed)
- All file information in one place
- Easier to maintain

---

### 2. File Change Detection
**Decision:** ✅ **Use File Hash (SHA-256)**

**What is File Hash?**
- A cryptographic fingerprint of the file's actual content
- Same content = same hash (always)
- Different content = different hash (always)
- 64-character hex string (e.g., `a3f5b2c1d4e6f7...`)

**Why Hash vs Timestamp?**
- **Hash** detects actual content changes (reliable, 100% accurate)
- **Timestamp** only detects database record updates (can be misleading)

**Example:**
```
User re-uploads same PDF file:
- Hash: Same → Skip re-indexing ✅
- Timestamp: Different → Would re-index unnecessarily ❌
```

**See `DOCUMENT_INDEXING_EXPLANATION.md` for detailed comparison.**

---

### 3. Re-indexing Strategy
**Decision:** ✅ **Manual re-indexing for now**

**Reasoning:**
- Files are not reused/overwritten in the table
- Each upload creates a new file record
- No need for automatic change detection initially

**Future Consideration:**
- If we add file editing/replacement feature, we'll use `FileHash` to auto-detect changes
- For now, manual indexing is sufficient

**Implementation:**
- Indexing script only processes files where `IsIndexed = 0`
- Admin can set `ForceReindex = 1` to manually trigger re-indexing

---

### 4. UI Status Display
**Decision:** ✅ **Show indexing status in file browser**

**What to Display:**
- ✅ **"Indexed"** badge/icon for indexed files
- ⚠️ **"Not Indexed"** for unindexed PDFs
- ❌ **"Indexing Failed"** if `IndexingError` is set
- 🔄 **"Re-indexing"** during active indexing

**Where:**
- File browser (Corporate Files & Community Files)
- Next to file name or in file details modal
- Color-coded badges for quick visual identification

**Benefits:**
- Users can see which documents are searchable
- Admins can identify files that need indexing
- Clear feedback on indexing status

---

### 5. Error Handling
**Decision:** ✅ **Mark as failed and skip on next run**

**Strategy:**
- If indexing fails, set:
  - `IsIndexed = 0` (or keep as 0)
  - `IndexingError = "Error message here"`
  - `LastIndexedDate = NULL` (or keep previous attempt date)
- On next run, skip files with `IndexingError` set (unless `ForceReindex = 1`)

**Why:**
- Prevents infinite retry loops
- Saves API costs on broken files
- Allows admin to investigate and fix issues manually
- Admin can set `ForceReindex = 1` to retry after fixing

**Future Enhancement:**
- Add retry count (max 3 attempts)
- Auto-retry transient errors (network issues)
- Skip permanent errors (corrupted PDFs)

---

## Implementation Summary

### SQL Migration
**File:** `add-document-indexing-columns.sql`

**Columns Added:**
- `IsIndexed` (BIT) - Has file been indexed?
- `LastIndexedDate` (DATETIME2) - When was it indexed?
- `IndexingVersion` (INT) - Which indexing logic version?
- `FileHash` (NVARCHAR(64)) - SHA-256 hash for change detection
- `IndexingError` (NVARCHAR(MAX)) - Error message if failed
- `ChunkCount` (INT) - Number of text chunks created
- `ForceReindex` (BIT) - Admin flag to force re-indexing

**Indexes Created:**
- `IX_cor_Files_IsIndexed` - Fast lookup of unindexed files
- `IX_cor_Files_FileHash` - Fast hash comparison

### Indexing Logic Flow
```
1. Query files WHERE IsIndexed = 0 AND MimeType = 'application/pdf'
2. For each file:
   a. Check if IndexingError exists → Skip (unless ForceReindex = 1)
   b. Calculate current FileHash
   c. If FileHash matches existing → Skip (content unchanged)
   d. If FileHash differs or NULL → Index the file
   e. Update: IsIndexed = 1, LastIndexedDate = NOW(), FileHash = newHash
   f. Clear IndexingError on success
```

### Next Steps
1. ✅ Run SQL migration script
2. ⏳ Update `documentIndexingService.js` to use new columns
3. ⏳ Add file hash calculation
4. ⏳ Update UI to show indexing status
5. ⏳ Add "Re-index" button for admins

---

## Notes

- **History Tracking:** If needed later, create separate `cor_DocumentIndexHistory` table to track each indexing run
- **Cost Tracking:** Can add `IndexingCost` column later to track API usage per file
- **Batch Tracking:** Can add `IndexingBatchID` to group files indexed in same run

