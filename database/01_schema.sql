-- Competency Intelligence Platform Database Schema
-- Microsoft SQL Server

-- Enable required features
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- Developers table
CREATE TABLE Developers (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    email NVARCHAR(255) NOT NULL UNIQUE,
    display_name NVARCHAR(255) NOT NULL,
    username NVARCHAR(100) NOT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    INDEX idx_developers_email (email),
    INDEX idx_developers_username (username)
);
GO

-- Activity Events table (unified schema)
CREATE TABLE ActivityEvents (
    id NVARCHAR(255) PRIMARY KEY,
    source NVARCHAR(50) NOT NULL CHECK (source IN ('jira', 'confluence', 'bitbucket', 'git')),
    timestamp DATETIME2 NOT NULL,
    actor NVARCHAR(255) NOT NULL,
    actor_developer_id UNIQUEIDENTIFIER NULL REFERENCES Developers(id),
    type NVARCHAR(100) NOT NULL,
    metadata NVARCHAR(MAX) NOT NULL, -- JSON metadata
    content NVARCHAR(MAX) NULL, -- Text content for NLP/keyword analysis
    artifact_key NVARCHAR(500) NULL, -- Reference to raw payload in ArtifactStore
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    INDEX idx_activity_events_source_timestamp (source, timestamp),
    INDEX idx_activity_events_actor_timestamp (actor, timestamp),
    INDEX idx_activity_events_type (type)
);
GO

-- Competency Categories
CREATE TABLE CompetencyCategories (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(100) NOT NULL UNIQUE,
    description NVARCHAR(500) NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);
GO

-- Competency Rows (specific skills/behaviors)
CREATE TABLE CompetencyRows (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    category_id UNIQUEIDENTIFIER NOT NULL REFERENCES CompetencyCategories(id),
    name NVARCHAR(200) NOT NULL,
    description NVARCHAR(1000) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    INDEX idx_competency_rows_category (category_id),
    UNIQUE (category_id, name)
);
GO

-- Competency Levels (L1-L4)
CREATE TABLE CompetencyLevels (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    level NVARCHAR(10) NOT NULL UNIQUE CHECK (level IN ('L1', 'L2', 'L3', 'L4')),
    description NVARCHAR(500) NOT NULL,
    sort_order INT NOT NULL UNIQUE,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);
GO

-- Developer Competency Scores
CREATE TABLE DeveloperCompetencyScores (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    developer_id UNIQUEIDENTIFIER NOT NULL REFERENCES Developers(id),
    competency_row_id UNIQUEIDENTIFIER NOT NULL REFERENCES CompetencyRows(id),
    level_id UNIQUEIDENTIFIER NOT NULL REFERENCES CompetencyLevels(id),
    score DECIMAL(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
    confidence DECIMAL(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    evidence_summary NVARCHAR(MAX) NULL,
    last_updated DATETIME2 DEFAULT GETUTCDATE(),
    UNIQUE (developer_id, competency_row_id),
    INDEX idx_developer_competency_scores_developer (developer_id),
    INDEX idx_developer_competency_scores_row (competency_row_id)
);
GO

-- Evidence Items (linking activities to competency assessments)
CREATE TABLE EvidenceItems (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    developer_id UNIQUEIDENTIFIER NOT NULL REFERENCES Developers(id),
    competency_row_id UNIQUEIDENTIFIER NOT NULL REFERENCES CompetencyRows(id),
    activity_event_id NVARCHAR(255) NOT NULL REFERENCES ActivityEvents(id),
    evidence_type NVARCHAR(50) NOT NULL CHECK (evidence_type IN ('rule_based', 'ml_based', 'quiz', 'self_eval')),
    strength DECIMAL(5,2) NOT NULL CHECK (strength >= 0 AND strength <= 100),
    description NVARCHAR(1000) NOT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    INDEX idx_evidence_items_developer_competency (developer_id, competency_row_id),
    INDEX idx_evidence_items_activity (activity_event_id)
);
GO

-- Self-Evaluations
CREATE TABLE SelfEvaluations (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    developer_id UNIQUEIDENTIFIER NOT NULL REFERENCES Developers(id),
    competency_row_id UNIQUEIDENTIFIER NOT NULL REFERENCES CompetencyRows(id),
    level_id UNIQUEIDENTIFIER NOT NULL REFERENCES CompetencyLevels(id),
    confidence DECIMAL(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    evidence_text NVARCHAR(MAX) NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    UNIQUE (developer_id, competency_row_id),
    INDEX idx_self_evaluations_developer (developer_id)
);
GO

-- Quiz Domains
CREATE TABLE QuizDomains (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    domain_key NVARCHAR(50) NOT NULL UNIQUE,
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(500) NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);
GO

-- Quiz Questions
CREATE TABLE QuizQuestions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    domain_id UNIQUEIDENTIFIER NOT NULL REFERENCES QuizDomains(id),
    question_text NVARCHAR(2000) NOT NULL,
    question_type NVARCHAR(50) NOT NULL CHECK (question_type IN ('multiple_choice', 'short_answer', 'scenario', 'architecture')),
    difficulty INT NOT NULL CHECK (difficulty >= 1 AND difficulty <= 5),
    correct_answer NVARCHAR(1000) NOT NULL,
    explanation NVARCHAR(2000) NULL,
    concept_tags NVARCHAR(500) NULL, -- JSON array of tags
    pitfall_type NVARCHAR(100) NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    INDEX idx_quiz_questions_domain (domain_id),
    INDEX idx_quiz_questions_difficulty (difficulty)
);
GO

-- Quiz Attempts
CREATE TABLE QuizAttempts (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    developer_id UNIQUEIDENTIFIER NOT NULL REFERENCES Developers(id),
    domain_id UNIQUEIDENTIFIER NOT NULL REFERENCES QuizDomains(id),
    started_at DATETIME2 DEFAULT GETUTCDATE(),
    completed_at DATETIME2 NULL,
    final_score DECIMAL(5,2) NULL CHECK (final_score >= 0 AND final_score <= 100),
    INDEX idx_quiz_attempts_developer (developer_id),
    INDEX idx_quiz_attempts_domain (domain_id)
);
GO

-- Quiz Answers
CREATE TABLE QuizAnswers (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    attempt_id UNIQUEIDENTIFIER NOT NULL REFERENCES QuizAttempts(id),
    question_id UNIQUEIDENTIFIER NOT NULL REFERENCES QuizQuestions(id),
    answer_text NVARCHAR(1000) NOT NULL,
    is_correct BIT NOT NULL,
    confidence DECIMAL(5,2) NULL CHECK (confidence >= 0 AND confidence <= 100),
    time_taken_seconds INT NULL,
    answered_at DATETIME2 DEFAULT GETUTCDATE(),
    INDEX idx_quiz_answers_attempt (attempt_id),
    INDEX idx_quiz_answers_question (question_id)
);
GO

-- Retrieval Status (track last retrieval times for each source)
CREATE TABLE RetrievalStatus (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    source NVARCHAR(50) NOT NULL UNIQUE CHECK (source IN ('jira', 'confluence', 'bitbucket', 'git')),
    last_retrieved_at DATETIME2 NULL,
    last_cursor NVARCHAR(500) NULL, -- For pagination/incremental retrieval
    retrieval_config NVARCHAR(MAX) NULL, -- JSON config for source
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);
GO

-- Insert default competency levels
INSERT INTO CompetencyLevels (level, description, sort_order) VALUES
('L1', 'Fundamental awareness and basic capability', 1),
('L2', 'Working capability with supervision', 2),
('L3', 'Strong capability without supervision', 3),
('L4', 'Expert capability and can teach others', 4);
GO

-- Insert default competency categories
INSERT INTO CompetencyCategories (name, description) VALUES
('System Design', 'Ability to design scalable, maintainable systems'),
('Security', 'Understanding and implementing security best practices'),
('Collaboration', 'Working effectively with team members'),
('Business Context', 'Understanding business requirements and impact'),
('Technical Excellence', 'Code quality, testing, and best practices'),
('Operations & Reliability', 'Deploying and maintaining reliable systems');
GO

-- Insert default quiz domains
INSERT INTO QuizDomains (domain_key, name, description) VALUES
('redis', 'Amazon ElastiCache for Redis', 'Redis caching patterns and operations'),
('rabbitmq', 'Amazon MQ for RabbitMQ', 'Message queuing with RabbitMQ'),
('vault', 'Vault', 'Secrets management with Vault'),
('docker', 'Docker', 'Containerization with Docker'),
('kubernetes', 'Kubernetes', 'Container orchestration with Kubernetes'),
('networking_http_tls', 'Networking / HTTP / TLS', 'Web networking and security'),
('testing', 'Testing', 'Software testing methodologies and frameworks'),
('debugging', 'Debugging', 'Troubleshooting and debugging techniques'),
('observability', 'Observability', 'Monitoring, logging, and tracing');
GO

-- Create triggers for updated_at timestamps
CREATE OR ALTER TRIGGER trg_Developers_updated_at
ON Developers
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Developers 
    SET updated_at = GETUTCDATE()
    WHERE id IN (SELECT id FROM inserted);
END;
GO

CREATE OR ALTER TRIGGER trg_RetrievalStatus_updated_at
ON RetrievalStatus
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE RetrievalStatus 
    SET updated_at = GETUTCDATE()
    WHERE id IN (SELECT id FROM inserted);
END;
GO
