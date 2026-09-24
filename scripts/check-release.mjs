import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pkg=JSON.parse(await readFile('package.json','utf8'));
const config=JSON.parse(await readFile('app.json','utf8')).expo;
const gates=JSON.parse(await readFile('docs/release-gates.json','utf8'));
const handoff=await readFile('docs/CLIENT_HANDOFF.md','utf8');

assert.equal(gates.schemaVersion,1);
assert.equal(gates.appVersion,pkg.version);
assert.equal(config.version,pkg.version);
assert.equal(gates.status,'client_handoff_complete_release_blocked');
assert.equal(new Set(gates.completed).size,gates.completed.length);
assert.equal(new Set(gates.pending.map(gate=>gate.id)).size,gates.pending.length);
assert(gates.pending.every(gate=>gate.state==='blocked'));

for (const id of [
  'native-discovery-settings','private-trip-schedule-records','validated-local-backup',
  'immutable-local-authoring','attributed-derivatives','original-preserving-translations',
  'disconnected-api-boundary','accessibility-source-guards','data-loss-regressions',
]) assert(gates.completed.includes(id),`Missing completed client gate: ${id}`);

for (const id of [
  'android-toolchain-apk','device-interaction-smoke','backend-integration',
  'release-identity-signing-distribution','product-policy-legal','sdk-data-flow-review',
  'photo-metadata-pipeline',
]) assert(gates.pending.some(gate=>gate.id===id),`Missing blocked release gate: ${id}`);

for (const id of ['live-api','photo-upload','device-location','analytics-or-ad-sdk','store-submission']) {
  assert(gates.forbiddenUntilApproved.includes(id),`Missing prohibited release action: ${id}`);
}

for (const marker of [
  'npm ci','npm test','npm run check','npm run bundle:android',
  'npx expo prebuild --platform android --no-install','./gradlew assembleDebug','adb install -r',
  'TalkBack','200%','병합 manifest','트래픽','서버 연결 결정','출시 결정',
]) assert(handoff.includes(marker),`Missing handoff instruction: ${marker}`);

assert(handoff.includes('출시 가능을 의미하지 않습니다'));
console.log(`PASS: v${pkg.version} client handoff manifest is complete; ${gates.pending.length} external/device/release gates remain explicitly blocked. This is not release approval.`);
