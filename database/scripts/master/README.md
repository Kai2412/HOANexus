# Master Database Scripts

## Overview
This folder contains scripts for creating and managing the master database (`hoa_nexus_master`), which handles multi-tenant organization and user account management.

## Files

### `create-master-database.sql`
**Purpose**: Creates the master database with organization and user account tables.

**What it does**:
- Creates `hoa_nexus_master` database
- Creates core tables:
  - `cor_Organizations` - Client organizations and their database mappings
  - `sec_UserAccounts` - All user accounts across all organizations
  - `cor_OrganizationSettings` - Client-specific configuration settings
- Inserts a test organization pointing to `hoa_nexus_testclient`

**Status**: ✅ Complete and ready to use

### `seed-admin-user.sql`
**Purpose**: Creates the first admin user for local development.

**What it does**:
1. Ensures test organization exists in master database
2. Creates admin stakeholder in client database (`hoa_nexus_testclient`)
3. Provides instructions for creating UserAccount (requires bcrypt password hashing via backend)

**Default Credentials** (after backend setup):
- Email: `admin@hoanexus.local`
- Password: `Admin123!` (must change on first login)

**Status**: ✅ Complete and ready to use

## Database Structure

### `cor_Organizations`
Stores all client organizations and their database mappings.

**Key Fields**:
- `OrganizationID` (uniqueidentifier, PK)
- `OrganizationName` (nvarchar(255))
- `DatabaseName` (nvarchar(100), UNIQUE) - e.g., 'hoa_nexus_testclient'
- `Subdomain` (nvarchar(100), UNIQUE) - e.g., 'testclient' for testclient.hoanexus.com
- `IsActive` (bit)

### `sec_UserAccounts`
Stores all user accounts across all organizations.

**Key Fields**:
- `UserAccountID` (uniqueidentifier, PK)
- `OrganizationID` (FK to cor_Organizations)
- `Username` (nvarchar(255), UNIQUE) - Email address
- `Email` (nvarchar(255), UNIQUE) - Must equal Username
- `PasswordHash` (nvarchar(255)) - bcrypt hashed
- `StakeholderID` (uniqueidentifier, nullable) - Link to client DB stakeholder
- `MustChangePassword` (bit) - Force password change on first login
- `IsActive` (bit)
- `AccountLocked` (bit)

### `cor_OrganizationSettings`
Stores client-specific configuration settings.

**Key Fields**:
- `SettingID` (uniqueidentifier, PK)
- `OrganizationID` (FK to cor_Organizations)
- `SettingKey` (nvarchar(100)) - e.g., 'theme_color', 'logo_url'
- `SettingValue` (nvarchar(max))
- `SettingType` (nvarchar(50)) - 'string', 'number', 'boolean', 'json'

## Usage

1. **Create Master Database**: Run `create-master-database.sql`
2. **Seed Admin User**: Run `seed-admin-user.sql` (then use backend API to create UserAccount with bcrypt password)
3. **Create Client Databases**: Use `../clients/create-client-database.sql` for each new client

## Notes

- Master database is separate from client databases
- Each organization has its own client database
- User accounts are stored in master DB but link to stakeholders in client DBs
- Password hashing must be done via backend (bcrypt) - cannot be done in SQL

