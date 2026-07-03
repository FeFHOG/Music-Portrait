import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;
const canvas = document.querySelector("#spatial-canvas");
const ctx = canvas.getContext("2d", { alpha: false });
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let width = 0;
let height = 0;
let dpr = 1;
let time = 0;
let scroll = 0;

const pointer = {
  x: 0.58,
  y: 0.42,
  sx: 0.58,
  sy: 0.42,
  lx: 0.58,
  ly: 0.42,
  speed: 0,
};

const folds = [
  { x: -0.1, y: 0.08, w: 0.52, h: 0.4, r: -0.16, c: "rgba(244, 12, 63, 0.26)" },
  { x: 0.58, y: -0.08, w: 0.55, h: 0.38, r: 0.1, c: "rgba(243, 239, 230, 0.08)" },
  { x: 0.34, y: 0.36, w: 0.78, h: 0.5, r: -0.04, c: "rgba(244, 12, 63, 0.14)" },
  { x: -0.08, y: 0.66, w: 0.7, h: 0.34, r: 0.09, c: "rgba(243, 239, 230, 0.06)" },
];

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function pointerBend(x, y, amount = 1) {
  const dx = x - pointer.sx * width;
  const dy = y - pointer.sy * height;
  const distance = Math.hypot(dx, dy);
  const radius = Math.max(220, Math.min(width, height) * 0.42 + pointer.speed * 820);
  const falloff = Math.max(0, 1 - distance / radius);
  const force = falloff * falloff * amount;
  const angle = Math.atan2(dy, dx);

  return {
    x: Math.cos(angle) * force * 46,
    y: Math.sin(angle) * force * 30,
    force,
  };
}

function drawFold({ x, y, w, h, r, c }, index) {
  const px = x * width;
  const py = y * height;
  const pw = w * width;
  const ph = h * height;
  const cx = px + pw * 0.5;
  const cy = py + ph * 0.5;
  const bend = pointerBend(cx, cy, 1.15);
  const drift = Math.sin(time * 0.0004 + index) * 18;

  ctx.save();
  ctx.translate(cx + bend.x, cy + bend.y + drift * 0.25);
  ctx.rotate(r + scroll * 0.06 + bend.force * 0.08);
  ctx.transform(1, 0.05 + scroll * 0.08, -0.08, 1, 0, 0);

  const gradient = ctx.createLinearGradient(-pw * 0.5, -ph * 0.5, pw * 0.5, ph * 0.5);
  gradient.addColorStop(0, c);
  gradient.addColorStop(0.62, "rgba(22, 0, 0, 0.2)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.38)");
  ctx.fillStyle = gradient;
  ctx.fillRect(-pw * 0.5, -ph * 0.5, pw, ph);

  ctx.fillStyle = "rgba(243, 239, 230, 0.035)";
  const cell = Math.max(58, width * 0.055);
  for (let gx = -pw * 0.5; gx < pw * 0.5; gx += cell) {
    for (let gy = -ph * 0.5; gy < ph * 0.5; gy += cell) {
      if ((gx + gy + index * 17) % (cell * 3) < cell) {
        ctx.fillRect(gx, gy, cell * 0.92, cell * 0.92);
      }
    }
  }

  ctx.restore();
}

function drawCursorField() {
  const x = pointer.sx * width;
  const y = pointer.sy * height;
  const strength = Math.min(1, 0.2 + pointer.speed * 30);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = `rgba(244, 12, 63, ${0.16 + strength * 0.24})`;
  ctx.beginPath();
  ctx.ellipse(x, y, 140 + strength * 110, 90 + strength * 64, scroll * 0.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(243, 239, 230, ${0.18 + strength * 0.18})`;
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 42 - strength * 24, y - 42 - strength * 24, 84 + strength * 48, 84 + strength * 48);
  ctx.restore();
}

function drawSpatialField() {
  pointer.sx += (pointer.x - pointer.sx) * 0.13;
  pointer.sy += (pointer.y - pointer.sy) * 0.13;

  const dx = pointer.x - pointer.lx;
  const dy = pointer.y - pointer.ly;
  pointer.speed += (Math.hypot(dx, dy) - pointer.speed) * 0.16;
  pointer.lx = pointer.x;
  pointer.ly = pointer.y;

  ctx.fillStyle = "#160000";
  ctx.fillRect(0, 0, width, height);

  folds.forEach(drawFold);
  drawCursorField();

  const vignette = ctx.createRadialGradient(width * 0.5, height * 0.48, 0, width * 0.5, height * 0.48, Math.max(width, height) * 0.8);
  vignette.addColorStop(0, "rgba(22, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.72)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

function tick(now) {
  time = now;
  if (!reducedMotion) {
    drawSpatialField();
    requestAnimationFrame(tick);
  }
}

resize();
drawSpatialField();
requestAnimationFrame(tick);

window.addEventListener("resize", resize);
window.addEventListener(
  "pointermove",
  (event) => {
    pointer.x = event.clientX / width;
    pointer.y = event.clientY / height;
    root.style.setProperty("--mx", pointer.x.toFixed(3));
    root.style.setProperty("--my", pointer.y.toFixed(3));
  },
  { passive: true }
);

const lenis = new Lenis({
  lerp: 0.08,
  smoothWheel: true,
  wheelMultiplier: 0.9,
});

lenis.on("scroll", ({ scroll: value, limit }) => {
  scroll = limit > 0 ? value / limit : 0;
  root.style.setProperty("--scroll", scroll.toFixed(4));
  ScrollTrigger.update();
});

gsap.ticker.add((seconds) => {
  lenis.raf(seconds * 1000);
});
gsap.ticker.lagSmoothing(0);

gsap.utils.toArray(".reveal").forEach((element) => {
  ScrollTrigger.create({
    trigger: element,
    start: "top 84%",
    once: true,
    onEnter: () => element.classList.add("is-visible"),
  });
});

gsap.utils.toArray(".track-word").forEach((word, index) => {
  gsap.to(word, {
    xPercent: index % 2 === 0 ? -10 : 9,
    yPercent: index % 2 === 0 ? -5 : 7,
    rotateZ: index % 2 === 0 ? -1.2 : 1.2,
    ease: "none",
    scrollTrigger: {
      trigger: word,
      start: "top bottom",
      end: "bottom top",
      scrub: 0.8,
    },
  });
});

gsap.to(".parallax-disc", {
  yPercent: -16,
  rotate: 10,
  scale: 0.96,
  ease: "none",
  scrollTrigger: {
    trigger: "#top",
    start: "top top",
    end: "bottom top",
    scrub: 0.8,
  },
});

gsap.utils.toArray(".block-panel").forEach((panel, index) => {
  gsap.to(panel, {
    yPercent: index % 2 === 0 ? -18 : 14,
    rotateZ: index % 2 === 0 ? 3 : -3,
    ease: "none",
    scrollTrigger: {
      trigger: panel.closest("section") || document.body,
      start: "top bottom",
      end: "bottom top",
      scrub: 1,
    },
  });
});

const nodes = document.querySelectorAll(".sound-node");
nodes.forEach((node) => {
  const activateNode = () => {
    nodes.forEach((item) => item.classList.remove("is-active"));
    node.classList.add("is-active");
  };

  node.addEventListener("pointerenter", activateNode);
  node.addEventListener("click", activateNode);
});
