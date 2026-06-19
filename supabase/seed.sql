-- ============================================================
-- CodeSquad Dashboard - Seed Data
-- Run AFTER schema.sql
-- NOTE: Create auth users via Supabase Dashboard or Auth API first,
--       then this seed populates profiles + sample data.
-- ============================================================

-- Sample departments and positions
DO $$
DECLARE
  admin_id UUID;
  emp1 UUID; emp2 UUID; emp3 UUID; emp4 UUID; emp5 UUID;
  emp6 UUID; emp7 UUID; emp8 UUID; emp9 UUID; emp10 UUID;
BEGIN

-- Create auth users programmatically (use Supabase Admin API in practice)
-- For seeding, we insert directly into profiles assuming auth users exist.
-- Use the Supabase dashboard to create these users manually or via the admin API.

-- Admin profile (replace with actual Supabase Auth UUID after creating user)
-- admin@codesquad.ai / codesquad@1234
INSERT INTO profiles (id, email, full_name, role, department, position, status)
VALUES (
  uuid_generate_v4(), 'admin@codesquad.ai', 'Admin User', 'admin',
  'Management', 'System Administrator', 'active'
) ON CONFLICT (email) DO NOTHING
RETURNING id INTO admin_id;

-- Sample Employees
INSERT INTO profiles (id, email, full_name, role, department, position, status) VALUES
  (uuid_generate_v4(), 'alice.johnson@codesquad.ai', 'Alice Johnson', 'employee', 'Engineering', 'Senior Developer', 'active'),
  (uuid_generate_v4(), 'bob.smith@codesquad.ai', 'Bob Smith', 'employee', 'Engineering', 'Full Stack Developer', 'active'),
  (uuid_generate_v4(), 'carol.white@codesquad.ai', 'Carol White', 'employee', 'Design', 'UI/UX Designer', 'active'),
  (uuid_generate_v4(), 'david.brown@codesquad.ai', 'David Brown', 'employee', 'Engineering', 'Backend Developer', 'active'),
  (uuid_generate_v4(), 'eva.davis@codesquad.ai', 'Eva Davis', 'employee', 'Product', 'Product Manager', 'active'),
  (uuid_generate_v4(), 'frank.miller@codesquad.ai', 'Frank Miller', 'employee', 'Engineering', 'DevOps Engineer', 'active'),
  (uuid_generate_v4(), 'grace.wilson@codesquad.ai', 'Grace Wilson', 'employee', 'QA', 'QA Engineer', 'active'),
  (uuid_generate_v4(), 'henry.moore@codesquad.ai', 'Henry Moore', 'employee', 'Engineering', 'Frontend Developer', 'active'),
  (uuid_generate_v4(), 'iris.taylor@codesquad.ai', 'Iris Taylor', 'employee', 'Marketing', 'Marketing Analyst', 'active'),
  (uuid_generate_v4(), 'jack.anderson@codesquad.ai', 'Jack Anderson', 'employee', 'Engineering', 'Mobile Developer', 'inactive')
ON CONFLICT (email) DO NOTHING;

END $$;

-- NOTE: To generate 30 days of tasks and weekly feedback, run the following
-- after creating actual auth users. The seed_tasks.sql file has parametric examples.

SELECT 'Seed completed. Create auth users in Supabase Dashboard matching the emails above.' AS message;
