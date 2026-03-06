-- Processing and competency analysis schema

-- Check if table exists and drop if needed
IF OBJECT_ID('competency_labels', 'U') IS NOT NULL
    PRINT 'Table competency_labels already exists'
ELSE
BEGIN
    -- Competency labels table
    CREATE TABLE competency_labels (
        id INT IDENTITY(1,1) PRIMARY KEY,
        event_id NVARCHAR(255) NOT NULL,
        connector_id INT NOT NULL,
        competency_category NVARCHAR(100) NOT NULL,
        competency_row NVARCHAR(100) NOT NULL,
        level INT NOT NULL,
        confidence DECIMAL(3,2) NOT NULL,
        source NVARCHAR(20) NOT NULL CHECK (source IN ('rule', 'ml', 'manual')),
        evidence NVARCHAR(MAX),
        created_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (connector_id) REFERENCES connector_configs(id)
    );
    
    CREATE INDEX IX_competency_labels_connector ON competency_labels(connector_id);
    CREATE INDEX IX_competency_labels_category ON competency_labels(competency_category);
    CREATE INDEX IX_competency_labels_created ON competency_labels(created_at);
    
    PRINT 'Table competency_labels created successfully';
END

IF OBJECT_ID('processing_errors', 'U') IS NOT NULL
    PRINT 'Table processing_errors already exists'
ELSE
BEGIN
    -- Processing errors table
    CREATE TABLE processing_errors (
        id INT IDENTITY(1,1) PRIMARY KEY,
        event_id NVARCHAR(255) NOT NULL,
        connector_id INT NOT NULL,
        error NVARCHAR(MAX) NOT NULL,
        severity NVARCHAR(10) NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
        created_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (connector_id) REFERENCES connector_configs(id)
    );
    
    CREATE INDEX IX_processing_errors_connector ON processing_errors(connector_id);
    CREATE INDEX IX_processing_errors_severity ON processing_errors(severity);
    CREATE INDEX IX_processing_errors_created ON processing_errors(created_at);
    
    PRINT 'Table processing_errors created successfully';
END

IF OBJECT_ID('feature_vectors', 'U') IS NOT NULL
    PRINT 'Table feature_vectors already exists'
ELSE
BEGIN
    -- Feature vectors table (for ML processing)
    CREATE TABLE feature_vectors (
        id INT IDENTITY(1,1) PRIMARY KEY,
        event_id NVARCHAR(255) NOT NULL,
        connector_id INT NOT NULL,
        algorithm NVARCHAR(50) NOT NULL,
        version NVARCHAR(20) NOT NULL,
        features NVARCHAR(MAX) NOT NULL, -- JSON string
        vector NVARCHAR(MAX) NOT NULL, -- JSON array
        created_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (connector_id) REFERENCES connector_configs(id)
    );
    
    CREATE INDEX IX_feature_vectors_connector ON feature_vectors(connector_id);
    CREATE INDEX IX_feature_vectors_algorithm ON feature_vectors(algorithm);
    
    PRINT 'Table feature_vectors created successfully';
END

IF OBJECT_ID('events', 'U') IS NOT NULL
    PRINT 'Table events already exists'
ELSE
BEGIN
    -- Events table (to track processed events)
    CREATE TABLE events (
        id INT IDENTITY(1,1) PRIMARY KEY,
        event_id NVARCHAR(255) NOT NULL UNIQUE,
        connector_id INT NOT NULL,
        source NVARCHAR(50) NOT NULL,
        event_type NVARCHAR(100) NOT NULL,
        actor NVARCHAR(255) NOT NULL,
        timestamp DATETIME2 NOT NULL,
        metadata NVARCHAR(MAX), -- JSON string
        content NVARCHAR(MAX),
        processed_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (connector_id) REFERENCES connector_configs(id)
    );
    
    CREATE INDEX IX_events_connector ON events(connector_id);
    CREATE INDEX IX_events_source ON events(source);
    CREATE INDEX IX_events_actor ON events(actor);
    CREATE INDEX IX_events_timestamp ON events(timestamp);
    CREATE INDEX IX_events_processed ON events(processed_at);
    
    PRINT 'Table events created successfully';
END

IF OBJECT_ID('competency_scores', 'U') IS NOT NULL
    PRINT 'Table competency_scores already exists'
ELSE
BEGIN
    -- Competency scores summary table
    CREATE TABLE competency_scores (
        id INT IDENTITY(1,1) PRIMARY KEY,
        connector_id INT NOT NULL,
        competency_category NVARCHAR(100) NOT NULL,
        competency_row NVARCHAR(100) NOT NULL,
        actor NVARCHAR(255) NOT NULL,
        level DECIMAL(3,1) NOT NULL,
        confidence DECIMAL(3,2) NOT NULL,
        evidence_count INT NOT NULL DEFAULT 0,
        last_updated DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (connector_id) REFERENCES connector_configs(id),
        CONSTRAINT UQ_competency_scores UNIQUE (connector_id, competency_category, competency_row, actor)
    );
    
    CREATE INDEX IX_competency_scores_connector ON competency_scores(connector_id);
    CREATE INDEX IX_competency_scores_category ON competency_scores(competency_category);
    CREATE INDEX IX_competency_scores_actor ON competency_scores(actor);
    
    PRINT 'Table competency_scores created successfully';
END

IF OBJECT_ID('processing_jobs', 'U') IS NOT NULL
    PRINT 'Table processing_jobs already exists'
ELSE
BEGIN
    -- Processing jobs table (to track processing runs)
    CREATE TABLE processing_jobs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        job_id NVARCHAR(255) NOT NULL UNIQUE,
        status NVARCHAR(20) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
        connector_ids NVARCHAR(MAX), -- JSON array of connector IDs
        options NVARCHAR(MAX), -- JSON object of processing options
        started_at DATETIME2,
        completed_at DATETIME2,
        total_events INT DEFAULT 0,
        processed_events INT DEFAULT 0,
        labels_generated INT DEFAULT 0,
        errors_count INT DEFAULT 0,
        error_message NVARCHAR(MAX)
    );
    
    CREATE INDEX IX_processing_jobs_status ON processing_jobs(status);
    CREATE INDEX IX_processing_jobs_started ON processing_jobs(started_at);
    
    PRINT 'Table processing_jobs created successfully';
END

PRINT 'Processing schema created successfully';
