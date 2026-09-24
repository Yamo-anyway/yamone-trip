import { readFile, readdir } from 'node:fs/promises';
import { parse } from '@babel/parser';
import assert from 'node:assert/strict';
import { nativeCopy } from '../native/copy.js';

const config = JSON.parse(await readFile('app.json', 'utf8')).expo;
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
assert.equal(config.version, pkg.version);
assert.equal(config.android.versionCode, 10);
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
  assert(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|WebView|expo-location|expo-image-picker|navigator\.|localStorage|crypto\s*\.\s*randomUUID|(?:api|remote-repository)\.js|expo-updates/.test(source), `Unexpected native boundary: ${file}`);
}
const appSource = await readFile('native/App.js', 'utf8');
assert(appSource.includes(`const appVersion = '${pkg.version}'`));
assert(!appSource.includes('allowFontScaling={false}'));
for (const marker of ['role="checkbox"', 'role="radio"', 'role="tab"', 'accessibilityRole="tablist"', 'minHeight:48', "flexBasis:'40%'", 'resolveBackAction']) {
  assert(appSource.includes(marker), `Missing native accessibility guard: ${marker}`);
}
assert(pkg.dependencies['expo-file-system']);
console.log('PASS: native JSX parses; ko/en keys and v0.10.0 config agree; accessibility semantics/font scaling/touch-size/small-screen/back guards and Android privacy/source boundaries pass. Future API modules remain disconnected. Not an APK, TalkBack, visual or device test.');
