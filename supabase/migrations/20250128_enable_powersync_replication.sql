-- Enable logical replication for PowerSync
-- This migration creates the publication and replication slot needed by PowerSync

-- Create a role/user with replication privileges for PowerSync
CREATE ROLE powersync_role WITH REPLICATION BYPASSRLS LOGIN PASSWORD 'myhighlyrandompassword';
-- Set up permissions for the newly created role
-- Read-only (SELECT) access is required
GRANT SELECT ON ALL TABLES IN SCHEMA public TO powersync_role;

-- Optionally, grant SELECT on all future tables (to cater for schema additions)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO powersync_role;

-- Create a publication to replicate tables. The publication must be named "powersync"
CREATE PUBLICATION powersync FOR ALL TABLES;

-- Ensure the tables have REPLICA IDENTITY set (required for UPDATE/DELETE replication)
ALTER TABLE task REPLICA IDENTITY DEFAULT;
ALTER TABLE executor REPLICA IDENTITY DEFAULT;
ALTER TABLE executor_occupied REPLICA IDENTITY DEFAULT;

