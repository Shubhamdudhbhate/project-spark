-- Create storage bucket for evidence files
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for evidence bucket
CREATE POLICY "Evidence files viewable by case assignees"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'evidence' 
  AND EXISTS (
    SELECT 1 FROM public.evidence e
    JOIN public.cases c ON c.id = e.case_id
    WHERE e.file_url LIKE '%' || storage.objects.name
    AND public.is_assigned_to_case(auth.uid(), c.id)
  )
);

CREATE POLICY "Evidence files uploadable by lawyers/clerks"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'evidence'
  AND (public.has_role(auth.uid(), 'lawyer'::app_role) OR public.has_role(auth.uid(), 'clerk'::app_role))
);

-- Add evidence_type column to evidence table
ALTER TABLE public.evidence ADD COLUMN IF NOT EXISTS evidence_type text DEFAULT 'document';

-- Enable realtime for evidence updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.evidence;