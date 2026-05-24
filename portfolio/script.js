/* Portfolio — White + Black + Ink Objects */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('yr').textContent = new Date().getFullYear();

  /* ===== THREE.JS — Ink Elements ===== */
  const mob = innerWidth < 768;
  let cam, ren, sc, photoMesh, ring3d, ringMat, inkGroup, techGroup;
  let inkMat, inkMatSoft, inkMatGlossy;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const clock = new THREE.Clock();
  const raycaster = new THREE.Raycaster();
  const mouseVec = new THREE.Vector2(-9999, -9999);
  let hoveredTech = null;

  (function init() {
    const cv = document.getElementById('c');
    sc = new THREE.Scene();
    cam = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
    cam.position.set(0, 0, 6);
    ren = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: !mob, powerPreference: "high-performance" });
    ren.setSize(innerWidth, innerHeight);
    ren.setPixelRatio(Math.min(devicePixelRatio, mob ? 1 : 2));
    ren.setClearColor(0x000000, 0);

    // Clean white lighting
    sc.add(new THREE.AmbientLight(0xffffff, 0.5));
    const d1 = new THREE.DirectionalLight(0xffffff, 1);
    d1.position.set(5, 6, 8); sc.add(d1);
    const d2 = new THREE.DirectionalLight(0xffffff, 0.4);
    d2.position.set(-4, 3, -5); sc.add(d2);

    // Profile photo — circular, FRONT AND CENTER
    new THREE.TextureLoader().load(
      'https://github.com/adhi2302/activeportfolio10dec2025/blob/main/portfolio/assets/profile.jpg?raw=true',
      tex => {
        tex.colorSpace = THREE.SRGBColorSpace;
        photoMesh = new THREE.Mesh(
          new THREE.CircleGeometry(1.2, 64),
          new THREE.MeshStandardMaterial({ map: tex, transparent: true, opacity: 0.92, roughness: 0.3, metalness: 0.1, side: THREE.DoubleSide })
        );
        photoMesh.position.set(0, 0.8, 2);
        sc.add(photoMesh);

        // Spinning ring
        ringMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.3, metalness: 0.8 });
        ring3d = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.03, 16, 64), ringMat);
        ring3d.position.copy(photoMesh.position);
        sc.add(ring3d);
      }
    );

    // === INK ELEMENTS — all dark, smooth, organic ===
    inkGroup = new THREE.Group();
    sc.add(inkGroup);

    inkMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.15, metalness: 0.7 });
    inkMatSoft = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4, metalness: 0.5 });
    inkMatGlossy = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.05, metalness: 0.9 });

    // Geometry pool — organic shapes
    const geos = [
      new THREE.SphereGeometry(1, 32, 32),             // smooth sphere
      new THREE.DodecahedronGeometry(1, 0),             // faceted blob
      new THREE.OctahedronGeometry(1, 0),               // diamond
      new THREE.IcosahedronGeometry(1, 0),              // d20 shape
      new THREE.TorusGeometry(1, 0.4, 12, 32),          // donut
      new THREE.SphereGeometry(1, 6, 4),                // low-poly sphere (ink drop)
      new THREE.DodecahedronGeometry(1, 1),             // smoother blob
      new THREE.CapsuleGeometry(0.5, 1, 8, 16),        // pill / capsule
    ];
    const mats = [inkMat, inkMatSoft, inkMatGlossy];

    // Ink objects with positions
    const inkData = [
      // Large pieces
      { geo: 1, mat: 2, s: 0.35, p: [3.5, 1.2, -3], rs: 0.3 },
      { geo: 4, mat: 0, s: 0.28, p: [-3.8, 2, -4], rs: 0.2 },
      { geo: 6, mat: 1, s: 0.4, p: [4.5, -2.5, -5], rs: 0.15 },
      // Medium pieces
      { geo: 0, mat: 2, s: 0.2, p: [-2.5, -1.5, -2], rs: 0.25 },
      { geo: 2, mat: 0, s: 0.22, p: [2, 3, -4], rs: 0.35 },
      { geo: 5, mat: 1, s: 0.25, p: [-4.5, 0, -6], rs: 0.18 },
      { geo: 3, mat: 2, s: 0.18, p: [1.5, -3, -3], rs: 0.28 },
      { geo: 7, mat: 0, s: 0.2, p: [-1, 3.5, -5], rs: 0.22 },
      // Small pieces
      { geo: 0, mat: 2, s: 0.1, p: [5, 0.5, -4], rs: 0.4 },
      { geo: 1, mat: 1, s: 0.08, p: [-5, -2, -3], rs: 0.5 },
      { geo: 2, mat: 0, s: 0.12, p: [0.5, -4, -5], rs: 0.35 },
      { geo: 0, mat: 2, s: 0.06, p: [3, 4, -6], rs: 0.45 },
      { geo: 5, mat: 1, s: 0.09, p: [-3, -3.5, -4], rs: 0.3 },
      { geo: 3, mat: 2, s: 0.07, p: [4, 3.5, -7], rs: 0.38 },
      // Tiny scatter
      { geo: 0, mat: 2, s: 0.04, p: [-1.5, 2, -2], rs: 0.6 },
      { geo: 0, mat: 2, s: 0.05, p: [2.5, -1, -1.5], rs: 0.55 },
      { geo: 0, mat: 0, s: 0.03, p: [-0.5, -2.5, -3], rs: 0.7 },
      { geo: 0, mat: 1, s: 0.04, p: [1, 1.5, -2.5], rs: 0.65 },
    ];

    // Remove some on mobile
    const items = mob ? inkData.slice(0, 10) : inkData;

    items.forEach(d => {
      const mesh = new THREE.Mesh(geos[d.geo], mats[d.mat].clone());
      mesh.scale.set(d.s, d.s, d.s);
      mesh.position.set(...d.p);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      mesh.userData = {
        baseY: d.p[1],
        baseX: d.p[0],
        speed: d.rs,
        off: Math.random() * 6.28,
        rotSpeed: { x: (Math.random() - .5) * 0.006, y: (Math.random() - .5) * 0.008, z: (Math.random() - .5) * 0.004 }
      };
      inkGroup.add(mesh);
    });

    // === TECH LOGOS AS 3D ELEMENTS ===
    techGroup = new THREE.Group();
    sc.add(techGroup);
    
    // Expanded tech stack including Flutter!
    const techUrls = [
      'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg',
      'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg',
      'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg',
      'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/php/php-original.svg',
      'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg',
      'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg',
      'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/dart/dart-original.svg',
      'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/firebase/firebase-original.svg',
      'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg',
      'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cplusplus/cplusplus-original.svg',
      'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg',
      'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg',
      'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-original.svg',
      'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg',
      'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg',
      'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/android/android-original.svg',
      'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/figma/figma-original.svg',
      // Clean, high-res Flutter icon PNG (No text)
      'https://raw.githubusercontent.com/github/explore/main/topics/flutter/flutter.png',
      // Clean, transparent Supabase icon (Iconify API ensures WebGL sizes it correctly)
      'https://api.iconify.design/logos/supabase-icon.svg?width=256&height=256'
    ];
    
    const tLoader = new THREE.TextureLoader();
    techUrls.forEach((url, i) => {
      tLoader.load(url, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        
        // Use a flat plane with DoubleSide so transparent logos look like crisp floating 3D icons
        const geo = new THREE.PlaneGeometry(0.8, 0.8);
        const mat = new THREE.MeshBasicMaterial({ 
          map: tex, transparent: true, side: THREE.DoubleSide, alphaTest: 0.1 
        });
        const mesh = new THREE.Mesh(geo, mat);
        
        // Spread them wider across the screen
        const x = (Math.random() - 0.5) * 16;
        const y = (Math.random() - 0.5) * 18;
        const z = -2 - Math.random() * 8;
        mesh.position.set(x, y, z);
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        
        mesh.userData = {
          baseY: y, baseX: x, speed: 0.15 + Math.random() * 0.2, off: Math.random() * Math.PI * 2,
          rotSpeed: { x: (Math.random() - 0.5) * 0.02, y: (Math.random() - 0.5) * 0.02, z: (Math.random() - 0.5) * 0.02 }
        };
        
        techGroup.add(mesh);
        
        // GSAP scroll parallax for the logos (more dramatic scrolling)
        if (window.gsap && window.ScrollTrigger) {
          gsap.to(mesh.position, { y: mesh.position.y + (i % 2 === 0 ? 8 : -8), x: mesh.position.x + (i % 2 === 0 ? -5 : 5), scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 2 } });
          gsap.to(mesh.rotation, { x: mesh.rotation.x + Math.PI * 4, y: mesh.rotation.y + Math.PI * 4, scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 2 } });
        }
      });
    });

    // Mouse
    if (!mob) document.addEventListener('mousemove', e => {
      mouse.tx = (e.clientX / innerWidth - .5) * 2;
      mouse.ty = (e.clientY / innerHeight - .5) * 2;
      
      // Map mouse coordinates for the 3D Raycaster
      mouseVec.x = (e.clientX / innerWidth) * 2 - 1;
      mouseVec.y = -(e.clientY / innerHeight) * 2 + 1;
    });
    
    // Click interaction for tech logos
    document.addEventListener('click', () => {
      if (hoveredTech) document.getElementById('skills')?.scrollIntoView({ behavior: 'smooth' });
    });

    window.addEventListener('resize', () => {
      cam.aspect = innerWidth / innerHeight;
      cam.updateProjectionMatrix();
      ren.setSize(innerWidth, innerHeight);
    });

    // Render
    (function frame() {
      requestAnimationFrame(frame);
      const t = clock.getElapsedTime();
      mouse.x += (mouse.tx - mouse.x) * .04;
      mouse.y += (mouse.ty - mouse.y) * .04;

      // Photo float + tilt with mouse
      if (photoMesh) {
        photoMesh.position.y = 0.8 + Math.sin(t * 0.4) * 0.12;
        photoMesh.rotation.x = Math.sin(t * 0.3) * 0.03 + mouse.y * 0.08;
        photoMesh.rotation.y = Math.sin(t * 0.2) * 0.04 + mouse.x * 0.1;
        if (ring3d) {
          ring3d.position.y = photoMesh.position.y;
          ring3d.rotation.x = photoMesh.rotation.x;
          ring3d.rotation.y = photoMesh.rotation.y;
          ring3d.rotation.z += 0.004;
        }
      }

      // Ink elements float + rotate
      inkGroup.children.forEach(m => {
        m.position.y = m.userData.baseY + Math.sin(t * m.userData.speed + m.userData.off) * 0.25;
        m.position.x = m.userData.baseX + Math.cos(t * m.userData.speed * 0.7 + m.userData.off) * 0.1;
        m.rotation.x += m.userData.rotSpeed.x;
        m.rotation.y += m.userData.rotSpeed.y;
        m.rotation.z += m.userData.rotSpeed.z;
      });

      // Tech logos float + rotate (wandering over screen)
      if (techGroup) {
        // Raycast logic for hover detection
        raycaster.setFromCamera(mouseVec, cam);
        const intersects = raycaster.intersectObjects(techGroup.children);
        hoveredTech = intersects.length > 0 ? intersects[0].object : null;
        
        if (hoveredTech) {
          document.getElementById('cursor-follower')?.classList.add('active');
        } else if (!document.querySelector('a:hover, button:hover, .card:hover')) {
          document.getElementById('cursor-follower')?.classList.remove('active');
        }

        techGroup.children.forEach(m => {
          const isHovered = m === hoveredTech;
          const targetScale = isHovered ? 1.6 : 1;
          
          // Smooth scale transition
          m.scale.x += (targetScale - m.scale.x) * 0.15;
          m.scale.y += (targetScale - m.scale.y) * 0.15;
          m.scale.z += (targetScale - m.scale.z) * 0.15;

          if (!isHovered) {
            m.position.y = m.userData.baseY + Math.sin(t * m.userData.speed + m.userData.off) * 1.5;
            m.position.x = m.userData.baseX + Math.cos(t * m.userData.speed * 0.8 + m.userData.off) * 2.0;
            m.rotation.x += m.userData.rotSpeed.x;
            m.rotation.y += m.userData.rotSpeed.y;
            m.rotation.z += m.userData.rotSpeed.z;
          } else {
            // Spin dynamically when hovered
            m.rotation.y += 0.05;
          }
        });
      }

      // Camera parallax
      cam.position.x += (mouse.x * 0.35 - cam.position.x) * 0.02;
      cam.position.y += (-mouse.y * 0.2 - cam.position.y) * 0.02;
      cam.lookAt(0, 0, 0);
      ren.render(sc, cam);
    })();
  })();

  /* ===== GSAP ===== */
  gsap.registerPlugin(ScrollTrigger);

  // Nav
  ScrollTrigger.create({ start: 'top -60', onUpdate: s => document.getElementById('nav').classList.toggle('scrolled', s.progress > 0) });

  // Preloader
  const perc = { val: 0 };
  gsap.to(perc, {
    val: 100, duration: 2, ease: "power2.inOut",
    onUpdate: () => { const el = document.getElementById('loader-perc'); if(el) el.innerText = Math.round(perc.val); },
    onComplete: () => {
      gsap.to('#loader', { yPercent: -100, duration: 0.8, ease: "power4.inOut" });
      htl.play();
      setTimeout(typewriter, 600); // Start typewriter
    }
  });

  // Hero entrance
  const htl = gsap.timeline({ paused: true, delay: 0.2 });
  htl.fromTo('#nav', { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'power3.out' })
     .fromTo('.hero-photo-wrap', { scale: 0.8, opacity: 0, y: 30 }, { scale: 1, opacity: 1, y: 0, duration: .8, ease: 'power3.out' }, '-=.2')
     .fromTo('.ht-line', { y: 60, opacity: 0 }, { y: 0, opacity: 1, stagger: .12, duration: .8, ease: 'power3.out' }, '-=.4')
     .fromTo('.hero-sub', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'power3.out' }, '-=.3')
     .fromTo('.hero-desc', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'power3.out' }, '-=.3')
     .fromTo('.hero-actions', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'power3.out' }, '-=.25')
     .fromTo('.hero-stats', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'power3.out' }, '-=.2');

  // 3D hero exit — photo flies away
  gsap.timeline({
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1.5,
      onUpdate: s => {
        if (photoMesh) {
          photoMesh.material.opacity = 0.92 * (1 - s.progress);
          photoMesh.position.z = 2 - s.progress * 4;
          photoMesh.position.y = 0.8 + s.progress * 3;
          if (ring3d) {
            ring3d.material.opacity = 1 - s.progress;
            ring3d.position.z = photoMesh.position.z;
            ring3d.position.y = photoMesh.position.y;
          }
        }
      }
    }
  });

  // Ink objects scatter/move on scroll per section
  gsap.timeline({ scrollTrigger: { trigger: '#about', start: 'top 60%', end: 'bottom 40%', scrub: 2 } })
    .to(cam.position, { z: 8, y: 0.3 }, 0);

  gsap.timeline({ scrollTrigger: { trigger: '#work', start: 'top 50%', end: 'bottom top', scrub: 2 } })
    .to(cam.position, { z: 10, x: -.2 }, 0);

  gsap.timeline({ scrollTrigger: { trigger: '#skills', start: 'top 60%', end: 'bottom 40%', scrub: 2 } })
    .to(cam.position, { y: 1.5, z: 9 }, 0);

  gsap.timeline({ scrollTrigger: { trigger: '#contact', start: 'top 60%', end: 'bottom bottom', scrub: 2 } })
    .to(cam.position, { x: 0, y: 0, z: 7 }, 0);

  // Ink parallax — each moves at different rate
  inkGroup.children.forEach((m, i) => {
    gsap.to(m.position, {
      y: m.position.y + (i % 3 === 0 ? -3 : i % 3 === 1 ? 2.5 : -1.5),
      x: m.position.x + (i % 2 ? 1 : -1),
      scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 1 }
    });
  });

  // Scroll progress bar
  gsap.to('#scroll-prog', {
    width: '100%',
    scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: true }
  });

  // Section reveals
  document.querySelectorAll('.sec:not(.sec-hero)').forEach(sec => {
    const title = sec.querySelectorAll('.sec-title');
    const cards = sec.querySelectorAll('.card');
    const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top 80%' } });
    if (title.length) tl.fromTo(title, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .6, ease: 'power3.out' }, 0);
    if (cards.length) tl.fromTo(cards, { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: .08, duration: .6, ease: 'power3.out' }, .1);
  });

  // Skill bars
  document.querySelectorAll('.bar i').forEach(b => {
    ScrollTrigger.create({ trigger: b, start: 'top 92%', onEnter: () => { b.style.width = b.dataset.w + '%'; } });
  });

  // Timeline items
  gsap.utils.toArray('.tl-item').forEach((d, i) => {
    gsap.fromTo(d, { x: -14, opacity: 0 }, { x: 0, opacity: 1, duration: .4, ease: 'power3.out', scrollTrigger: { trigger: d, start: 'top 90%' }, delay: i * .06 });
  });

  /* Counters */
  function cnt(id, to, ms) {
    const el = document.getElementById(id); if (!el) return;
    const s = performance.now();
    (function f(n) { const p = Math.min((n - s) / ms, 1); el.textContent = Math.round(p * p * (3 - 2 * p) * to); if (p < 1) requestAnimationFrame(f); })(s);
  }
  cnt('c1', 6, 1100); cnt('c2', 18, 1300); cnt('c3', 10, 900);

  /* Mobile menu */
  const hb = document.getElementById('ham'), lk = document.getElementById('navLinks');
  hb?.addEventListener('click', () => lk.classList.toggle('open'));
  lk?.addEventListener('click', e => { if (e.target.classList.contains('nl')) lk.classList.remove('open'); });

  /* Smooth scroll */
  document.querySelectorAll('.nl').forEach(a => {
    a.addEventListener('click', e => { const h = a.getAttribute('href'); if (h?.startsWith('#')) { e.preventDefault(); document.querySelector(h)?.scrollIntoView({ behavior: 'smooth' }); } });
  });

  /* Active nav */
  const ss = document.querySelectorAll('.sec[id]'), ns = document.querySelectorAll('.nl');
  ss.forEach(s => new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) ns.forEach(n => n.classList.toggle('active', n.dataset.s === e.target.id)); }); }, { threshold: .2 }).observe(s));

  /* UI Audio Design */
  const actx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(type) {
    if (actx.state === 'suspended') actx.resume();
    const osc = actx.createOscillator(), gain = actx.createGain();
    osc.connect(gain); gain.connect(actx.destination);
    if (type === 'hover') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(800, actx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, actx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.01, actx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.05);
      osc.start(); osc.stop(actx.currentTime + 0.05);
    } else {
      osc.type = 'triangle'; osc.frequency.setValueAtTime(300, actx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, actx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.03, actx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.1);
      osc.start(); osc.stop(actx.currentTime + 0.1);
    }
  }

  /* Dark Mode Toggle */
  const themeBtn = document.getElementById('theme-btn');
  themeBtn?.addEventListener('click', () => {
    playSound('click');
    const isDark = document.body.classList.toggle('dark-mode');
    themeBtn.innerText = isDark ? '☀️' : '🌙';
    const c1 = new THREE.Color(isDark ? 0xffffff : 0x111111), c2 = new THREE.Color(isDark ? 0xdddddd : 0x1a1a1a);
    const c3 = new THREE.Color(isDark ? 0xffffff : 0x080808), cr = new THREE.Color(isDark ? 0xffffff : 0x000000);
    if(inkMat) gsap.to(inkMat.color, { r: c1.r, g: c1.g, b: c1.b, duration: 1 });
    if(inkMatSoft) gsap.to(inkMatSoft.color, { r: c2.r, g: c2.g, b: c2.b, duration: 1 });
    if(inkMatGlossy) gsap.to(inkMatGlossy.color, { r: c3.r, g: c3.g, b: c3.b, duration: 1 });
    if(ringMat) gsap.to(ringMat.color, { r: cr.r, g: cr.g, b: cr.b, duration: 1 });
  });

  /* Custom Cursor & Tilt Effects */
  if (!mob) {
    const c = document.getElementById('cursor'), cf = document.getElementById('cursor-follower');
    gsap.set([c, cf], { xPercent: -50, yPercent: -50 });
    let cx = innerWidth / 2, cy = innerHeight / 2, fx = cx, fy = cy;
    window.addEventListener('mousemove', e => { cx = e.clientX; cy = e.clientY; });
    gsap.ticker.add(() => {
      fx += (cx - fx) * 0.15; fy += (cy - fy) * 0.15;
      gsap.set(c, { x: cx, y: cy });
      gsap.set(cf, { x: fx, y: fy });
    });

    document.querySelectorAll('a, button, .card').forEach(el => {
      el.addEventListener('mouseenter', () => { cf?.classList.add('active'); playSound('hover'); });
      el.addEventListener('mouseleave', () => cf?.classList.remove('active'));
      el.addEventListener('click', () => playSound('click'));
    });

    // 3D Card Tilt + WebGL-style Inner Image Parallax
    document.querySelectorAll('.card').forEach(card => {
      const img = card.querySelector('.proj-img img');
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        const rx = ((y - r.height / 2) / (r.height / 2)) * -8;
        const ry = ((x - r.width / 2) / (r.width / 2)) * 8;
        gsap.to(card, { rotationX: rx, rotationY: ry, y: -4, scale: 1.02, transformPerspective: 1000, ease: "power1.out", duration: 0.3 });
        if (img) gsap.to(img, { x: ry * 2, y: -rx * 2, scale: 1.15, duration: 0.3, ease: "power1.out" });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { rotationX: 0, rotationY: 0, y: 0, scale: 1, ease: "power3.out", duration: 0.5 });
        if (img) gsap.to(img, { x: 0, y: 0, scale: 1, ease: "power3.out", duration: 0.5 });
      });
    });
  }

  /* Typewriter */
  const roles = ["Flutter & Mobile Developer", "Supabase & Backend Architect", "Clean UI/UX Enthusiast"];
  let roleIdx = 0, charIdx = 0, isDel = false;
  function typewriter() {
    const tw = document.getElementById('typewriter');
    if (!tw) return;
    const cur = roles[roleIdx];
    tw.innerText = cur.substring(0, charIdx + (isDel ? -1 : 1));
    charIdx += isDel ? -1 : 1;
    let spd = isDel ? 30 : 80;
    if (!isDel && charIdx === cur.length) { spd = 2000; isDel = true; }
    else if (isDel && charIdx === 0) { isDel = false; roleIdx = (roleIdx + 1) % roles.length; spd = 500; }
    setTimeout(typewriter, spd);
  }

  /* Contact Form Mailto Redirect */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault(); // Prevent page reload
      
      const btnSpan = contactForm.querySelector('button[type="submit"] span');
      const origText = btnSpan.innerText;
      btnSpan.innerText = "Redirecting...";

      const name = contactForm.querySelector('[name="name"]').value;
      const email = contactForm.querySelector('[name="email"]').value;
      const msg = contactForm.querySelector('[name="message"]').value;
      
      const subject = encodeURIComponent(`Portfolio Contact from ${name}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${msg}`);
      
      // Redirect directly to Gmail Web Compose in a new tab
      const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=Adhithyancoc2302@gmail.com&su=${subject}&body=${body}`;
      window.open(gmailLink, '_blank');
      
      setTimeout(() => {
        btnSpan.innerText = "Opened in Gmail! ✓";
        setTimeout(() => {
          btnSpan.innerText = origText;
          contactForm.reset();
        }, 3000);
      }, 1000);
    });
  }
});
