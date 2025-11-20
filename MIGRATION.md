# Cloudflare Pages SSR Migration Guide

## Overview

This document outlines the migration from GitHub Pages (static site) to Cloudflare Pages with Server-Side Rendering (SSR) for improved SEO and performance.

## Key Changes

### 1. SSR Implementation

#### Entry Points

- **Client Entry** (`src/entry-client.tsx`): Handles hydration on the client side
- **Server Entry** (`src/entry-server.tsx`): Handles server-side rendering

#### Routing Updates

- Updated `AppRouter` to support both `BrowserRouter` (client) and `StaticRouter` (server)
- Added `isServer` and `location` props to handle SSR context

#### App Component Changes

- Added server-side checks for all client-only code (localStorage, window APIs, etc.)
- All effects now check `isServer` before executing client-only logic

### 2. Build System

#### Vite Configuration

- Updated `vite.config.js` to support both client and server builds
- Client build outputs to `dist/client`
- Server build outputs to `dist/server`
- Added SSR manifest generation for proper asset loading

#### Build Scripts

- `yarn build`: Runs complete SSR build (client + server)
- `yarn build:client`: Builds only the client bundle
- `yarn build:server`: Builds only the server bundle
- `yarn dev:ssr`: Runs local development with Cloudflare Workers
- `yarn preview:ssr`: Preview SSR build locally
- `yarn deploy`: Deploy to Cloudflare Pages

### 3. Cloudflare Pages Integration

#### Functions

- Created `functions/[[path]].ts` as a catch-all route handler
- Implements SSR for all routes except static assets
- Falls back to static HTML if SSR fails

#### Configuration

- `wrangler.toml`: Cloudflare Pages configuration
- Specifies build output directory (`dist/client`)
- Defines environment variables and build commands

### 4. SEO Improvements

#### Meta Tags

- Server-rendered meta tags for better SEO
- Dynamic meta tags based on route (homepage, view, print, privacy)
- Proper Open Graph and Twitter Card tags

#### Additional SEO Assets

- `robots.txt`: Allows all search engines with proper crawl delays
- `sitemap.xml`: Defines all major routes for search engines
- Structured data (JSON-LD) already present in `index.html`

### 5. Deployment

#### GitHub Actions

- New workflow: `.github/workflows/deploy-cloudflare.yml`
- Runs on push to main branch AND pull requests
- Steps: Install → Lint → Test → Build → Deploy to Cloudflare Pages
- **PR Preview Deployments**: Automatically creates preview URLs for each PR
- Posts preview URL as a comment on the PR
- Preview deployments are automatically cleaned up when PR is closed

#### Required Secrets

Add these to your GitHub repository secrets:

- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

### 6. Dependencies Added

#### Development Dependencies

- `@cloudflare/workers-types`: TypeScript types for Cloudflare Workers
- `@types/react`: React TypeScript types
- `@types/react-dom`: React DOM TypeScript types
- `wrangler`: Cloudflare development and deployment tool

## Migration Steps

### Local Development

1. Install dependencies:

   ```bash
   yarn install
   ```

2. Run development server:

   ```bash
   yarn dev
   ```

3. Test SSR build:
   ```bash
   yarn build
   yarn preview:ssr
   ```

### Deployment to Cloudflare Pages

#### Option 1: Automatic (Recommended)

1. Add GitHub secrets:
   - Go to repository Settings → Secrets and variables → Actions
   - Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`

2. Push to main branch:

   ```bash
   git push origin main
   ```

3. GitHub Actions will automatically deploy to Cloudflare Pages

#### Option 2: Manual

1. Build the project:

   ```bash
   yarn build
   ```

2. Deploy to Cloudflare Pages:
   ```bash
   yarn deploy
   ```

#### Option 3: PR Preview Deployments (Automatic)

Every pull request automatically gets a preview deployment!

1. **Create a PR**: Push your branch and create a pull request

   ```bash
   git push -u origin feature-branch
   ```

2. **Automatic Preview**: GitHub Actions will automatically:
   - Run linting and tests
   - Build the SSR application
   - Deploy to Cloudflare Pages preview environment
   - Comment on the PR with the preview URL

3. **Test Your Changes**: Use the preview URL to verify:
   - Visual changes
   - SEO meta tags (View Page Source)
   - Server-side rendering
   - All functionality

4. **Share with Team**: The preview URL can be shared with reviewers

5. **Automatic Cleanup**: Preview deployment is removed when PR is closed/merged

**Example Preview URL Format:**

```
https://abc123def.1markdown.pages.dev
```

Each PR gets a unique preview URL that stays live until the PR is closed.

### Cloudflare Pages Setup

1. **Create Cloudflare Pages Project**:
   - Go to Cloudflare Dashboard → Pages
   - Connect to your GitHub repository
   - Or create a new project for manual deployments

2. **Configure Build Settings** (if using Cloudflare dashboard):
   - Build command: `yarn build`
   - Build output directory: `dist/client`
   - Root directory: `/`

3. **Environment Variables**:
   - Set `NODE_ENV=production` for production builds

4. **Custom Domain**:
   - Add `1markdown.wahthefox.com` as a custom domain
   - Update DNS records as instructed by Cloudflare

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Request                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare Pages Function                      │
│                (functions/[[path]].ts)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │                    │
                    ▼                    ▼
         ┌──────────────────┐  ┌──────────────────┐
         │  Static Assets   │  │   SSR Handler    │
         │  (CSS, JS, etc.) │  │  (entry-server)  │
         └──────────────────┘  └──────────────────┘
                                        │
                                        ▼
                          ┌──────────────────────────┐
                          │  Server-Rendered HTML    │
                          │  with Dynamic Meta Tags  │
                          └──────────────────────────┘
                                        │
                                        ▼
                          ┌──────────────────────────┐
                          │  Client Hydration        │
                          │  (entry-client.tsx)      │
                          └──────────────────────────┘
```

## Benefits of SSR on Cloudflare Pages

1. **Better SEO**: Search engines see fully-rendered content
2. **Faster First Paint**: Users see content faster (SSR HTML)
3. **Dynamic Meta Tags**: Different meta tags for each route
4. **Edge Computing**: Content served from Cloudflare's global network
5. **Improved Performance**: Lower latency with edge rendering
6. **Better Social Sharing**: Proper Open Graph tags for each route

## Testing SSR

### Test Meta Tags

1. Build the project: `yarn build`
2. Run local preview: `yarn preview:ssr`
3. Open browser to `http://localhost:8788`
4. Check page source (View → Developer → View Source)
5. Verify meta tags are server-rendered (not added by JavaScript)

### Test Different Routes

- Homepage: `/`
- View page: `/view`
- Print page: `/print`
- Privacy page: `/privacy`

Each route should have appropriate meta tags in the server-rendered HTML.

## Rollback Plan

If issues occur, you can rollback to static GitHub Pages:

1. Revert to previous commit:

   ```bash
   git revert HEAD
   git push origin main
   ```

2. Re-enable GitHub Pages in repository settings:
   - Settings → Pages
   - Source: GitHub Actions
   - The old deploy workflow will resume

## Performance Considerations

### Bundle Size

- Client bundle: ~3.2 MB (includes Mermaid, CodeMirror, MUI)
- Server bundle: ~182 KB
- Gzipped client: ~1 MB

### Optimization Opportunities

1. Code splitting for Mermaid diagrams (lazy load)
2. Lazy load CodeMirror extensions
3. Use Cloudflare's CDN caching for static assets
4. Consider using Cloudflare Workers KV for shared document storage

## Troubleshooting

### Service Worker Issues

If service worker registration fails:

1. Check that `sw.js` is in `dist/client/`
2. Verify HTTPS is enabled (required for service workers)
3. Clear browser cache and re-register

### SSR Errors

If SSR fails, the application falls back to static HTML:

1. Check Cloudflare Pages logs
2. Verify all server-side code is properly guarded
3. Ensure no browser APIs are used during SSR

### Build Failures

If build fails:

1. Clear `dist/` directory: `rm -rf dist`
2. Clear node_modules: `rm -rf node_modules && yarn install`
3. Check Vite config for errors

## Next Steps

1. **Monitor Performance**: Use Cloudflare Analytics to track performance
2. **A/B Testing**: Compare SEO performance before/after migration
3. **Cache Optimization**: Configure Cloudflare cache rules for better performance
4. **Edge Storage**: Consider using Cloudflare KV for shared documents
5. **CI/CD**: Set up preview deployments for pull requests

## Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Vite SSR Guide](https://vitejs.dev/guide/ssr.html)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
