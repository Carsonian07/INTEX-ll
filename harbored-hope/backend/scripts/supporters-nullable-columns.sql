-- Run once on the operational database (same DB as OperationalDb connection string).
-- If you get "object not found", bracket the table name to match Object Explorer exactly, e.g. [dbo].[Supporters].

ALTER TABLE dbo.supporters ALTER COLUMN supporter_type nvarchar(50) NULL;
ALTER TABLE dbo.supporters ALTER COLUMN relationship_type nvarchar(50) NULL;
ALTER TABLE dbo.supporters ALTER COLUMN status nvarchar(20) NULL;
-- Optional: allow null acquisition_channel if you prefer nullable over app default "Direct"
-- ALTER TABLE dbo.supporters ALTER COLUMN acquisition_channel nvarchar(50) NULL;
ALTER TABLE dbo.supporters ALTER COLUMN created_at datetime2 NULL;
