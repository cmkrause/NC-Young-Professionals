# Seasonal reading plans

This preview is intentionally not linked from the sermon homepage. /advent/ is the landing page; ?plan=calendar opens the current Advent week; &week=1 through &week=4 select a week, and #day-YYYY-MM-DD scrolls to an individual reading. Existing ?plan=calendar&day=YYYY-MM-DD links continue to work. ?plan=road&day=YYYY-MM-DD opens a daily devotional.

The renderer uses advent-2026.json (schemaVersion 1) for season metadata, theme start dates, resource symbols, individual ISO dates, titles, USFM scripture links and original source URLs. A video object has title, url, and optional verified youtube ID. Add another season by creating a new JSON file and configuring the entry point. The JSON includes the complete devotional readings and reflection prompts transcribed from the supplied BibleProject PDFs, with paragraph structure preserved and layout whitespace normalized. Source links and BibleProject attribution remain visible. The plan introductions and Day 24 closing message are also retained. Scripture groups preserve the printed references and link separate verse ranges independently; the printed Exodus 34:–6 label is retained, linked to Exodus 34:6 as cited in the reflection. Day 11's malformed Exodus 34:–6 reference is linked to Exodus 34:6, as cited in the corresponding reflection.

Completion key: gather-season:<season id>:<resource id>. Theme, font, size, and Bible translation use existing gather-* keys. The settings code in season.js is adapted from site.js; keep these in sync if settings change. Dates use device local time. No backend or accounts. For iframe playback verify individual video IDs; unsupported videos link to the official page.

## Data caching
The Advent renderer requests the reading JSON with a versioned URL and bypasses the browser cache. It validates that all reading and reflection arrays contain text, retries once with a unique URL if necessary, and displays an error instead of empty sections if the data remains incomplete. Update the JSON URL version when publishing new content and increment the script version in index.html when changing the renderer.

## Weekly calendar
The calendar uses the existing theme index on each daily JSON entry. The four weekly views contain the complete daily scripture and reflection, one collapsible weekly video, and candle shortcuts. Completion buttons update only the affected candle, button and count, preserving scroll position and the current video. Storage keys and ISO date values are unchanged; no migration is needed. The overview shows the current week and the current Road to Christmas devotional, with full plan introductions available below.

## Road to Christmas journey
The daily Road to Christmas view uses a horizontally scrollable strip of 23 varied river-stone silhouettes and a Bethlehem star for the final day. The optional journey map uses the same icons in a four-row serpentine route. Marker links retain existing date permalinks; both completion controls update the strip, map and count in place without replacing the devotional or video. The JSON and localStorage keys are unchanged. The existing resource symbol value remains for data compatibility.

## Video playback and responsive journey turns
All 24 distinct BibleProject video IDs are mapped in the JSON (28 references including the four repeated weekly videos). Video sections show a thumbnail with a play button; pressing it loads the privacy-enhanced YouTube embed. External YouTube and BibleProject links are outside the player; an absent ID renders only the source link, never a black container. The journey grid uses the same responsive side gutters and measured SVG path on every screen size. A narrow visual mask behind each full-width tappable marker leaves a minimum gap between masks so horizontal dashed lines remain visible. The path is recalculated on expand and resize.

## Shared player
Advent now uses the root `video-player.js` and `video-player.css` via relative paths. The renderer supplies the BibleProject title, YouTube ID and original source link. Video markup, deferred iframe activation, and player styling are maintained in the shared component rather than in seasonal files.

## BibleProject video provider
All 28 BibleProject video references (24 unique titles) now specify `provider: 'mux'` and the public `playbackId` obtained from each official BibleProject video page's Full Video link. The four weekly videos and their corresponding Road to Christmas entries use matching playback IDs. The Hope pilot was confirmed working by the site owner before rollout. The remaining videos have validated identifiers and markup, but playback and caption quality have not been individually tested in a browser. YouTube and BibleProject links are retained as alternatives. Sermon recordings remain on YouTube. The existing shared player requires no changes for this rollout.

## Advent overview information
Each resource card has its own information icon vertically centered beside its title and description. A shared native dialog loads only the selected resource's original introduction from the existing JSON and behaves as a bottom sheet on phones. No reading content is duplicated or removed.
