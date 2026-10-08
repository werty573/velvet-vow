/* Velvet & Vow: concept site by Portside Digital */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const SVGNS = "http://www.w3.org/2000/svg";
  const form = document.querySelector("#eqForm");
  const fmt = (n) => Math.round(n).toLocaleString("en-US");

  // seeded random so the illustrated room looks the same on every visit
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const rr = (a, b) => a + rnd() * (b - a);
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(SVGNS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };

  /* ---------- toast + demo buttons ---------- */
  const toast = $("#toast");
  let tt;
  const say = (msg) => {
    toast.textContent = msg;
    toast.classList.add("on");
    clearTimeout(tt);
    tt = setTimeout(() => toast.classList.remove("on"), msg.length > 120 ? 6500 : 3400);
  };
  document.addEventListener("click", (e) => {
    const d = e.target.closest(".demo");
    if (d) { e.preventDefault(); say(d.dataset.msg); }
  });

  /* ---------- smooth scroll ---------- */
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  scrollTo(0, 0);
  gsap.registerPlugin(ScrollTrigger);
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const goTo = (target) => {
    const t = typeof target === "string" ? $(target) : target;
    if (!t) return;
    if (lenis) lenis.scrollTo(t, { offset: -10, duration: 1.6 });
    else t.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  };
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.classList.contains("demo")) return;
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    e.preventDefault();
    goTo(id === "#top" ? document.body : id);
  });

  /* ---------- nav + dock ---------- */
  const nav = $("#nav"), dock = $(".dock");
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY;
    nav.classList.toggle("solid", y > innerHeight * 1.2);
    nav.classList.toggle("hide", y > lastY && y > innerHeight * 2.4);
    dock.classList.toggle("on", y > innerHeight * 1.4);
    lastY = y;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- hero: curtains + cold sparks ---------- */
  const sparksCanvas = $("#heroSparks");
  const sparks = makeSparks(sparksCanvas);
  if (!reduced) {
    gsap.set(".c-left, .c-right", { scaleX: 1 });
    gsap.from(".curtain-title > *", { y: 40, opacity: 0, duration: 1.4, ease: "power3.out", stagger: 0.15, delay: 0.2 });
    gsap.from(".c-left", { xPercent: -6, duration: 1.8, ease: "power2.out" });
    gsap.from(".c-right", { xPercent: 6, duration: 1.8, ease: "power2.out" });

    const htl = gsap.timeline({
      scrollTrigger: {
        trigger: ".hero-wrap", start: "top top", end: "bottom bottom", scrub: 0.8,
        onUpdate: (st) => sparks.setActive(st.progress > 0.45 && st.progress < 0.995),
      },
    });
    htl.to(".curtain-title", { opacity: 0, y: -80, scale: 0.92, duration: 0.25, ease: "none" }, 0)
       .to(".c-left", { scaleX: () => (innerWidth < 760 ? 0.05 : 0.13), skewY: 2, duration: 0.6, ease: "power2.inOut" }, 0.05)
       .to(".c-right", { scaleX: () => (innerWidth < 760 ? 0.05 : 0.13), skewY: -2, duration: 0.6, ease: "power2.inOut" }, 0.05)
       .to(".tie", { opacity: 1, duration: 0.1 }, 0.5)
       .to(".hero-img", { scale: 1, duration: 0.8, ease: "power1.out" }, 0)
       .fromTo(".hero-copy", { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, 0.48)
       .to(".valance", { yPercent: -100, duration: 0.25 }, 0.75)
       .to(".c-left", { xPercent: -100, duration: 0.25 }, 0.75)
       .to(".c-right", { xPercent: 100, duration: 0.25 }, 0.75);
  } else {
    sparks.setActive(true);
  }

  function makeSparks(cv) {
    const ctx = cv.getContext("2d");
    let W = 0, H = 0, dpr = 1, active = false, visible = true, running = false;
    const P = [];
    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    addEventListener("resize", size);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe(cv);
    const emit = (x) => {
      const k = H / 900;
      P.push({ x, y: H + 4, px: x, py: H + 4, vx: rr(-1.1, 1.1), vy: -rr(10, 16.5) * k, g: 0.2 * k, life: 0, max: rr(50, 85), l: rr(70, 96) });
    };
    const frame = () => {
      if (!(visible && (active || P.length))) { running = false; ctx.clearRect(0, 0, W, H); return; }
      if (active) {
        const n = W < 700 ? 3 : 5;
        for (let i = 0; i < n; i++) { emit(W * 0.07 + rr(-6, 6)); emit(W * 0.93 + rr(-6, 6)); }
      }
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i];
        p.px = p.x; p.py = p.y;
        p.vy += p.g; p.x += p.vx; p.y += p.vy; p.life++;
        const a = 1 - p.life / p.max;
        if (a <= 0) { P.splice(i, 1); continue; }
        ctx.strokeStyle = `hsla(${42 + p.l / 10},100%,${p.l}%,${a})`;
        ctx.lineWidth = 1.6 * a + 0.4;
        ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      requestAnimationFrame(frame);
    };
    const kick = () => { if (!running && visible && (active || P.length)) { running = true; requestAnimationFrame(frame); } };
    return { setActive(v) { active = v; kick(); } };
  }

  /* ---------- marquee reacts to scroll speed ---------- */
  const track = $(".mq-track");
  if (track && !reduced) {
    let x = 0, boost = 0;
    if (lenis) lenis.on("scroll", (l) => { boost = Math.min(Math.abs(l.velocity) * 0.25, 14); });
    gsap.ticker.add(() => {
      const half = track.scrollWidth / 2;
      x -= 0.6 + boost; boost *= 0.92;
      if (-x >= half) x += half;
      track.style.transform = `translate3d(${x}px,0,0)`;
    });
  }

  /* ---------- statement: words light up ---------- */
  const words = $(".words");
  words.innerHTML = words.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
  if (!reduced) {
    gsap.to(".words .w", { opacity: 1, stagger: 0.08, ease: "none", scrollTrigger: { trigger: words, start: "top 80%", end: "bottom 45%", scrub: true } });
    gsap.from(".stats li", { y: 40, opacity: 0, stagger: 0.12, duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".stats", start: "top 85%" } });
  } else gsap.set(".words .w", { opacity: 1 });

  /* ---------- the room ---------- */
  const stage = $(".room-stage");
  buildRoom();
  function buildRoom() {
    const swags = $("#r-swags");
    for (let i = 0; i < 6; i++) {
      const x = i * 200;
      el("path", { class: "swag", d: `M${x} 0 Q${x + 100} 120 ${x + 200} 0 Q${x + 100} 62 ${x} 0 Z` }, swags);
    }
    for (let i = -1; i < 6; i++) {
      const x = i * 200 + 100;
      el("path", { class: "swag s2", d: `M${x} 0 Q${x + 100} 82 ${x + 200} 0 Q${x + 100} 40 ${x} 0 Z` }, swags);
    }
    const pleats = $("#r-head .pleats");
    for (let x = 404; x < 810; x += 18) el("line", { x1: x, x2: x, y1: 464, y2: 542 }, pleats);

    // guest tables with chiavari chairs
    const guests = $("#r-guests");
    [215, 985].forEach((cx) => {
      const g = el("g", { class: "gtable" }, guests);
      [-84, -42, 0, 42, 84].forEach((dx) => {
        el("path", { class: "chair", d: "M-13 0 V-62 Q-13 -70 -5 -70 H5 Q13 -70 13 -62 V0 M-13 -22 H13 M-13 -40 H13 M-13 -55 H13", transform: `translate(${cx + dx} 596)` }, g);
      });
      el("path", { class: "g-skirt", d: `M${cx - 112} 600 L${cx - 124} 700 Q${cx} 716 ${cx + 124} 700 L${cx + 112} 600 Z` }, g);
      el("ellipse", { class: "g-top", cx, cy: 600, rx: 114, ry: 22 }, g);
    });

    // florals
    const flora = $("#r-flora");
    const cluster = (cx, cy, n, spread, rmin, rmax) => {
      for (let i = 0; i < Math.ceil(n / 2.5); i++) {
        const a = rr(0, Math.PI * 2), d = rr(0.3, 1) * spread;
        el("ellipse", { class: "lf bloom", cx: cx + Math.cos(a) * d * 1.15, cy: cy + Math.sin(a) * d * 0.6, rx: rr(rmin, rmax) * 1.15, ry: rr(rmin, rmax) * 0.5 }, flora);
      }
      for (let i = 0; i < n; i++) {
        const a = rr(0, Math.PI * 2), d = Math.sqrt(rnd()) * spread;
        const c = rnd();
        el("circle", { class: `bloom ${c < 0.45 ? "b1" : c < 0.8 ? "b2" : "b3"}`, cx: cx + Math.cos(a) * d, cy: cy + Math.sin(a) * d * 0.75, r: rr(rmin, rmax) }, flora);
      }
    };
    [300, 900].forEach((x) => el("rect", { class: "stem", x: x - 6, y: 384, width: 12, height: 176, rx: 4 }, flora));
    [215, 985].forEach((x) => el("rect", { class: "stem", x: x - 3, y: 500, width: 6, height: 98, rx: 3 }, flora));
    for (let x = 396; x <= 804; x += 26) cluster(x, 432, 4, 13, 6, 12);
    cluster(342, 186, 22, 44, 8, 17); cluster(858, 186, 22, 44, 8, 17);
    for (let y = 240; y <= 400; y += 40) { cluster(336, y, 5, 16, 5, 10); cluster(864, y, 5, 16, 5, 10); }
    cluster(300, 372, 18, 36, 7, 14); cluster(900, 372, 18, 36, 7, 14);
    cluster(215, 492, 14, 30, 6, 12); cluster(985, 492, 14, 30, 6, 12);

    // uplights
    const ups = $("#r-uplights");
    [30, 175, 330, 870, 1025, 1170].forEach((x) => el("polygon", { class: "uplight", points: `${x - 10},560 ${x + 10},560 ${x + 80},0 ${x - 80},0`, fill: "url(#gUp)" }, ups));

    // chandeliers
    const chs = $("#r-chand");
    [[300, 64, 0.8], [600, 40, 1], [900, 64, 0.8]].forEach(([x, drop, s]) => {
      const g = el("g", { class: "chandelier" }, chs);
      el("line", { class: "chain", x1: x, x2: x, y1: -400, y2: drop }, g);
      el("circle", { class: "glow", cx: x, cy: drop + 40 * s, r: 130 * s, fill: "url(#gGlow)" }, g);
      const w = 62 * s, y = drop + 22 * s;
      el("path", { class: "ch-arm", d: `M${x - w} ${y} Q${x} ${y + 48 * s} ${x + w} ${y}` }, g);
      el("path", { class: "ch-arm", d: `M${x - w * 0.62} ${y + 26 * s} Q${x} ${y + 58 * s} ${x + w * 0.62} ${y + 26 * s}` }, g);
      for (let i = 0; i <= 8; i++) {
        const t = i / 8, cx = x - w + 2 * w * t, cy = y + 48 * s * 2 * t * (1 - t) + 10 * s;
        el("ellipse", { class: "crystal", cx, cy: cy + 6 * s, rx: 3 * s, ry: 7 * s }, g);
        if (i % 2 === 0) el("rect", { class: "crystal", x: cx - 2.5 * s, y: cy - 22 * s, width: 5 * s, height: 12 * s, rx: 1 }, g);
      }
      for (let i = 0; i <= 5; i++) {
        const t = i / 5, cx = x - w * 0.62 + 2 * w * 0.62 * t, cy = y + 26 * s + 32 * s * 2 * t * (1 - t) + 8 * s;
        el("ellipse", { class: "crystal", cx, cy: cy + 8 * s, rx: 3 * s, ry: 8 * s }, g);
      }
      el("ellipse", { class: "crystal", cx: x, cy: y + 72 * s, rx: 5 * s, ry: 13 * s }, g);
    });

    // cold-spark machines
    const sp = $("#r-sparks");
    [345, 855].forEach((x) => {
      for (let i = 0; i < 46; i++) {
        const c = el("circle", { class: "spark", cx: x + rr(-3, 3), cy: 690, r: rr(1.6, 3.4) }, sp);
        c.style.setProperty("--dx", `${rr(-46, 46).toFixed(1)}px`);
        c.style.setProperty("--h", `${-rr(240, 380).toFixed(0)}px`);
        c.style.setProperty("--d", `${rr(0.8, 1.5).toFixed(2)}s`);
        c.style.setProperty("--dl", `${rr(0, 1.5).toFixed(2)}s`);
      }
      el("rect", { class: "machine", x: x - 20, y: 690, width: 40, height: 18, rx: 3 }, sp);
    });
  }

  const caps = [
    "An empty hall. Plain walls, bare floor. Keep scrolling.",
    "Draping first: side panels, ceiling swags and a backdrop for the head table.",
    "The head table, a pair of thrones and a monogram on the dance floor.",
    "Guest tables dressed in linen, ringed with chiavari chairs.",
    "Florals everywhere: a garland on the head table, pedestals, centrepieces.",
    "Chandeliers drop in and the uplights come on.",
    "Fog for the first dance. Cold sparks for the entrance. Now try a new theme ↓",
  ];
  const steps = $$("#roomSteps li"), cap = $("#roomCap");
  let curStep = -1;
  const setStep = (i) => {
    if (i === curStep) return;
    curStep = i;
    steps.forEach((li, k) => { li.classList.toggle("on", k === i); li.classList.toggle("done", k < i); });
    cap.textContent = caps[i];
    stage.classList.toggle("fx-on", i >= 6);
  };

  const rtl = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });
  rtl.addLabel("s0", 0)
    // 1 draping
    .from("#r-drape .panel", { scaleY: 0, duration: 0.7, stagger: 0.1 }, 0.6)
    .from("#r-swags path", { y: -140, duration: 0.6, stagger: 0.025 }, 0.75)
    .from("#r-drape .bd-swag", { opacity: 0, y: -50, duration: 0.4 }, 1.2)
    // 2 head table
    .from("#r-head .dancefloor, #r-head .mono", { opacity: 0, duration: 0.5 }, 1.6)
    .from("#r-head .throne", { scale: 0, transformOrigin: "50% 100%", duration: 0.6, stagger: 0.12, ease: "back.out(1.6)" }, 1.75)
    .from("#r-head .htable", { y: 90, opacity: 0, duration: 0.6 }, 1.9)
    // 3 guests
    .from("#r-guests .gtable", { y: 140, opacity: 0, duration: 0.7, stagger: 0.15 }, 2.6)
    .from("#r-guests .chair", { scaleY: 0, transformOrigin: "50% 100%", duration: 0.4, stagger: 0.04, ease: "back.out(2)" }, 2.9)
    // 4 florals
    .from("#r-flora .stem", { scaleY: 0, transformOrigin: "50% 100%", duration: 0.4, stagger: 0.05 }, 3.6)
    .from("#r-flora .bloom", { scale: 0, duration: 0.35, stagger: { each: 0.0018, from: "random" }, ease: "back.out(2.4)" }, 3.7)
    // 5 lighting
    .to("#r-dim", { opacity: 0.62, duration: 0.6, ease: "none" }, 4.6)
    .to("#r-uplights", { opacity: 1, duration: 0.6, ease: "none" }, 4.75)
    .from("#r-chand .chandelier", { y: -360, duration: 0.7, stagger: 0.12, ease: "back.out(1.3)" }, 4.6)
    .from("#r-chand .glow", { opacity: 0, duration: 0.4 }, 5.1)
    // 6 fog + sparks
    .to("#r-fx", { opacity: 1, duration: 0.6 }, 5.6)
    .to({}, { duration: 0.8 }, 6.2);

  const stepAt = (t) => (t < 0.6 ? 0 : Math.min(6, 1 + Math.floor(t - 0.6)));
  rtl.eventCallback("onUpdate", () => setStep(stepAt(rtl.time())));

  if (!reduced) {
    ScrollTrigger.create({
      trigger: ".room-sec", start: "top top",
      end: () => "+=" + innerHeight * (innerWidth < 760 ? 3.6 : 4.4),
      pin: ".room-pin", scrub: 0.7, animation: rtl, anticipatePin: 1,
    });
  } else { rtl.progress(1); setStep(6); }

  const themeBtns = $$(".themes button");
  const setTheme = (t, fromForm) => {
    stage.dataset.theme = t;
    themeBtns.forEach((b) => b.setAttribute("aria-checked", b.dataset.theme === t));
    if (!fromForm) { form.theme.value = t; preview(); }
  };
  themeBtns.forEach((b) => b.addEventListener("click", () => {
    setTheme(b.dataset.theme);
    if (!reduced) gsap.fromTo(stage, { scale: 0.985 }, { scale: 1, duration: 0.6, ease: "back.out(2)" });
  }));

  /* ---------- packages ---------- */
  const gBtns = $$(".guests button"), pill = $(".g-pill"), priceEl = $("#pkPrice"), perEl = $("#pkPer"), seats = $("#seats"), book = $("#pkBook");
  for (let i = 0; i < 150; i++) seats.appendChild(document.createElement("i"));
  const dots = [...seats.children];
  const pv = { p: 35000 };
  let guestsN = 50;
  const renderPrice = () => {
    priceEl.innerHTML = fmt(pv.p).replace(",", '<span class="cm">,</span>');
    perEl.textContent = "$" + fmt(pv.p / guestsN);
  };
  const pickGuests = (b, instant) => {
    const i = gBtns.indexOf(b);
    gBtns.forEach((x) => x.setAttribute("aria-checked", x === b));
    pill.style.transform = `translateX(${i * 100}%)`;
    guestsN = +b.dataset.g;
    gsap.to(pv, { p: +b.dataset.p, duration: instant || reduced ? 0 : 0.9, ease: "power3.out", onUpdate: renderPrice });
    dots.forEach((d, k) => {
      const on = k < guestsN;
      if (on !== d.classList.contains("on")) {
        if (reduced || instant) d.classList.toggle("on", on);
        else setTimeout(() => d.classList.toggle("on", on), Math.abs(k - (on ? 0 : 150)) * 4);
      }
    });
    book.textContent = `Hold my date for ${guestsN} guests`;
    form.guests.value = String(guestsN);
    form.need.value = "an all-inclusive package";
    preview();
  };
  gBtns.forEach((b) => b.addEventListener("click", () => pickGuests(b)));

  /* ---------- rentals ---------- */
  const quote = new Set();
  const tray = $("#tray"), trayN = $("#trayN"), quoteLine = $("#quoteLine");
  $$(".rn-add").forEach((b) => b.addEventListener("click", () => {
    const item = b.dataset.item;
    const on = !quote.has(item);
    on ? quote.add(item) : quote.delete(item);
    b.classList.toggle("added", on);
    b.innerHTML = on ? '<i class="ph-bold ph-check"></i> Added' : '<i class="ph-bold ph-plus"></i> Add';
    trayN.textContent = quote.size;
    tray.hidden = quote.size === 0;
    tray.classList.remove("bump"); void tray.offsetWidth; tray.classList.add("bump");
    if (on) form.need.value = "décor and rentals only";
    preview();
  }));
  tray.addEventListener("click", () => goTo("#enquire"));

  const mm = gsap.matchMedia();
  if (!reduced) {
    mm.add("(min-width: 900px)", () => {
      const sec = $(".rentals"), trk = $("#rnTrack");
      sec.classList.add("js-pin");
      const dist = () => Math.max(0, trk.scrollWidth - innerWidth);
      const tw = gsap.fromTo(trk, { x: 0 }, {
        x: () => -dist(), ease: "none",
        scrollTrigger: { trigger: sec, start: "top top", end: () => "+=" + dist(), pin: ".rn-pin", scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 },
      });
      const bar = gsap.fromTo("#rnBar", { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: sec, start: "top top", end: () => "+=" + dist(), scrub: true, invalidateOnRefresh: true } });
      return () => { sec.classList.remove("js-pin"); tw.kill(); bar.kill(); gsap.set(trk, { clearProps: "x" }); };
    });
  }

  /* ---------- looks: zoom out from one photo to the grid ---------- */
  if (!reduced) {
    const c = $(".lk-c");
    const s = () => Math.max(innerWidth / c.offsetWidth, innerHeight / c.offsetHeight) * 1.04;
    const ltl = gsap.timeline({
      scrollTrigger: { trigger: ".looks", start: "top top", end: () => "+=" + innerHeight * 1.6, pin: ".lk-pin", scrub: 0.7, invalidateOnRefresh: true },
    });
    ltl.fromTo(c, { scale: s, borderRadius: 0 }, { scale: 1, borderRadius: 16, ease: "power2.inOut", duration: 1 }, 0)
       .fromTo(".lk-c .lk-cap", { scale: () => 1 / s() }, { scale: 1, ease: "power2.inOut", duration: 1 }, 0)
       .fromTo(".lk:not(.lk-c)", { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, stagger: { each: 0.04, from: "center" }, ease: "power2.out", duration: 0.6 }, 0.35)
       .fromTo(".lk:not(.lk-c) img", { scale: 1.4 }, { scale: 1, ease: "power2.out", duration: 0.8 }, 0.35);
  }

  /* ---------- reveals ---------- */
  if (!reduced) {
    $$(".pk-intro, .ev-head, .pr-head, .eq-copy, .room-head").forEach((n) =>
      gsap.from(n.children, { y: 50, opacity: 0, duration: 1.1, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: n, start: "top 85%" } }));
    gsap.from(".pk-card", { y: 80, opacity: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: ".pk-card", start: "top 88%" } });
    gsap.from(".incl li", { x: 30, opacity: 0, duration: 0.8, stagger: 0.07, ease: "power3.out", scrollTrigger: { trigger: ".incl", start: "top 80%" } });
    ScrollTrigger.create({ trigger: ".pk-card", start: "top 75%", once: true, onEnter: () => { pv.p = 0; pickGuests(gBtns.find((b) => b.getAttribute("aria-checked") === "true")); } });
    ScrollTrigger.batch(".ev", {
      start: "top 88%",
      onEnter: (b) => gsap.fromTo(b, { clipPath: "inset(30% 0 0 0 round 20px)", y: 60, opacity: 0 }, { clipPath: "inset(0% 0 0 0 round 20px)", y: 0, opacity: 1, duration: 1.2, stagger: 0.12, ease: "power3.out" }),
    });
    gsap.from(".eq-form", { y: 60, opacity: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: ".eq-form", start: "top 88%" } });

    const path = $(".thread path");
    const len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(path, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: ".pr-wrap", start: "top 70%", end: "bottom 60%", scrub: true } });
    $$(".pr-steps li").forEach((li) => gsap.from(li, { y: 60, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: li, start: "top 82%" } }));
  }

  /* ---------- enquiry form + live WhatsApp preview ---------- */
  const wa = $("#waPreview");
  const themeName = { "black-gold": "black & gold", blush: "blush", red: "red romance", royal: "royal purple", garden: "garden white" };
  function preview() {
    const f = form;
    const names = f.names.value.trim();
    let date = "";
    if (f.date.value) {
      const d = new Date(f.date.value + "T12:00:00");
      date = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    }
    const lines = [
      `Hi! ${names ? "We're " + names + " and we're" : "We're"} planning a ${f.type.value.toLowerCase()}${date ? " on " + date : ""} for ${f.guests.value} guests.`,
      `We'd love ${f.need.value} in ${themeName[f.theme.value]}.`,
    ];
    if (quote.size) lines.push(`Rentals we liked: ${[...quote].join(", ")}.`);
    if (f.notes.value.trim()) lines.push(f.notes.value.trim());
    lines.push("Is our date available?");
    wa.textContent = lines.join("\n");
    quoteLine.hidden = !quote.size;
    quoteLine.textContent = `${quote.size} rental${quote.size === 1 ? "" : "s"} added from the closet: ${[...quote].join(", ")}`;
  }
  form.addEventListener("input", () => { preview(); if (form.theme.value !== stage.dataset.theme) setTheme(form.theme.value, true); });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    say("Demo: on the live site this opens WhatsApp with your message ready to send to the planner.");
    if (!reduced) gsap.fromTo(".bubble", { scale: 0.96 }, { scale: 1, duration: 0.6, ease: "back.out(3)" });
  });
  $$(".ev").forEach((a) => a.addEventListener("click", () => { form.type.value = a.dataset.type; preview(); }));
  pickGuests(gBtns[0], true);
  preview();

  /* ---------- falling petals behind the form ---------- */
  (() => {
    const cv = $("#petals");
    if (reduced || !cv) return;
    const ctx = cv.getContext("2d");
    let W, H, on = false, raf;
    const cols = ["#f4d3d6", "#e46b8b", "#f7e4e6", "#c94a6c"];
    const N = innerWidth < 700 ? 16 : 30;
    const P = Array.from({ length: N }, () => ({ x: Math.random(), y: Math.random(), s: rr(6, 13), r: rr(0, 6.28), vr: rr(-0.03, 0.03), vy: rr(0.5, 1.2), sw: rr(0, 6.28), c: cols[(Math.random() * 4) | 0] }));
    const size = () => { const d = Math.min(devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    size(); addEventListener("resize", size);
    const frame = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of P) {
        p.y += p.vy / H * 1.4; p.sw += 0.02; p.r += p.vr;
        if (p.y > 1.05) { p.y = -0.05; p.x = Math.random(); }
        const x = p.x * W + Math.sin(p.sw) * 30, y = p.y * H;
        ctx.save(); ctx.translate(x, y); ctx.rotate(p.r); ctx.scale(1, Math.abs(Math.cos(p.sw * 1.3)) * 0.6 + 0.4);
        ctx.globalAlpha = 0.55; ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.moveTo(0, -p.s); ctx.bezierCurveTo(p.s * 0.9, -p.s * 0.6, p.s * 0.7, p.s * 0.7, 0, p.s); ctx.bezierCurveTo(-p.s * 0.7, p.s * 0.7, -p.s * 0.9, -p.s * 0.6, 0, -p.s); ctx.fill();
        ctx.restore();
      }
      if (on) raf = requestAnimationFrame(frame);
    };
    new IntersectionObserver(([e]) => { on = e.isIntersecting; cancelAnimationFrame(raf); if (on) raf = requestAnimationFrame(frame); }).observe(cv);
  })();

  addEventListener("load", () => ScrollTrigger.refresh());
})();
