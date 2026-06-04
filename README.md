# Slow Pour front-end

Taaniel Vananurm MM-23

Moodul 3 front-end Slow Pour kohviröstikoja eksamiprojekti jaoks. Staatiline,
responsiivne mitmeleheline veebileht, mis järgib Moodul 1 disaini.

## Tehnoloogia

- Vite (build ja arenduskeskkond)
- Vituum + Nunjucks (mallid ja korduvkasutatavad komponendid)
- Tailwind CSS (utiliidid) + oma disainitokenid (`src/styles/tokens.css`)
- Vanilla JavaScript (ES-moodulid)
- Kohalikud fondid: Fraunces, DM Sans, Space Mono (OFL, ei kasuta CDN-i)

## Lehed

1. **Avaleht** (`index`) - hero (videoga), tutvustus, värsked sordid, sündmused, populaarsed, CTA
2. **Kohvisordid** - filtrid (päritolu, röstiaste) + sortimine (hind) + tulemuste arv
3. **Detailleht** - pildikarussell, kirjeldus, andmed (päritolu, röstiaste, maitseprofiil, kaal)
4. **Kontakt** - kontaktivorm valideerimise ja õnnestumisteatega
5. **Tellimus** - tellimisvorm, koguse valik, jahvatus, elav kokkuvõte (tasuta tarne 35 eurost)

## Funktsioonid

- Responsiivne: 390 / 768 / 1920, mobiilis kokkupandav menüü
- Tume/hele teema (valik salvestatakse `localStorage`-isse)
- Töötavad filtrid, sortimine, karussell ja vormivalideerimine
- Animatsioonid: hero-video, kerimisel ilmuvad sektsioonid (IntersectionObserver)
- Ligipääsetavus: semantiline HTML, ARIA, "liigu sisu juurde" link, nähtav klaviatuurifookus, `aria-current`
- `prefers-reduced-motion` toetus (animatsioonid lülituvad välja)
- Optimeeritud pildid (WebP/AVIF, `loading="lazy"`)

## Paigaldus ja käivitamine

```powershell
npm install
npm run dev       # arendus, http://localhost:5173/
npm run build     # toodanguversioon kausta dist/
npm run preview   # toodanguversiooni eelvaade
```

Märkus: toodangu-build kasutab base-teed `/Multimeedia_eksam/` GitHub Pages jaoks.
Arenduses (`npm run dev`) töötab leht juurkataloogis `/`.

## Kausta struktuur

```text
src/
  pages/        5 lehte (.njk)
  layouts/      base.njk
  components/   nav.njk, footer.njk
  scripts/      main.js
  styles/       tokens.css, main.css, fonts/
public/
  assets/       coffees.json, img/ (pildid + hero-video)
```

## Andmed

Kohvisortide andmed on failis `public/assets/coffees.json` (sama andmestik
toidab ka Moodul 4 andmebaasi).

## Hosting

Toodangu-build on avaldatud GitHub Pages kaudu lõpurepos:
https://taan1el.github.io/Multimeedia_eksam/

## Märkused

- Vormide reaalne saatmine (kontakti e-kiri, tellimuste salvestamine) toimub
  **Moodul 4** back-endis. Siin moodulis on vormidel front-end valideerimine ja
  õnnestumisteated.
- Pildid on loodud Moodul 2-s; fondid on avatud lähtekoodiga (OFL litsents,
  `src/styles/fonts/`).
