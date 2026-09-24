import { readFile, readdir } from 'node:fs/promises';
import { parse } from '@babel/parser';
import assert from 'node:assert/strict';
import { nativeCopy } from '../native/copy.js';

const config = JSON.parse(await readFile('app.json', 'utf8')).expo;
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
assert.equal(config.version, pkg.version);
assert.equal(config.android.versionCode, 8);
assert.deepEqual(config.platforms, ['android']);
assert.equal(config.android.allowBackup, false);
assert.equal(config.updates.enabled, false);
assert.deepEqual(config.android.permissions, []);
for (const permission of ['ACCESS_FINE_LOCATION','ACCESS_COARSE_LOCATION','ACCESS_BACKGROUND_LOCATION','CAMERA','RECORD_AUDIO']) {
  assert(config.android.blockedPermissions.includes(`android.permission.${permission}`));
}
assert.deepEqual(Object.keys(nativeCopy.ko).sort(), Object.keys(nativeCopy.en).sort());
for (const file of await readdir('native')) {
  if (!file.endsWith('.js')) continue;
  const source = await readFile(`native/${file}`, 'utf8');
  parse(source, {sourceType:'module', plugins:['jsx']});
  assert(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|WebView|expo-location|expo-image-picker|navigator\.|localStorage|crypto\s*\.\s*randomUUID|\.\/api\.js|expo-updates/.test(source), `Unexpected native boundary: ${file}`);
}
const appSource = await readFile('native/App.js', 'utf8');
assert(appSource.includes(`const appVersion = '${pkg.version}'`));
assert(pkg.dependencies['expo-file-system']);
console.log('PASS: native JSX parses; ko/en keys and v0.8.0 config agree; Android-only permissions/backup/update, explicit file-picker backup and source-boundary guards pass. Not an APK or device test.');
