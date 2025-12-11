-- =============================================
-- Create Financial Data Table
-- Stores extracted financial data from monthly financial statement PDFs
-- =============================================

-- Drop table if exists (for development/testing)
IF OBJECT_ID('dbo.cor_FinancialData', 'U') IS NOT NULL
BEGIN
    -- Drop foreign keys first
    IF OBJECT_ID('FK_cor_FinancialData_Community', 'F') IS NOT NULL
        ALTER TABLE dbo.cor_FinancialData DROP CONSTRAINT FK_cor_FinancialData_Community;
    IF OBJECT_ID('FK_cor_FinancialData_File', 'F') IS NOT NULL
        ALTER TABLE dbo.cor_FinancialData DROP CONSTRAINT FK_cor_FinancialData_File;
    
    DROP TABLE dbo.cor_FinancialData;
    PRINT 'Dropped existing cor_FinancialData table.';
END
GO

-- Create Financial Data Table
CREATE TABLE dbo.cor_FinancialData (
    FinancialDataID uniqueidentifier NOT NULL 
        CONSTRAINT PK_cor_FinancialData PRIMARY KEY DEFAULT NEWID(),
    CommunityID uniqueidentifier NOT NULL,
    FileID uniqueidentifier NULL, -- Link to source PDF file
    StatementDate date NOT NULL, -- Date from statement (e.g., 2025-10-31)
    StatementMonth int NOT NULL, -- 1-12
    StatementYear int NOT NULL, -- 2025, 2026, etc.
    
    -- Income Data (stored as JSON for flexibility)
    IncomeData nvarchar(MAX) NULL, -- JSON: assessments by community, interest, late fees, etc.
    
    -- Expense Data (stored as JSON for flexibility)
    ExpenseData nvarchar(MAX) NULL, -- JSON: categories and amounts (General/Admin, Maintenance, Reserve)
    
    -- Balance Sheet Data (stored as JSON)
    BalanceSheetData nvarchar(MAX) NULL, -- JSON: assets, liabilities, equity, fund balances
    
    -- Aggregated Totals (for fast queries without parsing JSON)
    TotalIncome decimal(12,2) NULL,
    TotalExpenses decimal(12,2) NULL,
    NetIncome decimal(12,2) NULL, -- Income - Expenses
    YTDIncome decimal(12,2) NULL,
    YTDExpenses decimal(12,2) NULL,
    YTDNetIncome decimal(12,2) NULL,
    
    -- Assessment Data (for collection rate calculations)
    AssessmentIncome decimal(12,2) NULL, -- Total assessments billed
    AssessmentCollected decimal(12,2) NULL, -- Total assessments collected
    CollectionRate decimal(5,4) NULL, -- 0.9600 = 96% collection rate
    
    -- Extraction Metadata
    ExtractedOn datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ExtractionVersion int NULL DEFAULT 1, -- Version of extraction logic used
    ExtractionError nvarchar(MAX) NULL, -- Error message if extraction failed
    
    -- Audit Fields
    CreatedOn datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy uniqueidentifier NULL,
    ModifiedOn datetime2 NULL,
    ModifiedBy uniqueidentifier NULL,
    IsActive bit NOT NULL DEFAULT 1,
    
    -- Foreign Keys
    CONSTRAINT FK_cor_FinancialData_Community 
        FOREIGN KEY (CommunityID) 
        REFERENCES dbo.cor_Communities(CommunityID),
    CONSTRAINT FK_cor_FinancialData_File 
        FOREIGN KEY (FileID) 
        REFERENCES dbo.cor_Files(FileID),
    
    -- Check Constraints
    CONSTRAINT CK_cor_FinancialData_Month 
        CHECK (StatementMonth >= 1 AND StatementMonth <= 12),
    CONSTRAINT CK_cor_FinancialData_CollectionRate 
        CHECK (CollectionRate IS NULL OR (CollectionRate >= 0 AND CollectionRate <= 1))
);
GO

-- Create Indexes for Performance
CREATE NONCLUSTERED INDEX IX_cor_FinancialData_CommunityID 
    ON dbo.cor_FinancialData(CommunityID);
GO

CREATE NONCLUSTERED INDEX IX_cor_FinancialData_Date 
    ON dbo.cor_FinancialData(StatementYear, StatementMonth);
GO

CREATE NONCLUSTERED INDEX IX_cor_FinancialData_FileID 
    ON dbo.cor_FinancialData(FileID) 
    WHERE FileID IS NOT NULL;
GO

-- Unique constraint: One financial statement per community per month/year
CREATE UNIQUE NONCLUSTERED INDEX UQ_cor_FinancialData_Community_Date 
    ON dbo.cor_FinancialData(CommunityID, StatementYear, StatementMonth) 
    WHERE IsActive = 1;
GO

PRINT 'Created cor_FinancialData table with indexes.';
GO

