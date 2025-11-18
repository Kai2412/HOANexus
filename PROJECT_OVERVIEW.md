# HOA Nexus - Project Overview

## 🏗️ Project Structure

### Directory Organization
```
hoa-nexus/
├── backend/                    # Node.js/Express API server
│   ├── src/
│   │   ├── config/            # Database and app configuration
│   │   ├── controllers/       # API route handlers
│   │   ├── middleware/        # Authentication and security
│   │   ├── models/           # Database models and queries
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # Business logic services
│   │   ├── utils/            # Error handling and logging
│   │   └── server.js         # Main server entry point
│   ├── package.json
│   └── package-lock.json
├── frontend/                   # React/TypeScript client
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── AmenitiesInfo/    # Amenity management
│   │   │   ├── CommunityInfo/    # Community details
│   │   │   ├── CommunitySelector/ # Community selection
│   │   │   ├── Directory/        # Stakeholder directory
│   │   │   ├── Forms/           # Form components
│   │   │   ├── Header/          # App header
│   │   │   ├── InformationContainer/ # Main content area
│   │   │   ├── Login/           # Authentication
│   │   │   ├── ManagementTeam/  # Team management
│   │   │   ├── Modal/           # Modal dialogs
│   │   │   ├── PlacesAutocomplete/ # Address input
│   │   │   ├── ResidentInfo/    # Property/resident info
│   │   │   ├── ThemeToggle/     # Dark/light mode
│   │   │   └── Tickets/         # Ticket system
│   │   ├── context/           # React Context providers
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API service layer
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # Utility functions
│   ├── public/               # Static assets
│   ├── package.json
│   └── vite.config.ts
├── database/                  # Database documentation and scripts
│   ├── documentation/        # Schema and system docs
│   └── scripts/             # SQL scripts and migrations
├── shared/                   # Shared types and constants
└── README.md
```

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7.0.0
- **Styling**: Tailwind CSS 3.4.14 with custom theme system
- **UI Components**: Headless UI 2.2.4, Heroicons 2.2.0
- **Routing**: React Router DOM 7.6.2
- **State Management**: React Context API
- **Maps Integration**: Google Maps API (@types/google.maps)
- **Development**: ESLint, TypeScript 5.8.3

### Backend
- **Runtime**: Node.js with Express 4.18.2
- **Database**: Microsoft SQL Server (Azure)
- **Database Driver**: mssql 10.0.1
- **Authentication**: JWT (jsonwebtoken 9.0.2) with bcryptjs 2.4.3
- **Security**: Helmet 7.1.0, CORS 2.8.5, express-rate-limit 7.1.5
- **Environment**: dotenv 16.3.1
- **Development**: nodemon 3.0.2, Jest 29.7.0

### Database
- **Primary Database**: Microsoft SQL Server (Azure)
- **Schema Design**: Comprehensive HOA management schema with 12+ domains
- **Key Features**: Soft deletes, audit trails, relationship tracking

## 🌐 API Architecture

### Base Configuration
- **Base URL**: `/api`
- **Port**: 5001 (backend), 3000 (frontend)
- **Authentication**: JWT Bearer tokens
- **CORS**: Configurable origins
- **Rate Limiting**: Built-in protection

### API Endpoints

#### Authentication (`/api/auth`)
- `POST /login` - User authentication
- `POST /logout` - User logout
- `GET /me` - Get current user (protected)

#### Communities (`/api/communities`)
- `GET /` - Get all communities
- `GET /:id` - Get community by ID
- `GET /:id/stats` - Get community with statistics
- `POST /` - Create new community
- `PUT /:id` - Update community
- `DELETE /:id` - Soft delete community

#### Properties (`/api/properties`)
- `GET /` - Get all properties
- `GET /:id` - Get property by ID
- `GET /community/:id` - Get properties by community
- `POST /` - Create new property
- `PUT /:id` - Update property
- `DELETE /:id` - Soft delete property
- `GET /:id/stakeholders` - Get property with stakeholders

#### Stakeholders (`/api/stakeholders`)
- `GET /` - Get all stakeholders
- `GET /:id` - Get stakeholder by ID
- `GET /search` - Search stakeholders
- `GET /type/:type` - Get stakeholders by type
- `POST /` - Create new stakeholder
- `PUT /:id` - Update stakeholder
- `DELETE /:id` - Soft delete stakeholder
- `GET /:id/properties` - Get stakeholder with properties

#### Amenities (`/api/amenities`)
- `GET /` - Get all amenities
- `GET /:id` - Get amenity by ID
- `GET /community/:id` - Get amenities by community
- `POST /` - Create new amenity
- `PUT /:id` - Update amenity
- `DELETE /:id` - Soft delete amenity

#### Tickets (`/api/tickets`)
- `GET /` - Get all tickets
- `GET /:id` - Get ticket by ID
- `POST /` - Create new ticket
- `PUT /:id` - Update ticket
- `DELETE /:id` - Soft delete ticket

#### Management Team (`/api/management-team`)
- `GET /` - Get management team
- `POST /` - Create team member
- `PUT /:id` - Update team member
- `DELETE /:id` - Remove team member

#### Assignments (`/api/assignments`)
- `GET /requests` - Get assignment requests
- `POST /requests` - Create assignment request
- `PUT /requests/:id` - Update assignment request

### API Response Format
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ },
  "count": 10
}
```

## 🔐 State Management

### Context Providers
The application uses React Context API for state management with the following providers:

#### AuthContext
- **Purpose**: User authentication and authorization
- **State**: User info, authentication status, permissions
- **Features**: Login/logout, permission checking, JWT token management

#### CommunityContext
- **Purpose**: Community selection and management
- **State**: Available communities, selected community, loading states
- **Features**: Community switching, data persistence, auto-selection

#### LoadingContext
- **Purpose**: Global loading state management
- **State**: Loading status, messages, sub-messages
- **Features**: Show/hide loading, custom messages, progress indication

#### ThemeContext
- **Purpose**: Dark/light theme management
- **State**: Current theme, system preference detection
- **Features**: Theme switching, localStorage persistence, system preference detection

### State Flow
1. **Authentication**: AuthContext manages user state globally
2. **Community Selection**: CommunityContext handles community switching
3. **Loading States**: LoadingContext provides global loading management
4. **Theme**: ThemeContext manages UI theme preferences
5. **Local State**: Components use useState for local state management

## 🧩 Component Patterns

### Component Organization
Components are organized by feature with the following patterns:

#### Feature-Based Structure
```
components/
├── FeatureName/
│   ├── FeatureName.tsx      # Main component
│   ├── SubComponent.tsx     # Sub-components
│   └── index.ts            # Barrel exports
```

#### Key Component Patterns

##### 1. Container Components
- **InformationContainer**: Main content area with tab navigation
- **CommunitySelector**: Community selection with search/list modes
- **Header**: App header with user info and actions

##### 2. Information Display Components
- **CommunityInfo**: Community details and statistics
- **ResidentInfo**: Property and resident information
- **AmenitiesInfo**: Community amenities with search and details

##### 3. Form Components
- **Forms**: Form category navigation
- **CommunityAssignmentForm**: Assignment request form
- **AddStakeholder**: Stakeholder creation form

##### 4. Modal Components
- **Modal**: Reusable modal wrapper with Headless UI
- **AmenityDetailsModal**: Amenity information modal
- **ConfirmationModal**: Confirmation dialogs

##### 5. Utility Components
- **ThemeToggle**: Dark/light mode switcher
- **LoadingOverlay**: Global loading indicator
- **ErrorBoundary**: Error handling wrapper

### Component Design Patterns

#### 1. Props Interface Pattern
```typescript
interface ComponentProps {
  data: DataType;
  onAction: (param: string) => void;
  isLoading?: boolean;
}
```

#### 2. Context Hook Pattern
```typescript
const { data, actions } = useContext(ContextName);
```

#### 3. Custom Hook Pattern
```typescript
const useFeature = () => {
  // Custom logic
  return { data, actions };
};
```

#### 4. Error Boundary Pattern
```typescript
<ErrorBoundary>
  <Component />
</ErrorBoundary>
```

## 🗄️ Database Schema Overview

### Core Domain Tables

#### Communities (`cor_Communities`)
- **Purpose**: HOA community information
- **Key Fields**: ID, Pcode, Name, DisplayName, Status, CommunityType
- **Features**: Soft deletes, audit trails, property counts

#### Properties (`cor_Properties`)
- **Purpose**: Individual property units
- **Key Fields**: ID, CommunityID, AddressLine1, PropertyType, Status
- **Features**: Geolocation, property details, stakeholder relationships

#### Stakeholders (`cor_Stakeholders`)
- **Purpose**: All people and organizations
- **Key Fields**: ID, Type, SubType, AccessLevel, Contact info
- **Features**: Role-based access, portal access control

#### Property-Stakeholder Relationships (`cor_PropertyStakeholders`)
- **Purpose**: Property ownership and residency
- **Key Fields**: PropertyID, StakeholderID, RelationshipType, Ownership
- **Features**: Multiple ownership, residency tracking

### Financial Domain
- **Financial Accounts** (`fin_FinancialAccounts`)
- **Fee Schedules** (`fin_FeeSchedules`)
- **Transactions** (`fin_Transactions`)
- **Payment Plans** (`fin_PaymentPlans`)

### Operational Domain
- **Assets** (`op_Assets`)
- **Work Orders** (`op_WorkOrders`)
- **Maintenance Schedules** (`op_MaintenanceSchedules`)
- **Amenities** (`op_Amenities`)
- **Violations** (`op_Violations`)

### Governance Domain
- **Committees** (`gov_Committees`)
- **Meetings** (`gov_Meetings`)
- **Voting Items** (`gov_VotingItems`)
- **Documents** (`gov_Documents`)

### Communication Domain
- **Communications** (`com_Communications`)
- **Community Events** (`com_CommunityEvents`)
- **Notification Preferences** (`com_NotificationPreferences`)

### Security Domain
- **User Accounts** (`sec_UserAccounts`)
- **Access Logs** (`sec_AccessLogs`)
- **Access Credentials** (`sec_AccessCredentials`)

### Universal Ticket System
- **Ticket Notes** (`cor_TicketNotes`) - Universal notes for all ticket types
- **Assignment Requests** (`cor_AssignmentRequests`) - ASG-001, ASG-002, etc.
- **Maintenance Requests** (`cor_MaintenanceRequests`) - MNT-001, MNT-002, etc.

## ✨ Key Features Currently Implemented

### 1. Community Management
- ✅ Multi-community support with master/sub-association relationships
- ✅ Community profiles with detailed information
- ✅ Status tracking and data completeness metrics
- ✅ Community selection with search functionality

### 2. Property Management
- ✅ Property registration and categorization
- ✅ Address management with geolocation support
- ✅ Property-stakeholder relationship tracking
- ✅ Property search and filtering

### 3. Stakeholder Management
- ✅ Unified user management (residents, board members, vendors)
- ✅ Role-based access control system
- ✅ Contact information and communication preferences
- ✅ Stakeholder directory with search

### 4. Amenity Management
- ✅ Community facility tracking
- ✅ Amenity details with schedules and features
- ✅ Search and filtering capabilities
- ✅ Modal-based detail views

### 5. Authentication & Authorization
- ✅ JWT-based authentication system
- ✅ Role-based permission checking
- ✅ Secure password handling with bcrypt
- ✅ Session management

### 6. User Interface
- ✅ Responsive design with Tailwind CSS
- ✅ Dark/light theme system
- ✅ Component-based architecture
- ✅ Loading states and error handling
- ✅ Modal dialogs and overlays

### 7. API Infrastructure
- ✅ RESTful API design
- ✅ Comprehensive error handling
- ✅ Request validation and sanitization
- ✅ Database connection pooling
- ✅ Logging and monitoring

### 8. Form System (Partial)
- ✅ Form category navigation
- ✅ Community Assignment form
- 🔄 Additional forms in development

### 9. Ticket System (Foundation)
- ✅ Universal ticket system design
- ✅ Assignment request tickets
- 🔄 Additional ticket types in development

### 10. Data Management
- ✅ CRUD operations for all core entities
- ✅ Soft delete functionality
- ✅ Audit trails and timestamps
- ✅ Data validation and constraints

## 🚧 Development Status

### Completed ✅
- Core infrastructure and architecture
- Database schema design and implementation
- Basic CRUD operations for all entities
- Frontend component library
- Authentication and authorization system
- Theme system and responsive design
- API documentation and error handling

### In Progress 🔄
- Advanced form system implementation
- Complete ticket system with multiple types
- Enhanced reporting and analytics
- Real-time notifications
- Advanced search and filtering

### Planned 📋
- Mobile application
- Advanced workflow automation
- Integration with external services
- Advanced reporting dashboard
- Multi-language support
- Advanced security features

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- Access to Azure SQL Database
- Git

### Backend Setup
```bash
cd backend
npm install
# Create .env file with database configuration
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
# Create .env file with API configuration
npm run dev
```

### Environment Variables
- **Backend**: Database connection, JWT secrets, CORS settings
- **Frontend**: API base URL, Google Maps API key

## 📊 Performance Considerations

### Frontend
- Virtual scrolling for large lists
- Component lazy loading
- Optimized bundle splitting
- Efficient state management

### Backend
- Database connection pooling
- Query optimization
- Rate limiting
- Caching strategies

### Database
- Proper indexing
- Soft deletes for data integrity
- Relationship optimization
- Query performance monitoring

---

*This document provides a comprehensive overview of the HOA Nexus project structure, technology stack, and current implementation status. It serves as a reference for developers and stakeholders working with the system.*
