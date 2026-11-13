/* Verkstadskollen v1.8.2 – stegvis beslutsstöd. Fristående tillägg.
   Ingen AI, ingen fotografering, ingen Supabase-ändring. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const workflows={
  no_start:{start:'fuel', nodes:{
   fuel:{q:'Finns det färskt bränsle av rätt typ och mängd i tanken?',yes:'procedure',no:'fuel_fix'},
   fuel_fix:{end:'Åtgärd: Töm vid behov och fyll korrekt bränsle enligt modellens bruksanvisning. Prova därefter normal startprocedur.'},
   procedure:{q:'Har rätt startprocedur följts (stoppkontakt, choke och primer enligt manualen)?',yes:'fire',no:'procedure_fix'},
   procedure_fix:{end:'Åtgärd: Kontrollera rätt startprocedur i bruksanvisningen och gör nytt försök. Undvik upprepade startförsök som kan sura ner motorn.'},
   fire:{q:'Tänder motorn till vid något startförsök?',yes:'filter',no:'plug'},
   plug:{q:'Är tändstiftet korrekt monterat och ser det helt, rent och torrt ut?',yes:'spark',no:'plug_fix'},
   plug_fix:{end:'Åtgärd: Kontrollera orsaken till vått, smutsigt eller skadat tändstift. Rengör eller byt till rätt typ enligt manualen. Kontrollera även bränslesystemet.'},
   spark:{end:'Nästa kontroll: Undersök stoppfunktion, tändsystem och bränsletillförsel med avsett testverktyg och rätt verkstadshandbok. Att motorn inte tänder bevisar inte ensamt ett tändfel.'},
   filter:{q:'Är luftfiltret rent och torrt?',yes:'fuelpath',no:'filter_fix'},
   filter_fix:{end:'Åtgärd: Rengör eller byt luftfilter enligt manualen. Undersök varför filtret blivit vått eller oljigt.'},
   fuelpath:{end:'Nästa kontroll: Undersök bränslefilter, slangar, primer och förgasarens bränsletillförsel. Bekräfta felet före byte av delar.'}
  }},
  idle:{start:'idle_even',nodes:{
   idle_even:{q:'Går motorn jämnt innan den stannar?',yes:'throttle',no:'filter'},
   filter:{q:'Är luftfiltret rent och torrt?',yes:'fuel',no:'filter_fix'},
   filter_fix:{end:'Åtgärd: Rengör eller byt luftfilter enligt manualen och kontrollera orsaken till eventuell olja eller bensin i filtret.'},
   fuel:{end:'Nästa kontroll: Kontrollera bränslekvalitet, bränslefilter, slangar och insug efter läckage. Granska förgasaren först efter grundkontrollerna.'},
   throttle:{q:'Återgår gasreglage och gasvajer helt utan att kärva?',yes:'rpm',no:'throttle_fix'},
   throttle_fix:{end:'Säkerhetsåtgärd: Stäng av motorn. Åtgärda kärvande gasmekanism innan provkörning. Maskinen ska inte användas förrän gasen återgår korrekt.',stop:true},
   rpm:{q:'Har tomgångsvarvtalet kontrollerats mot exakt modellspecifikation?',yes:'idle_more',no:'rpm_fix'},
   rpm_fix:{end:'Nästa kontroll: Mät tomgångsvarvtalet med rätt instrument och jämför med maskinens specifikation. Justera inte H/L på måfå.'},
   idle_more:{end:'Nästa kontroll: Kontrollera bränsletillförsel, insugssystem och förgasarens funktion enligt rätt verkstadshandbok.'}
  }},
  cutting:{start:'stops',nodes:{
   stops:{q:'Rör sig klingan eller kedjan fortfarande när motorn går på tomgång?',yes:'stop_now',no:'check_safe'},
   stop_now:{q:'Återgår gasreglaget hela vägen till viloläge?',yes:'rpm',no:'throttle'},
   throttle:{end:'Ta maskinen ur drift. Stäng av motorn och åtgärda gasvajer, länkage eller returfjäder innan fortsatt provning.',stop:true},
   rpm:{q:'Är tomgångsvarvtalet kontrollerat och korrekt för just denna modell?',yes:'clutch',no:'rpm_fix'},
   rpm_fix:{end:'Ta maskinen ur drift tills tomgången kontrollerats med varvräknare och justerats enligt manualen. Klinga/kedja får inte drivas på tomgång.',stop:true},
   clutch:{end:'Ta maskinen ur drift. Misstänk koppling eller kopplingsfjädrar; kontrollera enligt verkstadshandbok innan maskinen används.',stop:true},
   check_safe:{end:'Kontrollera även att stoppfunktion och säkerhetsutrustning fungerar. Dokumentera därefter slutkontrollen.'}
  }},
  power:{start:'filter',nodes:{
   filter:{q:'Är luftfiltret rent och korrekt monterat?',yes:'fuel',no:'filter_fix'},
   filter_fix:{end:'Åtgärd: Rengör eller byt luftfilter enligt manualen. Provkör först efter återmontering.'},
   fuel:{q:'Är bränslet färskt och av rätt typ/blandning?',yes:'cooling',no:'fuel_fix'},
   fuel_fix:{end:'Åtgärd: Fyll rätt bränsle enligt bruksanvisningen och kontrollera bränslesystemets skick.'},
   cooling:{q:'Är kylflänsar och luftintag fria från beläggningar?',yes:'further',no:'cooling_fix'},
   cooling_fix:{end:'Stäng av maskinen och låt den svalna innan rengöring av kylsystemet.'},
   further:{end:'Nästa kontroll: Tändstift, bränsletillförsel och avgasväg enligt verkstadshandbok. Misstänkta motorfel kräver mätning innan delar byts.'}
  }},
  other:{start:'damage',nodes:{
   damage:{q:'Finns synliga skador, läckage eller lösa delar?',yes:'damage_fix',no:'safety'},
   damage_fix:{end:'Dokumentera bristerna. Bedöm om maskinen måste tas ur drift och åtgärda innan användning.',stop:true},
   safety:{q:'Fungerar stoppknapp, skydd och gasreglage korrekt?',yes:'routine',no:'stop'},
   stop:{end:'Ta maskinen ur drift tills säkerhetsbristerna åtgärdats.',stop:true},
   routine:{end:'Gå igenom tillverkarens ordinarie servicekontroller och dokumentera utförda åtgärder.'}
  }}
 };
 let history=[],flowKey='',nodeKey='';
 function init(){
  const start=$('vk-start'),symptom=$('vk-symptom'),notes=$('vk-notes'),questionTarget=$('vk-questions');
  if(!start||!symptom||!notes||!questionTarget||$('vk-guided'))return;
  const panel=document.createElement('div');panel.id='vk-guided';
  panel.style.cssText='border:1px solid #475569;border-radius:12px;padding:16px;background:#16243a;margin-bottom:14px';
  questionTarget.parentElement.insertBefore(panel,questionTarget);
  const style=document.createElement('style');style.textContent='#vk-guided .vk-guide-btn{padding:12px 18px;border:0;border-radius:10px;font-weight:800;cursor:pointer;background:#f59e0b;color:#111827;min-width:100px}#vk-guided .vk-guide-btn.secondary{background:#334155;color:white}#vk-guided .vk-guide-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:15px}#vk-guided .vk-guide-question{font-size:1.09rem;font-weight:750;line-height:1.5}#vk-guided .vk-guide-result{padding:12px;border-left:4px solid #f59e0b;background:#292315;border-radius:6px;line-height:1.5}#vk-guided .vk-guide-result.stop{border-left-color:#ef4444;background:#421d23}';document.head.append(style);
  function render(){
   const wf=workflows[flowKey],node=wf?.nodes[nodeKey];
   if(!node){panel.textContent='Ingen guide startad.';return;}
   panel.replaceChildren();
   const title=document.createElement('h3');title.textContent='Frågeguide – en kontroll i taget';title.style.margin='0 0 8px';panel.append(title);
   const counter=document.createElement('p');counter.textContent='Besvarade frågor: '+history.length;counter.style.cssText='color:#cbd5e1;font-size:.85rem';panel.append(counter);
   const content=document.createElement('div');content.className=node.end?'vk-guide-result'+(node.stop?' stop':''):'vk-guide-question';content.textContent=node.end||node.q;panel.append(content);
   const actions=document.createElement('div');actions.className='vk-guide-actions';panel.append(actions);
   const make=(label,handler,secondary=false)=>{const b=document.createElement('button');b.type='button';b.className='vk-guide-btn'+(secondary?' secondary':'');b.textContent=label;b.onclick=handler;actions.append(b)};
   if(node.q){
    make('Ja',()=>choose('Ja',node.yes));make('Nej',()=>choose('Nej',node.no));
    make('Inte kontrollerat',()=>{const p=document.createElement('p');p.className='vk-guide-result';p.textContent='Utför eller dokumentera kontrollen innan du fortsätter. Inget svar har registrerats.';content.after(p);},true);
   }else{
    make('Lägg i protokoll',()=>{
     const brand=$('vk-brand').value,model=$('vk-model').value;
     const summary='Felsökningsguide ('+brand+' '+model+', '+symptom.selectedOptions[0].text+'): \n'+history.map((h,i)=>(i+1)+'. '+h.question+' — '+h.answer).join('\n')+'\nBedömning: '+node.end;
     notes.value=(notes.value.trim()?notes.value.trim()+'\n\n':'')+summary;
     notes.scrollIntoView({behavior:'smooth',block:'center'});
     alert('Felsökningen har lagts till i anteckningarna. Spara verkstadsprotokollet för att behålla den.');
    });
   }
   make('Börja om',()=>begin(),true);
   const info=document.createElement('p');info.style.cssText='font-size:.85rem;color:#cbd5e1;margin-top:15px';info.textContent='Vägledande kontroller – ingen automatisk diagnos. Följ tillverkarens anvisningar. Stäng av motorn före demontering.';panel.append(info);
  }
  function choose(answer,next){const wf=workflows[flowKey];history.push({question:wf.nodes[nodeKey].q,answer});nodeKey=next;render();}
  function begin(){flowKey=symptom.value;history=[];nodeKey=workflows[flowKey]?.start||'';render();questionTarget.querySelectorAll('.vk-qa').forEach(el=>el.hidden=true);}
  start.addEventListener('click',()=>setTimeout(begin,0));
  $('vk-reset')?.addEventListener('click',()=>{history=[];panel.textContent='Välj ett problem och tryck Starta felsökning.';});
  panel.textContent='Välj ett problem och tryck Starta felsökning.';
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
