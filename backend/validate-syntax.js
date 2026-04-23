#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
let errors = 0;

function validateFile(filePath) {
  try {
    require(filePath);
    console.log(`✓ ${path.relative(srcDir, filePath)}`);
  } catch (err) {
    console.error(`✗ ${path.relative(srcDir, filePath)}: ${err.message}`);
    errors++;
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith('.js')) {
      validateFile(fullPath);
    }
  });
}

console.log('Validating Node.js syntax...\n');
walkDir(srcDir);
console.log(`\nResult: ${errors === 0 ? '✓ All files valid' : `✗ ${errors} file(s) with errors`}`);
process.exit(errors > 0 ? 1 : 0);
