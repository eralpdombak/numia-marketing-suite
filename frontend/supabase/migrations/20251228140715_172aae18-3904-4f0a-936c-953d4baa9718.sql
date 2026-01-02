-- Add title column to library_items
ALTER TABLE public.library_items 
ADD COLUMN title TEXT DEFAULT NULL;