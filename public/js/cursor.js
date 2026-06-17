(function () {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const glow = document.getElementById('cursor-orb-glow');
  const core = document.getElementById('cursor-orb-core');
  if (!glow || !core) return;

  let mx = 0, my = 0, gx = 0, gy = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    core.style.transform = `translate(calc(${mx}px - 50%), calc(${my}px - 50%))`;
  });

  (function loop() {
    gx += (mx - gx) * 0.07;
    gy += (my - gy) * 0.07;
    glow.style.transform = `translate(calc(${gx}px - 50%), calc(${gy}px - 50%))`;
    requestAnimationFrame(loop);
  })();

  document.querySelectorAll('a, button, .feature-card, .theme-preview-card, .link-card, .nav-item, .section-card').forEach(el => {
    el.addEventListener('mouseenter', () => { glow.style.width = '160px'; glow.style.height = '160px'; });
    el.addEventListener('mouseleave', () => { glow.style.width = '110px'; glow.style.height = '110px'; });
  });

  const colors = ['#e9d5ff', '#c084fc', '#a855f7', '#7c3aed', '#f5f3ff', '#ddd6fe'];

  function spawnGlitter(x, y, count) {
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      const ang = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 80;
      const size = 2 + Math.random() * 5;
      el.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${size}px;height:${size}px;
        background:${colors[Math.floor(Math.random() * colors.length)]};
        border-radius:${['50%', '2px', '0'][Math.floor(Math.random() * 3)]};
        pointer-events:none;z-index:99997;
        --tx:${Math.cos(ang) * dist}px;--ty:${Math.sin(ang) * dist}px;
        --rot:${Math.random() * 720 - 360}deg;
        animation:glitter-fly ${.5 + Math.random() * .5}s ease-out forwards;`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1000);
    }
  }

  function spawnRipple(x, y) {
    [40, 80].forEach((sz, i) => {
      const r = document.createElement('div');
      r.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${sz}px;height:${sz}px;
        border-radius:50%;border:1.5px solid rgba(168,85,247,${.7 - i * .2});
        pointer-events:none;z-index:99996;
        animation:cursor-ripple ${.6 + i * .2}s ease-out ${i * .08}s forwards;`;
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 900);
    });
  }

  let clickTimer = null;

document.addEventListener('click', e => {
  if (clickTimer) {
    clearTimeout(clickTimer);
    clickTimer = null;
    spawnGlitter(e.clientX, e.clientY, 32);
    return;
  }
  clickTimer = setTimeout(() => {
    spawnGlitter(e.clientX, e.clientY, 18);
    clickTimer = null;
  }, 220);
});
})();