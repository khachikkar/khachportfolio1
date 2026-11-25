# Khachik Karapetyan Portfolio

The static portfolio uses Supabase for its shared hero, project content, admin sign-in, and uploaded images. `projects.json` remains the starter and downloadable backup.

## Supabase setup

The Supabase project `khachik-portfolio` is connected in `supabase-config.js`. Its URL and **publishable** key are safe for browser code; never put a service role key in the site. The `supabase/portfolio_setup.sql` migration creates the RLS-protected content row, image bucket, policies, and starter data.

In Supabase Auth → URL Configuration, set the Site URL to `https://khachportfolio1.netlify.app` and add `https://khachportfolio1.netlify.app/admin.html` plus your local development address (for example, `http://localhost:*/**`) to the allowed redirect URLs. On `/admin.html`, create an account with `khachikkarapetyan78@gmail.com`, confirm the email, then sign in with its password. The database and Storage policies allow writes only for that email.

## Edit projects

1. Sign in to `/admin.html`.
2. Edit a project, add or delete one, or choose a new hero/project image.
3. Click **Save changes online**. The database update is shared by all visitors; the image files are stored in the public portfolio image bucket.

The JSON backup button downloads the current content if needed. `projects.json` and the in-browser store remain fallbacks when Supabase is not configured or reachable.

## Main files

- `index.html`, `project.html`, and `style.css` define the public portfolio.
- `projects.json` contains initial and backup content.
- `portfolio-store.js` reads current content from Supabase with local/JSON fallbacks.
- `supabase-config.js` contains the browser-safe project URL and publishable key.
- `supabase/portfolio_setup.sql` creates the content table, public image bucket, initial row, and RLS policies.
- `admin.html` and `admin.js` provide authenticated editing.
