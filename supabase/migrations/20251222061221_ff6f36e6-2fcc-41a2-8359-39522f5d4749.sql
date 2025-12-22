-- Create role category enum
CREATE TYPE public.role_category AS ENUM ('judiciary', 'legal_practitioner', 'public_party');

-- Create case status enum
CREATE TYPE public.case_status AS ENUM ('pending', 'active', 'hearing', 'verdict_pending', 'closed', 'appealed');

-- Create evidence category enum
CREATE TYPE public.evidence_category AS ENUM ('document', 'video', 'audio', 'image', 'other');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role_category role_category NOT NULL DEFAULT 'public_party',
  avatar_url TEXT,
  designation TEXT,
  bar_council_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create courts table
CREATE TABLE public.courts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  address TEXT,
  city TEXT,
  state TEXT,
  type TEXT DEFAULT 'District Court',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sections table
CREATE TABLE public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID NOT NULL REFERENCES public.courts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  presiding_judge_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(court_id, code)
);

-- Create cases table
CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE RESTRICT,
  judge_id UUID NOT NULL REFERENCES public.profiles(id),
  clerk_id UUID REFERENCES public.profiles(id),
  plaintiff_id UUID NOT NULL REFERENCES public.profiles(id),
  defendant_id UUID NOT NULL REFERENCES public.profiles(id),
  status case_status NOT NULL DEFAULT 'pending',
  filing_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_hearing_date TIMESTAMP WITH TIME ZONE,
  priority TEXT DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create evidence table (stores file URLs, not files themselves)
CREATE TABLE public.evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category evidence_category NOT NULL DEFAULT 'document',
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  thumbnail_url TEXT,
  is_sealed BOOLEAN DEFAULT false,
  sealed_by UUID REFERENCES public.profiles(id),
  sealed_at TIMESTAMP WITH TIME ZONE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chain of custody table (audit trail)
CREATE TABLE public.chain_of_custody (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by UUID NOT NULL REFERENCES public.profiles(id),
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courts_updated_at BEFORE UPDATE ON public.courts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sections_updated_at BEFORE UPDATE ON public.sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_evidence_updated_at BEFORE UPDATE ON public.evidence FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role_category)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'role_category')::role_category, 'public_party')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generate case number function
CREATE OR REPLACE FUNCTION public.generate_case_number()
RETURNS TRIGGER AS $$
DECLARE
  court_code TEXT;
  year_part TEXT;
  seq_num INT;
BEGIN
  -- Get court code from section
  SELECT c.code INTO court_code
  FROM public.sections s
  JOIN public.courts c ON s.court_id = c.id
  WHERE s.id = NEW.section_id;
  
  year_part := to_char(CURRENT_DATE, 'YYYY');
  
  -- Get next sequence number for this court and year
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(case_number FROM '[0-9]+$') AS INT)
  ), 0) + 1 INTO seq_num
  FROM public.cases
  WHERE case_number LIKE court_code || '/' || year_part || '/%';
  
  NEW.case_number := court_code || '/' || year_part || '/' || LPAD(seq_num::TEXT, 5, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER generate_case_number_trigger
  BEFORE INSERT ON public.cases
  FOR EACH ROW
  WHEN (NEW.case_number IS NULL OR NEW.case_number = '')
  EXECUTE FUNCTION public.generate_case_number();

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chain_of_custody ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);

-- Courts policies (viewable by all, editable by judiciary)
CREATE POLICY "Courts are viewable by everyone" ON public.courts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage courts" ON public.courts FOR ALL USING (auth.role() = 'authenticated');

-- Sections policies
CREATE POLICY "Sections are viewable by everyone" ON public.sections FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage sections" ON public.sections FOR ALL USING (auth.role() = 'authenticated');

-- Cases policies
CREATE POLICY "Cases are viewable by authenticated users" ON public.cases FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create cases" ON public.cases FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update cases" ON public.cases FOR UPDATE USING (auth.role() = 'authenticated');

-- Evidence policies
CREATE POLICY "Evidence viewable by authenticated users" ON public.evidence FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can upload evidence" ON public.evidence FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update evidence" ON public.evidence FOR UPDATE USING (auth.role() = 'authenticated');

-- Chain of custody policies
CREATE POLICY "Custody logs viewable by authenticated users" ON public.chain_of_custody FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can add custody logs" ON public.chain_of_custody FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create storage bucket for evidence files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidence',
  'evidence',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Storage policies for evidence bucket
CREATE POLICY "Authenticated users can view evidence files" ON storage.objects FOR SELECT USING (bucket_id = 'evidence' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can upload evidence files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'evidence' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update evidence files" ON storage.objects FOR UPDATE USING (bucket_id = 'evidence' AND auth.role() = 'authenticated');

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.cases;
ALTER PUBLICATION supabase_realtime ADD TABLE public.evidence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chain_of_custody;