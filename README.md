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

Vlastivěda pro 5. třídu: osvícenství, Marie Terezie a její reformy, navazující Josef II.
Osm oddílů – Otázky ze sešitu (přesně podle Ladina školního sešitu), Příběh (9 kapitol s otázkou), Pravda, nebo výmysl?,
Kdo to zavedl? (Marie Terezie × Josef II.), Časová osa (1717, 1740, 1774, 1780), Do školy! (padací hra s věcmi z roku 1774 + otázky),
Kartičky na test (otázka → otočit → věděla/nevěděla, co nevěděla, přijde znovu), Velký test (všechny otázky ze sešitu + pár dalších).
Obsah hlavně podle Ladina sešitu (reforma = zásadní změna systému postupnými kroky, novověk, 18. st., jednotná měna, školská reforma,
jednotné zákony, sčítání obyvatel, číslování domů, zdravotní reforma, manufaktury, Evropská babička; Josef II.: nevolnictví,
toleranční patent, povinné příjmení; učebnice s. 14–17, PS s. 10–11), doplněno z Malované vlastivědy 5 a listu Žili byli (ČRo Junior).
Používá stejný engine jako `cesky-test/`; zvířátka doplnila císařovna (`ZV.marie`) a portréty `BUSTA` v `zvirata.js`. `?test` zpřístupní `window.__mt`.
