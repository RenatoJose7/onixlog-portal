// Servidor local sem dependências externas: npm run dev
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import project from './api/project.js';
import login from './api/login.js';
import logout from './api/logout.js';
import session from './api/session.js';
import save from './api/save.js';
const routes={'/api/project':project,'/api/login':login,'/api/logout':logout,'/api/session':session,'/api/save':save};
const root=resolve(fileURLToPath(new URL('./public/',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.ico':'image/x-icon'};
const server=createServer(async(req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('X-Frame-Options','DENY');
  if(routes[pathname]) return routes[pathname](req,res);
  if(req.method!=='GET' && req.method!=='HEAD'){res.writeHead(405);res.end('Método não permitido');return;}
  const dest=pathname==='/'?'index.html':pathname==='/admin'?'admin.html':pathname.slice(1);
  const full=resolve(root,dest);
  if(full!==root&&!full.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  try {const content=await readFile(full);res.setHeader('Content-Type',types[extname(full)]||'application/octet-stream');res.end(content);}
  catch{res.writeHead(404);res.end('Página não encontrada');}
});
// Development-only .env.local loader, intentionally does not override external env variables.
// Production gets secrets from Vercel env config.
try{
 const file=await readFile(resolve(process.cwd(),'.env.local'),'utf8');
 for(const line of file.split('\n')){
  const trimmed=line.trim();if (!trimmed||trimmed.startsWith('#'))continue;
  const at=trimmed.indexOf('=');if(at<1)continue;
  const key=trimmed.slice(0,at).trim(),value=trimmed.slice(at+1).trim();
  if(!process.env[key])process.env[key]=value.replace(/^(['"])(.*)\1$/,'$2');
 }
}catch{}
const port=Number(process.env.PORT||3000);
server.listen(port,()=>console.log(`ONIXLOG Portal: http://localhost:${port}`));
