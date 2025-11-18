# Login System Documentation

## Overview

The HOA Nexus login system implements a multi-tenant architecture with separate authentication (master database) and user data (client databases). This document describes the current implementation and architecture.

**Version:** 1.0 (Initial Implementation)  
**Last Updated:** 2025-11-17

---

## Architecture

### Database Structure

#### Master Database (`hoa_nexus_master`)
- **`sec_UserAccounts`**: Stores authentication credentials and login information
  - `UserAccountID` (GUID, PK)
  - `OrganizationID` (GUID, FK to `cor_Organizations`)
  - `Username` (Email address, UNIQUE)
  - `Email` (UNIQUE)
  - `PasswordHash` (bcrypt hashed)
  - `StakeholderID` (GUID, nullable - links to client DB stakeholder)
  - `MustChangePassword` (bit)
  - `TempPasswordExpiry` (datetime2)
  - `IsActive` (bit - soft delete flag)
  - `LastLoginDate`, `FailedLoginAttempts`, `AccountLocked`

#### Client Database (per organization, e.g., `hoa_nexus_testclient`)
- **`cor_Stakeholders`**: Stores user profile and access information
  - `StakeholderID` (GUID, PK)
  - `Email` (UNIQUE when `PortalAccessEnabled = 1`)
  - `PortalAccessEnabled` (bit)
  - `Status` (nvarchar - must be 'Active' to login)
  - `IsActive` (bit - soft delete flag)
  - Other profile fields (FirstName, LastName, Type, SubType, AccessLevel, etc.)

### Key Relationships

1. **One-to-One**: `sec_UserAccounts.StakeholderID` → `cor_Stakeholders.StakeholderID`
2. **Many-to-One**: `sec_UserAccounts.OrganizationID` → `cor_Organizations.OrganizationID`
3. **Email Uniqueness**: Enforced in both databases
   - Master DB: `UQ_sec_UserAccounts_Email` constraint
   - Client DB: Filtered unique index on `Email` where `PortalAccessEnabled = 1`

---

## Authentication Flow

### Login Process

1. **User submits credentials** (email/username + password)
2. **Backend queries master database** (`sec_UserAccounts`) by email
3. **Password verification** using bcrypt
4. **Fetch stakeholder data** from client database using `StakeholderID`
5. **Validation checks**:
   - `PortalAccessEnabled = 1` (required)
   - `Status = 'Active'` (required, all other statuses block login)
   - `IsActive = 1` (stakeholder not soft-deleted)
6. **Generate JWT token** containing:
   - `userId` (UserAccountID)
   - `stakeholderId` (StakeholderID)
   - `organizationId` (OrganizationID)
   - `databaseName` (from `cor_Organizations`)
7. **Return token** to client

### Login Validation Rules

| Condition | Result |
|-----------|--------|
| Email not found in `sec_UserAccounts` | ❌ 401 Unauthorized |
| Password incorrect | ❌ 401 Unauthorized |
| `PortalAccessEnabled = 0` | ❌ 401 "Portal access is not enabled" |
| `Status != 'Active'` | ❌ 401 "Account access is restricted" |
| `IsActive = 0` (stakeholder) | ❌ 401 (stakeholder not found) |
| All checks pass | ✅ 200 OK + JWT token |

---

## Portal Access Management

### Enabling Portal Access

When `PortalAccessEnabled` is set to `true` for a stakeholder:

1. **Email validation**: Email must be provided and unique
2. **Check for existing UserAccount**:
   - By `StakeholderID` (reactivate if found)
   - By `Email` (link if unlinked account exists)
3. **Create new UserAccount** if none exists:
   - Generate temporary password (8-12 characters, alphanumeric + special)
   - Hash password with bcrypt
   - Set `MustChangePassword = 1`
   - Set `TempPasswordExpiry` (7 days from creation)
   - Link to stakeholder via `StakeholderID`
4. **Log temp password** to console (dev environment)
5. **Email notification** (placeholder - to be implemented)

### Disabling Portal Access

When `PortalAccessEnabled` is set to `false`:

1. **Find UserAccount** by `StakeholderID`
2. **Soft-delete account**: Set `IsActive = 0`
3. **User cannot login** (login checks `PortalAccessEnabled`)

### Reactivating Portal Access

When portal access is re-enabled:

1. **Check for existing UserAccount** (including inactive)
2. **Reactivate account**: Set `IsActive = 1`
3. **Update email** if it changed
4. **User can login** with existing password (or reset if expired)

---

## Email Management

### Email Uniqueness Rules

1. **Master Database**: Email must be unique across all `sec_UserAccounts`
2. **Client Database**: Email must be unique for stakeholders with `PortalAccessEnabled = 1`

### Email Change Process

When a stakeholder's email is updated:

1. **Validation**:
   - Check master DB for existing email (error if linked to different stakeholder)
   - Check client DB for existing email with portal access (error if different stakeholder)
2. **If portal access enabled**:
   - Update `sec_UserAccounts.Email` and `Username`
   - If no UserAccount exists, create one
3. **If portal access disabled**:
   - No action (UserAccount may not exist)

### Error Handling

- **409 Conflict**: Email already in use by another account
- **400 Bad Request**: Email required when enabling portal access

---

## Password Management

### Initial Password

- **Auto-generated** when UserAccount is created
- **Format**: 8-12 characters, alphanumeric + special characters
- **Expiry**: 7 days from creation (`TempPasswordExpiry`)
- **Required change**: `MustChangePassword = 1`

### Password Change Flow

1. **User logs in** with temp password
2. **System detects** `MustChangePassword = 1`
3. **Modal appears** (cannot be dismissed)
4. **User enters**:
   - Current password
   - New password (with validation)
5. **Backend validates**:
   - Current password correct
   - New password meets requirements
6. **Update password**:
   - Hash new password
   - Set `MustChangePassword = 0`
   - Clear `TempPasswordExpiry`
   - Set `PasswordLastChanged`

### Password Requirements

- Minimum length: 8 characters
- Must contain: uppercase, lowercase, number, special character
- Cannot be empty

---

## Soft Delete Behavior

### Stakeholder Soft Delete

When a stakeholder is soft-deleted (`IsActive = 0`):

1. **Deactivate UserAccount**: Set `IsActive = 0` in master DB
2. **Login blocked**: Stakeholder not found (already filtered by `IsActive = 1`)

### UserAccount Soft Delete

When a UserAccount is soft-deleted (`IsActive = 0`):

1. **Login blocked**: Account not found (filtered by `IsActive = 1`)
2. **Can be reactivated**: If portal access is re-enabled

---

## Status Field Behavior

The `Status` field in `cor_Stakeholders` controls login access:

| Status Value | Login Allowed |
|--------------|---------------|
| `'Active'` | ✅ Yes |
| `'Inactive'` | ❌ No |
| `'Pending'` | ❌ No |
| `'Suspended'` | ❌ No |
| `NULL` | ✅ Yes (treated as active) |

**Note**: Only `'Active'` status allows login. All other statuses are treated as restricted access.

---

## API Endpoints

### Authentication

- **POST `/api/auth/login`**
  - Body: `{ email, password }`
  - Returns: `{ success, token, user, mustChangePassword }`

- **PUT `/api/auth/change-password`** (protected)
  - Body: `{ currentPassword, newPassword }`
  - Returns: `{ success, message }`

### Stakeholder Management

- **POST `/api/stakeholders`** (protected)
  - Creates stakeholder
  - Auto-creates UserAccount if `PortalAccessEnabled = true`

- **PUT `/api/stakeholders/:id`** (protected)
  - Updates stakeholder
  - Handles portal access toggle
  - Handles email changes
  - Manages UserAccount lifecycle

- **DELETE `/api/stakeholders/:id`** (protected)
  - Soft-deletes stakeholder
  - Deactivates UserAccount

---

## UserAccount Model Methods

### Core Methods

- `create(userData)` - Create new UserAccount
- `findByEmail(email)` - Find active account by email
- `findByEmailIncludingInactive(email)` - Find account (any status) by email
- `findByStakeholderId(stakeholderId, includeInactive)` - Find account by stakeholder
- `updatePassword(userAccountId, newPassword)` - Update password
- `updateEmail(userAccountId, newEmail)` - Update email/username
- `linkToStakeholder(userAccountId, stakeholderId)` - Link account to stakeholder
- `reactivate(userAccountId)` - Reactivate soft-deleted account
- `deactivate(userAccountId)` - Soft-delete account

---

## Development Notes

### Temp Password Logging

In development, temporary passwords are logged to the console when UserAccounts are created:

```
========================================
NEW USER ACCOUNT CREATED
========================================
Email: user@example.com
Temp Password: TempPass123!
Stakeholder ID: {guid}
========================================
```

### Email Notifications

Currently, email notifications are **not implemented**. The system logs temp passwords to console for development purposes. In production, implement an email service to send:
- Account creation notification with temp password
- Password reset links (future feature)

---

## Future Enhancements

### Planned Features

1. **Email Service Integration**
   - Send account creation emails
   - Send password reset emails
   - Send account status change notifications

2. **Password Reset Flow**
   - Forgot password endpoint
   - Reset token generation
   - Token expiry handling

3. **Account Lockout**
   - Implement `FailedLoginAttempts` logic
   - Lock account after N failed attempts
   - Unlock mechanism (admin or time-based)

4. **Session Management**
   - Track active sessions
   - Logout endpoint
   - Session timeout

5. **Multi-Factor Authentication (MFA)**
   - TOTP support
   - SMS verification
   - Email verification codes

6. **Audit Logging**
   - Login attempts (success/failure)
   - Password changes
   - Account status changes
   - Access log tracking

---

## Security Considerations

### Current Security Measures

1. **Password Hashing**: bcrypt with configurable rounds
2. **JWT Tokens**: Signed tokens with expiration
3. **Email Uniqueness**: Enforced at database level
4. **Soft Deletes**: Preserve data while blocking access
5. **Status Validation**: Multiple layers of access control

### Best Practices

1. **Never log passwords** (except temp passwords in dev)
2. **Always validate** email uniqueness before creating accounts
3. **Check multiple conditions** before allowing login
4. **Use soft deletes** to preserve audit trail
5. **Log security events** for monitoring

---

## Troubleshooting

### Common Issues

**Issue**: User cannot login after portal access enabled
- **Check**: `PortalAccessEnabled = 1` in `cor_Stakeholders`
- **Check**: `Status = 'Active'` in `cor_Stakeholders`
- **Check**: `IsActive = 1` in both tables
- **Check**: UserAccount exists and is linked correctly

**Issue**: Email already in use error
- **Check**: Master DB for existing `sec_UserAccounts` with email
- **Check**: Client DB for stakeholders with `PortalAccessEnabled = 1` and same email
- **Solution**: Change email on existing account first

**Issue**: Temp password not working
- **Check**: `TempPasswordExpiry` hasn't passed
- **Check**: Password was copied correctly (no extra spaces)
- **Solution**: Admin can reset password or create new account

---

## Database Schema References

See:
- `database/scripts/create-master-database.sql` - Master DB schema
- `database/scripts/create-client-database.sql` - Client DB schema

---

## Related Documentation

- [Multi-Tenant Architecture](./MultiTenant-Architecture.md) (if exists)
- [API Documentation](../backend/README.md)
- [Database Schema](./TableScheme.md)

---

**Document Maintainer**: Development Team  
**Review Cycle**: Quarterly or when major changes are made

