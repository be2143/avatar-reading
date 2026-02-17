const fs = require('fs');
const path = require('path');

try {
  const projectRoot = process.cwd();
  const reactDir = path.join(projectRoot, 'node_modules', 'react');
  const cjsDir = path.join(reactDir, 'cjs');
  const cjsFile = path.join(cjsDir, 'react.production.min.js');
  const umdFile = path.join(reactDir, 'umd', 'react.production.min.js');

  if (!fs.existsSync(reactDir)) {
    process.exit(0);
  }

  // If the CJS file already exists, nothing to do.
  if (fs.existsSync(cjsFile)) {
    process.exit(0);
  }

  // If UMD build doesn't exist, we can't repair it.
  if (!fs.existsSync(umdFile)) {
    process.exit(0);
  }

  fs.mkdirSync(cjsDir, { recursive: true });
  fs.copyFileSync(umdFile, cjsFile);
} catch {
  // This script is best-effort; ignore any errors.
  process.exit(0);
}

