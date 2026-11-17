const $=id=>document.getElementById(id);
const labels={pending:'Pendente',active:'Em andamento',done:'Concluída'};
let model=null;let saving=false;
function el(tag,className,text){const x=document.createElement(tag);if(className)x.className=className;if(text!==undefined)x.textContent=text;return x;}
function showLogin(message=''){
 $('loading').hidden=true;$('editor-panel').hidden=true;$('login-panel').hidden=false;$('logout').hidden=true;
 $('login-error').hidden=!message;$('login-error').textContent=message;
}
function showEditor(){ $('loading').hidden=true;$('login-panel').hidden=true;$('editor-panel').hidden=false;$('logout').hidden=false; }
async function getJSON(url,opts){const res=await fetch(url,{cache:'no-store',credentials:'same-origin',...opts});let json;try{json=await res.json();}catch{throw Error('Resposta inválida do servidor.');}if(!res.ok){const err=Error(json.error||'Erro de conexão.');err.status=res.status;throw err;}return json;}
function stageInput(stage,index){
 const wrapper=el('div','stage-editor');
 const heading=el('div','stage-editor-heading');heading.append(el('span','stage-editor-number',String(index+1).padStart(2,'0')),el('strong',null,stage.title));
 const fields=el('div','stage-editor-fields');
 const statusGroup=el('div','field');const statusLabel=el('label',null,'Situação');statusLabel.htmlFor=`stage-status-${index}`;
 const select=el('select','stage-status');select.id=`stage-status-${index}`;select.dataset.id=stage.id;
 for(const [value,label] of Object.entries(labels)){const option=el('option',null,label);option.value=value;select.append(option);}select.value=stage.status;
 select.addEventListener('change',updateProgress);
 statusGroup.append(statusLabel,select);
 const dateGroup=el('div','field');const dateLabel=el('label',null,'Prazo previsto (opcional)');dateLabel.htmlFor=`stage-date-${index}`;
 const date=el('input');date.type='date';date.id=`stage-date-${index}`;date.value=stage.dueDate;dateGroup.append(dateLabel,date);
 const descriptionGroup=el('div','field');const descriptionLabel=el('label',null,'Descrição visível para o cliente');descriptionLabel.htmlFor=`stage-desc-${index}`;
 const description=el('textarea');description.id=`stage-desc-${index}`;description.maxLength=350;description.rows=2;description.value=stage.description;
 descriptionGroup.append(descriptionLabel,description);
 const split=el('div','field-split');split.append(statusGroup,dateGroup);
 fields.append(split,descriptionGroup);wrapper.append(heading,fields);return wrapper;
}
function render(project){model=project;showEditor();
 $('field-name').value=project.name;$('field-summary').value=project.summary;$('field-phase').value=project.currentPhase;
 $('field-target').value=project.targetDate;$('field-next').value=project.nextAction;
 $('field-note').value='';$('stage-editors').replaceChildren(...project.stages.map(stageInput));updateProgress();
}
function collect(){
 return { name:$('field-name').value,summary:$('field-summary').value,currentPhase:$('field-phase').value,
  targetDate:$('field-target').value,nextAction:$('field-next').value,
  stages:model.stages.map((stage,i)=>({id:stage.id,status:$(`stage-status-${i}`).value,description:$(`stage-desc-${i}`).value,dueDate:$(`stage-date-${i}`).value}))};
}
function updateProgress(){if(!model)return;
 const count=model.stages.length;
 const done=model.stages.filter((s,i)=>$(`stage-status-${i}`)?.value==='done').length;
 const active=model.stages.filter((s,i)=>$(`stage-status-${i}`)?.value==='active').length;
 $('admin-progress').textContent=Math.round(100*done/count)+'%';$('admin-done').textContent=done;$('admin-active').textContent=active;
}
function setStatus(message,isError=false){$('save-status').textContent=message;$('save-status').classList.toggle('error-text',isError);}
async function save(){if(saving)return;
 if(!$('editor-form').reportValidity())return;
 saving=true;for(const id of ['save-top','save-bottom'])$(id).disabled=true;
 setStatus('Salvando...');
 try{
  const result=await getJSON('/api/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project:collect(),note:$('field-note').value})});
  model=result.project;setStatus('Alterações publicadas com sucesso.');$('field-note').value='';
 }catch(e){setStatus(e.message,true);if(e.status===401)showLogin('Sua sessão expirou. Entre novamente.');}
 finally{saving=false;for(const id of ['save-top','save-bottom'])$(id).disabled=false;}
}
async function initialize(){
 try{const session=await getJSON('/api/session');if(!session.configured){showLogin('Configure ADMIN_PASSWORD e SESSION_SECRET no servidor antes de entrar.');return;}if(!session.authenticated){showLogin();return;}
 const data=await getJSON('/api/project');render(data.project);
 }catch(e){showLogin('Não foi possível carregar o painel: '+e.message);}
}
$('login-form').addEventListener('submit',async(e)=>{e.preventDefault();
 const button=$('login-button');button.disabled=true;$('login-error').hidden=true;
 try{await getJSON('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:$('password').value})});$('password').value='';const data=await getJSON('/api/project');render(data.project);}
 catch(e){$('login-error').textContent=e.message;$('login-error').hidden=false;}
 finally{button.disabled=false;}
});
$('logout').addEventListener('click',async()=>{try{await getJSON('/api/logout',{method:'POST'});}catch{}showLogin();});
$('save-top').addEventListener('click',save);$('save-bottom').addEventListener('click',save);
initialize();
