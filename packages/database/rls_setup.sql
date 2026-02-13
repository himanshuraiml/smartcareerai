-- Admin-Aware Row Level Security (RLS) for SmartCareerAI
-- This script enables RLS with a bypass for ADMIN roles

DO $$ 
DECLARE 
    tbl_name text;
BEGIN
    FOR tbl_name IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'user_id' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl_name);
        EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl_name);

        EXECUTE format('DROP POLICY IF EXISTS %I_user_isolation ON %I', tbl_name, tbl_name);

        -- Policy: User isolation OR Admin bypass
        EXECUTE format('
            CREATE POLICY %I_user_isolation ON %I
            FOR ALL
            TO PUBLIC
            USING (
                user_id = NULLIF(current_setting(''app.current_user_id'', true), '''')
                OR current_setting(''app.current_user_role'', true) = ''ADMIN''
            )
            WITH CHECK (
                user_id = NULLIF(current_setting(''app.current_user_id'', true), '''')
                OR current_setting(''app.current_user_role'', true) = ''ADMIN''
            )
        ', tbl_name, tbl_name);

        RAISE NOTICE 'RLS Updated with Admin Bypass for table: %', tbl_name;
    END LOOP;
END $$;

-- Update Users table policy with admin bypass
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS users_isolation ON users;
CREATE POLICY users_isolation ON users
    FOR ALL
    TO PUBLIC
    USING (
        id = NULLIF(current_setting('app.current_user_id', true), '')
        OR current_setting('app.current_user_role', true) = 'ADMIN'
    )
    WITH CHECK (
        id = NULLIF(current_setting('app.current_user_id', true), '')
        OR current_setting('app.current_user_role', true) = 'ADMIN'
    );
