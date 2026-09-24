import { catalog } from './catalog.js';
import { dictionaries, resolveLocale, textFor, costLabel } from './i18n.js';
import { initialState, createTrip, dateRange, addItem, findConflicts, minutesOf, timeOf, createRecord, filterUnits } from './domain.js';
import { LocalRepository } from './repository.js';

const root = document.querySelector('#app');
const notice = document.querySelector('#notice');
const region = {country:'KR',city:'seoul',district:'seongsu'};
let state = initialState(), repository, loadError = false;
try { repository = new LocalRepository(window.localStorage); state = repository.load(); }
catch { loadError = true; }
const ui = {page:'discover',unitId:null,tripId:state.trips[0]?.id,day:null,itemId:null,original:false,filters:{}};
const esc = value => String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const locale = () => resolveLocale(state.preference,navigator.language);
const t = key => dictionaries[locale()][key] ?? key;
const tx = (value,source='ko') => esc(textFor(value,locale(),source));
const option = (value,label,current) => `<option value="${esc(value)}" ${String(value)===String(current)?'selected':''}>${esc(label)}</option>`;
const button = (action,label,extra='',kind='primary') => `<button type="button" class="${kind}" data-action="${action}" ${extra}>${esc(label)}</button>`;
const languageSelect = id => `<label class="language" for="${id}"><span>${t('language')}</span><select id="${id}" data-language>${option('auto',t('automatic'),state.preference)}${option('ko','한국어',state.preference)}${option('en','English',state.preference)}</select></label>`;
const selectedTrip = () => state.trips.find(x=>x.id===ui.tripId) ?? state.trips[0];
const selectedItem = () => selectedTrip()?.items.find(x=>x.id===ui.itemId);
function announce(key) { notice.textContent=t(key); notice.classList.add('visible'); clearTimeout(announce.timer); announce.timer=setTimeout(()=>notice.classList.remove('visible'),6000); }
function persist(mutator) {
  if (loadError || !repository) throw new Error('loadError');
  const next=structuredClone(state); mutator(next); repository.save(next); state=next;
}
function go(page) { ui.page=page; render(); document.querySelector('main h1')?.focus(); window.scrollTo(0,0); }
function badges(unit) { return `<div class="badges"><span>${t(unit.category)}</span><span class="growth">${t(unit.growth)}</span><span class="${unit.sourceType==='ai_draft'?'ai':''}">${t(unit.sourceType==='ai_draft'?'aiDraft':'originalExperience')}</span></div>`; }
function stats(unit) { return `<div class="stats"><span>${unit.durationMinutes} ${t('minutes')}</span><span>${esc(costLabel(unit.cost,locale()))}</span><span>${unit.points.length} ${t('points')}</span></div>`; }
function areaFields() { return `<div class="region-fields"><label>${t('country')}<select name="country">${option('KR',t('korea'),'KR')}</select></label><label>${t('city')}<select name="city">${option('seoul',t('seoul'),'seoul')}</select></label><label>${t('region')}<select name="district">${option('seongsu',t('seongsu'),'seongsu')}</select></label></div><p class="muted small">${t('areaNote')}</p>`; }
function cards() {
  const units=filterUnits(catalog,{...ui.filters,region});
  return `<div class="section-heading"><h2>${t('results')}</h2><span>${units.length} ${t('resultsCount')}</span></div><div class="card-grid">${units.map(u=>`<article class="unit-card"><div class="card-art ${esc(u.category)}" aria-hidden="true"><span>${u.category==='walk'?'✳':u.category==='cafe'?'☕':'◈'}</span></div><div class="card-body">${badges(u)}<h3><button class="title-button" data-action="detail" data-id="${u.id}">${tx(u.title,u.sourceLocale)}</button></h3><p class="muted">${tx(u.description,u.sourceLocale)}</p>${stats(u)}<p class="small muted">${tx(u.place,u.sourceLocale)}</p>${button('detail',t('detail'),`data-id="${u.id}"`,'secondary full')}</div></article>`).join('') || `<div class="empty"><p>${t('empty')}</p>${button('reset',t('clear'),'','secondary')}</div>`}</div>`;
}
function discover() { const f=ui.filters; return `<section class="hero"><span class="eyebrow">SMALL MOMENTS, YOUR JOURNEY</span><h1 tabindex="-1">${t('intro')}</h1><p>${t('sub')}</p></section><section class="filter-panel" aria-label="${t('discover')}">${areaFields()}<form id="filters"><label class="search-label">${t('search')}<input name="query" type="search" value="${esc(f.query||'')}" placeholder="${t('search')}" maxlength="100"></label><div class="filter-row"><label>${t('duration')}<select name="maxMinutes">${option('',t('allTimes'),f.maxMinutes)}${option(30,t('thirty'),f.maxMinutes)}${option(60,t('sixty'),f.maxMinutes)}</select></label><label>${t('category')}<select name="category">${option('',t('all'),f.category)}${['walk','cafe','sightseeing'].map(k=>option(k,t(k),f.category)).join('')}</select></label><label>${t('budget')}<select name="maxCost">${option('',t('allCosts'),f.maxCost??'')}${option(0,t('freeOnly'),f.maxCost)}${option(10000,t('underTen'),f.maxCost)}</select></label>${button('reset',t('clear'),'','text-button')}</div></form></section><section id="results" aria-live="polite">${cards()}</section>`; }
function detail() {
  const u=catalog.find(x=>x.id===ui.unitId); if (!u) return discover();
  const lang=ui.original?u.sourceLocale:locale(); const content=v=>esc(textFor(v,lang,u.sourceLocale));
  return `<div class="narrow">${button('back-discover','← '+t('back'),'','text-button')}<article class="detail-card">${badges(u)}<p class="small muted">${t('author')} ${esc(u.author)} · ${t('version')} ${u.version}</p><h1 tabindex="-1" lang="${lang}">${content(u.title)}</h1><p lang="${lang}">${content(u.description)}</p>${stats(u)}<p class="place" lang="${lang}">${content(u.place)}</p><div class="translation"><span>${t(lang===u.sourceLocale?'original':'translation')} · ${lang==='ko'?'한국어':'English'}</span>${locale()!==u.sourceLocale?button('original',t(ui.original?'viewTranslated':'viewOriginal'),'','text-button'):''}</div><h2>${t('how')}</h2><ol class="point-list" lang="${lang}">${u.points.map(p=>`<li>${content(p.text)}</li>`).join('')}</ol><aside class="tip"><h3>${t('tip')}</h3><p lang="${lang}">${content(u.tip)}</p></aside>${button('add',t('add'),`data-id="${u.id}"`,'primary full')}</article></div>`;
}
function trips() {
  const trip=selectedTrip();
  if (!trip) return `<section class="hero"><h1 tabindex="-1">${t('titleTrips')}</h1><p>${t('myTripsIntro')}</p></section><div class="empty"><p>${t('noTrips')}</p>${button('create-trip',t('newTrip'))}</div>`;
  ui.tripId=trip.id; const days=dateRange(trip.startDate,trip.endDate); if (!days.includes(ui.day)) ui.day=days[0];
  const items=trip.items.filter(x=>x.date===ui.day).sort((a,b)=>a.startTime.localeCompare(b.startTime)); const conflicts=findConflicts(items);
  return `<div class="section-heading"><div><p class="eyebrow">${t('private')}</p><h1 tabindex="-1">${esc(trip.name)}</h1><p class="muted">${trip.startDate} — ${trip.endDate} · ${t('seongsu')}</p></div>${button('create-trip',t('newTrip'),'','secondary')}</div><label class="trip-select">${t('selectTrip')}<select id="trip-select">${state.trips.map(x=>option(x.id,x.name,trip.id)).join('')}</select></label><div class="days" aria-label="${t('day')}">${days.map((d,i)=>button('day',`Day ${i+1} · ${d.slice(5)}`,`data-date="${d}" aria-pressed="${ui.day===d}"`,'day-button')).join('')}</div><p class="muted">${t('laterMovement')}</p>${conflicts.length?`<p class="warning" role="status">${t('conflict')}</p>`:''}<div class="timeline">${items.map(item=>`<article class="schedule-card"><div class="time">${item.startTime}<span>${timeOf(minutesOf(item.startTime)+item.durationMinutes)}</span></div><div class="schedule-body"><span class="status ${state.records[item.id]?.status==='complete'?'done':''}">${t(state.records[item.id]?.status||'planned')}</span><h2>${tx(item.snapshot.title,item.snapshot.sourceLocale)}</h2>${stats(item.snapshot)}<div class="actions">${button('experience',t('experience'),`data-id="${item.id}"`,'secondary')}${button('remove',t('remove'),`data-id="${item.id}"`,'text-button')}</div></div></article>`).join('') || `<div class="empty">${t('noItems')}</div>`}</div>${button('back-discover','+ '+t('addMore'),'','primary full')}`;
}
function experience() {
  const item=selectedItem(); if (!item) return trips(); const record=state.records[item.id];
  return `<div class="narrow">${button('back-trips','← '+t('back'),'','text-button')}<section class="detail-card"><p class="eyebrow">${t('todayExperience')}</p><h1 tabindex="-1">${tx(item.snapshot.title,item.snapshot.sourceLocale)}</h1><p>${t('checklist')}</p><form id="record-form"><div class="checklist">${item.snapshot.points.map(p=>`<label><input type="checkbox" name="point" value="${esc(p.id)}" ${record?.checkedIds.includes(p.id)?'checked':''}><span>${tx(p.text,item.snapshot.sourceLocale)}</span></label>`).join('')}</div><label>${t('note')}<textarea name="note" maxlength="2000" rows="5" placeholder="${t('noteHint')}">${esc(record?.note||'')}</textarea></label><p class="small muted">${t('selfReported')}</p><button class="primary full" type="submit">${t('saveRecord')}</button></form></section></div>`;
}
function settings() { return `<div class="narrow"><h1 tabindex="-1">${t('settings')}</h1><section class="detail-card">${languageSelect('settings-language')}<p class="muted">${t('contentLanguage')}</p></section>${['privacy','storage','server'].map(k=>`<section class="setting-card"><h2>${t(k+'Title')}</h2><p>${t(k+'Body')}</p></section>`).join('')}<p class="small muted">Yamone Trip · v0.1.0</p></div>`; }
function render() {
  document.documentElement.lang=locale(); document.title=t('brand'); document.querySelector('#skip').textContent=t('skip');
  const active=['detail'].includes(ui.page)?'discover':ui.page==='experience'?'trips':ui.page;
  root.innerHTML=`<header class="site-header"><button class="brand" data-action="back-discover"><span class="brand-mark" aria-hidden="true">y.</span><span>${t('brand')}<small>${t('tagline')}</small></span></button>${languageSelect('header-language')}</header><div class="demo-banner"><span>${t('local')}</span>${t('demo')}</div>${loadError?`<p class="error" role="alert">${t('loadError')}</p>`:''}<main id="main">${({discover,trips,detail,experience,settings,mine:()=>`<section class="hero"><h1 tabindex="-1">${t('mine')}</h1><p>${t('myUnitsSub')}</p></section><div class="empty"><span class="seed-art" aria-hidden="true">✳</span><p>${t('writeLater')}</p></div>`}[ui.page]||discover)()}</main><nav class="bottom-nav" aria-label="${t('brand')}">${[['trips','▤'],['discover','⌕'],['mine','✳'],['settings','⚙']].map(([p,icon])=>`<button data-action="nav" data-page="${p}" ${active===p?'aria-current="page"':''}><span aria-hidden="true">${icon}</span>${t(p)}</button>`).join('')}</nav><dialog id="modal"></dialog>`;
}
function showDialog(content) { const modal=document.querySelector('#modal'); modal.innerHTML=content; modal.showModal(); }
function dialogEnd() { return `<div class="actions"><button class="primary" type="submit">${t('save')}</button>${button('close',t('cancel'),'','secondary')}</div><p class="form-error" role="alert"></p></form>`; }
function tripDialog() {
  const today=new Date(); const date=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  showDialog(`<form id="trip-form"><h2>${t('newTrip')}</h2><label>${t('tripName')}<input name="name" required maxlength="80" autocomplete="off"></label><div class="two-columns"><label>${t('startDate')}<input name="startDate" type="date" value="${date}" required></label><label>${t('endDate')}<input name="endDate" type="date" value="${date}" required></label></div>${areaFields()}<p class="small muted">${t('private')}</p>${dialogEnd()}`);
}
function addDialog(unitId,tripId) {
  if (!state.trips.length) { ui.pendingUnit=unitId; tripDialog(); return; }
  const trip=state.trips.find(x=>x.id===tripId)||selectedTrip(); ui.pendingUnit=unitId;
  showDialog(`<form id="add-form"><h2>${t('add')}</h2><label>${t('chooseTrip')}<select name="tripId" id="add-trip">${state.trips.map(x=>option(x.id,x.name,trip.id)).join('')}</select></label><label>${t('day')}<select name="date">${dateRange(trip.startDate,trip.endDate).map(d=>option(d,d,ui.day)).join('')}</select></label><label>${t('start')}<input name="startTime" type="time" value="09:00" required></label><p class="small muted">${t('laterMovement')}</p>${dialogEnd()}`);
}
root.addEventListener('click',event=>{
  const b=event.target.closest('[data-action]'); if (!b) return;
  try {
    switch (b.dataset.action) {
      case 'nav': go(b.dataset.page); break;
      case 'back-discover': go('discover'); break;
      case 'back-trips': go('trips'); break;
      case 'detail': ui.unitId=b.dataset.id; ui.original=false; go('detail'); break;
      case 'original': ui.original=!ui.original; render(); break;
      case 'reset': ui.filters={}; render(); break;
      case 'create-trip': ui.pendingUnit=null; tripDialog(); break;
      case 'add': addDialog(b.dataset.id); break;
      case 'close': document.querySelector('#modal').close(); break;
      case 'day': ui.day=b.dataset.date; render(); break;
      case 'experience': ui.itemId=b.dataset.id; go('experience'); break;
      case 'remove': if (window.confirm(t('removeConfirm'))) { persist(s=>{ const trip=s.trips.find(x=>x.id===ui.tripId); trip.items=trip.items.filter(x=>x.id!==b.dataset.id); delete s.records[b.dataset.id]; }); render(); announce('saved'); } break;
    }
  } catch(error) { announce(dictionaries[locale()][error.message]?error.message:'invalid'); }
});
root.addEventListener('change',event=>{
  try {
    if (event.target.matches('[data-language]')) { persist(s=>{s.preference=event.target.value;}); render(); }
    if (event.target.id==='trip-select') { ui.tripId=event.target.value; ui.day=null; render(); }
    if (event.target.id==='add-trip') addDialog(ui.pendingUnit,event.target.value);
  } catch(error) { render(); announce(error.message); }
});
root.addEventListener('input',event=>{
  if (event.target.closest('#filters')) {
    const data=new FormData(document.querySelector('#filters'));
    ui.filters={query:data.get('query'),category:data.get('category'),maxMinutes:Number(data.get('maxMinutes')),maxCost:data.get('maxCost')===''?null:Number(data.get('maxCost'))};
    document.querySelector('#results').innerHTML=cards();
  }
});
root.addEventListener('submit',event=>{
  event.preventDefault(); const form=event.target; const data=new FormData(form);
  try {
    if (form.id==='trip-form') {
      const trip=createTrip({...Object.fromEntries(data),region},crypto.randomUUID());
      persist(s=>s.trips.push(trip)); ui.tripId=trip.id; ui.day=trip.startDate;
      if (ui.pendingUnit) { addDialog(ui.pendingUnit,trip.id); announce('saved'); } else { go('trips'); announce('saved'); }
    }
    if (form.id==='add-form') {
      const tripId=data.get('tripId'), unit=catalog.find(x=>x.id===ui.pendingUnit);
      persist(s=>{const index=s.trips.findIndex(x=>x.id===tripId); s.trips[index]=addItem(s.trips[index],unit,{date:data.get('date'),startTime:data.get('startTime')},crypto.randomUUID());});
      ui.tripId=tripId; ui.day=data.get('date'); ui.pendingUnit=null; go('trips'); announce('saved');
    }
    if (form.id==='record-form') { const item=selectedItem(); const record=createRecord(item,data.getAll('point'),data.get('note')); persist(s=>{s.records[item.id]=record;}); go('trips'); announce('savedRecord'); }
  } catch(error) { const key=dictionaries[locale()][error.message]?error.message:'invalid'; const target=form.querySelector('.form-error'); if(target) target.textContent=t(key); else announce(key); }
});
render();
