# Current Database Schema

**Last Updated**: 2025-12-01  
**Database Architecture**: Multi-tenant with Master + Client databases

## Overview

This document describes the **actual current tables** in the HOA Nexus system. There are **17 core tables** across 2 databases:

- **Master Database** (`hoa_nexus_master`): 3 tables for multi-tenant organization and user management
- **Client Database** (`hoa_nexus_testclient`): 13 tables for client-specific data

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
- **Fee Management**: `commitment-types` (for hybrid fees: Manager Monthly, Lifestyle Monthly, Assistant Monthly, Fixed Compensation)

**Relationships**:
- Referenced by: `cor_Communities` (ClientTypeID, ServiceTypeID, ManagementTypeID, DevelopmentStageID, AcquisitionTypeID)
- Referenced by: `cor_ManagementFees` (FeeTypeID)
- Referenced by: `cor_BillingInformation` (BillingFrequencyID, NoticeRequirementID)
- Referenced by: `cor_CommitmentFees` (CommitmentTypeID)

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

### 10. `cor_FeeMaster`

**Purpose**: Master catalog of standard fees used across all communities.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `FeeMasterID` | uniqueidentifier | PK, DEFAULT NEWID() | Primary key |
| `FeeName` | nvarchar(200) | NOT NULL | Fee name (e.g., "Copies", "Envelopes") |
| `DefaultAmount` | decimal(12,2) | NOT NULL | Default fee amount |
| `DisplayOrder` | int | NOT NULL, DEFAULT 0 | Sort order for display |
| `IsActive` | bit | NOT NULL, DEFAULT 1 | Soft deletion flag |
| `CreatedOn` | datetime2 | NOT NULL, DEFAULT SYSUTCDATETIME() | Creation timestamp |
| `CreatedBy` | uniqueidentifier | NULL | Creator stakeholder ID |
| `ModifiedOn` | datetime2 | NULL | Last modification timestamp |
| `ModifiedBy` | uniqueidentifier | NULL | Last modifier stakeholder ID |

**Indexes**:
- Primary Key: `PK_cor_FeeMaster` on `FeeMasterID`
- Index: `IX_cor_FeeMaster_DisplayOrder` on `(DisplayOrder, IsActive)`

**Relationships**:
- Referenced by: `cor_CommunityFeeVariances.FeeMasterID`

**Seed Data**: Populated with 23 standard fees including Copies, Envelopes, Coupons, Handling fees, Postage, Tax Return, etc.

----

### 11. `cor_CommunityFeeVariances`

**Purpose**: Allows communities to override master fees or mark them as "Not Billed" or "Custom".

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `CommunityFeeVarianceID` | uniqueidentifier | PK, DEFAULT NEWID() | Primary key |
| `CommunityID` | uniqueidentifier | NOT NULL, FK → cor_Communities | Associated community |
| `FeeMasterID` | uniqueidentifier | NOT NULL, FK → cor_FeeMaster | Master fee being overridden |
| `VarianceType` | nvarchar(50) | NOT NULL, CHECK | Type: 'Standard', 'Not Billed', 'Custom' |
| `CustomAmount` | decimal(12,2) | NULL, CHECK | Custom amount (required if VarianceType = 'Custom') |
| `Notes` | nvarchar(500) | NULL | Additional notes |
| `IsActive` | bit | NOT NULL, DEFAULT 1 | Soft deletion flag |
| `CreatedOn` | datetime2 | NOT NULL, DEFAULT SYSUTCDATETIME() | Creation timestamp |
| `CreatedBy` | uniqueidentifier | NULL | Creator stakeholder ID |
| `ModifiedOn` | datetime2 | NULL | Last modification timestamp |
| `ModifiedBy` | uniqueidentifier | NULL | Last modifier stakeholder ID |

**Indexes**:
- Primary Key: `PK_cor_CommunityFeeVariances` on `CommunityFeeVarianceID`
- Foreign Keys:
  - `FK_cor_CommunityFeeVariances_Community` → `cor_Communities(CommunityID)`
  - `FK_cor_CommunityFeeVariances_FeeMaster` → `cor_FeeMaster(FeeMasterID)`
- Check Constraints:
  - `CK_cor_CommunityFeeVariances_VarianceType` ensures value is 'Standard', 'Not Billed', or 'Custom'
  - `CK_cor_CommunityFeeVariances_CustomAmount` ensures CustomAmount is NOT NULL when VarianceType = 'Custom'
- Unique: `UQ_cor_CommunityFeeVariances_Community_Fee` on `(CommunityID, FeeMasterID)` WHERE `IsActive = 1`
- Index: `IX_cor_CommunityFeeVariances_CommunityID` on `CommunityID`
- Index: `IX_cor_CommunityFeeVariances_FeeMasterID` on `FeeMasterID`

**Relationships**:
- References: `cor_Communities` via `CommunityID`
- References: `cor_FeeMaster` via `FeeMasterID`

**Business Logic**:
- **Standard**: Uses master fee default amount
- **Not Billed**: Fee is not charged to this community
- **Custom**: Uses `CustomAmount` instead of default

----

### 12. `cor_CommitmentFees`

**Purpose**: Tracks HOA commitment fees by commitment type (hybrid fees). Each community can have multiple fees per commitment type.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `CommitmentFeeID` | uniqueidentifier | PK, DEFAULT NEWID() | Primary key |
| `CommunityID` | uniqueidentifier | NOT NULL, FK → cor_Communities | Associated community |
| `CommitmentTypeID` | uniqueidentifier | NOT NULL, FK → cor_DynamicDropChoices | Commitment type (e.g., "Manager Monthly", "Lifestyle Monthly") |
| `EntryType` | nvarchar(50) | NOT NULL, DEFAULT 'Compensation', CHECK | Type: 'Compensation' (has Value) or 'Commitment' (no Value) |
| `FeeName` | nvarchar(200) | NOT NULL | Fee/commitment name |
| `Value` | decimal(12,2) | NULL | Amount (required if EntryType = 'Compensation') |
| `Notes` | nvarchar(500) | NULL | Additional notes |
| `IsActive` | bit | NOT NULL, DEFAULT 1 | Soft deletion flag |
| `CreatedOn` | datetime2 | NOT NULL, DEFAULT SYSUTCDATETIME() | Creation timestamp |
| `CreatedBy` | uniqueidentifier | NULL | Creator stakeholder ID |
| `ModifiedOn` | datetime2 | NULL | Last modification timestamp |
| `ModifiedBy` | uniqueidentifier | NULL | Last modifier stakeholder ID |

**Indexes**:
- Primary Key: `PK_cor_CommitmentFees` on `CommitmentFeeID`
- Foreign Keys:
  - `FK_cor_CommitmentFees_Community` → `cor_Communities(CommunityID)`
  - `FK_cor_CommitmentFees_CommitmentType` → `cor_DynamicDropChoices(ChoiceID)`
- Check Constraints:
  - `CK_cor_CommitmentFees_EntryType` ensures value is 'Compensation' or 'Commitment'
- Index: `IX_cor_CommitmentFees_CommunityID` on `CommunityID`
- Index: `IX_cor_CommitmentFees_CommitmentTypeID` on `CommitmentTypeID`

**Relationships**:
- References: `cor_Communities` via `CommunityID`
- References: `cor_DynamicDropChoices` via `CommitmentTypeID` (GroupID = 'commitment-types')

**Business Logic**:
- Fees are grouped by `CommitmentTypeID` for display
- **Compensation** (`EntryType = 'Compensation'`): 
  - `Value` is **REQUIRED** and must be a valid decimal number
  - Represents monetary compensation (e.g., "$5,000/month")
- **Commitment** (`EntryType = 'Commitment'`): 
  - `Value` is **NULL** (not used)
  - Represents a commitment description without monetary value (e.g., "40 hours manager time")
- Validation: Backend enforces that `Value` is required for Compensation entries and must be NULL for Commitment entries

----

### 13. `cor_Folders`

**Purpose**: Stores folder structure for file organization. Supports Community, Corporate, and Global folder types.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `FolderID` | uniqueidentifier | PK, DEFAULT NEWID() | Primary key |
| `CommunityID` | uniqueidentifier | NULL, FK → cor_Communities | NULL = Corporate/Global folder, NOT NULL = Community folder |
| `ParentFolderID` | uniqueidentifier | NULL, FK → cor_Folders | NULL = root folder, NOT NULL = subfolder |
| `FolderName` | nvarchar(255) | NOT NULL | Folder name |
| `FolderPath` | nvarchar(1000) | NULL | Full path (e.g., "/Invoices/2024/January") |
| `FolderType` | nvarchar(50) | NOT NULL, DEFAULT 'Community', CHECK | Type: 'Community', 'Corporate', or 'Global' |
| `DisplayOrder` | int | NOT NULL, DEFAULT 0 | Sort order for display |
| `IsActive` | bit | NOT NULL, DEFAULT 1 | Soft deletion flag |
| `CreatedOn` | datetime2 | NOT NULL, DEFAULT SYSUTCDATETIME() | Creation timestamp |
| `CreatedBy` | uniqueidentifier | NULL | Creator stakeholder ID |
| `ModifiedOn` | datetime2 | NULL | Last modification timestamp |
| `ModifiedBy` | uniqueidentifier | NULL | Last modifier stakeholder ID |

**Indexes**:
- Primary Key: `PK_cor_Folders` on `FolderID`
- Foreign Keys:
  - `FK_cor_Folders_Community` → `cor_Communities(CommunityID)` (nullable)
  - `FK_cor_Folders_ParentFolder` → `cor_Folders(FolderID)` (self-referencing)
- Check Constraints:
  - `CK_cor_Folders_FolderType` ensures value is 'Community', 'Corporate', or 'Global'
  - `CK_cor_Folders_FolderType_CommunityID` ensures Community folders have CommunityID, Corporate/Global do not
- Index: `IX_cor_Folders_CommunityID` on `CommunityID`
- Index: `IX_cor_Folders_ParentFolderID` on `ParentFolderID`
- Index: `IX_cor_Folders_FolderType` on `FolderType`

**Relationships**:
- References: `cor_Communities` via `CommunityID` (optional, NULL for Corporate/Global folders)
- Self-referencing: `ParentFolderID` → `cor_Folders(FolderID)`
- Referenced by: `cor_Files.FolderID`

**Business Logic**:
- **Community Folders**: `FolderType = 'Community'`, `CommunityID IS NOT NULL` - specific to one community (created in Admin panel)
- **Corporate Folders**: `FolderType = 'Corporate'`, `CommunityID IS NULL` - organization-wide, for mass imports/exports and corporate storage (created in Corporate FileBrowser)
- **Global Folders**: `FolderType = 'Global'`, `CommunityID IS NULL` - visible to all communities (created in Admin panel, legacy)
- **Root Folders**: `ParentFolderID IS NULL` - top-level folders
- **Subfolders**: `ParentFolderID = parentFolderID` - nested folders
- Corporate and Community folders/files are completely separated and never mix

----

### 14. `cor_Files`

**Purpose**: Stores file metadata. Actual files are stored in blob storage (Azurite for local dev, Azure Blob Storage for production).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `FileID` | uniqueidentifier | PK, DEFAULT NEWID() | Primary key |
| `FolderID` | uniqueidentifier | NULL, FK → cor_Folders | NULL = root level file, NOT NULL = file in folder |
| `CommunityID` | uniqueidentifier | NULL, FK → cor_Communities | NULL = Corporate file, NOT NULL = Community file |
| `FileName` | nvarchar(255) | NOT NULL | Original filename |
| `FileNameStored` | nvarchar(255) | NOT NULL | Filename as stored (with GUID or sanitized) |
| `FilePath` | nvarchar(1000) | NOT NULL | Full path to file in blob storage |
| `FileSize` | bigint | NOT NULL | Size in bytes |
| `FolderType` | nvarchar(50) | NOT NULL, DEFAULT 'Community', CHECK | Type: 'Community' or 'Corporate' |
| `MimeType` | nvarchar(100) | NULL | MIME type (e.g., "application/pdf", "image/jpeg") |
| `FileType` | nvarchar(50) | NULL | File type category (e.g., "invoice", "document", "image") |
| `IsActive` | bit | NOT NULL, DEFAULT 1 | Soft deletion flag |
| `CreatedOn` | datetime2 | NOT NULL, DEFAULT SYSUTCDATETIME() | Creation timestamp |
| `CreatedBy` | uniqueidentifier | NULL | Creator stakeholder ID |
| `ModifiedOn` | datetime2 | NULL | Last modification timestamp |
| `ModifiedBy` | uniqueidentifier | NULL | Last modifier stakeholder ID |
| `IsIndexed` | bit | NOT NULL, DEFAULT 0 | Document indexing status (for AI/RAG) |
| `LastIndexedDate` | datetime2 | NULL | When file was last indexed |
| `IndexingVersion` | int | NULL, DEFAULT 1 | Version of indexing logic used |
| `FileHash` | nvarchar(64) | NULL | SHA-256 hash of file content (for change detection) |
| `IndexingError` | nvarchar(MAX) | NULL | Error message if indexing failed |
| `ChunkCount` | int | NULL, DEFAULT 0 | Number of text chunks created during indexing |
| `ForceReindex` | bit | NOT NULL, DEFAULT 0 | Admin flag to force re-indexing |

**Indexes**:
- Primary Key: `PK_cor_Files` on `FileID`
- Foreign Keys:
  - `FK_cor_Files_Folder` → `cor_Folders(FolderID)` (nullable)
  - `FK_cor_Files_Community` → `cor_Communities(CommunityID)` (nullable)
- Check Constraints:
  - `CK_cor_Files_FolderType` ensures value is 'Community' or 'Corporate'
  - `CK_cor_Files_FolderType_CommunityID` ensures Community files have CommunityID, Corporate files can optionally have CommunityID (for linked files)
- Index: `IX_cor_Files_FolderID` on `FolderID`
- Index: `IX_cor_Files_CommunityID` on `CommunityID`
- Index: `IX_cor_Files_FolderType` on `FolderType`
- Index: `IX_cor_Files_FileType` on `FileType`
- Index: `IX_cor_Files_IsIndexed` on `IsIndexed` (filtered, WHERE IsIndexed = 0)
- Index: `IX_cor_Files_FileHash` on `FileHash` (filtered, WHERE FileHash IS NOT NULL)

**Relationships**:
- References: `cor_Folders` via `FolderID` (optional, NULL for root-level files)
- References: `cor_Communities` via `CommunityID` (optional, NULL for Corporate files)

**Business Logic**:
- Files are **hard deleted** (not soft deleted) - both database record and blob storage file are removed
- **Community Files**: `FolderType = 'Community'`, `CommunityID IS NOT NULL` - tied to a specific community
- **Corporate Files**: `FolderType = 'Corporate'`, `CommunityID IS NULL` or `CommunityID IS NOT NULL` - organization-wide storage. Corporate files can optionally have a `CommunityID` to link them to specific communities (e.g., management fee invoices) while still being stored in Corporate folders
- Files can be at root level (`FolderID IS NULL`) or in a folder (`FolderID = folderID`)
- Supported file types: PDFs, Images, Documents
- File size limit: 25-30MB per file
- Corporate and Community files are completely separated and never mix
- **Document Indexing**: PDF files can be indexed for AI document search (RAG - Retrieval Augmented Generation)
  - `IsIndexed` tracks if file has been processed
  - `FileHash` (SHA-256) detects content changes to avoid unnecessary re-indexing
  - `IndexingError` stores error messages for failed indexing attempts
  - `ForceReindex` allows admins to manually trigger re-indexing

----

### 15. `cor_Invoices`

**Purpose**: Invoice header/master records. Simple snapshot-based system for proof-of-concept invoice generation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `InvoiceID` | uniqueidentifier | PK, DEFAULT NEWID() | Primary key |
| `CommunityID` | uniqueidentifier | NOT NULL, FK → cor_Communities | Associated community |
| `InvoiceNumber` | varchar(50) | NOT NULL, UNIQUE | Global invoice number (e.g., "INV-2025-0001") |
| `InvoiceDate` | date | NOT NULL | Date invoice was created |
| `Total` | decimal(12,2) | NOT NULL | Sum of all charges |
| `Status` | varchar(50) | NOT NULL, DEFAULT 'Draft' | Invoice status (Draft, Sent, Paid, Overdue, Cancelled, Void) |
| `FileID` | uniqueidentifier | NULL, FK → cor_Files | Link to generated PDF file |
| `CreatedOn` | datetime2 | NOT NULL, DEFAULT SYSUTCDATETIME() | Creation timestamp |
| `CreatedBy` | uniqueidentifier | NULL | Creator stakeholder ID |
| `ModifiedOn` | datetime2 | NULL | Last modification timestamp |
| `ModifiedBy` | uniqueidentifier | NULL | Last modifier stakeholder ID |

**Indexes**:
- Primary Key: `PK_cor_Invoices` on `InvoiceID`
- Foreign Keys:
  - `FK_cor_Invoices_Community` → `cor_Communities(CommunityID)`
  - `FK_cor_Invoices_File` → `cor_Files(FileID)`
- Unique: `UQ_cor_Invoices_InvoiceNumber` on `InvoiceNumber`
- Index: `IX_cor_Invoices_CommunityID` on `CommunityID`
- Index: `IX_cor_Invoices_InvoiceDate` on `InvoiceDate`
- Index: `IX_cor_Invoices_Status` on `Status`

**Relationships**:
- References: `cor_Communities` via `CommunityID`
- References: `cor_Files` via `FileID` (optional, links to PDF)
- Referenced by: `cor_InvoiceCharges.InvoiceID`

**Business Logic**:
- Invoice numbers are globally unique (INV-YYYY-#### format)
- Total is calculated from sum of all associated charges
- FileID links to the generated PDF stored in file storage
- Status tracks invoice lifecycle (Draft → Sent → Paid)

----

### 16. `cor_InvoiceCharges`

**Purpose**: Individual line items on invoices. Snapshot-based (stores description and amount as text/decimal, no foreign keys to fee tables).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `InvoiceChargeID` | uniqueidentifier | PK, DEFAULT NEWID() | Primary key |
| `InvoiceID` | uniqueidentifier | NOT NULL, FK → cor_Invoices | Parent invoice |
| `Description` | varchar(200) | NOT NULL | Line item description (snapshot of fee name) |
| `Amount` | decimal(12,2) | NOT NULL | Charge amount |
| `DisplayOrder` | int | NOT NULL, DEFAULT 0 | Order on invoice |
| `CreatedOn` | datetime2 | NOT NULL, DEFAULT SYSUTCDATETIME() | Creation timestamp |
| `CreatedBy` | uniqueidentifier | NULL | Creator stakeholder ID |
| `ModifiedOn` | datetime2 | NULL | Last modification timestamp |
| `ModifiedBy` | uniqueidentifier | NULL | Last modifier stakeholder ID |

**Indexes**:
- Primary Key: `PK_cor_InvoiceCharges` on `InvoiceChargeID`
- Foreign Key: `FK_cor_InvoiceCharges_Invoice` → `cor_Invoices(InvoiceID)` ON DELETE CASCADE
- Index: `IX_cor_InvoiceCharges_InvoiceID` on `InvoiceID`
- Index: `IX_cor_InvoiceCharges_DisplayOrder` on `(InvoiceID, DisplayOrder)`

**Relationships**:
- References: `cor_Invoices` via `InvoiceID`
- Charges are deleted when invoice is deleted (CASCADE)

**Business Logic**:
- Snapshot-based: stores description and amount as-is at time of invoice creation
- No foreign keys to fee tables (ManagementFees, FeeMaster, CommitmentFees)
- DisplayOrder controls line item order on invoice
- Amounts are summed to calculate invoice Total

-----

### 17. `cor_FinancialData`

**Purpose**: Stores extracted structured financial data from monthly financial statement PDFs. Used for financial analysis, budget recommendations, and collection rate tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `FinancialDataID` | uniqueidentifier | PK, DEFAULT NEWID() | Primary key |
| `CommunityID` | uniqueidentifier | NOT NULL, FK → cor_Communities | Associated community |
| `FileID` | uniqueidentifier | NULL, FK → cor_Files | Link to source PDF file |
| `StatementDate` | date | NOT NULL | Date from statement (end of month) |
| `StatementMonth` | int | NOT NULL, CHECK (1-12) | Month (1-12) |
| `StatementYear` | int | NOT NULL | Year (e.g., 2025) |
| `IncomeData` | nvarchar(MAX) | NULL | JSON: assessments, interest, late fees, etc. |
| `ExpenseData` | nvarchar(MAX) | NULL | JSON: categories (General/Admin, Maintenance, Reserve) |
| `BalanceSheetData` | nvarchar(MAX) | NULL | JSON: assets, liabilities, equity, fund balances |
| `TotalIncome` | decimal(12,2) | NULL | Total income for the month |
| `TotalExpenses` | decimal(12,2) | NULL | Total expenses for the month |
| `NetIncome` | decimal(12,2) | NULL | Net income (Income - Expenses) |
| `YTDIncome` | decimal(12,2) | NULL | Year-to-date total income |
| `YTDExpenses` | decimal(12,2) | NULL | Year-to-date total expenses |
| `YTDNetIncome` | decimal(12,2) | NULL | Year-to-date net income |
| `AssessmentIncome` | decimal(12,2) | NULL | Total assessments billed (YTD) |
| `AssessmentCollected` | decimal(12,2) | NULL | Total assessments collected (YTD) |
| `CollectionRate` | decimal(5,4) | NULL, CHECK (0-1) | Collection rate (0.9600 = 96%) |
| `ExtractedOn` | datetime2 | NOT NULL, DEFAULT SYSUTCDATETIME() | When data was extracted |
| `ExtractionVersion` | int | NULL, DEFAULT 1 | Version of extraction logic used |
| `ExtractionError` | nvarchar(MAX) | NULL | Error message if extraction failed |
| `CreatedOn` | datetime2 | NOT NULL, DEFAULT SYSUTCDATETIME() | Creation timestamp |
| `CreatedBy` | uniqueidentifier | NULL | Creator stakeholder ID |
| `ModifiedOn` | datetime2 | NULL | Last modification timestamp |
| `ModifiedBy` | uniqueidentifier | NULL | Last modifier stakeholder ID |
| `IsActive` | bit | NOT NULL, DEFAULT 1 | Soft delete flag |

**Indexes**:
- Primary Key: `PK_cor_FinancialData` on `FinancialDataID`
- Foreign Keys:
  - `FK_cor_FinancialData_Community` → `cor_Communities(CommunityID)`
  - `FK_cor_FinancialData_File` → `cor_Files(FileID)`
- Index: `IX_cor_FinancialData_CommunityID` on `CommunityID`
- Index: `IX_cor_FinancialData_Date` on `(StatementYear, StatementMonth)`
- Index: `IX_cor_FinancialData_FileID` on `FileID` (filtered, WHERE FileID IS NOT NULL)
- Unique: `UQ_cor_FinancialData_Community_Date` on `(CommunityID, StatementYear, StatementMonth)` WHERE `IsActive = 1`

**Relationships**:
- References: `cor_Communities` via `CommunityID`
- References: `cor_Files` via `FileID` (optional, links to source PDF)

**Business Logic**:
- One financial statement per community per month/year (enforced by unique index)
- Data is extracted automatically during PDF indexing if file is detected as financial statement
- JSON fields (`IncomeData`, `ExpenseData`, `BalanceSheetData`) store detailed breakdowns
- Aggregated totals (`TotalIncome`, `TotalExpenses`, etc.) are stored for fast queries without JSON parsing
- Collection rate is calculated from assessment income vs collected amounts
- Extraction errors are logged in `ExtractionError` field for troubleshooting

**JSON Structure Examples**:

**IncomeData**:
```json
{
  "assessments": {
    "monthTotal": 40819.85,
    "ytdTotal": 399866.16,
    "byCommunity": {
      "Cap Rock": 3043.95,
      "Fairways": 4899.50,
      "Grand Mesa": 22045.40
    }
  },
  "interestIncome": { "month": 7047.84, "ytd": 71623.54 },
  "lateFees": { "month": 0.00, "ytd": -27.00 },
  "total": { "month": 47840.69, "ytd": 471372.70 }
}
```

**ExpenseData**:
```json
{
  "generalAdmin": { "month": 0.00, "ytd": 191.45, "categories": {} },
  "maintenance": { "month": 0.00, "ytd": 9299.70, "categories": {} },
  "reserve": { "month": 13535.15, "ytd": 142922.23, "byCommunity": {} },
  "total": { "month": 13535.15, "ytd": 142922.23 }
}
```

-----

## Key Design Patterns

### 1. **GUID Primary Keys**
All tables use `uniqueidentifier` (GUID) as primary keys with `DEFAULT NEWID()`.

### 2. **Soft Deletion**
Most tables use `IsActive` bit field for soft deletion instead of physical deletion. **Exception**: `cor_Files` uses hard deletion (both database record and blob storage file are permanently removed).

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
│   ├── Referenced by: cor_ManagementFees (FeeTypeID)
│   ├── Referenced by: cor_BillingInformation (BillingFrequencyID, NoticeRequirementID)
│   └── Referenced by: cor_CommitmentFees (CommitmentTypeID)
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
│   ├── Referenced by: cor_BoardInformation.CommunityID
│   ├── Referenced by: cor_CommunityFeeVariances.CommunityID
│   ├── Referenced by: cor_CommitmentFees.CommunityID
│   ├── Referenced by: cor_Folders.CommunityID (optional, NULL for global)
│   ├── Referenced by: cor_Files.CommunityID
│   ├── Referenced by: cor_Invoices.CommunityID
│   └── Referenced by: cor_FinancialData.CommunityID
│
├── cor_ManagementFees
│   ├── CommunityID → cor_Communities
│   └── FeeTypeID → cor_DynamicDropChoices
│
├── cor_BillingInformation
│   ├── CommunityID → cor_Communities
│   ├── BillingFrequencyID → cor_DynamicDropChoices
│   └── NoticeRequirementID → cor_DynamicDropChoices
│
├── cor_BoardInformation
│   └── CommunityID → cor_Communities
│
├── cor_FeeMaster
│   └── Referenced by: cor_CommunityFeeVariances.FeeMasterID
│
├── cor_CommunityFeeVariances
│   ├── CommunityID → cor_Communities
│   └── FeeMasterID → cor_FeeMaster
│
├── cor_CommitmentFees
│   ├── CommunityID → cor_Communities
│   └── CommitmentTypeID → cor_DynamicDropChoices
│
├── cor_Folders
│   ├── CommunityID → cor_Communities (optional, NULL for global)
│   └── ParentFolderID → cor_Folders (self-referencing)
│
├── cor_Files
│   ├── FolderID → cor_Folders (optional, NULL for root)
│   └── CommunityID → cor_Communities
│
├── cor_Invoices
│   ├── CommunityID → cor_Communities
│   ├── FileID → cor_Files (PDF link)
│   └── Referenced by: cor_InvoiceCharges.InvoiceID
│
├── cor_InvoiceCharges
│   └── InvoiceID → cor_Invoices
│
└── cor_FinancialData
    ├── CommunityID → cor_Communities
    └── FileID → cor_Files (source PDF link)
```

---

## Notes

- This schema represents the **current production structure** as of the last update date
- For future table additions, see `TableScheme.md` (archival reference document)
- All tables follow consistent naming conventions: `cor_*` (core), `sec_*` (security)
- Foreign keys use GUID references for flexibility and multi-database support

