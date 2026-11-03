/* Duchess Bakehouse - hero 3D layer
   Floating sugar pearls, berries and gold flecks behind the headline.
   Budgeted: capped DPR, reduced count on small screens, paused off-screen. */
(function () {
  "use strict";

  var canvas = document.getElementById("scene");
  if (!canvas || typeof THREE === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // A software renderer or a very weak device is not worth the battery.
  var probe = document.createElement("canvas").getContext("webgl");
  if (!probe) return;

  var W = window.innerWidth;
  var H = window.innerHeight;
  var small = W < 760;
  var COUNT = small ? 22 : 46;

  var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: !small,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.4 : 1.75));
  renderer.setSize(W, H);
  renderer.outputEncoding = THREE.sRGBEncoding;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 120);
  camera.position.set(0, 0, 26);

  // ---- lighting: warm key, blush fill, gold rim ----
  scene.add(new THREE.AmbientLight(0xfff3e2, 0.85));

  var key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(6, 10, 14);
  scene.add(key);

  var blush = new THREE.PointLight(0xefaab6, 1.2, 60);
  scene.add(blush);

  var gold = new THREE.PointLight(0xe8b33d, 1.5, 70);
  gold.position.set(-14, -6, 12);
  scene.add(gold);

  // ---- palette, straight off the reference image ----
  var PEARL = 0xfffbf3;
  var CREAM = 0xf9e8c9;
  var BLUSH = 0xefaab6;
  var PINK = 0xe68c9b;
  var GOLD = 0xe8b33d;
  var BERRY = 0xe03a33;

  var geos = [
    new THREE.SphereGeometry(1, 24, 24),            // pearl
    new THREE.IcosahedronGeometry(1, 0),            // gold fleck
    new THREE.TorusGeometry(0.78, 0.3, 14, 32),     // sugar ring
    new THREE.SphereGeometry(1, 16, 12)             // berry
  ];

  function makeMat(color, rough, metal) {
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: rough,
      metalness: metal,
      transparent: true,
      opacity: 0.82
    });
  }

  var mats = {
    pearl: makeMat(PEARL, 0.22, 0.05),
    cream: makeMat(CREAM, 0.4, 0.0),
    blush: makeMat(BLUSH, 0.35, 0.0),
    pink: makeMat(PINK, 0.3, 0.05),
    gold: makeMat(GOLD, 0.18, 0.92),
    berry: makeMat(BERRY, 0.45, 0.0)
  };

  var recipes = [
    { g: 0, m: "pearl", s: [0.16, 0.34], w: 4 },
    { g: 0, m: "cream", s: [0.18, 0.4], w: 3 },
    { g: 3, m: "blush", s: [0.2, 0.46], w: 3 },
    { g: 3, m: "pink", s: [0.16, 0.36], w: 2 },
    { g: 1, m: "gold", s: [0.12, 0.26], w: 3 },
    { g: 2, m: "gold", s: [0.16, 0.32], w: 1 },
    { g: 3, m: "berry", s: [0.16, 0.3], w: 1 }
  ];

  var bag = [];
  recipes.forEach(function (r, i) {
    for (var k = 0; k < r.w; k++) bag.push(i);
  });

  var rnd = function (a, b) { return a + Math.random() * (b - a); };

  var bits = [];
  var group = new THREE.Group();
  scene.add(group);

  for (var i = 0; i < COUNT; i++) {
    var r = recipes[bag[(Math.random() * bag.length) | 0]];
    var mesh = new THREE.Mesh(geos[r.g], mats[r.m]);
    var s = rnd(r.s[0], r.s[1]);
    mesh.scale.setScalar(s);

    mesh.position.set(rnd(-20, 20), rnd(-13, 13), rnd(-24, -2));
    mesh.rotation.set(rnd(0, 6.28), rnd(0, 6.28), rnd(0, 6.28));

    bits.push({
      mesh: mesh,
      baseY: mesh.position.y,
      baseX: mesh.position.x,
      amp: rnd(0.4, 1.5),
      speed: rnd(0.16, 0.5),
      phase: rnd(0, 6.28),
      spin: rnd(-0.22, 0.22),
      drift: rnd(0.1, 0.35)
    });
    group.add(mesh);
  }

  // ---- interaction state ----
  var mx = 0, my = 0, tmx = 0, tmy = 0, scrollY = 0;

  window.addEventListener("pointermove", function (e) {
    tmx = (e.clientX / window.innerWidth - 0.5) * 2;
    tmy = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  window.addEventListener("scroll", function () {
    scrollY = window.scrollY || 0;
  }, { passive: true });

  // ---- pause when the hero leaves the viewport ----
  var running = true;
  var hero = document.querySelector(".hero");
  if (hero && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      running = entries[0].isIntersecting;
      if (running) tick();
    }, { threshold: 0 }).observe(hero);
  }

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && running) tick();
  });

  var raf = null;
  var clock = new THREE.Clock();

  function tick() {
    if (raf) cancelAnimationFrame(raf);
    if (!running || document.hidden) { raf = null; return; }
    raf = requestAnimationFrame(tick);

    var t = clock.getElapsedTime();

    mx += (tmx - mx) * 0.045;
    my += (tmy - my) * 0.045;

    for (var i = 0; i < bits.length; i++) {
      var b = bits[i];
      b.mesh.position.y = b.baseY + Math.sin(t * b.speed + b.phase) * b.amp;
      b.mesh.position.x = b.baseX + Math.cos(t * b.speed * 0.7 + b.phase) * b.drift;
      b.mesh.rotation.x += b.spin * 0.01;
      b.mesh.rotation.y += b.spin * 0.014;
    }

    // scroll pushes the field back and down, so it clears the headline
    group.position.y = scrollY * 0.004;
    group.rotation.y = mx * 0.09;
    group.rotation.x = my * 0.05;

    camera.position.x = mx * 1.6;
    camera.position.y = -my * 1.1;
    camera.lookAt(0, 0, 0);

    blush.position.set(mx * 16, -my * 12, 18);

    renderer.render(scene, camera);
  }

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      W = window.innerWidth;
      H = window.innerHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    }, 160);
  }, { passive: true });

  tick();
})();
