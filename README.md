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
