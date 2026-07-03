import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;
const canvas = document.querySelector("#fluid-canvas");
const ctx = canvas.getContext("2d", { alpha: false });
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let width = 0;
let height = 0;
let dpr = 1;
let time = 0;
let lastPaint = 0;
let scroll = 0;
let simWidth = 0;
let simHeight = 0;
let simCanvas;
let simCtx;
let simImage;
let pointer = {
  x: 0.62,
  y: 0.44,
  sx: 0.62,
  sy: 0.44,
  lx: 0.62,
  ly: 0.44,
  speed: 0,
};

const impulses = [];
const palette = [
  [6, 6, 5],
  [243, 239, 230],
  [0, 213, 255],
  [255, 79, 47],
  [236, 255, 41],
];

function fract(value) {
  return value - Math.floor(value);
}

function hash(x, y) {
  return fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453123);
}

function smooth(t) {
  return t * t * (3 - 2 * t);
}

function noise(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = fract(x);
  const fy = fract(y);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  const u = smooth(fx);
  const v = smooth(fy);
  return a + (b - a) * u + (c - a) * v * (1 - u) + (d - b) * u * v;
}

function fbm(x, y) {
  let value = 0;
  let amp = 0.5;
  let freq = 1;

  for (let i = 0; i < 4; i += 1) {
    value += amp * noise(x * freq, y * freq);
    freq *= 2.03;
    amp *= 0.52;
  }

  return value;
}

function warp(x, y, t) {
  const qx = fbm(x + t * 0.11, y + t * 0.07);
  const qy = fbm(x - t * 0.06 + 4.2, y + t * 0.08 + 1.7);
  const rx = fbm(x + qx * 4.2 + 8.3, y + qy * 3.4 + t * 0.05);
  const ry = fbm(x + qx * 2.1 - t * 0.03, y + qy * 4.8 + 5.1);
  return [rx, ry, (qx + qy) * 0.5];
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const quality = width < 700 ? 0.26 : 0.18;
  simWidth = Math.max(96, Math.ceil(width * quality));
  simHeight = Math.max(96, Math.ceil(height * quality));
  simCanvas = simCanvas || document.createElement("canvas");
  simCanvas.width = simWidth;
  simCanvas.height = simHeight;
  simCtx = simCanvas.getContext("2d", { alpha: false });
  simImage = simCtx.createImageData(simWidth, simHeight);
}

function paintFluid() {
  const t = time * 0.00016;
  const data = simImage.data;
  const iw = simWidth;
  const ih = simHeight;
  let ptr = 0;

  pointer.sx += (pointer.x - pointer.sx) * 0.08;
  pointer.sy += (pointer.y - pointer.sy) * 0.08;
  const dx = pointer.x - pointer.lx;
  const dy = pointer.y - pointer.ly;
  pointer.speed += (Math.hypot(dx, dy) - pointer.speed) * 0.16;
  pointer.lx = pointer.x;
  pointer.ly = pointer.y;

  for (let y = 0; y < ih; y += 1) {
    for (let x = 0; x < iw; x += 1) {
      const uvx = x / iw;
      const uvy = y / ih;
      const aspect = width / height;
      const px = (uvx - 0.5) * aspect;
      const py = uvy - 0.5;

      const [wx, wy, base] = warp(px * 2.25 + scroll * 0.9, py * 2.25, t);
      const swirl = Math.sin((wx * 9.0 + wy * 6.5 + t * 18) + Math.atan2(py, px) * 1.8);
      const ink = Math.pow(Math.max(0, base * 0.9 + swirl * 0.23), 1.35);

      const mdx = uvx - pointer.sx;
      const mdy = uvy - pointer.sy;
      const distToMouse = Math.sqrt(mdx * mdx + mdy * mdy);
      const mouseField = Math.exp(-(mdx * mdx + mdy * mdy) * (28 - Math.min(pointer.speed * 80, 13)));
      let ripple = Math.sin(distToMouse * 86 - t * 62) * mouseField;

      impulses.forEach((impulse) => {
        const ix = uvx - impulse.x;
        const iy = uvy - impulse.y;
        const dist = Math.sqrt(ix * ix + iy * iy);
        const life = 1 - impulse.age;
        ripple += Math.sin(dist * 92 - impulse.age * 18) * Math.exp(-dist * 15) * life;
      });

      const colorBias = Math.max(0, Math.min(1, ink * 0.72 + ripple * 0.46 + scroll * 0.08));
      const accent = palette[1 + Math.floor(Math.max(0, Math.min(3.99, (wx + wy + ripple + 0.36) * 2)))];
      const dark = palette[0];
      const glow = Math.max(0, Math.min(1, colorBias));
      const contrast = Math.pow(glow, 2.2);

      data[ptr] = mix(dark[0], accent[0], contrast);
      data[ptr + 1] = mix(dark[1], accent[1], contrast);
      data[ptr + 2] = mix(dark[2], accent[2], contrast);
      data[ptr + 3] = 255;
      ptr += 4;
    }
  }

  simCtx.putImageData(simImage, 0, 0);

  ctx.imageSmoothingEnabled = true;
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(simCanvas, 0, 0, width, height);

  drawPointerBloom();

  const vignette = ctx.createRadialGradient(width * 0.52, height * 0.5, 0, width * 0.52, height * 0.5, Math.max(width, height) * 0.75);
  vignette.addColorStop(0, "rgba(6, 6, 5, 0)");
  vignette.addColorStop(1, "rgba(6, 6, 5, 0.82)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

function drawPointerBloom() {
  const x = pointer.sx * width;
  const y = pointer.sy * height;
  const strength = Math.min(1, 0.28 + pointer.speed * 24);
  const radius = Math.min(width, height) * (0.16 + strength * 0.12);

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  const bloom = ctx.createRadialGradient(x, y, 0, x, y, radius);
  bloom.addColorStop(0, `rgba(236, 255, 41, ${0.34 * strength})`);
  bloom.addColorStop(0.22, `rgba(0, 213, 255, ${0.18 * strength})`);
  bloom.addColorStop(0.58, `rgba(255, 79, 47, ${0.11 * strength})`);
  bloom.addColorStop(1, "rgba(6, 6, 5, 0)");
  ctx.fillStyle = bloom;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(243, 239, 230, ${0.22 * strength})`;
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.arc(x, y, radius * (0.22 + i * 0.18), 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function tick(now) {
  time = now;
  if (!reducedMotion) {
    if (now - lastPaint > 33) {
      paintFluid();
      lastPaint = now;
    }
    impulses.forEach((impulse) => {
      impulse.age += 0.018;
    });
    for (let i = impulses.length - 1; i >= 0; i -= 1) {
      if (impulses[i].age > 1) impulses.splice(i, 1);
    }
    requestAnimationFrame(tick);
  }
}

resize();
paintFluid();
requestAnimationFrame(tick);

window.addEventListener("resize", resize);
window.addEventListener(
  "pointermove",
  (event) => {
    pointer.x = event.clientX / width;
    pointer.y = event.clientY / height;
    root.style.setProperty("--mx", pointer.x.toFixed(3));
    root.style.setProperty("--my", pointer.y.toFixed(3));

    if (impulses.length < 12 && pointer.speed > 0.004) {
      impulses.push({
        x: pointer.x,
        y: pointer.y,
        age: 0.18,
      });
    }
  },
  { passive: true }
);

window.addEventListener(
  "pointerdown",
  (event) => {
    impulses.push({
      x: event.clientX / width,
      y: event.clientY / height,
      age: 0,
    });
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
    xPercent: index % 2 === 0 ? -8 : 7,
    yPercent: index % 2 === 0 ? -4 : 5,
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
  rotate: 8,
  ease: "none",
  scrollTrigger: {
    trigger: "#top",
    start: "top top",
    end: "bottom top",
    scrub: 0.8,
  },
});

const nodes = document.querySelectorAll(".sound-node");
nodes.forEach((node) => {
  const activateNode = () => {
    nodes.forEach((item) => item.classList.remove("is-active"));
    node.classList.add("is-active");
    const rect = node.getBoundingClientRect();
    impulses.push({
      x: (rect.left + rect.width / 2) / width,
      y: (rect.top + rect.height / 2) / height,
      age: 0,
    });
  };

  node.addEventListener("pointerenter", activateNode);
  node.addEventListener("click", activateNode);
});
