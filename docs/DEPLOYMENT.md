# Deploy a static export to Cloudflare Pages

This is a static frontend demonstration. Do not choose a full-stack Next.js Worker preset or add a server adapter.

1. Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `npm run test:e2e` locally. Confirm `out/index.html` exists.
2. Review the source, screenshot artifacts, and portfolio copy. Confirm no private records or secrets have been added.
3. Create an empty GitHub repository named `business-admin-dashboard` in your own account. No account changes have been made by this project.
4. On your local machine, review `git status`, stage the intended files, and commit with a Conventional Commit message, for example `feat: build interactive business dashboard demo`.
5. Ensure your production branch is `main`, add the GitHub remote, and push it after review. Example: `git remote add origin https://github.com/YOUR_USERNAME/business-admin-dashboard.git`, followed by `git push -u origin main`. Do not add a second origin if one already exists.
6. In Cloudflare, open Workers & Pages, create a Pages project, choose Git integration, authorize your GitHub repository, and select this repository.
7. Select the static Next.js export preset if offered, or no preset with these explicit settings: production branch `main`, build command `npm run build`, build output directory `out`, root directory the repository root. Select Node.js 22 LTS or newer in build settings if required.
8. No environment secrets, Functions, runtime database, or paid add-ons are required. Start the deployment in your own Cloudflare account.
9. Cloudflare supplies a free `YOUR_PROJECT.pages.dev` address. Open it and test entry, module navigation, editing, refresh persistence, CSV export, theme, mobile navigation, and reset.
10. Add the verified live URL to the README and your portfolio. Later pushes to main trigger new production builds; preview branches can be reviewed before merging.

Local production preview: `npm run build`, then `npm run start`.

If deployment fails, confirm that the output directory is exactly `out` and that no server-only Next.js features were introduced. A static export has no server sessions, API routes, or Server Actions. Clear browser site storage to test the first-visit experience.

References: [Next.js static exports](https://nextjs.org/docs/app/guides/static-exports), [Cloudflare static Next.js guide](https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/).

## Current deployment

Deployed on October 19, 2026 through Cloudflare Pages Git integration.

- Live URL: https://business-admin-dashboard.pages.dev/
- Repository: https://github.com/zakihasan25/business-admin-dashboard
- Project: `business-admin-dashboard`
- Production branch: `main`
- Published commit: `eb9eb1e4a5cd6242217f1c3f36413482393b552e` (merge of PR #1)
- Framework preset: Next.js (Static HTML Export)
- Build command: `npm run build`
- Output directory: `out`
- Root directory: repository root
- Build environment: `NODE_VERSION=22` (non-secret)

Cloudflare reported a successful production deployment. A live-browser smoke check verified demo entry and the Load example recovery scenario: portal capacity increased to 60h and Partner onboarding capacity decreased from 54h to 30h. The public smoke check did not repeat the entire local automated suite. Future updates to the configured production branch trigger Pages builds.
