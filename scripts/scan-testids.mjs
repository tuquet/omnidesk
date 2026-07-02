import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const reportPath = path.join(rootDir, 'testid-report.md');
const testIdRegex = /data-testid=["'{`]?([^"'{`>]+)["'{`]?/g;

const testIdsMap = new Map();

// Generic ignore list for Node.js / React projects
const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', 'out', 'coverage', '.cache', 'public'
]);

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!IGNORE_DIRS.has(file)) {
        scanDirectory(fullPath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      let match;
      
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        while ((match = testIdRegex.exec(line)) !== null) {
          let testId = match[1];
          // Simple cleanup for dynamic testids (e.g. {`btn-${id}`})
          if (testId.includes('}')) testId = testId.split('}')[0];
          
          if (!testIdsMap.has(testId)) {
            testIdsMap.set(testId, []);
          }
          const relativePath = path.relative(rootDir, fullPath);
          testIdsMap.get(testId).push(`${relativePath}:${i + 1}`);
        }
      }
    }
  }
}

scanDirectory(rootDir);

let reportContent = `# Data TestID Uniqueness Report\n\n`;
let hasDuplicates = false;

const duplicates = [];
const uniques = [];

for (const [testId, locations] of testIdsMap.entries()) {
  if (locations.length > 1) {
    duplicates.push({ testId, locations });
    hasDuplicates = true;
  } else {
    uniques.push({ testId, locations });
  }
}

if (hasDuplicates) {
  reportContent += `## ⚠️ Duplicate data-testids found\n\n`;
  duplicates.forEach(({ testId, locations }) => {
    reportContent += `### \`${testId}\`\n`;
    locations.forEach(loc => {
      reportContent += `- ${loc}\n`;
    });
    reportContent += `\n`;
  });
} else {
  reportContent += `## ✅ All data-testids are unique!\n\n`;
}

reportContent += `## 📄 All Extracted TestIDs\n\n`;
reportContent += `| Test ID | Location |\n`;
reportContent += `|---|---|\n`;

[...duplicates, ...uniques].sort((a, b) => a.testId.localeCompare(b.testId)).forEach(({ testId, locations }) => {
  reportContent += `| \`${testId}\` | ${locations.join('<br>')} |\n`;
});

fs.writeFileSync(reportPath, reportContent);
console.log(`Scan complete! Report generated at: ${reportPath}`);
