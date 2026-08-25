# Database Security & Least-Privilege Configuration (B-30)

This document provides configuration guidelines for PostgreSQL in production to adhere to the Principle of Least Privilege.

## 1. Principle of Least Privilege Overview
- The application database user must NOT be a PostgreSQL `SUPERUSER` or have `CREATEDB` / `CREATEROLE` permissions.
- The application user should only be granted `CONNECT` to the database, and `SELECT`, `INSERT`, `UPDATE`, `DELETE` privileges on the necessary application schema tables and `USAGE, SELECT` on sequences.
- Schema migrations (DDL: `CREATE TABLE`, `ALTER TABLE`, `DROP TABLE`) should be executed by a separate migration/deployment role or CI/CD pipeline rather than the runtime application user.

## 2. Production PostgreSQL Provisioning Script

```sql
-- 1. Create a dedicated application user with a strong, random password
CREATE USER chat_app_user WITH PASSWORD 'STRONG_RANDOMLY_GENERATED_PASSWORD';

-- 2. Revoke public schema creation privileges from PUBLIC
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

-- 3. Grant database connection permission
GRANT CONNECT ON DATABASE chat_db TO chat_app_user;

-- 4. Grant schema usage
GRANT USAGE ON SCHEMA public TO chat_app_user;

-- 5. Grant CRUD permissions on all current tables in the schema
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO chat_app_user;

-- 6. Grant sequence permissions for auto-incrementing IDs
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO chat_app_user;

-- 7. Ensure future tables created by migrations automatically grant CRUD permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO chat_app_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO chat_app_user;
```

## 3. Environment Variable Configuration
In production environments (e.g., Docker, Kubernetes, AWS ECS, Heroku, Railway):
- Set `DB_USER=chat_app_user`
- Set `DB_PASSWORD` via a secure secrets manager (AWS Secrets Manager, HashiCorp Vault, Doppler, etc.).
- Never commit database credentials into version control.
