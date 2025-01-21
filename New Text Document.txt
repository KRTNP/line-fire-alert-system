# Create database
psql -U postgres
CREATE DATABASE wildfire_alert;
\c wildfire_alert
\i init.sql

# Copy .env.example to .env and fill in your credentials
cp .env.example .env