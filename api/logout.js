import { cookieForLogout } from '../lib/auth.js';
import { send,method,sameOrigin } from '../lib/http.js';
export default function handler(req,res) {
  if (!method(req,res,'POST')) return;
  if (!sameOrigin(req)) {send(res,403,{error:'Origem não autorizada.'});return;}
  send(res,200,{ok:true},{'Set-Cookie':cookieForLogout()});
}
