// ============================================================
// CLOUD PAINTS — 3D Bucket Renderer (ES module)
// Three.js cylinder body + lid + handle, label wrapped on body.
// Drag to rotate, auto-rotate, size toggle (1L / 4L / 20L).
// ============================================================
import * as THREE from 'three';

function makeFallbackTexture(color1, color2, name) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const ctx = c.getContext('2d');
  const grd = ctx.createLinearGradient(0, 0, 1024, 0);
  grd.addColorStop(0, color1);
  grd.addColorStop(1, color2);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 1024, 512);
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.fillRect(80, 120, 864, 280);
  ctx.fillStyle = color1;
  ctx.font = 'bold 60px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CLOUD PAINTS', 512, 220);
  ctx.fillStyle = '#333';
  ctx.font = 'bold 80px Inter';
  ctx.fillText(name.toUpperCase(), 512, 310);
  ctx.font = '24px Inter';
  ctx.fillText('Premium Grade · Certified Quality', 512, 360);
  return new THREE.CanvasTexture(c);
}

function createBucket(opts) {
  const group = new THREE.Group();

  const bodyGeo = new THREE.CylinderGeometry(1.0, 0.92, 1.4, 64, 1, true);
  let bodyMat;
  if (opts.label && opts.label.image) {
    opts.label.wrapS = THREE.RepeatWrapping;
    opts.label.wrapT = THREE.ClampToEdgeWrapping;
    opts.label.repeat.set(1, 1);
    opts.label.colorSpace = THREE.SRGBColorSpace;
    bodyMat = new THREE.MeshStandardMaterial({
      map: opts.label,
      side: THREE.DoubleSide,
      roughness: 0.55,
      metalness: 0.05,
    });
  } else {
    bodyMat = new THREE.MeshStandardMaterial({
      color: opts.fallbackColor || 0xffffff,
      roughness: 0.55,
      metalness: 0.05,
    });
  }
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);

  const rimGeo = new THREE.TorusGeometry(1.02, 0.06, 16, 80);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xe0e0e0, metalness: 0.85, roughness: 0.25,
  });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.7;
  group.add(rim);

  const lidGeo = new THREE.CylinderGeometry(0.98, 0.98, 0.04, 64);
  const lidMat = new THREE.MeshStandardMaterial({
    color: opts.lidColor || 0xb8243a, metalness: 0.3, roughness: 0.5,
  });
  const lid = new THREE.Mesh(lidGeo, lidMat);
  lid.position.y = 0.71;
  group.add(lid);

  const bottomRimGeo = new THREE.TorusGeometry(0.93, 0.05, 16, 80);
  const bottomRim = new THREE.Mesh(bottomRimGeo, rimMat);
  bottomRim.rotation.x = Math.PI / 2;
  bottomRim.position.y = -0.69;
  group.add(bottomRim);

  const bottomGeo = new THREE.CylinderGeometry(0.92, 0.92, 0.04, 64);
  const bottom = new THREE.Mesh(bottomGeo, new THREE.MeshStandardMaterial({
    color: 0xcccccc, metalness: 0.7, roughness: 0.4,
  }));
  bottom.position.y = -0.7;
  group.add(bottom);

  const handlePoints = [];
  const hSeg = 32;
  for (let i = 0; i <= hSeg; i++) {
    const t = i / hSeg;
    const theta = Math.PI * t;
    handlePoints.push(new THREE.Vector3(
      Math.cos(theta) * 1.05,
      0.95 + Math.sin(theta) * 0.45,
      0
    ));
  }
  const handleCurve = new THREE.CatmullRomCurve3(handlePoints);
  const handleGeo = new THREE.TubeGeometry(handleCurve, 50, 0.025, 8, false);
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0x444444, metalness: 0.9, roughness: 0.3,
  });
  const handle = new THREE.Mesh(handleGeo, handleMat);
  group.add(handle);

  return group;
}

export function initBucketScene(canvas, options) {
  const scene = new THREE.Scene();
  scene.background = null;

  // Force canvas to measure itself from its parent (flex/grid parents may need layout pass)
  function measure() {
    const parent = canvas.parentElement;
    const pw = parent ? parent.clientWidth : 500;
    const ph = parent ? parent.clientHeight : 500;
    return { w: canvas.clientWidth || pw || 500, h: canvas.clientHeight || ph || 500 };
  }
  const { w, h } = measure();

  const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
  camera.position.set(0, 0.4, 4.4);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h, false);
  // Explicit canvas attributes so CSS can control display size while buffer matches
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 4, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffe6cc, 0.9);
  fill.position.set(-3, 2, 4);
  scene.add(fill);
  const back = new THREE.DirectionalLight(0xffffff, 1.2);
  back.position.set(0, 3, -5);
  scene.add(back);
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444466, 0.5));

  let bucket = null;
  const rotation = { x: -0.15, y: 0 };
  const velocity = { x: 0, y: 0 };
  let dragging = false;
  const lastPointer = { x: 0, y: 0 };
  let autoRotate = true;
  let sizeScale = 1.0;
  let targetScale = 1.0;
  let floatPhase = 0;

  function loadBucket(textureUrl, fallback) {
    const loader = new THREE.TextureLoader();
    loader.load(
      textureUrl,
      (tex) => {
        if (bucket) scene.remove(bucket);
        bucket = createBucket({ label: tex, lidColor: fallback.lidColor });
        bucket.scale.setScalar(sizeScale);
        scene.add(bucket);
      },
      undefined,
      () => {
        if (bucket) scene.remove(bucket);
        const fb = makeFallbackTexture(fallback.color1, fallback.color2, fallback.name);
        bucket = createBucket({ label: fb, lidColor: fallback.lidColor });
        bucket.scale.setScalar(sizeScale);
        scene.add(bucket);
      }
    );
  }
  loadBucket(options.labelUrl, options.fallback);

  function onDown(e) {
    dragging = true;
    autoRotate = false;
    const p = e.touches ? e.touches[0] : e;
    lastPointer.x = p.clientX;
    lastPointer.y = p.clientY;
  }
  function onMove(e) {
    if (!dragging) return;
    const p = e.touches ? e.touches[0] : e;
    const dx = p.clientX - lastPointer.x;
    const dy = p.clientY - lastPointer.y;
    rotation.y += dx * 0.012;
    rotation.x += dy * 0.012;
    rotation.x = Math.max(-0.6, Math.min(0.6, rotation.x));
    velocity.y = dx * 0.012;
    velocity.x = dy * 0.012;
    lastPointer.x = p.clientX;
    lastPointer.y = p.clientY;
  }
  function onUp() {
    dragging = false;
    setTimeout(() => { autoRotate = true; }, 1500);
  }
  canvas.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  canvas.addEventListener('touchstart', onDown, { passive: true });
  canvas.addEventListener('touchmove', onMove, { passive: true });
  canvas.addEventListener('touchend', onUp);

  function resize() {
    const { w: nw, h: nh } = measure();
    if (nw === 0 || nh === 0) return;
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh, false);
  }
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
  // One more resize on next frame to catch layout thrash
  requestAnimationFrame(resize);

  function animate() {
    requestAnimationFrame(animate);
    if (!bucket) { renderer.render(scene, camera); return; }
    if (autoRotate) rotation.y += 0.005;
    else { rotation.y += velocity.y; velocity.y *= 0.94; }
    sizeScale += (targetScale - sizeScale) * 0.12;
    bucket.scale.setScalar(sizeScale);
    bucket.rotation.y = rotation.y;
    bucket.rotation.x = rotation.x;
    floatPhase += 0.02;
    bucket.position.y = Math.sin(floatPhase) * 0.04;
    renderer.render(scene, camera);
  }
  animate();

  return {
    setSize(label) {
      if (label === '1L') targetScale = 0.72;
      else if (label === '4L') targetScale = 1.0;
      else if (label === '20L') targetScale = 1.32;
      else if (label === '250ml') targetScale = 0.55;
    },
    destroy() { renderer.dispose(); },
  };
}
