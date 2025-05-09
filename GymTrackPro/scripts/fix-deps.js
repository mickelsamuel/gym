// Script to help fix common React hook dependency issues
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Get the current file directory path
const currentDir = process.cwd();
// Find all .tsx files in the src directory
const srcPath = path.join(currentDir, 'src');
const files = glob.sync(`${srcPath}/**/*.tsx`);

// Regular expressions to find useEffect and useCallback hooks
const useEffectRegex = /useEffect\(\s*\(\)\s*=>\s*\{[\s\S]*?\},\s*\[(.*?)\]\s*\)/g;
const useCallbackRegex = /useCallback\(\s*\(\w*\)\s*=>\s*\{[\s\S]*?\},\s*\[(.*?)\]\s*\)/g;

// Count how many hooks need fixing
let hooksToFix = 0;

// Scan each file
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let matches = content.match(useEffectRegex) || [];
  matches = matches.concat(content.match(useCallbackRegex) || []);
  
  if (matches.length > 0) {
    console.log(`\n${path.relative(process.cwd(), file)}:`);
    matches.forEach(match => {
      // Extract hook body to find variables
      const bodyStart = match.indexOf('{') + 1;
      const bodyEnd = match.lastIndexOf('}');
      const hookBody = match.substring(bodyStart, bodyEnd);
      
      // Extract dependency array
      const depsStart = match.lastIndexOf('[');
      const depsEnd = match.lastIndexOf(']');
      const depsArray = match.substring(depsStart + 1, depsEnd).trim();
      
      // Simple regex to find variables (this is not perfect)
      const varRegex = /\b([a-zA-Z][a-zA-Z0-9_]*)\b/g;
      const variables = new Set();
      let varMatch;
      
      while ((varMatch = varRegex.exec(hookBody)) !== null) {
        const varName = varMatch[1];
        // Skip common keywords and built-in functions
        if (!['if', 'else', 'try', 'catch', 'for', 'while', 'switch', 'case',
             'return', 'const', 'let', 'var', 'function', 'async', 'await',
             'console', 'window', 'document', 'null', 'undefined', 'true', 'false',
             'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
             'Promise', 'new', 'this', 'super', 'class', 'import', 'export',
             'from', 'as', 'of', 'in'].includes(varName)) {
          variables.add(varName);
        }
      }
      
      // Check which variables might be missing from deps
      const depsSet = new Set(depsArray.split(',').map(dep => dep.trim()).filter(Boolean));
      const missingDeps = [...variables].filter(v => !depsSet.has(v));
      
      if (missingDeps.length > 0) {
        hooksToFix++;
        console.log(`  Missing dependencies: ${missingDeps.join(', ')}`);
        console.log(`  Current: [${depsArray}]`);
        console.log(`  Suggested: [${[...depsSet, ...missingDeps].join(', ')}]`);
      }
    });
  }
});

console.log(`\nFound ${hooksToFix} hooks that may need fixing.`);
console.log('Note: This is a simple analysis and may include false positives.');
console.log('Review each suggestion carefully before making changes.'); 