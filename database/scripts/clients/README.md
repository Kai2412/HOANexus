# Client Database Scripts

## Overview
This folder contains scripts for creating and seeding client databases (e.g., `hoa_nexus_testclient`).

## Files

### `create-client-database.sql`
**Purpose**: Creates the client database template with all core tables and default dropdown choices.

**What it does**:
- Creates `hoa_nexus_testclient` database (template for all future clients)
- Creates core tables:
  - `cor_DynamicDropChoices` (with GroupID structure)
  - `cor_Stakeholders`
  - `cor_Communities`
- Inserts all default dropdown choices organized by GroupID

**Updated**: Now uses `GroupID` structure (matches current database) instead of old `TableName`/`ColumnName` structure.

### `insert-test-communities.sql`
**Purpose**: Test data for development - inserts sample communities.

**Status**: Keep for testing purposes.

### `insert-stakeholder-dropdowns.sql`
**Purpose**: Previously used to insert stakeholder dropdown choices.

**Status**: ⚠️ **DEPRECATED** - All stakeholder dropdowns are now included in `create-client-database.sql`. This file uses the old `TableName`/`ColumnName` structure and is no longer needed.

**Action**: Can be removed or kept for historical reference.

## Dynamic Drop Choices Structure

The `cor_DynamicDropChoices` table uses a **GroupID-based** structure:

### Table Schema
- `ChoiceID` (uniqueidentifier, PK)
- `GroupID` (varchar(100)) - Groups related choices (e.g., 'client-types', 'status')
- `ChoiceValue` (varchar(150)) - Display text
- `DisplayOrder` (int) - Sort order
- `IsDefault` (bit) - Default selection
- `IsActive` (bit) - Soft deletion
- `IsSystemManaged` (bit) - System-managed choices (cannot be edited)
- `CreatedOn`, `CreatedBy`, `ModifiedOn`, `ModifiedBy` - Audit fields

### Default Groups Included

#### Community Groups
- `client-types` - HOA, Condominium, Commercial, etc.
- `service-types` - Full Service, Hybrid, Accounting Only, Compliance Only
- `management-types` - Portfolio, Onsite, Hybrid
- `development-stages` - Homeowner Controlled, Declarant Controlled
- `acquisition-types` - Organic, Acquisition

#### Stakeholder Groups
- `stakeholder-types` - Resident, Staff, Vendor, Other (System-Managed)
- `stakeholder-subtypes-resident` - Owner, Family Member, Guest
- `stakeholder-subtypes-staff` - Community Management, Accounting, IT, etc.
- `stakeholder-subtypes-vendor` - Contractors, Service Providers, Suppliers
- `preferred-contact-methods` - Email, Phone, Mobile, Text, Mail
- `status` - Active, Inactive, Pending, Suspended
- `access-levels` - None, View, View+Write, View+Write+Delete (System-Managed)

#### Ticket System Groups
- `ticket-statuses` - Pending, InProgress, Hold, Completed, Rejected

## Notes

- All dropdown choices are inserted only if the table is empty (idempotent)
- System-managed choices (`IsSystemManaged = 1`) should not be edited via UI
- When adding new groups, follow the naming convention: `kebab-case` (e.g., `client-types`, not `clientTypes`)

