-- Initialisation of the Issue Tracker Database

-- Create Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

SELECT 'Issue Tracker Database initialized successfully' AS status; 

CREATE DATABASE issue_tracker;