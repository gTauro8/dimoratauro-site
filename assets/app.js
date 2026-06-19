/* ============================================================
   Dimora Tauro — app.js
   i18n · hero · drawer · reviews · gallery · booking · tweaks
   ============================================================ */
(function(){
  "use strict";
  const $  = (s,c=document)=>c.querySelector(s);
  const $$ = (s,c=document)=>Array.from(c.querySelectorAll(s));
  const LS_LANG="dt_lang";
  const LS_COOKIE="dt_cookie_consent";

  /* ---------------- i18n ---------------- */
  const DICT=window.I18N, LANGS=window.LANGS;
  let lang = localStorage.getItem(LS_LANG) || "it";
  if(!DICT[lang]) lang="it";

  function t(key){ return (DICT[lang] && DICT[lang][key]) || (DICT.it[key]) || key; }

  function applyLang(l){
    lang = DICT[l] ? l : "it";
    localStorage.setItem(LS_LANG, lang);
    document.documentElement.lang = lang;

    $$("[data-i18n]").forEach(el=>{ el.textContent = t(el.getAttribute("data-i18n")); });
    $$("[data-i18n-html]").forEach(el=>{ el.innerHTML = t(el.getAttribute("data-i18n-html")); });
    const tt=$("title[data-i18n]"); if(tt) document.title=t("meta.title");
    ["#bkIn","#bkOut"].forEach(sel=>{
      const input=$(sel);
      if(input) input.placeholder=t("bk.pickDate");
    });

    // current label
    $("#langCur").textContent = lang.toUpperCase();
    $$("#langMenu .lang__opt").forEach(b=>b.setAttribute("aria-current", b.dataset.code===lang));
    $$("#footLang button, #drawerLang button").forEach(b=>b.setAttribute("aria-current", b.dataset.code===lang));

    buildReviews();
    syncCookieLabels();
    if(bkShown) renderBooking(); // keep results translated
  }

  function buildLangMenus(){
    const menu=$("#langMenu");
    menu.innerHTML = LANGS.map(L=>`<button class="lang__opt" role="menuitem" data-code="${L.code}">
      <span class="lang__flag">${L.flag}</span><span>${L.label}</span></button>`).join("");
    $("#footLang").innerHTML = LANGS.map(L=>`<button data-code="${L.code}">${L.code.toUpperCase()}</button>`).join("");
    $("#drawerLang").innerHTML = LANGS.map(L=>`<button data-code="${L.code}">${L.code.toUpperCase()}</button>`).join("");
    document.addEventListener("click",e=>{
      const opt=e.target.closest("[data-code]");
      if(opt){ applyLang(opt.dataset.code); closeLang(); }
    });
  }

  /* ---------------- Lang dropdown ---------------- */
  const langWrap=$("#lang");
  function closeLang(){ langWrap.dataset.open="false"; $("#langBtn").setAttribute("aria-expanded","false"); }
  $("#langBtn").addEventListener("click",e=>{
    e.stopPropagation();
    const open=langWrap.dataset.open==="true";
    langWrap.dataset.open=String(!open);
    $("#langBtn").setAttribute("aria-expanded",String(!open));
  });
  document.addEventListener("click",e=>{ if(!langWrap.contains(e.target)) closeLang(); });

  /* ---------------- Header scroll ---------------- */
  const head=$("#head");
  const onScroll=()=>{ head.classList.toggle("is-solid", window.scrollY>30); };
  onScroll(); window.addEventListener("scroll",onScroll,{passive:true});

  /* ---------------- Drawer ---------------- */
  const drawer=$("#drawer");
  $("#burger").addEventListener("click",()=>{ drawer.classList.add("is-open"); document.body.style.overflow="hidden"; });
  $$("[data-close-drawer]").forEach(b=>b.addEventListener("click",()=>{ drawer.classList.remove("is-open"); document.body.style.overflow=""; }));

  /* ---------------- Hero slideshow ---------------- */
  const slides=$$(".hero__slide");
  const dotsWrap=$("#heroDots");
  let hi=0, heroTimer=null;
  slides.forEach((_,i)=>{
    const d=document.createElement("button");
    d.className="hero__dot"+(i===0?" is-active":"");
    d.addEventListener("click",()=>goHero(i,true));
    dotsWrap.appendChild(d);
  });
  function goHero(i,manual){
    slides[hi].classList.remove("is-active");
    dotsWrap.children[hi]?.classList.remove("is-active");
    hi=(i+slides.length)%slides.length;
    slides[hi].classList.add("is-active");
    dotsWrap.children[hi]?.classList.add("is-active");
    if(manual) restartHero();
  }
  function startHero(){
    stopHero();
    const mode=document.body.dataset.hero;
    if(mode==="photo") return;            // static
    const interval = mode==="video" ? 6500 : 5200;
    heroTimer=setInterval(()=>goHero(hi+1),interval);
  }
  function stopHero(){ if(heroTimer){clearInterval(heroTimer);heroTimer=null;} }
  function restartHero(){ startHero(); }

  /* ---------------- Reviews ---------------- */
  let revIdx=0, revTimer=null;
  function buildReviews(){
    const track=$("#revTrack"), nav=$("#revNav");
    const count=Number(t("rev.count")) || 4;
    const items=Array.from({length:count},(_,i)=>i+1).map(n=>({
      q:t("rev.q"+n),
      name:t(`rev.by${n}.name`),
      from:t(`rev.by${n}.from`),
      url:t(`rev.by${n}.url`)
    }));
    track.innerHTML=items.map((it,i)=>{
      const bits=it.from.split("·").map(s=>s.trim());
      const source=bits[0] || "Booking.com";
      const score=bits[1] || "";
      const date=bits.slice(2).join(" · ");
      return `<figure class="rev__item${i===0?' is-active':''}">
        <div class="rev__top">
          <span class="rev__source">${source}</span>
          ${score ? `<span class="rev__score">${score}</span>` : ""}
        </div>
        <blockquote class="rev__quote">${it.q}</blockquote>
        <figcaption class="rev__by"><b>${it.name}</b>${date ? ` <span>${date}</span>` : ""}</figcaption>
        <a class="rev__link" href="${it.url}" target="_blank" rel="noopener">${t("rev.open")}</a>
      </figure>`;
    }).join("");
    nav.innerHTML=`<button class="rev__arrow" data-r-prev aria-label="Recensione precedente">‹</button>
      <div class="rev__dots">${items.map((_,i)=>`<button class="rev__dot${i===0?' is-active':''}" data-r="${i}" aria-label="Recensione ${i+1}"></button>`).join("")}</div>
      <button class="rev__arrow" data-r-next aria-label="Recensione successiva">›</button>`;
    revIdx=0;
    $("#revNav [data-r-prev]")?.addEventListener("click",()=>goRev(revIdx-1,true));
    $("#revNav [data-r-next]")?.addEventListener("click",()=>goRev(revIdx+1,true));
    $$("#revNav .rev__dot").forEach(d=>d.addEventListener("click",()=>goRev(+d.dataset.r,true)));
    startRev();
  }
  function goRev(i,manual){
    const items=$$("#revTrack .rev__item"), dots=$$("#revNav .rev__dot");
    if(!items.length) return;
    items[revIdx].classList.remove("is-active"); dots[revIdx]?.classList.remove("is-active");
    revIdx=(i+items.length)%items.length;
    items[revIdx].classList.add("is-active"); dots[revIdx]?.classList.add("is-active");
    if(manual){ clearInterval(revTimer); startRev(); }
  }
  function startRev(){ clearInterval(revTimer); revTimer=setInterval(()=>goRev(revIdx+1),6000); }

  /* ---------------- Cookie consent ---------------- */
  const cookieBanner=$("#cookieBanner");
  const cookiePrefs=$("#cookiePrefs");
  const cookieAnalytics=$("#cookieAnalytics");
  const cookieMarketing=$("#cookieMarketing");
  const cookieCustomize=$("[data-cookie-customize]");
  const cookieSave=$("[data-cookie-save]");
  const cookieAccept=$("[data-cookie-accept]");
  const cookieReject=$("[data-cookie-reject]");
  function readCookieConsent(){
    try{return JSON.parse(localStorage.getItem(LS_COOKIE)||"null");}catch(e){return null;}
  }
  function writeCookieConsent(consent){
    localStorage.setItem(LS_COOKIE,JSON.stringify({
      necessary:true,
      analytics:!!consent.analytics,
      marketing:!!consent.marketing,
      updatedAt:new Date().toISOString()
    }));
    if(typeof gtag==="function") gtag("consent","update",{
      analytics_storage:consent.analytics?"granted":"denied",
      ad_storage:consent.marketing?"granted":"denied"
    });
    document.documentElement.dataset.cookies="set";
    if(cookieBanner) cookieBanner.classList.remove("is-open");
  }
  function openCookiePrefs(){
    const saved=readCookieConsent();
    if(cookieAnalytics) cookieAnalytics.checked=!!saved?.analytics;
    if(cookieMarketing) cookieMarketing.checked=!!saved?.marketing;
    if(cookieBanner) cookieBanner.classList.add("is-open");
    if(cookiePrefs) cookiePrefs.hidden=false;
    if(cookieSave) cookieSave.hidden=false;
    if(cookieCustomize) cookieCustomize.hidden=true;
  }
  function syncCookieLabels(){
    const saved=readCookieConsent();
    if(saved) document.documentElement.dataset.cookies="set";
  }
  function initCookieConsent(){
    const saved=readCookieConsent();
    if(saved){
      document.documentElement.dataset.cookies="set";
      if(typeof gtag==="function") gtag("consent","update",{
        analytics_storage:saved.analytics?"granted":"denied",
        ad_storage:saved.marketing?"granted":"denied"
      });
    }
    else if(cookieBanner) cookieBanner.classList.add("is-open");
    cookieReject?.addEventListener("click",()=>writeCookieConsent({analytics:false,marketing:false}));
    cookieAccept?.addEventListener("click",()=>writeCookieConsent({analytics:true,marketing:true}));
    cookieCustomize?.addEventListener("click",openCookiePrefs);
    cookieSave?.addEventListener("click",()=>writeCookieConsent({
      analytics:cookieAnalytics?.checked,
      marketing:cookieMarketing?.checked
    }));
    $$("[data-cookie-settings]").forEach(btn=>btn.addEventListener("click",openCookiePrefs));
  }

  /* ---------------- Gallery lightbox ---------------- */
  const lb=$("#lightbox"), lbImg=$("#lbImg"), lbCount=$("#lbCount");
  const cells=$$("#gal .gal__cell");
  const gallery=cells.map(c=>({src:c.dataset.full, alt:$("img",c)?.alt||""}));
  let lbi=0;
  cells.forEach((c,i)=>c.addEventListener("click",()=>openLB(i)));
  function openLB(i){ lbi=i; showLB(); lb.classList.add("is-open"); document.body.style.overflow="hidden"; }
  function showLB(){ const g=gallery[lbi]; lbImg.src=g.src; lbImg.alt=g.alt; lbCount.textContent=`${lbi+1} / ${gallery.length}`; }
  function lbStep(d){ lbi=(lbi+d+gallery.length)%gallery.length; showLB(); }
  $("[data-lb-close]").addEventListener("click",closeLB);
  $("[data-lb-prev]").addEventListener("click",()=>lbStep(-1));
  $("[data-lb-next]").addEventListener("click",()=>lbStep(1));
  lb.addEventListener("click",e=>{ if(e.target===lb) closeLB(); });
  function closeLB(){ lb.classList.remove("is-open"); document.body.style.overflow=""; }

  /* ---------------- Booking modal (AvaiBook handoff) ---------------- */
  const modal=$("#booking");
  let bkShown=false;
  const AVAIBOOK={
    ownerCode:"99974",
    accommodationCode:"391581",
    accommodationCodes:{
      ciliegio:"",
      melograno:"",
      mandarino:"",
      fico:""
    },
    ownerReference:"dimora-tauro-site"
  };
  const ROOMS=[
    {id:"ciliegio",img:"assets/img/ciliegio.webp",cap:2},
    {id:"melograno",img:"assets/img/melograno.webp",cap:2},
    {id:"mandarino",img:"assets/img/mandarino.webp",cap:4},
    {id:"fico",img:"assets/img/fico.webp",cap:2}
  ];
  const AVAI_LANG={it:"it",en:"en",de:"de",fr:"fr"};
  const fmtDate=d=>new Intl.DateTimeFormat(lang==="it"?"it-IT":lang,{day:"2-digit",month:"short",year:"numeric"}).format(d);
  const toISO=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const fromISO=v=>{
    const d=new Date(`${v}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const dateValue=sel=>$(sel).dataset.iso||"";
  function buildAvaiBookUrl(){
    const wantRoom=$("#bkRoom").value;
    const inV=dateValue("#bkIn"), outV=dateValue("#bkOut");
    const guests=$("#bkGuests").value;
    const roomCode=AVAIBOOK.accommodationCodes[wantRoom] || AVAIBOOK.accommodationCode;
    if(!roomCode) return "";
    const avaiLang=AVAI_LANG[lang]||"it";
    const params=new URLSearchParams();
    params.set("cod_alojamiento",roomCode);
    if(inV && outV){
      params.set("f_ini",inV);
      params.set("f_fin",outV);
    }
    if(guests){
      params.set("capacidad",guests);
      params.set("adults",guests);
    }
    params.set("referencia_propietario",AVAIBOOK.ownerReference);
    params.set("lang",avaiLang);
    return `https://www.avaibook.com/reservas/nueva_reserva.php?${params.toString()}`;
  }
  function openBooking(room){
    if(room && room!=="true" && $("#bkRoom").querySelector(`[value="${room}"]`)) $("#bkRoom").value=room;
    modal.classList.add("is-open"); bkShown=true; document.body.style.overflow="hidden";
    if(searched) renderBooking();
  }
  function closeBooking(){ modal.classList.remove("is-open"); bkShown=false; document.body.style.overflow=""; }
  $$("[data-close-booking]").forEach(b=>b.addEventListener("click",closeBooking));
  modal.addEventListener("click",e=>{ if(e.target===modal) closeBooking(); });

  let searched=false;
  function renderBooking(){
    const res=$("#bkResults"), summ=$("#bkSummary");
    if(!searched){ res.innerHTML=""; summ.classList.add("show"); summ.textContent=t("bk.summary"); return; }
    summ.classList.remove("show");
    const guests=+$("#bkGuests").value, wantRoom=$("#bkRoom").value;
    const inV=dateValue("#bkIn"), outV=dateValue("#bkOut");
    let nights=0;
    if(inV&&outV){ nights=Math.max(0,Math.round((new Date(outV)-new Date(inV))/864e5)); }
    let list=ROOMS.filter(r=>r.cap>=guests && (wantRoom==="any"||wantRoom===r.id));
    if(!list.length) list=ROOMS.filter(r=>wantRoom==="any"||wantRoom===r.id);
    const NW={it:["notte","notti"],en:["night","nights"],de:["Nacht","Nächte"],fr:["nuit","nuits"]};
    const nw=(NW[lang]||NW.it)[nights===1?0:1];
    const nightsLabel = nights ? ` · ${nights} ${nw}` : "";
    const avaiUrl=buildAvaiBookUrl();
    const action=avaiUrl
      ? `<a class="btn btn--fill btn--wide" href="${avaiUrl}" target="_blank" rel="noopener">${t("bk.continue")}</a>`
      : `<button class="btn btn--ink btn--wide" type="button" disabled>${t("bk.needsConfig")}</button>`;
    res.innerHTML=`<div style="font-size:11.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--graphite-soft);margin-bottom:2px">${t("bk.results")}${nightsLabel}</div>`+
    list.map(r=>{
      return `<div class="bk-card">
        <img src="${r.img}" alt="">
        <div class="bk-card__info"><b>${t("room."+r.id+".name")}</b><span>${t("room."+r.id+".type")}</span></div>
        <div class="bk-card__status"><small>${t("bk.status")}</small></div>
      </div>`;
    }).join("")+`<div class="bk-action">${action}</div>`;
  }
  $("#bkSearch").addEventListener("click",()=>{ searched=true; renderBooking(); });
  ["#bkIn","#bkOut","#bkGuests","#bkRoom"].forEach(sel=>{
    $(sel).addEventListener("change",()=>{ if(searched) renderBooking(); });
  });

  /* ---------------- Booking calendar ---------------- */
  const cal=document.createElement("div");
  cal.className="bk-cal";
  document.body.appendChild(cal);
  let calTarget=null;
  let calMonth=new Date();

  function setBookingDate(input,date){
    input.dataset.iso=toISO(date);
    input.value=fmtDate(date);
    input.dispatchEvent(new Event("change",{bubbles:true}));
  }
  function openCalendar(input){
    calTarget=input;
    const selected=fromISO(input.dataset.iso);
    calMonth=selected || new Date();
    renderCalendar();
    const r=input.getBoundingClientRect();
    const calWidth=Math.min(320, window.innerWidth-28);
    const left=Math.max(14, Math.min(r.left, window.innerWidth-calWidth-14));
    cal.style.left=`${left}px`;
    cal.style.top=`${r.bottom+10+window.scrollY}px`;
    cal.classList.add("is-open");
  }
  function closeCalendar(){ cal.classList.remove("is-open"); calTarget=null; }
  function renderCalendar(){
    if(!calTarget) return;
    const year=calMonth.getFullYear(), month=calMonth.getMonth();
    const first=new Date(year,month,1);
    const start=new Date(first);
    start.setDate(first.getDate()-((first.getDay()+6)%7));
    const today=new Date(); today.setHours(0,0,0,0);
    const min=calTarget.id==="bkOut" && dateValue("#bkIn") ? fromISO(dateValue("#bkIn")) : today;
    if(calTarget.id==="bkOut" && min) min.setDate(min.getDate()+1);
    if(min) min.setHours(0,0,0,0);
    const selected=dateValue(`#${calTarget.id}`);
    const inISO=dateValue("#bkIn"), outISO=dateValue("#bkOut");
    const locale=lang==="it"?"it-IT":lang;
    const monthNames=Array.from({length:12},(_,i)=>new Intl.DateTimeFormat(locale,{month:"long"}).format(new Date(year,i,1)));
    const yearStart=today.getFullYear();
    const yearEnd=Math.max(yearStart+10,year+2);
    const yearOptions=Array.from({length:yearEnd-yearStart+1},(_,i)=>yearStart+i);
    const days=["L","M","M","G","V","S","D"];
    const cells=[];
    for(let i=0;i<42;i++){
      const d=new Date(start); d.setDate(start.getDate()+i);
      const iso=toISO(d);
      const disabled=d<min;
      const muted=d.getMonth()!==month;
      const inRange=inISO && outISO && iso>inISO && iso<outISO;
      cells.push(`<button type="button" class="bk-cal__day${muted?" is-muted":""}${selected===iso?" is-selected":""}${inRange?" is-range":""}" data-date="${iso}" ${disabled?"disabled":""}>${d.getDate()}</button>`);
    }
    cal.innerHTML=`<div class="bk-cal__head">
      <button type="button" data-cal-prev aria-label="Mese precedente">‹</button>
      <div class="bk-cal__jump">
        <select data-cal-month aria-label="Mese">${monthNames.map((name,i)=>`<option value="${i}" ${i===month?"selected":""}>${name}</option>`).join("")}</select>
        <select data-cal-year aria-label="Anno">${yearOptions.map(y=>`<option value="${y}" ${y===year?"selected":""}>${y}</option>`).join("")}</select>
      </div>
      <button type="button" data-cal-next aria-label="Mese successivo">›</button>
    </div>
    <div class="bk-cal__yearnav">
      <button type="button" data-cal-prev-year ${year<=yearStart?"disabled":""}>Anno precedente</button>
      <button type="button" data-cal-next-year>Anno successivo</button>
    </div>
    <div class="bk-cal__week">${days.map(d=>`<span>${d}</span>`).join("")}</div>
    <div class="bk-cal__grid">${cells.join("")}</div>`;
  }
  ["#bkIn","#bkOut"].forEach(sel=>{
    const input=$(sel);
    input.addEventListener("click",()=>openCalendar(input));
    input.addEventListener("focus",()=>openCalendar(input));
  });
  cal.addEventListener("click",e=>{
    const prev=e.target.closest("[data-cal-prev]");
    const next=e.target.closest("[data-cal-next]");
    const prevYear=e.target.closest("[data-cal-prev-year]");
    const nextYear=e.target.closest("[data-cal-next-year]");
    const day=e.target.closest("[data-date]");
    if(prev){ calMonth.setMonth(calMonth.getMonth()-1); renderCalendar(); return; }
    if(next){ calMonth.setMonth(calMonth.getMonth()+1); renderCalendar(); return; }
    if(prevYear && !prevYear.disabled){ calMonth.setFullYear(calMonth.getFullYear()-1); renderCalendar(); return; }
    if(nextYear){ calMonth.setFullYear(calMonth.getFullYear()+1); renderCalendar(); return; }
    if(day && calTarget){
      const picked=fromISO(day.dataset.date);
      setBookingDate(calTarget,picked);
      if(calTarget.id==="bkIn"){
        const out=fromISO(dateValue("#bkOut"));
        if(!out || out<=picked){
          const nextDay=new Date(picked); nextDay.setDate(nextDay.getDate()+1);
          setBookingDate($("#bkOut"),nextDay);
        }
      }
      closeCalendar();
    }
  });
  cal.addEventListener("change",e=>{
    const monthSel=e.target.closest("[data-cal-month]");
    const yearSel=e.target.closest("[data-cal-year]");
    if(monthSel){ calMonth.setMonth(+monthSel.value); renderCalendar(); }
    if(yearSel){ calMonth.setFullYear(+yearSel.value); renderCalendar(); }
  });
  document.addEventListener("click",e=>{
    if(!cal.contains(e.target) && !e.target.closest(".bk-date")) closeCalendar();
  });
  window.addEventListener("resize",closeCalendar);

  /* ---------------- Generic open-booking triggers ---------------- */
  document.addEventListener("click",e=>{
    const el=e.target.closest("[data-open-booking]");
    if(el){ e.preventDefault(); openBooking(el.getAttribute("data-open-booking")); }
  });

  /* ---------------- Esc key ---------------- */
  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"){ closeBooking(); closeLB(); closeLang(); closeRG(); drawer.classList.remove("is-open"); document.body.style.overflow=lb.classList.contains("is-open")||modal.classList.contains("is-open")||rgEl.classList.contains("is-open")?"hidden":""; }
    if(lb.classList.contains("is-open")){ if(e.key==="ArrowLeft")lbStep(-1); if(e.key==="ArrowRight")lbStep(1); }
    if(rgEl.classList.contains("is-open")){ if(e.key==="ArrowLeft")rgStep(-1); if(e.key==="ArrowRight")rgStep(1); }
  });

  /* ---------------- Reveal on scroll ---------------- */
  const io=new IntersectionObserver((ents)=>{
    ents.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target);} });
  },{threshold:.12, rootMargin:"0px 0px -8% 0px"});
  $$(".reveal").forEach(el=>io.observe(el));

  /* ---------------- Year ---------------- */
  $("#yr").textContent=new Date().getFullYear();

  /* ============================================================
     TWEAKS PANEL (vanilla, host-protocol compliant)
     ============================================================ */
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "accent": "terracotta",
    "hero": "slideshow",
    "headline": "cormorant"
  }/*EDITMODE-END*/;
  const LS_TWK="dt_tweaks";
  const ACCENTS={
    terracotta:["#C2714F","#A85B3C"],
    olive:["#6B7C4E","#56653E"],
    adriatic:["#5B8FA8","#4A7A92"]
  };
  const SERIFS={
    cormorant:'"Cormorant Garamond", Georgia, serif',
    playfair:'"Playfair Display", Georgia, serif'
  };
  let TWK={...TWEAK_DEFAULTS, ...(JSON.parse(localStorage.getItem(LS_TWK)||"{}"))};

  function applyTweaks(){
    const a=ACCENTS[TWK.accent]||ACCENTS.terracotta;
    document.documentElement.style.setProperty("--accent",a[0]);
    document.documentElement.style.setProperty("--accent-deep",a[1]);
    document.documentElement.style.setProperty("--serif",SERIFS[TWK.headline]||SERIFS.cormorant);
    document.body.dataset.hero = TWK.hero;
    startHero();
  }
  function setTweak(k,v){
    TWK[k]=v;
    localStorage.setItem(LS_TWK,JSON.stringify(TWK));
    try{ window.parent.postMessage({type:"__edit_mode_set_keys",edits:{[k]:v}},"*"); }catch(e){}
    applyTweaks(); syncTweakUI();
  }

  // build panel
  const panel=document.createElement("div");
  panel.className="dt-twk"; panel.style.display="none";
  panel.innerHTML=`
    <div class="dt-twk__hd"><b>Tweaks</b><button class="dt-twk__x" aria-label="Chiudi">✕</button></div>
    <div class="dt-twk__body">
      <div class="dt-twk__sect">Colore accento</div>
      <div class="dt-twk__sw" data-grp="accent">
        <button data-v="terracotta" title="Terracotta" style="--c:#C2714F"></button>
        <button data-v="olive" title="Verde ulivo" style="--c:#6B7C4E"></button>
        <button data-v="adriatic" title="Azzurro Adriatico" style="--c:#5B8FA8"></button>
      </div>
      <div class="dt-twk__sect">Stile hero</div>
      <div class="dt-twk__seg" data-grp="hero">
        <button data-v="photo">Foto</button>
        <button data-v="slideshow">Slideshow</button>
        <button data-v="video">Video</button>
      </div>
      <div class="dt-twk__sect">Font dei titoli</div>
      <div class="dt-twk__seg" data-grp="headline">
        <button data-v="cormorant" style="font-family:'Cormorant Garamond',serif;font-size:15px">Cormorant</button>
        <button data-v="playfair" style="font-family:'Playfair Display',serif;font-size:15px">Playfair</button>
      </div>
    </div>`;
  document.getElementById("tweaks-root").appendChild(panel);

  const style=document.createElement("style");
  style.textContent=`
    .dt-twk{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:248px;
      background:rgba(251,248,240,.86);backdrop-filter:blur(20px) saturate(160%);
      border:.5px solid rgba(255,255,255,.6);border-radius:14px;color:#2E2E2B;
      box-shadow:0 12px 40px rgba(46,46,43,.22);font-family:"DM Sans",system-ui,sans-serif;overflow:hidden}
    .dt-twk__hd{display:flex;align-items:center;justify-content:space-between;padding:12px 12px 10px 16px}
    .dt-twk__hd b{font-size:13px;font-weight:600;letter-spacing:.04em}
    .dt-twk__x{border:0;background:transparent;color:#9a978c;width:24px;height:24px;border-radius:6px;font-size:13px}
    .dt-twk__x:hover{background:rgba(0,0,0,.06);color:#2E2E2B}
    .dt-twk__body{padding:0 16px 16px;display:flex;flex-direction:column;gap:8px}
    .dt-twk__sect{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#9a978c;padding-top:8px}
    .dt-twk__sw{display:flex;gap:10px}
    .dt-twk__sw button{width:36px;height:36px;border-radius:50%;border:2px solid transparent;background:var(--c);
      cursor:pointer;transition:.2s;outline-offset:2px}
    .dt-twk__sw button[aria-current="true"]{border-color:#2E2E2B;transform:scale(1.06)}
    .dt-twk__seg{display:flex;background:rgba(0,0,0,.06);border-radius:9px;padding:3px;gap:2px}
    .dt-twk__seg button{flex:1;border:0;background:transparent;border-radius:6px;padding:7px 4px;font:inherit;
      font-size:12px;font-weight:500;color:#6b685f;cursor:pointer;transition:.2s}
    .dt-twk__seg button[aria-current="true"]{background:#fff;color:#2E2E2B;box-shadow:0 1px 3px rgba(0,0,0,.12)}
  `;
  document.head.appendChild(style);

  function syncTweakUI(){
    $$(".dt-twk__sw[data-grp], .dt-twk__seg[data-grp]",panel).forEach(grp=>{
      const key=grp.dataset.grp;
      $$("button",grp).forEach(b=>b.setAttribute("aria-current",String(b.dataset.v===TWK[key])));
    });
  }
  panel.addEventListener("click",e=>{
    const b=e.target.closest("[data-v]"); if(!b) return;
    const grp=b.closest("[data-grp]"); setTweak(grp.dataset.grp,b.dataset.v);
  });
  $(".dt-twk__x",panel).addEventListener("click",()=>{
    panel.style.display="none";
    try{ window.parent.postMessage({type:"__edit_mode_dismissed"},"*"); }catch(e){}
  });
  window.addEventListener("message",e=>{
    const ty=e?.data?.type;
    if(ty==="__activate_edit_mode") panel.style.display="";
    else if(ty==="__deactivate_edit_mode") panel.style.display="none";
  });
  try{ window.parent.postMessage({type:"__edit_mode_available"},"*"); }catch(e){}

  /* ---------------- Room gallery ---------------- */
  const ROOM_GAL={
    ciliegio:{name:"Ciliegio",color:"#B23A4A",images:[
      "assets/img/ciliegio/004E187B-826C-4328-BB87-E25B7923ADD6_1_105_c.jpeg",
      "assets/img/ciliegio/1C858122-4387-49AF-8D7A-FDF120BCCCDF_1_105_c.jpeg",
      "assets/img/ciliegio/6D32562D-8943-4670-902C-61CE65D1F62D_1_105_c.jpeg",
      "assets/img/ciliegio/DDE5F58A-0BD2-4448-A245-5C94023A328A_1_105_c.jpeg",
      "assets/img/ciliegio/FCB5C546-3285-40F4-BED3-E442248C44A3_1_105_c.jpeg"
    ]},
    melograno:{name:"Melograno",color:"#A14C5C",images:[
      "assets/img/melograno/39965D42-44D7-4A9F-994A-650F85146D70_1_105_c.jpeg",
      "assets/img/melograno/5A5AA190-5F7E-4663-B219-57229E0CC6CD_1_105_c.jpeg",
      "assets/img/melograno/8F9F1999-57C3-4CF3-8A2A-ADAB632EE354_1_105_c.jpeg",
      "assets/img/melograno/908950AE-0094-46B6-B7C6-9EA184613161_1_105_c.jpeg",
      "assets/img/melograno/94C2754A-D431-44D5-B99D-71164CCBDA83_1_105_c.jpeg",
      "assets/img/melograno/B5531A80-0A13-4589-A8DC-8C86F44E3687_1_105_c.jpeg",
      "assets/img/melograno/E5D114C5-44A4-41AE-9B55-93C94780D121_1_105_c.jpeg",
      "assets/img/melograno/FD2816C2-9C84-4753-ACAA-BE84C72B9DD8_1_105_c.jpeg"
    ]},
    mandarino:{name:"Mandarino",color:"#D98A3D",images:[
      "assets/img/mandarino/2BF982EB-B46B-431A-99B9-5B6B99BEA573_1_105_c.jpeg",
      "assets/img/mandarino/3D1F4E98-3E9C-4B34-8058-D15DA9A2DB7B_1_105_c.jpeg",
      "assets/img/mandarino/3D65F52B-1405-4397-AE84-E23EF44B5CC1_1_105_c.jpeg",
      "assets/img/mandarino/50008C99-41E3-4BC4-8EBC-F7FC8BBE34B0_1_105_c.jpeg",
      "assets/img/mandarino/75ACE19F-4085-4791-8460-DD7E8B4D2A30_1_105_c.jpeg",
      "assets/img/mandarino/9485273C-4939-4F3E-A079-F9CE90ABFED6_1_105_c.jpeg",
      "assets/img/mandarino/AAEAF55B-2D87-41ED-A520-CE0A5E2A1DDC_1_105_c.jpeg",
      "assets/img/mandarino/BB02D867-A811-490F-A96B-C6168A42E058_1_105_c.jpeg"
    ]},
    fico:{name:"Fico",color:"#5E7150",images:[
      "assets/img/fico/012A4AF5-037E-4B74-9A73-D0928BEAA864_1_105_c.jpeg",
      "assets/img/fico/11917173-96DB-485F-9724-BB20BC95CDE4_1_105_c.jpeg",
      "assets/img/fico/276BC54C-333E-4E91-BB73-4A236C013215_1_105_c.jpeg",
      "assets/img/fico/2D551F0B-9459-41FD-8EF1-37976753EE75_1_105_c.jpeg",
      "assets/img/fico/49A61A97-7939-4507-9F61-24FB4669A954_1_105_c.jpeg",
      "assets/img/fico/BD1DEAAE-AC9E-4C8A-9ACC-B8F19230ADDF_1_105_c.jpeg",
      "assets/img/fico/E969058E-6F23-4CE9-ABD1-D23382104238_1_105_c.jpeg",
      "assets/img/fico/EF4E9321-F9FB-45DD-B79B-DE3C5CE42DC8_1_105_c.jpeg"
    ]}
  };
  const rgEl=$("#roomGal");
  let rgRoom=null, rgIdx=0, rgTouchSX=0;

  function openRG(id){
    const room=ROOM_GAL[id]; if(!room) return;
    rgRoom=room; rgIdx=0;
    rgEl.style.setProperty("--rg-c",room.color);
    $("#rgDot").style.background=room.color;
    $("#rgName").textContent=room.name;
    buildRGStrip();
    showRGImg();
    rgEl.classList.add("is-open");
    document.body.style.overflow="hidden";
  }
  function closeRG(){
    rgEl.classList.remove("is-open");
    document.body.style.overflow="";
  }
  function showRGImg(){
    const img=$("#rgImg");
    const src=rgRoom.images[rgIdx];
    img.classList.add("rg-fade");
    img.onload=img.onerror=()=>img.classList.remove("rg-fade");
    img.src=src;
    if(img.complete) img.classList.remove("rg-fade");
    img.alt=rgRoom.name+" — foto "+(rgIdx+1);
    $("#rgCount").textContent=(rgIdx+1)+" / "+rgRoom.images.length;
    $$(".rg__thumb",rgEl).forEach((t,i)=>t.classList.toggle("is-active",i===rgIdx));
    const active=$(".rg__thumb.is-active",rgEl);
    if(active) active.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"});
  }
  function rgStep(d){
    if(!rgRoom) return;
    rgIdx=(rgIdx+d+rgRoom.images.length)%rgRoom.images.length;
    showRGImg();
  }
  function buildRGStrip(){
    const strip=$("#rgStrip");
    strip.innerHTML=rgRoom.images.map((src,i)=>
      `<button class="rg__thumb${i===0?" is-active":""}" data-rg-i="${i}"><img src="${src}" alt="${rgRoom.name} ${i+1}" loading="lazy"></button>`
    ).join("");
  }
  document.addEventListener("click",e=>{
    const el=e.target.closest("[data-open-gallery]");
    if(el){ e.stopPropagation(); openRG(el.dataset.openGallery); }
  });
  $$("[data-rg-close]").forEach(b=>b.addEventListener("click",closeRG));
  rgEl.addEventListener("click",e=>{ if(e.target===rgEl) closeRG(); });
  $("#rgStrip").addEventListener("click",e=>{
    const t=e.target.closest("[data-rg-i]");
    if(t){ rgIdx=+t.dataset.rgI; showRGImg(); }
  });
  $("#rgPrev").addEventListener("click",()=>rgStep(-1));
  $("#rgNext").addEventListener("click",()=>rgStep(1));
  $("#rgStage").addEventListener("touchstart",e=>{ rgTouchSX=e.touches[0].clientX; },{passive:true});
  $("#rgStage").addEventListener("touchend",e=>{
    const dx=e.changedTouches[0].clientX-rgTouchSX;
    if(Math.abs(dx)>44) rgStep(dx<0?1:-1);
  },{passive:true});

  /* ---------------- Init ---------------- */
  buildLangMenus();
  applyTweaks();
  syncTweakUI();
  initCookieConsent();
  applyLang(lang);
  startHero();
})();
