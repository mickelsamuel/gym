#!/usr/bin/env node

/**
 * This script cleans up unused imports in TypeScript/JavaScript files
 * To run: node scripts/cleanup-imports.js
 */

const fs = require('fs');
// Mark unused variable with underscore
const _path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');

const execPromise = promisify(exec);

async function findTsFiles() {
  try {
    const { stdout } = await execPromise('find ./src -type f -name "*.ts" -o -name "*.tsx" | grep -v "test.ts" | grep -v ".d.ts"');
    return stdout.trim().split('\n');
  } catch (error) {
    console.error('Error finding TypeScript files:', error);
    return [];
  }
}

function removeUnusedImports(fileContent) {
  // Find all import statements
  const importRegex = /import\s+(?:{[\s\w,]*}|\w+|\*\s+as\s+\w+)\s+from\s+['"].*['"]/g;
  const imports = fileContent.match(importRegex) || [];
  
  let updatedContent = fileContent;

  imports.forEach(importStmt => {
    // Extract imported variables
    const varMatch = importStmt.match(/import\s+{([^}]*)}\s+from/);
    
    if (varMatch) {
      const variables = varMatch[1].split(',').map(v => v.trim());
      
      // Check if each variable is used elsewhere in the file
      const unusedVars = variables.filter(variable => {
        if (!variable || variable === '') return false;
        
        // Remove type declarations
        const varName = variable.split(' as ')[0].trim();
        
        // Count occurrences outside of import statement
        const fileWithoutImport = updatedContent.replace(importStmt, '');
        const regex = new RegExp(`\\b${varName}\\b`, 'g');
        return (fileWithoutImport.match(regex) || []).length === 0;
      });
      
      if (unusedVars.length > 0 && unusedVars.length < variables.length) {
        // Some variables are unused, remove them from imports
        const newImport = importStmt.replace(
          /{([^}]*)}/,
          `{${variables.filter(v => !unusedVars.includes(v.trim())).join(', ')}}`
        );
        updatedContent = updatedContent.replace(importStmt, newImport);
      } else if (unusedVars.length === variables.length) {
        // All variables in this import are unused, remove the entire import
        updatedContent = updatedContent.replace(importStmt, '');
      }
    }
  });
  
  // Remove empty lines
  updatedContent = updatedContent.replace(/^\s*[\r\n]/gm, '');
  
  return updatedContent;
}

async function processFiles() {
  const files = await findTsFiles();
  let filesChanged = 0;
  
  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const updatedContent = removeUnusedImports(content);
      
      if (content !== updatedContent) {
        fs.writeFileSync(filePath, updatedContent);
        filesChanged++;
        console.log(`✅ Cleaned up imports in ${filePath}`);
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  }
  
  console.log(`\nDone! Cleaned up imports in ${filesChanged} files.`);
}

processFiles(); 