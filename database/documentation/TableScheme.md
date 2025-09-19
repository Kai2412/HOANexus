# Reimagined HOA Management Database - Modern Approach (v4)

## Core Design Principles

- **Stakeholder-Centric**: Organized around the needs of all users (residents, board members, managers)
- **Process-Driven**: Focused on workflows and activities rather than just data storage
- **Relationship-Based**: Tracking connections between entities for better context
- **Automation-Ready**: Structured to support business rules and triggered actions
- **Integration-Friendly**: Designed for API connectivity with modern services
- **Analytics-Enabled**: Supporting data-driven insights and reporting

## 1. CORE DOMAIN

### 1.1 cor_Communities
- ID (Auto-increment PK)
- Pcode (Legacy identifier)
- Name (Official legal name - displayed as "Legal Name" in UI)
- DisplayName (Marketing/common name)
- CommunityType (Enum: 'SingleFamily', 'Condo', 'TownHome', 'MasterPlanned', etc.)
- Status (Enum: 'Active', 'InDevelopment', 'Transition', 'Terminated')
- FormationDate (When legally established)
- FiscalYearStart (Date)
- FiscalYearEnd (Date)
- ContractStartDate
- ContractEndDate
- TaxID
- TimeZone
- ParentCommunityID (Self-referencing FK for master associations, null if none)
- IsSubAssociation (Boolean)
- LastAuditDate
- NextAuditDate
- DataCompleteness (Float - percentage of required fields populated)
- IsActive (Boolean)
- Market
- State (varchar(50)) - State where association is located
- City (varchar(100)) - City where association is located
- AddressLine1 (varchar(255)) - Primary address of association
- AddressLine2 (varchar(255)) - Secondary address line
- PostalCode (varchar(20)) - ZIP/Postal code
- Country (varchar(50)) - Country, defaults to 'USA'
- CreatedDate (datetime2(7)) - When record was created, auto-set
- LastUpdated (datetime2(7)) - When record was last modified, auto-updated via trigger

### 1.2 cor_Properties
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities)
- AddressLine1
- AddressLine2
- City
- State
- PostalCode
- Country
- Latitude
- Longitude
- PropertyType (Enum: 'SingleFamily', 'Condo', 'TownHome', 'Commercial', etc.)
- SquareFootage
- Bedrooms
- Bathrooms
- YearBuilt
- LotSize
- ParcelID (Tax/legal identifier)
- AssessmentPercentage (For unequal assessment communities)
- IsActiveDevelopment (Boolean)
- VotingInterest (Float - for weighted voting situations)
- Status (Enum: 'Occupied', 'Vacant', 'ForSale', 'ForRent', 'UnderConstruction')
- IsActive (Boolean)
(add assessments(i think assessments would be their own table maybe idk we will see),Homeowner(stakeholder))

### 1.3 cor_Stakeholders (user)
- ID (Auto-increment PK)
- Type (Enum: 'Owner', 'Resident', 'Tenant', 'PropertyManager', 'BoardMember', 'Vendor', 'Developer', 'Staff')
- FirstName
- LastName
- CompanyName
- Email
- Phone
- MobilePhone
- PreferredContactMethod
- Status (Enum: 'Active', 'Inactive')
- PortalAccessEnabled (Boolean)
- LastLoginDate
- CreatedDate
- DataPrivacyPreferences (JSON - for GDPR/CCPA compliance)
- IsActive (Boolean)

### 1.4 cor_StakeholderRelationships
- ID (Auto-increment PK)
- PrimaryStakeholderID (FK to cor_Stakeholders)
- RelatedStakeholderID (FK to cor_Stakeholders)
- RelationshipType (Enum: 'Spouse', 'Family', 'BusinessPartner', 'Attorney', etc.)
- StartDate
- EndDate
- IsActive (Boolean)

### 1.5 cor_PropertyStakeholders
- ID (Auto-increment PK)
- PropertyID (FK to cor_Properties)
- StakeholderID (FK to cor_Stakeholders)
- RelationshipType (Enum: 'Owner', 'Resident', 'Tenant', 'PropertyManager')
- Ownership (Boolean)
- OwnershipPercentage (For multiple owners)
- ResidencyStatus (Enum: 'PrimaryResidence', 'SecondHome', 'Investment')
- StartDate
- EndDate
- IsActive (Boolean)

### 1.6 cor_CommunityRoles
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities)
- StakeholderID (FK to cor_Stakeholders - must be Type='Resident')
- RoleType (Enum: 'BoardMember', 'CommitteeMember', 'Officer', 'Volunteer')
- RoleTitle (Enum: 'President', 'VicePresident', 'Treasurer', 'Secretary', 'Director', 'ChairPerson', 'Member', etc.)
- CommitteeID (FK to gov_Committees, nullable)
- StartDate
- EndDate
- TermLength (in months, nullable for non-term positions)
- ElectionDate (nullable, for elected positions)
- AppointmentDate (nullable, for appointed positions)
- AssignedBy (FK to cor_Stakeholders, nullable - who made the assignment)
- AssignmentDate (DateTime - when the assignment was made)
- IsActive (Boolean)

### 1.7 cor_AssignmentRequests (Ticket System)
- ID (Auto-increment PK)
- TicketNumber (Computed: 'ASG-' + RIGHT('000' + CAST(ID AS VARCHAR(3)), 3)) - ASG-001, ASG-002, etc.
- Status (Enum: 'Pending', 'Hold', 'InProgress', 'Completed', 'Rejected') - Default: 'Pending'
- Priority (Enum: 'Normal', 'Urgent', 'Emergency') - Default: 'Normal'
- CreatedOn (DateTime - Default: GETDATE())
- CreatedBy (FK to cor_Stakeholders - who submitted the request)
- ModifiedOn (DateTime - Default: GETDATE())
- ModifiedBy (FK to cor_Stakeholders - who last modified)
- CommunityID (FK to cor_Communities)
- RequestedRoleType (Enum: 'Manager', 'Director', 'Assistant')
- RequestedRoleTitle (VARCHAR(100) - specific role title)
- EffectiveDate (Date - when assignment should start)
- EndDate (Date - nullable, for temporary assignments)
- ReplacingStakeholderID (FK to cor_Stakeholders - nullable, if replacing someone)

### 1.8 cor_TicketNotes (Universal Notes System)
- ID (Auto-increment PK)
- TicketType (VARCHAR(50) - 'AssignmentRequest', 'MaintenanceRequest', etc.)
- TicketID (INT - ID of the specific ticket record)
- NoteText (NVARCHAR(MAX) - the actual note/comment)
- IsInternal (Boolean - 0=Public, 1=Internal/Staff only)
- CreatedOn (DateTime - Default: GETDATE())
- CreatedBy (FK to cor_Stakeholders - who wrote the note)

### 1.9 cor_CompanyCommunityAssignments
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities)
- StakeholderID (FK to cor_Stakeholders - must be Type='Company Employee')
- RoleType (Enum: 'Manager', 'Director', 'Assistant', 'Coordinator', 'Specialist')
- RoleTitle (Enum: 'Regional Director', 'Community Manager', 'On-site Manager', 'Manager in Training', 'Maintenance Coordinator', 'Compliance Specialist', 'Accounting Specialist', 'General Assistant', etc.)
- StartDate
- EndDate (nullable, for ongoing assignments)
- AssignedBy (FK to cor_Stakeholders - who made the assignment)
- AssignmentDate (DateTime - when the assignment was made)
- IsActive (Boolean)

### 1.10 cor_PropertyGroups
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities)
- GroupName
- GroupType (Enum: 'Phase', 'Building', 'Zone', 'SubAssociation', 'ServiceArea')
- Description
- CreatedBy (FK to cor_Stakeholders)
- CreationDate
- IsActive (Boolean)

### 1.11 cor_PropertyGroupMembers
- ID (Auto-increment PK)
- GroupID (FK to cor_PropertyGroups)
- PropertyID (FK to cor_Properties)
- AddedDate
- AddedBy (FK to cor_Stakeholders)
- IsActive (Boolean)

## 2. FINANCIAL DOMAIN

### 2.1 fin_FinancialAccounts
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities)
- AccountName
- AccountType (Enum: 'Operating', 'Reserve', 'Construction', 'Investment')
- BankName
- AccountNumber (Encrypted)
- RoutingNumber (Encrypted)
- Balance
- AsOfDate
- MinimumRequiredBalance
- StatementDay
- ReconciliationFrequency
- IsActive (Boolean)

### 2.2 fin_FeeSchedules
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities)
- ScheduleName
- FeeType (Enum: 'Regular', 'Special', 'Capital', 'Transfer', 'Violation', 'Service')
- Amount
- EffectiveStartDate
- EffectiveEndDate
- Frequency (Enum: 'Monthly', 'Quarterly', 'Annually', 'OneTime')
- DueDay
- GracePeriod (in days)
- LateFeeTriggerDay
- LateFeeAmount
- LateFeeType (Enum: 'Fixed', 'Percentage')
- IsActive (Boolean)

### 2.3 fin_FeeAssignments
- ID (Auto-increment PK)
- FeeScheduleID (FK to fin_FeeSchedules)
- PropertyID (FK to cor_Properties, nullable)
- PropertyGroupID (FK to cor_PropertyGroups, nullable)
- CustomAmount (Override for specific properties)
- IsExempt (Boolean)
- ExemptionReason
- ExemptionExpiryDate
- IsActive (Boolean)

### 2.4 fin_Transactions
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities)
- TransactionType (Enum: 'Assessment', 'Payment', 'Charge', 'Credit', 'Transfer', 'Adjustment')
- PropertyID (FK to cor_Properties, nullable)
- StakeholderID (FK to cor_Stakeholders, nullable)
- AccountID (FK to fin_FinancialAccounts)
- Amount
- Date
- DueDate
- Description
- Status (Enum: 'Pending', 'Completed', 'Failed', 'Canceled')
- PaymentMethod (Enum: 'Check', 'ACH', 'CreditCard', 'DebitCard', 'Cash', 'Other')
- ReferenceNumber
- EnteredBy (FK to cor_Stakeholders)
- EnteredDate
- IsActive (Boolean)

### 2.5 fin_PaymentPlans
- ID (Auto-increment PK)
- PropertyID (FK to cor_Properties)
- StakeholderID (FK to cor_Stakeholders)
- TotalAmount
- StartDate
- EndDate
- Frequency (Enum: 'Weekly', 'Biweekly', 'Monthly')
- PaymentAmount
- Status (Enum: 'Active', 'Completed', 'Defaulted', 'Canceled')
- SetupFee
- RecurringFee
- ApprovedBy (FK to cor_Stakeholders)
- ApprovalDate
- IsActive (Boolean)

## 3. OPERATIONAL DOMAIN

### 3.1 op_Assets
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities)
- AssetName
- AssetType (Enum: 'Building', 'Pool', 'Road', 'Equipment', 'Landscape', etc.)
- Location (Geographic coordinates or description)
- AcquisitionDate
- InitialCost
- CurrentValue
- UsefulLifeYears
- ReplacementCost
- LastInspectionDate
- NextInspectionDate
- Status (Enum: 'Operational', 'Maintenance', 'Replacement', 'EndOfLife')
- MaintenanceResponsibility (Enum: 'HOA', 'Owner', 'City', 'Shared')
- VendorID (FK to cor_Stakeholders where Type = 'Vendor', nullable)
- WarrantyExpirationDate
- AssetPhotos (JSON array of photo URLs)
- AssetDocuments (JSON array of document references)
- IsActive (Boolean)

### 3.2 op_MaintenanceSchedules
- ID (Auto-increment PK)
- AssetID (FK to op_Assets)
- MaintenanceType (Enum: 'Preventive', 'Seasonal', 'Regulatory', 'Inspection')
- Frequency (Enum: 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually')
- LastPerformedDate
- NextScheduledDate
- EstimatedCost
- VendorID (FK to cor_Stakeholders where Type = 'Vendor')
- Notes
- IsActive (Boolean)

### 3.3 op_WorkOrders
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities)
- RequestType (Enum: 'Repair', 'Maintenance', 'Inspection', 'Installation', 'Other')
- AssetID (FK to op_Assets, nullable)
- PropertyID (FK to cor_Properties, nullable)
- RequestedBy (FK to cor_Stakeholders)
- AssignedTo (FK to cor_Stakeholders)
- Priority (Enum: 'Emergency', 'Urgent', 'High', 'Normal', 'Low')
- Status (Enum: 'Open', 'Assigned', 'InProgress', 'OnHold', 'Completed', 'Canceled')
- Description
- PrivateNotes
- EstimatedCost
- ActualCost
- RequestDate
- TargetCompletionDate
- CompletionDate
- ApprovalRequired (Boolean)
- ApprovedBy (FK to cor_Stakeholders, nullable)
- ApprovalDate
- IsActive (Boolean)

### 3.4 op_Inspections
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities)
- InspectionType (Enum: 'Compliance', 'Condition', 'Move-In', 'Move-Out', 'Safety')
- PropertyID (FK to cor_Properties, nullable)
- AssetID (FK to op_Assets, nullable)
- InspectedBy (FK to cor_Stakeholders)
- InspectionDate
- Status (Enum: 'Scheduled', 'Completed', 'Canceled')
- Findings
- Photos (JSON array of photo URLs)
- FollowUpRequired (Boolean)
- FollowUpDate
- FollowUpAssignedTo (FK to cor_Stakeholders, nullable)
- IsActive (Boolean)

### 3.5 op_Violations
- ID (Auto-increment PK)
- PropertyID (FK to cor_Properties)
- ViolationTypeID (FK to op_ViolationTypes)
- ReportedBy (FK to cor_Stakeholders)
- ReportedDate
- Description
- Status (Enum: 'Open', 'UnderReview', 'Notice1', 'Notice2', 'Hearing', 'Resolved', 'Dismissed')
- Photos (JSON array of photo URLs)
- CorrectionDeadline
- ActualResolutionDate
- AssociatedFine (Decimal)
- HearingDate
- HearingResult
- AppealDate
- AppealResult
- IsActive (Boolean)

### 3.6 op_ViolationTypes
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities)
- Category (Enum: 'Architectural', 'Landscape', 'Pets', 'Parking', 'Noise', 'Trash', etc.)
- Name
- Description
- GracePeriod (Days)
- StandardFineAmount
- RuleReference (Citation to governing documents)
- AutomatedNotificationEnabled (Boolean)
- IsActive (Boolean)

### 3.7 op_Amenities
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities)
- AssetID (FK to op_Assets)
- Name
- AmenityType (Enum: 'Pool', 'Clubhouse', 'Gym', 'Tennis', 'Park', 'Marina', 'Stable', etc.)
- Capacity
- Description
- Rules
- MainContactID (FK to cor_Stakeholders)
- EmergencyContactID (FK to cor_Stakeholders)
- HasReservationSystem (Boolean)
- HasAccessControl (Boolean)
- IsActive (Boolean)

### 3.8 op_AmenitySchedules
- ID (Auto-increment PK)
- AmenityID (FK to op_Amenities)
- ScheduleType (Enum: 'Regular', 'Holiday', 'Special', 'Maintenance', 'Seasonal')
- DayOfWeek (Nullable, for weekly schedules)
- SpecificDate (Nullable, for one-time schedules)
- OpenTime
- CloseTime
- IsClosedAllDay (Boolean)
- Description (e.g., "Holiday Hours", "Summer Schedule")
- RecurrencePattern (Enum: 'Daily', 'Weekly', 'Monthly', 'Yearly', 'Custom')
- RecurrenceDetails (JSON, for custom patterns)
- SeasonStartDate (For seasonal schedules)
- SeasonEndDate (For seasonal schedules)
- CreatedBy (FK to cor_Stakeholders)
- LastModifiedBy (FK to cor_Stakeholders)
- LastModifiedDate
- IsActive (Boolean)

### 3.9 op_AmenityFeatures
- ID (Auto-increment PK)
- AmenityID (FK to op_Amenities)
- FeatureName
- FeatureType (Enum: 'Equipment', 'Service', 'Facility', 'Accommodation')
- Description
- StatusWorking (Boolean)
- LastInspectionDate
- MaintenanceRequired (Boolean)
- NextMaintenanceDate
- ReplacementCost
- Instructions
- IsActive (Boolean)

### 3.10 op_AmenityReservations
- ID (Auto-increment PK)
- AmenityID (FK to op_Amenities)
- StakeholderID (FK to cor_Stakeholders)
- PropertyID (FK to cor_Properties)
- StartTime
- EndTime
- Purpose
- NumberOfGuests
- Status (Enum: 'Pending', 'Approved', 'Denied', 'Canceled', 'Completed')
- Fee
- DepositAmount
- DepositReturned (Boolean)
- DepositReturnedAmount
- DepositReturnedDate
- SpecialRequirements
- IsActive (Boolean)

### 3.11 op_ServiceRequests
- ID (Auto-increment PK)
- PropertyID (FK to cor_Properties)
- RequestedBy (FK to cor_Stakeholders)
- RequestType (Enum: 'General', 'Maintenance', 'Complaint', 'Information')
- Subject
- Description
- SubmissionDate
- Status (Enum: 'New', 'InProgress', 'Waiting', 'Resolved', 'Canceled')
- Priority (Enum: 'Low', 'Normal', 'High', 'Emergency')
- AssignedTo (FK to cor_Stakeholders)
- ResolutionNotes
- ResolutionDate
- SatisfactionRating (1-5)
- FeedbackComments
- IsActive (Boolean)

## 4. GOVERNANCE DOMAIN

### 4.1 gov_Committees
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities)
- Name
- Purpose
- FormationDate
- DissolutionDate
- MeetingFrequency
- BudgetAmount
- ChairPersonID (FK to cor_Stakeholders)
- BoardLiaisonID (FK to cor_Stakeholders)
- MemberCount
- MemberLimit
- CharteredBy (FK to cor_Stakeholders)
- IsActive (Boolean)

### 4.2 gov_Meetings
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities)
- MeetingType (Enum: 'Board', 'Annual', 'Committee', 'Special', 'TownHall')
- CommitteeID (FK to gov_Committees, nullable)
- Title
- ScheduledDate
- StartTime
- EndTime
- Location
- VirtualMeetingURL
- Agenda (Document reference)
- Minutes (Document reference)
- Quorum (Number required)
- QuorumAchieved (Boolean)
- NoticeDate
- NoticeSentMethod
- RecordingURL
- Status (Enum: 'Scheduled', 'Completed', 'Canceled', 'Rescheduled')
- IsActive (Boolean)

### 4.3 gov_MeetingAttendees
- ID (Auto-increment PK)
- MeetingID (FK to gov_Meetings)
- StakeholderID (FK to cor_Stakeholders)
- AttendanceType (Enum: 'InPerson', 'Virtual', 'Proxy')
- Role (Enum: 'Member', 'Officer', 'Presenter', 'Guest')
- CheckInTime
- CheckOutTime
- ProxyHolder (FK to cor_Stakeholders, nullable)
- IsActive (Boolean)

### 4.4 gov_VotingItems
- ID (Auto-increment PK)
- MeetingID (FK to gov_Meetings, nullable)
- Title
- Description
- Category (Enum: 'Budget', 'Election', 'Rules', 'Vendor', 'Special')
- VotingMethod (Enum: 'InPerson', 'Electronic', 'Mail', 'Hybrid')
- StartDate
- EndDate
- RequiredMajority (Percentage)
- Outcome (Enum: 'Passed', 'Failed', 'Tabled', 'Pending')
- DocumentReference
- IsActive (Boolean)

### 4.5 gov_Votes
- ID (Auto-increment PK)
- VotingItemID (FK to gov_VotingItems)
- StakeholderID (FK to cor_Stakeholders)
- PropertyID (FK to cor_Properties)
- Vote (Enum: 'Yes', 'No', 'Abstain')
- VoteWeight (For weighted voting)
- CastDate
- Verified (Boolean)
- VerifiedBy (FK to cor_Stakeholders)
- IsActive (Boolean)

### 4.6 gov_Documents
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities)
- Title
- DocumentType (Enum: 'Governing', 'Financial', 'Minutes', 'Notice', 'Form', 'Communication', 'Legal')
- Category (Enum: 'CC&Rs', 'Bylaws', 'Rules', 'Policies', 'Budget', 'FinancialReport', etc.)
- VersionNumber
- PublicationDate
- EffectiveDate
- ExpirationDate
- ApprovedBy (FK to cor_Stakeholders, nullable)
- ApprovalDate
- IsCurrentVersion (Boolean)
- AccessLevel (Enum: 'Public', 'Members', 'Board', 'Management', 'Restricted')
- StorageLocation (URL or file system reference)
- FileFormat
- Searchable (Boolean)
- Keywords (Array of search terms)
- IsActive (Boolean)

## 5. COMMUNICATION DOMAIN

### 5.1 com_Communications
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities)
- CommunicationType (Enum: 'Email', 'Newsletter', 'Notice', 'Alert', 'Announcement')
- Subject
- Content
- SentBy (FK to cor_Stakeholders)
- SentDate
- Recipients (JSON array of recipient types or specific stakeholder IDs)
- RecipientCount
- OpenRate
- ClickRate
- Category (Enum: 'Emergency', 'Governance', 'Social', 'Maintenance', 'Compliance')
- Status (Enum: 'Draft', 'Scheduled', 'Sent', 'Canceled')
- ScheduledDate
- Priority (Enum: 'Low', 'Normal', 'High', 'Critical')
- IsActive (Boolean)

### 5.2 com_CommunicationTemplates
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities)
- TemplateName
- TemplateType (Enum: 'Email', 'Letter', 'Notice', 'Newsletter')
- Subject
- ContentTemplate
- Variables (JSON array of available template variables)
- Category
- CreatedBy (FK to cor_Stakeholders)
- LastModifiedBy (FK to cor_Stakeholders)
- LastModifiedDate
- IsActive (Boolean)

### 5.3 com_CommunityEvents
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities)
- EventName
- EventType (Enum: 'Social', 'Meeting', 'Maintenance', 'Holiday', 'Community')
- StartDate
- EndDate
- Location
- Description
- MaxAttendees
- CurrentRegisteredCount
- RegistrationRequired (Boolean)
- RegistrationDeadline
- Fee (Decimal)
- OrganizedBy (FK to cor_Stakeholders)
- Status (Enum: 'Scheduled', 'Canceled', 'Completed')
- IsActive (Boolean)

### 5.4 com_EventRegistrations
- ID (Auto-increment PK)
- EventID (FK to com_CommunityEvents)
- StakeholderID (FK to cor_Stakeholders)
- PropertyID (FK to cor_Properties)
- RegistrationDate
- NumberOfGuests
- SpecialRequests
- PaymentStatus (Enum: 'Pending', 'Paid', 'Refunded')
- CheckedIn (Boolean)
- CheckInTime
- IsActive (Boolean)

### 5.5 com_NotificationPreferences
- ID (Auto-increment PK)
- StakeholderID (FK to cor_Stakeholders)
- NotificationType (Enum: 'Account', 'Payment', 'Violation', 'Maintenance', 'Meeting', 'Event', 'Emergency')
- Channel (Enum: 'Email', 'SMS', 'Push', 'Portal', 'Mail')
- IsEnabled (Boolean)
- Schedule (JSON with time preferences)
- DoNotDisturbStart (Time)
- DoNotDisturbEnd (Time)
- IsActive (Boolean)

## 6. DIGITAL ASSET MANAGEMENT

### 6.1 dig_DigitalAssets
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities)
- AssetType (Enum: 'Logo', 'Photo', 'Video', 'Map', 'Floorplan', 'Document')
- Title
- Description
- FileName
- FileSize
- FileFormat
- StorageLocation (URL or file path)
- UploadedBy (FK to cor_Stakeholders)
- UploadDate
- Tags (JSON array of tags)
- AccessLevel (Enum: 'Public', 'Members', 'Board', 'Management')
- IsArchived (Boolean)
- IsActive (Boolean)

## 7. ANALYTICS & REPORTING

### 7.1 ana_Dashboards
- ID (Auto-increment PK)
- Name
- Description
- TargetAudience (Enum: 'Board', 'Management', 'Owners', 'Staff')
- CreatedBy (FK to cor_Stakeholders)
- CreationDate
- LastModifiedDate
- IsPublic (Boolean)
- AccessControl (JSON array of role-based permissions)
- IsActive (Boolean)

### 7.2 ana_DashboardWidgets
- ID (Auto-increment PK)
- DashboardID (FK to ana_Dashboards)
- WidgetType (Enum: 'Chart', 'Metric', 'List', 'Calendar', 'Map')
- Title
- Description
- DataSource (Reference to query or data set)
- VisualizationType (Enum: 'Bar', 'Line', 'Pie', 'Table', 'KPI', etc.)
- RefreshInterval (in minutes)
- Position (JSON with layout coordinates)
- Size (JSON with dimensions)
- FilterSettings (JSON)
- IsActive (Boolean)

### 7.3 ana_Reports
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities)
- ReportName
- Description
- Category (Enum: 'Financial', 'Operational', 'Compliance', 'Governance')
- CreatedBy (FK to cor_Stakeholders)
- CreationDate
- LastModifiedDate
- ScheduleType (Enum: 'OneTime', 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually')
- NextScheduledRun
- Recipients (JSON array of stakeholder IDs)
- Parameters (JSON object of report parameters)
- OutputFormat (Enum: 'PDF', 'Excel', 'CSV', 'HTML', 'JSON')
- StorageLocation
- IsActive (Boolean)

### 7.4 ana_DataExports
- ID (Auto-increment PK)
- ExportType (Enum: 'Custom', 'Standard', 'Regulatory', 'Backup')
- RequestedBy (FK to cor_Stakeholders)
- RequestDate
- CompletionDate
- Status (Enum: 'Requested', 'Processing', 'Completed', 'Failed')
- FileSize
- RowCount
- ExportFormat (Enum: 'CSV', 'Excel', 'JSON', 'XML')
- DownloadURL
- ExpirationDate
- Notes
- IsActive (Boolean)

## 8. SECURITY & ACCESS CONTROL

### 8.1 sec_UserAccounts
- ID (Auto-increment PK)
- StakeholderID (FK to cor_Stakeholders)
- Username (NVARCHAR(100) - Unique)
- PasswordHash (NVARCHAR(255) - bcrypt hashed password)
- LastLoginDate (DateTime - nullable)
- FailedLoginAttempts (INT - Default: 0)
- AccountLocked (Boolean - Default: 0)
- IsActive (Boolean - Default: 1)

**Note:** Permissions are handled through the stakeholder system using `Type`, `SubType`, and `AccessLevel` fields in `cor_Stakeholders`. No additional permission tables needed.

### 8.2 sec_AccessLogs
- ID (Auto-increment PK)
- UserAccountID (FK to sec_UserAccounts)
- EventType (Enum: 'Login', 'Logout', 'PasswordChange', 'PermissionChange', 'DataAccess')
- EventDate
- IPAddress
- DeviceInfo
- ResourceAccessed
- Success (Boolean)
- FailureReason
- IsActive (Boolean)

### 8.3 sec_AccessCredentials
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities)
- CredentialType (Enum: 'Key', 'Fob', 'Card', 'Code', 'Biometric', 'Mobile')
- CredentialIdentifier (Serial number, code, etc.)
- Status (Enum: 'Active', 'Inactive', 'Lost', 'Damaged', 'Pending')
- IssuedTo (FK to cor_Stakeholders)
- IssuedBy (FK to cor_Stakeholders)
- IssuedDate
- ExpirationDate
- SecurityLevel (Integer - for tiered access)
- DepositAmount
- DepositRefunded (Boolean)
- ReplacementFee
- Notes
- LastModifiedBy (FK to cor_Stakeholders)
- LastModifiedDate
- IsActive (Boolean)

### 8.7 sec_AccessPoints
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities)
- AssetID (FK to op_Assets, nullable)
- AmenityID (FK to op_Amenities, nullable)
- Name
- Location
- AccessPointType (Enum: 'Gate', 'Door', 'Elevator', 'Turnstile', 'Barrier', etc.)
- ControlMechanism (Enum: 'Key', 'Keypad', 'CardReader', 'Remote', 'Mobile', 'Biometric')
- CodeOrKeyway (Encrypted, if applicable)
- LastKeyChange
- NextScheduledKeyChange
- EmergencyAccessInfo (Encrypted)
- MaintenanceContact (FK to cor_Stakeholders)
- SecurityLevel (Integer - for tiered access)
- HasCamera (Boolean)
- IsActive (Boolean)

### 8.8 sec_AccessPermissions
- ID (Auto-increment PK)
- CredentialID (FK to sec_AccessCredentials)
- AccessPointID (FK to sec_AccessPoints)
- PermissionType (Enum: 'Always', 'Scheduled', 'Temporary', 'Conditional')
- ScheduleStart (Time - if scheduled)
- ScheduleEnd (Time - if scheduled)
- EffectiveStartDate
- EffectiveEndDate
- DaysOfWeek (JSON array, if scheduled)
- SpecialConditions
- GrantedBy (FK to cor_Stakeholders)
- GrantedDate
- LastModifiedBy (FK to cor_Stakeholders)
- LastModifiedDate
- IsActive (Boolean)

### 8.9 sec_PhysicalAccessLogs
- ID (Auto-increment PK)
- AccessPointID (FK to sec_AccessPoints)
- CredentialID (FK to sec_AccessCredentials, nullable)
- StakeholderID (FK to cor_Stakeholders, nullable)
- EventType (Enum: 'Entry', 'Exit', 'AttemptedEntry', 'Denied', 'Alarm')
- EventDateTime
- SuccessfulAccess (Boolean)
- DenialReason
- IsActive (Boolean)

## 9. AUTOMATION & INTEGRATION

### 9.1 aut_AutomationRules
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities)
- RuleName
- Description
- TriggerType (Enum: 'Schedule', 'Event', 'Condition')
- TriggerDetails (JSON object with specific criteria)
- Actions (JSON array of actions to perform)
- CreatedBy (FK to cor_Stakeholders)
- CreationDate
- LastTriggered
- ExecutionCount
- SuccessRate
- IsActive (Boolean)

### 9.2 aut_IntegrationServices
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities)
- ServiceName
- ServiceType (Enum: 'Payment', 'Communication', 'Security', 'Automation', 'Reporting')
- ApiEndpoint
- AuthenticationMethod
- CredentialsVaultReference
- LastSyncDate
- SyncFrequency
- Status (Enum: 'Active', 'Inactive', 'Error')
- ConfigurationSettings (JSON)
- ErrorLog
- IsActive (Boolean)

### 9.3 aut_SmartDevices
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities)
- DeviceType (Enum: 'Camera', 'Gate', 'AccessControl', 'Thermostat', 'WaterSensor')
- DeviceID (Manufacturer ID)
- Location
- InstallationDate
- LastMaintenanceDate
- ManufacturerName
- ModelNumber
- FirmwareVersion
- ConnectionStatus (Enum: 'Online', 'Offline', 'Maintenance')
- BatteryLevel
- IPAddress
- MACAddress
- AccessCredentials (Encrypted)
- IsActive (Boolean)

### 9.4 aut_SmartDeviceEvents
- ID (Auto-increment PK)
- DeviceID (FK to aut_SmartDevices)
- EventType (Enum: 'Access', 'Alert', 'Status', 'Maintenance', 'Configuration')
- EventDateTime
- EventData (JSON object with event details)
- AssociatedStakeholderID (FK to cor_Stakeholders, nullable)
- ProcessedBy (Enum: 'System', 'Human', 'AI')
- ResponseAction
- ResponseTime
- IsActive (Boolean)

### 9.5 aut_AIAssistants
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities)
- AssistantName
- Purpose (Enum: 'CustomerService', 'Maintenance', 'Compliance', 'FinancialAdvice')
- TrainingData (References to documents used for training)
- KnowledgeBaseCategories (JSON array of knowledge categories)
- ActivationPhrase
- ResponseStyle (Enum: 'Formal', 'Casual', 'Technical', 'Simple')
- UsageCount
- SatisfactionRating
- IsActive (Boolean)

## 10. KNOWLEDGE MANAGEMENT DOMAIN

### 10.1 kno_EntityNotes
- ID (Auto-increment PK)
- EntityType (Enum: 'Community', 'Property', 'Stakeholder', 'Asset', 'WorkOrder', etc.)
- EntityID (Integer - FK to the respective entity table)
- AuthorID (FK to cor_Stakeholders)
- NoteText (Text)
- Visibility (Enum: 'Internal', 'Board', 'Owner', 'Public')
- CreatedDate (DateTime)
- LastEditedDate (DateTime)
- LastEditedBy (FK to cor_Stakeholders)
- Priority (Enum: 'Low', 'Normal', 'High', 'Critical')
- Category (Varchar - customizable categorization)
- IsActive (Boolean)

### 10.2 kno_KnowledgeBase
- ID (Auto-increment PK)
- Title (Varchar)
- Content (Text)
- Department (Enum: 'Management', 'Accounting', 'Maintenance', 'Legal', etc.)
- AccessLevel (Enum: 'Department', 'Company', 'Board', 'Public')
- CommunityID (FK to cor_Communities, nullable - if specific to a community)
- CategoryID (FK to kno_KnowledgeBaseCategories)
- Tags (JSON array of tags for searchability)
- AuthorID (FK to cor_Stakeholders)
- CreatedDate (DateTime)
- LastUpdatedDate (DateTime)
- LastUpdatedBy (FK to cor_Stakeholders)
- ViewCount (Integer)
- AttachmentIDs (JSON array of Digital Asset IDs)
- IsFeatured (Boolean)
- ExpirationDate (DateTime, nullable)
- IsActive (Boolean)

### 10.3 kno_KnowledgeBaseCategories
- ID (Auto-increment PK)
- Name (Varchar)
- Description (Text)
- ParentCategoryID (FK to kno_KnowledgeBaseCategories, nullable - for hierarchical categories)
- Department (Enum: 'Management', 'Accounting', 'Maintenance', 'Legal', 'All', etc.)
- DisplayOrder (Integer)
- IsActive (Boolean)

## 11. ACCESS CONTROL SYSTEM

### 11.1 sec_AccessCredentials
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities)
- CredentialType (Enum: 'Key', 'Fob', 'Card', 'Code', 'Biometric', 'Mobile')
- CredentialIdentifier (Serial number, code, etc.)
- Status (Enum: 'Active', 'Inactive', 'Lost', 'Damaged', 'Pending')
- IssuedTo (FK to cor_Stakeholders)
- IssuedBy (FK to cor_Stakeholders)
- IssuedDate
- ExpirationDate
- SecurityLevel (Integer - for tiered access)
- DepositAmount
- DepositRefunded (Boolean)
- ReplacementFee
- Notes
- LastModifiedBy (FK to cor_Stakeholders)
- LastModifiedDate
- IsActive (Boolean)

### 11.2 sec_AccessPoints
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities)
- AssetID (FK to op_Assets, nullable)
- AmenityID (FK to op_Amenities, nullable)
- Name
- Location
- AccessPointType (Enum: 'Gate', 'Door', 'Elevator', 'Turnstile', 'Barrier', etc.)
- ControlMechanism (Enum: 'Key', 'Keypad', 'CardReader', 'Remote', 'Mobile', 'Biometric')
- CodeOrKeyway (Encrypted, if applicable)
- LastKeyChange
- NextScheduledKeyChange
- EmergencyAccessInfo (Encrypted)
- MaintenanceContact (FK to cor_Stakeholders)
- SecurityLevel (Integer - for tiered access)
- HasCamera (Boolean)
- IsActive (Boolean)

### 11.3 sec_AccessPermissions
- ID (Auto-increment PK)
- CredentialID (FK to sec_AccessCredentials)
- AccessPointID (FK to sec_AccessPoints)
- PermissionType (Enum: 'Always', 'Scheduled', 'Temporary', 'Conditional')
- ScheduleStart (Time - if scheduled)
- ScheduleEnd (Time - if scheduled)
- EffectiveStartDate
- EffectiveEndDate
- DaysOfWeek (JSON array, if scheduled)
- SpecialConditions
- GrantedBy (FK to cor_Stakeholders)
- GrantedDate
- LastModifiedBy (FK to cor_Stakeholders)
- LastModifiedDate
- IsActive (Boolean)

### 11.4 sec_PhysicalAccessLogs
- ID (Auto-increment PK)
- AccessPointID (FK to sec_AccessPoints)
- CredentialID (FK to sec_AccessCredentials, nullable)
- StakeholderID (FK to cor_Stakeholders, nullable)
- EventType (Enum: 'Entry', 'Exit', 'AttemptedEntry', 'Denied', 'Alarm')
- EventDateTime
- SuccessfulAccess (Boolean)
- DenialReason
- IsActive (Boolean)

## 12. TICKETING SYSTEM

### 12.1 tkt_Tickets
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities)
- Title
- Description
- RequestedBy (FK to cor_Stakeholders)
- AssignedTo (FK to cor_Stakeholders, nullable)
- PropertyID (FK to cor_Properties, nullable)
- AssetID (FK to op_Assets, nullable)
- TicketTypeID (FK to tkt_TicketTypes)
- PriorityID (FK to tkt_TicketPriorities)
- StatusID (FK to tkt_TicketStatuses)
- DepartmentID (FK to tkt_Departments, nullable)
- CreatedDate
- DueDate
- EstimatedHours
- ActualHours
- CompletionDate
- FollowUpRequired (Boolean)
- FollowUpDate
- FollowUpAssignedTo (FK to cor_Stakeholders, nullable)
- IsActive (Boolean)

### 12.2 tkt_TicketTypes
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities, nullable)
- Name
- Description
- DefaultPriorityID (FK to tkt_TicketPriorities)
- DefaultDepartmentID (FK to tkt_Departments, nullable)
- EstimatedResolutionHours
- RequiresApproval (Boolean)
- ApprovalRoleID (FK to sec_Permissions, nullable)
- DisplayOrder
- IsActive (Boolean)

### 12.3 tkt_TicketStatuses
- ID (Auto-increment PK)
- Name
- Description
- Color
- Sequence
- IsClosingStatus (Boolean)
- TriggersNotification (Boolean)
- CanReopen (Boolean)
- IsActive (Boolean)

### 12.4 tkt_TicketPriorities
- ID (Auto-increment PK)
- Name
- Description
- Color
- SLA_Hours
- EscalationRole (FK to sec_Permissions, nullable)
- EscalationThresholdHours
- DisplayOrder
- IsActive (Boolean)

### 12.5 tkt_Departments
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities, nullable)
- Name
- Description
- ManagerID (FK to cor_Stakeholders)
- Email
- Phone
- IsActive (Boolean)

### 12.6 tkt_TicketComments
- ID (Auto-increment PK)
- TicketID (FK to tkt_Tickets)
- StakeholderID (FK to cor_Stakeholders)
- Comment
- CommentDate
- IsInternal (Boolean)
- IsSystemGenerated (Boolean)
- ParentCommentID (FK to tkt_TicketComments, nullable)
- IsActive (Boolean)

### 12.7 tkt_TicketAttachments
- ID (Auto-increment PK)
- TicketID (FK to tkt_Tickets)
- FileName
- FileSize
- FileType
- StorageLocation
- UploadedBy (FK to cor_Stakeholders)
- UploadDate
- Description
- IsActive (Boolean)

### 12.8 tkt_TicketHistory
- ID (Auto-increment PK)
- TicketID (FK to tkt_Tickets)
- FieldChanged
- OldValue
- NewValue
- ChangedBy (FK to cor_Stakeholders)
- ChangeDate
- IsSystemGenerated (Boolean)

### 12.9 tkt_TicketTags
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities, nullable)
- Name
- Color
- Description
- IsActive (Boolean)

### 12.10 tkt_TicketTagAssignments
- ID (Auto-increment PK)
- TicketID (FK to tkt_Tickets)
- TagID (FK to tkt_TicketTags)
- AssignedBy (FK to cor_Stakeholders)
- AssignmentDate
- IsActive (Boolean)

### 12.11 tkt_TicketTemplates
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities, nullable)
- Name
- Description
- TicketTypeID (FK to tkt_TicketTypes)
- PriorityID (FK to tkt_TicketPriorities)
- DepartmentID (FK to tkt_Departments, nullable)
- TemplateContent
- EstimatedHours
- RequiresApproval (Boolean)
- CreatedBy (FK to cor_Stakeholders)
- CreationDate
- IsActive (Boolean)

### 12.12 tkt_TicketSLAs
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities, nullable)
- Name
- Description
- TicketTypeID (FK to tkt_TicketTypes, nullable)
- PriorityID (FK to tkt_TicketPriorities, nullable)
- DepartmentID (FK to tkt_Departments, nullable)
- ResponseTimeHours
- ResolutionTimeHours
- EscalationRoleID (FK to sec_Permissions, nullable)
- IsBusinessHours (Boolean)
- CreatedBy (FK to cor_Stakeholders)
- CreationDate
- IsActive (Boolean)

### 12.13 tkt_TicketWorkflow
- ID (Auto-increment PK)
- Name
- Description
- InitialStatusID (FK to tkt_TicketStatuses)
- CommunityID (FK to cor_Communities, nullable)
- CreatedBy (FK to cor_Stakeholders)
- CreationDate
- IsActive (Boolean)

### 12.14 tkt_TicketWorkflowTransitions
- ID (Auto-increment PK)
- WorkflowID (FK to tkt_TicketWorkflow)
- FromStatusID (FK to tkt_TicketStatuses)
- ToStatusID (FK to tkt_TicketStatuses)
- RequiredRoleID (FK to sec_Permissions, nullable)
- RequiresComment (Boolean)
- AutomaticTransition (Boolean)
- TransitionCondition (JSON - for conditional transitions)
- IsActive (Boolean)

### 12.15 tkt_TicketRecurring
- ID (Auto-increment PK)
- CommunityID (FK to cor_Communities)
- TemplateID (FK to tkt_TicketTemplates)
- Title
- Description
- RecurrencePattern (Enum: 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually', 'Custom')
- RecurrenceDetails (JSON)
- StartDate
- EndDate
- AssignToID (FK to cor_Stakeholders, nullable)
- DepartmentID (FK to tkt_Departments, nullable)
- LastRunDate
- NextRunDate
- CreatedBy (FK to cor_Stakeholders)
- IsActive (Boolean)

### 12.16 tkt_TicketDependencies
- ID (Auto-increment PK)
- PrimaryTicketID (FK to tkt_Tickets)
- DependentTicketID (FK to tkt_Tickets)
- DependencyType (Enum: 'Blocks', 'RequiredBy', 'RelatedTo', 'Duplicates')
- CreatedBy (FK to cor_Stakeholders)
- CreationDate
- IsActive (Boolean)

## Key Relationships & Implementation Notes

- cor_Communities is the central entity with relationships to most other tables
- cor_Stakeholders unifies all people and organizations in a single table with type differentiation
- IsActive boolean fields appear in all tables to support soft deletion and historical tracking
- JSON fields provide flexibility for complex data structures while maintaining relational integrity
- Encryption is used for sensitive data like account numbers
- Foreign Keys maintain referential integrity throughout the system
- Consistent Naming ensures clarity across the database
- Timestamps track creation, modification and relevant date ranges for all entities

This database design focuses on process support rather than just data storage, enabling workflows, automation, analytics, and integration with modern technologies while maintaining the core information needed for HOA management.