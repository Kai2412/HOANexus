# Stakeholder Dropdowns Migration Plan

## Overview
Migrate all hardcoded stakeholder dropdowns to `cor_DynamicDropChoices` table for consistency and admin control.

## Step 1: Add ParentChoiceID to cor_DynamicDropChoices

**Purpose:** Support hierarchical relationships (SubType depends on Type)

**SQL Script:**
```sql
-- Add ParentChoiceID column to support hierarchical dropdowns
ALTER TABLE dbo.cor_DynamicDropChoices
ADD ParentChoiceID uniqueidentifier NULL;

-- Add foreign key constraint
ALTER TABLE dbo.cor_DynamicDropChoices
ADD CONSTRAINT FK_cor_DynamicDropChoices_ParentChoice
FOREIGN KEY (ParentChoiceID) REFERENCES dbo.cor_DynamicDropChoices(ChoiceID);

-- Add index for performance
CREATE NONCLUSTERED INDEX IX_cor_DynamicDropChoices_ParentChoiceID
ON dbo.cor_DynamicDropChoices(ParentChoiceID)
WHERE ParentChoiceID IS NOT NULL;
```

## Step 2: Update cor_Stakeholders to Use GUIDs

**Current:** Text fields (Type, SubType, AccessLevel, etc.)
**Target:** GUID fields (TypeID, SubTypeID, AccessLevelID, etc.)

**Schema Changes Needed:**
- Add GUID columns: `TypeID`, `SubTypeID`, `AccessLevelID`, `PreferredContactMethodID`, `StatusID`, `DepartmentID`
- Keep text columns temporarily for migration
- Add foreign keys to `cor_DynamicDropChoices`
- Migrate existing data
- Remove text columns after migration

## Step 3: Insert Dropdown Choices

### 3.1 Type Choices
```sql
INSERT INTO dbo.cor_DynamicDropChoices (ChoiceID, TableName, ColumnName, ChoiceValue, DisplayOrder, IsDefault, IsActive)
VALUES
  (NEWID(), 'cor_Stakeholders', 'Type', 'Resident', 1, 1, 1),
  (NEWID(), 'cor_Stakeholders', 'Type', 'Company Employee', 2, 0, 1),
  (NEWID(), 'cor_Stakeholders', 'Type', 'Vendor', 3, 0, 1),
  (NEWID(), 'cor_Stakeholders', 'Type', 'Other', 4, 0, 1);
```

### 3.2 SubType Choices (with ParentChoiceID)
```sql
-- First, get Type ChoiceIDs
DECLARE @ResidentTypeID uniqueidentifier = (SELECT ChoiceID FROM cor_DynamicDropChoices WHERE TableName = 'cor_Stakeholders' AND ColumnName = 'Type' AND ChoiceValue = 'Resident');
DECLARE @CompanyEmployeeTypeID uniqueidentifier = (SELECT ChoiceID FROM cor_DynamicDropChoices WHERE TableName = 'cor_Stakeholders' AND ColumnName = 'Type' AND ChoiceValue = 'Company Employee');
DECLARE @VendorTypeID uniqueidentifier = (SELECT ChoiceID FROM cor_DynamicDropChoices WHERE TableName = 'cor_Stakeholders' AND ColumnName = 'Type' AND ChoiceValue = 'Vendor');

-- Resident SubTypes
INSERT INTO dbo.cor_DynamicDropChoices (ChoiceID, TableName, ColumnName, ChoiceValue, DisplayOrder, IsDefault, IsActive, ParentChoiceID)
VALUES
  (NEWID(), 'cor_Stakeholders', 'SubType', 'Owner', 1, 1, 1, @ResidentTypeID),
  (NEWID(), 'cor_Stakeholders', 'SubType', 'Family Member', 2, 0, 1, @ResidentTypeID),
  (NEWID(), 'cor_Stakeholders', 'SubType', 'Guest', 3, 0, 1, @ResidentTypeID);

-- Company Employee SubTypes
INSERT INTO dbo.cor_DynamicDropChoices (ChoiceID, TableName, ColumnName, ChoiceValue, DisplayOrder, IsDefault, IsActive, ParentChoiceID)
VALUES
  (NEWID(), 'cor_Stakeholders', 'SubType', 'Accounting', 1, 0, 1, @CompanyEmployeeTypeID),
  (NEWID(), 'cor_Stakeholders', 'SubType', 'Maintenance', 2, 0, 1, @CompanyEmployeeTypeID),
  (NEWID(), 'cor_Stakeholders', 'SubType', 'Amenity Access', 3, 0, 1, @CompanyEmployeeTypeID),
  (NEWID(), 'cor_Stakeholders', 'SubType', 'Customer Service', 4, 0, 1, @CompanyEmployeeTypeID),
  (NEWID(), 'cor_Stakeholders', 'SubType', 'Community Manager', 5, 0, 1, @CompanyEmployeeTypeID),
  (NEWID(), 'cor_Stakeholders', 'SubType', 'Director', 6, 0, 1, @CompanyEmployeeTypeID),
  (NEWID(), 'cor_Stakeholders', 'SubType', 'Executive (C-Suite)', 7, 0, 1, @CompanyEmployeeTypeID),
  (NEWID(), 'cor_Stakeholders', 'SubType', 'General Employee', 8, 0, 1, @CompanyEmployeeTypeID),
  (NEWID(), 'cor_Stakeholders', 'SubType', 'IT', 9, 0, 1, @CompanyEmployeeTypeID);

-- Vendor SubTypes
INSERT INTO dbo.cor_DynamicDropChoices (ChoiceID, TableName, ColumnName, ChoiceValue, DisplayOrder, IsDefault, IsActive, ParentChoiceID)
VALUES
  (NEWID(), 'cor_Stakeholders', 'SubType', 'Contractors', 1, 0, 1, @VendorTypeID),
  (NEWID(), 'cor_Stakeholders', 'SubType', 'Service Providers', 2, 0, 1, @VendorTypeID),
  (NEWID(), 'cor_Stakeholders', 'SubType', 'Suppliers', 3, 0, 1, @VendorTypeID);
```

### 3.3 AccessLevel Choices
```sql
INSERT INTO dbo.cor_DynamicDropChoices (ChoiceID, TableName, ColumnName, ChoiceValue, DisplayOrder, IsDefault, IsActive)
VALUES
  (NEWID(), 'cor_Stakeholders', 'AccessLevel', 'Partial', 1, 0, 1),
  (NEWID(), 'cor_Stakeholders', 'AccessLevel', 'Full', 2, 0, 1),
  (NEWID(), 'cor_Stakeholders', 'AccessLevel', 'Admin', 3, 1, 1);
```

### 3.4 PreferredContactMethod Choices
```sql
INSERT INTO dbo.cor_DynamicDropChoices (ChoiceID, TableName, ColumnName, ChoiceValue, DisplayOrder, IsDefault, IsActive)
VALUES
  (NEWID(), 'cor_Stakeholders', 'PreferredContactMethod', 'Email', 1, 1, 1),
  (NEWID(), 'cor_Stakeholders', 'PreferredContactMethod', 'Phone', 2, 0, 1),
  (NEWID(), 'cor_Stakeholders', 'PreferredContactMethod', 'Mobile', 3, 0, 1),
  (NEWID(), 'cor_Stakeholders', 'PreferredContactMethod', 'Text', 4, 0, 1),
  (NEWID(), 'cor_Stakeholders', 'PreferredContactMethod', 'Mail', 5, 0, 1);
```

### 3.5 Status Choices
```sql
INSERT INTO dbo.cor_DynamicDropChoices (ChoiceID, TableName, ColumnName, ChoiceValue, DisplayOrder, IsDefault, IsActive)
VALUES
  (NEWID(), 'cor_Stakeholders', 'Status', 'Active', 1, 1, 1),
  (NEWID(), 'cor_Stakeholders', 'Status', 'Inactive', 2, 0, 1),
  (NEWID(), 'cor_Stakeholders', 'Status', 'Pending', 3, 0, 1),
  (NEWID(), 'cor_Stakeholders', 'Status', 'Suspended', 4, 0, 1);
```

### 3.6 Department Choices (NEW - add to form)
```sql
INSERT INTO dbo.cor_DynamicDropChoices (ChoiceID, TableName, ColumnName, ChoiceValue, DisplayOrder, IsDefault, IsActive)
VALUES
  (NEWID(), 'cor_Stakeholders', 'Department', 'Community Management', 1, 0, 1),
  (NEWID(), 'cor_Stakeholders', 'Department', 'Accounting', 2, 0, 1),
  (NEWID(), 'cor_Stakeholders', 'Department', 'Maintenance', 3, 0, 1),
  (NEWID(), 'cor_Stakeholders', 'Department', 'Customer Service', 4, 0, 1),
  (NEWID(), 'cor_Stakeholders', 'Department', 'IT', 5, 0, 1),
  (NEWID(), 'cor_Stakeholders', 'Department', 'Executive', 6, 0, 1),
  (NEWID(), 'cor_Stakeholders', 'Department', 'Other', 7, 0, 1);
```

## Step 4: Backend Changes

### 4.1 Update Stakeholder Model
- Add methods to fetch dropdown choices by TableName/ColumnName
- Add methods to fetch SubTypes by ParentChoiceID (Type)
- Update `create()` and `update()` to convert text → GUID
- Update `getAll()` and `getById()` to join and return text values

### 4.2 Update Stakeholder Controller
- Add endpoints for fetching dropdown choices
- Update validation to check against dynamic choices

## Step 5: Frontend Changes

### 5.1 Update Types
- Remove hardcoded arrays (STAKEHOLDER_TYPES, STAKEHOLDER_SUBTYPES, etc.)
- Add API service methods to fetch choices

### 5.2 Update Forms
- AddStakeholder.tsx: Use dynamic dropdowns
- EditStakeholderModal.tsx: Use dynamic dropdowns
- Add Department field to both forms
- Add Title field (decide: dropdown or text input?)

### 5.3 Update Display Components
- DirectoryLookup.tsx: Display text values from joined data
- ViewStakeholderModal.tsx: Display text values

## Step 6: Database Migration

### Option A: Keep Text Columns (Recommended for now)
- Add GUID columns alongside text columns
- Update code to use GUIDs
- Migrate existing data
- Remove text columns later

### Option B: Direct Migration
- Add GUID columns
- Migrate all existing data immediately
- Remove text columns
- Update all code at once

## Decision Points

1. **Title Field:** Dropdown or free text?
   - **Recommendation:** Free text for flexibility (job titles vary widely)

2. **Department Field:** Add to form now or later?
   - **Recommendation:** Add now - it's in the schema and useful

3. **Migration Strategy:** Gradual or all-at-once?
   - **Recommendation:** Gradual (Option A) - safer, allows testing

## Next Steps

1. ✅ Create analysis document (done)
2. ⏳ Add ParentChoiceID to schema
3. ⏳ Create migration script
4. ⏳ Update backend model/controller
5. ⏳ Update frontend components
6. ⏳ Test thoroughly
7. ⏳ Migrate existing data
8. ⏳ Remove text columns (future)

