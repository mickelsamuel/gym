#!/usr/bin/env node

/**
 * This script helps identify and fix common useEffect dependency issues
 * To run: node scripts/fix-hooks.js
 */

const fs = require('fs');
const _path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');

const execPromise = promisify(exec);

async function findReactFiles() {
  try {
    const { stdout } = await execPromise('find ./src -type f -name "*.tsx" | grep -v "test.tsx"');
    return stdout.trim().split('\n');
  } catch (error) {
    console.error('Error finding React files:', error);
    return [];
  }
}

function fixUseEffectDependencies(fileContent) {
  // Regular expression to find useEffect hooks with potential dependency issues
  const useEffectRegex = /useEffect\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?\},\s*\[(.*?)\]\s*\)/g;
  let match;
  let updatedContent = fileContent;
  
  while ((match = useEffectRegex.exec(fileContent)) !== null) {
    const fullMatch = match[0];
    const dependencies = match[1].trim();
    const effectBody = fullMatch.substring(
      fullMatch.indexOf('{') + 1, 
      fullMatch.lastIndexOf('}')
    );
    
    // Look for variables referenced in the effect body that should be in the dependency array
    const stateRegex = /\b(set[A-Z]\w+)\b/g;
    const animRegex = /\b(\w+Anim)\b/g;
    const varRegex = /\b([a-z]\w+)\b/g;
    
    const stateSetters = new Set();
    const animVariables = new Set();
    const regularVariables = new Set();
    
    let varMatch;
    
    // Find state setters
    while ((varMatch = stateRegex.exec(effectBody)) !== null) {
      stateSetters.add(varMatch[1]);
    }
    
    // Find animation variables
    while ((varMatch = animRegex.exec(effectBody)) !== null) {
      animVariables.add(varMatch[1]);
    }
    
    // Find other variables
    while ((varMatch = varRegex.exec(effectBody)) !== null) {
      const varName = varMatch[1];
      // Exclude common built-ins and keywords
      if (!['return', 'const', 'let', 'var', 'function', 'if', 'else', 'true', 'false', 'null', 'undefined'].includes(varName) &&
          !varName.startsWith('set')) {
        regularVariables.add(varName);
      }
    }
    
    // Create suggested list of dependencies
    const currentDeps = dependencies ? dependencies.split(',').map(d => d.trim()).filter(d => d !== '') : [];
    const missingAnimDeps = [...animVariables].filter(v => !currentDeps.includes(v));
    const missingRegularDeps = [...regularVariables].filter(v => !currentDeps.includes(v));
    
    if (missingAnimDeps.length > 0 || missingRegularDeps.length > 0) {
      console.log(`\nPossible missing dependencies in useEffect:`);
      if (missingAnimDeps.length > 0) {
        console.log(`  Animation variables: ${missingAnimDeps.join(', ')}`);
      }
      if (missingRegularDeps.length > 0) {
        console.log(`  Regular variables: ${missingRegularDeps.join(', ')}`);
      }
      console.log(`  In effect: ${effectBody.substring(0, 100).trim()}${effectBody.length > 100 ? '...' : ''}`);
    }
  }
  
  return updatedContent;
}

async function processFiles() {
  const files = await findReactFiles();
  
  for (const filePath of files) {
    try {
      console.log(`Analyzing ${filePath}...`);
      const content = fs.readFileSync(filePath, 'utf8');
      fixUseEffectDependencies(content);
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  }
  
  console.log(`\nAnalysis complete. Please review the suggested dependencies and add them manually where appropriate.`);
}

processFiles(); 