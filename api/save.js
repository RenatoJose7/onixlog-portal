import { authenticated } from '../lib/auth.js';
import { send,method,body,sameOrigin } from '../lib/http.js';
import { saveProject,calculateProgress } from '../lib/project.js';
export default async function handler(req,res){
  if (!method(req,res,'POST')) return;
  if (!sameOrigin(req)) {send(res,403,{error:'Origem não autorizada.'});return;}
  if (!authenticated(req)) {send(res,401,{error:'Sessão expirada. Entre novamente.'});return;}
  try{
    const input=await body(req);
    const project=await saveProject(input.project,input.note);
    send(res,200,{project:{...project,progress:calculateProgress(project.stages)}});
  }catch(e){send(res,/configurad|banco de dados/i.test(e.message)?503:400,{error:e.message});}
}
