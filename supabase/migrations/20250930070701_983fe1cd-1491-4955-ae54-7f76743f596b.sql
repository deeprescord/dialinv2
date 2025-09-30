-- Create storage bucket for user files
INSERT INTO storage.buckets (id, name, public) VALUES ('user-files', 'user-files', false);

-- Create spaces table for organizing files
CREATE TABLE public.spaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create files table for storing file metadata
CREATE TABLE public.files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT,
  thumbnail_path TEXT,
  duration INTEGER, -- for video/audio files in seconds
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table for files in spaces (many-to-many)
CREATE TABLE public.space_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(space_id, file_id)
);

-- Create file shares table for tracking access
CREATE TABLE public.file_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  shared_with UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_level TEXT NOT NULL DEFAULT 'view' CHECK (access_level IN ('view', 'comment', 'edit')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(file_id, shared_with)
);

-- Create file comments table
CREATE TABLE public.file_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  timestamp_seconds DECIMAL, -- for media files, when comment was made
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for spaces
CREATE POLICY "Users can view their own spaces" ON public.spaces
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own spaces" ON public.spaces
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spaces" ON public.spaces
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spaces" ON public.spaces
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for files
CREATE POLICY "Users can view files they own or have access to" ON public.files
  FOR SELECT USING (
    auth.uid() = owner_id OR 
    EXISTS (SELECT 1 FROM public.file_shares WHERE file_id = files.id AND shared_with = auth.uid())
  );

CREATE POLICY "Users can create their own files" ON public.files
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own files" ON public.files
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own files" ON public.files
  FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for space_files
CREATE POLICY "Users can view space files for their spaces or shared files" ON public.space_files
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.spaces WHERE id = space_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.file_shares WHERE file_id = space_files.file_id AND shared_with = auth.uid())
  );

CREATE POLICY "Users can add files to their own spaces" ON public.space_files
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.spaces WHERE id = space_id AND user_id = auth.uid()) AND
    auth.uid() = added_by
  );

CREATE POLICY "Users can remove files from their own spaces" ON public.space_files
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.spaces WHERE id = space_id AND user_id = auth.uid())
  );

-- RLS Policies for file_shares
CREATE POLICY "Users can view shares for their files or files shared with them" ON public.file_shares
  FOR SELECT USING (
    auth.uid() = shared_with OR
    EXISTS (SELECT 1 FROM public.files WHERE id = file_id AND owner_id = auth.uid())
  );

CREATE POLICY "File owners can create shares" ON public.file_shares
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.files WHERE id = file_id AND owner_id = auth.uid()) AND
    auth.uid() = shared_by
  );

CREATE POLICY "File owners can delete shares" ON public.file_shares
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.files WHERE id = file_id AND owner_id = auth.uid())
  );

-- RLS Policies for file_comments
CREATE POLICY "Users can view comments on files they have access to" ON public.file_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.files f 
      WHERE f.id = file_id AND (
        f.owner_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.file_shares WHERE file_id = f.id AND shared_with = auth.uid())
      )
    )
  );

CREATE POLICY "Users can create comments on files they have access to" ON public.file_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.files f 
      WHERE f.id = file_id AND (
        f.owner_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.file_shares WHERE file_id = f.id AND shared_with = auth.uid())
      )
    )
  );

CREATE POLICY "Users can update their own comments" ON public.file_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.file_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Storage policies for user files
CREATE POLICY "Users can view files they own or have access to" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'user-files' AND (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM public.files f
        JOIN public.file_shares fs ON f.id = fs.file_id
        WHERE f.storage_path = name AND fs.shared_with = auth.uid()
      )
    )
  );

CREATE POLICY "Users can upload files to their own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'user-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_spaces_updated_at
  BEFORE UPDATE ON public.spaces
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_files_updated_at
  BEFORE UPDATE ON public.files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_file_comments_updated_at
  BEFORE UPDATE ON public.file_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();