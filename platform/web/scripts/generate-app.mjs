import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WEB_ROOT = path.join(__dirname, '..');
const MONOREPO_ROOT = path.join(WEB_ROOT, '../..');
const APPS_DIR = path.join(MONOREPO_ROOT, 'apps');
const TEMPLATE_DIR = path.join(APPS_DIR, '_template-app');
const REGISTRY_FILE = path.join(APPS_DIR, 'launcher/src/config/registry.ts');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

function toCamelCase(str) {
  return str.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));
}

function toPascalCase(str) {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    let destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function processFile(filePath, replacements) {
  const content = await fs.readFile(filePath, 'utf8');
  let newContent = content;
  for (const [key, value] of Object.entries(replacements)) {
    newContent = newContent.replace(new RegExp(key, 'g'), value);
  }
  await fs.writeFile(filePath, newContent, 'utf8');
}

async function processDirectory(dirPath, replacements) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  for (let entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await processDirectory(fullPath, replacements);
    } else {
      if (entry.name.includes('__APP_ID__')) {
        const newName = entry.name.replace('__APP_ID__', replacements.__APP_ID__);
        const newPath = path.join(dirPath, newName);
        await fs.rename(fullPath, newPath);
        await processFile(newPath, replacements);
      } else {
        await processFile(fullPath, replacements);
      }
    }
  }
}

async function updateRegistry(appId, appName, appCategory) {
  let content = await fs.readFile(REGISTRY_FILE, 'utf8');
  
  const camelId = toCamelCase(appId);
  const importStatement = `import { appInfo as ${camelId}Info } from '@omnidesk/app-${appId}';\n`;
  
  // Insert import at the end of imports (just before export const APP_REGISTRY)
  const registryDeclarationIndex = content.indexOf('export const APP_REGISTRY');
  content = content.slice(0, registryDeclarationIndex) + importStatement + '\n' + content.slice(registryDeclarationIndex);
  
  // Insert into APP_REGISTRY
  const newEntry = `  '${appId}': ${camelId}Info,\n`;
  const endOfRegistryIndex = content.lastIndexOf('};');
  content = content.slice(0, endOfRegistryIndex) + newEntry + content.slice(endOfRegistryIndex);
  
  await fs.writeFile(REGISTRY_FILE, content, 'utf8');
}

async function updateRoute(appId, appName) {
  const ROUTES_DIR = path.join(WEB_ROOT, 'src/routes');
  const routeContent = `import { createFileRoute } from '@tanstack/react-router';
import { ${toPascalCase(appName)}App } from '@omnidesk/app-${appId}';

export const Route = createFileRoute('/${appId}')({
  component: ${toPascalCase(appName)}App,
});
`;
  await fs.writeFile(path.join(ROUTES_DIR, `${appId}.tsx`), routeContent, 'utf8');
}

async function updateWebPackage(appId) {
  const packageFile = path.join(WEB_ROOT, 'package.json');
  let content = await fs.readFile(packageFile, 'utf8');
  let pkg = JSON.parse(content);
  
  pkg.dependencies[`@omnidesk/app-${appId}`] = "workspace:*";
  
  // Sort dependencies for neatness
  const deps = Object.keys(pkg.dependencies).sort().reduce((acc, key) => {
    acc[key] = pkg.dependencies[key];
    return acc;
  }, {});
  pkg.dependencies = deps;
  
  await fs.writeFile(packageFile, JSON.stringify(pkg, null, 2), 'utf8');
}

async function main() {
  console.log('Omnidesk App Generator');
  console.log('----------------------');

  const appName = await question('App Name (e.g., Trello Clone): ');
  const appId = await question('App ID (e.g., trello-clone): ');
  const appCategory = await question('Category (Productivity/Analytics/Development/Utilities): ');

  if (!appName || !appId || !appCategory) {
    console.error('All fields are required.');
    rl.close();
    return;
  }

  const appNamePascal = toPascalCase(appName);
  const appNameCamel = toCamelCase(appName);
  const appIdUpper = appId.toUpperCase().replace(/-/g, '_');

  const replacements = {
    '__APP_ID__': appId,
    '__APP_NAME__': appName,
    '__APP_NAME_PASCAL__': appNamePascal,
    '__APP_NAME_CAMEL__': appNameCamel,
    '__APP_ID_UPPER__': appIdUpper,
    '__APP_CATEGORY__': appCategory,
  };

  const targetDir = path.join(APPS_DIR, appId);

  try {
    await fs.access(targetDir);
    console.error(`Error: App directory ${appId} already exists.`);
    rl.close();
    return;
  } catch (e) {
    // Directory does not exist, safe to proceed
  }

  try {
    console.log(`\n1. Creating structure at apps/${appId}...`);
    await copyDir(TEMPLATE_DIR, targetDir);

    console.log('2. Applying templates...');
    await processDirectory(targetDir, replacements);

    console.log('3. Updating App Registry...');
    await updateRegistry(appId, appName, appCategory);

    console.log('4. Creating route...');
    await updateRoute(appId, appName);
    
    console.log('5. Updating platform/web dependencies...');
    await updateWebPackage(appId);

    console.log('\nSuccess! Your app has been generated.');
    console.log(`- Directory: apps/${appId}`);
    console.log(`- Route: platform/web/src/routes/${appId}.tsx`);
    console.log(`\nPlease run 'pnpm install' to link the new app, then restart the dev server.`);
  } catch (err) {
    console.error('Failed to generate app:', err);
  }

  rl.close();
}

main();
