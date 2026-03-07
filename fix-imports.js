#!/usr/bin/env node
/**
 * Post-build script to add .js extensions to ES module imports
 */

const fs = require('fs');
const path = require('path');

function fixImportsInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // First, fix directory imports (e.g., './storage' -> './storage/index.js')
    // This must be done BEFORE adding .js extensions to avoid './storage.js'
    const dirImportPattern = /(from\s+['"])(\.\.?\/(storage|audio|tone-editor|midi|random-tone|oscilloscope|mml|history|favorites))(['"];)/g;
    content = content.replace(dirImportPattern, (match, prefix, dirPath, dir, suffix) => {
        modified = true;
        return `${prefix}${dirPath}/index.js${suffix}`;
    });
    
    // Then, fix relative imports without .js extension
    const patterns = [
        // import ... from './module'
        /from\s+['"](\.[^'"]+)['"];/g,
        // export ... from './module'
        /export\s+\*\s+from\s+['"](\.[^'"]+)['"];/g,
        /export\s+\{[^}]+\}\s+from\s+['"](\.[^'"]+)['"];/g
    ];
    
    patterns.forEach(pattern => {
        content = content.replace(pattern, (match, importPath) => {
            // Skip if already has .js extension
            if (importPath.endsWith('.js')) {
                return match;
            }
            
            // Add .js extension
            const newPath = importPath + '.js';
            modified = true;
            return match.replace(importPath, newPath);
        });
    });
    
    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed: ${filePath}`);
    }
}

function processDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
            processDirectory(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            fixImportsInFile(fullPath);
        }
    }
}

const distDir = path.join(__dirname, 'dist');
console.log('Fixing ES module imports in', distDir);
processDirectory(distDir);
console.log('Done!');
