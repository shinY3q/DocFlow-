(function(){
  var C = window.DOCFLOW_CONFIG;
  var params = new URLSearchParams(location.search);
  var source = params.get("utm_source") || params.get("src") || (document.referrer ? (function(){ try { return new URL(document.referrer).hostname; } catch(e){ return "referral"; } })() : "direct");
  function track(name, p){ try{ gtag("event", name, Object.assign({source:source}, p||{})); }catch(e){} try{ window.clarity && clarity("event", name); }catch(e){} }
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* CTA_click */
  document.querySelectorAll("[data-cta]").forEach(function(a){
    a.addEventListener("click", function(){ track("CTA_click", {cta_location:a.dataset.cta}); });
  });

  /* Тарифи (fake door) */
  var planLabels = {base_10000:"Базовий, 10 000 грн/міс", business_20000:"Бізнес, 20 000 грн/міс"};
  document.querySelectorAll("[data-plan]").forEach(function(b){
    b.addEventListener("click", function(){
      track("pricing_click", {plan:b.dataset.plan});
      track("CTA_click", {cta_location:"pricing_"+b.dataset.plan});
      document.getElementById("f-plan").value = b.dataset.plan;
      document.getElementById("planName").textContent = planLabels[b.dataset.plan];
      document.getElementById("planLine").hidden = false;
      document.querySelectorAll(".plan").forEach(function(p){ p.classList.remove("pick"); });
      b.closest(".plan").classList.add("pick");
      document.getElementById("join").scrollIntoView({behavior: reduce ? "auto" : "smooth"});
      setTimeout(function(){ document.getElementById("f-email").focus({preventScroll:true}); }, reduce ? 0 : 600);
    });
  });

  /* FAQ */
  document.querySelectorAll("details summary").forEach(function(s){
    s.addEventListener("click", function(){ if(!s.parentElement.open) track("faq_open", {question:s.textContent.slice(0,60)}); });
  });

  /* Демо: рядок таблиці -> документ */
  var rows = [
    {name:"Коваленко О. П.", dog:"ІН-20417", sum:"1\u00A0240,00", tpl:"Претензія",
     tail:"Просимо погасити її протягом 10 календарних днів з дня отримання претензії."},
    {name:"ТОВ «Весна»", dog:"ЮО-3308", sum:"18\u00A0960,50", tpl:"Заява про видачу судового наказу",
     tail:"Прострочення перевищує 90 днів, тому матеріали передано юристу для звернення до суду в порядку наказного провадження."},
    {name:"Мельник І. В.", dog:"ІН-19872", sum:"612,00", tpl:"Нагадування",
     tail:"Нагадуємо про необхідність сплатити заборгованість найближчим часом, щоб уникнути нарахування пені."}
  ];
  var demoUsed = false;

  /* Труба «таблиця → документ» праворуч: будується за реальними позиціями карток і перераховується при зміні розміру */
  var stage = document.getElementById("stage"), sheetCard = document.querySelector(".sheet"), docCard = document.querySelector(".docwrap");
  var pipe = document.getElementById("pipe"), pipeRb = document.getElementById("pipeRb"), pipeFlow = document.getElementById("pipeFlow");
  // три варіації вигину — по одній на кожного в таблиці: зміщення проміжних точок хвилі в частках амплітуди
  var BENDS = [[.7, 1, .7], [1, -1, 1], [-1, 0, 1]];              // дуга, хвиля, S-вигин
  var wave = BENDS[0].slice(), geo = null, running = false;
  var morph = null, flow = null, queued = false, target = null;
  function pipeGeo(){
    var T = parseFloat(getComputedStyle(pipe).getPropertyValue("--t")) || 30, W = stage.clientWidth;
    var gut = W - (docCard.offsetLeft + docCard.offsetWidth);      // вільна смуга праворуч від документа
    var c = W - Math.max(gut / 2, T / 2 + 2);                      // вісь труби посередині смуги
    var yEnd = docCard.offsetTop + Math.min(docCard.offsetHeight * .45, 190);
    var R = Math.min(46, gut * .6);                                // радіус повороту в документ
    return {W:W, H:stage.clientHeight, c:c, R:R, yEnd:yEnd,
      A:Math.max(0, Math.min(20, gut / 2 - T / 2 - 3)),            // амплітуда хвилі не виходить за смугу
      y0:sheetCard.offsetTop + sheetCard.offsetHeight - 40,        // старт схований під таблицею
      y1:yEnd - R};
  }
  function pipeD(g, w){
    var n = w.length + 1, L = (g.y1 - g.y0) / n;
    var d = "M " + g.c + " " + g.y0, px = g.c, py = g.y0;
    for(var i = 1; i <= n; i++){
      // вертикальні дотичні в кожній точці дають плавну хвилю; остання точка на осі, щоб рівно увійти в поворот
      var x = g.c + g.A * (i < n ? w[i - 1] : 0), y = g.y0 + i * L;
      d += " C " + px + " " + (py + L / 2) + " " + x + " " + (y - L / 2) + " " + x + " " + y;
      px = x; py = y;
    }
    var k = .5523 * g.R;
    d += " C " + g.c + " " + (g.y1 + k) + " " + (g.c - g.R + k) + " " + g.yEnd + " " + (g.c - g.R) + " " + g.yEnd;
    return d + " L " + (g.c - g.R - 80) + " " + g.yEnd;           // кінець схований під документом
  }
  function drawPipe(){
    if(!geo) geo = pipeGeo();
    var d = pipeD(geo, wave);
    pipe.setAttribute("viewBox", "0 0 " + geo.W + " " + geo.H);
    pipeRb.setAttribute("d", d); pipeFlow.setAttribute("d", d);
  }
  function ease(t){ return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  /* Один цикл анімації на дві незалежні речі:
     morph — труба перетікає до вигину обраної людини (новий клік стартує з поточної форми, без стрибка);
     flow  — по трубі біжать три порції даних; документ оновлюється, коли вони доходять.
     Клік під час перекачки не обриває її: документ отримає останнього обраного, а якщо дані вже дійшли — одразу піде наступна порція */
  var HEAD = 16 + 22 + 16 + 22 + 16;
  function startFlow(){
    flow = {t0:null, dur:950, arrived:false, len:pipeRb.getTotalLength()};
    pipeFlow.setAttribute("stroke-dasharray", "16 22 16 22 16 " + (flow.len + HEAD).toFixed(1));
    pipeFlow.setAttribute("stroke-dashoffset", HEAD);
    pipeFlow.style.opacity = 1;
  }
  function tick(ts){
    if(morph){
      if(morph.t0 === null) morph.t0 = ts;
      var km = Math.min(1, (ts - morph.t0) / morph.dur), em = ease(km);
      wave = morph.from.map(function(v, j){ return v + (morph.to[j] - v) * em; });
      if(km >= 1) morph = null;
    }
    drawPipe();
    if(flow){
      if(flow.t0 === null) flow.t0 = ts;
      var kf = Math.min(1, (ts - flow.t0) / flow.dur);
      pipeFlow.setAttribute("stroke-dashoffset", (HEAD - ease(kf) * (flow.len + HEAD)).toFixed(1));
      if(!flow.arrived && kf > .82){ flow.arrived = true; fillDoc(target); }
      if(kf >= 1){
        flow = null;
        if(queued){ queued = false; startFlow(); } else { pipeFlow.style.opacity = 0; }
      }
    }
    if(morph || flow){ requestAnimationFrame(tick); } else { running = false; }
  }
  function send(r, i){
    target = r;
    if(reduce){ wave = BENDS[i].slice(); geo = null; drawPipe(); fillDoc(r); return; }
    morph = {from:wave.slice(), to:BENDS[i], t0:null, dur:900};
    if(!flow) startFlow();
    else if(flow.arrived) queued = true;                           // інакше поточна порція сама донесе нового адресата
    if(!running){ running = true; geo = pipeGeo(); requestAnimationFrame(tick); }
  }
  drawPipe();
  function redraw(){ if(!running){ geo = null; drawPipe(); } }
  if(window.ResizeObserver){ new ResizeObserver(redraw).observe(stage); } else { window.addEventListener("resize", redraw); }

  function show(i){
    var r = rows[i];
    document.querySelectorAll("#demoTable tbody tr").forEach(function(tr){ tr.classList.toggle("on", +tr.dataset.i === i); });
    document.getElementById("fxRef").textContent = "B" + (i + 2);
    document.getElementById("fxVal").textContent = r.name;
    send(r, i);
  }
  function fillDoc(r){
    var set = {name:r.name, dog:r.dog, sum:r.sum, no:r.dog + "/П"};
    document.querySelectorAll("#demoDoc .f").forEach(function(f){
      f.dataset.v = set[f.dataset.k];
      if(!marks.checked){ f.textContent = set[f.dataset.k]; }
      f.classList.add("flash"); setTimeout(function(){ f.classList.remove("flash"); }, 500);
    });
    document.getElementById("docTitle").textContent = r.tpl;
    document.getElementById("tplName").textContent = r.tpl;
    document.getElementById("docTail").textContent = r.tail;
  }
  function used(kind){ if(!demoUsed){ demoUsed = true; track("demo_interaction", {kind:kind}); } }
  document.querySelectorAll("#demoTable tbody tr").forEach(function(tr){
    tr.addEventListener("click", function(){ show(+tr.dataset.i); used("row"); });
    tr.addEventListener("keydown", function(e){ if(e.key === "Enter" || e.key === " "){ e.preventDefault(); show(+tr.dataset.i); used("row"); } });
  });
  var marks = document.getElementById("marks");
  document.querySelectorAll("#demoDoc .f").forEach(function(f){ f.dataset.v = f.textContent; });

  /* Фіксуємо висоту документа під найдовший варіант, щоб hero не стрибав при кліку по рядках */
  var docEl = document.getElementById("demoDoc"), barEl = document.querySelector(".doc-bar");
  function lockDocHeight(){
    var t = document.getElementById("docTitle"), tail = document.getElementById("docTail"), tpl = document.getElementById("tplName");
    var keep = [t.textContent, tail.textContent, tpl.textContent], hDoc = 0, hBar = 0;
    docEl.style.minHeight = barEl.style.minHeight = "";
    rows.forEach(function(r){
      t.textContent = tpl.textContent = r.tpl; tail.textContent = r.tail;
      hDoc = Math.max(hDoc, docEl.offsetHeight); hBar = Math.max(hBar, barEl.offsetHeight);
    });
    t.textContent = keep[0]; tail.textContent = keep[1]; tpl.textContent = keep[2];
    docEl.style.minHeight = hDoc + "px"; barEl.style.minHeight = hBar + "px";
  }
  lockDocHeight();
  var lockT; window.addEventListener("resize", function(){ clearTimeout(lockT); lockT = setTimeout(lockDocHeight, 150); });
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(lockDocHeight);
  marks.addEventListener("change", function(){
    document.getElementById("demoDoc").classList.toggle("marks", marks.checked);
    document.querySelectorAll("#demoDoc .f").forEach(function(f){ f.textContent = marks.checked ? f.dataset.m : f.dataset.v; });
    used("marks");
  });

  /* Форма -> Google Forms */
  var form = document.getElementById("leadForm");
  form.addEventListener("submit", function(e){
    e.preventDefault();
    var err = document.getElementById("formErr");
    var emailEl = document.getElementById("f-email");
    var email = emailEl.value.trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)){ err.textContent = "Вкажіть email у форматі name@company.ua"; emailEl.focus(); return; }
    err.textContent = "";
    var btn = document.getElementById("submitBtn"); btn.disabled = true; btn.firstChild.textContent = "Надсилаємо… ";
    var role = document.getElementById("f-role").value, volume = document.getElementById("f-volume").value, plan = document.getElementById("f-plan").value || "none";
    var fd = new FormData();
    fd.append(C.ENTRY.email, email);
    fd.append(C.ENTRY.name, document.getElementById("f-name").value.trim());
    fd.append(C.ENTRY.role, role);
    fd.append(C.ENTRY.volume, volume);
    fd.append(C.ENTRY.plan, plan);
    fd.append(C.ENTRY.source, source);
    function done(){
      track("email_submit", {role:role || "n/a", volume:volume || "n/a", plan:plan});
      track("generate_lead", {});
      var share = location.origin + location.pathname + "?utm_source=referral";
      document.getElementById("shareUrl").textContent = location.protocol.indexOf("http") === 0 ? share : "посилання з'явиться після публікації";
      form.hidden = true; document.getElementById("okBox").hidden = false;
    }
    if(!C.GOOGLE_FORM_ACTION){ console.warn("DocFlow: GOOGLE_FORM_ACTION не налаштовано, заявку не збережено"); done(); return; }
    fetch(C.GOOGLE_FORM_ACTION, {method:"POST", mode:"no-cors", body:fd})
      .then(done)
      .catch(function(){ btn.disabled = false; btn.firstChild.textContent = "Отримати ранній доступ "; err.textContent = "Не вдалося надіслати. Перевірте з'єднання й спробуйте ще раз."; });
  });

  /* Поділитися */
  document.getElementById("copyBtn").addEventListener("click", function(){
    var t = document.getElementById("shareUrl").textContent, b = this;
    track("share_copy", {});
    if(navigator.clipboard){ navigator.clipboard.writeText(t).then(function(){ b.textContent = "Скопійовано"; }, function(){ b.textContent = "Виділіть і скопіюйте"; }); }
  });

  /* Дійшов до форми */
  if("IntersectionObserver" in window){
    var seen = false;
    new IntersectionObserver(function(en){ en.forEach(function(x){ if(x.isIntersecting && !seen){ seen = true; track("reached_form", {}); } }); }, {threshold:.4}).observe(document.getElementById("join"));
  }
})();
