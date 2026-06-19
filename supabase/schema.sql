-- ============================================================
-- CodeSquad Dashboard - Complete Supabase Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  department TEXT,
  position TEXT,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: daily_tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_date DATE NOT NULL DEFAULT CURRENT_DATE,
  task_description TEXT NOT NULL,
  completion_status TEXT NOT NULL DEFAULT 'In Progress' CHECK (completion_status IN ('Completed', 'In Progress', 'Blocked')),
  hours_worked NUMERIC(4,2) NOT NULL DEFAULT 0 CHECK (hours_worked >= 0 AND hours_worked <= 24),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (employee_id, task_date)
);

-- ============================================================
-- TABLE: feedback
-- ============================================================
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  feedback_text TEXT NOT NULL,
  performance_rating INTEGER NOT NULL CHECK (performance_rating >= 1 AND performance_rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'feedback')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_daily_tasks_employee_id ON daily_tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_task_date ON daily_tasks(task_date);
CREATE INDEX IF NOT EXISTS idx_feedback_employee_id ON feedback(employee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_tasks_updated_at
  BEFORE UPDATE ON daily_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-notify employee when feedback is added/updated
CREATE OR REPLACE FUNCTION notify_feedback()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      NEW.employee_id,
      'New Feedback Received',
      'Admin has submitted feedback for the week of ' || TO_CHAR(NEW.week_start, 'Mon DD') || ' - ' || TO_CHAR(NEW.week_end, 'Mon DD, YYYY') || '. Rating: ' || NEW.performance_rating || '/5.',
      'feedback'
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      NEW.employee_id,
      'Feedback Updated',
      'Your feedback for ' || TO_CHAR(NEW.week_start, 'Mon DD') || ' - ' || TO_CHAR(NEW.week_end, 'Mon DD, YYYY') || ' has been updated.',
      'feedback'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_feedback_notify
  AFTER INSERT OR UPDATE ON feedback
  FOR EACH ROW EXECUTE FUNCTION notify_feedback();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---- PROFILES policies ----
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT USING (is_admin());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (is_admin());

CREATE POLICY "profiles_insert_admin" ON profiles
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "profiles_delete_admin" ON profiles
  FOR DELETE USING (is_admin());

-- ---- DAILY_TASKS policies ----
CREATE POLICY "tasks_select_own" ON daily_tasks
  FOR SELECT USING (auth.uid() = employee_id);

CREATE POLICY "tasks_select_admin" ON daily_tasks
  FOR SELECT USING (is_admin());

CREATE POLICY "tasks_insert_own" ON daily_tasks
  FOR INSERT WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "tasks_update_own_today" ON daily_tasks
  FOR UPDATE USING (auth.uid() = employee_id AND task_date = CURRENT_DATE);

CREATE POLICY "tasks_update_admin" ON daily_tasks
  FOR UPDATE USING (is_admin());

CREATE POLICY "tasks_delete_admin" ON daily_tasks
  FOR DELETE USING (is_admin());

-- ---- FEEDBACK policies ----
CREATE POLICY "feedback_select_own" ON feedback
  FOR SELECT USING (auth.uid() = employee_id);

CREATE POLICY "feedback_select_admin" ON feedback
  FOR SELECT USING (is_admin());

CREATE POLICY "feedback_insert_admin" ON feedback
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "feedback_update_admin" ON feedback
  FOR UPDATE USING (is_admin());

CREATE POLICY "feedback_delete_admin" ON feedback
  FOR DELETE USING (is_admin());

-- ---- NOTIFICATIONS policies ----
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_system" ON notifications
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "notifications_delete_own" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- STORAGE: avatars bucket
-- Run this AFTER enabling Storage in the Supabase dashboard
-- ============================================================

-- Create the avatars bucket (public so images are readable without auth)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Anyone can read avatars (bucket is public)
CREATE POLICY "avatars_public_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Authenticated users can upload/replace their own avatar
-- Path must be: {userId}/avatar.{ext}
CREATE POLICY "avatars_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
