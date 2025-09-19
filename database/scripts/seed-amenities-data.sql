-- HOA NEXUS - AMENITIES SYSTEM SEED DATA
-- This script populates configuration tables and creates sample amenities

-- ==============================================
-- CONFIGURATION DATA
-- ==============================================

-- Amenity Types
INSERT INTO cfg_AmenityTypes (TypeName, Description, IconClass, DefaultCapacity) VALUES
('Pool', 'Swimming pools and aquatic facilities', 'swimming-pool', 50),
('Clubhouse', 'Community clubhouse and event spaces', 'building', 100),
('Gym', 'Fitness center and exercise facilities', 'dumbbell', 25),
('Tennis Court', 'Tennis and racquet sport courts', 'tennis-ball', 4),
('Basketball Court', 'Basketball courts and sport courts', 'basketball', 10),
('Playground', 'Children playground and play areas', 'child', 30),
('Dog Park', 'Pet exercise and play areas', 'dog', 15),
('BBQ Area', 'Barbecue grills and picnic areas', 'grill', 20),
('Meeting Room', 'Conference and meeting rooms', 'users', 12),
('Theater Room', 'Movie theater and entertainment rooms', 'film', 20);

-- Asset Types
INSERT INTO cfg_AssetTypes (TypeName, Description, Category) VALUES
('Building', 'Main structures and buildings', 'Building'),
('HVAC System', 'Heating, ventilation, and air conditioning', 'Equipment'),
('Pool Equipment', 'Pumps, filters, and pool maintenance equipment', 'Equipment'),
('Fitness Equipment', 'Exercise machines and gym equipment', 'Equipment'),
('Landscaping', 'Trees, plants, and landscape features', 'Landscape'),
('Lighting', 'Outdoor and indoor lighting systems', 'Equipment'),
('Security System', 'Cameras, alarms, and access control', 'Equipment'),
('Playground Equipment', 'Swings, slides, and play structures', 'Equipment'),
('Furniture', 'Tables, chairs, and indoor furniture', 'Equipment'),
('Technology', 'Audio/visual equipment and IT infrastructure', 'Equipment');

-- Status Types
INSERT INTO cfg_StatusTypes (StatusName, Description, Category, ColorCode) VALUES
-- General statuses
('Active', 'Currently active and operational', 'General', '#10b981'),
('Inactive', 'Currently inactive or disabled', 'General', '#6b7280'),
('Pending', 'Awaiting approval or processing', 'General', '#f59e0b'),
('Cancelled', 'Cancelled or terminated', 'General', '#ef4444'),
-- Amenity-specific statuses
('Available', 'Available for reservations', 'Amenities', '#10b981'),
('Maintenance', 'Under maintenance or repair', 'Amenities', '#f59e0b'),
('Out of Service', 'Temporarily out of service', 'Amenities', '#ef4444'),
('Seasonal Closed', 'Closed for seasonal reasons', 'Amenities', '#6b7280'),
-- Work Order statuses
('Open', 'Work order is open and pending', 'WorkOrders', '#3b82f6'),
('In Progress', 'Work is currently being performed', 'WorkOrders', '#f59e0b'),
('Completed', 'Work has been completed', 'WorkOrders', '#10b981'),
('On Hold', 'Work is temporarily on hold', 'WorkOrders', '#6b7280'),
-- Reservation statuses
('Confirmed', 'Reservation is confirmed', 'Reservations', '#10b981'),
('Pending Approval', 'Awaiting management approval', 'Reservations', '#f59e0b'),
('Rejected', 'Reservation has been rejected', 'Reservations', '#ef4444');

-- Priority Levels
INSERT INTO cfg_PriorityLevels (PriorityName, Description, SortOrder, ColorCode) VALUES
('Low', 'Non-urgent, can be scheduled for later', 1, '#10b981'),
('Normal', 'Standard priority, normal timeline', 2, '#3b82f6'),
('High', 'Important, should be addressed soon', 3, '#f59e0b'),
('Emergency', 'Urgent, requires immediate attention', 4, '#ef4444');

-- Request Types
INSERT INTO cfg_RequestTypes (TypeName, Description, Category, DefaultPriority) VALUES
('Repair', 'Fix broken or damaged equipment/facilities', 'Repair', 'Normal'),
('Maintenance', 'Routine maintenance and upkeep', 'Maintenance', 'Normal'),
('Inspection', 'Safety or compliance inspections', 'Inspection', 'Normal'),
('Installation', 'Install new equipment or features', 'Installation', 'Normal'),
('Cleaning', 'Deep cleaning or special cleaning requests', 'Maintenance', 'Low'),
('Emergency Repair', 'Urgent repairs for safety or security', 'Repair', 'Emergency'),
('Upgrade', 'Improvements or upgrades to existing facilities', 'Installation', 'Low'),
('Preventive Maintenance', 'Scheduled preventive maintenance', 'Maintenance', 'Normal');

-- Basic Permissions
INSERT INTO sec_Permissions (PermissionName, Description, Category) VALUES
-- Amenities permissions
('amenities:view', 'View amenities in assigned communities', 'amenities'),
('amenities:create', 'Create new amenities', 'amenities'),
('amenities:edit', 'Edit existing amenities', 'amenities'),
('amenities:delete', 'Delete amenities', 'amenities'),
('amenities:manage', 'Full amenity management access', 'amenities'),
-- Reservations permissions
('reservations:create', 'Make amenity reservations', 'reservations'),
('reservations:view_own', 'View own reservations', 'reservations'),
('reservations:view_all', 'View all reservations in community', 'reservations'),
('reservations:cancel_own', 'Cancel own reservations', 'reservations'),
('reservations:cancel_any', 'Cancel any reservation', 'reservations'),
('reservations:approve', 'Approve pending reservations', 'reservations'),
-- Work Orders permissions
('workorders:create', 'Create work order requests', 'workorders'),
('workorders:view_own', 'View own work orders', 'workorders'),
('workorders:view_all', 'View all work orders in community', 'workorders'),
('workorders:assign', 'Assign work orders to technicians', 'workorders'),
('workorders:manage', 'Full work order management', 'workorders'),
-- Communities permissions
('communities:view_assigned', 'View assigned communities', 'communities'),
('communities:view_all', 'View all communities', 'communities'),
('communities:manage', 'Manage community settings', 'communities');

-- ==============================================
-- SAMPLE DATA FOR TESTING
-- ==============================================

-- Sample Communities (if not already exist)
IF NOT EXISTS (SELECT 1 FROM cor_Communities WHERE Pcode = 'DEMO001')
INSERT INTO cor_Communities (Pcode, Name, Status, Units, Address, City, State, ZipCode) VALUES
('DEMO001', 'Sunset Gardens HOA', 'Active', 245, '123 Main Street', 'Phoenix', 'AZ', '85001');

IF NOT EXISTS (SELECT 1 FROM cor_Communities WHERE Pcode = 'DEMO002')
INSERT INTO cor_Communities (Pcode, Name, Status, Units, Address, City, State, ZipCode) VALUES
('DEMO002', 'Oakwood Estates', 'Active', 180, '456 Oak Avenue', 'Scottsdale', 'AZ', '85251');

IF NOT EXISTS (SELECT 1 FROM cor_Communities WHERE Pcode = 'DEMO003')
INSERT INTO cor_Communities (Pcode, Name, Status, Units, Address, City, State, ZipCode) VALUES
('DEMO003', 'Palm Valley Resort Community', 'Active', 320, '789 Palm Drive', 'Tempe', 'AZ', '85284');

-- Sample User Account (for testing)
IF NOT EXISTS (SELECT 1 FROM sec_UserAccounts WHERE Email = 'demo@hoanexus.com')
INSERT INTO sec_UserAccounts (Auth0ID, Email, FirstName, LastName) VALUES
('auth0|demo123', 'demo@hoanexus.com', 'Demo', 'Manager');

-- Sample Amenities for Demo Communities
DECLARE @Community1ID int = (SELECT CommunityID FROM cor_Communities WHERE Pcode = 'DEMO001');
DECLARE @Community2ID int = (SELECT CommunityID FROM cor_Communities WHERE Pcode = 'DEMO002');
DECLARE @Community3ID int = (SELECT CommunityID FROM cor_Communities WHERE Pcode = 'DEMO003');

-- Sunset Gardens HOA Amenities
INSERT INTO op_Amenities (CommunityID, Name, AmenityType, Status, Description, Location, Capacity, IsReservable, RequiresApproval, ReservationFee) VALUES
(@Community1ID, 'Main Pool', 'Pool', 'Available', 'Large heated community pool with lap lanes', 'Pool Area North', 75, 1, 0, 0.00),
(@Community1ID, 'Spa/Hot Tub', 'Pool', 'Available', 'Relaxing spa adjacent to main pool', 'Pool Area North', 12, 1, 0, 0.00),
(@Community1ID, 'Community Clubhouse', 'Clubhouse', 'Available', 'Main event space with kitchen facilities', 'Building A', 150, 1, 1, 50.00),
(@Community1ID, 'Fitness Center', 'Gym', 'Available', 'Fully equipped fitness center', 'Building A Lower Level', 30, 0, 0, 0.00),
(@Community1ID, 'Tennis Court 1', 'Tennis Court', 'Available', 'Hard surface tennis court with lighting', 'Recreation Area', 4, 1, 0, 10.00),
(@Community1ID, 'Tennis Court 2', 'Tennis Court', 'Available', 'Hard surface tennis court with lighting', 'Recreation Area', 4, 1, 0, 10.00),
(@Community1ID, 'BBQ Pavilion', 'BBQ Area', 'Available', 'Covered pavilion with gas grills', 'Park Area', 25, 1, 0, 15.00);

-- Oakwood Estates Amenities
INSERT INTO op_Amenities (CommunityID, Name, AmenityType, Status, Description, Location, Capacity, IsReservable, RequiresApproval, ReservationFee) VALUES
(@Community2ID, 'Resort Pool', 'Pool', 'Available', 'Resort-style pool with waterfall feature', 'Central Courtyard', 60, 1, 0, 0.00),
(@Community2ID, 'Executive Clubhouse', 'Clubhouse', 'Available', 'Elegant clubhouse for private events', 'Main Building', 100, 1, 1, 75.00),
(@Community2ID, 'Business Center', 'Meeting Room', 'Available', 'Quiet workspace with computers and printer', 'Main Building', 8, 1, 0, 0.00),
(@Community2ID, 'Theater Room', 'Theater Room', 'Available', 'Home theater with surround sound', 'Main Building', 16, 1, 0, 20.00),
(@Community2ID, 'Dog Park', 'Dog Park', 'Available', 'Fenced area for dogs to exercise', 'West Side', 20, 0, 0, 0.00);

-- Palm Valley Resort Community Amenities
INSERT INTO op_Amenities (CommunityID, Name, AmenityType, Status, Description, Location, Capacity, IsReservable, RequiresApproval, ReservationFee) VALUES
(@Community3ID, 'Olympic Pool', 'Pool', 'Available', '25-meter lap pool for serious swimmers', 'Aquatic Center', 50, 1, 0, 0.00),
(@Community3ID, 'Recreation Pool', 'Pool', 'Available', 'Family-friendly pool with shallow end', 'Aquatic Center', 80, 1, 0, 0.00),
(@Community3ID, 'Luxury Spa', 'Pool', 'Available', 'High-end spa with jets and heating', 'Aquatic Center', 15, 1, 1, 25.00),
(@Community3ID, 'Grand Ballroom', 'Clubhouse', 'Available', 'Large ballroom for weddings and events', 'Event Center', 250, 1, 1, 200.00),
(@Community3ID, 'Sunset Terrace', 'Clubhouse', 'Available', 'Outdoor covered terrace with mountain views', 'Event Center', 100, 1, 1, 100.00),
(@Community3ID, 'State-of-the-Art Gym', 'Gym', 'Available', 'Professional-grade fitness equipment', 'Wellness Center', 40, 0, 0, 0.00),
(@Community3ID, 'Tennis Court A', 'Tennis Court', 'Available', 'Championship court with stadium seating', 'Tennis Complex', 4, 1, 0, 15.00),
(@Community3ID, 'Tennis Court B', 'Tennis Court', 'Available', 'Practice court with ball machine', 'Tennis Complex', 4, 1, 0, 10.00),
(@Community3ID, 'Basketball Court', 'Basketball Court', 'Available', 'Full court with adjustable hoops', 'Sports Complex', 12, 1, 0, 20.00),
(@Community3ID, 'Kids Playground', 'Playground', 'Available', 'Modern playground with safety surfacing', 'Family Area', 40, 0, 0, 0.00);

-- Sample Operating Schedules (7 days a week for most amenities)
DECLARE @AmenityIDs TABLE (AmenityID int);
INSERT INTO @AmenityIDs SELECT AmenityID FROM op_Amenities;

-- Create standard schedules for all amenities (6 AM to 10 PM daily)
INSERT INTO op_AmenitySchedules (AmenityID, DayOfWeek, OpenTime, CloseTime, IsOpen, EffectiveStartDate)
SELECT a.AmenityID, d.DayOfWeek, '06:00:00', '22:00:00', 1, GETDATE()
FROM @AmenityIDs a
CROSS JOIN (
    SELECT 0 AS DayOfWeek UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 
    UNION SELECT 4 UNION SELECT 5 UNION SELECT 6
) d;

-- Sample Amenity Features
INSERT INTO op_AmenityFeatures (AmenityID, FeatureName, Description) 
SELECT AmenityID, 'Lighting System', 'LED lighting for evening use'
FROM op_Amenities WHERE AmenityType IN ('Tennis Court', 'Basketball Court');

INSERT INTO op_AmenityFeatures (AmenityID, FeatureName, Description)
SELECT AmenityID, 'Sound System', 'Built-in audio system'
FROM op_Amenities WHERE AmenityType IN ('Clubhouse', 'Theater Room');

INSERT INTO op_AmenityFeatures (AmenityID, FeatureName, Description)
SELECT AmenityID, 'Kitchen Facilities', 'Full commercial kitchen'
FROM op_Amenities WHERE Name LIKE '%Clubhouse%' OR Name LIKE '%Ballroom%';

PRINT 'HOA Nexus Amenities Seed Data Inserted Successfully';
PRINT 'Sample Communities: 3';
PRINT 'Sample Amenities: ' + CAST((SELECT COUNT(*) FROM op_Amenities) AS nvarchar(10));
PRINT 'Configuration Records Created for Types, Statuses, and Permissions';
