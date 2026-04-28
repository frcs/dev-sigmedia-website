# Gemini Context: SIGMEDIA Website

This project is a migration of the SIGMEDIA research group website from Jekyll to Astro.

## Core Mandates

- **Framework**: Use Astro 6.x and Tailwind CSS 4.x.
- **Package Manager**: Always use `bun`.
- **Content Collections**: Maintain strict adherence to the schemas defined in `sigmedia-astro/src/content.config.ts`.
- **BibTeX Handling**: Publications are driven by `.bib` files in `src/data/publis/`. Ensure any logic for parsing or displaying them is robust to standard BibTeX formats.
- **Mathematics**: The site uses `remark-math` and `rehype-katex`. Ensure LaTeX formulas are correctly escaped and rendered.

## Technical Architecture

- **Dynamic Routes**: Pages like `team/[slug].astro` use content collections. Always check the corresponding loader in `content.config.ts`.
- **Legacy Cleanup**: The `modernize_md.js` script is critical when adding or updating legacy Markdown content. Run it or incorporate its logic if bulk-updating content files.
- **Styles**: Tailwind CSS 4 is integrated via the `@tailwindcss/vite` plugin in `astro.config.mjs`. Use standard Tailwind utility classes.

## Development Workflow

- Run `bun dev` from within the `sigmedia-astro/` directory.
- When adding new members or posts, ensure the frontmatter matches the Zod schema in `src/content.config.ts`.
- Images should ideally be placed in `public/assets/images/` and referenced by absolute paths or relative to the public root.

## Specific Conventions

- **Title Casing**: Headers in Markdown should follow Title Case (handled partially by `modernize_md.js`).
- **Markdown Attributes**: Jekyll-style attributes like `{: .text-center}` are NOT supported by the default Astro markdown parser and should be removed or converted to HTML/Components.
