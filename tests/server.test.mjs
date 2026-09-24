import test from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../scripts/serve.mjs';
test('static preview serves the module client and blocks API writes',async()=>{
  const server=await startServer(0),origin=`http://127.0.0.1:${server.address().port}`;
  try {
    const page=await fetch(origin);assert.equal(page.status,200);assert.match(await page.text(),/connect-src 'none'/);
    const module=await fetch(origin+'/src/app.js');assert.equal(module.status,200);assert.match(module.headers.get('content-type'),/javascript/);
    assert.equal((await fetch(origin+'/v1/trips',{method:'POST',body:'{}'})).status,405);
  } finally { await new Promise(resolve=>server.close(resolve)); }
});
test('static preview does not serve hidden files or unsupported paths',async()=>{
  const server=await startServer(0),origin=`http://127.0.0.1:${server.address().port}`;
  try { for (const path of ['/.env','/.gitignore','/../../etc/passwd','/missing.js','/%2e%2e%2f.env']) assert.equal((await fetch(origin+path)).status,404); }
  finally { await new Promise(resolve=>server.close(resolve)); }
});
