import test from 'node:test';
import assert from 'node:assert/strict';
import {initialProject,validateProject,calculateProgress,mergeSaved,isStorageConfigured} from '../lib/project.js';
import {passwordValid,cookieForLogin,authenticated} from '../lib/auth.js';

test('O progresso começa em 0% sem etapas concluídas',()=>{
 assert.equal(calculateProgress(initialProject.stages),0);
});
test('Progresso de seis etapas completas é 100%',()=>{
 assert.equal(calculateProgress(initialProject.stages.map(s=>({...s,status:'done'}))),100);
});
test('Progresso de duas etapas completas é 33%',()=>{
 assert.equal(calculateProgress(initialProject.stages.map((s,i)=>({...s,status:i<2?'done':'pending'}))),33);
});
test('Status inválido é rejeitado',()=>{
 const project=structuredClone(initialProject);project.stages[2].status='blocked';
 assert.throws(()=>validateProject(project),/etapas/i);
});
test('Etapas de outro projeto são rejeitadas',()=>{
 const project=structuredClone(initialProject);project.stages[0].id='outro';
 assert.throws(()=>validateProject(project),/Etapa obrigatória/);
});
test('Dados incompletos voltam para o estado inicial',()=>{
 assert.deepEqual(mergeSaved({stages:[]}).stages,initialProject.stages);
});
test('A chave secreta atual do Supabase habilita o armazenamento',()=>{
 const oldUrl=process.env.SUPABASE_URL;
 const oldSecret=process.env.SUPABASE_SECRET_KEY;
 const oldService=process.env.SUPABASE_SERVICE_ROLE_KEY;
 process.env.SUPABASE_URL='https://example.supabase.co';
 process.env.SUPABASE_SECRET_KEY='sb_secret_teste';
 delete process.env.SUPABASE_SERVICE_ROLE_KEY;
 assert.equal(isStorageConfigured(),true);
 if (oldUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL=oldUrl;
 if (oldSecret === undefined) delete process.env.SUPABASE_SECRET_KEY; else process.env.SUPABASE_SECRET_KEY=oldSecret;
 if (oldService === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY=oldService;
});
test('Cookie assinado autentica sem senha no navegador',()=>{
 process.env.ADMIN_PASSWORD='senha-teste-super-segura';
 process.env.SESSION_SECRET='secret-de-testes-mais-de-trinta-e-dois-caracteres';
 assert.equal(passwordValid('senha-teste-super-segura'),true);
 assert.equal(passwordValid('senha-errada'),false);
 const cookie=cookieForLogin().split(';')[0];
 assert.equal(authenticated({headers:{cookie}}),true);
 assert.equal(authenticated({headers:{cookie:cookie+'-adulterado'}}),false);
 delete process.env.ADMIN_PASSWORD;
 delete process.env.SESSION_SECRET;
});
