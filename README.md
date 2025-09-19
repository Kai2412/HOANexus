# HOA Nexus - Modern HOA Management System

A comprehensive Homeowners Association (HOA) management platform built with React, TypeScript, and Node.js, designed to streamline community management, property oversight, and resident services.

## 🏗️ **Architecture Overview**

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + SQL Server (Azure)
- **Database**: Microsoft SQL Server hosted on Azure
- **Authentication**: JWT-based with bcrypt encryption
- **API**: RESTful with comprehensive error handling

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- Access to Azure SQL Database
- Git

### **1. Clone the Repository**
```bash
git clone <your-repo-url>
cd hoa-nexus
```

### **2. Backend Setup**
```bash
cd backend
npm install
```

**Environment Configuration**
Create `backend/.env`:
```env
# Server Configuration
PORT=5001
NODE_ENV=development

# Azure SQL Database Configuration
DB_SERVER=your-server.database.windows.net
DB_DATABASE=your-database-name
DB_USER=your-username
DB_PASSWORD=your-password
DB_PORT=1433
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false

# Authentication Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

**Start Backend Server**
```bash
npm start
# Server runs on http://localhost:5001
```

### **3. Frontend Setup**
```bash
cd frontend
npm install
```

**Environment Configuration**
Create `frontend/.env`:
```env
# API Base URL - Backend server
VITE_API_BASE_URL=http://localhost:5001/api
```

**Start Frontend Development Server**
```bash
npm run dev
# App runs on http://localhost:3000
```

## 🏘️ **Core Features**

### **Community Management**
- Multi-community support with master/sub-association relationships
- Community profiles with detailed information
- Status tracking and data completeness metrics

### **Property Management**
- Property registration and categorization
- Address management with geolocation support
- Property-stakeholder relationship tracking

### **Stakeholder Management**
- Unified user management (residents, board members, vendors)
- Role-based access control
- Contact information and communication preferences

### **Amenity Management**
- Community facility tracking
- Reservation systems
- Operating hours and maintenance schedules

### **Financial Operations**
- Assessment tracking
- Payment processing
- Budget management and reporting

## 🗄️ **Database Schema**

The system uses a comprehensive SQL Server database with the following core domains:

- **Core Domain**: Communities, Properties, Stakeholders, Relationships
- **Financial Domain**: Accounts, Fee Schedules, Transactions, Payment Plans
- **Operational Domain**: Assets, Maintenance, Work Orders, Inspections
- **Governance Domain**: Committees, Meetings, Voting, Documents
- **Communication Domain**: Notifications, Events, Templates
- **Security Domain**: User Accounts, Permissions, Access Control

## 🔧 **Development**

### **Available Scripts**

**Backend**
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests
```

**Frontend**
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

### **API Endpoints**

- **Health Check**: `GET /`
- **Communities**: `GET/POST/PUT/DELETE /api/communities`
- **Properties**: `GET/POST/PUT/DELETE /api/properties`
- **Stakeholders**: `GET/POST/PUT/DELETE /api/stakeholders`
- **Amenities**: `GET/POST/PUT/DELETE /api/amenities`

### **Database Connection Test**
```bash
curl http://localhost:5001/api/test-db
```

## 🎨 **UI/UX Features**

- **Responsive Design**: Works on all device sizes
- **Theme System**: Dark/light mode with smooth transitions
- **Component Library**: Reusable UI components with Tailwind CSS
- **Error Boundaries**: Graceful error handling and recovery
- **Loading States**: Smooth user experience during data fetching

## 🔒 **Security Features**

- **JWT Authentication**: Secure token-based authentication
- **Password Encryption**: bcrypt hashing for user passwords
- **CORS Protection**: Configurable cross-origin resource sharing
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Server-side data validation
- **SQL Injection Protection**: Parameterized queries

## 📱 **Browser Support**

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 **Support**

For support and questions:
- Check the documentation in `/database/documentation/`
- Review the API endpoints at `http://localhost:5001/`
- Check the health status at `http://localhost:5001/`

## 🔄 **Current Development Status**

- ✅ **Core Infrastructure**: Complete
- ✅ **Database Schema**: Complete
- ✅ **Basic CRUD Operations**: Complete
- ✅ **Frontend Components**: Complete
- 🔄 **Authentication System**: In Progress
- 🔄 **Advanced Features**: Planning Phase
- 📋 **Testing & Documentation**: Ongoing

---

**Built with ❤️ for better community management**