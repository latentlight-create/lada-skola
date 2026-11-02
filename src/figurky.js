// Figurky na nadpisu: malí černí lidé chodí po písmenech hlavního titulku, lezou po stěnách,
// přeskakují mezery a sedají si na hrany. Písmena se jednou vykreslí do neviditelného plátna
// stejným písmem, z toho vznikne „terén“ (kde je černá), a figurky se chovají jako v plošinovce.
//
// Použití: <script src="navrhy-figurky.js"></script> a potom Figurky.start(document.querySelector('.hero h1'))
// Ladění: ?figurky=debug ukáže masku písmen červeně.

const Figurky = (() => {
  const CERNA = '#0b0b0b';
  let h1, canvas, ctx, W, H, sloupce, radky, figurky = [], vyska, bezi = false, posledni = 0, debug = false, maska, okraj = 0;

  // ---------- terén ----------
  function postavTeren() {
    const rect = h1.getBoundingClientRect();
    W = Math.ceil(rect.width); H = Math.ceil(rect.height);
    if (W < 10 || H < 10) return false;
    const cs = getComputedStyle(h1);
    const size = parseFloat(cs.fontSize);
    vyska = Math.round(size * 0.095);          // výška figurky
    if (vyska < 6.5) return false;             // na úzkém mobilu by byly tečky
    const off = document.createElement('canvas'); off.width = W; off.height = H;
    const o = off.getContext('2d');
    o.font = `${cs.fontStyle} ${cs.fontWeight} ${size}px ${cs.fontFamily}`;
    o.textBaseline = 'alphabetic'; o.fillStyle = '#000';
    const m = o.measureText('H');
    const ascent = m.fontBoundingBoxAscent || m.actualBoundingBoxAscent * 1.25;
    const upper = cs.textTransform === 'uppercase';
    radky = [];
    const range = document.createRange();
    const projdi = n => {
      if (n.nodeType === 3) {
        const t = n.textContent;
        for (let i = 0; i < t.length; i++) {
          const ch = upper ? t[i].toUpperCase() : t[i];
          if (ch.trim() === '') continue;
          range.setStart(n, i); range.setEnd(n, i + 1);
          const r = range.getBoundingClientRect();
          if (!r.width) continue;
          const x = r.left - rect.left, top = r.top - rect.top, base = Math.round(top + ascent);
          o.fillText(ch, x, base);
          let rk = radky.find(k => Math.abs(k.base - base) < 4);
          if (!rk) { rk = { base, left: x, right: x + r.width, top }; radky.push(rk); }
          rk.left = Math.min(rk.left, x); rk.right = Math.max(rk.right, x + r.width);
        }
      } else if (n.nodeType === 1 && n.tagName !== 'CANVAS') n.childNodes.forEach(projdi);
    };
    projdi(h1);
    radky.sort((a, b) => a.base - b.base);
    const data = o.getImageData(0, 0, W, H).data;
    maska = debug ? off : null;
    // pro každý sloupec seznam souvislých černých úseků [od, do] shora dolů
    sloupce = new Array(W);
    for (let x = 0; x < W; x++) {
      const useky = []; let v = -1;
      for (let y = 0; y < H; y++) {
        const ink = data[(y * W + x) * 4 + 3] > 110;
        if (ink && v < 0) v = y;
        if (!ink && v >= 0) { useky.push([v, y - 1]); v = -1; }
      }
      if (v >= 0) useky.push([v, H - 1]);
      sloupce[x] = useky;
    }
    return true;
  }

  // je v sloupci x na výšce y černá?
  const ink = (x, y) => { if (x < 0 || x >= W) return false; const u = sloupce[x]; for (let i = 0; i < u.length; i++) { if (y < u[i][0]) return false; if (y <= u[i][1]) return true; } return false; };
  // vrchol úseku, který obsahuje y (když je tam černá)
  const vrcholUseku = (x, y) => { const u = sloupce[x]; for (let i = 0; i < u.length; i++) if (y >= u[i][0] && y <= u[i][1]) return u[i][0]; return null; };
  // povrchy ve sloupci: vrcholy úseků + podlaha řádku; jen ty, nad kterými je místo na figurku
  function povrchy(x, f) {
    const out = [];
    if (x < 0 || x >= W) return out;
    const u = sloupce[x];
    for (let i = 0; i < u.length; i++) {
      const y = u[i][0]; const stropDole = i > 0 ? u[i - 1][1] : -Infinity;
      if (y - stropDole > vyska * 1.15) out.push(y);
    }
    const pod = f.radek.base;
    if (!ink(x, pod) && !ink(x, pod - 1)) {
      // podlaha jen tam, kde je nad ní místo
      let volno = true; for (let y = pod - 1; y > pod - vyska * 1.15; y--) if (ink(x, y)) { volno = false; break; }
      if (volno) out.push(pod);
    }
    return out;
  }
  const nejbliz = (list, y, tol) => { let b = null; for (const p of list) if (Math.abs(p - y) <= tol && (b === null || Math.abs(p - y) < Math.abs(b - y))) b = p; return b; };

  // ---------- figurky ----------
  const TYPY = ['kluk', 'holka', 'batoh', 'cepice', 'holka-batoh'];
  function novaFigurka(i) {
    const radek = radky[i % radky.length];
    const f = { typ: TYPY[i % TYPY.length], radek, dir: Math.random() < .5 ? -1 : 1, faze: Math.random() * 6, stav: 'jde', cas: 0,
      rychlost: vyska * (1.6 + Math.random() * 1.2), h: vyska * (0.85 + Math.random() * 0.3) };
    // start na vrcholu náhodného písmene
    for (let k = 0; k < 60; k++) {
      const x = Math.round(radek.left + Math.random() * (radek.right - radek.left));
      const p = povrchy(x, f).filter(y => y < radek.base);
      if (p.length) { f.x = x; f.y = p[0]; return f; }
    }
    f.x = Math.round(radek.left + 5); f.y = radek.base; return f;
  }

  function krok(f, dt) {
    f.cas -= dt;
    switch (f.stav) {
      case 'stoji': case 'sedi': case 'kouka':
        // v dešti nikdo nepostává pod širým nebem; kdo běží pro čepici, nečeká
        if ((prsi && !f.schovany && !kryto(f)) || (f.honi && f.honi.lezi)) f.cas = Math.min(f.cas, 0);
        if (f.cas <= 0) {
          const byl = f.stav;
          if (byl === 'sedi' && Math.random() < .5) zacniLezeni(f, 'dolu');
          else { f.stav = 'jde'; if (byl !== 'stoji' || Math.random() < .5) f.dir *= -1; }
        }
        return;
      case 'skace': {
        f.cas = Math.max(0, f.cas);
        const t = 1 - f.cas / f.skok.doba;
        f.x = f.skok.x0 + (f.skok.x1 - f.skok.x0) * t;
        f.y = f.skok.y0 + (f.skok.y1 - f.skok.y0) * t - Math.sin(t * Math.PI) * f.h * 0.9;
        if (f.cas <= 0) { f.x = f.skok.x1; f.y = f.skok.y1; f.stav = 'jde'; }
        return;
      }
      case 'leze': {
        const smer = Math.sign(f.lezeni.cil - f.y);
        f.y += smer * f.rychlost * 0.7 * dt; f.faze += dt * 7;
        if ((smer > 0 && f.y >= f.lezeni.cil) || (smer < 0 && f.y <= f.lezeni.cil) || smer === 0) {
          f.y = f.lezeni.cil; f.x = f.lezeni.x; f.stav = 'jde';
        }
        return;
      }
    }
    // jde (v dešti rychleji; po větru rychleji, proti větru pomaleji; za uletěnou čepicí)
    if (f.honi && f.honi.lezi && Math.abs(f.honi.y - f.y) < f.h * 0.6) f.dir = Math.sign(f.honi.x - f.x) || f.dir;
    if (prsi && kryto(f) && Math.random() < 0.6) { f.stav = 'stoji'; f.cas = 1e9; f.schovany = true; return; }   // schová se pod převis
    const v = f.rychlost * (prsi ? 1.9 : 1) * (vitr ? 1 + 0.6 * vitr.sila * f.dir * vitr.smer : 1) * (f.honi ? 1.4 : 1);
    f.faze += dt * 9 * v / f.rychlost;
    const nx = f.x + f.dir * v * dt;
    const sx = Math.round(nx + f.dir * f.h * 0.18);          // o kousek napřed (špička nohy)
    if (sx <= f.radek.left - 2 || sx >= f.radek.right + 2) { f.dir *= -1; return; }
    const tol = f.h * 0.25;
    const p = povrchy(sx, f);
    const stejny = nejbliz(p, f.y, tol);
    if (stejny !== null) { f.x = nx; f.y = stejny; nahodnaPauza(f); return; }
    // stěna před námi? (černá ve výšce těla)
    if (ink(sx, f.y - 2) || ink(sx, f.y - f.h * 0.5)) {
      const vrch = vrcholUseku(sx, f.y - 2) ?? vrcholUseku(sx, Math.round(f.y - f.h * 0.5));
      if (vrch !== null) {
        if (f.y - vrch <= f.h * 0.6) { skoc(f, sx, vrch); return; }         // nízký schod: výskok
        if (Math.random() < .25) { f.dir *= -1; return; }
        zacniLezeni(f, 'nahoru', sx, vrch); return;
      }
    }
    // mezera nebo sráz: zkus doskočit
    for (let k = Math.round(f.h * 0.5); k <= f.h * 2.6; k += 2) {
      const tx = Math.round(f.x + f.dir * k);
      const c = nejbliz(povrchy(tx, f), f.y, f.h * 0.7);
      if (c !== null && !ink(Math.round(f.x + f.dir * k * 0.5), Math.round(f.y - f.h * 0.6))) { skoc(f, tx, c); return; }
    }
    // hrana: sednout, otočit se, nebo slézt
    const r = Math.random();
    if (r < .35) { f.stav = 'sedi'; f.cas = 2.5 + Math.random() * 5; f.x = Math.round(f.x); return; }
    if (r < .6) { f.stav = 'kouka'; f.cas = .8 + Math.random() * 1.5; return; }
    zacniLezeni(f, 'dolu');
  }
  function nahodnaPauza(f) { if (Math.random() < 0.004) { f.stav = 'stoji'; f.cas = 1 + Math.random() * 3; } }
  function skoc(f, x1, y1) { f.stav = 'skace'; f.skok = { x0: f.x, y0: f.y, x1, y1, doba: 0.35 }; f.cas = 0.35; }
  function zacniLezeni(f, kam, sx, vrch) {
    if (kam === 'nahoru') { f.stav = 'leze'; f.lezeni = { cil: vrch, x: sx + f.dir * 2 }; f.x = sx - f.dir * f.h * 0.3; return; }
    // dolů: povrch pod námi v prvním sloupci za hranou
    const sx2 = Math.round(f.x + f.dir * f.h * 0.35);
    const dole = povrchy(sx2, f).filter(y => y > f.y + 2).sort((a, b) => a - b)[0];
    if (dole === undefined) { f.dir *= -1; f.stav = 'jde'; return; }
    f.stav = 'leze'; f.lezeni = { cil: dole, x: sx2 + f.dir * f.h * 0.2 }; f.x = sx2 - f.dir * f.h * 0.05;
  }

  // ---------- kreslení ----------
  function kresli(f, c = ctx) {
    const h = f.h;
    const jas = f.jasa && f.jasa > performance.now();
    const hop = jas ? Math.abs(Math.sin((f.jasa - performance.now()) / 1600 * Math.PI * 3)) * h * 0.22 : 0;
    c.save(); c.translate(Math.round(f.x) + 0.5, Math.round(f.y) - hop); c.scale(f.dir, 1);
    c.fillStyle = CERNA; c.strokeStyle = CERNA; c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = Math.max(1.2, h * 0.14);
    const holka = f.typ.startsWith('holka'), batoh = f.typ.includes('batoh'), cepice = f.typ === 'cepice' && !f.bezCepice;
    const sw = Math.sin(f.faze), sw2 = Math.sin(f.faze + Math.PI);
    let hlavaY, hipY;
    if (f.stav === 'lezi' || f.lezic) {
      // ležící na lince: póza se plynule mění mezi lehem (f.sed = 0) a sedem (f.sed = 1)
      const t = f.sed === undefined ? (f.stav === 'lezi' ? 0 : 1) : f.sed;
      const e = t * t * (3 - 2 * t);                               // zjemnění na krajích
      const L = (a, b) => a + (b - a) * e;
      const y = -h * 0.11;
      // hlava a ramena: vleže vpravo u linky, vsedě nad boky; vsedě se hlava otáčí podle f.hlava (−1…1)
      const hx = L(h * 0.76, 0), hy = L(y - h * 0.06, -h * 0.62);
      const rx = L(h * 0.62, 0), ry = L(y, -h * 0.46);
      cara(c, 0, y, rx, ry);                                                           // trup
      // nohy: vleže natažená a pokrčená, vsedě visí přes hranu
      const k = (f.houpe && t > 0.9) ? Math.sin(f.faze * 0.8) * h * 0.08 : 0;
      cara(c, 0, y, L(-h * 0.42, h * 0.22), L(y, h * 0.05)); cara(c, L(-h * 0.42, h * 0.22), L(y, h * 0.05), L(-h * 0.42, h * 0.2 + k), L(y, h * 0.32));
      cara(c, 0, y, L(-h * 0.18, h * 0.3), L(-h * 0.4, -h * 0.02)); cara(c, L(-h * 0.18, h * 0.3), L(-h * 0.4, -h * 0.02), L(-h * 0.4, h * 0.3 - k), L(y, h * 0.3));
      // ruka: vleže za hlavou, vsedě opřená vzadu
      cara(c, rx, ry, L(h * 0.66, -h * 0.2), L(-h * 0.34, -h * 0.2)); cara(c, L(h * 0.66, -h * 0.2), L(-h * 0.34, -h * 0.2), L(h * 0.86, -h * 0.34), L(-h * 0.2, 0));
      if (holka) { c.beginPath(); c.moveTo(L(-h * 0.02, -h * 0.17), L(y - h * 0.14, y + h * 0.16)); c.lineTo(L(-h * 0.02, h * 0.17), L(y + h * 0.1, y + h * 0.16)); c.lineTo(L(h * 0.26, h * 0.04), L(y + h * 0.04, -h * 0.2)); c.lineTo(L(h * 0.26, -h * 0.04), L(y - h * 0.04, -h * 0.2)); c.closePath(); c.fill(); }
      const nat = (f.hlava || 0) * e * h * 0.05;                                       // natočení hlavy při rozhlížení
      c.beginPath(); c.arc(hx + nat, hy, h * 0.13, 0, Math.PI * 2); c.fill();
      if (cepice) cara(c, hx + nat - h * 0.1, hy - h * 0.1, hx + nat + h * 0.16, hy - h * 0.1);
      if (holka && t > 0.5) cara(c, hx + nat - h * 0.1, hy, hx + nat - h * 0.1, hy + h * 0.16);
      c.restore(); return;
    }
    if (f.stav === 'visi') {
      // visí za ruce pod linkou, nohy se lehce houpou
      const k = Math.sin(f.faze * 0.6) * h * 0.07;
      cara(c, -h * 0.13, 0, 0, h * 0.42); cara(c, h * 0.13, 0, 0, h * 0.42);     // ruce
      cara(c, 0, h * 0.42, k * 0.5, h * 0.84);                                   // trup
      cara(c, k * 0.5, h * 0.84, k + h * 0.07, h * 1.22); cara(c, k * 0.5, h * 0.84, k - h * 0.07, h * 1.2); // nohy
      if (holka) { c.beginPath(); c.moveTo(-h * 0.17 + k * 0.5, h * 0.88); c.lineTo(h * 0.17 + k * 0.5, h * 0.88); c.lineTo(h * 0.05, h * 0.6); c.lineTo(-h * 0.05, h * 0.6); c.closePath(); c.fill(); }
      if (batoh) { c.beginPath(); c.roundRect(-h * 0.28, h * 0.46, h * 0.16, h * 0.28, h * 0.05); c.fill(); }
      c.beginPath(); c.arc(0, h * 0.3, h * 0.13, 0, Math.PI * 2); c.fill();
      if (cepice) cara(c, -h * 0.1, h * 0.2, h * 0.16, h * 0.2);
      c.restore(); return;
    }
    if (f.stav === 'sedi') {
      hipY = 0; hlavaY = -h * 0.62;
      // nohy visí přes hranu a lehce se houpou
      const k = f.houpe ? Math.sin(f.faze * 0.8) * h * 0.08 : 0;
      cara(c, 0, 0, h * 0.22, h * 0.05); cara(c, h * 0.22, h * 0.05, h * 0.2 + k, h * 0.32);
      cara(c, 0, 0, h * 0.3, -h * 0.02); cara(c, h * 0.3, -h * 0.02, h * 0.3 - k, h * 0.3);
    } else {
      hipY = -h * 0.38; hlavaY = -h * 0.86;
      if (f.stav === 'leze') {
        // leze po stěně: ruce nahoře, nohy střídavě
        cara(c, 0, hipY, h * 0.1, hipY + h * 0.2 + sw * h * 0.08); cara(c, h * 0.1, hipY + h * 0.2 + sw * h * 0.08, h * 0.22, hipY + h * 0.32 + sw * h * 0.06);
        cara(c, 0, hipY, h * 0.1, hipY + h * 0.2 + sw2 * h * 0.08); cara(c, h * 0.1, hipY + h * 0.2 + sw2 * h * 0.08, h * 0.22, hipY + h * 0.32 + sw2 * h * 0.06);
      } else if (f.stav === 'jde' || f.stav === 'skace') {
        const a = f.stav === 'skace' ? 0.5 : sw * 0.28, b = f.stav === 'skace' ? -0.3 : sw2 * 0.28;
        cara(c, 0, hipY, a * h, 0); cara(c, 0, hipY, b * h, 0);
      } else {
        cara(c, 0, hipY, h * 0.06, 0); cara(c, 0, hipY, -h * 0.06, 0);
      }
    }
    // tělo
    cara(c, 0, hlavaY + h * 0.16, 0, hipY);
    if (holka) { c.beginPath(); c.moveTo(-h * 0.17, hipY + h * 0.05); c.lineTo(h * 0.17, hipY + h * 0.05); c.lineTo(h * 0.04, hipY - h * 0.22); c.lineTo(-h * 0.04, hipY - h * 0.22); c.closePath(); c.fill(); }
    // ruce
    const ramY = hlavaY + h * 0.24;
    if (jas) { cara(c, 0, ramY, h * 0.24, ramY - h * 0.3); cara(c, 0, ramY, -h * 0.24, ramY - h * 0.3); }
    else if (f.stav === 'leze') { cara(c, 0, ramY, h * 0.18, ramY - h * 0.25 - sw2 * h * 0.08); cara(c, 0, ramY, h * 0.18, ramY - h * 0.25 - sw * h * 0.08); }
    else if (f.stav === 'sedi') { cara(c, 0, ramY, h * 0.2, ramY + h * 0.22); }
    else if (f.stav === 'kouka') { cara(c, 0, ramY, h * 0.12, ramY - h * 0.1); cara(c, h * 0.12, ramY - h * 0.1, h * 0.2, ramY - h * 0.2); }
    else { const s = f.stav === 'jde' ? sw2 * 0.22 : 0; cara(c, 0, ramY, s * h, ramY + h * 0.26); cara(c, 0, ramY, -s * h * 0.8, ramY + h * 0.26); }
    // batoh
    if (batoh) { c.beginPath(); c.roundRect(-h * 0.26, ramY + h * 0.02, h * 0.16, h * 0.28, h * 0.05); c.fill(); }
    // hlava
    c.beginPath(); c.arc(0, hlavaY, h * 0.13, 0, Math.PI * 2); c.fill();
    if (cepice) { cara(c, -h * 0.1, hlavaY - h * 0.1, h * 0.26, hlavaY - h * 0.1); }
    if (holka) { cara(c, -h * 0.1, hlavaY, -h * 0.1, hlavaY + h * 0.16); }
    c.restore();
  }
  function cara(c, x0, y0, x1, y1) { c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }

  function snimek(t) {
    if (!bezi) return;
    const dt = Math.min(0.05, (t - posledni) / 1000 || 0.016); posledni = t;
    ctx.clearRect(-okraj, -okraj, W + 2 * okraj, H + 2 * okraj);
    if (maska) { ctx.globalAlpha = .35; ctx.drawImage(maska, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(217,47,38,.35)'; ctx.globalCompositeOperation = 'source-atop'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }
    if (vitr) vitr.sila = obalka(performance.now() - vitr.od, vitr.trvani);
    if (vitr && vitr.sila <= 0 && performance.now() - vitr.od > vitr.trvani) vitr = null;
    for (const f of figurky) { krok(f, dt); kresli(f); }
    for (const c of cepice) { cepiceKrok(c, dt); kresliCepici(c); }
    cepice = cepice.filter(c => !c.pryc);
    requestAnimationFrame(snimek);
  }

  function rozmisti(pocet) {
    figurky = [];
    for (let i = 0; i < pocet; i++) figurky.push(novaFigurka(i));
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) figurky.forEach(f => { f.stav = 'sedi'; f.cas = 1e9; });
  }

  let sestavHlavni = null, hlavniPosluchac = false;
  function start(el, volby = {}) {
    h1 = el; if (!h1) return;
    debug = /figurky=debug/.test(location.search);
    const pocet = volby.pocet || 7;
    const sestav = () => {
      if (canvas && canvas.parentNode !== h1) { canvas.remove(); canvas = null; }
      if (!postavTeren()) { bezi = false; if (canvas) canvas.remove(); canvas = null; return; }
      if (!canvas) {
        canvas = document.createElement('canvas'); canvas.className = 'figurky'; canvas.setAttribute('aria-hidden', 'true');
        Object.assign(canvas.style, { position: 'absolute', left: 0, top: 0, pointerEvents: 'none' });
        if (getComputedStyle(h1).position === 'static') h1.style.position = 'relative';
        h1.appendChild(canvas); ctx = canvas.getContext('2d');
      }
      // plátno přesahuje nadpis, aby figurky na vršku prvního řádku nepřišly o hlavu
      okraj = Math.ceil(vyska * 2.2);
      const dpr = Math.min(2, devicePixelRatio || 1);
      canvas.width = (W + 2 * okraj) * dpr; canvas.height = (H + 2 * okraj) * dpr;
      canvas.style.width = (W + 2 * okraj) + 'px'; canvas.style.height = (H + 2 * okraj) + 'px';
      canvas.style.left = -okraj + 'px'; canvas.style.top = -okraj + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, okraj * dpr, okraj * dpr);
      rozmisti(pocet);
      if (!bezi) { bezi = true; posledni = performance.now(); requestAnimationFrame(snimek); }
    };
    sestavHlavni = sestav;
    const pripraven = () => (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(sestav, volby.hned ? 60 : 1100));
    pripraven();
    if (!hlavniPosluchac) { hlavniPosluchac = true; let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => sestavHlavni && sestavHlavni(), 300); }); }
  }
  // ---------- počasí (řídí navrhy-pocasi.js) ----------
  // déšť: postavičky přidají do kroku a schovají se pod převis písmene (nad hlavou je černá), po dešti zase vyjdou;
  // vítr: po větru jdou rychleji, proti větru pomaleji a čepice uletí – majitel pro ni doběhne; blesk: všichni nadskočí
  let prsi = false, vitr = null, cepice = [];
  const obalka = (t, d) => t < 0 ? 0 : t < 700 ? t / 700 : t < d - 1400 ? 1 : Math.max(0, (d - t) / 1400);
  function kryto(f) {
    const x = Math.round(f.x), velikost = vyska / 0.095;
    for (const dx of [-2, 0, 2]) {
      const u = sloupce && sloupce[x + dx]; if (!u) return false;
      if (!u.some(([, b]) => b < f.y - f.h * 1.05 && b > f.y - velikost * 1.1)) return false;
    }
    return true;
  }
  // kam dopadne čepice: nejbližší povrch (vršek písmene nebo podlaha řádku) pod ní
  function povrchPod(x, y) {
    x = Math.round(x); if (x < 0 || x >= W) return null;
    const tops = sloupce[x].map(u => u[0]).concat(radky.map(r => r.base)).filter(t => t >= y).sort((a, b) => a - b);
    return tops.length ? tops[0] : null;
  }
  function cepiceKrok(c, dt) {
    c.t += dt;
    if (!c.lezi) {
      const tlak = vitr ? vitr.smer * vitr.sila * 420 : 0;
      c.vx += (tlak - c.vx * 0.6) * dt; c.vy += 420 * dt; c.rot += c.vrot * dt;
      const ny = c.y + c.vy * dt, nx = Math.max(2, Math.min(W - 2, c.x + c.vx * dt));
      const p = c.vy > 0 ? povrchPod(nx, c.y) : null;
      if (p !== null && ny >= p) { c.x = nx; c.y = p; c.lezi = true; c.rot = 0; } else { c.x = nx; c.y = ny; }
      if (c.y > H + okraj) { c.y = povrchPod(c.x, 0) ?? radky[radky.length - 1].base; c.lezi = true; }
    }
    const f = c.majitel;
    if ((c.lezi && Math.abs(f.x - c.x) < f.h * 0.35 && Math.abs(f.y - c.y) < f.h * 0.6) || c.t > 14) {   // sebral ji (nebo po 14 s „našel“)
      f.bezCepice = false; f.honi = null; c.pryc = true;
    }
  }
  function kresliCepici(c) {
    const h = c.majitel.h;
    ctx.save(); ctx.translate(c.x, c.y - (c.lezi ? 1 : 0)); ctx.rotate(c.rot);
    ctx.strokeStyle = CERNA; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.2, h * 0.14);
    cara(ctx, -h * 0.13, 0, h * 0.13, 0); ctx.restore();
  }
  const pocasi = {
    teren: () => sloupce && h1 ? { W, H, sloupce, radky, h1, velikost: vyska / 0.095 } : null,
    dest(zap) {
      prsi = zap;
      if (!zap) figurky.forEach(f => { if (f.schovany) { f.schovany = false; f.cas = Math.random() * 2.5; } });   // po dešti zase vyjdou
    },
    vitr(smer, trvani) {
      vitr = { smer, sila: 0, od: performance.now(), trvani };
      figurky.forEach(f => {
        if (f.typ !== 'cepice' || f.bezCepice || Math.random() > 0.85) return;
        setTimeout(() => {
          if (f.bezCepice || !bezi) return;
          f.bezCepice = true;
          const c = { x: f.x, y: f.y - f.h * 0.97, vx: smer * (90 + Math.random() * 120), vy: -(70 + Math.random() * 90), rot: 0, vrot: smer * (6 + Math.random() * 8), t: 0, lezi: false, majitel: f };
          f.honi = c; cepice.push(c);
        }, 250 + Math.random() * 900);
      });
    },
    blesk() {
      figurky.forEach(f => { if (['jde', 'stoji', 'kouka', 'sedi'].includes(f.stav)) { f.schovany = false; skoc(f, f.x, f.y); } });
    },
  };

  // ---------- lidé na dělicích linkách ----------
  // Figurky.linky(elementy, 'bottom'|'top') posadí na spodní/horní linku prvku 2–3 lidi:
  // sedí a houpou nohama, leží, nebo visí za ruce pod linkou.
  const linky = []; let linkyBezi = false, linkyPosledni = 0;
  const linkySestavy = new Set(); let linkyPosluchac = false;
  function rozsadLinku(L) {
    const h = L.h, n = 2 + (Math.random() < 0.5 ? 1 : 0), out = [], obs = [];
    const polohy = ['sedi', 'sedi', 'sedi', 'lezi', 'visi', 'visi'];
    for (let i = 0; i < n; i++) {
      let x = 0, ok = false;
      for (let k = 0; k < 40 && !ok; k++) { x = L.W * (0.06 + Math.random() * 0.88); ok = obs.every(o => Math.abs(o - x) > h * 4) && !L.zakaz.some(([a, b]) => x > a - h * 1.5 && x < b + h * 1.5); }
      if (!ok) continue; obs.push(x);
      const stav = polohy[Math.floor(Math.random() * polohy.length)];
      const f = { x, y: L.liniaY, h: h * (0.9 + Math.random() * 0.2), dir: Math.random() < 0.5 ? -1 : 1, stav, faze: Math.random() * 6, typ: TYPY[Math.floor(Math.random() * TYPY.length)], houpe: Math.random() < 0.7 };
      if (stav === 'lezi') { f.lezic = true; f.cas = 6 + Math.random() * 14; }   // za chvíli si sedne a rozhlédne se
      out.push(f);
      // občas dva sedí proti sobě a povídají si
      if (stav === 'sedi' && Math.random() < 0.4) {
        const g = { ...f, x: x + f.dir * h * 1.1, dir: -f.dir, faze: Math.random() * 6, typ: TYPY[Math.floor(Math.random() * TYPY.length)], houpe: Math.random() < 0.7 };
        out.push(g); obs.push(g.x);
      }
    }
    if (L.hlasky && L.hlasky.length && out.length && out.every(f => f.stav === 'visi')) { out[0].stav = 'sedi'; }
    return out;
  }
  // ležící na lince: leží → posadí se → rozhlíží se (otočí hlavu tam a zpět) → zase si lehne
  function lezicKrok(f, dt) {
    // plynulý dojezd pózy (f.sed) a hlavy (f.hlava) k cíli
    if (f.sed === undefined) { f.sed = f.stav === 'lezi' ? 0 : 1; f.cilSed = f.sed; f.hlava = 0; f.cilHlava = 0; }
    f.sed += (f.cilSed - f.sed) * Math.min(1, dt * 3.2);
    f.hlava += (f.cilHlava - f.hlava) * Math.min(1, dt * 5);
    if (f.mluvi) return;
    f.cas -= dt; if (f.cas > 0) return;
    if (f.stav === 'lezi') { f.stav = 'sedi'; f.cilSed = 1; f.houpe = false; f.rozhlizi = 0; f.cas = 1.4; }            // zvedne se
    else if (f.stav === 'sedi' && f.rozhlizi === 0) { f.cilHlava = -1; f.rozhlizi = 1; f.cas = 0.9 + Math.random() * 0.6; }   // kouká na jednu stranu
    else if (f.stav === 'sedi' && f.rozhlizi === 1) { f.cilHlava = 1; f.rozhlizi = 2; f.cas = 0.9 + Math.random() * 0.6; }    // a na druhou
    else if (f.stav === 'sedi' && f.rozhlizi === 2) { f.cilHlava = 0; f.rozhlizi = 3; f.houpe = Math.random() < 0.5; f.cas = 2 + Math.random() * 4; }  // chvíli sedí
    else { f.stav = 'lezi'; f.cilSed = 0; f.houpe = false; f.cas = 8 + Math.random() * 16; }                          // zase si lehne
  }
  function linkySnimek(t) {
    if (!linkyBezi) return;
    const dt = Math.min(0.05, (t - linkyPosledni) / 1000 || 0.016); linkyPosledni = t;
    for (const L of linky) {
      L.ctx.clearRect(0, 0, L.W, L.H);
      for (const f of L.fig) {
        f.faze += dt * 2.4; if (f.lezic) lezicKrok(f, dt);
        if (f.oziv) ozivKrok(L, f, dt);
        if (!f.oziv || f.oziv.faze !== 'pryc') kresli(f, L.ctx);
      }
      if (L.mluvci && L.mluvci.oziv) umistiBublinu(L, L.mluvci);
    }
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) requestAnimationFrame(linkySnimek); else linkyBezi = false;
  }
  function linkyStart(elementy, side, volby = {}) {
    const els = Array.from(elementy || []); if (!els.length) return;
    const h = volby.vyska || 15;
    const sestav = () => {
      els.forEach(el => {
        let L = linky.find(l => l.el === el && l.side === side);
        if (!L) {
          const canvas = document.createElement('canvas'); canvas.className = 'figurky-linka'; canvas.setAttribute('aria-hidden', 'true');
          Object.assign(canvas.style, { position: 'absolute', left: 0, pointerEvents: 'none', zIndex: 2 });
          if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
          el.appendChild(canvas);
          L = { el, side, canvas, ctx: canvas.getContext('2d'), h, fig: [] }; linky.push(L);
        }
        L.hlasky = typeof volby.hlasky === 'function' ? (volby.hlasky(el) || []) : (volby.hlasky || []);
        L.zakaz = typeof volby.zakaz === 'function' ? volby.zakaz(el) || [] : [];   // úseky linky [od, do], kam si nikdo nesedne (třeba šapitó)
        L.ozivaji = !!volby.ozivaji;                                   // mluví jen po najetí, pak vstanou a odejdou
        L.balicek = null;
        if (L.bublina) schovej(L, true);
        const W = el.clientWidth, H = Math.ceil(h * 3.2);
        const bt = parseFloat(getComputedStyle(el).borderTopWidth) || 0;
        L.W = W; L.H = H; L.liniaY = Math.round(H / 2) + 0.5;
        const dpr = Math.min(2, devicePixelRatio || 1);
        L.canvas.width = W * dpr; L.canvas.height = H * dpr; L.canvas.style.width = W + 'px'; L.canvas.style.height = H + 'px';
        L.canvas.style.top = (side === 'bottom' ? el.offsetHeight - bt - 1 - Math.round(H / 2) : -bt - Math.round(H / 2)) + 'px';
        L.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        L.fig = rozsadLinku(L);
        // ladění: ?figurky=poza:0.5 ukáže na každé lince jednoho ležícího v dané fázi zvedání (0 leží, 1 sedí)
        const poza = /figurky=poza:([\d.]+)/.exec(location.search);
        if (poza) { const v = parseFloat(poza[1]); L.fig = [{ x: L.W * 0.3, y: L.liniaY, h, dir: 1, stav: v < 0.5 ? 'lezi' : 'sedi', faze: 0, typ: 'kluk', lezic: true, cas: 1e9, sed: v, cilSed: v, hlava: v >= 1 ? -1 : 0, cilHlava: v >= 1 ? -1 : 0 }]; }
      });
      if (!linkyBezi) { linkyBezi = true; linkyPosledni = performance.now(); requestAnimationFrame(linkySnimek); }
      spustHlasky();
    };
    linkySestavy.add(sestav);
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(sestav, volby.hned ? 60 : 1200));
    if (!linkyPosluchac) { linkyPosluchac = true; let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => linkySestavy.forEach(s => s()), 350); }); }
  }
  // ---------- ožívání: po najetí postavička vstane, odejde po lince z obrazovky a po chvíli se vrátí na své místo ----------
  // Ležící se nejdřív posadí, visící se vyšplhá na linku. Odchází k bližšímu kraji, venku počká 3–8 s,
  // vrátí se stejnou cestou a zaujme původní pózu (sedí, leží, visí).
  function ozij(L, f) {
    if (f.oziv || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    f.oziv = { faze: 'vstava', t: 0, domov: { x: f.x, dir: f.dir, stav: f.stav, lezic: !!f.lezic, houpe: f.houpe } };
    if (f.lezic) { f.cilSed = 1; f.cilHlava = 0; f.cas = 1e9; f.oziv.t = 0.7; }                     // posadí se
    else if (f.stav === 'visi') { f.stav = 'leze'; f.y = L.liniaY + f.h * 0.87; f.oziv.t = 0.6; }   // vyšplhá nahoru
    else f.oziv.t = 0.3;
  }
  function ozivKrok(L, f, dt) {
    const o = f.oziv, rychlost = f.h * 5, kraj = f.h * 1.6;
    o.t -= dt;
    if (o.faze === 'vstava') {
      if (f.stav === 'leze') { f.y = L.liniaY + f.h * 0.87 * Math.max(0, o.t / 0.6); f.faze += dt * 5; }
      if (o.t > 0) return;
      f.lezic = false; f.stav = 'stoji'; f.y = L.liniaY;
      f.dir = f.x < L.W / 2 ? -1 : 1;                                               // k bližšímu kraji
      o.faze = 'rozhlizi'; o.t = 0.35;
    } else if (o.faze === 'rozhlizi') {
      if (o.t <= 0) { f.stav = 'jde'; o.faze = 'odchazi'; }
    } else if (o.faze === 'odchazi' || o.faze === 'vraci') {
      f.x += f.dir * rychlost * dt; f.faze += dt * 9 - dt * 2.4;
      if (o.faze === 'odchazi' && (f.x < -kraj || f.x > L.W + kraj)) {
        o.faze = 'pryc'; o.t = 3 + Math.random() * 5;
        if (L.mluvci === f) schovej(L);
      } else if (o.faze === 'vraci' && (f.x - o.domov.x) * f.dir >= 0) {
        f.x = o.domov.x; f.dir = o.domov.dir;
        if (o.domov.stav === 'visi') { f.stav = 'leze'; o.faze = 'sleza'; o.t = 0.6; }
        else usadDomu(f);
      }
    } else if (o.faze === 'pryc') {
      if (o.t > 0) return;
      f.dir = o.domov.x < L.W / 2 ? 1 : -1;                                         // vrací se odkud odešel
      f.x = f.dir > 0 ? -kraj : L.W + kraj; f.stav = 'jde'; o.faze = 'vraci';
    } else if (o.faze === 'sleza') {
      f.y = L.liniaY + f.h * 0.87 * Math.min(1, 1 - o.t / 0.6); f.faze += dt * 5;
      if (o.t <= 0) { f.y = L.liniaY; usadDomu(f); }
    }
  }
  function usadDomu(f) {
    const d = f.oziv.domov;
    f.houpe = d.houpe;
    if (d.lezic) { f.lezic = true; f.stav = 'sedi'; f.sed = 1; f.cilSed = 1; f.hlava = 0; f.cilHlava = 0; f.rozhlizi = 3; f.cas = 2 + Math.random() * 3; }  // posedí a lehne si
    else f.stav = d.stav === 'lezi' ? 'sedi' : d.stav;
    delete f.oziv;
  }

  // ---------- hlášky: bublina u postavičky na lince ----------
  // Na lince, která má hlášky, se občas náhodně ozve ten, kdo sedí nebo leží. Nejdřív pár sekund poté,
  // co se linka objeví na obrazovce (1–2 s), pak zhruba 5 s po zmizení bubliny další, dokud je linka vidět. Mluví vždy jen jeden.
  // Ladění: ?figurky=hlasky – každá linka promluví hned (i víc najednou), pro screenshoty.
  let hlaskyInterval = null, mluviNekdo = false;
  const ladeniHlasek = /figurky=hlasky/.test(location.search);
  function stylBublin() {
    if (document.getElementById('figurky-bublina-styl')) return;
    const st = document.createElement('style'); st.id = 'figurky-bublina-styl';
    st.textContent = `
      .figurky-bublina{position:absolute;z-index:6;max-width:min(270px,calc(100% - 16px));padding:8px 12px 9px;background:var(--bg,#f1efe9);color:var(--fg,#0b0b0b);
        border:1px solid var(--line,#1d1d1d);border-radius:14px;font:13px/1.32 Arial,Helvetica,sans-serif;letter-spacing:0;text-transform:none;text-align:left;text-wrap:balance;
        pointer-events:none;opacity:0;transform:translateY(6px) scale(.96);transform-origin:var(--ocas,24px) 100%;transition:opacity .35s ease,transform .35s ease}
      .figurky-bublina.videt{opacity:1;transform:none}
      .figurky-bublina:after{content:"";position:absolute;left:calc(var(--ocas,24px) - 6px);bottom:-7px;width:12px;height:12px;background:inherit;
        border-right:1px solid var(--line,#1d1d1d);border-bottom:1px solid var(--line,#1d1d1d);transform:rotate(45deg);border-bottom-right-radius:2px}
      @media (prefers-reduced-motion: reduce){.figurky-bublina{transition:none;transform:none}}`;
    document.head.appendChild(st);
  }
  // kde má mluvčí hlavu (v souřadnicích prvku s linkou)
  function hlavaMluvciho(L, f) {
    const h = f.h, top = parseFloat(L.canvas.style.top);
    if (f.stav === 'visi') return { x: f.x, y: top + f.y - 3 };                     // visící: bublina nad rukama na lince
    if (!f.lezic && f.stav !== 'sedi') return { x: f.x, y: top + f.y - h * 0.99 };  // stojí, jde nebo leze
    const t = f.lezic ? (f.cilSed ?? f.sed ?? 1) : (f.stav === 'sedi' ? 1 : 0);      // u ležícího cílová póza (dosedne, než bublina zmizí)
    const e = t * t * (3 - 2 * t);
    const hx = f.dir * (h * 0.76 + (0 - h * 0.76) * e);
    const hy = (-h * 0.17) + (-h * 0.62 + h * 0.17) * e;
    return { x: f.x + hx, y: top + f.y + hy - h * 0.13 };
  }
  const spolecneBalicky = new WeakMap();
  // pořádné zamíchání (Fisher–Yates); sort s náhodou nechává prvky skoro na místě
  function zamichej(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function rekni(L, ignorujOstatni, vynucena, dobaPevna) {
    if (!L.hlasky.length || (mluviNekdo && !ignorujOstatni)) return false;
    let f = vynucena;
    if (!f) {
      const kandidati = L.fig.filter(f => (f.stav === 'sedi' || f.stav === 'lezi') && (!f.lezic || Math.abs((f.sed ?? 0) - (f.cilSed ?? 0)) < 0.03));
      if (!kandidati.length) return false;
      f = kandidati[Math.floor(Math.random() * kandidati.length)];
    }
    // balíček: projdou se všechny hlášky v náhodném pořadí, než se nějaká zopakuje (a nikdy dvakrát po sobě);
    // linky, které ožívají, berou ze společného balíčku, ať se hlášky střídají napříč nimi
    let B = L;
    if (L.ozivaji) { B = spolecneBalicky.get(L.hlasky); if (!B) spolecneBalicky.set(L.hlasky, B = {}); }
    if (!B.balicek || !B.balicek.length) {
      B.balicek = zamichej(L.hlasky.map((_, k) => k));
      if (B.balicek.length > 1 && B.balicek[B.balicek.length - 1] === B.posledni) B.balicek.unshift(B.balicek.pop());
    }
    const i = B.balicek.pop() % L.hlasky.length;
    B.posledni = i;
    // česká sazba: jednopísmenné předložky a spojky nezůstanou na konci řádku, krátké poslední slovo nezůstane samo
    const text = L.hlasky[i].replace(/(^|\s)([ksvzouaiKSVZOUAI])\s/g, '$1$2\u00a0').replace(/\s(\S{1,3})$/, '\u00a0$1');
    if (!L.bublina) { L.bublina = document.createElement('div'); L.bublina.className = 'figurky-bublina'; L.bublina.setAttribute('role', 'note'); L.el.appendChild(L.bublina); }
    const b = L.bublina; b.textContent = text; b.style.left = '0px'; b.style.top = '0px';
    L.bRozmer = { w: b.offsetWidth, h: b.offsetHeight };
    umistiBublinu(L, f);
    f.mluvi = true; L.mluvci = f; mluviNekdo = true;
    requestAnimationFrame(() => b.classList.add('videt'));
    const doba = dobaPevna || Math.max(4000, Math.min(8000, 3000 + text.length * 50));
    clearTimeout(L.konec); L.konec = setTimeout(() => schovej(L), ladeniHlasek ? 1e9 : doba);
    return true;
  }
  function umistiBublinu(L, f) {
    const b = L.bublina, a = hlavaMluvciho(L, f), { w: bw, h: bh } = L.bRozmer, W = L.el.clientWidth;
    const left = Math.max(8, Math.min(W - bw - 8, a.x - 26));
    const ocas = Math.max(16, Math.min(bw - 16, a.x - left));
    b.style.left = left + 'px'; b.style.top = (a.y - bh - 12) + 'px'; b.style.setProperty('--ocas', ocas + 'px');
  }
  function schovej(L, hned) {
    clearTimeout(L.konec);
    if (L.bublina) L.bublina.classList.remove('videt');
    if (L.mluvci) { L.mluvci.mluvi = false; L.mluvci = null; mluviNekdo = linky.some(x => x.mluvci); }
    L.dalsi = performance.now() + (hned ? 4000 : 4000 + Math.random() * 2000);   // další zhruba za 5 s
  }
  // najetí myší (nebo ťuknutí prstem) na postavičku na lince s hláškami: ozve se hned, bez čekání
  let najeta = null;
  function figurkaNa(L, x, y, tolerance) {
    let nej = null, nd = 1e9;
    for (const f of L.fig) {
      if (f.oziv && f.oziv.faze === 'pryc') continue;                               // je mimo obrazovku
      const h = f.h; let cx = f.x, cy;
      if (f.stav === 'visi') cy = f.y + h * 0.6;
      else if (f.lezic && (f.sed ?? 0) < 0.5) { cx = f.x + f.dir * h * 0.2; cy = f.y - h * 0.15; }
      else cy = f.y - h * 0.35;
      const d = Math.hypot(x - cx, y - cy);
      if (d < h * 0.9 + tolerance && d < nd) { nd = d; nej = f; }
    }
    return nej;
  }
  function najetiNaFigurku(e, tuk) {
    let nalezena = null, naLince = null;
    for (const L of linky) {
      if (!L.canvas || !(L.ozivaji || (L.hlasky && L.hlasky.length))) continue;
      const r = L.canvas.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom || e.clientX < r.left || e.clientX > r.right) continue;
      nalezena = figurkaNa(L, e.clientX - r.left, e.clientY - r.top, tuk ? 18 : 8);
      if (nalezena) { naLince = L; break; }
    }
    const zmena = nalezena !== najeta;
    if (zmena) document.dispatchEvent(new CustomEvent('figurky-najeti', { detail: !!nalezena }));
    najeta = nalezena;
    if (!nalezena || (!zmena && !tuk) || naLince.mluvci === nalezena) return;
    if (naLince.ozivaji && nalezena.oziv) return;                                   // už je na cestě
    linky.forEach(x => { if (x.mluvci) schovej(x); });
    if (naLince.hlasky.length) rekni(naLince, true, nalezena);
    if (naLince.ozivaji) ozij(naLince, nalezena);
  }
  function spustHlasky() {
    if (!linky.some(L => L.ozivaji || (L.hlasky && L.hlasky.length))) return;
    stylBublin();
    if (!spustHlasky.posluchaci) {
      spustHlasky.posluchaci = true;
      document.addEventListener('pointermove', e => { if (e.pointerType !== 'touch') najetiNaFigurku(e, false); }, { passive: true });
      document.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') najetiNaFigurku(e, true); }, { passive: true });
    }
    if (ladeniHlasek) { setTimeout(() => linky.forEach(L => L.hlasky.length && rekni(L, true)), 500); return; }
    if (hlaskyInterval) return;
    hlaskyInterval = setInterval(() => {
      if (document.hidden) return;
      const ted = performance.now(), vh = innerHeight;
      for (const L of linky) {
        if (!L.hlasky || !L.hlasky.length || !L.canvas) continue;
        const r = L.canvas.getBoundingClientRect();
        const vidim = r.top < vh * 0.88 && r.bottom > vh * 0.12;
        if (!vidim) { if (L.mluvci) schovej(L); L.dalsi = null; continue; }
        if (L.ozivaji) continue;                                                          // ty mluví jen po najetí
        if (L.dalsi == null) { L.dalsi = ted + 850 + Math.random() * 950; continue; }   // první hláška 1–2 s po příchodu (včetně kontroly)
        if (ted < L.dalsi || L.mluvci) continue;
        if (!rekni(L)) L.dalsi = ted + 400;                                               // teď nikdo nemůže, zkusí to hned znovu
      }
    }, 120);
  }

  // ---------- reakce na to, co člověk dělá (doplněno pro Ladinu školu) ----------
  // radost: všichni na nadpisu nadskočí, lidé na linkách zvednou ruce a poskakují;
  // smutek: část lidí na nadpisu si sedne, občas zafouká vítr a uletí čepice; poskok: jeden náhodný nadskočí
  function radost() {
    pocasi.blesk();
    const do_ = performance.now() + 1600;
    linky.forEach(L => L.fig.forEach(f => { if (!(f.oziv && f.oziv.faze === 'pryc')) f.jasa = do_; }));
  }
  function smutek() {
    figurky.forEach(f => { if (Math.random() < 0.5 && (f.stav === 'jde' || f.stav === 'stoji' || f.stav === 'kouka')) { f.stav = 'sedi'; f.cas = 2 + Math.random() * 2.5; f.x = Math.round(f.x); } });
    if (Math.random() < 0.6) pocasi.vitr(Math.random() < 0.5 ? -1 : 1, 2800);
  }
  function poskok() {
    const k = figurky.filter(f => ['jde', 'stoji', 'kouka'].includes(f.stav));
    if (k.length) { const f = k[Math.floor(Math.random() * k.length)]; skoc(f, f.x, f.y); }
  }
  // bublina s daným textem u někoho na viditelné lince (krátce, pokud je dán čas v ms)
  function rekniText(text, doba) {
    const kand = linky.filter(L => L.canvas && L.fig.length && L.el.offsetParent !== null && L.el.getBoundingClientRect().bottom > 0 && L.el.getBoundingClientRect().top < innerHeight);
    if (!kand.length) return false;
    const L = kand[Math.floor(Math.random() * kand.length)];
    const f = L.fig.find(g => !(g.oziv && g.oziv.faze === 'pryc')); if (!f) return false;
    linky.forEach(x => { if (x.mluvci) schovej(x, true); });
    stylBublin();
    const puv = L.hlasky; L.hlasky = [text]; L.balicek = null;
    const ok = rekni(L, true, f, doba || 2600);
    L.hlasky = puv; L.balicek = null;
    return ok;
  }
  // po přepnutí obrazovky: znovu změřit nadpis a linky
  function prestav() { if (sestavHlavni) sestavHlavni(); linkySestavy.forEach(s => s()); }

  return { start, linky: linkyStart, pocasi, radost, smutek, poskok, rekni: rekniText, prestav, _linky: linky, _figurky: () => figurky };
})();
