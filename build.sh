#!/bin/sh
# Sestaví index.html ze src/app.html + src/figurky.js + src/kone.js
cd "$(dirname "$0")" || exit 1
python3 - <<'PY'
src = open('src/app.html', encoding='utf-8').read()
fig = open('src/figurky.js', encoding='utf-8').read()
kone = open('src/kone.js', encoding='utf-8').read()
assert '//__FIGURKY__' in src and '//__KONE__' in src
esc = lambda t: t.replace('</script', '<\\/script')   # komentáře modulů obsahují </script>, to by ukončilo značku
out = src.replace('//__FIGURKY__', esc(fig)).replace('//__KONE__', esc(kone))
open('index.html', 'w', encoding='utf-8').write(out)
print('built index.html (%d bytes)' % len(out))
PY
