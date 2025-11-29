# Current Database Schema

**Last Updated**: 2025-01-XX  
**Database Architecture**: Multi-tenant with Master + Client databases

## Overview

This document describes the **actual current tables** in the HOA Nexus system. There are **9 core tables** across 2 databases:

- **Master Database** (`hoa_nexus_master`): 3 tables for multi-tenant organization and user management
- **Client Database** (`hoa_nexus_testclient`): 6 tables for client-specific data

---

## Master Database (`hoa_nexus_master`)

### 1. `cor_Organizations`

**Purpose**: Stores all client organizations and their database mappings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `OrganizationID` | uniqueidentifier | PK, DEFAULT NEWID() | Primary key |
| `OrganizationName` | nvarchar(255) | NOT NULL | Organization display name |
| `DatabaseName` | nvarchar(100) | NOT NULL, UNIQUE | Client database name (e.g., 'hoa_nexus_testclient') |
| `Subdomain` | nvarchar(100) | NULL, UNIQUE | Subdomain for multi-tenant URLs (e.g., 'testclient') |
| `IsActive` | bit | NOT NULL, DEFAULT 1 | Soft deletion flag |
| `CreatedOn` | datetime2 | NOT NULL, DEFAULT SYSUTCDATETIME() | Creation timestamp |
| `CreatedBy` | uniqueidentifier | NULL | Creator stakeholder ID |
| `ModifiedOn` | datetime2 | NULL | Last modification timestamp |
| `ModifiedBy` | uniqueidentifier | NULL | Last modifier stakeholder ID |
| `Notes` | nvarchar(max) | NULL | Additional notes |

**Indexes**:
- Primary Key: `PK_cor_Organizations` on `OrganizationID`
- Unique: `UQ_cor_Organizations_DatabaseName` on `DatabaseName`
- Unique: `UQ_cor_Organizations_Subdomain` on `Subdomain`

**Relationships**:
- Referenced by: `sec_UserAccounts.OrganizationID`, `cor_OrganizationSettings.OrganizationID`

---

### 2. `sec_UserAccounts`

**Purpose**: Stores all user accounts across all organizations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `UserAccountID` | uniqueidentifier | PK, DEFAULT NEWID() | Primary key |
| `OrganizationID` | uniqueidentifier | NOT NULL, FK → cor_Organizations | Organization this user belongs to |
| `Username` | nvarchar(255) | NOT NULL, UNIQUE | Email address (used as username) |
| `PasswordHash` | nvarchar(255) | NOT NULL | bcrypt hashed password |
| `Email` | nvarchar(255) | NOT NULL, UNIQUE | Email address (must equal Username) |
| `FirstName` | nvarchar(100) | NULL | User's first name |
| `LastName` | nvarchar(100) | NULL | User's last name |
| `StakeholderID` | uniqueidentifier | NULL | Link to client DB stakeholder |
| `MustChangePassword` | bit | NOT NULL, DEFAULT 1 | Force password change on first login |
| `TempPasswordExpiry` | datetime2 | NULL | Expiration for temporary passwords |
| `IsActive` | bit | NOT NULL, DEFAULT 1 | Account active status |
| `LastLoginDate` | datetime2 | NULL | Last successful login timestamp |
| `FailedLoginAttempts` | int | NOT NULL, DEFAULT 0 | Failed login counter |
| `AccountLocked` | bit | NOT NULL, DEFAULT 0 | Account lock status |
| `LockReason` | nvarchar(255) | NULL | Reason for account lock |
| `PasswordLastChanged` | datetime2 | NULL | Last password change timestamp |
| `CreatedOn` | datetime2 | NOT NULL, DEFAULT SYSUTCDATETIME() | Creation timestamp |
| `CreatedBy` | uniqueidentifier | NULL | Creator stakeholder ID |
| `ModifiedOn` | datetime2 | NULL | Last modification timestamp |
| `ModifiedBy` | uniqueidentifier | NULL | Last modifier stakeholder ID |

**Indexes**:
- Primary Key: `PK_sec_UserAccounts` on `UserAccountID`
- Foreign Key: `FK_sec_UserAccounts_Organization` → `cor_Organizations(OrganizationID)`
- Unique: `UQ_sec_UserAccounts_Username` on `Username`
- Unique: `UQ_sec_UserAccounts_Email` on `Email`
- Index: `IX_sec_UserAccounts_OrganizationID` on `OrganizationID`
- Index: `IX_sec_UserAccounts_Username` on `Username`
- Index: `IX_sec_UserAccounts_Email` on `Email`
- Index: `IX_sec_UserAccounts_StakeholderID` on `StakeholderID` (filtered, WHERE NOT NULL)

**Constraints**:
- Check: `CK_sec_UserAccounts_UsernameIsEmail` ensures `Username = Email`

**Relationships**:
- References: `cor_Organizations` via `OrganizationID`
- Links to: Client DB `cor_Stakeholders` via `StakeholderID`

---

### 3. `cor_OrganizationSettings`

**Purpose**: Stores client-specific configuration settings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `SettingID` | uniqueidentifier | PK, DEFAULT NEWID() | Primary key |
| `OrganizationID` | uniqueidentifier | NOT NULL, FK → cor_Organizations | Organization this setting belongs to |
| `SettingKey` | nvarchar(100) | NOT NULL | Setting identifier (e.g., 'theme_color', 'logo_url') |
| `SettingValue` | nvarchar(max) | NULL | Setting value |
| `SettingType` | nvarchar(50) | NULL | Value type: 'string', 'number', 'boolean', 'json' |
| `IsActive` | bit | NOT NULL, DEFAULT 1 | Setting active status |
| `CreatedOn` | datetime2 | NOT NULL, DEFAULT SYSUTCDATETIME() | Creation timestamp |
| `ModifiedOn` | datetime2 | NULL | Last modification timestamp |

**Indexes**:
- Primary Key: `PK_cor_OrganizationSettings` on `SettingID`
- Foreign Key: `FK_cor_OrganizationSettings_Organization` → `cor_Organizations(OrganizationID)`
- Unique: `UQ_cor_OrganizationSettings_OrgKey` on `(OrganizationID, SettingKey)`
- Index: `IX_cor_OrganizationSettings_OrganizationID` on `OrganizationID`

**Relationships**:
- References: `cor_Organizations` via `OrganizationID`

---

## Client Database (`hoa_nexus_testclient`)

### 4. `cor_DynamicDropChoices`

**Purpose**: Centralized dropdown choices system using GroupID-based organization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `ChoiceID` | uniqueidentifier | PK, DEFAULT NEWID() | Primary key |
| `GroupID` | varchar(100) | NOT NULL | Group identifier (e.g., 'client-types', 'status') |
| `ChoiceValue` | varchar(150) | NOT NULL | Display text for the choice |
| `DisplayOrder` | int | NOT NULL | Sort order within group |
| `IsDefault` | bit | NOT NULL, DEFAULT 0 | Default selection flag |
| `IsActive` | bit | NOT NULL, DEFAULT 1 | Soft deletion flag |
| `IsSystemManaged` | bit | NOT NULL, DEFAULT 0 | System-managed (cannot be edited) |
| `CreatedOn` | datetime2 | NOT NULL, DEFAULT SYSUTCDATETIME() | Creation timestamp |
| `CreatedBy` | uniqueidentifier | NULL | Creator stakeholder ID |
| `ModifiedOn` | datetime2 | NULL | Last modification timestamp |
| `ModifiedBy` | uniqueidentifier | NULL | Last modifier stakeholder ID |

**Indexes**:
- Primary Key: `PK_cor_DynamicDropChoices` on `ChoiceID`
- Unique: `UQ_cor_DynamicDropChoices_GroupValue_Active` on `(GroupID, ChoiceValue)` WHERE `IsActive = 1`
- Index: `IX_cor_DynamicDropChoices_GroupID` on `GroupID`

**Default Groups**:
- **Community**: `client-types`, `service-types`, `management-types`, `development-stages`, `acquisition-types`, `fee-types`, `billing-frequency`, `notice-requirements`
- **Stakeholder**: `stakeholder-types`, `stakeholder-subtypes-resident`, `stakeholder-subtypes-staff`, `stakeholder-subtypes-vendor`, `preferred-contact-methods`, `status`, `access-levels`
- **Tickets**: `ticket-statuses`

**Relationships**:
- Referenced by: `cor_Communities` (ClientTypeID, ServiceTypeID, ManagementTypeID, DevelopmentStageID, AcquisitionTypeID)
- Referenced by: `cor_ManagementFees` (FeeTypeID)
- Referenced by: `cor_BillingInformation` (BillingFrequencyID, NoticeRequirementID)

---

### 5. `cor_Stakeholders`

**Purpose**: Unified table for all people and organizations (residents, staff, vendors, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `StakeholderID` | uniqueidentifier | PK, DEFAULT NEWID() | Primary key |
| `Type` | nvarchar(50) | NOT NULL | Stakeholder type (Resident, Staff, Vendor, Other) |
| `SubType` | nvarchar(50) | NULL | Sub-type (e.g., Owner, Community Management, Contractors) |
| `FirstName` | nvarchar(100) | NULL | First name |
| `LastName` | nvarchar(100) | NULL | Last name |
| `CompanyName` | nvarchar(255) | NULL | Company name (for vendors/companies) |
| `Email` | nvarchar(255) | NULL | Email address |
| `Phone` | nvarchar(30) | NULL | Primary phone number |
| `MobilePhone` | nvarchar(30) | NULL | Mobile phone number |
| `PreferredContactMethod` | nvarchar(20) | NULL | Preferred contact method (Email, Phone, Mobile, Text, Mail) |
| `Status` | nvarchar(20) | NULL | Status (Active, Inactive, Pending, Suspended) |
| `AccessLevel` | nvarchar(50) | NULL | Access level (None, View, View+Write, View+Write+Delete) |
| `Department` | nvarchar(100) | NULL | Department (for staff) |
| `Title` | nvarchar(100) | NULL | Job title |
| `CommunityID` | uniqueidentifier | NULL, FK → cor_Communities | Associated community (if applicable) |
| `PortalAccessEnabled` | bit | NOT NULL, DEFAULT 0 | Portal access enabled flag |
| `LastLoginDate` | datetime2 | NULL | Last portal login timestamp |
| `Notes` | nvarchar(500) | NULL | Additional notes |
| `CreatedOn` | datetime2 | NOT NULL, DEFAULT SYSUTCDATETIME() | Creation timestamp |
| `CreatedBy` | uniqueidentifier | NULL | Creator stakeholder ID |
| `ModifiedOn` | datetime2 | NULL | Last modification timestamp |
| `ModifiedBy` | uniqueidentifier | NULL | Last modifier stakeholder ID |
| `IsActive` | bit | NOT NULL, DEFAULT 1 | Soft deletion flag |

**Indexes**:
- Primary Key: `PK_cor_Stakeholders` on `StakeholderID`
- Foreign Key: `FK_cor_Stakeholders_CommunityID` → `cor_Communities(CommunityID)`
- Unique: `UQ_cor_Stakeholders_Email_PortalAccess` on `Email` WHERE `PortalAccessEnabled = 1 AND Email IS NOT NULL`
- Index: `IX_cor_Stakeholders_Type` on `Type`
- Index: `IX_cor_Stakeholders_Email` on `Email` (filtered, WHERE NOT NULL)

**Relationships**:
- References: `cor_Communities` via `CommunityID` (optional)
- Referenced by: Master DB `sec_UserAccounts.StakeholderID` (links user accounts to stakeholders)

---

### 6. `cor_Communities`

**Purpose**: Stores HOA/community association information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `CommunityID` | uniqueidentifier | PK, DEFAULT NEWID() | Primary key |
| `PropertyCode` | nvarchar(50) | NULL | Legacy property code identifier |
| `DisplayName` | nvarchar(150) | NULL | Marketing/common name |
| `LegalName` | nvarchar(200) | NULL | Official legal name |
| `Active` | bit | NULL | Active status (soft deletion) |
| `ContractStart` | date | NULL | Contract start date |
| `ContractEnd` | date | NULL | Contract end date |
| `Address` | nvarchar(200) | NULL | Primary address line |
| `Address2` | nvarchar(200) | NULL | Secondary address line |
| `City` | nvarchar(100) | NULL | City |
| `State` | nvarchar(50) | NULL | State |
| `Zipcode` | nvarchar(20) | NULL | ZIP/Postal code |
| `ThirdPartyIdentifier` | nvarchar(100) | NULL | Third-party system identifier |
| `Market` | nvarchar(100) | NULL | Market region |
| `Office` | nvarchar(100) | NULL | Office location |
| `Website` | nvarchar(200) | NULL | Website URL |
| `TaxID` | nvarchar(30) | NULL | Tax ID number |
| `StateTaxID` | nvarchar(30) | NULL | State tax ID number |
| `SOSFileNumber` | nvarchar(30) | NULL | Secretary of State file number |
| `TaxReturnType` | nvarchar(50) | NULL | Tax return type |
| `ClientTypeID` | uniqueidentifier | NULL, FK → cor_DynamicDropChoices | Client type (HOA, Condo, etc.) |
| `ServiceTypeID` | uniqueidentifier | NULL, FK → cor_DynamicDropChoices | Service type (Full Service, Hybrid, etc.) |
| `ManagementTypeID` | uniqueidentifier | NULL, FK → cor_DynamicDropChoices | Management type (Portfolio, Onsite, Hybrid) |
| `DevelopmentStageID` | uniqueidentifier | NULL, FK → cor_DynamicDropChoices | Development stage (Homeowner/Declarant Controlled) |
| `AcquisitionTypeID` | uniqueidentifier | NULL, FK → cor_DynamicDropChoices | Acquisition type (Organic, Acquisition) |
| `BuiltOutUnits` | int | NULL | Number of built-out units |
| `CommunityStatus` | nvarchar(100) | NULL | Community status |
| `PreferredContactInfo` | nvarchar(200) | NULL | Preferred contact information |
| `CreatedOn` | datetime2 | NOT NULL, DEFAULT SYSUTCDATETIME() | Creation timestamp |
| `CreatedBy` | uniqueidentifier | NULL | Creator stakeholder ID |
| `ModifiedOn` | datetime2 | NULL | Last modification timestamp |
| `ModifiedBy` | uniqueidentifier | NULL | Last modifier stakeholder ID |

**Indexes**:
- Primary Key: `PK_cor_Communities` on `CommunityID`
- Foreign Keys:
  - `FK_cor_Communities_ClientType` → `cor_DynamicDropChoices(ChoiceID)`
  - `FK_cor_Communities_ServiceType` → `cor_DynamicDropChoices(ChoiceID)`
  - `FK_cor_Communities_ManagementType` → `cor_DynamicDropChoices(ChoiceID)`
  - `FK_cor_Communities_DevelopmentStage` → `cor_DynamicDropChoices(ChoiceID)`
  - `FK_cor_Communities_AcquisitionType` → `cor_DynamicDropChoices(ChoiceID)`
- Index: `IX_cor_Communities_DisplayName` on `DisplayName`

**Relationships**:
- References: `cor_DynamicDropChoices` via dropdown ID fields
- Referenced by: `cor_Stakeholders.CommunityID` (optional)
- Referenced by: `cor_ManagementFees.CommunityID`

---

### 7. `cor_ManagementFees`

**Purpose**: Stores management fee information for each community.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `ManagementFeesID` | uniqueidentifier | PK, DEFAULT NEWID() | Primary key |
| `CommunityID` | uniqueidentifier | NOT NULL, FK → cor_Communities | Associated community |
| `ManagementFee` | decimal(12,2) | NULL | Management fee amount |
| `PerUnitFee` | decimal(12,2) | NULL | Per unit fee amount |
| `FeeTypeID` | uniqueidentifier | NULL, FK → cor_DynamicDropChoices | Fee type (Flat Rate, Tiered, Per Unit) |
| `IncreaseType` | nvarchar(50) | NULL | Type of fee increase |
| `IncreaseEffective` | date | NULL | Effective date for fee increase |
| `BoardApprovalRequired` | bit | NOT NULL, DEFAULT 0 | Whether board approval is required |
| `AutoIncrease` | nvarchar(50) | NULL | Auto-increase configuration |
| `FixedCost` | decimal(12,2) | NULL | Fixed cost amount |
| `CreatedOn` | datetime2 | NOT NULL, DEFAULT SYSUTCDATETIME() | Creation timestamp |
| `CreatedBy` | uniqueidentifier | NULL | Creator stakeholder ID |
| `ModifiedOn` | datetime2 | NULL | Last modification timestamp |
| `ModifiedBy` | uniqueidentifier | NULL | Last modifier stakeholder ID |
| `IsActive` | bit | NOT NULL, DEFAULT 1 | Soft deletion flag |

**Indexes**:
- Primary Key: `PK_cor_ManagementFees` on `ManagementFeesID`
- Foreign Keys:
  - `FK_cor_ManagementFees_Community` → `cor_Communities(CommunityID)`
  - `FK_cor_ManagementFees_FeeType` → `cor_DynamicDropChoices(ChoiceID)`
- Index: `IX_cor_ManagementFees_CommunityID` on `CommunityID`

**Relationships**:
- References: `cor_Communities` via `CommunityID`
- References: `cor_DynamicDropChoices` via `FeeTypeID`

---

### 8. `cor_BillingInformation`

**Purpose**: Stores billing information and frequency settings for each community.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `BillingInformationID` | uniqueidentifier | PK, DEFAULT NEWID() | Primary key |
| `CommunityID` | uniqueidentifier | NOT NULL, FK → cor_Communities | Associated community |
| `BillingFrequencyID` | uniqueidentifier | NULL, FK → cor_DynamicDropChoices | Billing frequency (Annual, Monthly, Semi-Annual, Quarterly) |
| `BillingMonth` | int | NULL, CHECK (1-12) | Month for billing (1-12) |
| `BillingDay` | int | NULL, CHECK (1-31) | Day of month for billing (1-31) |
| `NoticeRequirementID` | uniqueidentifier | NULL, FK → cor_DynamicDropChoices | Notice requirement (30 Days, 60 Days, 90 Days) |
| `Coupon` | bit | NOT NULL, DEFAULT 0 | Whether coupon is used |
| `CreatedOn` | datetime2 | NOT NULL, DEFAULT SYSUTCDATETIME() | Creation timestamp |
| `CreatedBy` | uniqueidentifier | NULL | Creator stakeholder ID |
| `ModifiedOn` | datetime2 | NULL | Last modification timestamp |
| `ModifiedBy` | uniqueidentifier | NULL | Last modifier stakeholder ID |
| `IsActive` | bit | NOT NULL, DEFAULT 1 | Soft deletion flag |

**Indexes**:
- Primary Key: `PK_cor_BillingInformation` on `BillingInformationID`
- Foreign Keys:
  - `FK_cor_BillingInformation_Community` → `cor_Communities(CommunityID)`
  - `FK_cor_BillingInformation_BillingFrequency` → `cor_DynamicDropChoices(ChoiceID)`
  - `FK_cor_BillingInformation_NoticeRequirement` → `cor_DynamicDropChoices(ChoiceID)`
- Check Constraints:
  - `CK_cor_BillingInformation_BillingMonth` ensures month is 1-12
  - `CK_cor_BillingInformation_BillingDay` ensures day is 1-31
- Index: `IX_cor_BillingInformation_CommunityID` on `CommunityID`

**Relationships**:
- References: `cor_Communities` via `CommunityID`
- References: `cor_DynamicDropChoices` via `BillingFrequencyID` and `NoticeRequirementID`

----

### 9. `cor_BoardInformation`

**Purpose**: Stores board meeting and governance information for each community.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `BoardInformationID` | uniqueidentifier | PK, DEFAULT NEWID() | Primary key |
| `CommunityID` | uniqueidentifier | NOT NULL, FK → cor_Communities | Associated community |
| `AnnualMeetingFrequency` | nvarchar(100) | NULL | Frequency of annual meetings |
| `RegularMeetingFrequency` | nvarchar(100) | NULL | Frequency of regular board meetings |
| `BoardMembersRequired` | int | NULL | Number of board members required |
| `Quorum` | int | NULL | Quorum requirement for meetings |
| `TermLimits` | nvarchar(200) | NULL | Term limit information |
| `CreatedOn` | datetime2 | NOT NULL, DEFAULT SYSUTCDATETIME() | Creation timestamp |
| `CreatedBy` | uniqueidentifier | NULL | Creator stakeholder ID |
| `ModifiedOn` | datetime2 | NULL | Last modification timestamp |
| `ModifiedBy` | uniqueidentifier | NULL | Last modifier stakeholder ID |
| `IsActive` | bit | NOT NULL, DEFAULT 1 | Soft deletion flag |

**Indexes**:
- Primary Key: `PK_cor_BoardInformation` on `BoardInformationID`
- Foreign Keys:
  - `FK_cor_BoardInformation_Community` → `cor_Communities(CommunityID)`
- Index: `IX_cor_BoardInformation_CommunityID` on `CommunityID`

**Relationships**:
- References: `cor_Communities` via `CommunityID`

----

## Key Design Patterns

### 1. **GUID Primary Keys**
All tables use `uniqueidentifier` (GUID) as primary keys with `DEFAULT NEWID()`.

### 2. **Soft Deletion**
All tables use `IsActive` bit field for soft deletion instead of physical deletion.

### 3. **Audit Fields**
All tables include:
- `CreatedOn` (datetime2, auto-set)
- `CreatedBy` (uniqueidentifier, nullable)
- `ModifiedOn` (datetime2, nullable)
- `ModifiedBy` (uniqueidentifier, nullable)

### 4. **Multi-Tenant Architecture**
- **Master DB**: Organization and user account management
- **Client DB**: Client-specific operational data
- Users link via `sec_UserAccounts.StakeholderID` → `cor_Stakeholders.StakeholderID`

### 5. **Dynamic Dropdowns**
- Centralized in `cor_DynamicDropChoices` using `GroupID` for organization
- System-managed choices marked with `IsSystemManaged = 1`

---

## Database Relationships

```
Master Database (hoa_nexus_master)
├── cor_Organizations
│   ├── sec_UserAccounts (OrganizationID)
│   └── cor_OrganizationSettings (OrganizationID)
│
└── sec_UserAccounts
    └── StakeholderID → Client DB: cor_Stakeholders

Client Database (hoa_nexus_testclient)
├── cor_DynamicDropChoices
│   ├── Referenced by: cor_Communities (5 FK fields)
│   └── Referenced by: cor_ManagementFees (FeeTypeID)
│
├── cor_Stakeholders
│   ├── CommunityID → cor_Communities
│   └── Referenced by: Master DB: sec_UserAccounts.StakeholderID
│
├── cor_Communities
│   ├── 5 FK fields → cor_DynamicDropChoices
│   ├── Referenced by: cor_Stakeholders.CommunityID
│   ├── Referenced by: cor_ManagementFees.CommunityID
│   ├── Referenced by: cor_BillingInformation.CommunityID
│   └── Referenced by: cor_BoardInformation.CommunityID
│
├── cor_ManagementFees
│   ├── CommunityID → cor_Communities
│   └── FeeTypeID → cor_DynamicDropChoices
│
├── cor_BillingInformation
│   ├── CommunityID → cor_Communities
│   └── BillingFrequencyID → cor_DynamicDropChoices
│
└── cor_BoardInformation
    └── CommunityID → cor_Communities
```

---

## Notes

- This schema represents the **current production structure** as of the last update date
- For future table additions, see `TableScheme.md` (archival reference document)
- All tables follow consistent naming conventions: `cor_*` (core), `sec_*` (security)
- Foreign keys use GUID references for flexibility and multi-database support

