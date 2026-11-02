// Stádo koní na konci stránky: když člověk dojede úplně dolů, dál už to nejde a chvíli se dívá,
// proběhne spodním okrajem stránky zprava doleva 5–7 divokých koní ve cvalu. Velikostí odpovídají
// postavičkám na linkách (kohoutek kolem 15 px). Znovu až poté, co člověk odjede nahoru a vrátí se.
//
// Použití: <script src="navrhy-kone.js"></script> a Kone.start()
// Ladění: ?kone=hned – stádo vyběhne vteřinu po načtení, bez ohledu na pozici.

const Kone = (() => {
  const CERNA = '#0b0b0b';
  const PRACH = 'rgba(70,64,58,';
  let canvas, ctx, W, VYSKA = 70, ZEM = 52, kone = [], prach = [], bezi = false, posledni = 0;

  // ---------- jeden kůň (souřadnice v násobcích výšky kohoutku, kůň hledí doprava) ----------
  function noha(c, hx, hy, a, b, l1, l2) {
    const kx = hx + Math.sin(a) * l1, ky = hy + Math.cos(a) * l1;
    const px = kx + Math.sin(b) * l2, py = ky + Math.cos(b) * l2;
    c.beginPath(); c.moveTo(hx, hy); c.lineTo(kx, ky); c.lineTo(px, py); c.stroke();
    return { x: px, y: py };
  }
  function kresliKone(c, k) {
    const p = k.faze, q = p * Math.PI * 2;
    c.save();
    c.translate(k.x, k.zem - Math.cos(q) * 0.04 * k.h);   // houpání těla ve cvalu
    c.scale(-k.h, k.h);                                    // běží doleva, jednotka = výška kohoutku
    c.rotate(Math.sin(q) * 0.045);
    c.fillStyle = CERNA; c.strokeStyle = CERNA; c.lineCap = 'round'; c.lineJoin = 'round';
    // nohy: pořadí cvalu zadní L, zadní P, přední L, přední P
    const kopyta = [];
    c.lineWidth = 0.075;
    const zadni = (o, hx) => { const f = q + o * Math.PI * 2, a = -0.05 + 0.5 * Math.sin(f), b = a + 0.1 + 0.75 * Math.max(0, Math.sin(f - 0.6)); kopyta.push(noha(c, hx, -0.66, a, b, 0.34, 0.37)); };
    const predni = (o, hx) => { const f = q + o * Math.PI * 2, a = 0.12 + 0.55 * Math.sin(f), b = a - 0.05 - 0.95 * Math.max(0, Math.sin(f - 1.0)); kopyta.push(noha(c, hx, -0.64, a, b, 0.33, 0.37)); };
    zadni(0, -0.42); predni(0.42, 0.38);                    // vzdálenější pár
    // tělo
    c.beginPath(); c.ellipse(0, -0.74, 0.55, 0.19, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(-0.42, -0.77, 0.2, 0, Math.PI * 2); c.fill();      // záď
    c.beginPath(); c.arc(0.38, -0.75, 0.19, 0, Math.PI * 2); c.fill();      // hruď
    // krk a hlava
    const kyv = Math.sin(q + 0.8) * 0.05;
    c.lineWidth = 0.24; c.beginPath(); c.moveTo(0.4, -0.8); c.lineTo(0.7, -1.1 + kyv); c.stroke();
    c.lineWidth = 0.13; c.beginPath(); c.moveTo(0.7, -1.1 + kyv); c.lineTo(0.98, -0.94 + kyv); c.stroke();
    c.lineWidth = 0.05; c.beginPath(); c.moveTo(0.66, -1.17 + kyv); c.lineTo(0.62, -1.3 + kyv); c.stroke();  // ucho
    // hříva vlaje
    c.lineWidth = 0.06; c.beginPath(); c.moveTo(0.36, -0.93);
    c.quadraticCurveTo(0.48, -1.12 + Math.sin(q * 2) * 0.04, 0.64, -1.22 + kyv); c.stroke();
    // ocas vlaje za koněm
    const v = Math.sin(q * 2 + k.seed) * 0.06;
    c.lineWidth = 0.1; c.beginPath(); c.moveTo(-0.58, -0.86);
    c.quadraticCurveTo(-0.84, -0.96 + v, -1.04, -0.78 + v * 1.6); c.stroke();
    c.lineWidth = 0.05; c.beginPath(); c.moveTo(-0.6, -0.84);
    c.quadraticCurveTo(-0.86, -0.88 - v, -1.0, -0.66 - v); c.stroke();
    // bližší pár nohou
    c.lineWidth = 0.08;
    zadni(0.12, -0.38); predni(0.54, 0.42);
    c.restore();
    // prach od kopyt, která jsou zrovna u země
    for (const kp of kopyta) {
      if (kp.y > -0.03 && Math.random() < 0.12) {
        prach.push({ x: k.x - kp.x * k.h, y: k.zem - 1, r: 1 + Math.random() * 1.6, zivot: 0, delka: 0.5 + Math.random() * 0.4, vx: 18 + Math.random() * 30, vy: -6 - Math.random() * 10 });
      }
    }
  }

  // ---------- stádo ----------
  function stado(bezSmycky) {
    if (bezi) return;
    if (!canvas) {
      canvas = document.createElement('canvas'); canvas.className = 'kone'; canvas.setAttribute('aria-hidden', 'true');
      // přišpendlené ke spodku stránky, ne k oknu: když člověk vyjede nahoru, stádo odjede se stránkou
      Object.assign(canvas.style, { position: 'fixed', left: 0, bottom: 0, display: 'none', pointerEvents: 'none', zIndex: 40 });
      document.body.appendChild(canvas); ctx = canvas.getContext('2d');
    }
    canvas.style.display = 'none';
    W = document.documentElement.clientWidth;
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = W * dpr; canvas.height = VYSKA * dpr; canvas.style.width = W + 'px'; canvas.style.height = VYSKA + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = 5 + Math.floor(Math.random() * 3);
    let x = W + 30;
    kone = [];
    for (let i = 0; i < n; i++) {
      const hloubka = Math.random();                         // 0 = vpředu, 1 = vzadu (výš a o kus menší)
      const h = 15 * (1.08 - hloubka * 0.22) * (0.92 + Math.random() * 0.16);
      x += 22 + Math.random() * 46;
      kone.push({ x, h, zem: ZEM - hloubka * 12, hloubka, rychlost: 235 + Math.random() * 70, faze: Math.random(), seed: Math.random() * 6 });
    }
    kone.sort((a, b) => b.hloubka - a.hloubka);              // vzdálenější se kreslí první
    prach = [];
    canvas.style.display = 'block';
    if (bezSmycky) return;
    bezi = true; posledni = performance.now(); requestAnimationFrame(snimek);
  }

  function posun(dt, t) {
    for (const p of prach) { p.zivot += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 12 * dt; p.r += 4.5 * dt; }
    prach = prach.filter(p => p.zivot < p.delka);
    // koně: rychlost lehce kolísá, takže se v běhu předbíhají
    for (const k of kone) {
      const v = k.rychlost * (1 + 0.07 * Math.sin(t / 900 + k.seed));
      k.x -= v * dt;
      k.faze = (k.faze + dt * v / (2.7 * k.h)) % 1;            // jeden skok cvalu ≈ 2,7 výšky koně
    }
  }
  function vykresli() {
    ctx.clearRect(0, 0, W, VYSKA);
    for (const p of prach) {
      const a = Math.max(0, 1 - p.zivot / p.delka) * 0.16;
      ctx.fillStyle = PRACH + a + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    for (const k of kone) if (k.x > -40 && k.x < W + 60) kresliKone(ctx, k);
  }
  function snimek(t) {
    const dt = Math.min(0.05, (t - posledni) / 1000 || 0.016); posledni = t;
    posun(dt, t); vykresli();
    if (kone.every(k => k.x < -50) && !prach.length) { bezi = false; ctx.clearRect(0, 0, W, VYSKA); canvas.style.display = 'none'; return; }
    requestAnimationFrame(snimek);
  }
  // ladění: stádo přetočené o zadaný čas jako jeden nehybný snímek (?kone=nahled:2.5)
  function nahled(sekund) {
    stado(true); let t = performance.now();
    for (let i = 0; i < sekund * 60; i++) { t += 1000 / 60; posun(1 / 60, t); if (i % 2) vykresli(); }
    vykresli();
  }

  // ---------- kdy vyběhnou ----------
  function start() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (/kone=hned/.test(location.search)) { setTimeout(stado, 1000); return; }
    const nh = /kone=nahled:([\d.]+)/.exec(location.search);
    if (nh) { setTimeout(() => nahled(parseFloat(nh[1])), 800); return; }
    let cekani = null, probehli = false;
    const zbyva = () => document.documentElement.scrollHeight - (innerHeight + scrollY);
    const kontrola = () => {
      clearTimeout(cekani); cekani = null;
      if (bezi) return;
      if (zbyva() <= 4) {
        // dál už to nejde: počká, jestli se člověk zastavil a kouká
        if (!probehli) cekani = setTimeout(() => { if (zbyva() <= 4 && !document.hidden) { probehli = true; stado(); } }, 1300);
      } else if (zbyva() > 200) probehli = false;            // odjel nahoru, příště poběží znovu
    };
    addEventListener('scroll', kontrola, { passive: true });
    addEventListener('resize', kontrola);
    kontrola();
  }
  return { start, bezte: () => stado(), _stado: stado };
})();
