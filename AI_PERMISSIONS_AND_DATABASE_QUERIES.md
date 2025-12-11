# AI Permissions & Database Queries - Design Document

**Purpose**: Enable AI to query database while enforcing permissions  
**Status**: Foundation Design - Ready to Implement

---

## 🎯 **Core Concept**

**The Problem**: 
- "Who are the board members for SR-214?" → Sensitive (managers/directors only)
- "What's the address of SR-214?" → Public (everyone can see)

**The Solution**:
1. **Permission-Aware Query Layer**: Check permissions BEFORE executing queries
2. **Data Classification**: Mark data as Public, Restricted, or Sensitive
3. **Function Calling**: Claude calls database functions (tools) with permission checks
4. **Graceful Degradation**: Return "I don't have access to that information" instead of errors

---

## 📊 **Data Classification System**

### **Public Data** (Everyone can see)
- Community name, address, property code
- Community status (Active/Inactive)
- Basic community info (city, state, zip)
- Public documents (governing docs, public notices)

### **Restricted Data** (Company Employees, Board Members)
- Management fees
- Billing information
- Fee structures
- Financial documents (invoices, statements)

### **Sensitive Data** (Managers/Directors/Executives only)
- Board member information
- Board meeting minutes
- Executive decisions
- Internal communications
- Personal stakeholder information

---

## 🔐 **Permission Matrix**

| Data Type | Resident | Board Member | Community Employee | Company Employee (Partial) | Company Employee (Full) | Company Employee (Admin) |
|-----------|----------|-------------|-------------------|---------------------------|------------------------|-------------------------|
| **Public** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Restricted** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Sensitive** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |

**Rules**:
- **Residents**: Public only
- **Board Members**: Public + Restricted (their community)
- **Community Employees**: Public + Restricted (their community)
- **Company Employees (Partial)**: Public + Restricted (all communities)
- **Company Employees (Full)**: Public + Restricted + Sensitive (all communities)
- **Company Employees (Admin)**: Everything (all communities)

---

## 🏗️ **Architecture: Permission-Aware Query Layer**

### **Layer 1: AI Service** (Current)
- Receives user question
- Determines intent (document query vs database query)
- Calls appropriate service

### **Layer 2: Permission Service** (NEW)
- Checks user permissions for requested data
- Returns permission level (public/restricted/sensitive)
- Filters query results based on permissions

### **Layer 3: Database Query Service** (NEW)
- Executes database queries
- Returns raw data
- No permission logic (handled by Layer 2)

### **Layer 4: Function Calling** (NEW)
- Claude calls database functions as "tools"
- Each function has permission requirements
- Permission check happens before function execution

---

## 🔧 **Implementation Plan**

### **Phase 1: Foundation (Now)**

#### **1.1 Create Permission Service**
```javascript
// backend/src/services/ai/permissionService.js
class PermissionService {
  // Check if user can access data type
  canAccessDataType(user, dataType) {
    // dataType: 'public', 'restricted', 'sensitive'
    // Returns: true/false
  }
  
  // Get user's permission level
  getUserPermissionLevel(user) {
    // Returns: 'public', 'restricted', or 'sensitive'
  }
  
  // Filter results based on permissions
  filterResults(results, user, dataType) {
    // Remove fields user can't see
  }
}
```

#### **1.2 Create Database Query Service**
```javascript
// backend/src/services/ai/databaseQueryService.js
class DatabaseQueryService {
  // Query communities (public data)
  async getCommunityInfo(communityId, user) {
    // Check permissions
    // Query database
    // Filter results
    // Return
  }
  
  // Query board members (sensitive data)
  async getBoardMembers(communityId, user) {
    // Check permissions (sensitive)
    // If no permission: return null
    // Query database
    // Return
  }
  
  // Query management fees (restricted data)
  async getManagementFees(communityId, user) {
    // Check permissions (restricted)
    // Query database
    // Return
  }
}
```

#### **1.3 Update AI Service to Use Function Calling**
```javascript
// backend/src/services/ai/aiService.js
// Add Claude function calling (tools)
const tools = [
  {
    name: 'get_community_info',
    description: 'Get basic community information (name, address, etc.)',
    input_schema: {
      type: 'object',
      properties: {
        communityId: { type: 'string' }
      }
    },
    permission_required: 'public'
  },
  {
    name: 'get_board_members',
    description: 'Get board member information for a community',
    input_schema: {
      type: 'object',
      properties: {
        communityId: { type: 'string' }
      }
    },
    permission_required: 'sensitive'
  },
  {
    name: 'get_management_fees',
    description: 'Get management fee information for a community',
    input_schema: {
      type: 'object',
      properties: {
        communityId: { type: 'string' }
      }
    },
    permission_required: 'restricted'
  }
];
```

---

### **Phase 2: Function Calling Implementation**

#### **2.1 How It Works**
1. User asks: "Who are the board members for SR-214?"
2. AI detects intent: Database query needed
3. AI calls `get_board_members` function
4. **Permission check happens BEFORE query**
5. If no permission: Return "I don't have access to that information"
6. If permission: Execute query, return results
7. AI formats response for user

#### **2.2 Example Flow**
```
User: "Who are the board members for SR-214?"
  ↓
AI: [Calls get_board_members(communityId: "SR-214")]
  ↓
PermissionService: Check user permission for 'sensitive' data
  ↓
If NO permission:
  → Return: { error: "insufficient_permissions" }
  → AI responds: "I don't have access to board member information. 
                  Please contact your manager or director for this information."
  ↓
If YES permission:
  → DatabaseQueryService: Query cor_BoardInformation
  → Return: { boardMembers: [...] }
  → AI responds: "The board members for SR-214 are: ..."
```

---

## 📝 **Database Query Functions (Initial Set)**

### **Public Data Functions**

#### `get_community_info(communityId)`
- **Permission**: Public (everyone)
- **Returns**: Name, address, property code, status
- **SQL**: `SELECT DisplayName, Address, PropertyCode, Active FROM cor_Communities WHERE CommunityID = ?`

#### `get_community_address(communityId)`
- **Permission**: Public (everyone)
- **Returns**: Full address
- **SQL**: `SELECT Address, Address2, City, State, Zipcode FROM cor_Communities WHERE CommunityID = ?`

### **Restricted Data Functions**

#### `get_management_fees(communityId)`
- **Permission**: Restricted (Company Employees, Board Members)
- **Returns**: Management fee amount, frequency
- **SQL**: `SELECT FeeAmount, FeeFrequency FROM cor_ManagementFees WHERE CommunityID = ?`

#### `get_billing_information(communityId)`
- **Permission**: Restricted
- **Returns**: Billing frequency, notice requirements
- **SQL**: `SELECT * FROM cor_BillingInformation WHERE CommunityID = ?`

### **Sensitive Data Functions**

#### `get_board_members(communityId)`
- **Permission**: Sensitive (Managers/Directors/Executives only)
- **Returns**: Board member names, titles, contact info
- **SQL**: `SELECT * FROM cor_BoardInformation WHERE CommunityID = ?`

#### `get_stakeholder_info(stakeholderId)`
- **Permission**: Sensitive (varies by stakeholder type)
- **Returns**: Personal information
- **SQL**: `SELECT * FROM cor_Stakeholders WHERE StakeholderID = ?`

---

## 🛡️ **Permission Check Implementation**

### **Permission Service Logic**
```javascript
canAccessDataType(user, dataType) {
  const userLevel = this.getUserPermissionLevel(user);
  
  const permissionMatrix = {
    'public': ['public', 'restricted', 'sensitive'],
    'restricted': ['restricted', 'sensitive'],
    'sensitive': ['sensitive']
  };
  
  return permissionMatrix[userLevel]?.includes(dataType) || false;
}

getUserPermissionLevel(user) {
  if (user.type === 'Company Employee') {
    if (user.accessLevel === 'Admin' || user.accessLevel === 'Full') {
      return 'sensitive';
    }
    return 'restricted';
  }
  
  if (user.type === 'Board Member' || user.type === 'Community Employee') {
    return 'restricted';
  }
  
  return 'public'; // Residents, Vendors, etc.
}
```

---

## 🎨 **User Experience**

### **Scenario 1: Resident asks about board members**
```
User: "Who are the board members for SR-214?"
AI: "I don't have access to board member information. 
     Please contact your community manager or board president for this information."
```

### **Scenario 2: Manager asks about board members**
```
User: "Who are the board members for SR-214?"
AI: "The board members for SR-214 (Astatica Hills) are:
     - John Smith (President)
     - Jane Doe (Vice President)
     - Bob Johnson (Treasurer)
     ..."
```

### **Scenario 3: Resident asks about address**
```
User: "What's the address of SR-214?"
AI: "The address for SR-214 (Astatica Hills) is:
     123 Main Street
     City, State 12345"
```

---

## 🚀 **Implementation Steps**

### **Step 1: Create Permission Service** (30 min)
- Create `permissionService.js`
- Implement `canAccessDataType()`
- Implement `getUserPermissionLevel()`
- Test with different user types

### **Step 2: Create Database Query Service** (1 hour)
- Create `databaseQueryService.js`
- Implement 3-5 basic query functions
- Add permission checks to each function
- Test queries

### **Step 3: Add Function Calling to AI Service** (2 hours)
- Update `aiService.js` to support Claude function calling
- Define function schemas
- Implement function execution
- Test with AI

### **Step 4: Test & Refine** (1 hour)
- Test with different user types
- Test permission denials
- Refine error messages
- Add more query functions as needed

---

## 📋 **Query Functions to Build (Priority Order)**

### **Phase 1: Essential (Start Here)**
1. ✅ `get_community_info` - Public
2. ✅ `get_community_address` - Public
3. ✅ `get_management_fees` - Restricted
4. ✅ `get_board_members` - Sensitive

### **Phase 2: Financial (Next)**
5. `get_billing_information` - Restricted
6. `get_fee_structure` - Restricted
7. `get_invoice_summary` - Restricted

### **Phase 3: Advanced (Later)**
8. `get_stakeholder_info` - Sensitive
9. `get_property_info` - Restricted
10. `get_community_statistics` - Restricted

---

## 🔄 **Integration with Current System**

### **Current Flow**:
```
User Question → AI Service → RAG Service → Document Search → Response
```

### **New Flow**:
```
User Question → AI Service → Intent Detection
  ├─ Document Query → RAG Service → Document Search → Response
  └─ Database Query → Permission Check → Database Query Service → Response
```

### **Hybrid Flow** (Both):
```
User Question → AI Service → Intent Detection
  ├─ Document Query → RAG Service
  └─ Database Query → Permission Check → Database Query Service
  → Combine Results → Response
```

---

## ✅ **Benefits of This Approach**

1. **Security First**: Permissions checked before any query
2. **Extensible**: Easy to add new query functions
3. **User-Friendly**: Clear error messages, no technical errors
4. **Scalable**: Can add more data types and permissions later
5. **Maintainable**: Permission logic centralized

---

## 🎯 **Next Steps**

1. **Start with Foundation**: Build permission service + 3-4 basic query functions
2. **Test with Demo**: Use demo account (full permissions) to test functionality
3. **Add Permissions**: Once working, add permission checks
4. **Iterate**: Add more query functions as needed

**Ready to start?** Let's build the foundation first, then add permissions layer.

