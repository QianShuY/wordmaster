import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const project = path.resolve(root, '..');
const dist = path.join(root, 'dist');
const androidAssets = path.join(root, 'android', 'app', 'src', 'main', 'assets');
const androidTestAssets = path.join(root, 'android', 'app', 'src', 'androidTest', 'assets');
execFileSync(process.execPath, [path.join(root, 'scripts', 'generate-seed.mjs')], { cwd: root, stdio: 'inherit' });

// G1 initially copied card images into a second Android asset directory. G2
// serves the same files from the WebView bundle, so remove only byte-identical
// generated duplicates after checking every direct child. Never recurse here.
const legacyCardAssets = path.resolve(androidAssets, 'cards');
if (path.relative(path.resolve(androidAssets), legacyCardAssets) !== 'cards') {
  throw new Error(`Refusing to inspect an unexpected card asset path: ${legacyCardAssets}`);
}
if (existsSync(legacyCardAssets)) {
  const entries = readdirSync(legacyCardAssets, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== '.webp') {
      throw new Error(`Unexpected file in legacy Android card assets: ${entry.name}`);
    }
    const duplicate = path.resolve(legacyCardAssets, entry.name);
    if (path.dirname(duplicate) !== legacyCardAssets) throw new Error(`Refusing to remove an unexpected path: ${duplicate}`);
    const source = path.join(project, 'static', 'cards', 'original', entry.name);
    if (!existsSync(source) || createHash('sha256').update(readFileSync(source)).digest('hex')
      !== createHash('sha256').update(readFileSync(duplicate)).digest('hex')) {
      throw new Error(`Legacy card asset differs from the WebView source; left untouched: ${duplicate}`);
    }
    unlinkSync(duplicate);
  }
  rmdirSync(legacyCardAssets);
}

const distRelative = path.relative(root, dist);
if (!distRelative || distRelative.startsWith('..') || path.isAbsolute(distRelative)) {
  throw new Error(`Refusing to clean output outside the Android project: ${dist}`);
}
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
mkdirSync(androidTestAssets, { recursive: true });
cpSync(path.join(project, 'static'), dist, { recursive: true, force: true });
mkdirSync(path.join(dist, 'shared'), { recursive: true });
copyFileSync(path.join(project, 'shared', 'domain.js'), path.join(dist, 'shared', 'domain.js'));
copyFileSync(path.join(root, 'src', 'native-api.js'), path.join(dist, 'native-api.js'));
copyFileSync(
  path.join(root, 'node_modules', '@capacitor', 'core', 'dist', 'capacitor.js'),
  path.join(dist, 'capacitor.js'),
);
const indexPath = path.join(dist, 'index.html');
let indexHtml = readFileSync(indexPath, 'utf8');
indexHtml = indexHtml
  .replace('<head>', `<head>\n<meta http-equiv="Content-Security-Policy" content="default-src 'self' data: blob:; connect-src 'none'; img-src 'self' data: blob:; media-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'; form-action 'none">`)
  .replace('<script src="/shared/domain.js"></script>', '<script src="./capacitor.js"></script>\n<script src="./shared/domain.js"></script>\n<script src="./native-api.js"></script>');
if (!indexHtml.includes('./native-api.js') || !indexHtml.includes('src="app.js"')) {
  throw new Error('Android could not insert the local bridge into the app entry page');
}
writeFileSync(indexPath, indexHtml, 'utf8');
copyFileSync(path.join(root, 'seed', 'schema-v1.sql'), path.join(androidAssets, 'seed-schema-v1.sql'));
copyFileSync(path.join(project, 'test', 'fixtures', 'android-g1-rules.json'), path.join(androidTestAssets, 'android-g1-rules.json'));
console.log(`Android local web assets prepared at ${dist}`);
