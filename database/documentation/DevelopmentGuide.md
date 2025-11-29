# HOA Nexus - Database Development Guide

**Purpose**: This document outlines the established patterns and process for adding new tables to the HOA Nexus system.

---

## Development Process for New Tables

When adding a new table to the system, follow this step-by-step process:

### 1. Review Schema
- User provides table structure from diagram
- Review fields, relationships, and requirements
- Identify which fields need dynamic dropdowns

### 2. Create SQL Script
- **For new tables**: Add to `database/scripts/fixesoneofftableupdates.sql`
- **For dropdown updates**: Add to `database/scripts/dynamicdroptableupdate.sql`
- Follow established patterns (see below)
- Include all indexes and foreign keys
- Test in development database
- **Periodically**: Merge changes into `create-client-database.sql` and clear the temp files

### 3. Create Seed Data
- Add default dropdown choices to `database/scripts/dynamicdroptableupdate.sql`
- Use appropriate `GroupID` naming convention
- Mark system-managed choices with `IsSystemManaged = 1`
- **Periodically**: Merge into `create-client-database.sql`

### 4. Update Documentation
- Add table to `database/documentation/CurrentTableSchema.md`
- Document all columns, indexes, and relationships
- Update relationship diagrams

### 5. Build Backend
- **Model** (`backend/src/models/[tableName].js`): Database operations (CRUD)
- **Controller** (`backend/src/controllers/[tableName]Controller.js`): Request handling
- **Routes** (`backend/src/routes/[tableName]Routes.js`): API endpoints
- Follow existing patterns from `community.js` and `communityController.js`

### 6. Build Frontend
- **Service** (`frontend/src/services/dataService.ts`): API calls
- **Types** (`frontend/src/types/[tableName].ts`): TypeScript interfaces
- **Components**: UI components for viewing/editing
- Follow existing patterns from `Community` components

---

## Established Patterns

### 1. Primary Keys
- **Type**: `uniqueidentifier` (GUID)
- **Default**: `DEFAULT NEWID()`
- **Naming**: `[TableName]ID` (e.g., `CommunityID`, `StakeholderID`)

```sql
CommunityID uniqueidentifier NOT NULL 
    CONSTRAINT PK_cor_Communities PRIMARY KEY DEFAULT NEWID()
```

### 2. Soft Deletion
- **Field**: `IsActive` (bit)
- **Default**: `DEFAULT 1` (active by default)
- **Usage**: Set to `0` to soft-delete, never physically delete records
- **Queries**: Always filter with `WHERE IsActive = 1` for active records

```sql
IsActive bit NOT NULL DEFAULT 1
```

### 3. Audit Fields
All tables must include these four audit fields:

```sql
CreatedOn   datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
CreatedBy   uniqueidentifier NULL,
ModifiedOn  datetime2 NULL,
ModifiedBy  uniqueidentifier NULL
```

- `CreatedOn`: Auto-set on insert
- `CreatedBy`: Stakeholder ID who created the record
- `ModifiedOn`: Updated on each modification
- `ModifiedBy`: Stakeholder ID who last modified

### 4. Dynamic Dropdowns
- **Table**: `cor_DynamicDropChoices`
- **Structure**: Uses `GroupID` (not `TableName`/`ColumnName`)
- **Foreign Keys**: Store `ChoiceID` (GUID) in the main table
- **Naming**: Use kebab-case for `GroupID` (e.g., `client-types`, `status`)

**Example**:
```sql
-- In main table
ClientTypeID uniqueidentifier NULL,
    CONSTRAINT FK_cor_Communities_ClientType 
        FOREIGN KEY (ClientTypeID) 
        REFERENCES dbo.cor_DynamicDropChoices(ChoiceID)

-- In cor_DynamicDropChoices
INSERT INTO cor_DynamicDropChoices (GroupID, ChoiceValue, ...)
VALUES ('client-types', 'HOA', ...)
```

**System-Managed Choices**:
- Mark with `IsSystemManaged = 1`
- Cannot be edited/deleted via UI
- Examples: `stakeholder-types`, `access-levels`

### 5. Foreign Keys to Communities
- **Pattern**: `CommunityID uniqueidentifier NULL`
- **Constraint**: `FK_[TableName]_Community` → `cor_Communities(CommunityID)`
- **Usage**: Most operational tables link to a community

```sql
CommunityID uniqueidentifier NULL,
    CONSTRAINT FK_cor_Properties_Community 
        FOREIGN KEY (CommunityID) 
        REFERENCES dbo.cor_Communities(CommunityID)
```

### 6. Naming Conventions

**Table Names**:
- Core tables: `cor_*` (e.g., `cor_Communities`, `cor_Stakeholders`)
- Security tables: `sec_*` (e.g., `sec_UserAccounts`)
- Financial tables: `fin_*` (future)
- Operational tables: `op_*` (future)
- Governance tables: `gov_*` (future)
- Ticket tables: `tkt_*` (future)

**Column Names**:
- Use PascalCase for column names (e.g., `DisplayName`, `CreatedOn`)
- Boolean fields: Prefix with `Is` (e.g., `IsActive`, `IsDefault`)
- ID fields: Suffix with `ID` (e.g., `CommunityID`, `StakeholderID`)

**Indexes**:
- Primary Key: `PK_[TableName]`
- Foreign Key: `FK_[TableName]_[ReferencedTable]`
- Unique: `UQ_[TableName]_[Column(s)]`
- Non-clustered: `IX_[TableName]_[Column(s)]`

### 7. Data Types

**Common Patterns**:
- **Text**: `nvarchar(n)` for Unicode text (use appropriate length)
- **Numbers**: `int` for integers, `decimal` for money/percentages
- **Dates**: `date` for dates only, `datetime2` for timestamps
- **Booleans**: `bit` (0 = false, 1 = true)
- **GUIDs**: `uniqueidentifier`
- **Large Text**: `nvarchar(max)` for notes/descriptions

**Nullable Fields**:
- Most fields should be `NULL` unless required
- Only mark as `NOT NULL` if the field is truly required
- Use `NULL` for optional relationships

---

## File Organization

### Database Scripts
```
database/scripts/
├── master/
│   ├── create-master-database.sql
│   └── seed-admin-user.sql
├── clients/
│   ├── create-client-database.sql (main template - keep updated)
│   └── insert-test-communities.sql
├── fixesoneofftableupdates.sql (temporary - for incremental table creation)
└── dynamicdroptableupdate.sql (temporary - for dropdown updates)
```

**Workflow**:
1. Use `fixesoneofftableupdates.sql` for new tables/columns
2. Use `dynamicdroptableupdate.sql` for dropdown changes
3. Test in development
4. Periodically merge changes into `create-client-database.sql`
5. Clear temp files after merging

### Backend Structure
```
backend/src/
├── models/
│   └── [tableName].js
├── controllers/
│   └── [tableName]Controller.js
└── routes/
    └── [tableName]Routes.js
```

### Frontend Structure
```
frontend/src/
├── services/
│   └── dataService.ts (add methods here)
├── types/
│   └── [tableName].ts
└── components/
    └── [TableName]/
        ├── [TableName].tsx
        └── [TableName]Form.tsx
```

---

## Example: Complete Table Creation

Here's a complete example following all patterns:

```sql
-- =============================================
-- Create cor_Properties Table
-- =============================================
CREATE TABLE dbo.cor_Properties (
    PropertyID           uniqueidentifier NOT NULL 
        CONSTRAINT PK_cor_Properties PRIMARY KEY DEFAULT NEWID(),
    CommunityID          uniqueidentifier NULL,
    AddressLine1         nvarchar(200) NULL,
    AddressLine2         nvarchar(200) NULL,
    City                 nvarchar(100) NULL,
    State                nvarchar(50) NULL,
    PostalCode           nvarchar(20) NULL,
    PropertyTypeID       uniqueidentifier NULL,
    SquareFootage        int NULL,
    StatusID             uniqueidentifier NULL,
    CreatedOn            datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy            uniqueidentifier NULL,
    ModifiedOn           datetime2 NULL,
    ModifiedBy           uniqueidentifier NULL,
    IsActive             bit NOT NULL DEFAULT 1,
    
    CONSTRAINT FK_cor_Properties_Community 
        FOREIGN KEY (CommunityID) 
        REFERENCES dbo.cor_Communities(CommunityID),
    CONSTRAINT FK_cor_Properties_PropertyType 
        FOREIGN KEY (PropertyTypeID) 
        REFERENCES dbo.cor_DynamicDropChoices(ChoiceID),
    CONSTRAINT FK_cor_Properties_Status 
        FOREIGN KEY (StatusID) 
        REFERENCES dbo.cor_DynamicDropChoices(ChoiceID)
);
GO

-- Indexes
CREATE NONCLUSTERED INDEX IX_cor_Properties_CommunityID 
    ON dbo.cor_Properties(CommunityID);
GO

-- Seed dropdown choices
INSERT INTO dbo.cor_DynamicDropChoices (GroupID, ChoiceValue, DisplayOrder, IsDefault, IsActive, CreatedOn)
VALUES
    ('property-types', 'Single Family', 1, 1, 1, SYSUTCDATETIME()),
    ('property-types', 'Condo', 2, 0, 1, SYSUTCDATETIME()),
    ('property-statuses', 'Occupied', 1, 1, 1, SYSUTCDATETIME()),
    ('property-statuses', 'Vacant', 2, 0, 1, SYSUTCDATETIME());
GO
```

---

## Checklist for New Tables

- [ ] SQL script added to `fixesoneofftableupdates.sql` (or `dynamicdroptableupdate.sql` for dropdowns)
- [ ] Table follows all naming conventions
- [ ] Includes `IsActive` for soft deletion
- [ ] Includes all 4 audit fields
- [ ] Foreign keys properly defined
- [ ] Indexes created for performance
- [ ] Dropdown choices added to `cor_DynamicDropChoices` if needed
- [ ] Documentation updated in `CurrentTableSchema.md`
- [ ] Backend model created
- [ ] Backend controller created
- [ ] Backend routes created
- [ ] Frontend service methods added
- [ ] Frontend types defined
- [ ] Frontend components created

---

## Notes

- Always test SQL scripts on a development database first
- Use `IF NOT EXISTS` checks for idempotent scripts
- Keep seed data minimal - only essential defaults
- Document any deviations from these patterns
- Update this guide if patterns evolve

## Temporary Files Workflow

**Purpose**: Avoid creating many migration files while keeping main scripts updated.

**Files**:
- `fixesoneofftableupdates.sql` - For table creation/updates
- `dynamicdroptableupdate.sql` - For dropdown updates

**Process**:
1. Add changes to appropriate temp file
2. Copy/paste to SQL Server and test
3. When stable, merge into `create-client-database.sql`
4. Clear temp file
5. This keeps `create-client-database.sql` as the single source of truth

---

**Last Updated**: 2025-01-XX

