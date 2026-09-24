// Development-only static file server. This is not an application backend.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'};
export function startServer(port=Number(process.env.PORT||4173)) {
  const server=createServer(async(req,res)=>{
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    try {
      const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      const path=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
      if (!path.startsWith(root+sep) || pathname.split('/').some(x=>x.startsWith('.')) || !types[extname(path)]) { res.writeHead(404); res.end(); return; }
      const body=await readFile(path);
      res.writeHead(200,{'Content-Type':types[extname(path)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});
      res.end(req.method==='HEAD'?undefined:body);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise(resolve=>server.listen(port,'127.0.0.1',()=>resolve(server)));
}
if (process.argv[1]===fileURLToPath(import.meta.url)) {
  const server=await startServer();
  console.log(`Yamone Trip local client: http://127.0.0.1:${server.address().port}`);
}
