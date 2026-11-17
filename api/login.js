import { passwordValid,credentialsReady,cookieForLogin } from '../lib/auth.js';
import { send,method,body,sameOrigin } from '../lib/http.js';
const failures=new Map();
export default async function handler(req,res) {
  if (!method(req,res,'POST')) return;
  if (!sameOrigin(req)) {send(res,403,{error:'Origem não autorizada.'});return;}
  if (!credentialsReady()){send(res,503,{error:'A senha administrativa ainda não foi configurada no servidor.'});return;}
  const ip=(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
  const now=Date.now();
  const entry=failures.get(ip)??{attempts:0,since:now};
  if (now-entry.since>15*60*1000){entry.attempts=0;entry.since=now;}
  if(entry.attempts>=8){send(res,429,{error:'Muitas tentativas. Tente novamente em alguns minutos.'});return;}
  try{
    const input=await body(req);
    if (!passwordValid(input.password)){
      entry.attempts++; failures.set(ip,entry);
      await new Promise(resolve=>setTimeout(resolve,350));
      send(res,401,{error:'Senha incorreta.'});return;
    }
    failures.delete(ip);
    send(res,200,{ok:true},{'Set-Cookie':cookieForLogin()});
  }catch{send(res,400,{error:'Não foi possível validar a solicitação.'});}
}
