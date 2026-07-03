import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;
const canvas = document.querySelector("#plotter-canvas");
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

const pulses = [];

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

function pointerInfluence(x, y, strength = 1) {
  const dx = x - pointer.sx * width;
  const dy = y - pointer.sy * height;
  const distance = Math.hypot(dx, dy);
  const radius = Math.max(180, Math.min(width, height) * 0.34 + pointer.speed * 900);
  const falloff = Math.max(0, 1 - distance / radius);
  const force = Math.pow(falloff, 2) * strength;
  const angle = Math.atan2(dy, dx) + Math.PI * 0.5;

  return {
    x: Math.cos(angle) * force * 58,
    y: Math.sin(angle) * force * 34,
    force,
  };
}

function waveY(x, row, progress) {
  const nx = x / width;
  const phase = time * 0.0012 + row * 0.63;
  const base =
    Math.sin(nx * Math.PI * 2.2 + phase) * 18 +
    Math.sin(nx * Math.PI * 7.4 - phase * 0.8) * 8 +
    Math.sin(nx * Math.PI * 15.5 + row) * 3;

  return base * (0.75 + progress * 0.8);
}

function drawPlotterField() {
  pointer.sx += (pointer.x - pointer.sx) * 0.16;
  pointer.sy += (pointer.y - pointer.sy) * 0.16;

  const dx = pointer.x - pointer.lx;
  const dy = pointer.y - pointer.ly;
  pointer.speed += (Math.hypot(dx, dy) - pointer.speed) * 0.18;
  pointer.lx = pointer.x;
  pointer.ly = pointer.y;

  ctx.fillStyle = "#160000";
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.translate(width * 0.5, height * 0.5);
  ctx.rotate(-0.015 + scroll * 0.045);
  ctx.translate(-width * 0.5, -height * 0.5);

  const lineCount = Math.max(18, Math.floor(height / 32));
  const gap = height / (lineCount - 1);
  const step = width < 700 ? 18 : 14;

  for (let row = 0; row < lineCount; row += 1) {
    const yBase = row * gap;
    const rowProgress = row / Math.max(1, lineCount - 1);
    const alpha = 0.1 + Math.abs(rowProgress - 0.5) * 0.16;

    ctx.beginPath();
    for (let x = -80; x <= width + 80; x += step) {
      const perspective = (rowProgress - 0.5) * scroll * 120;
      let xDraw = x + perspective;
      let yDraw = yBase + waveY(x, row, scroll);
      const influence = pointerInfluence(xDraw, yDraw, 1.25);

      pulses.forEach((pulse) => {
        const pdx = xDraw - pulse.x * width;
        const pdy = yDraw - pulse.y * height;
        const dist = Math.hypot(pdx, pdy);
        const ring = Math.sin(dist * 0.045 - pulse.age * 13) * Math.exp(-dist * 0.006);
        xDraw += Math.cos(pulse.angle) * ring * pulse.life * 28;
        yDraw += Math.sin(pulse.angle) * ring * pulse.life * 28;
      });

      xDraw += influence.x;
      yDraw += influence.y;

      if (x === -80) ctx.moveTo(xDraw, yDraw);
      else ctx.lineTo(xDraw, yDraw);
    }

    ctx.strokeStyle = `rgba(243, 239, 230, ${alpha})`;
    ctx.lineWidth = row % 6 === 0 ? 1.15 : 0.65;
    ctx.stroke();
  }

  const columnCount = width < 700 ? 11 : 21;
  for (let col = 0; col < columnCount; col += 1) {
    const xBase = (col / (columnCount - 1)) * width;
    ctx.beginPath();
    for (let y = -80; y <= height + 80; y += 28) {
      let xDraw = xBase + Math.sin(y * 0.012 + time * 0.001 + col) * (8 + scroll * 28);
      let yDraw = y;
      const influence = pointerInfluence(xDraw, yDraw, 0.7);
      xDraw += influence.x;
      yDraw += influence.y;

      if (y === -80) ctx.moveTo(xDraw, yDraw);
      else ctx.lineTo(xDraw, yDraw);
    }

    ctx.strokeStyle = `rgba(244, 12, 63, ${col % 4 === 0 ? 0.32 : 0.12})`;
    ctx.lineWidth = col % 4 === 0 ? 1.2 : 0.6;
    ctx.stroke();
  }

  ctx.restore();

  drawCursor();
}

function drawCursor() {
  const x = pointer.sx * width;
  const y = pointer.sy * height;
  const strength = Math.min(1, 0.28 + pointer.speed * 34);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = `rgba(244, 12, 63, ${0.5 + strength * 0.32})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x, y, 20 + strength * 34, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = `rgba(243, 239, 230, ${0.42 + strength * 0.22})`;
  ctx.beginPath();
  ctx.moveTo(x - 38 - strength * 20, y);
  ctx.lineTo(x + 38 + strength * 20, y);
  ctx.moveTo(x, y - 38 - strength * 20);
  ctx.lineTo(x, y + 38 + strength * 20);
  ctx.stroke();
  ctx.restore();
}

function tick(now) {
  time = now;
  if (!reducedMotion) {
    drawPlotterField();
    pulses.forEach((pulse) => {
      pulse.age += 0.018;
      pulse.life = Math.max(0, 1 - pulse.age);
    });
    for (let i = pulses.length - 1; i >= 0; i -= 1) {
      if (pulses[i].life <= 0) pulses.splice(i, 1);
    }
    requestAnimationFrame(tick);
  }
}

resize();
drawPlotterField();
requestAnimationFrame(tick);

window.addEventListener("resize", resize);
window.addEventListener(
  "pointermove",
  (event) => {
    pointer.x = event.clientX / width;
    pointer.y = event.clientY / height;
    root.style.setProperty("--mx", pointer.x.toFixed(3));
    root.style.setProperty("--my", pointer.y.toFixed(3));

    if (pulses.length < 8 && pointer.speed > 0.003) {
      pulses.push({
        x: pointer.x,
        y: pointer.y,
        age: 0.12,
        life: 0.88,
        angle: Math.atan2(pointer.y - pointer.ly, pointer.x - pointer.lx),
      });
    }
  },
  { passive: true }
);

window.addEventListener(
  "pointerdown",
  (event) => {
    pulses.push({
      x: event.clientX / width,
      y: event.clientY / height,
      age: 0,
      life: 1,
      angle: Math.random() * Math.PI * 2,
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
    xPercent: index % 2 === 0 ? -9 : 8,
    yPercent: index % 2 === 0 ? -5 : 6,
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
  yPercent: -18,
  rotate: 9,
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
    pulses.push({
      x: (rect.left + rect.width / 2) / width,
      y: (rect.top + rect.height / 2) / height,
      age: 0,
      life: 1,
      angle: Math.random() * Math.PI * 2,
    });
  };

  node.addEventListener("pointerenter", activateNode);
  node.addEventListener("click", activateNode);
});
