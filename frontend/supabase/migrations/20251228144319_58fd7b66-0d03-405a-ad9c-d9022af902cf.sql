-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can delete braindumps" ON public.braindumps;
DROP POLICY IF EXISTS "Anyone can insert braindumps" ON public.braindumps;
DROP POLICY IF EXISTS "Anyone can update braindumps" ON public.braindumps;
DROP POLICY IF EXISTS "Anyone can view braindumps" ON public.braindumps;

-- Create permissive policies (default behavior)
CREATE POLICY "Allow public read access on braindumps" 
ON public.braindumps 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access on braindumps" 
ON public.braindumps 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access on braindumps" 
ON public.braindumps 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access on braindumps" 
ON public.braindumps 
FOR DELETE 
USING (true);