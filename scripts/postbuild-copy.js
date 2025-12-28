const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '..', 'dist');
const indexFile = path.join(distDir, 'index.html');
const fallbackFile = path.join(distDir, '404.html');

if (!fs.existsSync(indexFile)) {
  console.error('postbuild-copy: dist/index.html not found. Run build first.');
  process.exit(1);
}

try {
  fs.copyFileSync(indexFile, fallbackFile);
  console.log('postbuild-copy: created dist/404.html');
} catch (err) {
  console.error('postbuild-copy: failed to copy index.html to 404.html', err);
  process.exit(1);
}
