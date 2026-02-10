-- =============================================
-- Rate Limiting for Serverless (Vercel)
-- Run this in Supabase SQL Editor
-- =============================================

-- Table for persistent rate limit tracking
CREATE TABLE IF NOT EXISTS public.rate_limits (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    window_ms INTEGER NOT NULL DEFAULT 60000
);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits (window_start);

-- RLS: Only service_role can access (API routes use service_role key)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No public access — only service_role bypasses RLS
-- This means the table is invisible to anon/authenticated users

-- =============================================
-- Atomic rate limit check function
-- Returns: { allowed: boolean, remaining: integer }
-- =============================================
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_key TEXT,
    p_max_requests INTEGER,
    p_window_ms INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_now TIMESTAMPTZ := NOW();
    v_record RECORD;
    v_window_start TIMESTAMPTZ;
    v_count INTEGER;
    v_allowed BOOLEAN;
    v_remaining INTEGER;
BEGIN
    -- Try to get existing record
    SELECT * INTO v_record FROM public.rate_limits WHERE key = p_key;
    
    IF v_record IS NULL THEN
        -- No record exists — create new one
        INSERT INTO public.rate_limits (key, count, window_start, window_ms)
        VALUES (p_key, 1, v_now, p_window_ms)
        ON CONFLICT (key) DO UPDATE SET
            count = 1,
            window_start = v_now,
            window_ms = p_window_ms;
        
        RETURN json_build_object('allowed', true, 'remaining', p_max_requests - 1);
    END IF;
    
    -- Check if window has expired
    IF v_now > v_record.window_start + (v_record.window_ms || ' milliseconds')::INTERVAL THEN
        -- Window expired — reset
        UPDATE public.rate_limits 
        SET count = 1, window_start = v_now, window_ms = p_window_ms
        WHERE key = p_key;
        
        RETURN json_build_object('allowed', true, 'remaining', p_max_requests - 1);
    END IF;
    
    -- Window still active — check count
    IF v_record.count >= p_max_requests THEN
        -- Rate limit exceeded
        v_remaining := 0;
        RETURN json_build_object('allowed', false, 'remaining', v_remaining);
    END IF;
    
    -- Increment counter
    UPDATE public.rate_limits 
    SET count = count + 1 
    WHERE key = p_key;
    
    v_remaining := p_max_requests - v_record.count - 1;
    RETURN json_build_object('allowed', true, 'remaining', v_remaining);
END;
$$;

-- =============================================
-- Cleanup function — removes expired entries
-- Run periodically via Supabase CRON or pg_cron
-- =============================================
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM public.rate_limits
    WHERE NOW() > window_start + (window_ms || ' milliseconds')::INTERVAL;
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$;

-- Optional: Enable pg_cron to auto-cleanup every 10 minutes
-- (Run this only if pg_cron extension is available)
-- SELECT cron.schedule('cleanup-rate-limits', '*/10 * * * *', 'SELECT public.cleanup_rate_limits()');
