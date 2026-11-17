import { authenticated, credentialsReady } from '../lib/auth.js';
import { send,method } from '../lib/http.js';
export default function handler(req,res) {
  if (!method(req,res,'GET')) return;
  send(res,200,{authenticated:authenticated(req),configured:credentialsReady()});
}
