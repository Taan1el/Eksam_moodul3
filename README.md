# Slow Pour front-end

Taaniel Vananurm, MM-23

Moodul 3 on Slow Pour kohviröstikoja mitmeleheline front-end. Leht töötab
eraldi Vite projektina ning selle production build avaldatakse lõpurepo kaudu
GitHub Pagesis.

## Tehnoloogia

- Vite ja Vituum buildi ning arenduskeskkonna jaoks
- Nunjucks korduvkasutatavate layout'ide ja komponentide jaoks
- Tailwind CSS koos oma disainitokenitega
- Vanilla JavaScript ES-moodulitena
- GSAP ja ScrollTrigger kerimisanimatsioonide jaoks
- kohalikud WOFF2 fondid: Fraunces, DM Sans ja Space Mono

## Lehed

Põhilehed:

1. Avaleht
2. Kohvisordid
3. Kohvi detailleht
4. Kontakt
5. Tellimus

Footerist avanevad ka KKK, tarne, tagastuse ja kohviku infolehed.

## Funktsioonid

- responsiivne kujundus desktopi, tahvli ja mobiili jaoks
- mobiilimenüü ning nähtavad klaviatuurifookused
- hele ja tume teema, valik salvestatakse brauserisse
- kohvisortide filtreerimine ja hinna järgi sortimine
- pildikarussell, tellimuse kokkuvõte ja front-endi ostukorv
- GSAP kerimisanimatsioonid ning kerimisega juhitav hero-video
- `prefers-reduced-motion` tugi
- WebP ja AVIF pildid, mõõtmed, lazy loading ja responsive `sizes`
- kohalikud fondid ilma välise CDN-ita

Animatsioonide kood laaditakse alles esimese kasutaja tegevuse järel. Mobiilis
hero-videot ei laadita ning väiksel ekraanil kasutatakse süsteemifonte. See
hoiab esialgse laadimise väiksemana.

## Käivitamine

```powershell
npm install
npm run dev
```

Production build:

```powershell
npm run build
npm run preview
```

Build tekib kausta `dist/`. Production base path on
`/Multimeedia_eksam/`, sest avalik leht asub GitHub Pagesi alamteel.

## Kaustad

```text
src/
  components/   nav ja footer
  layouts/      ühine baasmall
  pages/        lehtede Nunjucksi mallid
  scripts/      põhiloogika ja eraldi motion-moodul
  styles/       disainitokenid, stiilid ja fondid
public/
  assets/       kohviandmed, pildid ja hero-video
scripts/
  inline-css.mjs
```

`npm run build` lisab kriitilise CSS-i otse HTML-i. JavaScript ja
animatsioonid jäävad eraldi failidesse ning laaditakse vajaduse järgi.

## Andmed ja backend

Staatilise front-endi kohviandmed on failis `public/assets/coffees.json`.
Moodul 4 kasutab sama sisu SQLite andmebaasis ning lisab päris vormitöötluse,
admini ja serveripoolse valideerimise.

## Avalik leht

https://taan1el.github.io/Multimeedia_eksam/
