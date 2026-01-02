-- Create braindumps table to store saved braindumps
CREATE TABLE public.braindumps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  folders JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.braindumps ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required for this app)
CREATE POLICY "Anyone can view braindumps" 
ON public.braindumps 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert braindumps" 
ON public.braindumps 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update braindumps" 
ON public.braindumps 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete braindumps" 
ON public.braindumps 
FOR DELETE 
USING (true);

-- Create function to update timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_braindumps_updated_at
BEFORE UPDATE ON public.braindumps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();