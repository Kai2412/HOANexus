-- =============================================
-- INSERT TEST COMMUNITIES WITH GUID-BASED DROPDOWNS
-- =============================================
-- This script inserts test community data using GUIDs from
-- DynamicDropChoices instead of text values.
-- 
-- When dropdown display names change, communities automatically
-- reflect the new names because they reference GUIDs, not text.
-- =============================================

USE hoa_nexus_testclient;
GO

-- Insert test communities using GUID lookups from DynamicDropChoices
INSERT INTO dbo.cor_Communities (
  CommunityID, PropertyCode, DisplayName, Active, ContractStart, ContractEnd,
  LegalName, Address, Address2, City, State, Zipcode, ThirdPartyIdentifier,
  Market, Office, Website, TaxID, StateTaxID, SOSFileNumber, TaxReturnType,
  ClientTypeID, ServiceTypeID, ManagementTypeID, BuiltOutUnits, DevelopmentStageID,
  CommunityStatus, AcquisitionTypeID, PreferredContactInfo, CreatedOn, CreatedBy
)
SELECT
  NEWID() as CommunityID,
  'HC-101' as PropertyCode,
  'Harbor Cove HOA' as DisplayName,
  1 as Active,
  '2020-01-01' as ContractStart,
  NULL as ContractEnd,
  'Harbor Cove Homeowners Association' as LegalName,
  '100 Seaside Way' as Address,
  NULL as Address2,
  'San Diego' as City,
  'CA' as State,
  '92101' as Zipcode,
  'HC-EXT-001' as ThirdPartyIdentifier,
  'SoCal' as Market,
  'San Diego Office' as Office,
  'https://harborcovehoa.com' as Website,
  '94-1234567' as TaxID,
  'CA-987654' as StateTaxID,
  'SOS-CA-2020-001' as SOSFileNumber,
  'Form 1120-H' as TaxReturnType,
  (SELECT ChoiceID FROM dbo.cor_DynamicDropChoices WHERE TableName = 'cor_Communities' AND ColumnName = 'ClientType' AND ChoiceValue = 'HOA') as ClientTypeID,
  (SELECT ChoiceID FROM dbo.cor_DynamicDropChoices WHERE TableName = 'cor_Communities' AND ColumnName = 'ServiceType' AND ChoiceValue = 'Full Service') as ServiceTypeID,
  (SELECT ChoiceID FROM dbo.cor_DynamicDropChoices WHERE TableName = 'cor_Communities' AND ColumnName = 'ManagementType' AND ChoiceValue = 'Portfolio') as ManagementTypeID,
  128 as BuiltOutUnits,
  (SELECT ChoiceID FROM dbo.cor_DynamicDropChoices WHERE TableName = 'cor_Communities' AND ColumnName = 'DevelopmentStage' AND ChoiceValue = 'Homeowner Controlled') as DevelopmentStageID,
  'Active' as CommunityStatus,
  (SELECT ChoiceID FROM dbo.cor_DynamicDropChoices WHERE TableName = 'cor_Communities' AND ColumnName = 'AcquisitionType' AND ChoiceValue = 'Organic') as AcquisitionTypeID,
  'contact@harborcovehoa.com' as PreferredContactInfo,
  SYSUTCDATETIME() as CreatedOn,
  NULL as CreatedBy

UNION ALL

SELECT
  NEWID(),
  'SR-214',
  'Sunrise Ridge',
  1,
  '2019-05-01',
  NULL,
  'Sunrise Ridge Condominium Association',
  '450 Summit Blvd',
  'Suite 200',
  'Denver',
  'CO',
  '80202',
  'SR-EXT-004',
  'Mountain',
  'Denver Office',
  'https://sunriseridgecondo.com',
  '84-7654321',
  'CO-123987',
  'SOS-CO-2019-214',
  'Form 1120-H',
  (SELECT ChoiceID FROM dbo.cor_DynamicDropChoices WHERE TableName = 'cor_Communities' AND ColumnName = 'ClientType' AND ChoiceValue = 'Condominium'),
  (SELECT ChoiceID FROM dbo.cor_DynamicDropChoices WHERE TableName = 'cor_Communities' AND ColumnName = 'ServiceType' AND ChoiceValue = 'Hybrid'),
  (SELECT ChoiceID FROM dbo.cor_DynamicDropChoices WHERE TableName = 'cor_Communities' AND ColumnName = 'ManagementType' AND ChoiceValue = 'Hybrid'),
  96,
  (SELECT ChoiceID FROM dbo.cor_DynamicDropChoices WHERE TableName = 'cor_Communities' AND ColumnName = 'DevelopmentStage' AND ChoiceValue = 'Declarant Controlled'),
  'Active',
  (SELECT ChoiceID FROM dbo.cor_DynamicDropChoices WHERE TableName = 'cor_Communities' AND ColumnName = 'AcquisitionType' AND ChoiceValue = 'Acquisition'),
  '+1-303-555-0198',
  SYSUTCDATETIME(),
  NULL

UNION ALL

SELECT
  NEWID(),
  'LW-332',
  'Lakewood Townhomes',
  1,
  '2021-03-15',
  NULL,
  'Lakewood Townhomes Association',
  '880 Lakeside Dr',
  NULL,
  'Austin',
  'TX',
  '78704',
  'LW-EXT-007',
  'Texas',
  'Austin Office',
  'https://lakewoodtownhomes.org',
  '76-4567890',
  'TX-654321',
  'SOS-TX-2021-332',
  'Form 1120-H',
  (SELECT ChoiceID FROM dbo.cor_DynamicDropChoices WHERE TableName = 'cor_Communities' AND ColumnName = 'ClientType' AND ChoiceValue = 'Townhomes'),
  (SELECT ChoiceID FROM dbo.cor_DynamicDropChoices WHERE TableName = 'cor_Communities' AND ColumnName = 'ServiceType' AND ChoiceValue = 'Accounting Only'),
  (SELECT ChoiceID FROM dbo.cor_DynamicDropChoices WHERE TableName = 'cor_Communities' AND ColumnName = 'ManagementType' AND ChoiceValue = 'Portfolio'),
  72,
  (SELECT ChoiceID FROM dbo.cor_DynamicDropChoices WHERE TableName = 'cor_Communities' AND ColumnName = 'DevelopmentStage' AND ChoiceValue = 'Homeowner Controlled'),
  'Active',
  (SELECT ChoiceID FROM dbo.cor_DynamicDropChoices WHERE TableName = 'cor_Communities' AND ColumnName = 'AcquisitionType' AND ChoiceValue = 'Organic'),
  'manager@lakewoodtownhomes.org',
  SYSUTCDATETIME(),
  NULL

UNION ALL

SELECT
  NEWID(),
  'MU-045',
  'Metro Union Mixed-Use',
  0,
  '2018-07-01',
  '2024-06-30',
  'Metro Union Community Association',
  '900 Market St',
  'Floor 8',
  'Philadelphia',
  'PA',
  '19107',
  'MU-EXT-010',
  'Mid-Atlantic',
  'Philadelphia Office',
  'https://metrounion.org',
  '23-9081726',
  'PA-908172',
  'SOS-PA-2018-045',
  'Form 1120',
  (SELECT ChoiceID FROM dbo.cor_DynamicDropChoices WHERE TableName = 'cor_Communities' AND ColumnName = 'ClientType' AND ChoiceValue = 'Mixed Use'),
  (SELECT ChoiceID FROM dbo.cor_DynamicDropChoices WHERE TableName = 'cor_Communities' AND ColumnName = 'ServiceType' AND ChoiceValue = 'Compliance Only'),
  (SELECT ChoiceID FROM dbo.cor_DynamicDropChoices WHERE TableName = 'cor_Communities' AND ColumnName = 'ManagementType' AND ChoiceValue = 'Onsite'),
  210,
  (SELECT ChoiceID FROM dbo.cor_DynamicDropChoices WHERE TableName = 'cor_Communities' AND ColumnName = 'DevelopmentStage' AND ChoiceValue = 'Homeowner Controlled'),
  'Inactive',
  (SELECT ChoiceID FROM dbo.cor_DynamicDropChoices WHERE TableName = 'cor_Communities' AND ColumnName = 'AcquisitionType' AND ChoiceValue = 'Acquisition'),
  'admin@metrounion.org',
  SYSUTCDATETIME(),
  NULL

UNION ALL

SELECT
  NEWID(),
  'CC-220',
  'Commerce Center Condo',
  1,
  '2022-02-01',
  NULL,
  'Commerce Center Condominium Board',
  '150 Corporate Plaza',
  NULL,
  'Chicago',
  'IL',
  '60601',
  'CC-EXT-015',
  'Great Lakes',
  'Chicago Office',
  'https://commercecentercondo.com',
  '36-1092837',
  'IL-109283',
  'SOS-IL-2022-220',
  'Form 1120',
  (SELECT ChoiceID FROM dbo.cor_DynamicDropChoices WHERE TableName = 'cor_Communities' AND ColumnName = 'ClientType' AND ChoiceValue = 'Commercial Condominium'),
  (SELECT ChoiceID FROM dbo.cor_DynamicDropChoices WHERE TableName = 'cor_Communities' AND ColumnName = 'ServiceType' AND ChoiceValue = 'Full Service'),
  (SELECT ChoiceID FROM dbo.cor_DynamicDropChoices WHERE TableName = 'cor_Communities' AND ColumnName = 'ManagementType' AND ChoiceValue = 'Onsite'),
  54,
  (SELECT ChoiceID FROM dbo.cor_DynamicDropChoices WHERE TableName = 'cor_Communities' AND ColumnName = 'DevelopmentStage' AND ChoiceValue = 'Declarant Controlled'),
  'Active',
  (SELECT ChoiceID FROM dbo.cor_DynamicDropChoices WHERE TableName = 'cor_Communities' AND ColumnName = 'AcquisitionType' AND ChoiceValue = 'Organic'),
  'concierge@commercecentercondo.com',
  SYSUTCDATETIME(),
  NULL;
GO

PRINT '=============================================';
PRINT 'Test communities inserted successfully!';
PRINT 'All dropdown values are linked via GUIDs.';
PRINT 'Changing display names in DynamicDropChoices';
PRINT 'will automatically cascade to communities.';
PRINT '=============================================';
GO

