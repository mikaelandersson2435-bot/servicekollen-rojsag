/* Verkstadskollen v1.8 - tillägg till Servicekollen Röjsåg.
   Ingen AI, inget maskinregister, inga databasskrivningar.
   Protokoll sparas ENDAST i denna webbläsares localStorage tills Supabase-integration byggs. */
(() => {
  'use strict';
  const STORAGE = 'verkstadskollen_protokoll_v1';
  const models = {
    Husqvarna: { 'Röjsåg': ['545 FR','545 FX','545 RXT','Annan röjsåg'], 'Motorsåg': ['550 XP','545 Mark II','Annan motorsåg'] },
    STIHL: { 'Röjsåg': ['FS 460','FS 410','Annan röjsåg'], 'Motorsåg': ['MS 261','MS 500i','Annan motorsåg'] }
  };
  const flows = {
    no_start: {
      label: 'Motorn startar inte',
      questions: [
        { q: 'Finns det färskt bränsle av rätt typ i tanken?', yes: 'Kontrollera om motorn tänder till vid startförsök.', no: 'Byt till korrekt färskt bränsle enligt maskinens manual innan ny start.' },
        { q: 'Tänder motorn till vid något startförsök?', yes: 'Kontrollera startförfarande, choke och bränsletillförsel.', no: 'Kontrollera tändstift, tändstiftshatt, stoppfunktion och bränsletillförsel. Tändprov bör utföras säkert med avsett verktyg.' },
        { q: 'Är luftfiltret rent och torrt?', yes: 'Fortsätt med tändstift och bränslesystem enligt tillverkarens felsökningsanvisningar.', no: 'Rengör eller byt luftfilter enligt manual. Undersök även varför det är vått eller oljigt.' }
      ]
    },
    idle: {
      label: 'Motorn stannar på tomgång',
      questions: [
        { q: 'Går motorn jämnt innan den stannar?', yes: 'Kontrollera tomgångsinställning mot modellens specifikation och bränsletillförsel.', no: 'Kontrollera luftfilter, bränsle, slangar och eventuella läckage.' },
        { q: 'Är luftfiltret rent och torrt?', yes: 'Gå vidare till bränslesystem och förgasarens funktion.', no: 'Rengör eller byt enligt manual och kontrollera orsaken till föroreningen.' },
        { q: 'Återgår gasreglaget helt till viloläget?', yes: 'Kontrollera tomgång och koppling enligt verkstadshandboken.', no: 'Stäng av motorn. Kontrollera kärvande gasvajer, länkage och returfjäder.' }
      ]
    },
    cutting: {
      label: 'Klinga eller kedja rör sig vid tomgång',
      questions: [
        { q: 'Återgår gasreglaget och mekanismen helt till viloläget?', yes: 'Kontrollera tomgångsvarvtal enligt modellspecifik manual.', no: 'Stäng av motorn och åtgärda kärvande gasreglage eller länkage.' },
        { q: 'Är tomgången inställd enligt modellens specifikation?', yes: 'Misstänk att kopplingen inte frikopplar. Kontrollera koppling och fjädrar enligt verkstadshandbok.', no: 'Justera endast enligt rätt manual; skärutrustningen får inte drivas på tomgång.' },
        { q: 'Stannar skärutrustningen helt när motorn går på tomgång?', yes: 'Bekräfta med säker slutkontroll före användning.', no: 'Ta maskinen ur drift tills orsaken är åtgärdad.' }
      ]
    },
    power: {
      label: 'Motorn tappar kraft',
      questions: [
        { q: 'Är luftfiltret rent och korrekt monterat?', yes: 'Kontrollera bränslekvalitet, tändstift och avgasväg.', no: 'Rengör eller byt filter enligt manual.' },
        { q: 'Är bränslet färskt och rätt blandat för maskinen?', yes: 'Kontrollera bränsletillförsel och eventuella blockeringar.', no: 'Byt bränsle och kontrollera att blandningen är korrekt.' },
        { q: 'Är kylflänsar och luftintag fria från smuts?', yes: 'Fortsätt enligt modellens servicehandbok; mätningar kräver rätt instrument.', no: 'Stäng av och låt motorn svalna innan rengöring.' }
      ]
    },
    other: {
      label: 'Annat fel eller planerad service',
      questions: [
        { q: 'Har maskinen synliga skador eller läckage?', yes: 'Dokumentera skadan och kontrollera om maskinen måste tas ur drift.', no: 'Gör en systematisk servicekontroll enligt maskinens manual.' },
        { q: 'Fungerar stoppknapp, skydd och gasreglage korrekt?', yes: 'Gå vidare med övriga kontrollpunkter.', no: 'Ta maskinen ur drift tills säkerhetsfunktionen är åtgärdad.' },
        { q: 'Har nödvändiga åtgärder genomförts och kontrollerats?', yes: 'Skriv ut ett serviceprotokoll med slutbedömning.', no: 'Notera återstående arbete och låt maskinen stå ur drift vid säkerhetsbrister.' }
      ]
    }
  };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const $ = id => document.getElementById(id);
  function options(arr) { return arr.map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join(''); }
  const style = document.createElement('style');
  style.textContent = `nav{grid-template-columns:repeat(5,minmax(0,1fr))}#verkstadskollen .vk-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}#verkstadskollen .vk-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}#verkstadskollen .vk-actions button{flex:1 1 160px}#verkstadskollen .vk-hint{font-size:.9rem;color:var(--muted)}#verkstadskollen .vk-result{margin-top:10px;padding:12px;border:1px solid var(--line);background:#0f172a;border-radius:10px}#verkstadskollen .vk-qa{padding:12px;border:1px solid var(--line);border-radius:10px;margin:10px 0}#verkstadskollen .vk-qa select{margin-top:8px}#verkstadskollen .vk-alert{border-left:4px solid var(--warn);padding:10px;background:#292315;margin-top:10px}#vk-print{display:none}@media(max-width:600px){nav{grid-template-columns:repeat(3,minmax(0,1fr))}nav button{font-size:.75rem}}@media print{header,main,.modal,#authGate{display:none!important}#vk-print{display:block!important;color:#111!important;background:#fff!important;font:12pt Arial,sans-serif;padding:8mm}#vk-print h1{font-size:20pt}#vk-print p{white-space:pre-wrap}#vk-print table{width:100%;border-collapse:collapse}#vk-print td,#vk-print th{border:1px solid #888;padding:7px}}`;
  document.head.appendChild(style);
  const nav = document.querySelector('header nav');
  const main = document.querySelector('main.wrap');
  if (!nav || !main || $('verkstadskollen')) return;
  const btn = document.createElement('button');
  btn.type = 'button'; btn.dataset.page = 'verkstadskollen'; btn.textContent = 'Verkstadskollen';
  nav.appendChild(btn);
  const section = document.createElement('section');
  section.id = 'verkstadskollen'; section.className = 'page';
  section.innerHTML = `
    <div class="card"><h2>Verkstadskollen</h2><p class="muted">Felsökning, reservdelsunderlag och verkstadsprotokoll för Husqvarna och STIHL. Inget extra maskinregister.</p>
      <div class="vk-form">
        <div><label for="vk-brand">Fabrikat</label><select id="vk-brand">${options(Object.keys(models))}</select></div>
        <div><label for="vk-kind">Maskintyp</label><select id="vk-kind">${options(['Röjsåg','Motorsåg'])}</select></div>
        <div><label for="vk-model">Modell</label><select id="vk-model"></select></div>
        <div><label for="vk-serial">Serienummer / variant (frivilligt)</label><input id="vk-serial" placeholder="För reservdelskontroll"></div>
      </div>
      <label for="vk-symptom">Problem eller service</label><select id="vk-symptom">${Object.entries(flows).map(([key,flow]) => `<option value="${key}">${esc(flow.label)}</option>`).join('')}</select>
      <div class="vk-actions"><button type="button" class="btn primary" id="vk-start">Starta felsökning</button><button type="button" class="btn secondary" id="vk-reset">Nollställ</button></div>
    </div>
    <div class="card"><h2>Stegvis felsökning</h2><div id="vk-questions" class="vk-hint">Välj ett problem och tryck Starta felsökning.</div></div>
    <div class="card"><h2>Sprängskisser och reservdelar</h2><p class="vk-hint">För att undvika felköp anges inga påhittade artikelnummer. Öppna den officiella reservdelskatalogen eller lägg in ett verifierat artikelnummer från din dokumentation. Kontrollera alltid modell, serienummer och version.</p>
      <div class="vk-alert" id="vk-parts-help">Ingen modellspecifik sprängskiss är inlagd ännu. Detta kompletteras efter kontroll av tillverkarens reservdelsunderlag.</div>
      <div class="vk-form"><div><label for="vk-part">Reservdel / komponent</label><input id="vk-part" placeholder="Ex. luftfilter"></div><div><label for="vk-part-number">Verifierat artikelnummer</label><input id="vk-part-number" placeholder="Fyll i från katalog"></div><div><label for="vk-part-qty">Antal</label><input id="vk-part-qty" type="number" min="1" value="1"></div></div>
      <button type="button" id="vk-add-part" class="btn secondary" style="margin-top:12px">Lägg till i protokollet</button><div id="vk-parts-list" style="margin-top:12px"></div>
    </div>
    <div class="card"><h2>Verkstadsprotokoll</h2>
      <div class="vk-form"><div><label for="vk-date">Datum</label><input id="vk-date" type="date"></div><div><label for="vk-worker">Utfört av</label><input id="vk-worker" placeholder="Namn"></div><div><label for="vk-status">Slutstatus</label><select id="vk-status"><option value="Ej färdig">Ej färdig</option><option value="Godkänd">Godkänd</option><option value="Behöver åtgärd">Behöver åtgärd</option><option value="Ur drift">Ur drift</option></select></div></div>
      <label for="vk-notes">Utförda kontroller och åtgärder</label><textarea id="vk-notes" placeholder="Beskriv vad som kontrollerats och åtgärdats"></textarea>
      <div class="vk-actions"><button type="button" class="btn primary" id="vk-save">Spara på denna enhet</button><button type="button" class="btn secondary" id="vk-print-btn">Skriv ut / spara PDF</button></div>
      <p class="vk-hint">Observera: den här första versionen lagrar protokoll lokalt i webbläsaren, inte i Supabase. Protokoll synkroniseras inte mellan enheter och kan försvinna om webbläsardata rensas.</p>
      <h3>Sparade lokala protokoll</h3><div id="vk-history" class="vk-hint">Inga sparade protokoll.</div>
    </div>`;
  main.insertBefore(section, main.querySelector('.footer-note'));
  const printArea = document.createElement('div'); printArea.id = 'vk-print'; document.body.appendChild(printArea);
  let answers = [], parts = [];
  const field = id => $(id).value;
  function refreshModels() { $('vk-model').innerHTML = options(models[field('vk-brand')][field('vk-kind')]); $('vk-parts-help').textContent = 'Kontrollera modellspecifik sprängskiss och artikelnummer mot tillverkarens katalog. Inga artikelnummer är verifierade i denna första version.'; }
  function renderQuestions(){
    const flow=flows[field('vk-symptom')];
    $('vk-questions').innerHTML = flow.questions.map((a,i) => `<div class="vk-qa"><strong>${i+1}. ${esc(a.q)}</strong><select data-vk-question="${i}"><option value="">Välj svar</option><option value="Ja">Ja</option><option value="Nej">Nej</option><option value="Ej kontrollerat">Ej kontrollerat</option></select><div class="vk-result" id="vk-answer-${i}" hidden></div></div>`).join('') + `<div class="vk-alert">Kontrollera alltid tillverkarens säkerhetsanvisningar. Stäng av motorn före demontering och låt heta delar svalna. Skärutrustning som rör sig på tomgång måste åtgärdas innan maskinen används.</div>`;
    answers=flow.questions.map(q=>({question:q.q,answer:'',recommendation:''}));
    $('vk-questions').querySelectorAll('[data-vk-question]').forEach(el => el.addEventListener('change', () => {
      const i=Number(el.dataset.vkQuestion), a=flow.questions[i], v=el.value;
      const note=v==='Ja'?a.yes:v==='Nej'?a.no:v==='Ej kontrollerat'?'Gör denna kontroll innan du drar slutsatser.':'';
      answers[i]={question:a.q,answer:v,recommendation:note};
      const dest=$('vk-answer-'+i);dest.hidden=!note;dest.textContent=note;
    }));
  }
  function renderParts(){ $('vk-parts-list').innerHTML=parts.length?`<table><thead><tr><th>Reservdel</th><th>Artikelnummer</th><th>Antal</th><th></th></tr></thead><tbody>${parts.map((p,i)=>`<tr><td>${esc(p.name)}</td><td>${esc(p.number||'Ej angivet')}</td><td>${p.qty}</td><td><button type="button" class="btn secondary" data-vk-del="${i}">Ta bort</button></td></tr>`).join('')}</tbody></table>`:'<p class="vk-hint">Inga reservdelar tillagda.</p>'; $('vk-parts-list').querySelectorAll('[data-vk-del]').forEach(b=>b.addEventListener('click',()=>{parts.splice(Number(b.dataset.vkDel),1);renderParts()})); }
  function report(){return {date:field('vk-date'),brand:field('vk-brand'),kind:field('vk-kind'),model:field('vk-model'),serial:field('vk-serial').trim(),symptom:flows[field('vk-symptom')].label,worker:field('vk-worker').trim(),status:field('vk-status'),notes:field('vk-notes').trim(),answers:answers.filter(a=>a.answer),parts:parts.slice()};}
  function renderPrint(r){printArea.innerHTML=`<h1>Verkstadskollen – verkstadsprotokoll</h1><p><strong>Datum:</strong> ${esc(r.date)}<br><strong>Maskin:</strong> ${esc(r.brand)} ${esc(r.model)} (${esc(r.kind)})<br><strong>Serienummer:</strong> ${esc(r.serial||'Ej angivet')}<br><strong>Symtom:</strong> ${esc(r.symptom)}<br><strong>Utfört av:</strong> ${esc(r.worker||'Ej angivet')}<br><strong>Slutstatus:</strong> ${esc(r.status)}</p><h2>Felsökning</h2>${r.answers.length?r.answers.map(a=>`<p><strong>${esc(a.question)}</strong><br>Svar: ${esc(a.answer)}<br>Föreslagen kontroll: ${esc(a.recommendation)}</p>`).join(''):'<p>Ingen felsökning dokumenterad.</p>'}<h2>Reservdelar</h2>${r.parts.length?`<table><tr><th>Del</th><th>Artikelnummer</th><th>Antal</th></tr>${r.parts.map(p=>`<tr><td>${esc(p.name)}</td><td>${esc(p.number||'Ej angivet')}</td><td>${p.qty}</td></tr>`).join('')}</table>`:'<p>Inga reservdelar noterade.</p>'}<h2>Utförda åtgärder / anteckningar</h2><p>${esc(r.notes||'Inget angivet')}</p><p><small>Felsökningsförslagen är generella och ersätter inte modellens verkstadshandbok.</small></p>`;}
  function getHistory(){try{const rows=JSON.parse(localStorage.getItem(STORAGE)||'[]');return Array.isArray(rows)?rows:[]}catch{return []}}
  function renderHistory(){const rows=getHistory(); $('vk-history').innerHTML=rows.length?rows.slice(0,30).map((r,i)=>`<div class="service-item"><strong>${esc(r.date)} – ${esc(r.brand)} ${esc(r.model)}</strong><div class="vk-hint">${esc(r.symptom)} · ${esc(r.status)}</div><button type="button" class="btn secondary" data-vk-history="${i}" style="margin-top:8px">Visa / skriv ut</button></div>`).join(''):'Inga sparade protokoll på denna enhet.'; $('vk-history').querySelectorAll('[data-vk-history]').forEach(b=>b.addEventListener('click',()=>{const r=getHistory()[Number(b.dataset.vkHistory)];if(!r)return;renderPrint(r);window.print()})); }
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id==='verkstadskollen'));
    document.querySelectorAll('header nav button').forEach(b=>b.classList.toggle('active',b===btn));
  });
  $('vk-brand').addEventListener('change',refreshModels);
  $('vk-kind').addEventListener('change',refreshModels);
  $('vk-start').addEventListener('click',renderQuestions);
  $('vk-reset').addEventListener('click',()=>{answers=[];parts=[];renderParts();$('vk-questions').textContent='Välj ett problem och tryck Starta felsökning.';$('vk-notes').value='';$('vk-part').value='';$('vk-part-number').value='';$('vk-status').value='Ej färdig';});
  $('vk-add-part').addEventListener('click',()=>{const name=field('vk-part').trim(),number=field('vk-part-number').trim(),qty=Number(field('vk-part-qty'));if(!name){alert('Ange reservdelens namn.');return}if(!Number.isInteger(qty)||qty<1){alert('Antalet måste vara minst 1.');return}parts.push({name,number,qty});$('vk-part').value='';$('vk-part-number').value='';$('vk-part-qty').value='1';renderParts()});
  $('vk-save').addEventListener('click',()=>{const r=report();try{localStorage.setItem(STORAGE,JSON.stringify([r,...getHistory()].slice(0,100)));renderHistory();alert('Protokollet har sparats lokalt på denna enhet.')}catch(e){alert('Kunde inte spara lokalt. Skriv ut protokollet i stället.')}});
  $('vk-print-btn').addEventListener('click',()=>{renderPrint(report());window.print()});
  $('vk-date').value=new Date().toLocaleDateString('sv-SE');
  refreshModels();renderParts();renderHistory();
})();
