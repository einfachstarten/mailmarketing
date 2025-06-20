const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const pkg = require('./backend/package.json');

function git(cmd) {
  try {
    return execSync(cmd).toString().trim();
  } catch (e) {
    return '';
  }
}

const commit = git('git rev-parse --short HEAD') || 'unknown';
let dirty = '';
try {
  if (git('git status --porcelain')) dirty = '-dirty';
} catch {}
const date = new Date().toISOString().split('T')[0];
const version = `${pkg.version} (${commit}${dirty}, ${date})`;
fs.writeFileSync(path.join(__dirname, 'version.txt'), version + '\n');
console.log('Generated version:', version);

