# Document Indexing Metadata - Explanation

## File Hash vs Timestamp: What's the Difference?

### **File Hash (SHA-256)**
**What it is:** A cryptographic fingerprint of the file's actual content.

**How it works:**
- Reads the entire file content
- Generates a unique 64-character hex string (e.g., `a3f5b2c1d4e6f7...`)
- **Same content = Same hash** (always)
- **Different content = Different hash** (always)

**Example:**
```
File: "contract.pdf" (100KB)
Hash: a3f5b2c1d4e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2

If you edit the PDF and save it:
File: "contract.pdf" (105KB) - same name, different content
Hash: x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4z3y2x1
```

**Benefits:**
- ✅ **Detects actual content changes** - even if file name/size/timestamp are the same
- ✅ **100% reliable** - mathematically guaranteed to detect changes
- ✅ **Works even if file is renamed** - hash is based on content, not name
- ✅ **Detects partial changes** - any byte change = different hash

**Use case:** "Did the user actually update the PDF content, or just re-upload the same file?"

---

### **Timestamp (ModifiedOn)**
**What it is:** When the file record was last updated in the database.

**How it works:**
- Stores when `ModifiedOn` was set
- Changes when file metadata is updated (name, folder, etc.)
- **Does NOT change** if only the blob storage file changes

**Example:**
```
File uploaded: Jan 1, 2025
ModifiedOn: Jan 1, 2025 10:00 AM

User re-uploads same file (same content, different blob):
ModifiedOn: Jan 5, 2025 2:00 PM  ← Changed!

But content is identical - hash would be the same
```

**Limitations:**
- ❌ **Doesn't detect content changes** - only detects database record updates
- ❌ **Can be misleading** - timestamp changes even if file content is identical
- ❌ **Can miss changes** - if file is updated in blob storage but database isn't updated

**Use case:** "When was this file record last modified in our system?"

---

## Why We Use File Hash (Not Just Timestamp)

### Scenario 1: User Re-uploads Same File
```
Day 1: Upload "contract.pdf" → Hash: abc123, ModifiedOn: Jan 1
Day 5: Re-upload same "contract.pdf" → Hash: abc123 (same!), ModifiedOn: Jan 5

With Hash: ✅ Skip re-indexing (content unchanged)
With Timestamp: ❌ Would re-index unnecessarily (waste time/money)
```

### Scenario 2: User Updates File Content
```
Day 1: Upload "contract.pdf" → Hash: abc123, ModifiedOn: Jan 1
Day 5: Upload updated "contract.pdf" → Hash: xyz789 (different!), ModifiedOn: Jan 5

With Hash: ✅ Detect change, re-index automatically
With Timestamp: ✅ Would also detect (but less reliable)
```

### Scenario 3: File Updated in Blob Storage (Rare Edge Case)
```
Day 1: File uploaded → Hash: abc123, ModifiedOn: Jan 1
Day 5: File replaced in blob storage (database not updated) → Hash: xyz789

With Hash: ✅ Detect change on next indexing run
With Timestamp: ❌ Would miss it (database timestamp unchanged)
```

---

## Our Implementation Strategy

**We use BOTH:**
1. **FileHash** - Primary method for change detection
2. **ModifiedOn** - Secondary check (for UI display, audit trail)

**Indexing Logic:**
```javascript
// Pseudo-code
if (file.IsIndexed == 1) {
    // File was indexed before
    currentHash = calculateFileHash(file);
    
    if (currentHash == file.FileHash) {
        // Content unchanged - skip indexing
        return "SKIP";
    } else {
        // Content changed - re-index
        return "REINDEX";
    }
} else {
    // Never indexed - index it
    return "INDEX";
}
```

---

## Summary

| Feature | File Hash | Timestamp |
|---------|-----------|-----------|
| **Detects content changes** | ✅ Yes | ❌ No |
| **Detects metadata changes** | ❌ No | ✅ Yes |
| **Reliability** | 100% | Variable |
| **Cost** | Small (one-time calculation) | Free (already stored) |
| **Use Case** | Change detection | Audit trail |

**Bottom Line:** Hash is for **"Did the file content actually change?"**, Timestamp is for **"When was this record updated?"**

We use hash as the primary method because we care about **content changes**, not just database updates.

