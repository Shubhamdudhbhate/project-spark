-- Create courts table
CREATE TABLE IF NOT EXISTS public.courts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sections table
CREATE TABLE IF NOT EXISTS public.sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  court_id UUID NOT NULL REFERENCES public.courts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for user info
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role_category TEXT CHECK (role_category IN ('judiciary', 'legal_practitioner', 'public')),
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cases table
CREATE TABLE IF NOT EXISTS public.cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'closed', 'archived')),
  filing_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE,
  case_block_id TEXT NOT NULL,
  judge_id UUID NOT NULL,
  clerk_id UUID NOT NULL,
  plaintiff_id UUID NOT NULL,
  defendant_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create evidence table
CREATE TABLE IF NOT EXISTS public.evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_type TEXT,
  file_size INTEGER,
  file_url TEXT,
  status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected')),
  evidence_type TEXT CHECK (evidence_type IN ('document', 'video', 'audio', 'image', 'forensic', 'other')),
  uploaded_by UUID NOT NULL,
  reviewed_by UUID,
  signature_hash TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create evidence audit log table
CREATE TABLE IF NOT EXISTS public.evidence_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evidence_id UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_audit_log ENABLE ROW LEVEL SECURITY;

-- Courts policies (public read, authenticated insert/update)
CREATE POLICY "Courts are viewable by everyone" ON public.courts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert courts" ON public.courts FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update courts" ON public.courts FOR UPDATE USING (true);

-- Sections policies
CREATE POLICY "Sections are viewable by everyone" ON public.sections FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert sections" ON public.sections FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update sections" ON public.sections FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Cases policies
CREATE POLICY "Cases are viewable by authenticated users" ON public.cases FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert cases" ON public.cases FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update cases" ON public.cases FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Evidence policies
CREATE POLICY "Evidence is viewable by authenticated users" ON public.evidence FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert evidence" ON public.evidence FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update evidence" ON public.evidence FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Audit log policies
CREATE POLICY "Audit logs are viewable by authenticated users" ON public.evidence_audit_log FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert audit logs" ON public.evidence_audit_log FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create storage bucket for evidence files
INSERT INTO storage.buckets (id, name, public) VALUES ('evidence', 'evidence', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Evidence files are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'evidence');
CREATE POLICY "Authenticated users can upload evidence" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'evidence' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update evidence files" ON storage.objects FOR UPDATE USING (bucket_id = 'evidence' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete evidence files" ON storage.objects FOR DELETE USING (bucket_id = 'evidence' AND auth.uid() IS NOT NULL);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_courts_updated_at BEFORE UPDATE ON public.courts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sections_updated_at BEFORE UPDATE ON public.sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_evidence_updated_at BEFORE UPDATE ON public.evidence FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role_category)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role_category', 'public')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed initial courts
INSERT INTO public.courts (name, description, address) VALUES
  ('Supreme Court of India', 'The highest judicial forum and final court of appeal', 'Tilak Marg, New Delhi - 110001'),
  ('High Court of Delhi', 'Principal civil and criminal court of Delhi', 'Sher Shah Road, New Delhi - 110503'),
  ('High Court of Bombay', 'Principal civil and criminal court of Maharashtra', 'Fort, Mumbai - 400032'),
  ('High Court of Karnataka', 'Principal civil and criminal court of Karnataka', 'Ambedkar Veedhi, Bengaluru - 560001'),
  ('High Court of Madras', 'Principal civil and criminal court of Tamil Nadu', 'High Court Road, Chennai - 600104');