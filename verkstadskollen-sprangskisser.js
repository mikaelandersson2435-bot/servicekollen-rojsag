/* Verkstadskollen: officiellt reservdelsunderlag, fristående tillägg. v1.8.1 */
(() => {
 'use strict';
 const CATALOGS = {
   'Husqvarna|545 FR': {url:'https://www.husqvarna.com/se/support/grastrimmer-och-buskrojare/545fr/', label:'Husqvarna 545FR – sprängskiss och reservdelar'},
   'Husqvarna|545 FX': {url:'https://www.husqvarna.com/se/support/545fx/', label:'Husqvarna 545FX – sprängskiss och reservdelar'},
   'Husqvarna|550 XP': {url:'https://www.husqvarna.com/se/support/motorsag/550xp/',label:'Husqvarna 550XP – sprängskiss och reservdelar'},
   'Husqvarna|550 XP Mark II': {url:'https://www.husqvarna.com/se/support/motorsag/550xp-mark-ii/',label:'Husqvarna 550XP Mark II – sprängskiss och reservdelar'}
 };
 const STIHL = 'https://www.stihl.se/sv/service-evenemang/faq/stihl-faq/produktsortiment-faq';
 const HUSQVARNA = 'https://www.husqvarna.com/se/support/';
 function run() {
   const brand = document.getElementById('vk-brand');
   const model = document.getElementById('vk-model');
   const kind = document.getElementById('vk-kind');
   const help = document.getElementById('vk-parts-help');
   if(!brand || !model || !kind || !help) return false;
   if(document.getElementById('vk-catalog-tools'))return true;
   const box = document.createElement('div');
   box.id='vk-catalog-tools';
   box.style.cssText='margin:14px 0;padding:15px;border:1px solid #475569;border-radius:12px;background:#1e293b;color:#f8fafc;';
   const heading=document.createElement('h3');heading.textContent='Sprängskisser och originalreservdelar';heading.style.margin='0 0 9px';
   const description=document.createElement('p');description.style.cssText='color:#cbd5e1;margin:0 0 10px';
   const link=document.createElement('a');link.target='_blank';link.rel='noopener noreferrer';link.style.cssText='display:block;padding:13px 12px;background:#f59e0b;color:#111827;font-weight:800;border-radius:10px;text-decoration:none;text-align:center;';
   const note=document.createElement('p');note.style.cssText='font-size:0.86rem;color:#cbd5e1;margin:10px 0 0';
   box.append(heading,description,link,note);
   help.insertAdjacentElement('afterend',box);
   function update(){
     const b=brand.value, m=model.value, entry=CATALOGS[b+'|'+m];
     if(entry){
       description.textContent='Öppna tillverkarens modellsida och välj ”Sprängskiss” under Handböcker och dokument. Läs av positionsnummer och artikelnummer där.';
       link.href=entry.url;link.textContent='Visa sprängskiss för '+m+' ↗';
       note.textContent='Kontrollera artikel-/serienummer och utförande innan du beställer. Artikelnummer förs därefter in i reservdelsformuläret.';
     }else if(b==='STIHL'){
       description.textContent='STIHL hänvisar reservdelsbeställningar till auktoriserade återförsäljare. Vi har inte verifierat en offentlig sprängskiss för denna modell.';
       link.href=STIHL;link.textContent='STIHL – reservdelar och återförsäljare ↗';
       note.textContent='Uppge '+m+' och maskinens serienummer för att få rätt sprängskiss och artikelnummer av återförsäljaren.';
     }else{
       description.textContent='Ingen kontrollerad direktlänk är inlagd för denna modell ännu. Sök modellen på tillverkarens support och välj rätt variant.';
       link.href=HUSQVARNA;link.textContent='Husqvarna – sök sprängskiss ↗';
       note.textContent='Använd inte artikelnummer från en liknande modell utan att kontrollera kompatibiliteten.';
     }
   }
   [brand,kind,model].forEach(el=>el.addEventListener('change',()=>setTimeout(update,0)));
   update();return true;
 }
 if(!run())document.addEventListener('DOMContentLoaded',run,{once:true});
})();
