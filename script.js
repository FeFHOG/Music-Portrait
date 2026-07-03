const root = document.documentElement;
const pointerFine = window.matchMedia("(pointer: fine)").matches;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = document.querySelector("#sound-field");
const ctx = canvas?.getContext("2d");
let width = 0;
let height = 0;
let dpr = 1;
let pointerX = 0.58;
let pointerY = 0.42;
let scrollTone = 0;

const frequencies = [
  { x: 0.18, y: 0.32, r: 68, hue: "200, 125, 79" },
  { x: 0.42, y: 0.66, r: 92, hue: "138, 46, 58" },
  { x: 0.72, y: 0.26, r: 74, hue: "54, 184, 199" },
  { x: 0.58, y: 0.78, r: 62, hue: "167, 110, 134" },
  { x: 0.86, y: 0.55, r: 80, hue: "170, 160, 100" },
];

function resizeCanvas() {
  if (!canvas || !ctx) return;

  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = canvas.clientWidth;
  height = canvas.clientHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawField(time = 0) {
  if (!ctx || reduceMotion) return;

  ctx.clearRect(0, 0, width, height);
  ctx.globalCompositeOperation = "lighter";
  ctx.lineWidth = 1;

  const t = time * 0.001;
  const anchorX = width * pointerX;
  const anchorY = height * pointerY;

  frequencies.forEach((point, index) => {
    const x = width * point.x + Math.sin(t * 0.7 + index) * 18;
    const y = height * point.y + Math.cos(t * 0.55 + index) * 14;
    const pulse = Math.sin(t * 1.4 + index * 0.8) * 16;
    const radius = point.r + pulse + scrollTone * 34;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(${point.hue}, 0.18)`);
    gradient.addColorStop(1, `rgba(${point.hue}, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(${point.hue}, 0.18)`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(anchorX, anchorY);
    ctx.stroke();
  });

  for (let i = 0; i < 18; i += 1) {
    const y = height * 0.5 + Math.sin(t + i * 0.7) * 80 + (i - 9) * 14;
    ctx.strokeStyle = `rgba(245, 238, 228, ${0.025 + i * 0.002})`;
    ctx.beginPath();
    for (let x = 0; x <= width; x += 34) {
      const wave = Math.sin(x * 0.01 + t * 1.5 + i) * (18 + scrollTone * 24);
      if (x === 0) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }

  requestAnimationFrame(drawField);
}

resizeCanvas();
if (canvas && ctx && !reduceMotion) {
  requestAnimationFrame(drawField);
}

if (pointerFine && !reduceMotion) {
  document.body.classList.add("has-pointer");

  window.addEventListener(
    "pointermove",
    (event) => {
      root.style.setProperty("--mx", `${event.clientX}px`);
      root.style.setProperty("--my", `${event.clientY}px`);
      pointerX = event.clientX / window.innerWidth;
      pointerY = event.clientY / window.innerHeight;
    },
    { passive: true }
  );
}

window.addEventListener(
  "scroll",
  () => {
    const maxScroll = Math.max(document.body.scrollHeight - window.innerHeight, 1);
    scrollTone = window.scrollY / maxScroll;
    root.style.setProperty("--scroll", scrollTone.toFixed(3));
  },
  { passive: true }
);

window.addEventListener("resize", resizeCanvas);

const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window && !reduceMotion) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const nodes = document.querySelectorAll(".sound-node");
const readoutTitle = document.querySelector("[data-readout-title]");
const readoutCopy = document.querySelector("[data-readout-copy]");

nodes.forEach((node) => {
  node.addEventListener("click", () => {
    nodes.forEach((item) => item.classList.remove("active"));
    node.classList.add("active");
    readoutTitle.textContent = node.dataset.title;
    readoutCopy.textContent = node.dataset.copy;
  });
});
