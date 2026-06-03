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
