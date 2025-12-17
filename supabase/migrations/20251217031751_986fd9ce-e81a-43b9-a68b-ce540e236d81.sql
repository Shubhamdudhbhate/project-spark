
-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'judge', 'lawyer', 'clerk', 'public_party');

-- Create user_roles table for secure role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Section types table (for default and custom section types)
CREATE TABLE public.section_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.section_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view section types"
ON public.section_types FOR SELECT USING (true);

CREATE POLICY "Admins can manage section types"
ON public.section_types FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default section types
INSERT INTO public.section_types (name, description, is_default) VALUES
  ('Civil Division', 'Handles civil disputes and matters', true),
  ('Criminal Division', 'Handles criminal cases and proceedings', true),
  ('Family Court', 'Handles family matters, divorce, custody', true);

-- Evidence block types table (for default and custom block types)
CREATE TABLE public.evidence_block_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  accepted_file_types TEXT[],
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.evidence_block_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view evidence block types"
ON public.evidence_block_types FOR SELECT USING (true);

CREATE POLICY "Admins can manage evidence block types"
ON public.evidence_block_types FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default evidence block types
INSERT INTO public.evidence_block_types (name, description, icon, accepted_file_types, is_default) VALUES
  ('Documentation', 'PDFs, Affidavits, Legal Documents', 'FileText', ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], true),
  ('Visual Evidence', 'CCTV Footage, Videos, Images', 'Video', ARRAY['video/mp4', 'video/webm', 'image/jpeg', 'image/png'], true),
  ('Testimony', 'Witness Recordings and Transcripts', 'Mic', ARRAY['audio/mpeg', 'audio/wav', 'application/pdf', 'text/plain'], true);

-- Update sections table to reference section_types
ALTER TABLE public.sections 
ADD COLUMN section_type_id UUID REFERENCES public.section_types(id);

-- Cases table
CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  presiding_judge_id UUID REFERENCES public.profiles(id),
  primary_lawyer_id UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'closed', 'archived')),
  filing_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cases"
ON public.cases FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create cases"
ON public.cases FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Judges and lawyers can update their cases"
ON public.cases FOR UPDATE
USING (
  presiding_judge_id = auth.uid() OR 
  primary_lawyer_id = auth.uid() OR
  public.has_role(auth.uid(), 'admin')
);

-- Evidence blocks (instances per case)
CREATE TABLE public.evidence_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  block_type_id UUID NOT NULL REFERENCES public.evidence_block_types(id),
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.evidence_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view evidence blocks"
ON public.evidence_blocks FOR SELECT USING (true);

CREATE POLICY "Trusted members can create evidence blocks"
ON public.evidence_blocks FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'lawyer') OR 
  public.has_role(auth.uid(), 'clerk') OR
  public.has_role(auth.uid(), 'admin')
);

-- Evidence items table
CREATE TABLE public.evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_block_id UUID NOT NULL REFERENCES public.evidence_blocks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_url TEXT,
  thumbnail_url TEXT,
  hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'rejected')),
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  signed_by UUID REFERENCES public.profiles(id),
  signed_at TIMESTAMP WITH TIME ZONE,
  signature TEXT,
  rejection_reason TEXT
);

ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;

-- Pending evidence visible only to trusted members, signed visible to all
CREATE POLICY "View evidence based on status"
ON public.evidence FOR SELECT
USING (
  status = 'signed' OR
  public.has_role(auth.uid(), 'judge') OR
  public.has_role(auth.uid(), 'lawyer') OR
  public.has_role(auth.uid(), 'clerk') OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Trusted members can upload evidence"
ON public.evidence FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'lawyer') OR 
  public.has_role(auth.uid(), 'clerk')
);

CREATE POLICY "Judges can sign evidence"
ON public.evidence FOR UPDATE
USING (public.has_role(auth.uid(), 'judge'))
WITH CHECK (public.has_role(auth.uid(), 'judge'));

-- Case parties table (for registry logic)
CREATE TABLE public.case_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id),
  party_type TEXT NOT NULL CHECK (party_type IN ('petitioner', 'respondent', 'witness', 'advocate')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(case_id, profile_id, party_type)
);

ALTER TABLE public.case_parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view case parties"
ON public.case_parties FOR SELECT USING (true);

CREATE POLICY "Authenticated can add parties"
ON public.case_parties FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger for cases updated_at
CREATE TRIGGER update_cases_updated_at
BEFORE UPDATE ON public.cases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create default sections for a new court
CREATE OR REPLACE FUNCTION public.create_default_sections()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.sections (name, description, court_id, section_type_id)
  SELECT st.name, st.description, NEW.id, st.id
  FROM public.section_types st
  WHERE st.is_default = true;
  RETURN NEW;
END;
$$;

-- Trigger to auto-create sections when court is created
CREATE TRIGGER on_court_created
AFTER INSERT ON public.courts
FOR EACH ROW
EXECUTE FUNCTION public.create_default_sections();

-- Function to auto-create default evidence blocks for a new case
CREATE OR REPLACE FUNCTION public.create_default_evidence_blocks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  block_order INTEGER := 0;
BEGIN
  INSERT INTO public.evidence_blocks (case_id, block_type_id, name, description, display_order)
  SELECT NEW.id, ebt.id, ebt.name, ebt.description, row_number() OVER (ORDER BY ebt.created_at)
  FROM public.evidence_block_types ebt
  WHERE ebt.is_default = true;
  RETURN NEW;
END;
$$;

-- Trigger to auto-create evidence blocks when case is created
CREATE TRIGGER on_case_created
AFTER INSERT ON public.cases
FOR EACH ROW
EXECUTE FUNCTION public.create_default_evidence_blocks();
