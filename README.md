# Ladina škola

Procvičování češtiny pro 5. třídu: předpony a předložky (s-/z-, roz-, bez-, nad-, pod-, od-, křížovka),
pravopis (vyjmenovaná slova, ě/je, mě/mně, párové souhlásky, slovo základové), slovní druhy a věty.
Postavičky (převzaté z webu Aeroevents) chodí po nadpisu, sedí na linkách a reagují na to, co Lada dělá.

- `index.html` – hotová stránka (GitHub Pages), sestaví ji `./build.sh`
- `src/app.html` – stránka a obsah cvičení, `src/figurky.js` a `src/kone.js` – postavičky a koně

## Český jazyk test (`cesky-test/`)

Samostatná appka na plochu: procvičení strany 25 z pracovního sešitu (Opakování – pravopis) před testem.
Čtyři cvičení – doplň i/í/y/ý (cv. 16), podmět a přísudek + věta jednoduchá/souvětí + rozvitý podmět + klíčová slova,
škrtni nevhodné přísudky + větné vzorce (cv. 17), zakroužkuj podmět a doplň koncovku + závod koncovek (cv. 18).
Po každém kroku proběhne zvířátko (pes, kůň, delfín, leopard, velryba), zamává a pogratuluje; na konci rachejtle a přehlídka.

- `cesky-test/index.html` – celá appka (bez sestavování), `cesky-test/zvirata.js` – kresby zvířátek, `?test` zpřístupní `window.__cj`

## Marie Terezie (`marie-terezie/`)

Vlastivěda pro 5. třídu postavená na Ladině školním sešitu (učebnice s. 14–17, PS s. 10–11). Sešit je osnova, ne kopie:
každé téma má vlastní oddíl s výkladem a hrou a otázky jsou pokaždé jinak položené; otázky ve znění sešitu jsou až na konci.
Devět oddílů – Kdo byla Marie Terezie (Vídeň, 1740–1780, 16 dětí, Evropská babička), Stroj času (novověk, jak poznat 18. století),
Co je reforma? (zásadní změna systému, zlepšení, postupnými kroky), Reformy Marie Terezie (procházka rokem 1780 po 7 reformách,
chytačka, hledání všech sedmi), Do školy! (školská reforma 1774), Josef II. a nevolnictví (příběh nevolníka Honzy, toleranční patent,
povinné příjmení, kdo co zavedl), Pravda, nebo výmysl?, Zajímavosti navíc (co v sešitě není: pragmatická sankce, Slezsko, korunovace,
Schönbrunn, robota, vojsko, zákaz mučení, Terezín, úsporná rakev), Velký test (z každého tématu aspoň jedna otázka), Zkoušení jako ve škole (kartičky).
Vzhled pro starší školačku: papír a zlato, písmo Playfair Display, ikony Lucide (CDN, s náhradními emoji), odměna = císařská pečeť,
na konci císařská listina. Obrazárna se skutečnými obrazy a fotkami z Wikimedia Commons (načítají se přímo odtud, autor a licence u každého).
`?test&demo=pecet|listina|galerie|lightbox|kdo|stanice` otevře danou obrazovku pro snímky.
Používá stejný engine jako `cesky-test/`; zvířátka doplnila císařovna (`ZV.marie`) a portréty `BUSTA` v `zvirata.js`. `?test` zpřístupní `window.__mt`.

## Písemka i/y (`pisemka-iy/`)

Příprava na písemku podle cvičení 22 z učebnice (doplň i, í, y, ý). Ve 20 mezerách cvičení jsou čtyři pravidla a každé má vlastní oddíl
s pravidlem, sérií rychlých otázek a větami: Zvířecí a jarní (přídavná jména jako jarní × mladý), Páni, psi a hrady (pán × hrad, 1. × 4. pád),
Kdo to udělal? (přítomný čas -í, shoda přísudku s podmětem), Vyjmenovaná, nebo ne? (sýr, vy- × Milada, Libor, minulý; chytačka).
Pak Najdi chybu (oprava červenou propiskou), Rychlovka (60 s, rekord), Zkušební písemka (podobné věty, pokaždé trochu jiné) a nakonec
Písemka: cvičení 22 přesně podle učebnice – bez nápověd, s opravou a známkou. Odměna je červená fajfka nebo jednička, na konci žákovská knížka.
Vzhled: čtverečkovaný papír, písma Bitter a Caveat, ikony Lucide. Tahák se všemi pravidly a vyjmenovanými slovy.
`?test&demo=pravidlo|serie|jarni|veta|odmena|zive|shoda|chytej|oprav|rychlovka|pisemka|opraveno|knizka|tahak` otevře danou obrazovku, `?test` zpřístupní `window.__iy`.
