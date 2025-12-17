-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('judge', 'clerk', 'lawyer', 'plaintiff', 'defendant', 'citizen');

-- Create user role category enum
CREATE TYPE public.role_category AS ENUM ('judiciary', 'legal_practitioner', 'public_party');

-- Create evidence status enum
CREATE TYPE public.evidence_status AS ENUM ('draft', 'pending_review', 'approved', 'rejected');

-- Create case status enum
CREATE TYPE public.case_status AS ENUM ('pending', 'active', 'closed', 'archived');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role_category role_category NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Create courts table
CREATE TABLE public.courts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sections table
CREATE TABLE public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID NOT NULL REFERENCES public.courts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(court_id, name)
);

-- Create case_blocks (categories) table
CREATE TABLE public.case_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Civil, Criminal, Corporate, etc.
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(section_id, name)
);

-- Create cases table
CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  case_block_id UUID NOT NULL REFERENCES public.case_blocks(id),
  judge_id UUID NOT NULL REFERENCES auth.users(id),
  clerk_id UUID NOT NULL REFERENCES auth.users(id),
  plaintiff_id UUID NOT NULL REFERENCES auth.users(id),
  defendant_id UUID NOT NULL REFERENCES auth.users(id),
  status case_status DEFAULT 'pending',
  filing_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create case_lawyers junction table
CREATE TABLE public.case_lawyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  lawyer_id UUID NOT NULL REFERENCES auth.users(id),
  representing TEXT NOT NULL CHECK (representing IN ('plaintiff', 'defendant')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(case_id, lawyer_id)
);

-- Create evidence table
CREATE TABLE public.evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT,
  file_size INTEGER,
  status evidence_status DEFAULT 'draft',
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  signature_hash TEXT,
  signed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit log for evidence
CREATE TABLE public.evidence_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_lawyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_audit_log ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's role category
CREATE OR REPLACE FUNCTION public.get_role_category(_user_id UUID)
RETURNS role_category
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role_category FROM public.profiles WHERE id = _user_id
$$;

-- Function to check if user is assigned to case
CREATE OR REPLACE FUNCTION public.is_assigned_to_case(_user_id UUID, _case_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.cases 
    WHERE id = _case_id 
    AND (judge_id = _user_id OR clerk_id = _user_id OR plaintiff_id = _user_id OR defendant_id = _user_id)
  ) OR EXISTS (
    SELECT 1 FROM public.case_lawyers
    WHERE case_id = _case_id AND lawyer_id = _user_id
  )
$$;

-- RLS Policies

-- Profiles: Users can read all profiles, update own
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User roles: Only viewable by authenticated users
CREATE POLICY "Roles viewable by authenticated"
ON public.user_roles FOR SELECT TO authenticated USING (true);

-- Courts: Viewable by all authenticated
CREATE POLICY "Courts viewable by authenticated"
ON public.courts FOR SELECT TO authenticated USING (true);

-- Sections: Viewable by all authenticated
CREATE POLICY "Sections viewable by authenticated"
ON public.sections FOR SELECT TO authenticated USING (true);

-- Case blocks: Viewable by all authenticated
CREATE POLICY "Case blocks viewable by authenticated"
ON public.case_blocks FOR SELECT TO authenticated USING (true);

-- Cases: Viewable by assigned users
CREATE POLICY "Cases viewable by assigned users"
ON public.cases FOR SELECT TO authenticated 
USING (public.is_assigned_to_case(auth.uid(), id));

-- Case creation by judges and clerks
CREATE POLICY "Cases insertable by judiciary"
ON public.cases FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'judge') OR public.has_role(auth.uid(), 'clerk')
);

-- Case lawyers: Viewable if assigned to case
CREATE POLICY "Case lawyers viewable by case assignees"
ON public.case_lawyers FOR SELECT TO authenticated
USING (public.is_assigned_to_case(auth.uid(), case_id));

-- Evidence: Viewable if assigned to case AND (approved OR user is uploader/judge)
CREATE POLICY "Evidence viewable by case assignees"
ON public.evidence FOR SELECT TO authenticated
USING (
  public.is_assigned_to_case(auth.uid(), case_id) AND 
  (status = 'approved' OR uploaded_by = auth.uid() OR 
   EXISTS (SELECT 1 FROM public.cases WHERE id = case_id AND judge_id = auth.uid()))
);

-- Evidence upload by lawyers and clerks assigned to case
CREATE POLICY "Evidence uploadable by assigned lawyers/clerks"
ON public.evidence FOR INSERT TO authenticated
WITH CHECK (
  public.is_assigned_to_case(auth.uid(), case_id) AND
  (public.has_role(auth.uid(), 'lawyer') OR public.has_role(auth.uid(), 'clerk'))
);

-- Evidence update by uploader (draft) or judge (review)
CREATE POLICY "Evidence updatable by uploader or judge"
ON public.evidence FOR UPDATE TO authenticated
USING (
  (uploaded_by = auth.uid() AND status = 'draft') OR
  EXISTS (SELECT 1 FROM public.cases WHERE id = case_id AND judge_id = auth.uid())
);

-- Audit log: Viewable by case assignees
CREATE POLICY "Audit log viewable by case assignees"
ON public.evidence_audit_log FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.evidence e 
    WHERE e.id = evidence_id AND public.is_assigned_to_case(auth.uid(), e.case_id)
  )
);

-- Audit log: Insertable by authenticated (for logging actions)
CREATE POLICY "Audit log insertable by authenticated"
ON public.evidence_audit_log FOR INSERT TO authenticated
WITH CHECK (performed_by = auth.uid());

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cases_updated_at
BEFORE UPDATE ON public.cases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_evidence_updated_at
BEFORE UPDATE ON public.evidence
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role_category)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown'),
    COALESCE((NEW.raw_user_meta_data->>'role_category')::role_category, 'public_party')
  );
  
  -- Insert role based on category
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE (NEW.raw_user_meta_data->>'role_category')
      WHEN 'judiciary' THEN 'judge'::app_role
      WHEN 'legal_practitioner' THEN 'lawyer'::app_role
      ELSE 'citizen'::app_role
    END
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample courts data
INSERT INTO public.courts (name, description, address) VALUES
('Supreme Court of India', 'The highest judicial forum and final court of appeal', 'Tilak Marg, New Delhi'),
('High Court of Mumbai', 'Principal civil court of original jurisdiction', 'Fort, Mumbai'),
('High Court of Delhi', 'High Court for the National Capital Territory', 'Shershah Road, New Delhi');

-- Insert sample sections
INSERT INTO public.sections (court_id, name, description)
SELECT c.id, s.name, s.description
FROM public.courts c
CROSS JOIN (VALUES 
  ('Civil Division', 'Handles civil disputes and matters'),
  ('Criminal Division', 'Handles criminal cases and proceedings'),
  ('Constitutional Division', 'Handles constitutional matters')
) AS s(name, description)
WHERE c.name = 'Supreme Court of India';

INSERT INTO public.sections (court_id, name, description)
SELECT c.id, s.name, s.description
FROM public.courts c
CROSS JOIN (VALUES 
  ('Civil Court', 'Civil cases and disputes'),
  ('Criminal Court', 'Criminal proceedings'),
  ('Family Court', 'Family law matters'),
  ('Commercial Court', 'Business and commercial disputes')
) AS s(name, description)
WHERE c.name = 'High Court of Mumbai';

-- Insert case blocks for sections
INSERT INTO public.case_blocks (section_id, name, description)
SELECT s.id, b.name, b.description
FROM public.sections s
CROSS JOIN (VALUES 
  ('Civil Cases', 'General civil matters'),
  ('Property Disputes', 'Land and property cases'),
  ('Contract Cases', 'Contract-related disputes')
) AS b(name, description)
WHERE s.name = 'Civil Division' OR s.name = 'Civil Court';

INSERT INTO public.case_blocks (section_id, name, description)
SELECT s.id, b.name, b.description
FROM public.sections s
CROSS JOIN (VALUES 
  ('Criminal Cases', 'General criminal proceedings'),
  ('Bail Applications', 'Bail-related matters'),
  ('Appeals', 'Criminal appeals')
) AS b(name, description)
WHERE s.name = 'Criminal Division' OR s.name = 'Criminal Court';