# AI Document Indexing Setup Guide

## Overview
This guide will help you set up the AI document indexing feature, which allows the AI assistant to search and answer questions from your uploaded PDF documents.

## Prerequisites
- ✅ Database columns added (already done via `add-document-indexing-columns.sql`)
- ✅ Backend code updated (already done)
- ✅ Frontend UI updated (already done)
- ⏳ OpenAI API key (need to get this)

---

## Step 1: Get OpenAI API Key

### 1.1 Create OpenAI Account
1. Go to [https://platform.openai.com](https://platform.openai.com)
2. Sign up or log in to your account

### 1.2 Create API Key
1. Once logged in, go to: **API Keys** section
   - Click your profile icon (top right)
   - Select **"API keys"** from the menu
   - Or go directly to: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)

2. Click **"Create new secret key"**
   - Give it a name (e.g., "HOA Nexus Document Indexing")
   - Click **"Create secret key"**
   - **⚠️ IMPORTANT:** Copy the key immediately - you won't be able to see it again!
   - It will look like: `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 1.3 Add to Environment Variables
1. Open your `backend/.env` file
2. Add the following line:
   ```env
   OPENAI_API_KEY=sk-proj-your-actual-key-here
   ```
3. **Save the file**
4. **Restart your backend server** for the change to take effect

---

## Step 2: Verify Setup

### 2.1 Check Backend Logs
When you restart your backend server, you should see:
```
✅ Embedding Service initialized
```

If you see:
```
⚠️ OPENAI_API_KEY not found, Embedding Service disabled
```
Then the API key wasn't loaded correctly. Check:
- Is the key in `backend/.env` (not `backend/src/.env`)?
- Did you restart the server?
- Is there a typo in the key?

### 2.2 Test the Indexing Script
You can test the indexing in two ways:

#### Option A: Via Admin UI (Recommended)
1. Open the Admin panel
2. Go to **"Admin Automation"**
3. Click **"Index Documents"**
4. Click **"Start Indexing"**
5. Watch the progress and results

#### Option B: Via Command Line
```bash
cd backend
npm run index-documents
```

---

## Step 3: Index Your Documents

### 3.1 Upload PDFs
1. Upload PDF files through:
   - **Corporate Files** (for organization-wide documents)
   - **Community Files** (for community-specific documents)

2. Files will show **"○ Pending"** badge until indexed

### 3.2 Run Indexing
1. Go to **Admin → Admin Automation**
2. Click **"Index Documents"**
3. Click **"Start Indexing"**

The system will:
- ✅ Find all PDF files that haven't been indexed
- ✅ Extract text from each PDF
- ✅ Generate embeddings (vector representations)
- ✅ Store in ChromaDB for fast searching
- ✅ Update database with indexing status

### 3.3 Check Results
After indexing:
- **✓ Indexed** (green badge) = Successfully indexed, searchable by AI
- **✗ Error** (red badge) = Indexing failed (check error message)
- **○ Pending** (yellow badge) = Not yet indexed

---

## Step 4: Test AI Document Search

### 4.1 Ask Questions About Documents
Once documents are indexed, you can ask the AI assistant questions like:
- "What does the covenants document say about parking?"
- "What are the rules about pets in the HOA documents?"
- "What does the bylaws say about board meetings?"

The AI will:
1. Search your indexed documents
2. Find relevant sections
3. Answer based on the document content

---

## Troubleshooting

### Issue: "Embedding Service disabled"
**Solution:** Check that `OPENAI_API_KEY` is set in `backend/.env` and server is restarted.

### Issue: "Failed to generate embeddings"
**Possible causes:**
- Invalid API key
- API key doesn't have access to embeddings API
- Rate limit exceeded (wait a few minutes)
- Network connectivity issue

**Solution:** 
- Verify API key is correct
- Check OpenAI account has credits/billing set up
- Check network connection

### Issue: "Indexing failed" for specific files
**Possible causes:**
- PDF is corrupted or password-protected
- PDF contains only images (no extractable text)
- File is too large

**Solution:**
- Check the error message in the Admin Automation results
- Try re-uploading the file
- Check file size (should be under 30MB)

### Issue: Files show "Pending" after indexing
**Possible causes:**
- Indexing is still in progress
- Indexing failed silently

**Solution:**
- Wait a few moments and refresh
- Check backend logs for errors
- Try running indexing again (it will skip already-indexed files)

---

## Cost Information

### OpenAI Embeddings Pricing
- **Model:** `text-embedding-3-small`
- **Cost:** ~$0.02 per 1M tokens
- **Typical usage:**
  - Small PDF (10 pages): ~$0.0001
  - Medium PDF (50 pages): ~$0.0005
  - Large PDF (200 pages): ~$0.002

**Example:** Indexing 100 PDFs (average 20 pages each) ≈ **$0.10**

### Tips to Minimize Costs
- Only index PDFs you actually want to search
- The system automatically skips already-indexed files
- Failed files won't be retried automatically (saves costs)

---

## Next Steps

Once indexing is working:
1. ✅ Upload your PDF documents
2. ✅ Run indexing via Admin Automation
3. ✅ Test AI document search
4. ✅ Files will automatically show indexing status
5. ✅ AI can now answer questions from your documents!

---

## Support

If you encounter issues:
1. Check backend logs for error messages
2. Verify API key is correct
3. Check OpenAI account has credits
4. Review error messages in Admin Automation results

