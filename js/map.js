// js/map.js - Mini Militia Style 2.5D Polygonal Cavern Arena Stage
// Zero-dependency pure procedural low-poly vector geometry & lighting

class MapManager {
  constructor() {
    this.width = 3800;
    this.height = 2400;

    // Platform definitions [x, y, w, h, theme, isOneWay, depth]
    this.platforms = [];
    this.spawnPoints = [];
    this.initMapGeometry();
  }

  initMapGeometry() {
    // 8 Strategic spawn points directly above key combat ledges (one for each player/bot)
    this.spawnPoints = [
      { x: 580, y: 560, name: 'West Crystal Perch' },
      { x: 3180, y: 560, name: 'East Crystal Perch' },
      { x: 1900, y: 460, name: 'Central Sky Bridge' },
      { x: 550, y: 1200, name: 'West Mid Bunker' },
      { x: 3250, y: 1200, name: 'East Mid Bunker' },
      { x: 1900, y: 1300, name: 'Central Arena Arena' },
      { x: 750, y: 1700, name: 'Lower Catacomb West' },
      { x: 3050, y: 1700, name: 'Lower Catacomb East' }
    ];

    // =========================================================================
    // 1. MASSIVE SUBTERRANEAN BEDROCK GROUND & OUTER CLIFF WALLS
    // =========================================================================
    // Solid low-poly bedrock floor extending deep below the camera view (no gap)
    this.addPlatform(0, 2220, 3800, 800, 'bedrock', false, 60);

    // Massive left & right fortified cavern cliff walls (seamless outer boundaries)
    this.addPlatform(-150, 0, 290, 3000, 'rock', false, 60);
    this.addPlatform(3660, 0, 290, 3000, 'rock', false, 60);

    // (CEILING REMAINS FULLY OPEN: y < 440 has no blocking platforms so falling
    // slugs and upgrade crates drop freely from the sky into combat zones)

    // =========================================================================
    // 2. TIER 1: HIGH FLOATING CRYSTAL ISLANDS & THERMAL SKY BRIDGE
    // =========================================================================
    // West floating amethyst geode shard
    this.addPlatform(360, 620, 480, 80, 'crystal', false, 45);

    // Central suspended volcanic thermal bridge
    this.addPlatform(1550, 540, 700, 65, 'heated', false, 45);

    // East floating amethyst geode shard
    this.addPlatform(2960, 620, 480, 80, 'crystal', false, 45);

    // Vertical shaft security baffles (tactical cover between tiers)
    this.addPlatform(960, 440, 75, 700, 'tech', false, 35);
    this.addPlatform(2760, 440, 75, 700, 'tech', false, 35);

    // =========================================================================
    // 3. TIER 2: MIDGROUND BUNKERS, COMBAT DECKS & HIGHWAY
    // =========================================================================
    // West fortified heavy bunker deck
    this.addPlatform(200, 1260, 680, 80, 'tech', false, 45);

    // West-mid thermal connecting bridge
    this.addPlatform(1060, 1160, 480, 60, 'heated', false, 45);

    // East-mid thermal connecting bridge
    this.addPlatform(2260, 1160, 480, 60, 'heated', false, 45);

    // East fortified heavy bunker deck
    this.addPlatform(2920, 1260, 680, 80, 'tech', false, 45);

    // Central Arena main combat fortress stage
    this.addPlatform(1550, 1360, 700, 90, 'tech', false, 50);

    // Central vertical cover monolith (mid arena sniper cover)
    this.addPlatform(1860, 1100, 80, 260, 'tech', false, 40);

    // =========================================================================
    // 4. TIER 3: LOWER CATACOMBS, CRYSTAL CAVERNS & COVER COLUMNS
    // =========================================================================
    // West catacomb crystal ledge
    this.addPlatform(440, 1760, 620, 85, 'crystal', false, 45);

    // Central subterranean bunker
    this.addPlatform(1450, 1840, 900, 95, 'tech', false, 50);

    // East catacomb crystal ledge
    this.addPlatform(2740, 1760, 620, 85, 'crystal', false, 45);

    // Tactical rock cover pillars near floor
    this.addPlatform(1200, 1580, 75, 160, 'rock', false, 35);
    this.addPlatform(2520, 1580, 75, 160, 'rock', false, 35);
  }

  addPlatform(x, y, w, h, theme = 'tech', isOneWay = false, depth = 45) {
    const mesh = this.generatePlatformMesh(x, y, w, h, theme, depth);
    this.platforms.push({
      x, y, w, h,
      theme,
      isOneWay,
      depth,
      facets: mesh.facets,
      deck: mesh.deck,
      seams: mesh.seams,
      stalactites: mesh.stalactites
    });
  }

  // =========================================================================
  // PROCEDURAL LOW-POLY 2.5D MESH GENERATION (WITH 3D DIRECTIONAL LIGHTING)
  // =========================================================================
  generatePlatformMesh(x, y, w, h, theme, depth) {
    const facets = [];
    const seams = [];
    const stalactites = [];

    // Directional simulated light vector (shining from top-left, pointing forward)
    // Lx = -0.42, Ly = -0.65, Lz = 0.63 (normalized)
    const lx = -0.42, ly = -0.65, lz = 0.63;

    // Deterministic pseudo-random seed based on world position
    let seed = Math.abs(Math.sin(x * 12.9898 + y * 78.233 + w * 3.1415) * 43758.5453);
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const computeFacet = (p0, p1, p2, isSeam = false, seamType = theme) => {
      // 3D Cross Product for Flat Shading normal: (p1 - p0) x (p2 - p0)
      const u = { x: p1.x - p0.x, y: p1.y - p0.y, z: (p1.z || 0) - (p0.z || 0) };
      const v = { x: p2.x - p0.x, y: p2.y - p0.y, z: (p2.z || 0) - (p0.z || 0) };

      let nx = u.y * v.z - u.z * v.y;
      let ny = u.z * v.x - u.x * v.z;
      let nz = u.x * v.y - u.y * v.x;
      const len = Math.hypot(nx, ny, nz);

      if (len > 1e-4) {
        nx /= len; ny /= len; nz /= len;
      } else {
        nx = 0; ny = 0; nz = 1;
      }

      // Ensure normal faces camera (+Z)
      if (nz < 0) { nx = -nx; ny = -ny; nz = -nz; }

      // Dot product with directional light
      const dot = nx * lx + ny * ly + nz * lz;
      // Map [-0.5, 1.0] -> [0.15, 1.0] diffuse light intensity
      const shade = Math.max(0.15, Math.min(1.0, dot * 0.52 + 0.48));

      return {
        pts: [{ x: p0.x, y: p0.y }, { x: p1.x, y: p1.y }, { x: p2.x, y: p2.y }],
        shade,
        isSeam,
        seamType
      };
    };

    // -------------------------------------------------------------------------
    // CASE A: MASSIVE BEDROCK TERRAIN (Bottom Cavern Crust)
    // -------------------------------------------------------------------------
    if (theme === 'bedrock') {
      const segs = Math.max(12, Math.round(w / 60));
      const dx = w / segs;

      // 4 Rows of 3D vertices:
      // Row 0: Top walkable crust (y = 0)
      // Row 1: Sub-crust ridge (y ~ 45-80, jutting forward)
      // Row 2: Mid subterranean strata (y ~ 140-220)
      // Row 3: Deep tectonic crust (y ~ 360-500)
      // Row 4: Abyss floor (y = h)
      const r0 = [], r1 = [], r2 = [], r3 = [], r4 = [];

      for (let i = 0; i <= segs; i++) {
        const vx = i * dx;
        const jx = (i === 0 || i === segs) ? 0 : (rnd() * 2 - 1) * 12;

        r0.push({ x: vx, y: 0, z: 35 });
        r1.push({ x: vx + jx, y: 55 + (rnd() * 2 - 1) * 18, z: 55 });
        r2.push({ x: vx + jx * 1.2, y: 160 + (rnd() * 2 - 1) * 35, z: 35 });
        r3.push({ x: vx + jx * 0.8, y: 380 + (rnd() * 2 - 1) * 50, z: 20 });
        r4.push({ x: vx, y: h, z: 0 });
      }

      // Triangulate between rows
      for (let i = 0; i < segs; i++) {
        // Row 0 -> Row 1 (Upper Basalt Crag)
        facets.push(computeFacet(r0[i], r0[i + 1], r1[i]));
        facets.push(computeFacet(r0[i + 1], r1[i + 1], r1[i]));

        // Row 1 -> Row 2 (Middle Strata + Glowing Magma Fissures)
        const isMagmaSeam = (i % 3 === 0);
        facets.push(computeFacet(r1[i], r1[i + 1], r2[i], isMagmaSeam, 'heated'));
        facets.push(computeFacet(r1[i + 1], r2[i + 1], r2[i], isMagmaSeam, 'heated'));

        // Row 2 -> Row 3 (Tectonic Bedrock)
        facets.push(computeFacet(r2[i], r2[i + 1], r3[i]));
        facets.push(computeFacet(r2[i + 1], r3[i + 1], r3[i]));

        // Row 3 -> Row 4 (Deep Cavern Abyss)
        facets.push(computeFacet(r3[i], r3[i + 1], r4[i]));
        facets.push(computeFacet(r3[i + 1], r4[i + 1], r4[i]));
      }

      return {
        facets,
        deck: { chamfer: 0, height: 24 },
        seams,
        stalactites
      };
    }

    // -------------------------------------------------------------------------
    // CASE B: VERTICAL SHAFT WALLS & CLIFF FACES (h > w * 1.5)
    // -------------------------------------------------------------------------
    const isVerticalWall = (h > w * 1.5);
    if (isVerticalWall) {
      const segs = Math.max(4, Math.round(h / 70));
      const dy = h / segs;

      const leftCol = [];
      const midCol = [];
      const rightCol = [];

      for (let i = 0; i <= segs; i++) {
        const vy = i * dy;
        const jy = (i === 0 || i === segs) ? 0 : (rnd() * 2 - 1) * 12;
        leftCol.push({ x: 0, y: vy, z: 20 });
        midCol.push({ x: w * (0.4 + rnd() * 0.25), y: vy + jy, z: 50 });
        rightCol.push({ x: w, y: vy, z: 20 });
      }

      for (let i = 0; i < segs; i++) {
        const hasSeam = (rnd() < 0.35);
        facets.push(computeFacet(leftCol[i], midCol[i], leftCol[i + 1], hasSeam));
        facets.push(computeFacet(leftCol[i + 1], midCol[i], midCol[i + 1]));
        facets.push(computeFacet(midCol[i], rightCol[i], midCol[i + 1], hasSeam));
        facets.push(computeFacet(midCol[i + 1], rightCol[i], rightCol[i + 1]));
      }

      return {
        facets,
        deck: { chamfer: 0, height: 16 },
        seams,
        stalactites
      };
    }

    // -------------------------------------------------------------------------
    // CASE C: HORIZONTAL FLOATING PLATFORMS (Tech, Crystal, Heated, Rock)
    // -------------------------------------------------------------------------
    const segs = Math.max(4, Math.round(w / 55));
    const dx = w / segs;
    const chamfer = Math.min(18, w * 0.12);
    const deckH = Math.min(h * 0.35, 22);

    // Row 0: Top surface vertices (y = 0)
    // Row 1: Deck bevel vertices (y = deckH)
    // Row 2: Mid rock ridge (y ~ h * 0.65, jutting 3D forward)
    // Row 3: Bottom rock contour (y ~ h * 0.95 - 1.25)
    const r0 = [], r1 = [], r2 = [], r3 = [];

    for (let i = 0; i <= segs; i++) {
      const vx = i * dx;
      const isStart = (i === 0);
      const isEnd = (i === segs);

      // Chamfer taper at platform ends
      const xTop = isStart ? chamfer : (isEnd ? w - chamfer : vx);
      r0.push({ x: xTop, y: 0, z: 35 });

      r1.push({ x: vx, y: deckH, z: 45 });

      const jx = isStart ? 8 : (isEnd ? -8 : (rnd() * 2 - 1) * 10);
      const jy = (rnd() * 2 - 1) * 8;
      r2.push({ x: vx + jx, y: h * 0.62 + jy, z: 55 });

      const taper = (isStart || isEnd) ? 0.75 : (0.9 + rnd() * 0.35);
      r3.push({ x: vx + jx * 1.3, y: Math.max(deckH + 15, h * taper), z: 15 });
    }

    // Triangulate Row 0 -> Row 1 (Beveled Deck)
    for (let i = 0; i < segs; i++) {
      facets.push(computeFacet(r0[i], r0[i + 1], r1[i]));
      facets.push(computeFacet(r0[i + 1], r1[i + 1], r1[i]));
    }

    // Triangulate Row 1 -> Row 2 (Upper Rock / Armor Face)
    for (let i = 0; i < segs; i++) {
      const isSeam = (rnd() < 0.3);
      facets.push(computeFacet(r1[i], r1[i + 1], r2[i], isSeam));
      facets.push(computeFacet(r1[i + 1], r2[i + 1], r2[i], isSeam));
    }

    // Triangulate Row 2 -> Row 3 (Underside Rock Contour)
    for (let i = 0; i < segs; i++) {
      const isSeam = (rnd() < 0.2);
      facets.push(computeFacet(r2[i], r2[i + 1], r3[i], isSeam));
      facets.push(computeFacet(r2[i + 1], r3[i + 1], r3[i], isSeam));
    }

    // Hanging Stalactites / Prismatic Crystal Clusters / Structural Brackets
    if (h > 45) {
      for (let i = 1; i < segs - 1; i += 2) {
        if (rnd() < 0.7) {
          const b0 = r3[i];
          const b1 = r3[i + 1];
          const tipExtra = (theme === 'crystal') ? (28 + rnd() * 35) : (theme === 'heated' ? (20 + rnd() * 25) : (16 + rnd() * 20));
          const tip = {
            x: (b0.x + b1.x) / 2 + (rnd() * 2 - 1) * 6,
            y: Math.max(b0.y, b1.y) + tipExtra,
            z: 25
          };
          stalactites.push({
            p0: { x: b0.x, y: b0.y },
            p1: { x: b1.x, y: b1.y },
            tip: { x: tip.x, y: tip.y },
            shade: 0.3 + rnd() * 0.35,
            theme
          });
        }
      }
    }

    return {
      facets,
      deck: { chamfer, height: deckH },
      seams,
      stalactites
    };
  }

  // =========================================================================
  // COLLISION & RAYCASTING
  // =========================================================================
  checkCollision(box, isDrillSlug = false) {
    const hits = [];

    for (let i = 0; i < this.platforms.length; i++) {
      const p = this.platforms[i];

      if (
        box.x + box.w / 2 > p.x &&
        box.x - box.w / 2 < p.x + p.w &&
        box.y + box.h / 2 > p.y &&
        box.y - box.h / 2 < p.y + p.h
      ) {
        if (isDrillSlug) {
          if (!box.phasedPlatform) {
            box.phasedPlatform = p;
            continue;
          } else if (box.phasedPlatform === p) {
            continue;
          }
        }
        hits.push(p);
      }
    }
    return hits;
  }

  raycast(x1, y1, x2, y2, isDrillSlug = false) {
    let closestHit = null;
    let minT = 1.0;
    const dx = x2 - x1;
    const dy = y2 - y1;

    for (let i = 0; i < this.platforms.length; i++) {
      const p = this.platforms[i];
      const hit = this.intersectRayAABB(x1, y1, dx, dy, p.x, p.y, p.w, p.h);

      if (hit && hit.t < minT && hit.t >= 0) {
        if (isDrillSlug && !closestHit) {
          continue;
        }
        minT = hit.t;
        closestHit = {
          x: x1 + dx * hit.t,
          y: y1 + dy * hit.t,
          normalX: hit.nx,
          normalY: hit.ny,
          platform: p,
          distance: hit.t * Math.hypot(dx, dy)
        };
      }
    }

    return closestHit;
  }

  intersectRayAABB(ox, oy, dx, dy, rx, ry, rw, rh) {
    let tmin = 0.0;
    let tmax = 1.0;
    let nx = 0;
    let ny = 0;

    if (Math.abs(dx) > 1e-6) {
      let t1 = (rx - ox) / dx;
      let t2 = (rx + rw - ox) / dx;
      let sign = -1;
      if (t1 > t2) {
        const tmp = t1; t1 = t2; t2 = tmp;
        sign = 1;
      }
      if (t1 > tmin) {
        tmin = t1;
        nx = sign;
        ny = 0;
      }
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    } else {
      if (ox < rx || ox > rx + rw) return null;
    }

    if (Math.abs(dy) > 1e-6) {
      let t1 = (ry - oy) / dy;
      let t2 = (ry + rh - oy) / dy;
      let sign = -1;
      if (t1 > t2) {
        const tmp = t1; t1 = t2; t2 = tmp;
        sign = 1;
      }
      if (t1 > tmin) {
        tmin = t1;
        nx = 0;
        ny = sign;
      }
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    } else {
      if (oy < ry || oy > ry + rh) return null;
    }

    return { t: tmin, nx, ny };
  }

  // =========================================================================
  // PARALLAX BACKGROUND RENDERING (LOW-POLY CAVERN ATMOSPHERE)
  // =========================================================================
  renderBackground(ctx, camera) {
    const width = camera.canvas.width;
    const height = camera.canvas.height;

    // Atmospheric subterranean gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#070b12');
    bgGrad.addColorStop(0.5, '#05080e');
    bgGrad.addColorStop(0.85, '#0e0b12');
    bgGrad.addColorStop(1, '#1f0d06'); // Deep magma glow from bottom abyss
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Far Low-Poly Mountain & Cavern Silhouettes (Z = 680)
    this.renderFarCavern(ctx, camera, 680);

    // Midground Industrial Pylons, Cavern Struts & Energy Veins (Z = 320)
    this.renderMidCavern(ctx, camera, 320);
  }

  renderFarCavern(ctx, camera, depthZ) {
    const p1 = camera.toScreen(0, 0, depthZ);
    ctx.save();

    // Stylized low-poly jagged cavern peaks
    ctx.fillStyle = '#0a101b';
    ctx.beginPath();
    const count = 18;
    const step = this.width / count;
    for (let i = 0; i <= count; i++) {
      const wx = i * step;
      const wy = 880 + Math.sin(i * 1.6) * 320 + ((i % 2 === 0) ? -70 : 70);
      const sp = camera.toScreen(wx, wy, depthZ);
      if (i === 0) ctx.moveTo(sp.x, sp.y);
      else ctx.lineTo(sp.x, sp.y);
    }
    const botR = camera.toScreen(this.width, this.height + 400, depthZ);
    const botL = camera.toScreen(0, this.height + 400, depthZ);
    ctx.lineTo(botR.x, botR.y);
    ctx.lineTo(botL.x, botL.y);
    ctx.closePath();
    ctx.fill();

    // Subterranean molten magma river glow at bottom
    const lavaP = camera.toScreen(this.width / 2, this.height + 100, depthZ);
    const lavaGrad = ctx.createRadialGradient(lavaP.x, lavaP.y, 60 * p1.scale, lavaP.x, lavaP.y, 900 * p1.scale);
    lavaGrad.addColorStop(0, 'rgba(255, 68, 0, 0.32)');
    lavaGrad.addColorStop(0.4, 'rgba(220, 40, 0, 0.15)');
    lavaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = lavaGrad;
    ctx.fillRect(0, 0, camera.canvas.width, camera.canvas.height);

    ctx.restore();
  }

  renderMidCavern(ctx, camera, depthZ) {
    ctx.save();

    // Industrial support columns / pylons in midground
    ctx.strokeStyle = '#121c29';
    ctx.lineWidth = 16 * camera.zoom * (camera.focalDistance / (camera.focalDistance + depthZ));

    const pipePositions = [580, 1300, 2100, 2900, 3450];
    pipePositions.forEach(wx => {
      const top = camera.toScreen(wx, 50, depthZ);
      const bot = camera.toScreen(wx, 2300, depthZ);
      ctx.beginPath();
      ctx.moveTo(top.x, top.y);
      ctx.lineTo(bot.x, bot.y);
      ctx.stroke();
    });

    // Ambient glowing crystal clusters on background cavern walls
    const crystals = [
      { x: 720, y: 700, color: '#00e5ff' },
      { x: 1900, y: 860, color: '#ff8800' },
      { x: 2880, y: 700, color: '#c084fc' },
      { x: 1220, y: 1550, color: '#00ff88' },
      { x: 2500, y: 1550, color: '#00e5ff' }
    ];

    crystals.forEach(c => {
      const sp = camera.toScreen(c.x, c.y, depthZ);
      const radius = 22 * sp.scale;
      const grad = ctx.createRadialGradient(sp.x, sp.y, 2, sp.x, sp.y, radius * 3.2);
      grad.addColorStop(0, c.color);
      grad.addColorStop(0.4, c.color + '44');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, radius * 3.2, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  // =========================================================================
  // GAMEPLAY PLATFORMS RENDERING (100% LOW-POLY PROCEDURAL 2.5D GEOMETRY)
  // =========================================================================
  renderPlatforms(ctx, camera) {
    const zoom = camera.zoom;
    const time = performance.now() * 0.0025;

    for (let i = 0; i < this.platforms.length; i++) {
      const p = this.platforms[i];

      // Screen transform of platform top-left
      const pTop = camera.toScreen(p.x, p.y, 0);
      const sw = p.w * zoom;
      const sh = p.h * zoom;
      const depthOffset = (p.depth || 45) * zoom;

      // Viewport culling (skip off-screen platforms)
      if (
        pTop.x + sw < -80 || pTop.x > camera.canvas.width + 80 ||
        pTop.y + sh + depthOffset < -80 || pTop.y > camera.canvas.height + 80
      ) {
        continue;
      }

      ctx.save();
      const theme = this.getPlatformTheme(p.theme);

      // 1. Soft Ambient Occlusion / Ground Drop Shadow
      if (p.theme !== 'bedrock') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.52)';
        ctx.beginPath();
        ctx.ellipse(
          pTop.x + sw / 2,
          pTop.y + sh + depthOffset * 0.75,
          sw / 2 + 12 * zoom,
          16 * zoom,
          0, 0, Math.PI * 2
        );
        ctx.fill();
      }

      // 2. Hanging Stalactites & Prismatic Crystals underneath
      if (p.stalactites && p.stalactites.length > 0) {
        for (let j = 0; j < p.stalactites.length; j++) {
          const st = p.stalactites[j];
          const p0 = { x: pTop.x + st.p0.x * zoom, y: pTop.y + st.p0.y * zoom };
          const p1 = { x: pTop.x + st.p1.x * zoom, y: pTop.y + st.p1.y * zoom };
          const tip = { x: pTop.x + st.tip.x * zoom, y: pTop.y + st.tip.y * zoom };

          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.lineTo(tip.x, tip.y);
          ctx.closePath();

          ctx.fillStyle = this.lerpColor(theme.darkShade, theme.lightShade, st.shade);
          ctx.fill();

          ctx.strokeStyle = theme.edgeLine;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Glowing crystal tip
          if (st.theme === 'crystal' || st.theme === 'heated') {
            const glowColor = (st.theme === 'crystal') ? '#d946ef' : '#ff5500';
            ctx.fillStyle = glowColor;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 8 * zoom;
            ctx.beginPath();
            ctx.arc(tip.x, tip.y, 2.5 * zoom, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      // 3. Faceted Low-Poly 3D Front Faces & Under-Rock Triangles
      if (p.facets && p.facets.length > 0) {
        for (let j = 0; j < p.facets.length; j++) {
          const f = p.facets[j];
          const pts = f.pts;

          ctx.beginPath();
          for (let k = 0; k < pts.length; k++) {
            const fx = pTop.x + pts[k].x * zoom;
            const fy = pTop.y + pts[k].y * zoom;
            if (k === 0) ctx.moveTo(fx, fy);
            else ctx.lineTo(fx, fy);
          }
          ctx.closePath();

          // Flat directional lighting calculation
          ctx.fillStyle = this.lerpColor(theme.darkShade, theme.lightShade, f.shade);
          ctx.fill();

          // Crisp polygonal outline
          ctx.strokeStyle = theme.edgeLine;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Animated Pulsing Energy / Magma Seams along select polygon edges
          if (f.isSeam) {
            const seamTheme = (f.seamType && f.seamType !== p.theme) ? this.getPlatformTheme(f.seamType) : theme;
            const pulse = 0.5 + 0.5 * Math.sin(time + j * 0.65);
            ctx.strokeStyle = seamTheme.neonTrim;
            ctx.globalAlpha = 0.4 + 0.55 * pulse;
            ctx.lineWidth = Math.max(1.5, 2.5 * zoom);
            ctx.shadowColor = seamTheme.neonTrim;
            ctx.shadowBlur = 8 * zoom;

            ctx.beginPath();
            ctx.moveTo(pTop.x + pts[0].x * zoom, pTop.y + pts[0].y * zoom);
            ctx.lineTo(pTop.x + pts[1].x * zoom, pTop.y + pts[1].y * zoom);
            ctx.stroke();

            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1.0;
          }
        }
      }

      // 4. Low-Poly Top Walking Deck (Tactical Beveled Edge & Guide Rail)
      const deck = p.deck || { chamfer: 12, height: 20 };
      const chamfer = deck.chamfer * zoom;
      const deckH = deck.height * zoom;

      // Beveled top deck polygon
      ctx.beginPath();
      if (chamfer > 0) {
        ctx.moveTo(pTop.x + chamfer, pTop.y);
        ctx.lineTo(pTop.x + sw - chamfer, pTop.y);
        ctx.lineTo(pTop.x + sw, pTop.y + chamfer);
        ctx.lineTo(pTop.x + sw, pTop.y + deckH);
        ctx.lineTo(pTop.x, pTop.y + deckH);
        ctx.lineTo(pTop.x, pTop.y + chamfer);
      } else {
        ctx.moveTo(pTop.x, pTop.y);
        ctx.lineTo(pTop.x + sw, pTop.y);
        ctx.lineTo(pTop.x + sw, pTop.y + deckH);
        ctx.lineTo(pTop.x, pTop.y + deckH);
      }
      ctx.closePath();

      const deckGrad = ctx.createLinearGradient(pTop.x, pTop.y, pTop.x, pTop.y + deckH);
      deckGrad.addColorStop(0, theme.deckHighlight);
      deckGrad.addColorStop(0.35, theme.deckBase);
      deckGrad.addColorStop(1, theme.deckDark);
      ctx.fillStyle = deckGrad;
      ctx.fill();

      // Top Edge Neon Trim (Crisp walking surface line)
      ctx.strokeStyle = theme.neonTrim;
      ctx.lineWidth = Math.max(2.5, 3.5 * zoom);
      ctx.shadowColor = theme.neonTrim;
      ctx.shadowBlur = 12 * zoom;

      ctx.beginPath();
      if (chamfer > 0) {
        ctx.moveTo(pTop.x + chamfer, pTop.y);
        ctx.lineTo(pTop.x + sw - chamfer, pTop.y);
      } else {
        ctx.moveTo(pTop.x, pTop.y);
        ctx.lineTo(pTop.x + sw, pTop.y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Micro Geometric Grid Panel Lines on Deck Surface
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      const panelSpacing = 55 * zoom;
      const startX = pTop.x + (chamfer > 0 ? chamfer + panelSpacing * 0.5 : panelSpacing);
      const endX = pTop.x + sw - (chamfer > 0 ? chamfer : panelSpacing * 0.5);

      for (let px = startX; px < endX; px += panelSpacing) {
        ctx.beginPath();
        ctx.moveTo(px, pTop.y);
        ctx.lineTo(px, pTop.y + deckH);
        ctx.stroke();
      }

      // Tech Hazard Stripes on Corner Chamfers
      if (p.theme === 'tech' && chamfer > 4) {
        this.renderCornerHazardStripes(ctx, pTop.x, pTop.y, chamfer, zoom);
        this.renderCornerHazardStripes(ctx, pTop.x + sw - chamfer, pTop.y, chamfer, zoom, true);
      }

      ctx.restore();
    }
  }

  // =========================================================================
  // THEME COLOR DEFINITIONS & LIGHTING PALETTES
  // =========================================================================
  getPlatformTheme(themeName) {
    switch (themeName) {
      case 'heated':
        return {
          name: 'heated',
          deckHighlight: '#4a1e1e',
          deckBase: '#250f0f',
          deckDark: '#120606',
          lightShade: '#5c2222',
          darkShade: '#150606',
          edgeLine: 'rgba(255, 90, 20, 0.4)',
          neonTrim: '#ff5500',
          glowColor: 'rgba(255, 100, 0, 0.9)'
        };
      case 'crystal':
        return {
          name: 'crystal',
          deckHighlight: '#3b1f5e',
          deckBase: '#22113d',
          deckDark: '#100620',
          lightShade: '#6b21a8',
          darkShade: '#120524',
          edgeLine: 'rgba(192, 132, 252, 0.4)',
          neonTrim: '#c084fc',
          glowColor: 'rgba(192, 132, 252, 0.9)'
        };
      case 'rock':
      case 'bedrock':
        return {
          name: 'rock',
          deckHighlight: '#334155',
          deckBase: '#1e293b',
          deckDark: '#0f172a',
          lightShade: '#475569',
          darkShade: '#090d14',
          edgeLine: 'rgba(16, 185, 129, 0.35)',
          neonTrim: '#10b981',
          glowColor: 'rgba(16, 185, 129, 0.85)'
        };
      case 'tech':
      default:
        return {
          name: 'tech',
          deckHighlight: '#334155',
          deckBase: '#1e293b',
          deckDark: '#0f172a',
          lightShade: '#38bdf8',
          darkShade: '#090f1a',
          edgeLine: 'rgba(0, 240, 255, 0.4)',
          neonTrim: '#00f0ff',
          glowColor: 'rgba(0, 240, 255, 0.9)'
        };
    }
  }

  // Linear color interpolation between two hex colors (with cached parsing)
  lerpColor(a, b, t) {
    const ah = parseInt(a.replace(/#/g, ''), 16);
    const ar = ah >> 16, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
    const bh = parseInt(b.replace(/#/g, ''), 16);
    const br = bh >> 16, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
    const rr = Math.round(ar + (br - ar) * t);
    const rg = Math.round(ag + (bg - ag) * t);
    const rb = Math.round(ab + (bb - ab) * t);
    return `rgb(${rr},${rg},${rb})`;
  }

  renderCornerHazardStripes(ctx, x, y, size, zoom, flip = false) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, size, size);
    ctx.clip();
    ctx.strokeStyle = '#ff9900';
    ctx.lineWidth = Math.max(1.5, 2.2 * zoom);
    const step = 5 * zoom;
    for (let i = -size; i < size * 2; i += step) {
      ctx.beginPath();
      if (flip) {
        ctx.moveTo(x + i, y);
        ctx.lineTo(x + i - size, y + size);
      } else {
        ctx.moveTo(x + i, y);
        ctx.lineTo(x + i + size, y + size);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // =========================================================================
  // FOREGROUND ATMOSPHERIC FRAMING (Z = -180)
  // =========================================================================
  renderForeground(ctx, camera) {
    const depthZ = -180;
    ctx.save();

    // Stylized low-poly foreground stalactites along upper cavern arch
    ctx.fillStyle = 'rgba(7, 11, 18, 0.65)';
    const count = 14;
    const step = this.width / count;
    for (let i = 0; i < count; i++) {
      const wx = i * step + 120;
      const wy = 0;
      const sp = camera.toScreen(wx, wy, depthZ);
      const tip = camera.toScreen(wx + 35, 75 + (i % 4) * 22, depthZ);
      const right = camera.toScreen(wx + 70, 0, depthZ);

      ctx.beginPath();
      ctx.moveTo(sp.x, sp.y);
      ctx.lineTo(tip.x, tip.y);
      ctx.lineTo(right.x, right.y);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}

window.MapManager = MapManager;
