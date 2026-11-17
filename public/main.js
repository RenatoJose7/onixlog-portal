const $=id=>document.getElementById(id);
const formatDate=(value,withTime=false)=>{
  if(!value)return 'A definir';
  const d=value.length===10?new Date(value+'T12:00:00'):new Date(value);
  if(Number.isNaN(d.getTime()))return 'A definir';
  return new Intl.DateTimeFormat('pt-BR', {timeZone:'America/Sao_Paulo',day:'2-digit',month:'short',year:'numeric',...(withTime?{hour:'2-digit',minute:'2-digit'}:{})}).format(d);
};
const statuses={pending:{label:'Pendente',className:'pending'},active:{label:'Em andamento',className:'active'},done:{label:'Concluída',className:'done'}};
function el(tag,className,text){const x=document.createElement(tag);if(className)x.className=className;if(text!==undefined)x.textContent=text;return x;}
function renderStages(stages){
  const list=$('stages');list.replaceChildren();
  for(const [index,stage] of stages.entries()){
    const status=statuses[stage.status]??statuses.pending;
    const item=el('article',`timeline-item timeline-${status.className}`);
    const rail=el('div','stage-rail');rail.append(el('span','stage-number',stage.status==='done'?'✓':String(index+1).padStart(2,'0')));
    const content=el('div','stage-body');const head=el('div','stage-heading');
    head.append(el('h3',null,stage.title),el('span',`status-pill ${status.className}`,status.label));
    content.append(head);
    if(stage.description)content.append(el('p','stage-description',stage.description));
    if(stage.dueDate) content.append(el('div','stage-due',`Prazo previsto: ${formatDate(stage.dueDate)}`));
    item.append(rail,content);list.append(item);
  }
}
function renderActivities(activities){
  const list=$('activity');list.replaceChildren();
  if(!activities.length){list.append(el('div','activity-empty','As primeiras atualizações aparecerão aqui.'));return;}
  for(const a of activities.slice(0,6)){
    const row=el('article','activity-entry');
    const dot=el('span','activity-dot');const body=el('div','activity-body');
    body.append(el('p',null,a.text),el('time',null,formatDate(a.date,true)));row.append(dot,body);list.append(row);
  }
}
function render(project){
  $('project-summary').textContent=project.summary;
  $('phase-name').textContent=project.currentPhase;
  $('last-updated').textContent=project.updatedAt?'Atualizado em '+formatDate(project.updatedAt,true):'Aguardando primeira atualização';
  $('next-action').textContent=project.nextAction;
  $('target-date').textContent=formatDate(project.targetDate);
  const done=project.stages.filter(x=>x.status==='done').length;
  const active=project.stages.filter(x=>x.status==='active').length;
  const total=project.stages.length;
  const progress=Math.round(100*done/total);
  $('progress-value').replaceChildren(document.createTextNode(String(progress)),el('small',null,'%'));
  $('progress-dial').style.setProperty('--progress',progress+'%');
  $('progress-dial').setAttribute('aria-label',`${progress}% das etapas concluídas`);
  $('done-count').textContent=done;
  $('active-count').textContent=active;
  $('pending-count').textContent=total-done-active;
  renderStages(project.stages);
  renderActivities(project.activities);
}
async function load(){
  try{
    const result=await fetch('/api/project',{cache:'no-store'});
    const data=await result.json();
    if(!result.ok)throw Error(data.error||'Não foi possível carregar o projeto.');
    render(data.project);
  }catch(error){
    $('error-box').hidden=false;
    $('error-box').textContent=`Não foi possível atualizar o painel: ${error.message}`;
    $('stages').replaceChildren(el('p','activity-empty','O acompanhamento estará disponível após a configuração do projeto.'));
  }
}
$('year').textContent=new Date().getFullYear();load();
