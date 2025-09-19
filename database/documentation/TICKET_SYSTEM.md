# HOA Nexus - Universal Ticket System

## 🎯 Core Concept
Every form submission = A ticket. Each ticket type has its own table for specific data, but all share universal ticket fields and a common notes system.

## 📋 Universal Ticket Fields
**Every ticket table must include these standard fields:**

```sql
-- Universal Ticket Fields (add to every ticket table)
TicketNumber VARCHAR(20) NOT NULL UNIQUE,        -- ASG-001, MNT-002, etc.
Status VARCHAR(20) NOT NULL DEFAULT 'Pending',   -- Pending, Hold, InProgress, Completed, Rejected
Priority VARCHAR(20) NOT NULL DEFAULT 'Normal',  -- Normal, Urgent, Emergency
CreatedOn DATETIME DEFAULT GETDATE(),
CreatedBy INT NOT NULL,                          -- FK to cor_Stakeholders
ModifiedOn DATETIME DEFAULT GETDATE(),
ModifiedBy INT NOT NULL,                         -- FK to cor_Stakeholders
```

## 🏷️ Ticket Prefixes Registry
**Reserved prefixes - DO NOT reuse:**

| Prefix | Ticket Type | Description | Filter Category |
|--------|-------------|-------------|-----------------|
| ASG | Assignment Request | Community role assignments | Management |
| MNT | Maintenance Request | Property maintenance issues | Operations |
| BAR | Bank Account Request | New bank account setup | Accounting |
| GLC | GL Code Request | New general ledger codes | Accounting |
| EXP | Expense Report | Employee expense submissions | Accounting |
| VIO | Violation Appeal | HOA violation appeals | Compliance |
| VEN | Vendor Request | New vendor onboarding | Operations |
| RES | Resident Request | New resident onboarding | Operations |
| WOR | Work Order | Maintenance work orders | Operations |
| INS | Insurance Claim | Insurance related tickets | Accounting |
| LEG | Legal Issue | Legal matters and disputes | Compliance |
| COM | Complaint | Resident complaints | Operations |
| EVE | Event Request | Community event requests | Operations |
| ACC | Access Request | Gate/amenity access requests | Operations |
| BUD | Budget Request | Budget modification requests | Accounting |
| CON | Contract Request | New contract requests | Management |

## 📊 Ticket Filter Categories
**Organized by business function:**

### **Management**
- Assignment Request (ASG)
- Contract Request (CON)

### **Operations** 
- Maintenance Request (MNT)
- Work Order (WOR)
- Vendor Request (VEN)
- Resident Request (RES)
- Complaint (COM)
- Event Request (EVE)
- Access Request (ACC)

### **Accounting**
- Bank Account Request (BAR)
- GL Code Request (GLC)
- Expense Report (EXP)
- Insurance Claim (INS)
- Budget Request (BUD)

### **Compliance**
- Violation Appeal (VIO)
- Legal Issue (LEG)

## 💬 Universal Notes System
**Single table for ALL ticket notes/comments:**

```sql
CREATE TABLE cor_TicketNotes (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    TicketType VARCHAR(50) NOT NULL,              -- 'AssignmentRequest', 'MaintenanceRequest', etc.
    TicketID INT NOT NULL,                        -- ID of the specific ticket record
    NoteText NVARCHAR(MAX) NOT NULL,
    IsInternal BIT DEFAULT 0,                     -- 0 = Public, 1 = Internal/Staff only
    CreatedOn DATETIME DEFAULT GETDATE(),
    CreatedBy INT NOT NULL,                       -- FK to cor_Stakeholders
    
    FOREIGN KEY (CreatedBy) REFERENCES cor_Stakeholders(ID),
    INDEX IX_TicketNotes_Ticket (TicketType, TicketID)
);
```

## 🔢 Auto-Numbering System
**Format: PREFIX-NUMBER (computed from table ID)**

Auto-generated using computed columns - no extra tables or functions needed!

```sql
-- Example: Assignment Requests
TicketNumber AS ('ASG-' + RIGHT('000' + CAST(ID AS VARCHAR(3)), 3)) PERSISTED

-- Results:
-- ID: 1   → TicketNumber: ASG-001
-- ID: 15  → TicketNumber: ASG-015  
-- ID: 156 → TicketNumber: ASG-156
```

## 📊 Standard Status Values
**Default statuses (can be customized per ticket type if needed):**

- **Pending** - Just submitted, awaiting review
- **Hold** - Waiting for additional information
- **InProgress** - Being actively worked on
- **Completed** - Successfully finished
- **Rejected** - Denied/cancelled

## 🎯 Implementation Pattern

### 1. Create Ticket Table
```sql
CREATE TABLE cor_[TicketName] (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    TicketNumber AS ('[PREFIX]-' + RIGHT('000' + CAST(ID AS VARCHAR(3)), 3)) PERSISTED,
    
    -- Universal Ticket Fields
    Status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    Priority VARCHAR(20) NOT NULL DEFAULT 'Normal',
    CreatedOn DATETIME DEFAULT GETDATE(),
    CreatedBy INT NOT NULL,
    ModifiedOn DATETIME DEFAULT GETDATE(),
    ModifiedBy INT NOT NULL,
    
    -- Ticket-Specific Fields
    [CustomField1] [DataType],
    [CustomField2] [DataType],
    -- etc.
    
    FOREIGN KEY (CreatedBy) REFERENCES cor_Stakeholders(ID),
    FOREIGN KEY (ModifiedBy) REFERENCES cor_Stakeholders(ID)
);
```

### 2. Form Submission Flow
```sql
-- 1. Insert main ticket record
INSERT INTO cor_[TicketName] (...) VALUES (...)

-- 2. Insert initial notes as first comment
INSERT INTO cor_TicketNotes (TicketType, TicketID, NoteText, CreatedBy)
VALUES ('[TicketName]', @NewTicketID, @NotesText, @UserID)
```

### 3. Frontend Pattern
- Form submits to ticket table
- Initial form notes become first note in cor_TicketNotes
- "My Tickets" overlay reads all ticket types for user
- Individual ticket view shows notes from cor_TicketNotes
- Status updates trigger ModifiedOn/ModifiedBy

## 🔍 Query Examples

### Get all tickets for a user
```sql
-- Would need UNION for each ticket type
SELECT 'AssignmentRequest' as TicketType, TicketNumber, Status, CreatedOn 
FROM cor_AssignmentRequests WHERE CreatedBy = @UserID
UNION ALL
SELECT 'MaintenanceRequest' as TicketType, TicketNumber, Status, CreatedOn 
FROM cor_MaintenanceRequests WHERE CreatedBy = @UserID
```

### Get notes for a ticket
```sql
SELECT * FROM cor_TicketNotes 
WHERE TicketType = 'AssignmentRequest' AND TicketID = @TicketID
ORDER BY CreatedOn ASC
```

## 🚀 Performance & Scalability Strategy

### **Frontend Pagination & Filtering**
```typescript
interface TicketListRequest {
  page: number;              // Page number (1-based)
  pageSize: number;          // Items per page (default 25)
  search?: string;           // Search term
  status?: string[];         // Filter by status
  priority?: string[];       // Filter by priority
  category?: string[];       // Filter by category (Management, Operations, etc.)
  ticketType?: string[];     // Filter by specific ticket types
  communityId?: number[];    // Filter by communities
  dateFrom?: string;         // Date range filter
  dateTo?: string;           // Date range filter
  sortBy?: 'created' | 'modified' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
}

interface TicketListResponse {
  tickets: Ticket[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
```

### **Database Query Strategy**
```sql
-- Optimized query with indexes and pagination
SELECT TOP(@PageSize) 
  t.ID, t.TicketNumber, t.Status, t.Priority, t.CreatedOn, t.ModifiedOn,
  c.Name as CommunityName, c.PCode as CommunityCode,
  s.FirstName + ' ' + s.LastName as CreatedByName
FROM (
  -- Union all ticket types with standardized columns
  SELECT 'AssignmentRequest' as TicketType, ID, TicketNumber, Status, Priority, 
         CreatedOn, ModifiedOn, CommunityID, CreatedBy,
         'Community Assignment' as Title
  FROM cor_AssignmentRequests
  WHERE CreatedBy = @UserID OR CommunityID IN @UserCommunities
  
  UNION ALL
  
  SELECT 'MaintenanceRequest' as TicketType, ID, TicketNumber, Status, Priority,
         CreatedOn, ModifiedOn, CommunityID, CreatedBy,
         'Maintenance Issue' as Title  
  FROM cor_MaintenanceRequests
  WHERE CreatedBy = @UserID OR CommunityID IN @UserCommunities
  
  -- Add more ticket types as needed...
) t
LEFT JOIN cor_Communities c ON t.CommunityID = c.ID  
LEFT JOIN cor_Stakeholders s ON t.CreatedBy = s.ID
WHERE t.ID NOT IN (
  SELECT TOP(@Offset) ID FROM TicketUnion ORDER BY CreatedOn DESC
)
ORDER BY t.CreatedOn DESC;
```

### **Required Database Indexes**
```sql
-- Performance indexes for ticket queries
CREATE INDEX IX_AssignmentRequests_UserCommunity 
ON cor_AssignmentRequests (CreatedBy, CommunityID, CreatedOn DESC);

CREATE INDEX IX_AssignmentRequests_Status 
ON cor_AssignmentRequests (Status, Priority, CreatedOn DESC);

-- Similar indexes for each ticket type table
```

### **Frontend Virtual Scrolling**
- **Load 25-50 tickets initially**
- **Infinite scroll** or pagination
- **Virtual rendering** for 1000+ tickets
- **Debounced search** (300ms delay)
- **Cached filters** in localStorage

### **Customizable Ticket Cards**
Each ticket type displays relevant quick-view information:

#### **Assignment Request (ASG)**
- Role badge (Regional Director, Community Manager, On-site Manager, Manager in Training, etc.)
- Effective date
- Color: Blue theme

#### **Maintenance Request (MNT)**
- Location badge (Pool Area, Clubhouse)
- Urgency badge (High=Red, Medium=Yellow, Low=Gray)
- Color: Green theme

#### **Violation Appeal (VIO)**
- Violation type badge (Parking, Landscaping)
- Color: Orange theme

#### **Bank Account Request (BAR)**
- Account type badge (Checking, Savings)
- Bank name
- Color: Purple theme

#### **Work Order (WOR)**
- Contractor name
- Estimated cost badge
- Color: Green theme

#### **Complaint (COM)**
- Issue type badge (Noise, Property Damage)
- Color: Red theme

#### **Expense Report (EXP)**
- Amount badge
- Expense type
- Color: Indigo theme

### **Real-time Updates**
- **WebSocket connection** for status changes
- **Optimistic updates** for user actions
- **Background refresh** every 30 seconds
- **Push notifications** for assigned tickets

## ✅ Benefits
- **Simple** - Easy to understand and implement
- **Consistent** - Same fields across all ticket types
- **Scalable** - Handles thousands of tickets with pagination
- **Unified** - Single notes system for all tickets
- **Trackable** - Full audit trail with created/modified fields
- **Performant** - Optimized queries and frontend rendering
- **Flexible** - Category-based filtering system

---
*Last Updated: December 2024*
