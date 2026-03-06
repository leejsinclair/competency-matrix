-- Initialize database for Competency Matrix Platform
-- This script runs automatically when the MSSQL container starts

-- Create the main database if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'competency_matrix')
BEGIN
    CREATE DATABASE competency_matrix;
    PRINT 'Database competency_matrix created successfully';
END
ELSE
BEGIN
    PRINT 'Database competency_matrix already exists';
END

GO

-- Use the competency_matrix database
USE competency_matrix;

GO

-- Create connector_configs table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='connector_configs' AND xtype='U')
BEGIN
    CREATE TABLE connector_configs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        connector_type NVARCHAR(50) NOT NULL,
        name NVARCHAR(100) NOT NULL,
        config NVARCHAR(MAX) NOT NULL,
        is_active BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );
    PRINT 'Table connector_configs created successfully';
END
ELSE
BEGIN
    PRINT 'Table connector_configs already exists';
END

GO

-- Create activity_events table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='activity_events' AND xtype='U')
BEGIN
    CREATE TABLE activity_events (
        id NVARCHAR(50) PRIMARY KEY,
        event_type NVARCHAR(50) NOT NULL,
        source NVARCHAR(50) NOT NULL,
        timestamp DATETIME2 NOT NULL,
        actor NVARCHAR(100) NOT NULL,
        content NVARCHAR(MAX),
        metadata NVARCHAR(MAX),
        processed_at DATETIME2,
        created_at DATETIME2 DEFAULT GETDATE()
    );
    PRINT 'Table activity_events created successfully';
END
ELSE
BEGIN
    PRINT 'Table activity_events already exists';
END

GO

-- Create artifacts table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='artifacts' AND xtype='U')
BEGIN
    CREATE TABLE artifacts (
        id NVARCHAR(50) PRIMARY KEY,
        event_id NVARCHAR(50) NOT NULL,
        artifact_type NVARCHAR(50) NOT NULL,
        content NVARCHAR(MAX) NOT NULL,
        file_path NVARCHAR(500),
        metadata NVARCHAR(MAX),
        created_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (event_id) REFERENCES activity_events(id) ON DELETE CASCADE
    );
    PRINT 'Table artifacts created successfully';
END
ELSE
BEGIN
    PRINT 'Table artifacts already exists';
END

GO

-- Create indexes for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_activity_events_timestamp')
BEGIN
    CREATE INDEX IX_activity_events_timestamp ON activity_events(timestamp);
    PRINT 'Index IX_activity_events_timestamp created successfully';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_activity_events_actor')
BEGIN
    CREATE INDEX IX_activity_events_actor ON activity_events(actor);
    PRINT 'Index IX_activity_events_actor created successfully';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_connector_configs_type')
BEGIN
    CREATE INDEX IX_connector_configs_type ON connector_configs(connector_type);
    PRINT 'Index IX_connector_configs_type created successfully';
END

GO

PRINT 'Database initialization completed successfully!';
