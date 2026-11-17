import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export const STAGE_IDS = [
  'levantamento', 'diagnostico', 'escopo', 'desenvolvimento', 'homologacao', 'entrega'
];
export const STAGE_TITLES = [
  'Levantamento de requisitos', 'Diagnóstico técnico', 'Escopo e contrato',
  'Desenvolvimento e estruturação', 'Testes e homologação', 'Implantação e entrega'
];
export const STATUS_VALUES = ['pending','active','done'];

export const initialProject = {
  name: 'Implantação do sistema ONIXLOG',
  eyebrow: 'Acompanhamento de projeto',
  summary: 'Do planejamento à implantação: acompanhe as entregas e os próximos passos da parceria ONIXLOG × MIREVA.',
  currentPhase: 'Alinhamento inicial',
  nextAction: 'Receber o formulário de levantamento e confirmar o escopo da contratação.',
  targetDate: '',
  updatedAt: '',
  stages: STAGE_IDS.map((id, i) => ({
    id, title: STAGE_TITLES[i],
    status: i === 0 ? 'active' : 'pending',
    description: [
      'Coleta de informações da operação, responsáveis, documentos e objetivos.',
      'Análise do código, autenticação, armazenamento, banco de dados e infraestrutura.',
      'Definição de entregáveis, critérios de aceite, prazos e contrato.',
      'Execução das atividades contratadas e validação do fluxo de cargas.',
      'Testes dos principais módulos e homologação com a ONIXLOG.',
      'Publicação no ambiente definido e entrega das orientações de uso.'
    ][i],
    dueDate: ''
  })),
  activities: []
};

export function isStorageConfigured() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
function localFile() { return path.join(process.cwd(), '.local-data', 'project.json'); }
function useLocal() { return !process.env.VERCEL && process.env.NODE_ENV !== 'production'; }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function isYmd(x) { return x === '' || /^\d{4}-\d{2}-\d{2}$/.test(x); }
function trimmedString(v, limit) { return typeof v === 'string' ? v.trim().slice(0,limit) : null; }

export function validateProject(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Dados do projeto inválidos.');
  const name = trimmedString(input.name, 90);
  const summary = trimmedString(input.summary, 340);
  const currentPhase = trimmedString(input.currentPhase, 90);
  const nextAction = trimmedString(input.nextAction, 320);
  const targetDate = trimmedString(input.targetDate, 10);
  if (!name || !summary || !currentPhase || !nextAction || targetDate === null || !isYmd(targetDate)) throw Error('Preencha os dados principais corretamente.');
  if (!Array.isArray(input.stages) || input.stages.length !== 6) throw Error('O projeto deve conter seis etapas.');
  const stages = STAGE_IDS.map((id,i) => {
    const incoming = input.stages.find(x=>x?.id===id);
    if (!incoming) throw Error('Etapa obrigatória não encontrada.');
    const description = trimmedString(incoming.description, 350);
    const dueDate = trimmedString(incoming.dueDate, 10);
    if (description === null || dueDate === null || !isYmd(dueDate) || !STATUS_VALUES.includes(incoming.status)) throw Error('Verifique as informações das etapas.');
    return {id, title: STAGE_TITLES[i], status: incoming.status, description, dueDate};
  });
  return {name, eyebrow: initialProject.eyebrow, summary, currentPhase, nextAction, targetDate, stages};
}
export function calculateProgress(stages) {
  return Math.round(100 * stages.filter(x=>x.status==='done').length / STAGE_IDS.length);
}
export function mergeSaved(input) {
  const blank = clone(initialProject);
  if (!input || !Array.isArray(input.stages)) return blank;
  try {
    const validated = validateProject(input);
    const activities = Array.isArray(input.activities) ? input.activities.filter(x=>x && typeof x.text==='string' && typeof x.date==='string').slice(0,30).map(x=>({text:x.text.slice(0,450),date:x.date})) : [];
    return {...blank, ...validated, activities, updatedAt:typeof input.updatedAt === 'string' ? input.updatedAt : ''};
  } catch { return blank; }
}
async function supabaseRequest(method, body) {
  const base = process.env.SUPABASE_URL?.replace(/\/$/,'');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw Error('Armazenamento ainda não configurado.');
  const url = `${base}/rest/v1/project_progress${method==='GET'?'?id=eq.onixlog&select=payload':''}`;
  const res = await fetch(url, {method, headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',...(method !== 'GET'?{'Prefer':'resolution=merge-duplicates,return=minimal'}:{})}, ...(body?{body:JSON.stringify(body)}:{}) , cache:'no-store'});
  if (!res.ok) throw Error(`Erro ao acessar banco de dados (${res.status}). Verifique a configuração da tabela no Supabase.`);
  return method==='GET'?res.json():null;
}
export async function readProject() {
  if (isStorageConfigured()) {
    const rows = await supabaseRequest('GET');
    return mergeSaved(rows[0]?.payload);
  }
  if (!useLocal()) throw Error('Banco de dados não configurado. Configure Supabase antes de publicar.');
  try { return mergeSaved(JSON.parse(await readFile(localFile(),'utf8'))); }
  catch (e) {if (e.code === 'ENOENT') return clone(initialProject); throw e;}
}
export async function saveProject(incoming, note) {
  const project = validateProject(incoming);
  const previous = await readProject();
  const now = new Date().toISOString();
  const cleanNote = typeof note==='string'?note.trim().slice(0,450):'';
  const activities = cleanNote?[{id:randomUUID(),date:now,text:cleanNote},...previous.activities].slice(0,30):previous.activities;
  const output = {...project, updatedAt:now, activities};
  if (isStorageConfigured()) await supabaseRequest('POST',{id:'onixlog',payload:output,updated_at:now});
  else if (useLocal()) {
    await mkdir(path.dirname(localFile()),{recursive:true});
    const tmp=`${localFile()}.${randomUUID()}.tmp`;
    await writeFile(tmp,JSON.stringify(output,null,2),{mode:0o600});
    await rename(tmp,localFile());
  } else throw Error('Banco de dados não configurado.');
  return output;
}
