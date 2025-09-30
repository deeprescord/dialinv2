-- Create user profiles table with personal info and visibility toggles
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  bio TEXT,
  profile_media_url TEXT,
  profile_media_type TEXT CHECK (profile_media_type IN ('image', 'video')),
  
  -- Visibility toggles for each field
  full_name_public BOOLEAN DEFAULT false,
  email_public BOOLEAN DEFAULT false,
  phone_public BOOLEAN DEFAULT false,
  address_public BOOLEAN DEFAULT false,
  bio_public BOOLEAN DEFAULT true,
  profile_media_public BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view public profile data" 
ON public.profiles 
FOR SELECT 
USING (true); -- We'll filter public fields in the application logic

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for profile media
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-media', 'profile-media', true);

-- Storage policies for profile media
CREATE POLICY "Users can view all profile media" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile-media');

CREATE POLICY "Users can upload their own profile media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile media" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile media" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]);