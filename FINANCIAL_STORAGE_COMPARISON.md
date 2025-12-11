# Financial Data Storage: Database Table vs JSON Files

## Comparison

### Option A: Database Table (`cor_FinancialData`)

**Pros:**
- ✅ **Queryable with SQL** - Easy aggregations, trends, comparisons
- ✅ **Indexed for performance** - Fast queries even with many months
- ✅ **Fits existing architecture** - Consistent with other data
- ✅ **Can join with communities** - Link to `cor_Communities` table
- ✅ **Easy to query from AI functions** - Simple SQL queries
- ✅ **Built-in relationships** - Foreign keys, constraints
- ✅ **Scalable** - Handles thousands of records efficiently
- ✅ **Transaction support** - Data integrity guarantees

**Cons:**
- ❌ Need to create table (one-time setup)
- ❌ Schema changes require migrations
- ❌ Slightly more complex initial setup

**Storage Location:**
- SQL Server database (`hoa_nexus_testclient`)
- Same database as all other data

---

### Option B: JSON Files

**Pros:**
- ✅ **Simple** - No schema, no migrations
- ✅ **Flexible** - Easy to change structure
- ✅ **Human-readable** - Can open and inspect
- ✅ **No database changes** - Works immediately

**Cons:**
- ❌ **Not queryable** - Can't do SQL aggregations
- ❌ **No indexes** - Must load all files to aggregate
- ❌ **Performance issues** - Loading 12+ months = slow
- ❌ **Hard to do trends** - Need custom code for comparisons
- ❌ **No relationships** - Can't easily join with communities
- ❌ **File management** - Need to handle file I/O, errors
- ❌ **Concurrency issues** - Multiple processes writing files

**Storage Location Options:**
1. `backend/data/financials/{communityId}/{year}/{month}.json`
2. `backend/data/financials/{communityId}-{year}-{month}.json`
3. Blob storage (Azure/Azurite) - same as PDFs

**Example Structure:**
```
backend/
  data/
    financials/
      ACRF-GUID/
        2025/
          01.json
          02.json
          ...
        2026/
          ...
```

---

## Recommendation: **Database Table**

For financial analysis, we need:
- **Aggregations**: "Total YTD expenses", "Average monthly income"
- **Trends**: "Compare October vs September", "Year-over-year growth"
- **Comparisons**: "Which months had highest expenses?"
- **Budget calculations**: "Project annual from YTD"

**These are SQL operations** - database table is the right choice.

---

## Database Table Design

### Table: `cor_FinancialData`

```sql
CREATE TABLE dbo.cor_FinancialData (
    FinancialDataID uniqueidentifier NOT NULL 
        CONSTRAINT PK_cor_FinancialData PRIMARY KEY DEFAULT NEWID(),
    CommunityID uniqueidentifier NOT NULL,
    FileID uniqueidentifier NULL, -- Link to source PDF
    StatementDate date NOT NULL, -- Date from statement (e.g., 2025-10-31)
    StatementMonth int NOT NULL, -- 1-12
    StatementYear int NOT NULL, -- 2025, 2026, etc.
    
    -- Income Data (stored as JSON for flexibility)
    IncomeData nvarchar(MAX) NULL, -- JSON: assessments by community, interest, etc.
    
    -- Expense Data (stored as JSON for flexibility)
    ExpenseData nvarchar(MAX) NULL, -- JSON: categories and amounts
    
    -- Balance Sheet Data (stored as JSON)
    BalanceSheetData nvarchar(MAX) NULL, -- JSON: assets, liabilities, equity
    
    -- Aggregated Totals (for fast queries)
    TotalIncome decimal(12,2) NULL,
    TotalExpenses decimal(12,2) NULL,
    NetIncome decimal(12,2) NULL, -- Income - Expenses
    YTDIncome decimal(12,2) NULL,
    YTDExpenses decimal(12,2) NULL,
    YTDNetIncome decimal(12,2) NULL,
    
    -- Assessment Data
    AssessmentIncome decimal(12,2) NULL,
    AssessmentCollected decimal(12,2) NULL,
    CollectionRate decimal(5,4) NULL, -- 0.9600 = 96%
    
    -- Extraction Metadata
    ExtractedOn datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ExtractionVersion int NULL DEFAULT 1,
    ExtractionError nvarchar(MAX) NULL,
    
    -- Audit
    CreatedOn datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy uniqueidentifier NULL,
    ModifiedOn datetime2 NULL,
    ModifiedBy uniqueidentifier NULL,
    IsActive bit NOT NULL DEFAULT 1,
    
    CONSTRAINT FK_cor_FinancialData_Community 
        FOREIGN KEY (CommunityID) 
        REFERENCES dbo.cor_Communities(CommunityID),
    CONSTRAINT FK_cor_FinancialData_File 
        FOREIGN KEY (FileID) 
        REFERENCES dbo.cor_Files(FileID),
    CONSTRAINT CK_cor_FinancialData_Month CHECK (StatementMonth >= 1 AND StatementMonth <= 12)
);

-- Indexes for performance
CREATE INDEX IX_cor_FinancialData_CommunityID ON dbo.cor_FinancialData(CommunityID);
CREATE INDEX IX_cor_FinancialData_Date ON dbo.cor_FinancialData(StatementYear, StatementMonth);
CREATE INDEX IX_cor_FinancialData_FileID ON dbo.cor_FinancialData(FileID) WHERE FileID IS NOT NULL;
```

### JSON Structure Examples

**IncomeData JSON:**
```json
{
  "assessments": {
    "total": 40819.85,
    "byCommunity": {
      "Cap Rock": 3043.95,
      "Fairways": 4899.50,
      "Grand Mesa": 22045.40,
      "Taylor Morrison": 5334.50,
      "Cap Rock Estates": 1651.50,
      "Cottages @ CRF": 1425.00,
      "The Views": 447.00,
      "Wildrock": 2000.00
    }
  },
  "interestIncome": 7047.84,
  "lateFees": 0.00,
  "violationFines": -27.00,
  "total": 47840.69
}
```

**ExpenseData JSON:**
```json
{
  "generalAdmin": {
    "socialCommittee": 0.00,
    "total": 0.00
  },
  "maintenance": {
    "fencesGates": 0.00,
    "landscapeContract": 0.00,
    "total": 0.00
  },
  "reserve": {
    "capRock": {
      "fencesGate": 973.17,
      "landscape": 317.76,
      "total": 1290.93
    },
    "capRockEstates": {
      "fencesGate": 0.00,
      "landscape": 59.36,
      "total": 59.36
    }
  },
  "total": 13535.15
}
```

---

## Implementation Plan

### Step 1: Create Database Table
- SQL script to create `cor_FinancialData`
- Add to schema documentation

### Step 2: Build Extraction Service
- Extract financial data during PDF indexing
- Use Claude to parse and structure data
- Store in database table

### Step 3: Build Query Functions
- `getFinancialSummary()` - Monthly/YTD totals
- `getExpenseAnalysis()` - By category, trends
- `getBudgetRecommendations()` - Based on YTD data

### Step 4: Integrate with AI
- Add financial functions to AI service
- Test with strategic questions

---

**Recommendation**: Go with **Database Table** - it's the right tool for the job.

