# Band Concert Portfolio

A static website showcasing band gigs with photos and YouTube video embeds. No frameworks, no build step — vanilla HTML/CSS/JS only.

## Running locally

The site uses `fetch()` to load `data/gigs.json`, so it needs a local HTTP server (won't work via `file://`).

```bash
# Option 1: Node.js
npx serve .

# Option 2: Python
python -m http.server
```

Then open `http://localhost:3000` (serve) or `http://localhost:8000` (Python).

## How to add a new gig

1. **Choose a slug** using the format `YYYY-MM-DD-venue-name-city` (lowercase, hyphens). Example: `2026-05-20-the-blue-note-nyc`.

2. **Create the photo directories:**
   ```
   assets/gigs/2026-05-20-the-blue-note-nyc/
     thumbs/   (400px wide, used for grid cards and gallery thumbnails)
     1200/     (1200px wide, medium resolution)
     2000/     (2000px wide, used in lightbox)
   ```

3. **Add photos** in `.webp` format to each size directory:
   - `thumbs/cover.webp` — the card thumbnail shown on the index page
   - `thumbs/01.webp`, `1200/01.webp`, `2000/01.webp` — gallery photos at each resolution
   - Use matching filenames across all three directories

4. **Add a gig entry** to `data/gigs.json`:
   ```json
   {
     "id": "2026-05-20-the-blue-note-nyc",
     "date": "2026-05-20",
     "venue": "The Blue Note",
     "city": "New York City",
     "country": "USA",
     "title": "NYC Jazz Night",
     "description": "A description of the gig.",
     "photos": ["01", "02"],
     "coverPhoto": "cover",
     "youtubeUrls": ["https://www.youtube.com/watch?v=VIDEO_ID"],
     "credits": {
       "Sound Engineer": "Name",
       "Photography": "Name"
     }
   }
   ```

5. **Test locally** to make sure everything looks right.

## Deployment

Works as-is on any static hosting: Cloudflare Pages, Netlify, GitHub Pages, etc. Just point the service to the project root.

## Project structure

```
index.html        Concert grid page
gig.html          Concert detail page (loaded via ?id=slug)
styles.css        All styles (mobile-first, dark theme)
app.js            All JS (grid, filtering, lightbox, detail page)
data/gigs.json    Gig data (source of truth)
assets/gigs/      Photo assets organized by gig slug
```
