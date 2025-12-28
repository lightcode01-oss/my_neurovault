# Fixing MIME Type Errors for Vite + React + TypeScript Deployments

## Checklist

1. **Set Vite base for GitHub Pages**
   - In `vite.config.ts`, set `base: '/neurovault/'` for this repo.
2. **Build for production**
   - Run `npm run build` (do not publish `src/`).
3. **Deploy only the `dist/` output**
   - Publish the contents of `dist/` to your Pages branch or `docs/` folder.
4. **Check local MIME types**
   - Run `npm run check:mime:local` to verify local `dist/` assets.
5. **Check remote MIME types after deploy**
   - Run `npm run check:mime:remote` to verify headers on the live site.
6. **If you see `application/octet-stream` errors**
   - The files published are likely raw `.ts/.tsx` sources or the host mis-detected MIME types.
   - Fix by publishing compiled `.js` from `dist/` and/or configuring host to serve `.js` as `text/javascript`.

## Example Commands

```sh
npm install
npm run build
npm run postbuild # (runs automatically if using postbuild script)
npm run check:mime:local
# deploy dist/ to GitHub Pages
npm run check:mime:remote https://rajeshkumar92828282.github.io/neurovault/
```

## Reference
- Screenshot: `/mnt/data/30aeabb0-8b30-426e-aa5b-17e444a7df39.png` shows the exact error this checklist fixes.
