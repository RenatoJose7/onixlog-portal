export function send(res,status,data,extraHeaders={}) {
  res.statusCode=status;
  for (const [key,val] of Object.entries({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, no-cache, must-revalidate','X-Content-Type-Options':'nosniff',...extraHeaders})) res.setHeader(key,val);
  res.end(JSON.stringify(data));
}
export async function body(req) {
  if (req.body !== undefined) {
    if (typeof req.body === 'object' && req.body !== null) return req.body;
    if (typeof req.body === 'string') return JSON.parse(req.body);
  }
  let raw='';
  for await (const chunk of req) { raw+=chunk; if (raw.length>30_000) throw Error('Requisição muito grande.'); }
  return JSON.parse(raw || '{}');
}
export function sameOrigin(req) {
  const origin=req.headers.origin;
  if (!origin) return true;
  try { return new URL(origin).host===req.headers.host; } catch { return false; }
}
export function method(req,res,expected) {
  if(req.method!==expected) {send(res,405,{error:'Método não permitido.'},{Allow:expected}); return false;} return true;
}
