-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  username TEXT NOT NULL,
  plan INTEGER NOT NULL,
  total INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  note TEXT
);

-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
  id SERIAL PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  url TEXT NOT NULL
);

-- Create index on submission_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_photos_submission_id ON photos(submission_id);

-- Create storage bucket for turnover uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('turnover-uploads', 'turnover-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policy to allow public read access
CREATE POLICY IF NOT EXISTS "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'turnover-uploads');

-- Set up storage policy to allow authenticated uploads
CREATE POLICY IF NOT EXISTS "Authenticated Uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'turnover-uploads');
