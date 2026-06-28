const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting build-vercel script...');
process.env.OPEN_NEXT_DEBUG = '1';

try {
  // 1. Run opennextjs-cloudflare build
  console.log('Running opennextjs-cloudflare build...');
  execSync('npx opennextjs-cloudflare build --dangerouslyUseUnsupportedNextVersion', { stdio: 'inherit' });

  const openNextDir = path.join(__dirname, '../.open-next');
  const vercelOutputDir = path.join(__dirname, '../.vercel/output');

  // 2. Re-create .vercel/output directory
  if (fs.existsSync(vercelOutputDir)) {
    console.log('Cleaning existing .vercel/output directory...');
    fs.rmSync(vercelOutputDir, { recursive: true, force: true });
  }
  fs.mkdirSync(vercelOutputDir, { recursive: true });

  // Helper function to copy recursive (resolves symlinks using statSync)
  function copyDirSync(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src);
    for (const name of entries) {
      const srcPath = path.join(src, name);
      const destPath = path.join(dest, name);
      try {
        const stat = fs.statSync(srcPath);
        if (stat.isDirectory()) {
          copyDirSync(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      } catch (err) {
        console.warn(`[Warning] Skip copying symlink/file: ${srcPath} (${err.message})`);
      }
    }
  }

  // 3. Convert worker.js dynamic import to static import and bundle using esbuild
  console.log('Preparing worker entrypoint for bundling...');
  const originalWorkerPath = path.join(openNextDir, 'worker.js');
  const tempEntryPath = path.join(openNextDir, 'worker-bundle-entry.js');
  
  let workerContent = fs.readFileSync(originalWorkerPath, 'utf8');
  
  // Prepend static import of the server handler
  workerContent = `import { handler } from "./server-functions/default/handler.mjs";\n` + workerContent;
  
  // Remove the dynamic import line
  workerContent = workerContent.replace(
    /const\s*\{\s*handler\s*\}\s*=\s*await\s*import\(\s*(['"])\.\/server-functions\/default\/handler\.mjs\1\s*\);?/g,
    '/* handler imported statically at the top */'
  );
  
  fs.writeFileSync(tempEntryPath, workerContent);
  
  console.log('Bundling worker with esbuild...');
  execSync(
    'npx esbuild .open-next/worker-bundle-entry.js --bundle --outfile=.vercel/output/_worker.js --format=esm --platform=node --target=esnext "--external:cloudflare:*"',
    { stdio: 'inherit' }
  );
  
  // Clean up temporary entry file
  if (fs.existsSync(tempEntryPath)) {
    fs.unlinkSync(tempEntryPath);
  }

  console.log('Post-processing bundled worker to fix require calls...');
  const bundledWorkerPath = path.join(vercelOutputDir, '_worker.js');
  let bundledWorkerContent = fs.readFileSync(bundledWorkerPath, 'utf8');
  bundledWorkerContent = bundledWorkerContent
    .replace(/__require\d?\(/g, 'require(')
    .replace(/__require\d?\./g, 'require.');
  fs.writeFileSync(bundledWorkerPath, bundledWorkerContent);

  // 4. Copy static assets from assets/ to the root of .vercel/output
  const assetsDir = path.join(openNextDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    console.log('Copying static assets to .vercel/output root...');
    const entries = fs.readdirSync(assetsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'uploads') {
        console.log('Skipping uploads directory copy...');
        continue;
      }
      const srcPath = path.join(assetsDir, entry.name);
      const destPath = path.join(vercelOutputDir, entry.name);
      if (entry.isDirectory()) {
        copyDirSync(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  // 5. Generate _routes.json for Cloudflare Pages routing
  console.log('Generating _routes.json...');
  const routesJsonPath = path.join(vercelOutputDir, '_routes.json');
  const excludes = ['/_next/static/*'];
  if (fs.existsSync(vercelOutputDir)) {
    const rootFiles = fs.readdirSync(vercelOutputDir);
    for (const file of rootFiles) {
      if (
        file !== '_worker.js' &&
        file !== '_routes.json' &&
        file !== '_next' &&
        file !== 'BUILD_ID' &&
        file !== '_headers'
      ) {
        const filePath = path.join(vercelOutputDir, file);
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
          excludes.push(`/${file}`);
        } else if (stat.isDirectory()) {
          excludes.push(`/${file}/*`);
        }
      }
    }
  }

  const routesJson = {
    version: 1,
    include: ['/*'],
    exclude: excludes
  };
  fs.writeFileSync(routesJsonPath, JSON.stringify(routesJson, null, 2));
  console.log('Generated _routes.json successfully with excludes:', excludes);

  console.log('Build pages completed successfully! Output is in the ".vercel/output" directory.');
} catch (error) {
  console.error('Error during build-vercel execution:', error);
  process.exit(1);
}
