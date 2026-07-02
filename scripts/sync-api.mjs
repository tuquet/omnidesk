import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT_DIR = path.resolve(__dirname, '..');
const TYPES_DIR = path.join(ROOT_DIR, 'packages', 'types');

const TARGETS = [
  {
    app: 'omni-engine',
    cmd: 'cargo run --bin openapi_export',
    dir: 'apps/omni-engine/src-tauri',
    output: 'openapi-engine.json'
  },
  {
    app: 'omni-studio',
    cmd: 'cargo run --bin openapi_export',
    dir: 'apps/omni-studio/src-tauri',
    output: 'openapi-studio.json'
  },
  {
    app: 'omni-profile',
    cmd: 'cargo run --bin openapi_export',
    dir: 'apps/omni-profile/src-tauri',
    output: 'openapi-profile.json'
  }
];

function runCommand(cmd, cwd) {
  console.log(`\n\x1b[36m➤ Running: ${cmd} in ${cwd}\x1b[0m`);
  try {
    execSync(cmd, { cwd: path.join(ROOT_DIR, cwd), stdio: 'inherit' });
  } catch (err) {
    console.error(`\x1b[31m✖ Failed to run ${cmd}\x1b[0m`);
    // Note: Ignoring error 0xc0000139 locally in some headless environments, but generally we throw
    if (err.status !== 3221225785) {
      throw err;
    } else {
      console.warn(`\x1b[33m⚠ Ignored STATUS_ENTRYPOINT_NOT_FOUND (Windows headless env issue)\x1b[0m`);
    }
  }
}

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], deepMerge(target[key], source[key]));
    }
  }
  Object.assign(target || {}, source);
  return target;
}

async function main() {
  console.log('\x1b[1m\x1b[32m🚀 Starting Unified OpenAPI Sync...\x1b[0m');

  // 1. Export JSON from all apps
  for (const target of TARGETS) {
    runCommand(target.cmd, target.dir);
  }

  // 2. Merge JSON files
  console.log('\n\x1b[36m➤ Merging OpenAPI Schemas...\x1b[0m');
  const mergedSchema = {
    openapi: '3.1.0',
    info: {
      title: 'OmniDesk Unified API',
      version: '0.1.0'
    },
    paths: {},
    components: {
      schemas: {}
    },
    tags: []
  };

  const tagSet = new Set();

  for (const target of TARGETS) {
    const filePath = path.join(TYPES_DIR, target.output);
    if (!fs.existsSync(filePath)) {
      console.warn(`\x1b[33m⚠ Warning: Expected output file ${filePath} not found. Skipping merge for ${target.app}.\x1b[0m`);
      continue;
    }

    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    // Merge paths
    if (content.paths) {
      Object.assign(mergedSchema.paths, content.paths);
    }

    // Merge components schemas
    if (content.components && content.components.schemas) {
      Object.assign(mergedSchema.components.schemas, content.components.schemas);
    }

    // Deduplicate tags
    if (Array.isArray(content.tags)) {
      for (const tag of content.tags) {
        if (!tagSet.has(tag.name)) {
          tagSet.add(tag.name);
          mergedSchema.tags.push(tag);
        }
      }
    }
  }

  // 3. Write merged JSON
  const mergedPath = path.join(TYPES_DIR, 'openapi.json');
  fs.writeFileSync(mergedPath, JSON.stringify(mergedSchema, null, 2));
  console.log(`\x1b[32m✔ Merged schema written to ${mergedPath}\x1b[0m`);

  // 4. Generate TS Client
  console.log('\n\x1b[36m➤ Generating TypeScript Client...\x1b[0m');
  runCommand('pnpm --filter @omnidesk/types generate:client', '');

  // 5. Cleanup temp files
  console.log('\n\x1b[36m➤ Cleaning up temporary files...\x1b[0m');
  for (const target of TARGETS) {
    const filePath = path.join(TYPES_DIR, target.output);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  console.log('\x1b[1m\x1b[32m✨ Sync complete! The unified frontend client is ready.\x1b[0m');
}

main().catch((err) => {
  console.error('\x1b[31m✖ Sync failed:\x1b[0m', err);
  process.exit(1);
});
