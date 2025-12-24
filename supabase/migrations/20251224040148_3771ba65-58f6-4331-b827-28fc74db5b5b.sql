-- Create enum for session status
CREATE TYPE public.session_status AS ENUM ('active', 'ended', 'paused');

-- Create enum for permission status
CREATE TYPE public.permission_status AS ENUM ('pending', 'granted', 'denied', 'expired');

-- Create session_logs table for live court sessions
CREATE TABLE public.session_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    judge_id UUID NOT NULL REFERENCES public.profiles(id),
    status session_status NOT NULL DEFAULT 'active',
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ended_at TIMESTAMP WITH TIME ZONE,
    notes TEXT, -- Judicial notepad content (rich text stored as HTML/markdown)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create permission_requests table for upload permissions
CREATE TABLE public.permission_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.session_logs(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES public.profiles(id),
    status permission_status NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    responded_at TIMESTAMP WITH TIME ZONE,
    responded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create case_diary table for case-level chain of custody
CREATE TABLE public.case_diary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- SESSION_START, SESSION_END, JUDGE_TRANSFER, STATUS_CHANGE
    actor_id UUID NOT NULL REFERENCES public.profiles(id),
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_diary ENABLE ROW LEVEL SECURITY;

-- Session logs policies
CREATE POLICY "Authenticated users can view session logs"
ON public.session_logs FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Judges can create session logs"
ON public.session_logs FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Judges can update their own session logs"
ON public.session_logs FOR UPDATE
USING (auth.role() = 'authenticated');

-- Permission requests policies
CREATE POLICY "Authenticated users can view permission requests"
ON public.permission_requests FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create permission requests"
ON public.permission_requests FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update permission requests"
ON public.permission_requests FOR UPDATE
USING (auth.role() = 'authenticated');

-- Case diary policies
CREATE POLICY "Authenticated users can view case diary"
ON public.case_diary FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can add case diary entries"
ON public.case_diary FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Enable realtime for session logs and permission requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.permission_requests;

-- Add triggers for updated_at
CREATE TRIGGER update_session_logs_updated_at
    BEFORE UPDATE ON public.session_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_permission_requests_updated_at
    BEFORE UPDATE ON public.permission_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();