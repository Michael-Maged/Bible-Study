# Environment Setup

## For New Developers

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Get your Supabase credentials:
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Select your project
   - Go to Settings → API
   - Copy the values for:
     - Project URL
     - anon/public key
     - service_role key (keep this secret!)

3. Paste the values into your `.env.local` file

4. **NEVER commit `.env.local` to git** - it's already in `.gitignore`

## Security Notes

- `.env.local` contains sensitive credentials and should NEVER be committed
- Each developer should have their own `.env.local` file
- For production, set environment variables in your hosting platform (Vercel, AWS, etc.)
