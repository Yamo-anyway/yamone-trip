import { readdir, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { dictionaries } from '../src/i18n.js';
import { catalog } from '../src/catalog.js';
import { validateUnit } from '../src/domain.js';
const files=[];
for (const folder of ['src','scripts','tests']) for (const name of await readdir(folder)) {
  if (/\.(js|mjs)$/.test(name)) { const path=`${folder}/${name}`; execFileSync(process.execPath,['--check',path]); files.push(path); }
}
assert.deepEqual(Object.keys(dictionaries.ko).sort(),Object.keys(dictionaries.en).sort());
catalog.forEach(validateUnit);
const app=await readFile('src/app.js','utf8');
const sources=await Promise.all(files.filter(p=>p.startsWith('src/')).map(p=>readFile(p,'utf8')));
assert(!sources.some(s=>/navigator\s*\.\s*geolocation|getCurrentPosition|watchPosition|<script[^>]+https?:/i.test(s)),'Device location or remote script found');
assert(!/from\s*['"]\.\/(?:api|remote-repository)\.js/.test(app),'Future API must not be connected to web UI yet');
const html=await readFile('index.html','utf8');
assert(html.includes("connect-src 'none'"));
for (const path of ['README.md','AGENTS.md','docs/PRODUCT.md','docs/PROGRESS.md','docs/API_CONTRACT.md','docs/CLIENT_HANDOFF.md','docs/release-gates.json','CHANGELOG.md']) assert((await readFile(path,'utf8')).trim());
console.log(`PASS: ${files.length} JavaScript files parse; locale keys match; ${catalog.length} fixtures valid; offline/privacy and handoff checks pass.`);
