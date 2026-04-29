# SIGMEDIA Group Website

This repository contains the source code for the SIGMEDIA research group website, built with [Astro](https://astro.build/).

## Project Structure

- `sigmedia-astro/`: The main Astro project directory.
- `modernize_md.js`: A utility script to migrate and clean up legacy Markdown files (from Jekyll) into a format compatible with Astro.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js (>= 22.12.0)

### Installation

```bash
cd sigmedia-astro
bun install
```

### Development

To start the development server:

```bash
cd sigmedia-astro
bun run dev
```

The site will be available at `http://localhost:4321`.

### Build

To build the static site:

```bash
cd sigmedia-astro
bun run build
```

## Content Management

- **Team, Posts, Datasets, Software**: Located in `sigmedia-astro/src/content/`. These are managed via Astro Content Collections.
- **Publications**: BibTeX files are located in `sigmedia-astro/src/data/publis/`.
- **Images**: Located in `sigmedia-astro/public/assets/images/`.

## 📚 Publications Management

The site's publications are driven by `.bib` files in `sigmedia-astro/src/data/publis/`. To maintain consistency and discover new papers, follow this workflow:

### 1. Discover New Papers
Run the discovery script from within the `sigmedia-astro/` directory to fetch missing publications from Google Scholar for all active team members:
```sh
cd sigmedia-astro
bun scripts/fetch-new-publications.js
```
- This script checks all active (non-alumni) members with a `google-scholar` ID in their profile.
- It only suggests papers published **after** the member's join date and from **2024** onwards.
- Results are saved to `sigmedia-astro/new_papers.bib`.

### 2. Update BibTeX Files
1. Review the entries in `new_papers.bib`.
2. Move valid entries into the corresponding year file in `src/data/publis/` (e.g., `2024.bib`, `2025.bib`).

### 3. Tidy & Standardize
After adding new entries, run `bibtex-tidy` from the `sigmedia-astro/` directory:
```sh
bun x bibtex-tidy src/data/publis/*.bib -m --curly --numeric --months --space=2 --align=13 --sort=key --duplicates=key,doi --strip-enclosing-braces --drop-all-caps --trailing-commas --remove-empty-fields --sort-fields --generate-keys='[auth][year]' --wrap=80
```

## Migration Utilities


If you are importing legacy Markdown files, run the modernization script:

```bash
node modernize_md.js
```

This script fixes broken headers, removes Jekyll-specific attributes (like `{: .class}`), and repairs table formatting.
