# Dynamic Feature Permissions System - Design Document

## Overview
Allow each organization (client) to customize which stakeholder types can access which features, replacing hardcoded permission logic with database-driven rules.

## Why This Makes Sense

✅ **Multi-Tenant Ready:** Each organization can have different rules  
✅ **Scalable:** Easy to add new features without code changes  
✅ **Flexible:** Clients can customize to their needs  
✅ **Admin-Friendly:** Non-technical users can manage permissions  
✅ **Performance:** Can be cached effectively  

## Core Features to Control

1. **Directory** - Stakeholder directory access
2. **Forms** - Community assignment forms, etc.
3. **My Tickets** - Ticket management
4. **Reports** - Reporting features
5. **Admin** - Admin portal access

## Database Design

### Table: `cor_FeaturePermissions` (in client database)

```sql
CREATE TABLE dbo.cor_FeaturePermissions (
    PermissionID        uniqueidentifier NOT NULL 
        CONSTRAINT PK_cor_FeaturePermissions PRIMARY KEY DEFAULT NEWID(),
    FeatureName        varchar(50) NOT NULL,  -- 'Directory', 'Forms', 'Tickets', 'Reports', 'Admin'
    StakeholderTypeID  uniqueidentifier NULL,  -- FK to cor_DynamicDropChoices (Type)
    SubTypeID          uniqueidentifier NULL,  -- FK to cor_DynamicDropChoices (SubType)
    AccessLevelID      uniqueidentifier NULL,  -- FK to cor_DynamicDropChoices (AccessLevel)
    IsAllowed          bit NOT NULL DEFAULT 1,  -- true = allow, false = deny
    Priority           int NOT NULL DEFAULT 100, -- Lower = higher priority (for rule conflicts)
    IsDefault          bit NOT NULL DEFAULT 0,  -- Default rule for organization
    IsActive           bit NOT NULL DEFAULT 1,
    CreatedOn          datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy          uniqueidentifier NULL,
    ModifiedOn         datetime2 NULL,
    ModifiedBy         uniqueidentifier NULL
);
```

### Rule Matching Logic

**Priority Order:**
1. Most specific match wins (Type + SubType + AccessLevel)
2. Then Type + SubType
3. Then Type + AccessLevel
4. Then Type only
5. Then default rule

**Example Rules:**
```
Feature: Directory
- Company Employee + Admin = ALLOW (Priority 10)
- Company Employee = ALLOW (Priority 20)
- Resident = ALLOW (Priority 30)
- Default = DENY (Priority 100)
```

## Performance Strategy

### 1. **Caching**
- Cache permission rules per organization in memory
- Invalidate cache when rules change
- Cache user's effective permissions in JWT (refresh on login)

### 2. **Rule Evaluation**
- Pre-compute permission matrix on login
- Store in JWT: `{ features: { Directory: true, Forms: false, ... } }`
- Frontend checks JWT, no API call needed

### 3. **Database Indexes**
```sql
CREATE INDEX IX_cor_FeaturePermissions_FeatureTypeSubType
ON cor_FeaturePermissions(FeatureName, StakeholderTypeID, SubTypeID, AccessLevelID)
WHERE IsActive = 1;
```

## Implementation Approach

### Phase 1: Database & Backend
1. Create `cor_FeaturePermissions` table
2. Create default rules for each organization
3. Create permission evaluation service
4. Update JWT to include feature permissions
5. Create API endpoints for managing rules

### Phase 2: Admin UI
1. Add "Feature Permissions" section to Admin portal
2. UI to create/edit/delete rules
3. Visual rule builder (Type → SubType → AccessLevel)
4. Preview: "Who can access this feature?"

### Phase 3: Frontend Integration
1. Update menu visibility based on JWT permissions
2. Add route guards for protected features
3. Show/hide buttons based on permissions

## Default Rules (Sensible Starting Point)

### Directory
- Company Employee (all) = ALLOW
- Resident = ALLOW
- Default = DENY

### Forms
- Company Employee + Admin = ALLOW
- Company Employee + Full = ALLOW
- Default = DENY

### My Tickets
- Everyone = ALLOW (users see their own tickets)

### Reports
- Company Employee + Admin = ALLOW
- Company Employee + Full = ALLOW
- Default = DENY

### Admin
- Company Employee + Admin = ALLOW
- Default = DENY

## Rule Examples

### Company A: "Only Company Employees see Directory"
```
Feature: Directory
Type: Company Employee
SubType: NULL (any)
AccessLevel: NULL (any)
IsAllowed: true
Priority: 20

Feature: Directory
Type: NULL (default)
IsAllowed: false
Priority: 100
```

### Company B: "Everyone sees Directory"
```
Feature: Directory
Type: NULL (default)
IsAllowed: true
Priority: 100
```

### Company C: "Residents and Company Employees, but not Vendors"
```
Feature: Directory
Type: Resident
IsAllowed: true
Priority: 20

Feature: Directory
Type: Company Employee
IsAllowed: true
Priority: 20

Feature: Directory
Type: Vendor
IsAllowed: false
Priority: 20

Feature: Directory
Type: NULL (default)
IsAllowed: false
Priority: 100
```

## API Endpoints

### Get User Permissions
```
GET /api/permissions/my-permissions
Returns: { Directory: true, Forms: false, Tickets: true, Reports: false, Admin: false }
```

### Manage Rules (Admin only)
```
GET    /api/permissions/rules?feature=Directory
POST   /api/permissions/rules
PUT    /api/permissions/rules/:id
DELETE /api/permissions/rules/:id
```

### Preview Rules
```
GET /api/permissions/preview?feature=Directory
Returns: List of stakeholder types that would have access
```

## Migration Strategy

### Option A: Gradual (Recommended)
1. Add permission system alongside existing hardcoded logic
2. Default rules match current behavior
3. Allow admins to customize
4. Remove hardcoded logic later

### Option B: All-at-once
1. Build entire system
2. Migrate all organizations
3. Remove hardcoded logic
4. Riskier but cleaner

## Complexity Management

### ✅ What Makes This Manageable:
1. **Caching:** Rules evaluated once per login, stored in JWT
2. **Defaults:** Sensible defaults mean most orgs won't need customization
3. **UI:** Visual rule builder makes it easy
4. **Priority System:** Handles conflicts automatically

### ⚠️ Potential Issues:
1. **Rule Conflicts:** Solved with priority system
2. **Performance:** Solved with caching
3. **Complexity:** Solved with good UI and defaults

## Next Steps

1. **Design the UI** - Rule builder interface
2. **Create migration script** - Default rules for existing orgs
3. **Build backend service** - Permission evaluation logic
4. **Update JWT** - Include feature permissions
5. **Update frontend** - Use permissions from JWT
6. **Build admin UI** - Rule management interface

## Questions to Answer

1. **Granularity:** Just feature-level, or also action-level (view/edit/delete)?
   - **Recommendation:** Start with feature-level, add action-level later if needed

2. **Community-Level Permissions:** Should permissions vary by community?
   - **Recommendation:** Start organization-wide, add community-level later if needed

3. **Inheritance:** Should rules inherit from parent organization?
   - **Recommendation:** No for now, keep it simple

4. **Audit Trail:** Track who changed permissions?
   - **Recommendation:** Yes - CreatedBy/ModifiedBy already in schema

