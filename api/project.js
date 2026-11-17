import { readProject, calculateProgress } from '../lib/project.js';
import { send,method } from '../lib/http.js';
export default async function handler(req,res) {
  if (!method(req,res,'GET')) return;
  try {
    const project=await readProject();
    send(res,200,{project:{...project,progress:calculateProgress(project.stages)}});
  } catch(e) {send(res,503,{error:e.message});}
}
