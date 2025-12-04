-- =============================================
-- ONE-OFF TABLE UPDATES & NEW TABLE CREATION
-- =============================================
-- This file is used for:
-- 1. Creating new tables incrementally (without running full create-client-database.sql)
-- 2. Adding columns to existing tables
-- 3. Creating indexes on new tables
-- 4. Inserting seed data for new tables
--
-- WORKFLOW:
-- 1. Add your table creation/update SQL here
-- 2. Test it in development
-- 3. Periodically update create-client-database.sql to include these changes
-- 4. Clear this file after changes are merged into create-client-database.sql
--
-- NOTE: This file is meant to be temporary - changes should eventually
-- be merged into the main create-client-database.sql script.
-- =============================================

USE hoa_nexus_testclient;
GO

-- =============================================
-- ADD YOUR TABLE CREATIONS/UPDATES BELOW
-- =============================================

PRINT 'One-off table updates completed.';
GO
