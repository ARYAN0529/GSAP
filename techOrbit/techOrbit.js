// TechOrbit — plain JS + CSS 3D transforms, no React needed.
// Usage: put a <div id="tech-orbit"></div> in your HTML, then call:
//   TechOrbit.mount("#tech-orbit", { size: 340 });
//
// Logos are pulled live from the Devicon CDN (jsDelivr) — no local
// assets folder needed. If a URL ever fails to load, the badge falls
// back to a colored circle with short initials so nothing breaks silently.

const TechOrbit = (() => {
  const CDN = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";

  const TECHS = [
    { name: "JavaScript",   file: `${CDN}/javascript/javascript-original.svg`,   fallback: "JS", color: "#F7DF1E", dark: true },
    { name: "TypeScript",   file: `${CDN}/typescript/typescript-original.svg`,   fallback: "TS", color: "#3178C6" },
    { name: "React",        file: `${CDN}/react/react-original.svg`,             fallback: "Re", color: "#61DAFB", dark: true },
    { name: "React Native", file: `${CDN}/react/react-original.svg`,             fallback: "RN", color: "#61DAFB", dark: true },
    { name: "Next.js",      file: `${CDN}/nextjs/nextjs-original.svg`,           fallback: "Nx", color: "#111111" },
    { name: "Node.js",      file: `${CDN}/nodejs/nodejs-original.svg`,           fallback: "Nd", color: "#3C873A" },
    { name: "Express",      file: `${CDN}/express/express-original.svg`,         fallback: "Ex", color: "#444444" },
    { name: "MongoDB",      file: `${CDN}/mongodb/mongodb-original.svg`,         fallback: "Mo", color: "#47A248" },
    { name: "PostgreSQL",   file: `${CDN}/postgresql/postgresql-original.svg`,   fallback: "Pg", color: "#336791" },
    { name: "Supabase",     file: `${CDN}/supabase/supabase-original.svg`,       fallback: "Sb", color: "#3ECF8E", dark: true },
    { name: "Tailwind CSS", file: `${CDN}/tailwindcss/tailwindcss-original.svg`, fallback: "Tw", color: "#38BDF8", dark: true },
    { name: "HTML5",        file: `${CDN}/html5/html5-original.svg`,             fallback: "H5", color: "#E34F26" },
    { name: "Git",          file: `${CDN}/git/git-original.svg`,                 fallback: "Gt", color: "#F05032" },
  ];

  // distribute N points evenly on a sphere (fibonacci sphere)
  function spherePoints(n, radius) {
    const pts = [];
    const offset = 2 / n;
    const increment = Math.PI * (3 - Math.sqrt(5)); // golden angle
    for (let i = 0; i < n; i++) {
      const y = i * offset - 1 + offset / 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const phi = i * increment;
      const x = Math.cos(phi) * r;
      const z = Math.sin(phi) * r;
      pts.push({ x: x * radius, y: y * radius, z: z * radius });
    }
    return pts;
  }

  function mount(selector, opts = {}) {
    const size = opts.size || 340;
    const spinX = opts.spinX ?? 0.045;
    const spinY = opts.spinY ?? 0.07;
    const host = typeof selector === "string" ? document.querySelector(selector) : selector;
    if (!host) return;

    host.classList.add("techorbit-wrap");
    host.style.width = size + 140 + "px";
    host.style.height = size + 140 + "px";

    const scene = document.createElement("div");
    scene.className = "techorbit-scene";
    host.appendChild(scene);

    const points = spherePoints(TECHS.length, size / 2);
    const items = TECHS.map((t) => {
      const el = document.createElement("div");
      el.className = "techorbit-badge";
      el.title = t.name;

      const img = document.createElement("img");
      img.src = t.file;
      img.alt = t.name;
      img.draggable = false;
      img.onerror = () => {
        el.removeChild(img);
        el.style.background = t.color;
        el.style.color = t.dark ? "#111" : "#fff";
        el.textContent = t.fallback;
      };
      el.appendChild(img);

      scene.appendChild(el);
      return el;
    });

    const rot = { x: -12, y: 0 };
    const vel = { x: spinX * 0.6, y: spinY };
    const drag = { active: false, lastX: 0, lastY: 0 };
    let idleTimer = null;
    let rafId = null;

    let speedTarget = 1;
    let speedFactor = 1;
    host.addEventListener("mouseenter", () => { speedTarget = 0.15; });
    host.addEventListener("mouseleave", () => { speedTarget = 1; });

    function render() {
      const { x, y } = rot;
      scene.style.transform = `rotateX(${x}deg) rotateY(${y}deg)`;

      const rad = Math.PI / 180;
      const cosX = Math.cos(-x * rad), sinX = Math.sin(-x * rad);
      const cosY = Math.cos(-y * rad), sinY = Math.sin(-y * rad);

      points.forEach((p, i) => {
        const el = items[i];
        const py = p.y * cosX - p.z * sinX;
        let pz = p.y * sinX + p.z * cosX;
        pz = -p.x * sinY + pz * cosY;

        const depth = (pz + size / 2) / size;
        const scale = 0.55 + depth * 0.65;
        const opacity = 0.35 + depth * 0.65;

        el.style.transform =
          `translate3d(${p.x}px, ${p.y}px, ${p.z}px) rotateY(${-y}deg) rotateX(${-x}deg) scale(${scale})`;
        el.style.opacity = opacity;
        el.style.zIndex = Math.round(depth * 1000);
      });

      speedFactor += (speedTarget - speedFactor) * 0.06;

      if (!drag.active) {
        rot.x += vel.x * speedFactor;
        rot.y += vel.y * speedFactor;
        vel.x += (spinX * 0.6 - vel.x) * 0.01;
        vel.y += (spinY - vel.y) * 0.01;
      }

      rafId = requestAnimationFrame(render);
    }
    rafId = requestAnimationFrame(render);

    function onDown(e) {
      const p = e.touches ? e.touches[0] : e;
      drag.active = true;
      drag.lastX = p.clientX;
      drag.lastY = p.clientY;
      clearTimeout(idleTimer);
    }
    function onMove(e) {
      if (!drag.active) return;
      const p = e.touches ? e.touches[0] : e;
      const dx = p.clientX - drag.lastX;
      const dy = p.clientY - drag.lastY;
      rot.y += dx * 0.35;
      rot.x -= dy * 0.35;
      vel.x = -dy * 0.05;
      vel.y = dx * 0.05;
      drag.lastX = p.clientX;
      drag.lastY = p.clientY;
      if (e.touches) e.preventDefault();
    }
    function onUp() {
      drag.active = false;
    }

    host.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    host.addEventListener("touchstart", onDown, { passive: true });
    host.addEventListener("touchmove", onMove, { passive: false });
    host.addEventListener("touchend", onUp);

    return () => cancelAnimationFrame(rafId);
  }

  return { mount };
})();