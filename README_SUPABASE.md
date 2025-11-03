# Supabase Integration Guide

This guide explains how to set up Supabase for the Turnover Clone application.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Node.js and Bun installed

## Step 1: Create a Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Choose your organization and enter project details
4. Wait for the project to be provisioned (takes about 2 minutes)

## Step 2: Run Database Migration

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the following SQL migration script:

```sql
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_submissions_date ON submissions(date);
CREATE INDEX IF NOT EXISTS idx_submissions_username ON submissions(username);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_submission_id ON photos(submission_id);

-- Enable Row Level Security (RLS)
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Create policies for submissions table
-- Allow public read access
CREATE POLICY "Allow public read access to submissions"
  ON submissions
  FOR SELECT
  USING (true);

-- Allow public insert access
CREATE POLICY "Allow public insert access to submissions"
  ON submissions
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated update access (for admin updates)
CREATE POLICY "Allow public update access to submissions"
  ON submissions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create policies for photos table
-- Allow public read access
CREATE POLICY "Allow public read access to photos"
  ON photos
  FOR SELECT
  USING (true);

-- Allow public insert access
CREATE POLICY "Allow public insert access to photos"
  ON photos
  FOR INSERT
  WITH CHECK (true);
```

5. Click "Run" to execute the migration
6. Verify the tables were created by going to "Table Editor" in the left sidebar

## Step 3: Create Storage Bucket

1. In your Supabase project dashboard, click on "Storage" in the left sidebar
2. Click "Create a new bucket"
3. Enter the bucket name: `turnover-uploads`
4. **Important:** Make sure to set the bucket as **Public**
5. Click "Create bucket"

### Configure Bucket Policies

1. Click on the `turnover-uploads` bucket
2. Go to "Policies" tab
3. Click "New Policy" and select "For full customization"
4. Add the following policies:

**Policy 1: Public Read Access**
```sql
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'turnover-uploads');
```

**Policy 2: Public Insert Access**
```sql
CREATE POLICY "Public Insert Access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'turnover-uploads');
```

Alternatively, you can use the "New Policy" button and select:
- "Allow public access" for SELECT operations
- "Allow public access" for INSERT operations

## Step 4: Get API Credentials

1. In your Supabase project dashboard, click on "Settings" (gear icon) in the left sidebar
2. Click on "API" under "Project Settings"
3. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")

## Step 5: Configure Environment Variables

1. In your project root, create a `.env.local` file (or update existing one)
2. Add the following environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Admin Credentials
ADMIN_USERNAME=chituchitu
ADMIN_PASSWORD=1234567890
```

Replace `your_project_url_here` and `your_anon_key_here` with the values from Step 4.

**Important:** Change the `ADMIN_USERNAME` and `ADMIN_PASSWORD` to secure credentials for production use!

## Step 6: Install Dependencies

If you haven't already, install the Supabase client library:

```bash
bun add @supabase/supabase-js
```

## Step 7: Test the Integration

1. Start your development server:

```bash
bun run dev
```

2. Visit http://localhost:3000
3. Submit a test application with photos
4. Go to http://localhost:3000/admin/login
5. Login with your admin credentials
6. Verify that the submission appears with photos

## Fallback Behavior

The application is designed with a fallback mechanism:
- If Supabase environment variables are **not set**, the app uses local JSON files and filesystem storage
- If Supabase environment variables **are set**, the app uses Supabase for all data storage
- If Supabase operations **fail** (network issues, etc.), the app automatically falls back to local storage

This ensures the application works in development without Supabase configuration.

## Verifying Storage

To verify files are being uploaded correctly to Supabase Storage:

1. Go to "Storage" in your Supabase dashboard
2. Click on the `turnover-uploads` bucket
3. You should see uploaded images with timestamped filenames
4. Click on any image to verify it's accessible

## Security Considerations

### For Production:

1. **Change default admin credentials** in `.env.local`
2. **Consider implementing more secure authentication** using Supabase Auth
3. **Review RLS policies** - currently set to allow public access for ease of use
4. **Add rate limiting** to prevent abuse
5. **Implement file size limits** in your storage bucket settings
6. **Enable CORS** if hosting on a different domain

### Recommended RLS Updates for Production:

For stricter security, you can update the RLS policies:

```sql
-- Only allow inserts, restrict updates to authenticated users
DROP POLICY IF EXISTS "Allow public update access to submissions" ON submissions;

CREATE POLICY "Restrict update to authenticated users"
  ON submissions
  FOR UPDATE
  USING (auth.role() = 'authenticated');
```

## Troubleshooting

### Images not uploading
- Check bucket name is exactly `turnover-uploads`
- Verify bucket is set to Public
- Check storage policies are configured correctly

### Database operations failing
- Verify RLS policies are enabled and configured
- Check that your anon key has the correct permissions
- Review the browser console for specific error messages

### Authentication issues
- Verify admin credentials in `.env.local`
- Clear browser cookies and try again
- Check that middleware is protecting routes correctly

## Migration from Local to Supabase

If you have existing data in local JSON files and want to migrate to Supabase:

1. Export your existing data from `data/submissions.json`
2. Use the Supabase SQL Editor or a migration script to insert the data
3. Upload existing images from `public/uploads/` to Supabase Storage
4. Update the photo URLs in your database

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
