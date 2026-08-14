// TechOrbit — plain JS + CSS 3D transforms, no React needed.
// Usage: put a <div id="tech-orbit"></div> in your HTML, then call:
//   TechOrbit.mount("#tech-orbit", { size: 340, spinX: 0.12, spinY: 0.18 });
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

    // soft ambient glow sitting behind the sphere, for depth
    const glow = document.createElement("div");
    glow.className = "techorbit-glow";
    host.appendChild(glow);

    // faint ellipse "reflection" beneath the sphere
    const shadow = document.createElement("div");
    shadow.className = "techorbit-shadow";
    host.appendChild(shadow);

    const scene = document.createElement("div");
    scene.className = "techorbit-scene";
    host.appendChild(scene);

    // shared tooltip, repositioned near whichever badge is hovered
    const tooltip = document.createElement("div");
    tooltip.className = "techorbit-tooltip";
    host.appendChild(tooltip);

    const points = spherePoints(TECHS.length, size / 2);
    let hoveredIndex = -1;

    const items = TECHS.map((t, i) => {
      const el = document.createElement("div");
      el.className = "techorbit-badge";

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

      el.addEventListener("mouseenter", () => {
        hoveredIndex = i;
        tooltip.textContent = t.name;
        tooltip.style.opacity = "1";
      });
      el.addEventListener("mouseleave", () => {
        if (hoveredIndex === i) hoveredIndex = -1;
        tooltip.style.opacity = "0";
      });

      // staggered entrance: start invisible/shrunk, JS below animates them in
      el.style.opacity = "0";
      el.dataset.entered = "0";

      scene.appendChild(el);
      return el;
    });

    // kick off staggered entrance shortly after mount
    items.forEach((el, i) => {
      setTimeout(() => { el.dataset.entered = "1"; }, 120 + i * 60);
    });

    // autoRot accumulates forever (idle spin + drag momentum lives here);
    // parallax is a small additive offset layered on top when hovering,
    // so it never fights with or resets the spin.
    const autoRot = { x: -12, y: 0 };
    const vel = { x: spinX * 0.6, y: spinY };
    const parallax = { x: 0, y: 0 };
    const parallaxTarget = { x: 0, y: 0 };
    const drag = { active: false, lastX: 0, lastY: 0 };
    let rafId = null;

    let speedTarget = 1;
    let speedFactor = 1;
    host.addEventListener("mouseenter", () => { speedTarget = 0.15; });
    host.addEventListener("mouseleave", () => {
      speedTarget = 1;
      parallaxTarget.x = 0;
      parallaxTarget.y = 0;
    });

    // subtle tilt-toward-cursor when hovering but not dragging
    host.addEventListener("mousemove", (e) => {
      if (drag.active) return;
      const rect = host.getBoundingClientRect();
      const nx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
      const ny = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
      parallaxTarget.y = nx * 10; // left/right tilt
      parallaxTarget.x = -ny * 10; // up/down tilt

      // move tooltip near the cursor
      tooltip.style.left = e.clientX - rect.left + 16 + "px";
      tooltip.style.top = e.clientY - rect.top - 8 + "px";
    });

    function render() {
      // ease parallax toward its target every frame
      parallax.x += (parallaxTarget.x - parallax.x) * 0.08;
      parallax.y += (parallaxTarget.y - parallax.y) * 0.08;

      const x = autoRot.x + parallax.x;
      const y = autoRot.y + parallax.y;
      scene.style.transform = `rotateX(${x}deg) rotateY(${y}deg)`;

      const rad = Math.PI / 180;
      const cosX = Math.cos(-x * rad), sinX = Math.sin(-x * rad);
      const cosY = Math.cos(-y * rad), sinY = Math.sin(-y * rad);

      points.forEach((p, i) => {
        const el = items[i];
        const py = p.y * cosX - p.z * sinX;
        let pz = p.y * sinX + p.z * cosX;
        pz = -p.x * sinY + pz * cosY;

        const depth = (pz + size / 2) / size; // 0 (back) -> 1 (front)
        const entered = el.dataset.entered === "1";
        const isHovered = i === hoveredIndex;

        let scale = 0.55 + depth * 0.65;
        if (isHovered) scale *= 1.22;
        if (!entered) scale *= 0.3; // pre-entrance shrink

        const opacity = entered ? 0.35 + depth * 0.65 : 0;
        // subtle depth-of-field: badges toward the back blur slightly
        const blur = (1 - depth) * 2.2;

        el.style.transform =
          `translate3d(${p.x}px, ${p.y}px, ${p.z}px) rotateY(${-y}deg) rotateX(${-x}deg) scale(${scale})`;
        el.style.opacity = opacity;
        el.style.filter = isHovered ? "blur(0px)" : `blur(${blur}px)`;
        el.style.zIndex = isHovered ? 9999 : Math.round(depth * 1000);
        el.style.boxShadow = isHovered
          ? "0 0 0 3px rgba(255,255,255,0.9), 0 8px 24px rgba(0,0,0,0.35)"
          : "0 6px 16px rgba(0,0,0,0.25)";
      });

      speedFactor += (speedTarget - speedFactor) * 0.06;

      if (!drag.active) {
        autoRot.x += vel.x * speedFactor;
        autoRot.y += vel.y * speedFactor;
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
    }
    function onMove(e) {
      if (!drag.active) return;
      const p = e.touches ? e.touches[0] : e;
      const dx = p.clientX - drag.lastX;
      const dy = p.clientY - drag.lastY;
      autoRot.y += dx * 0.35;
      autoRot.x -= dy * 0.35; // no clamp: lets you flip it fully upside down
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