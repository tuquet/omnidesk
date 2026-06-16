import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

const BUILD_DIR = path.join(process.cwd(), 'dist');
const MANIFEST_PATH = path.join(process.cwd(), 'manifest.json');
const ZIP_NAME = 'app-bundle.zip';

async function pack() {
  if (!fs.existsSync(BUILD_DIR)) {
    console.error('Build directory not found. Run vite build first.');
    process.exit(1);
  }

  const output = fs.createWriteStream(path.join(process.cwd(), ZIP_NAME));
  const archive = archiver('zip', {
    zlib: { level: 9 }
  });

  output.on('close', function() {
    console.log(`App packed successfully: ${archive.pointer()} total bytes`);
    console.log(`Output: ${ZIP_NAME}`);
  });

  archive.on('error', function(err) {
    throw err;
  });

  archive.pipe(output);

  // Add all files from dist directory
  archive.directory(BUILD_DIR, 'dist');
  
  // Add manifest
  archive.file(MANIFEST_PATH, { name: 'manifest.json' });

  await archive.finalize();
}

pack();
