# Khachik Karapetyan Portfolio

The portfolio is a static site hosted on Netlify. `projects.json` contains the homepage hero image and the project list.

## Edit the hero or projects

1. Open `/admin.html`; the current hero and projects load automatically.
2. Upload a new homepage hero image, edit a project, or add/delete projects.
3. Click **Download updated portfolio JSON**.
4. Replace `projects.json` in the portfolio folder with the downloaded file, then publish the site.

Uploaded images are embedded in the JSON file. AVIF, JPG, PNG, and WebP are supported; compressed AVIF images help keep the website fast. Password protection and online saving can be added with Supabase in a later phase.

## Project fields

- `hero.image` and `hero.alt` control the homepage portrait.
- Each entry in `projects` has `slug`, `title`, `category`, `description`, `image`, `alt`, and `focus` fields.

## Main files

- `index.html` and `style.css` define the portfolio structure and visual design.
- `script.js` renders the Work cards and hero image, and handles page motion.
- `projects.json` is the shared hero and project data.
- `projects-fallback.js` keeps the starter data visible in previews where browsers block JSON fetch requests.
- `project.html` and `project.js` render individual projects.
- `admin.html` and `admin.js` provide the JSON editor.
