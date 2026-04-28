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

## Migration Utilities

If you are importing legacy Markdown files, run the modernization script:

```bash
node modernize_md.js
```

This script fixes broken headers, removes Jekyll-specific attributes (like `{: .class}`), and repairs table formatting.
