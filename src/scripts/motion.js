import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function revealOnScroll(target, vars = {}) {
  if (!target) return;
  gsap.from(target, {
    opacity: 0,
    y: 56,
    scale: 0.96,
    duration: 0.85,
    ease: "power3.out",
    scrollTrigger: { trigger: target, start: "top 88%", once: true },
    ...vars,
  });
}

export function revealCards(container) {
  const cards = container?.querySelectorAll(".coffee-card");
  if (!cards?.length) return;
  gsap.from(cards, {
    opacity: 0,
    y: 32,
    duration: 0.6,
    ease: "power3.out",
    stagger: 0.08,
    clearProps: "transform,opacity",
    scrollTrigger: { trigger: container, start: "top 92%", once: true },
  });
}

function animateHeroVideo() {
  const hero = document.querySelector(".hero");
  const video = document.querySelector(".hero__video");
  if (!hero || !video?.dataset.src) return () => {};

  // data-src is a root-absolute path that Vite does not rewrite, so prefix the
  // build base (e.g. /Multimeedia_eksam/) or the video 404s on the Pages subpath.
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  video.src = video.dataset.src.startsWith("/") ? base + video.dataset.src : video.dataset.src;
  video.muted = true;
  video.load();
  video.pause();

  const bind = () => {
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;
    video.currentTime = 0;
    gsap.to(video, {
      currentTime: Math.max(video.duration - 0.05, 0),
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom+=35% top",
        scrub: true,
      },
    });
  };

  video.addEventListener("loadedmetadata", bind, { once: true });
  return () => video.removeEventListener("loadedmetadata", bind);
}

let motion;

export function initMotion() {
  if (motion) return;
  motion = gsap.matchMedia();

  motion.add("(prefers-reduced-motion: no-preference)", () => {
    const hero = document.querySelector(".hero");
    const heroContent = document.querySelector(".hero__content");
    const heroScrim = document.querySelector(".hero__scrim");
    const heroBits = document.querySelectorAll(".hero__content > *");

    if (heroBits.length) {
      gsap.from(heroBits, {
        opacity: 0,
        y: 24,
        duration: 0.7,
        ease: "power2.out",
        stagger: 0.1,
      });
    }

    if (hero && document.querySelector(".hero__media")) {
      gsap.to(".hero__media", {
        yPercent: 18,
        scale: 1.08,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
      });
    }

    if (hero && heroContent) {
      gsap.to(heroContent, {
        yPercent: -18,
        opacity: 0.38,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
      });
    }

    if (hero && heroScrim) {
      gsap.to(heroScrim, {
        opacity: 0.72,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
      });
    }

    document
      .querySelectorAll(
        ".section-head, .mission__text, .mission__media, .events, .contact__info, .contact__form-wrap, .order__form, .order-summary, .detail__media, .detail__info",
      )
      .forEach((element) => revealOnScroll(element));

    document
      .querySelectorAll(".card-grid, .popular__track")
      .forEach((container) => revealCards(container));
  });

  motion.add(
    "(min-width: 769px) and (prefers-reduced-motion: no-preference)",
    () => animateHeroVideo(),
  );

  ScrollTrigger.refresh();
  window.addEventListener("pagehide", () => motion?.revert(), { once: true });
}
