# Site Maintenance

## Publish on GitHub Pages

If Pages was previously configured for `/docs`, change the publishing folder to `/(root)` after this reorganization.

1. Open **Settings → Pages** in this repository.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Choose branch **main** and folder **/(root)**, then click **Save**.
4. Wait for the **pages build and deployment** job in **Actions** to finish. The Pages settings will display the live URL.

Expected address: https://cmkrause.github.io/NC-Young-Professionals/

After setup, commits to `main` automatically update the website. No package installation, build command, or API key is needed.

## Structure and maintenance

- The repository root contains the complete static website. GitHub Pages publishes directly from this folder.
- `guides.json` contains the index, series metadata, publication flags, and permalink aliases.
- `guides/` contains each guide's content and slides.
- `translations.json` contains the Bible translation choices.
- `fonts/` includes bundled fonts and their license files.
- `slides/` contains backgrounds and responsive variants.
- The unlisted file viewer is at `debug/` (also available as `debug.html`). It is public, not an administration or editing interface.

Permalinks retain the form `?week=2026-11-15`; append them to the new site address. Old ChatGPT Sites links continue pointing to the old host. Reading settings are stored per domain, so visitors choose them again on the new host.

All local asset paths are relative, so the same files work under a repository prefix or at a custom domain. Keep new image and background paths relative as well.

This migration copied the current site at source commit `b1008ad59ae16561226e5b6dcb6a7864ff391ac9`. The existing ChatGPT Sites publication was not changed. Existing Sites history remains with its original repository; this repository starts with the migrated snapshot.


## Adding a guide

Add an entry to `guides.json` with a stable `id`, a display `date`, a `title`, a boolean `published`, and the relative `file` path to the guide JSON. Include the `series` key and the `speaker` when known. Use `published: false` to keep it out of the date strip and archive. Unlisted guide files are still publicly accessible.

For a series heading, add `partLabel` (for example, `Chapter 6` or `Part 2`) and `sermonTitle` (the standalone sermon title). The heading uses the series name from the series record, and its badges link to published entries in date order. Keep `title` as the full display title for the archive and browser tab.

Keep the ID stable when correcting a display date. Add optional, unique strings to an entry's `aliases` list to support old or friendlier `?week=` links. Aliases are case-sensitive. The copy-link control shares the canonical ID.

## Adding slides

- Put the guide content and its ordered `slides` in the guide file under `guides/`. An empty or omitted slides list hides the Slide Deck section.
- Set `series` in the guide’s index entry to the shared series key. For a new series, add its image to `slides/` and set that key’s `slideBackground` in the `series` section of `guides.json`. It can be a single path or an array of `{width, src}` entries, all at the same aspect ratio. The viewer selects the smallest width that meets the deck width times the screen pixel density, falling back to the largest file.
- A statement slide has `kind: "statement"`, an accessible `title`, and `parts`. A quote slide uses `kind: "quote"` with the same fields plus `name` and `role`. Each part has `text` and may set `emphasis: true` for bold italics. Include spaces between parts where needed.

## Bible links

`translations.json` defines the selector's translations, YouVersion IDs, default, and source URLs. In a guide, leave text without links as a string. To link a reference in a question, big idea, or scripture credit, use an array of parts with `text` and an optional `passage` such as `JHN.3.16`. Keep punctuation and spacing in the text parts. For disjoint verses, use separate linked parts. The reader's choice changes link destinations only.

## Red-letter scripture

Each paragraph in `scripture`, or each line within a group in `scriptureGroups`, can be a plain string, a red-letter object such as `{"text":"Jesus’ words","redLetter":true}`, or an array mixing both. For example, `["He said, ", {"text":"“Follow me.”","redLetter":true}]` keeps the narration in the regular color. Include spaces and punctuation in the text itself.

To add a superscript slide reference after text in a question, use a separate part with a one-based `slide` number, such as `{"text":"[slide 5]","slide":5}`. A guide URL ending in `#slide-5` opens the deck at slide 5.


## Reading settings
The sticky header opens a native modal dialog (bottom sheet on phones). Theme, text size, Bible link translation, and font choices save locally on each device. Fonts load only when used. Atkinson is the default; bundled OpenDyslexic, Lexend, and Andika files and their OFL licenses are in `fonts`. Sources: https://github.com/antijingoist/opendyslexic and https://github.com/google/fonts/tree/main/ofl (lexend, andika). Lexend uses browser-synthesized italics; the other options provide native italic styles.
