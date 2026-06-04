// Slow Pour — frontend interactions.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Base path (./ in dev, /Multimeedia_eksam/ in the production build) so asset
// URLs built in JS resolve correctly whether hosted at root or a subpath.
const BASE = import.meta.env.BASE_URL;
const asset = (path) => `${BASE}${path.replace(/^\/+/, "")}`;

// Animations run only when the user hasn't requested reduced motion.
const ALLOW_MOTION = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;

function revealOnScroll(target, vars = {}) {
  if (!ALLOW_MOTION || !target) return;
  gsap.from(target, {
    opacity: 0, y: 28, duration: 0.6, ease: "power2.out",
    scrollTrigger: { trigger: target, start: "top 85%" },
    ...vars,
  });
}
function revealCards(container) {
  if (!ALLOW_MOTION || !container) return;
  const cards = container.querySelectorAll(".coffee-card");
  if (!cards.length) return;
  gsap.from(cards, {
    opacity: 0, y: 24, duration: 0.5, ease: "power2.out", stagger: 0.08,
    scrollTrigger: { trigger: container, start: "top 88%" },
  });
  ScrollTrigger.refresh();
}

/* ---- Dark-mode toggle (persists choice; defaults to OS preference) -------- */
const toggle = document.getElementById("theme-toggle");
const saved = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
if (saved === "dark" || (!saved && prefersDark)) document.documentElement.classList.add("dark");

toggle?.addEventListener("click", () => {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  console.log(`[theme] -> ${isDark ? "dark" : "light"}`);
});

/* ---- Mobile nav toggle --------------------------------------------------- */
const navToggle = document.getElementById("nav-toggle");
const siteNav = document.querySelector(".site-nav");
navToggle?.addEventListener("click", () => {
  const open = siteNav.classList.toggle("nav-open");
  navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  navToggle.setAttribute("aria-label", open ? "Sulge menüü" : "Ava menüü");
});

/* ---- Mark the current page in the nav ------------------------------------ */
(() => {
  const here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-menu a").forEach((a) => {
    if (a.getAttribute("href") === here) a.setAttribute("aria-current", "page");
  });
})();

/* ---- Coffee data loader -------------------------------------------------- */
export async function loadCoffees() {
  try {
    const res = await fetch(asset("assets/coffees.json"));
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
          <source srcset="${asset(`assets/img/${img}.avif`)}" type="image/avif" />
          <img src="${asset(`assets/img/${img}.webp`)}" alt="${c.nimi} — kohvipakk" loading="lazy" width="400" height="400" />
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
    revealCards(featured);
  }
  if (popular) {
    popular.innerHTML = coffees.map(coffeeCard).join("");
    console.log(`[home] popular slider: ${coffees.length} cards`);
    revealCards(popular);
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

  // Pre-select a roast level when the URL asks for it (e.g. footer "Hele röst" link).
  const roastParam = getParam("roast");
  if (roastParam && [...selRoast.options].some((o) => o.value === roastParam)) {
    selRoast.value = roastParam;
  }

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
  revealCards(grid);
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
    mainImg.src = asset(`assets/img/${slides[i]}.webp`);
    mainImg.alt = `${nimi} — pilt ${i + 1}`;
    [...thumbs.children].forEach((t, n) => t.setAttribute("aria-current", n === i ? "true" : "false"));
    console.log(`[carousel] slide ${i + 1}/${slides.length}`);
  }
  thumbs.innerHTML = slides
    .map((s, n) => `<button type="button" class="carousel__thumb" data-i="${n}" aria-label="Pilt ${n + 1}"><img src="${asset(`assets/img/${s}.webp`)}" alt="" /></button>`)
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
  revealOnScroll(root.querySelector(".detail__media"));
  revealOnScroll(root.querySelector(".detail__info"));
  revealCards(document.getElementById("related-grid"));
  console.log(`[detail] id=${id} -> ${c.nimi}; related ${related.length}`);
}
initDetail();

/* ---- Contact page (Kontakt): client-side validation + success ------------ */
function setFieldError(input, message) {
  const wrap = input.closest(".field");
  const err = wrap.querySelector(".field__error");
  if (message) {
    wrap.classList.add("field--error");
    if (err) err.textContent = message;
    input.setAttribute("aria-invalid", "true");
  } else {
    wrap.classList.remove("field--error");
    if (err) err.textContent = "";
    input.removeAttribute("aria-invalid");
  }
}
function initContact() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  const success = document.getElementById("contact-success");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const checks = [
      ["nimi", (v) => v.trim().length >= 2, "Palun sisesta oma nimi."],
      ["email", (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), "Palun sisesta korrektne e-post."],
      ["sonum", (v) => v.trim().length >= 5, "Palun kirjuta sõnum (vähemalt 5 tähemärki)."],
    ];
    let ok = true;
    checks.forEach(([name, test, msg]) => {
      const input = form.elements[name];
      const valid = test(input.value);
      if (!valid) ok = false;
      setFieldError(input, valid ? "" : msg);
    });
    console.log(`[contact] submit valid=${ok}`);
    if (ok) { form.hidden = true; success.hidden = false; }
  });
}
initContact();

/* ---- Order page (Tellimus): coffee picker + qty + live summary ----------- */
async function initOrder() {
  const form = document.getElementById("order-form");
  if (!form) return;
  const all = await loadCoffees();
  if (!all.length) return;

  const select = form.elements["coffee"];
  select.innerHTML = all
    .map((c) => `<option value="${c.id}">${c.nimi} — €${Number(c.hind).toFixed(2)}</option>`)
    .join("");
  const preId = Number(getParam("id"));
  if (preId && all.some((c) => c.id === preId)) select.value = String(preId);

  const qtyInput = form.elements["qty"];
  const FREE_SHIP = 35;
  const SHIP = 3.5;
  const el = (id) => document.getElementById(id);

  function render() {
    const c = all.find((x) => x.id === Number(select.value)) || all[0];
    const qty = Math.max(1, Number(qtyInput.value) || 1);
    const unit = Number(c.hind);
    const sub = unit * qty;
    const ship = sub >= FREE_SHIP ? 0 : SHIP;
    el("sum-item").textContent = c.nimi;
    el("sum-qty").textContent = qty;
    el("sum-unit").textContent = `€${unit.toFixed(2)}`;
    el("sum-sub").textContent = `€${sub.toFixed(2)}`;
    el("sum-ship").textContent = ship === 0 ? "Tasuta" : `€${ship.toFixed(2)}`;
    el("sum-total").textContent = `€${(sub + ship).toFixed(2)}`;
    console.log(`[order] ${c.nimi} x${qty} sub=${sub.toFixed(2)} ship=${ship} total=${(sub + ship).toFixed(2)}`);
  }

  select.addEventListener("change", render);
  qtyInput.addEventListener("input", render);
  form.querySelectorAll("[data-qty]").forEach((btn) =>
    btn.addEventListener("click", () => {
      qtyInput.value = Math.max(1, (Number(qtyInput.value) || 1) + Number(btn.dataset.qty));
      render();
    })
  );
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let ok = true;
    form.querySelectorAll("[required]").forEach((inp) => {
      const valid = inp.value.trim().length > 0;
      if (!valid) ok = false;
      setFieldError(inp, valid ? "" : "Kohustuslik väli.");
    });
    console.log(`[order] submit valid=${ok}`);
    if (ok) { form.hidden = true; el("order-success").hidden = false; }
  });
  render();
}
initOrder();

/* ---- Page-load + scroll animations (GSAP + ScrollTrigger) ---------------- */
function initAnimations() {
  if (!ALLOW_MOTION) return;
  const heroBits = document.querySelectorAll(".hero__content > *");
  if (heroBits.length) {
    gsap.from(heroBits, { opacity: 0, y: 24, duration: 0.7, ease: "power2.out", stagger: 0.1 });
  }
  if (document.querySelector(".hero__media")) {
    gsap.to(".hero__media", {
      yPercent: 15,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
  }
  document
    .querySelectorAll(".section-head, .mission__text, .mission__media, .events, .contact__info, .contact__form-wrap, .order__form, .order-summary")
    .forEach((el) => revealOnScroll(el));
}
initAnimations();
