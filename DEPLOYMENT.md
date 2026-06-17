# Deployment

This app includes a server route at `/api/company-questions` for the Company HLD Radar, so deploy it to a Next.js host that supports serverless functions. Vercel is the simplest GitHub-connected path.

## Vercel from GitHub

1. Push this repository to your GitHub account.
2. In Vercel, choose **Add New Project** and import the GitHub repository.
3. Keep the default framework preset: **Next.js**.
4. Build command: `npm run build`
5. Output directory: leave blank.
6. Deploy.

The company-question search route uses public web search results and falls back to curated prompts if the search provider blocks or changes its HTML.

## Local Verification

```bash
npm install
npm run build
npm run dev
```

Open `http://localhost:3000`, then use the Coach tab to pick a level or run the Company HLD Radar.
