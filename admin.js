(() => {
"use strict";
const $ = id => document.getElementById(id);
const DEFAULT_PALETTE = {"--purple":"#5b16a8","--deep":"#26004d","--lav":"#eadbff","--yellow":"#ffd400","--cream":"#fff9e8","--ink":"#292333","--muted":"#756f7d","--white":"#ffffff"};
const DEFAULT_AVAILABILITY = {
 organizations:[{id:"edu",name:"Educación",status:"available",description:"Refuerzo y actividades educativas"},{id:"salud",name:"Salud",status:"soon",description:"Próximamente"},{id:"comunidad",name:"Comunidad",status:"soon",description:"Próximamente"}],
 partners:[{id:"escuelas",name:"Educación",status:"available",description:"Actividades y refuerzo educativo"},{id:"mujeres",name:"Espacios para mujeres",status:"available",description:"Acompañamiento y apoyo comunitario"},{id:"mayores",name:"Casa de reposo",status:"available",description:"Encuentros y actividades compartidas"}],
 districts:[{id:"jesus-maria",name:"Jesús María",status:"available",description:"Distrito en actividad. Líneas previstas: educación, acompañamiento comunitario y colaboración con instituciones educativas, espacios de apoyo y centros para personas mayores."},{id:"brena",name:"Breña",status:"available",description:"Distrito en actividad. Líneas previstas: educación, acompañamiento comunitario y colaboración con instituciones educativas, espacios de apoyo y centros para personas mayores."},{id:"san-miguel",name:"San Miguel",status:"soon",description:"Próxima zona de expansión. Se evaluarán necesidades locales y posibles alianzas."},{id:"pueblo-libre",name:"Pueblo Libre",status:"soon",description:"Próxima zona de expansión. Se evaluarán necesidades locales y posibles alianzas."},{id:"cercado-lima",name:"Cercado de Lima",status:"soon",description:"Próxima zona de expansión. Se evaluarán necesidades locales y posibles alianzas."},{id:"callao",name:"Callao",status:"soon",description:"Próxima zona de expansión. Se evaluarán necesidades locales y posibles alianzas."}]
};
let state = {content:{},palette:{...DEFAULT_PALETTE},availability:structuredClone(DEFAULT_AVAILABILITY),applications:[]};
async function api(action, payload={}) {
 const response = await fetch(`/api/${action}`, {method:"POST",headers:{"content-type":"application/json"},credentials:"same-origin",body:JSON.stringify(payload)});
 const data = await response.json().catch(()=>({error:"Respuesta inválida del servidor."}));
 if(!response.ok) throw new Error(data.error || `Error ${response.status}`);
 return data;
}
async function login(){
 $('loginError').textContent="Verificando…";
 try { await api("login",{password:$('adminPass').value}); $('loginScreen').style.display="none"; $('adminApp').style.display="block"; $('adminApp').classList.remove("admin-locked"); await loadAll(); }
 catch(e){$('loginError').textContent=e.message;}
}
$('loginBtn').addEventListener('click',login);
$('adminPass').addEventListener('keydown',e=>{if(e.key==="Enter")login();});
$('logoutBtn').addEventListener('click',async()=>{try{await api("logout");}finally{location.reload();}});
async function loadAll(){
 try {
  const data=await api("admin-data");
  state={content:data.content||{},palette:{...DEFAULT_PALETTE,...(data.palette||{})},availability:mergeAvailability(data.availability),applications:data.applications||[]};
  renderPalette();renderAvailability();renderApplications();setupPreview();
 } catch(e){ if(e.message.includes("sesión")) location.reload(); else alert("No se pudieron cargar los datos: "+e.message); }
}
function mergeAvailability(saved={}){
 return {organizations:DEFAULT_AVAILABILITY.organizations.map(x=>({...x,...(saved.organizations||[]).find(y=>y.id===x.id||y.name===x.name)})),partners:DEFAULT_AVAILABILITY.partners.map(x=>({...x,...(saved.partners||[]).find(y=>y.id===x.id||y.name===x.name)})),districts:DEFAULT_AVAILABILITY.districts.map(x=>({...x,...(saved.districts||[]).find(y=>y.id===x.id||y.name===x.name)}))};
}
function setupPreview(){
 const frame=$('sitePreview'); frame.src='index.html?adminPreview='+Date.now();
 frame.onload=()=>{
  renderTextCatalog();
  try {
   const doc=frame.contentDocument;
   doc.querySelectorAll('[data-i18n]').forEach(el=>{
    el.title='Doble clic para editar';
    el.addEventListener('dblclick',()=>{
     el.contentEditable='true';el.focus();
     const range=doc.createRange();range.selectNodeContents(el);const sel=frame.contentWindow.getSelection();sel.removeAllRanges();sel.addRange(range);
    });
    el.addEventListener('blur',async()=>{
     if(el.contentEditable!=='true')return;
     el.contentEditable='false';const key=el.dataset.i18n;state.content[key]=el.innerHTML;
     $('contentStatus').textContent='Guardando “'+key+'”…';
     try{await api('save-content',{content:{[key]:state.content[key]}});$('contentStatus').textContent='✓ Cambio guardado y publicado para todos los dispositivos.';}
     catch(e){$('contentStatus').textContent='No se pudo guardar: '+e.message;}
    });
   });
  } catch(e){$('contentStatus').textContent='No se pudo activar el editor visual en la vista previa.';}
 };
}
function renderTextCatalog(){
 const wrap=$('textCatalogList'); if(!wrap)return; wrap.innerHTML='';
 const frame=$('sitePreview'); let entries=[];
 try{frame.contentDocument.querySelectorAll('[data-i18n]').forEach(el=>{const key=el.dataset.i18n;if(!entries.some(x=>x.key===key))entries.push({key,value:state.content[key]??el.innerHTML});});}catch{}
 Object.entries(state.content).forEach(([key,value])=>{if(!entries.some(x=>x.key===key))entries.push({key,value});});
 const q=($('textSearch').value||'').toLocaleLowerCase();
 entries.filter(x=>(x.key+' '+x.value).toLocaleLowerCase().includes(q)).forEach(item=>{const box=document.createElement('label');box.style.cssText='display:block;border-bottom:1px solid #eee8f2;padding:10px 0;font-size:12px';const title=document.createElement('b');title.textContent=item.key;title.style.display='block';const area=document.createElement('textarea');area.value=item.value;area.rows=2;area.style.cssText='width:100%;margin-top:6px;padding:9px;border:1px solid #e4dce9;border-radius:6px;font:12px DM Sans';area.addEventListener('input',()=>state.content[item.key]=area.value);box.append(title,area);wrap.append(box);});
 $('textCatalogStatus').textContent=entries.length+' textos detectados en el sitio y en el contenido guardado.';
}
$('textSearch')?.addEventListener('input',renderTextCatalog);
$('saveTextCatalog')?.addEventListener('click',async()=>{try{await api('save-content',{content:state.content});$('textCatalogStatus').textContent='✓ Textos guardados.';$('sitePreview').contentWindow.location.reload();}catch(e){$('textCatalogStatus').textContent='No se pudo guardar; los cambios siguen pendientes. '+e.message;}});
function renderPalette(){
 const wrap=$('paletteFields');wrap.innerHTML='';
 Object.entries(DEFAULT_PALETTE).forEach(([key,original])=>{
  const label=document.createElement('label');label.className='color-field';const input=document.createElement('input');input.type='color';input.value=state.palette[key]||original;input.dataset.key=key;
  const span=document.createElement('span');span.textContent=key+' · '+input.value.toUpperCase();input.addEventListener('input',()=>span.textContent=key+' · '+input.value.toUpperCase());label.append(input,span);wrap.append(label);
 });
}
$('savePalette').addEventListener('click',async()=>{
 const palette={};document.querySelectorAll('#paletteFields input').forEach(i=>palette[i.dataset.key]=i.value);
 try{await api('save-palette',{palette});state.palette=palette;$('paletteStatus').textContent='✓ Paleta guardada. Se reflejará en todos los dispositivos.';$('sitePreview').contentWindow.location.reload();}
 catch(e){$('paletteStatus').textContent=e.message;}
});
$('resetPalette').addEventListener('click',async()=>{try{await api('save-palette',{palette:DEFAULT_PALETTE});state.palette={...DEFAULT_PALETTE};renderPalette();$('paletteStatus').textContent='Paleta original restaurada.';$('sitePreview').contentWindow.location.reload();}catch(e){$('paletteStatus').textContent=e.message;}});
function renderAvailability(){renderDistricts();renderGroup('organizations','organizationAvailability');renderGroup('partners','partnerAvailability');}
function renderDistricts(){
 const wrap=$('districtAvailability');wrap.innerHTML='';
 state.availability.districts.forEach((item,index)=>{
  const row=document.createElement('div');row.className='availability-row';const name=document.createElement('input');name.value=item.name;name.setAttribute('aria-label','Nombre público');name.addEventListener('input',()=>state.availability.districts[index].name=name.value);
  const choices=document.createElement('div');choices.className='district-status-choices';
  [{value:'available',label:'Disponible',color:'purple'},{value:'unavailable',label:'No disponible',color:'yellow'},{value:'soon',label:'Próximamente',color:'gray'}].forEach(opt=>{
   const btn=document.createElement('button');btn.type='button';btn.className='district-status-button'+(item.status===opt.value?' is-selected':'');btn.setAttribute('aria-pressed',String(item.status===opt.value));
   const dot=document.createElement('i');dot.className='status-dot '+opt.color;const text=document.createElement('span');text.textContent=opt.label;btn.append(dot,text);
   btn.addEventListener('click',()=>{state.availability.districts[index].status=opt.value;renderDistricts();});choices.append(btn);
  });
  const desc=document.createElement('input');desc.value=item.description||'';desc.placeholder='Descripción que aparece al seleccionar el distrito';desc.addEventListener('input',()=>state.availability.districts[index].description=desc.value);
  row.append(name,choices,desc);wrap.append(row);
 });
}
function renderGroup(group,id){
 const wrap=$(id);wrap.innerHTML='';const options=[{value:'available',label:'Disponible / Habilitado',color:'purple'},{value:'soon',label:'Próximamente',color:'yellow'},{value:'unavailable',label:'No disponible / Deshabilitado',color:'gray'}];
 state.availability[group].forEach((item,index)=>{
  const row=document.createElement('div');row.className='availability-row';const name=document.createElement('input');name.value=item.name;name.setAttribute('aria-label','Nombre público');name.addEventListener('input',()=>state.availability[group][index].name=name.value);const select=document.createElement('select');
  options.forEach(o=>{const opt=document.createElement('option');opt.value=o.value;opt.textContent=o.label;select.append(opt);});select.value=item.status;select.addEventListener('change',()=>state.availability[group][index].status=select.value);
  const desc=document.createElement('input');desc.value=item.description||'';desc.placeholder='Descripción';desc.addEventListener('input',()=>state.availability[group][index].description=desc.value);
  row.append(name,select,desc);wrap.append(row);
 });
}
$('saveAvailability').addEventListener('click',async()=>{try{const data=await api('save-availability',{availability:state.availability});state.availability=mergeAvailability(data.availability);$('availabilityStatus').textContent='✓ Disponibilidades guardadas y sincronizadas.';$('sitePreview').contentWindow.location.reload();}catch(e){$('availabilityStatus').textContent=e.message;}});
$('resetAvailability').addEventListener('click',async()=>{if(!confirm('¿Restaurar los estados iniciales?'))return;try{const data=await api('save-availability',{availability:DEFAULT_AVAILABILITY});state.availability=mergeAvailability(data.availability);renderAvailability();$('availabilityStatus').textContent='Estados iniciales restaurados.';$('sitePreview').contentWindow.location.reload();}catch(e){$('availabilityStatus').textContent=e.message;}});
function renderApplications(){
 const wrap=$('applicationsList');wrap.innerHTML='';$('applicationCount').textContent=state.applications.length+' solicitudes';
 if(!state.applications.length){wrap.innerHTML='<div class="application-empty">Todavía no hay solicitudes registradas.</div>';return;}
 state.applications.forEach((app,i)=>{
  const card=document.createElement('article');card.className='application-card';const title=document.createElement('h3');title.textContent=(i+1)+'. '+(app.name||'Sin nombre');card.append(title);
  const fields=[['Edad',app.age],['Correo',app.email],['Distrito',app.district],['Organización',app.organization],['Área de interés',app.interest],['Fecha de recepción',app.submittedAt?new Date(app.submittedAt).toLocaleString('es-PE'):'']];
  fields.forEach(([label,value])=>{if(value){const p=document.createElement('p');p.textContent=label+': '+value;card.append(p);}});
  if(app.otherInterest){const p=document.createElement('p');p.textContent='Otra área: '+app.otherInterest;card.append(p);}
  wrap.append(card);
 });
}
$('refreshApplications').addEventListener('click',async()=>{try{const data=await api('admin-data');state.applications=data.applications||[];renderApplications();$('applicationsStatus').textContent='Solicitudes actualizadas.';}catch(e){$('applicationsStatus').textContent=e.message;}});
$('exportApplications').addEventListener('click',()=>{
 if(!state.applications.length){$('applicationsStatus').textContent='No hay solicitudes para exportar.';return;}
 const keys=[...new Set(state.applications.flatMap(Object.keys))];const esc=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
 const csv=[keys.map(esc).join(','),...state.applications.map(r=>keys.map(k=>esc(r[k])).join(','))].join('\r\n');
 const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='solicitudes-voluntariado-GCW.csv';a.click();URL.revokeObjectURL(url);
});
})();
