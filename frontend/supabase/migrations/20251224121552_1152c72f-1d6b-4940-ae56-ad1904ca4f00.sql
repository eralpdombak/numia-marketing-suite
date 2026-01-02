-- Create a table for saved library items (both written content and images)
CREATE TABLE public.library_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('text', 'image')),
  content TEXT NOT NULL,
  platform TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read, insert, and delete (no auth required for now)
CREATE POLICY "Anyone can view library items" 
ON public.library_items 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert library items" 
ON public.library_items 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can delete library items" 
ON public.library_items 
FOR DELETE 
USING (true);