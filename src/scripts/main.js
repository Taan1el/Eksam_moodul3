// Slow Pour — frontend interactions.

/* ---- Dark-mode toggle (persists choice) ---------------------------------- */
const toggle = document.getElementById("theme-toggle");
const saved = localStorage.getItem("theme");
if (saved === "dark") document.documentElement.classList.add("dark");

toggle?.addEventListener("click", () => {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  console.log(`[theme] -> ${isDark ? "dark" : "light"}`);
});

/* ---- Coffee data loader -------------------------------------------------- */
export async function loadCoffees() {
  try {
    const res = await fetch("/assets/coffees.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log(`[data] loaded ${data.length} coffees`);
    return data;
  } catch (err) {
    console.warn("[data] failed to load coffees:", err.message);
    return [];
  }
}

/* ---- Map roast level -> the real Module 2 image basename ------------------ */
function roastImage(rostitase) {
  const r = (rostitase || "").toLowerCase();
  if (r.includes("tume")) return "dark-roast";
  if (r.includes("keskmine-hele")) return "light-roast";
  if (r.includes("keskmine")) return "medium-roast";
  if (r.includes("hele")) return "light-roast";
  return "medium-roast";
}

/* ---- Coffee card markup (shared by featured + popular + list) ------------- */
export function coffeeCard(c) {
  const img = roastImage(c.rostitase);
  const origin = (c.paritolu || "").split(",")[0];
  const price = Number(c.hind).toFixed(2);
  return `
    <article class="coffee-card">
      <a class="coffee-card__media" href="detail.html?id=${c.id}" aria-label="Vaata: ${c.nimi}">
        <picture>
          <source srcset="/assets/img/${img}.avif" type="image/avif" />
          <img src="/assets/img/${img}.webp" alt="${c.nimi} — kohvipakk" loading="lazy" width="400" height="400" />
        </picture>
      </a>
      <div class="coffee-card__body">
        <div class="coffee-card__tags">
          <span class="tag">${origin}</span>
          <span class="tag tag--roast">${c.rostitase}</span>
        </div>
        <h3 class="coffee-card__name">${c.nimi}</h3>
        <p class="coffee-card__origin">${c.paritolu}</p>
        <div class="coffee-card__foot">
          <span class="coffee-card__price num">€${price}</span>
          <a class="btn btn--outline btn--sm" href="detail.html?id=${c.id}">Vaata →</a>
        </div>
      </div>
    </article>`;
}

/* ---- Home page: fill the featured grid + popular slider ------------------- */
async function initHome() {
  const featured = document.querySelector("[data-featured]");
  const popular = document.querySelector("[data-popular]");
  if (!featured && !popular) return;

  const coffees = await loadCoffees();
  if (!coffees.length) return;

  if (featured) {
    featured.innerHTML = coffees.slice(0, 3).map(coffeeCard).join("");
    console.log("[home] featured grid: 3 cards");
  }
  if (popular) {
    popular.innerHTML = coffees.map(coffeeCard).join("");
    console.log(`[home] popular slider: ${coffees.length} cards`);
  }
}

initHome();

/* ---- Catalog page (Kohvisordid): grid + filters + sort ------------------- */
function unique(arr) { return [...new Set(arr)]; }
function fillSelect(sel, values) {
  values.forEach((v) => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = v;
    sel.appendChild(o);
  });
}
async function initCatalog() {
  const grid = document.getElementById("coffee-grid");
  if (!grid) return;
  const bar = document.getElementById("filter-bar");
  const countEl = document.getElementById("result-count");
  const emptyEl = document.getElementById("empty-note");
  const selPar = bar.querySelector('[data-filter="paritolu"]');
  const selRoast = bar.querySelector('[data-filter="rostitase"]');
  const selSort = bar.querySelector('[data-sort="hind"]');
  const resetBtn = bar.querySelector("[data-filter-reset]");

  const all = await loadCoffees();
  if (!all.length) { grid.innerHTML = ""; return; }
  fillSelect(selPar, unique(all.map((c) => c.paritolu)));
  fillSelect(selRoast, unique(all.map((c) => c.rostitase)));

  function apply() {
    const par = selPar.value;
    const roast = selRoast.value;
    const sort = selSort.value;
    let list = all.filter((c) => (!par || c.paritolu === par) && (!roast || c.rostitase === roast));
    if (sort === "asc") list = [...list].sort((a, b) => a.hind - b.hind);
    if (sort === "desc") list = [...list].sort((a, b) => b.hind - a.hind);
    grid.innerHTML = list.map(coffeeCard).join("");
    countEl.textContent = `${list.length} toodet`;
    emptyEl.hidden = list.length > 0;
    console.log(`[catalog] paritolu=${par || "*"} rostitase=${roast || "*"} sort=${sort || "-"} -> ${list.length}`);
  }
  [selPar, selRoast, selSort].forEach((el) => el.addEventListener("change", apply));
  resetBtn.addEventListener("click", () => {
    selPar.value = "";
    selRoast.value = "";
    selSort.value = "";
    apply();
  });
  apply();
}
initCatalog();

/* ---- Detail page (Detailleht): carousel + specs + related ---------------- */
function getParam(name) { return new URLSearchParams(location.search).get(name); }

function initCarousel(nimi, slides) {
  const mainImg = document.getElementById("carousel-main");
  const thumbs = document.getElementById("carousel-thumbs");
  let i = 0;
  function show(idx) {
    i = (idx + slides.length) % slides.length;
    mainImg.src = `/assets/img/${slides[i]}.webp`;
    mainImg.alt = `${nimi} — pilt ${i + 1}`;
    [...thumbs.children].forEach((t, n) => t.setAttribute("aria-current", n === i ? "true" : "false"));
    console.log(`[carousel] slide ${i + 1}/${slides.length}`);
  }
  thumbs.innerHTML = slides
    .map((s, n) => `<button type="button" class="carousel__thumb" data-i="${n}" aria-label="Pilt ${n + 1}"><img src="/assets/img/${s}.webp" alt="" /></button>`)
    .join("");
  thumbs.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => show(Number(b.dataset.i))));
  document.querySelector("[data-carousel-prev]").addEventListener("click", () => show(i - 1));
  document.querySelector("[data-carousel-next]").addEventListener("click", () => show(i + 1));
  show(0);
}

async function initDetail() {
  const root = document.getElementById("detail");
  if (!root) return;
  const missing = document.getElementById("detail-missing");
  const all = await loadCoffees();
  const id = Number(getParam("id")) || (all[0] && all[0].id);
  const c = all.find((x) => x.id === id);
  if (!c) { missing.hidden = false; console.warn("[detail] coffee not found:", id); return; }

  root.hidden = false;
  document.title = `${c.nimi} — Slow Pour`;
  document.getElementById("detail-tags").innerHTML =
    `<span class="tag">${c.paritolu.split(",")[0]}</span><span class="tag tag--roast">${c.rostitase}</span>`;
  document.getElementById("detail-name").textContent = c.nimi;
  document.getElementById("detail-price").textContent = `€${Number(c.hind).toFixed(2)}`;
  document.getElementById("detail-desc").textContent = c.kirjeldus;

  const specs = [
    ["Päritolu", c.paritolu],
    ["Röstitase", c.rostitase],
    ["Maitseprofiil", c.maitseprofiil.join(", ")],
    ["Kaal", c.kaal],
  ];
  document.getElementById("detail-specs").innerHTML = specs
    .map(([k, v]) => `<div class="specs__row"><dt>${k}</dt><dd>${v}</dd></div>`)
    .join("");
  document.getElementById("detail-cta").href = `tellimus.html?id=${c.id}`;

  initCarousel(c.nimi, [roastImage(c.rostitase), "hero", "pattern"]);

  const related = all.filter((x) => x.id !== c.id).slice(0, 3);
  document.getElementById("related-grid").innerHTML = related.map(coffeeCard).join("");
  console.log(`[detail] id=${id} -> ${c.nimi}; related ${related.length}`);
}
initDetail();
