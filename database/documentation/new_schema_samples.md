# New Schema Samples

Reference sheet for the refreshed `cor_` tables introduced during the production-ready redesign. Use this document to find the latest seed values without running database queries.

## Rename Checklist

```sql
EXEC sp_rename 'dbo.cor_Communities', 'cor_Communities_legacy';
EXEC sp_rename 'dbo.new_community', 'cor_Communities';

EXEC sp_rename 'dbo.new_dynamic_drop_choices', 'cor_DynamicDropChoices';
```

> Once the legacy tables are retired, comment out or remove the `sp_rename` calls above.

## `cor_Communities`

IF OBJECT_ID('dbo.cor_Communities', 'U') IS NOT NULL
  DROP TABLE dbo.cor_Communities;
GO

CREATE TABLE dbo.cor_Communities (
  CommunityID          uniqueidentifier NOT NULL PRIMARY KEY,
  PropertyCode         varchar(50)  NULL,
  DisplayName          varchar(150) NULL,
  Active               bit          NOT NULL CONSTRAINT DF_cor_Communities_Active DEFAULT (1),
  ContractStart        date         NULL,
  ContractEnd          date         NULL,
  LegalName            varchar(200) NULL,
  Address              varchar(200) NULL,
  Address2             varchar(200) NULL,
  City                 varchar(100) NULL,
  State                varchar(50) NULL,
  Zipcode              varchar(20)  NULL,
  ThirdPartyIdentifier varchar(100) NULL,
  Market               varchar(100) NULL,
  Office               varchar(100) NULL,
  Website              varchar(200) NULL,
  TaxID                varchar(30)  NULL,
  StateTaxID           varchar(30)  NULL,
  SOSFileNumber        varchar(30)  NULL,
  TaxReturnType        varchar(50)  NULL,
  ClientType           varchar(30)  NULL,
  ServiceType          varchar(30)  NULL,
  ManagementType       varchar(30)  NULL,
  BuiltOutUnits        int          NULL,
  DevelopmentStage     varchar(30)  NULL,
  CommunityStatus      varchar(100) NULL,
  AcquisitionType      varchar(30)  NULL,
  PreferredContactInfo varchar(200) NULL,
  CreatedOn            datetime2    NOT NULL CONSTRAINT DF_cor_Communities_CreatedOn DEFAULT (SYSUTCDATETIME()),
  CreatedBy            uniqueidentifier NULL,
  ModifiedOn           datetime2    NULL,
  ModifiedBy           uniqueidentifier NULL
);
GO

INSERT INTO dbo.cor_Communities (
  CommunityID, PropertyCode, DisplayName, Active, ContractStart, ContractEnd,
  LegalName, Address, Address2, City, State, Zipcode, ThirdPartyIdentifier,
  Market, Office, Website, TaxID, StateTaxID, SOSFileNumber, TaxReturnType,
  ClientType, ServiceType, ManagementType, BuiltOutUnits, DevelopmentStage,
  CommunityStatus, AcquisitionType, PreferredContactInfo, CreatedOn, CreatedBy
)
VALUES
  (NEWID(), 'HC-101', 'Harbor Cove HOA', 1, '2020-01-01', NULL,
   'Harbor Cove Homeowners Association', '100 Seaside Way', NULL, 'San Diego', 'CA', '92101', 'HC-EXT-001',
   'SoCal', 'San Diego Office', 'https://harborcovehoa.com', '94-1234567', 'CA-987654', 'SOS-CA-2020-001',
   'Form 1120-H', 'HOA', 'Full Service', 'Portfolio', 128, 'Homeowner Controlled',
   'Active', 'Organic', 'contact@harborcovehoa.com', SYSUTCDATETIME(), NULL),

  (NEWID(), 'SR-214', 'Sunrise Ridge', 1, '2019-05-01', NULL,
   'Sunrise Ridge Condominium Association', '450 Summit Blvd', 'Suite 200', 'Denver', 'CO', '80202', 'SR-EXT-004',
   'Mountain', 'Denver Office', 'https://sunriseridgecondo.com', '84-7654321', 'CO-123987', 'SOS-CO-2019-214',
   'Form 1120-H', 'Condominium', 'Hybrid', 'Hybrid', 96, 'Declarant Controlled',
   'Active', 'Acquisition', '+1-303-555-0198', SYSUTCDATETIME(), NULL),

  (NEWID(), 'LW-332', 'Lakewood Townhomes', 1, '2021-03-15', NULL,
   'Lakewood Townhomes Association', '880 Lakeside Dr', NULL, 'Austin', 'TX', '78704', 'LW-EXT-007',
   'Texas', 'Austin Office', 'https://lakewoodtownhomes.org', '76-4567890', 'TX-654321', 'SOS-TX-2021-332',
   'Form 1120-H', 'Townhomes', 'Accounting Only', 'Portfolio', 72, 'Homeowner Controlled',
   'Active', 'Organic', 'manager@lakewoodtownhomes.org', SYSUTCDATETIME(), NULL),

  (NEWID(), 'MU-045', 'Metro Union Mixed-Use', 0, '2018-07-01', '2024-06-30',
   'Metro Union Community Association', '900 Market St', 'Floor 8', 'Philadelphia', 'PA', '19107', 'MU-EXT-010',
   'Mid-Atlantic', 'Philadelphia Office', 'https://metrounion.org', '23-9081726', 'PA-908172', 'SOS-PA-2018-045',
   'Form 1120', 'Mixed Use', 'Compliance Only', 'Onsite', 210, 'Homeowner Controlled',
   'Inactive', 'Acquisition', 'admin@metrounion.org', SYSUTCDATETIME(), NULL),

  (NEWID(),'CC-220', 'Commerce Center Condo', 1, '2022-02-01', NULL,
   'Commerce Center Condominium Board', '150 Corporate Plaza', NULL, 'Chicago', 'IL', '60601', 'CC-EXT-015',
   'Great Lakes', 'Chicago Office', 'https://commercecentercondo.com', '36-1092837', 'IL-109283', 'SOS-IL-2022-220',
   'Form 1120', 'Commercial Condominium', 'Full Service', 'Onsite', 54, 'Declarant Controlled',
   'Active', 'Organic', 'concierge@commercecentercondo.com', SYSUTCDATETIME(), NULL);
GO


-- cor_DynamicDropChoices.sql

IF OBJECT_ID('dbo.cor_DynamicDropChoices', 'U') IS NOT NULL
  DROP TABLE dbo.cor_DynamicDropChoices;
GO

CREATE TABLE dbo.cor_DynamicDropChoices (
  ChoiceID      uniqueidentifier NOT NULL CONSTRAINT PK_cor_DynamicDropChoices PRIMARY KEY,
  TableName     varchar(100) NOT NULL,
  ColumnName    varchar(100) NOT NULL,
  ChoiceValue   varchar(150) NOT NULL,
  DisplayOrder  int NOT NULL,
  IsDefault     bit NOT NULL CONSTRAINT DF_cor_DynamicDropChoices_IsDefault DEFAULT (0),
  IsActive      bit NOT NULL CONSTRAINT DF_cor_DynamicDropChoices_IsActive DEFAULT (1),
  CreatedOn     datetime2 NOT NULL CONSTRAINT DF_cor_DynamicDropChoices_CreatedOn DEFAULT (SYSUTCDATETIME()),
  CreatedBy     uniqueidentifier NULL,
  ModifiedOn    datetime2 NULL,
  ModifiedBy    uniqueidentifier NULL
);
GO

CREATE NONCLUSTERED INDEX IX_cor_DynamicDropChoices_TableColumn
  ON dbo.cor_DynamicDropChoices (TableName, ColumnName);

CREATE NONCLUSTERED INDEX IX_cor_DynamicDropChoices_TableColumnDisplayOrder
  ON dbo.cor_DynamicDropChoices (TableName, ColumnName, DisplayOrder);

CREATE UNIQUE NONCLUSTERED INDEX UX_cor_DynamicDropChoices_TableColumnValue_Active
  ON dbo.cor_DynamicDropChoices (TableName, ColumnName, ChoiceValue)
  WHERE IsActive = 1;
GO

INSERT INTO dbo.cor_DynamicDropChoices
  (ChoiceID, TableName, ColumnName, ChoiceValue, DisplayOrder, IsDefault, IsActive, CreatedOn, CreatedBy)
VALUES
  -- Client Type
  (NEWID(), 'cor_Communities', 'ClientType', 'HOA',                      1, 1, 1, SYSUTCDATETIME(), NULL),
  (NEWID(), 'cor_Communities', 'ClientType', 'Condominium',              2, 0, 1, SYSUTCDATETIME(), NULL),
  (NEWID(), 'cor_Communities', 'ClientType', 'Commercial',               3, 0, 1, SYSUTCDATETIME(), NULL),
  (NEWID(), 'cor_Communities', 'ClientType', 'Commercial Condominium',   4, 0, 1, SYSUTCDATETIME(), NULL),
  (NEWID(), 'cor_Communities', 'ClientType', 'Mixed Use',                5, 0, 1, SYSUTCDATETIME(), NULL),
  (NEWID(), 'cor_Communities', 'ClientType', 'Townhomes',                6, 0, 1, SYSUTCDATETIME(), NULL),
  (NEWID(), 'cor_Communities', 'ClientType', 'Other',                    7, 0, 1, SYSUTCDATETIME(), NULL),

  -- Service Type
  (NEWID(), 'cor_Communities', 'ServiceType', 'Full Service',      1, 1, 1, SYSUTCDATETIME(), NULL),
  (NEWID(), 'cor_Communities', 'ServiceType', 'Hybrid',            2, 0, 1, SYSUTCDATETIME(), NULL),
  (NEWID(), 'cor_Communities', 'ServiceType', 'Accounting Only',   3, 0, 1, SYSUTCDATETIME(), NULL),
  (NEWID(), 'cor_Communities', 'ServiceType', 'Compliance Only',   4, 0, 1, SYSUTCDATETIME(), NULL),

  -- Management Type
  (NEWID(), 'cor_Communities', 'ManagementType', 'Portfolio',      1, 1, 1, SYSUTCDATETIME(), NULL),
  (NEWID(), 'cor_Communities', 'ManagementType', 'Onsite',         2, 0, 1, SYSUTCDATETIME(), NULL),
  (NEWID(), 'cor_Communities', 'ManagementType', 'Hybrid',         3, 0, 1, SYSUTCDATETIME(), NULL),

  -- Development Stage
  (NEWID(), 'cor_Communities', 'DevelopmentStage', 'Homeowner Controlled', 1, 1, 1, SYSUTCDATETIME(), NULL),
  (NEWID(), 'cor_Communities', 'DevelopmentStage', 'Declarant Controlled', 2, 0, 1, SYSUTCDATETIME(), NULL),

  -- Acquisition Type
  (NEWID(), 'cor_Communities', 'AcquisitionType', 'Organic',       1, 1, 1, SYSUTCDATETIME(), NULL),
  (NEWID(), 'cor_Communities', 'AcquisitionType', 'Acquisition',   2, 0, 1, SYSUTCDATETIME(), NULL);
GO