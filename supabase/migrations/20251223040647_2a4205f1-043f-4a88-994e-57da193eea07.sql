-- Drop the existing restrictive policy for courts management
DROP POLICY IF EXISTS "Authenticated users can manage courts" ON public.courts;

-- Create separate policies for INSERT (allow anyone) and UPDATE/DELETE (require auth)
CREATE POLICY "Anyone can create courts"
ON public.courts
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update courts"
ON public.courts
FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete courts"
ON public.courts
FOR DELETE
USING (auth.role() = 'authenticated');