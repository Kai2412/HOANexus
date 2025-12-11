# Civitas Rebranding Checklist

**From:** HOA Nexus  
**To:** Civitas  
**Status:** Ready to execute

---

## 📋 Categories

### 🔴 **Critical - User-Facing (Must Update)**

#### Frontend UI Components
- [ ] `frontend/src/components/Login/Login.tsx` (line 52, 63)
  - Logo alt text: "HOA Nexus" → "Civitas"
  - Welcome text: "Welcome to HOA Nexus" → "Welcome to Civitas"
- [ ] `frontend/src/components/Header/Header.tsx` (line 23, 27)
  - Logo alt text: "HOA Nexus Logo" → "Civitas Logo"
  - Header text: "HOA NEXUS" → "CIVITAS"
- [ ] `frontend/index.html` (line 12, 13)
  - Title: "HOA Nexus - Community Management Platform" → "Civitas - Community Management Platform"
  - Meta description: Update to mention Civitas

#### AI System Prompts (User sees AI responses)
- [ ] `backend/src/services/ai/aiService.js` (lines 675, 683, 720)
  - 3 instances: "You are an AI assistant for HOA Nexus" → "You are an AI assistant for Civitas"
- [ ] `backend/src/services/ai/vectorDatabaseService.js` (line 72)
  - Description: "HOA Nexus document embeddings" → "Civitas document embeddings"

#### Configuration Files
- [ ] `frontend/src/config/index.ts` (line 12)
  - App name: `'HOA Nexus'` → `'Civitas'`
- [ ] `backend/src/config/index.js` (line 1, 149)
  - Comment: "HOA Nexus Backend" → "Civitas Backend"
  - Console log: Update branding message

---

### 🟡 **Important - Documentation (Should Update)**

#### Main Documentation
- [ ] `README.md` - Main project README
- [ ] `PROJECT_OVERVIEW.md` - Project overview document
- [ ] `DEPLOYMENT.md` - Deployment guide
- [ ] `THEME_SYSTEM.md` - Theme system docs
- [ ] `PORT_SETUP.md` - Port configuration
- [ ] `OVERLAY_DESIGN.md` - Design system docs
- [ ] `database/documentation/CurrentTableSchema.md` - Database schema docs
- [ ] `database/documentation/DevelopmentGuide.md` - Development guide
- [ ] `database/documentation/Login-System.md` - Login system docs
- [ ] `database/documentation/TICKET_SYSTEM.md` - Ticket system docs
- [ ] `frontend/VALIDATION_PATTERN.md` - Validation pattern docs
- [ ] `backend/AI_SETUP_GUIDE.md` - AI setup guide
- [ ] `backend/OPENAI_API_KEY_SETUP.md` - OpenAI setup guide

#### Code Comments (Type Definitions)
- [ ] `frontend/src/types/*.ts` - All type definition files have comments mentioning "HOA Nexus"
  - `invoice.ts`, `commitmentFees.ts`, `communityFeeVariance.ts`, `feeMaster.ts`, `boardInformation.ts`, `billingInformation.ts`, `managementFee.ts`, `community.ts`, `property.ts`, `api.ts`

#### Service Files
- [ ] `backend/src/utils/logger.js` - Comment header
- [ ] `backend/src/utils/errorHandler.js` - Comment header
- [ ] `frontend/src/services/logger.ts` - Comment header
- [ ] `backend/src/server.js` (lines 108, 209)
  - API message: "HOA Nexus API is running!" → "Civitas API is running!"
  - Startup log: Update branding

---

### 🟢 **Optional - Internal/Technical (Can Update Later)**

#### Package Configuration
- [ ] `backend/package.json` (line 2, 44)
  - Package name: `"hoa-nexus-backend"` → `"civitas-backend"` (or keep as-is for now)
  - Author: `"HOA Nexus Team"` → `"Civitas Team"`
- [ ] `backend/package-lock.json` (line 2, 8)
  - Package name references
- [ ] `fly.toml` (line 6)
  - App name: `'hoa-nexus'` → `'civitas'` (if deploying to Fly.io)

#### Database References
- [ ] `database/scripts/master/create-master-database.sql` (line 2, 190)
  - Comment: "HOA NEXUS - MASTER DATABASE" → "CIVITAS - MASTER DATABASE"
  - Test client name: "HOA Nexus Test Client" → "Civitas Test Client"
- [ ] `database/scripts/master/seed-admin-user.sql` (line 30)
  - Test client name
- [ ] `database/scripts/clients/create-client-database.sql` (line 2)
  - Comment: "HOA NEXUS - CLIENT DATABASE" → "CIVITAS - CLIENT DATABASE"

#### File Paths & Container Names
- [ ] `backend/src/services/ai/documentIndexingService.js` (line 571)
  - Container name: `'hoa-nexus-files'` → `'civitas-files'` (⚠️ **IMPORTANT**: This affects Azure Blob Storage container name - may need migration)
- [ ] `backend/src/config/index.js` (line 114)
  - Default container: `'hoa-nexus-files'` → `'civitas-files'`
- [ ] `backend/src/services/ai/vectorDatabaseService.js` (line 14)
  - Collection name: `'hoa-nexus-documents'` → `'civitas-documents'` (⚠️ **IMPORTANT**: This affects ChromaDB collection - may need migration)

#### Email Addresses
- [ ] `database/scripts/master/README.md` (line 30)
  - Email: `admin@hoanexus.local` → `admin@civitas.local` (or keep as-is for development)
- [ ] `database/scripts/master/seed-admin-user.sql` (line 11, 46, 90)
  - Email references
- [ ] `backend/scripts/seed-admin-user.js` (line 13)
  - Email constant
- [ ] `frontend/src/components/Login/Login.tsx` (line 156)
  - Display email in login form

#### Local Storage Keys
- [ ] `frontend/src/config/index.ts` (lines 35-37)
  - Keys: `'hoa-nexus-selected-community'` → `'civitas-selected-community'`
  - Keys: `'hoa-nexus-theme'` → `'civitas-theme'`
  - Keys: `'hoa-nexus-user-preferences'` → `'civitas-user-preferences'`
- [ ] `frontend/src/context/theme/ThemeContext.tsx` (lines 21, 44, 53)
  - Theme localStorage key references

#### CSS/Comments
- [ ] `frontend/src/index.css` (line 5)
  - Comment: "HOA Nexus Theme Variables" → "Civitas Theme Variables"
- [ ] `frontend/tailwind.config.js` (line 11)
  - Comment: "HOA Nexus Brand Colors" → "Civitas Brand Colors"

#### Scripts
- [ ] `backend/scripts/verify-setup.js` (line 10)
  - Console log: "Verifying HOA Nexus Development Setup" → "Verifying Civitas Development Setup"

#### Shared Files (Legacy?)
- [ ] `shared/constants/enums.js` (lines 1-2)
- [ ] `shared/types/*.js` (lines 1-2)
  - These appear to be legacy/copied content, may not need updating

---

## ⚠️ **Critical Considerations**

### 1. **Azure Blob Storage Container**
- Current: `hoa-nexus-files`
- New: `civitas-files`
- **Action Required**: 
  - Either rename existing container (if possible)
  - Or create new container and migrate files
  - Or keep old name for backward compatibility

### 2. **ChromaDB Collection**
- Current: `hoa-nexus-documents`
- New: `civitas-documents`
- **Action Required**:
  - Either rename collection (if possible)
  - Or create new collection and re-index documents
  - Or keep old name for backward compatibility

### 3. **Local Storage Keys**
- Current: `hoa-nexus-*`
- New: `civitas-*`
- **Action Required**:
  - Users will lose saved preferences (theme, selected community) on first load after rebrand
  - Consider migration script or accept as breaking change

### 4. **Package Names**
- Current: `hoa-nexus-backend`
- New: `civitas-backend` (optional)
- **Action Required**:
  - Only update if you want to publish to npm
  - Otherwise, can keep as-is for internal use

### 5. **Email Addresses**
- Current: `admin@hoanexus.local`
- New: `admin@civitas.local` (optional)
- **Action Required**:
  - Only update if you want to change development email
  - Otherwise, can keep as-is

---

## 🚀 **Execution Plan**

### Phase 1: User-Facing (Immediate)
1. Update AI system prompts
2. Update UI components (Login, Header)
3. Update HTML title/meta
4. Update config files

### Phase 2: Documentation (Next)
1. Update all .md files
2. Update code comments
3. Update service file headers

### Phase 3: Technical (Optional/Later)
1. Decide on container/collection names (keep or migrate)
2. Update package names (if needed)
3. Update email addresses (if needed)
4. Update localStorage keys (with migration consideration)

---

## 📝 **Notes**

- **Logo Files**: Update logo files in `frontend/public/assets/` if needed
  - `hoa-nexus-logo.png` → `civitas-logo.png`
- **Favicon**: Update favicon files if needed
- **Domain**: Check availability for `civitas.com`, `civitas.io`, `civitas.app`
- **Trademark**: Verify "Civitas" is available for your use case

---

## ✅ **Ready to Execute?**

When you're ready, I can:
1. Update all user-facing text first
2. Then update documentation
3. Then handle technical items (with your input on migration strategy)

Let me know when to start!

