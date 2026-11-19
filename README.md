# sundeepdawadi-afk.github.io

Personal portfolio, research and blog of **Sundeep Dawadi** — AI & NLP Researcher.

Static site built with [Eleventy](https://www.11ty.dev/) (Nunjucks templates + Markdown blog),
deployed to GitHub Pages via GitHub Actions.

## Local development

```bash
npm install
npm run dev      # http://localhost:8080
```

## Build

```bash
npm run build    # outputs to _site/
```

## Content

- Site data (projects, research, experience, achievements): `src/_data/*.json`
- Blog posts (Markdown): `src/blog/*.md`
- Placeholder images: `public/img/ph/` (replace with real images later)

## Deploy

Pushing to `main` triggers the `Deploy to GitHub Pages` workflow
(Settings → Pages → Source: **GitHub Actions**).
