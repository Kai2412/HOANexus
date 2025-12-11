# Quick Setup: OpenAI API Key

## 🚀 Quick Steps

### 1. Get Your API Key
1. Go to: **https://platform.openai.com/api-keys**
2. Click **"Create new secret key"**
3. Name it: "HOA Nexus"
4. **Copy the key** (starts with `sk-proj-` or `sk-`)

### 2. Add to .env File
Open `backend/.env` and add:
```env
OPENAI_API_KEY=sk-proj-your-actual-key-here
```

### 3. Restart Backend
Stop and restart your backend server:
```bash
# Stop server (Ctrl+C)
# Then restart:
cd backend
npm run dev
```

### 4. Verify It Works
Check backend logs - you should see:
```
✅ Embedding Service initialized
```

If you see:
```
⚠️ OPENAI_API_KEY not found, Embedding Service disabled
```
Then check:
- Key is in `backend/.env` (not `backend/src/.env`)
- Server was restarted
- No typos in the key

---

## 🧪 Test Indexing

### Via Admin UI (Easiest):
1. Open Admin panel
2. Click **"Admin Automation"**
3. Click **"Index Documents"**
4. Click **"Start Indexing"**

### Via Command Line:
```bash
cd backend
npm run index-documents
```

---

## 💰 Cost Info

- **Model:** `text-embedding-3-small`
- **Cost:** ~$0.02 per 1M tokens
- **Example:** 100 PDFs (20 pages each) ≈ **$0.10**

Very affordable! 🎉

---

## ✅ What Happens When You Index

1. System finds all PDF files
2. Extracts text from each PDF
3. Generates embeddings (vector representations)
4. Stores in ChromaDB for fast search
5. Updates database: `IsIndexed = 1`, `FileHash = ...`

**Files are only indexed once** - system skips already-indexed files automatically!

---

## 🎯 After Indexing

Your PDFs will show:
- **✓ Indexed** (green) = Searchable by AI
- **✗ Error** (red) = Check error message
- **○ Pending** (yellow) = Not yet indexed

Then ask the AI:
- "What does the covenants say about parking?"
- "What are the pet rules in the HOA documents?"

AI will search your documents and answer! 🎉

