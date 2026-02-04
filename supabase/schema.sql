-- =============================================
-- QBody Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. PROFILES (Users)
-- =============================================

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'trainer', 'client')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =============================================
-- 2. CLIENT PROFILES (Extended client data)
-- =============================================

CREATE TABLE public.client_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    trainer_id UUID REFERENCES public.profiles(id),
    height DECIMAL(5,2),
    start_weight DECIMAL(5,2),
    current_weight DECIMAL(5,2),
    goal_weight DECIMAL(5,2),
    goal TEXT,
    injuries TEXT,
    equipment TEXT[],
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their own client profile" ON public.client_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Clients can update their own client profile" ON public.client_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Trainers can view their clients" ON public.client_profiles
    FOR SELECT USING (auth.uid() = trainer_id);

CREATE POLICY "Admins full access to client profiles" ON public.client_profiles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
    );

-- =============================================
-- 3. SUBSCRIPTIONS
-- =============================================

CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL,
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'expired')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Admins full access to subscriptions" ON public.subscriptions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =============================================
-- 4. COURSES
-- =============================================

CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    original_price DECIMAL(10,2),
    duration_weeks INTEGER,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Everyone can view published courses
CREATE POLICY "Anyone can view published courses" ON public.courses
    FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Admins full access to courses" ON public.courses
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =============================================
-- 5. LESSONS
-- =============================================

CREATE TABLE public.lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    duration_minutes INTEGER,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Users with course access can view lessons
CREATE POLICY "Course owners can view lessons" ON public.lessons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.client_courses cc 
            WHERE cc.course_id = lessons.course_id 
            AND cc.client_id = auth.uid()
        )
    );

CREATE POLICY "Admins full access to lessons" ON public.lessons
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =============================================
-- 6. CLIENT COURSES (Purchases)
-- =============================================

CREATE TABLE public.client_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    stripe_payment_id TEXT,
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(client_id, course_id)
);

ALTER TABLE public.client_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their own purchases" ON public.client_courses
    FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Admins full access to client courses" ON public.client_courses
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =============================================
-- 7. LESSON PROGRESS
-- =============================================

CREATE TABLE public.lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    watched_seconds INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    last_watched_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, lesson_id)
);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can manage their own progress" ON public.lesson_progress
    FOR ALL USING (auth.uid() = client_id);

CREATE POLICY "Admins can view all progress" ON public.lesson_progress
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =============================================
-- 8. EXERCISES
-- =============================================

CREATE TABLE public.exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    muscle_groups TEXT[],
    equipment TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    instructions TEXT,
    common_mistakes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exercises" ON public.exercises
    FOR SELECT USING (TRUE);

CREATE POLICY "Admins full access to exercises" ON public.exercises
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =============================================
-- 9. SITE SETTINGS
-- =============================================

CREATE TABLE public.site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site settings" ON public.site_settings
    FOR SELECT USING (TRUE);

CREATE POLICY "Admins can update site settings" ON public.site_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        COALESCE(NEW.raw_user_meta_data->>'role', 'client')
    );
    
    -- If client, create client_profile
    IF COALESCE(NEW.raw_user_meta_data->>'role', 'client') = 'client' THEN
        INSERT INTO public.client_profiles (user_id)
        VALUES (NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_profiles_updated_at BEFORE UPDATE ON public.client_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON public.exercises
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- INITIAL DATA
-- =============================================

-- Insert default courses
INSERT INTO public.courses (title, slug, description, price, original_price, duration_weeks, is_published) VALUES
('Восстановление после увеличения груди', 'breast-augmentation-recovery', 'Безопасная программа восстановления и укрепления после маммопластики', 99, 149, 6, TRUE),
('Восстановление после кесарева сечения', 'cesarean-recovery', 'Комплексная программа для молодых мам. Восстановление мышц живота и тазового дна', 99, 149, 8, TRUE);

-- Insert default site settings
INSERT INTO public.site_settings (key, value) VALUES
('general', '{"siteName": "Qbody by Khavanskaia", "tagline": "Профессиональные фитнес программы", "email": "info@qbody.app", "phone": "+7 999 123 4567"}'),
('branding', '{"primaryColor": "#14b8a6", "logoUrl": null, "heroImageUrl": null}'),
('social', '{"instagram": "", "telegram": "", "whatsapp": ""}'),
('content', '{"heroTitle": "Трансформируй своё тело с QBody", "heroSubtitle": "Профессиональные программы тренировок и персональное сопровождение"}');

-- =============================================
-- STORAGE BUCKETS
-- =============================================

-- Run these in Supabase Storage settings:
-- 1. Create bucket: avatars (public)
-- 2. Create bucket: course-thumbnails (public)
-- 3. Create bucket: course-videos (private)
-- 4. Create bucket: exercise-videos (public)
-- 5. Create bucket: site-assets (public)
