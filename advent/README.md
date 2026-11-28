# Seasonal reading plans

This preview is intentionally not linked from the sermon homepage. /advent/ is the landing page; ?plan=calendar or ?plan=road opens a plan; &day=YYYY-MM-DD deep-links to a day.

The renderer uses advent-2026.json (schemaVersion 1) for season metadata, theme start dates, resource symbols, individual ISO dates, titles, USFM scripture links and original source URLs. A video object has title, url, and optional verified youtube ID. Add another season by creating a new JSON file and configuring the entry point. The JSON includes the complete devotional readings and reflection prompts transcribed from the supplied BibleProject PDFs, with paragraph structure preserved and layout whitespace normalized. Source links and BibleProject attribution remain visible. The plan introductions and Day 24 closing message are also retained. Scripture groups preserve the printed references and link separate verse ranges independently; the printed Exodus 34:–6 label is retained, linked to Exodus 34:6 as cited in the reflection. Day 11's malformed Exodus 34:–6 reference is linked to Exodus 34:6, as cited in the corresponding reflection.

Completion key: gather-season:<season id>:<resource id>. Theme, font, size, and Bible translation use existing gather-* keys. The settings code in season.js is adapted from site.js; keep these in sync if settings change. Dates use device local time. No backend or accounts. For iframe playback verify individual video IDs; unsupported videos link to the official page.

## Data caching
The Advent renderer requests the reading JSON with a versioned URL and bypasses the browser cache. It validates that all reading and reflection arrays contain text, retries once with a unique URL if necessary, and displays an error instead of empty sections if the data remains incomplete. Update the JSON URL version when publishing new content and increment the script version in index.html when changing the renderer.
