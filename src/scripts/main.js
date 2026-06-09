// Slow Pour — frontend interactions.

// Base path (./ in dev, /Multimeedia_eksam/ in the production build) so asset
// URLs built in JS resolve correctly whether hosted at root or a subpath.
const BASE = import.meta.env.BASE_URL;
const asset = (path) => `${BASE}${path.replace(/^\/+/, "")}`;

let motionApi;
let motionPromise;

// Called right after dynamic content is injected. Ensure motion is loaded, then
// reveal that specific target — so JS-rendered cards never miss their animation
// (avoids a race where the global scan runs before the cards exist).
function revealOnScroll(target, vars = {}) {
  if (!target) return;
  loadMotion().then(() => motionApi?.revealOnScroll(target, vars));
}

function revealCards(container) {
  if (!container) return;
  loadMotion().then(() => motionApi?.revealCards(container));
}

function loadMotion() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return Promise.resolve();
  }
  motionPromise ??= import("./motion.js").then((motion) => {
    motionApi = motion;
    motion.initMotion();
  });
  return motionPromise;
}

window.addEventListener("scroll", loadMotion, { once: true, passive: true });
window.addEventListener("pointerdown", loadMotion, { once: true, passive: true });
window.addEventListener("keydown", loadMotion, { once: true });

// Also load once the page is idle, so the reveal/parallax animations run without
// requiring the visitor to interact first. Deferred to protect first-paint perf.
const idleLoadMotion = () => (window.requestIdleCallback || ((cb) => setTimeout(cb, 200)))(loadMotion);
if (document.readyState === "complete") idleLoadMotion();
else window.addEventListener("load", idleLoadMotion, { once: true });

if (new URLSearchParams(location.search).get("motion") === "on") {
  loadMotion();
}

/* ---- Dark-mode toggle (persists choice; defaults to OS preference) -------- */
const toggle = document.getElementById("theme-toggle");
const saved = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

function syncThemeSources(isDark) {
  document.querySelectorAll('[data-theme-source="dark"]').forEach((source) => {
    source.media = isDark ? "all" : "not all";
  });
}

if (saved === "dark" || (!saved && prefersDark)) document.documentElement.classList.add("dark");
if (saved) syncThemeSources(saved === "dark");

toggle?.addEventListener("click", () => {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  syncThemeSources(isDark);
  console.log(`[theme] -> ${isDark ? "dark" : "light"}`);
});

/* ---- Cart (multiple coffee types, each with its own quantity; localStorage) */
const CART_KEY = "slowpour-cart";
const cartEl = document.getElementById("cart");
const cartToggle = document.getElementById("cart-toggle");
const cartPanel = document.getElementById("cart-panel");
const cartCount = document.getElementById("cart-count");
let cartCoffees = [];

// Cart is an array of lines: [{ id, qty }]. Old single-object format is migrated.
function readCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY));
    const arr = Array.isArray(raw) ? raw : raw && raw.id ? [raw] : [];
    return arr.filter((l) => l && l.id && l.qty > 0);
  } catch {
    return [];
  }
}
function writeCart(cart) {
  const clean = cart.filter((l) => l.qty > 0);
  if (clean.length) localStorage.setItem(CART_KEY, JSON.stringify(clean));
  else localStorage.removeItem(CART_KEY);
  renderCart();
}

// Adding an existing coffee bumps its quantity; a new coffee adds another line.
export function addToCart(id, qty = 1) {
  const cart = readCart();
  const line = cart.find((l) => l.id === id);
  if (line) line.qty += qty;
  else cart.push({ id, qty });
  writeCart(cart);
  // Defer so this same click finishes bubbling before the panel opens —
  // otherwise the document outside-click handler closes it immediately.
  setTimeout(openCart, 0);
  console.log(`[cart] add id=${id} -> ${cart.length} line(s)`);
}

function renderCart() {
  const cart = readCart();
  const count = cart.reduce((n, l) => n + l.qty, 0);
  if (cartCount) {
    cartCount.textContent = count;
    cartCount.hidden = count === 0;
  }
  if (cartToggle) {
    cartToggle.setAttribute("aria-label", count ? `Ava ostukorv (${count})` : "Ava ostukorv");
  }
  if (!cartPanel) return;

  const lines = cart
    .map((l) => ({ ...l, c: cartCoffees.find((x) => x.id === l.id) }))
    .filter((l) => l.c);
  if (!lines.length) {
    cartPanel.innerHTML = `<p class="cart-panel__empty">Korv on tühi.</p>`;
    return;
  }
  const grand = lines.reduce((s, l) => s + Number(l.c.hind) * l.qty, 0).toFixed(2);
  cartPanel.innerHTML = `
    <p class="cart-panel__title">Sinu korv</p>
    ${lines
      .map(
        (l) => `
    <div class="cart-line" data-line="${l.id}">
      <div class="cart-line__info">
        <span class="cart-line__name">${l.c.nimi}</span>
        <span class="cart-line__meta num">€${Number(l.c.hind).toFixed(2)} · ${l.c.kaal}</span>
      </div>
      <button type="button" class="cart-line__remove" data-cart-remove="${l.id}" aria-label="Eemalda korvist: ${l.c.nimi}">×</button>
      <div class="cart-line__row">
        <div class="qty">
          <button type="button" class="qty__btn" data-cart-qty="-1" data-id="${l.id}" aria-label="Vähenda kogust">−</button>
          <span class="qty__input num" aria-live="polite">${l.qty}</span>
          <button type="button" class="qty__btn" data-cart-qty="1" data-id="${l.id}" aria-label="Suurenda kogust">+</button>
        </div>
        <span class="cart-line__total num">€${(Number(l.c.hind) * l.qty).toFixed(2)}</span>
      </div>
    </div>`
      )
      .join("")}
    <div class="cart-panel__sum"><span>Kokku</span><span class="num">€${grand}</span></div>
    <a class="btn btn--primary btn--sm cart-panel__checkout" href="tellimus.html">Vormista tellimus →</a>`;
}

function openCart() {
  if (!cartPanel || !cartToggle) return;
  cartPanel.hidden = false;
  cartToggle.setAttribute("aria-expanded", "true");
}
function closeCart() {
  if (!cartPanel || !cartToggle) return;
  cartPanel.hidden = true;
  cartToggle.setAttribute("aria-expanded", "false");
}

async function initCart() {
  if (!cartToggle) return;
  cartCoffees = await loadCoffees();
  renderCart();

  cartToggle.addEventListener("click", () => {
    if (cartPanel.hidden) openCart();
    else closeCart();
  });
  cartPanel.addEventListener("click", (e) => {
    const step = e.target.closest("[data-cart-qty]");
    const remove = e.target.closest("[data-cart-remove]");
    if (!step && !remove) return;
    // renderCart() rebuilds the panel and detaches this button, so the click
    // would reach the document handler with a detached target and wrongly close
    // the cart. Stop it here — control clicks stay inside the panel.
    e.stopPropagation();
    const cart = readCart();
    if (step) {
      const id = Number(step.dataset.id);
      const line = cart.find((l) => l.id === id);
      if (line) line.qty = Math.max(0, line.qty + Number(step.dataset.cartQty));
      writeCart(cart);
    } else if (remove) {
      writeCart(cart.filter((l) => l.id !== Number(remove.dataset.cartRemove)));
    }
  });
  document.addEventListener("click", (e) => {
    if (!cartPanel.hidden && cartEl && !cartEl.contains(e.target)) closeCart();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeCart();
  });
}
initCart();

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

/* ---- Coffee card markup (shared by featured + popular + list) -------------
   opts.cart adds a "Lisa korvi" button above the "Vaata" row. Guarded with
   `=== true` so Array.map's index argument (a number) never enables it.        */
export function coffeeCard(c, opts) {
  const img = roastImage(c.rostitase);
  const origin = (c.paritolu || "").split(",")[0];
  const price = Number(c.hind).toFixed(2);
  const addBtn = opts && opts.cart === true
    ? `<button type="button" class="btn btn--primary btn--sm coffee-card__add" data-add-cart="${c.id}" aria-label="Lisa korvi: ${c.nimi}">Lisa korvi</button>`
    : "";
  return `
    <article class="coffee-card">
      <a class="coffee-card__media" href="detail.html?id=${c.id}" aria-label="Vaata: ${c.nimi}">
        <picture>
          <source srcset="${asset(`assets/img/${img}.avif`)}" type="image/avif" />
          <img src="${asset(`assets/img/${img}.webp`)}" alt="${c.nimi} — kohvipakk" loading="lazy" decoding="async" width="400" height="400" sizes="(max-width: 600px) calc(100vw - 40px), (max-width: 900px) calc(50vw - 36px), 400px" />
        </picture>
      </a>
      <div class="coffee-card__body">
        <div class="coffee-card__tags">
          <span class="tag">${origin}</span>
          <span class="tag tag--roast">${c.rostitase}</span>
        </div>
        <h3 class="coffee-card__name">${c.nimi}</h3>
        <p class="coffee-card__origin">${c.paritolu}</p>
        ${addBtn}
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
    grid.innerHTML = list.map((c) => coffeeCard(c, { cart: true })).join("");
    // Drop the initial-load height reserve once real cards are in (keeps the
    // first paint from shifting the footer, without bloating filtered views).
    grid.classList.remove("is-loading");
    countEl.textContent = `${list.length} toodet`;
    emptyEl.hidden = list.length > 0;
    console.log(`[catalog] paritolu=${par || "*"} rostitase=${roast || "*"} sort=${sort || "-"} -> ${list.length}`);
  }
  // Delegated "Lisa korvi" — survives grid re-renders on filter/sort.
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add-cart]");
    if (btn) addToCart(Number(btn.dataset.addCart), 1);
  });
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
    .map((s, n) => `<button type="button" class="carousel__thumb" data-i="${n}" aria-label="Pilt ${n + 1}"><img src="${asset(`assets/img/${s}.webp`)}" alt="" loading="lazy" decoding="async" width="72" height="72" /></button>`)
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
  document.getElementById("detail-add-cart")?.addEventListener("click", () => addToCart(c.id, 1));

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
  document.getElementById("order-add-cart")?.addEventListener("click", () =>
    addToCart(Number(select.value), Math.max(1, Number(qtyInput.value) || 1))
  );
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
