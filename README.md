# Rein's blog

Astro + MDX blog. Posts are Markdown (or MDX) files in `src/content/posts/`.

## Run it locally

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # outputs the static site to dist/
```

## Write a post

Add a file to `src/content/posts/`, e.g. `word2vec.md`. The file name becomes the URL (`/posts/word2vec/`).

```md
---
title: "Giving words meaning: embeddings and word2vec"
description: "One or two sentences for the home page and link previews."
pubDate: 2026-11-07
series: "How LLMs work"
part: 2
draft: true        # shows in `npm run dev`, hidden from the live site
---
```

Posts with the same `series` get a "Part X" label, a list of all parts, and previous/next links automatically.

### Interactive widgets (later)

Rename a post to `.mdx` and you can drop components into it. For React widgets:

```sh
npx astro add react
```

```mdx
import AttentionHeatmap from '../../components/AttentionHeatmap.jsx';

<AttentionHeatmap client:visible sentence="the cat sat on the mat" />
```

`client:visible` only loads the widget's JavaScript when the reader scrolls to it.

## Settings to fill in

- `src/consts.ts`: site title, description, and your Buttondown username (the newsletter box appears once it's set).
- `astro.config.mjs`: replace `site: 'https://example.com'` with your domain (used for the sitemap and link previews).
- `src/pages/about.astro`: make the About page your own.

## Deploy (Cloudflare Pages, Netlify or Vercel)

1. Push this folder to a new GitHub repo.
2. In the host's dashboard, import the repo.
   - Build command: `npm run build`
   - Output directory: `dist`
3. Every push to `main` publishes automatically. Add your custom domain in the host's settings.
