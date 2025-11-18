# Stakeholder Dropdowns Migration Analysis

## Current Hardcoded Dropdowns (to migrate to cor_DynamicDropChoices)

### 1. **Type** (`cor_Stakeholders.Type`)
- **Current Values:**
  - Resident
  - Company Employee
  - Vendor
  - Other
- **Table/Column:** `cor_Stakeholders` / `Type`
- **Notes:** Primary classification field

### 2. **SubType** (`cor_Stakeholders.SubType`)
- **Current Values (hierarchical - depends on Type):**
  - **Resident:**
    - Owner
    - Family Member
    - Guest
  - **Company Employee:**
    - Accounting
    - Maintenance
    - Amenity Access
    - Customer Service
    - Community Manager
    - Director
    - Executive (C-Suite)
    - General Employee
    - IT
  - **Vendor:**
    - Contractors
    - Service Providers
    - Suppliers
  - **Other:**
    - (none)
- **Table/Column:** `cor_Stakeholders` / `SubType`
- **Notes:** **HIERARCHICAL** - needs parent relationship to Type
- **Solution:** Add `ParentChoiceID` to `cor_DynamicDropChoices` OR store Type value in metadata

### 3. **AccessLevel** (`cor_Stakeholders.AccessLevel`)
- **Current Values:**
  - Partial
  - Full
  - Admin
- **Table/Column:** `cor_Stakeholders` / `AccessLevel`
- **Notes:** Only shown for "Company Employee" type
- **Display Order:** Should be: Partial (1), Full (2), Admin (3)

### 4. **PreferredContactMethod** (`cor_Stakeholders.PreferredContactMethod`)
- **Current Values:**
  - Email
  - Phone
  - Mobile
  - Text
  - Mail
- **Table/Column:** `cor_Stakeholders` / `PreferredContactMethod`
- **Notes:** Default is "Email"

### 5. **Status** (`cor_Stakeholders.Status`)
- **Current Values:**
  - Active
  - Inactive
  - Pending
  - Suspended
- **Table/Column:** `cor_Stakeholders` / `Status`
- **Notes:** Default is "Active"

### 6. **Department** (`cor_Stakeholders.Department`)
- **Current Values:** Not in form yet, but field exists in schema
- **Table/Column:** `cor_Stakeholders` / `Department`
- **Notes:** Should be added to form as dropdown
- **Suggested Values:**
  - Community Management
  - Accounting
  - Maintenance
  - Customer Service
  - IT
  - Executive
  - Other

### 7. **Title** (`cor_Stakeholders.Title`)
- **Current Values:** Not in form yet, but field exists in schema
- **Table/Column:** `cor_Stakeholders` / `Title`
- **Notes:** Could be free text OR dropdown (needs decision)
- **If Dropdown, Suggested Values:**
  - Manager
  - Director
  - Assistant
  - Coordinator
  - Specialist
  - Analyst
  - (or keep as free text for flexibility)

## Migration Strategy

### Option A: Add ParentChoiceID to cor_DynamicDropChoices
- Add `ParentChoiceID uniqueidentifier NULL` column
- Link SubTypes to their parent Type choice
- Allows true hierarchical relationships

### Option B: Store Type in metadata/notes
- Use existing fields to store parent relationship
- Simpler but less flexible

### Recommended: Option A
- More scalable
- Allows for future hierarchical dropdowns
- Cleaner data model

## Implementation Steps

1. **Add ParentChoiceID column** to `cor_DynamicDropChoices` table
2. **Insert Type choices** (Resident, Company Employee, Vendor, Other)
3. **Insert SubType choices** with ParentChoiceID linking to Type
4. **Insert AccessLevel choices**
5. **Insert PreferredContactMethod choices**
6. **Insert Status choices**
7. **Insert Department choices** (if making it a dropdown)
8. **Update backend** to use GUIDs instead of text
9. **Update frontend** to fetch from API instead of hardcoded arrays
10. **Update forms** to use dynamic dropdowns

## Fields to Add to Form (currently missing)

- **Department** - Add dropdown to AddStakeholder and EditStakeholderModal
- **Title** - Add field (dropdown or text input - needs decision)

