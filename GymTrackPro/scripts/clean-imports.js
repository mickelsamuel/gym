// Remove unused imports script
const _fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to process a specific file
function processFile(filePath) {
  try {
    console.log(`Processing ${filePath}`);
    execSync(`eslint --fix ${filePath}`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    console.error(`Error processing ${filePath}`, error.message);
    return false;
  }
}

// Find all TypeScript and React files in the src directory
function findAllTsFiles() {
  const srcDir = path.join(process.cwd(), 'src');
  const result = execSync(`find ${srcDir} -type f -name "*.ts" -o -name "*.tsx" | grep -v "test.ts" | grep -v ".d.ts"`, { encoding: 'utf8' });
  return result.trim().split('\n');
}

// Main function
async function main() {
  const files = findAllTsFiles();
  console.log(`Found ${files.length} files to process`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const file of files) {
    const success = processFile(file);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  console.log('\nSummary:');
  console.log(`Successfully processed: ${successCount} files`);
  console.log(`Failed to process: ${failCount} files`);
}

// Run the main function
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
