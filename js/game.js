// js/game.js - Main 2.5D SlugBattle Game Coordinator & Loop

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.radarCanvas = document.getElementById('radar-canvas');
    this.radarCtx = this.radarCanvas ? this.radarCanvas.getContext('2d') : null;

    this.atlasManager = window.atlasManager;
    this.audioManager = window.audioManager;
    this.camera = new window.Camera25D(this.canvas);
    this.mapManager = new window.MapManager();
    this.particleManager = new window.ParticleManager();

    // Players & Bots (Max 8 Players)
    this.players = [];
    this.bots = [];
    this.localPlayer = null;

    // Entities
    this.projectiles = [];
    this.fallingDrops = [];
    this.upgradeCrates = [];

    // Spawners
    this.slugSpawnTimer = 3.5;
    this.upgradeSpawnTimer = 8.0;

    // Match State
    this.matchTime = 300; // 5:00 minutes
    this.targetKills = 15;
    this.isMatchOver = false;
    this.isPaused = false;
    this.lastTime = performance.now();

    // Input state
    this.input = {
      left: false,
      right: false,
      thrust: false,
      up: false,
      down: false,
      aimAngle: 0,
      isMouseDown: false,
      mouseWorldX: 0,
      mouseWorldY: 0
    };

    this.selectedCharKey = 'player';
    this.pendingSwapDrop = null;
    this.isSwapModalOpen = false;
  }

  async init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.setupInputListeners();
    this.setupUIListeners();

    // Initialize Atlas
    try {
      const loaded = await this.atlasManager.init();
      if (!loaded) console.warn('Atlas cache fallback mode');
      this.renderCharacterCardThumbnails();
    } catch (e) {
      console.warn('Atlas init error:', e);
    }
  }

  renderCharacterCardThumbnails() {
    const cards = document.querySelectorAll('.char-card');
    cards.forEach(card => {
      const charKey = card.dataset.char;
      let prefix = 'eli';
      if (charKey === 'trixie') prefix = 'trixie';
      else if (charKey === 'kord') prefix = 'kord';
      else if (charKey === 'pronto') prefix = 'pronto';
      else if (charKey === 'drake') prefix = 'drake';
      else if (charKey === 'mario') prefix = 'mario';
      else if (charKey === 'nacho') prefix = 'nacho';
      else if (charKey === 'darkPerip') prefix = 'shadowleader';

      const thumbCanvas = this.atlasManager.createIconCanvas(charKey, `${prefix}0001`, 46);
      thumbCanvas.className = 'char-card-img';
      card.prepend(thumbCanvas);
    });
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    if (this.radarCanvas) {
      this.radarCanvas.width = 140;
      this.radarCanvas.height = 90;
    }
  }

  startMatch(chosenCharKey = 'player') {
    this.selectedCharKey = chosenCharKey;
    this.audioManager.init();
    this.audioManager.startMusic();

    document.getElementById('start-overlay').style.display = 'none';

    // Roster of 8 distinct Slugterra combatants
    const roster = [
      { name: 'Eli Shane', charKey: 'player' },
      { name: 'Trixie Sting', charKey: 'trixie' },
      { name: 'Kord Zane', charKey: 'kord' },
      { name: 'Pronto Geronimole', charKey: 'pronto' },
      { name: 'Dr. Blakk', charKey: 'drake' },
      { name: 'Mario Bravado', charKey: 'mario' },
      { name: 'Nacho', charKey: 'nacho' },
      { name: 'Shadow Leader', charKey: 'darkPerip' }
    ];

    // Local human player is index 0
    const localSkin = chosenCharKey || 'player';
    this.localPlayer = new window.Player(1, roster.find(r => r.charKey === localSkin)?.name || 'Eli Shane', localSkin, false);
    this.localPlayer.resetAt(this.mapManager.spawnPoints[0]);

    this.players = [this.localPlayer];
    this.bots = [];

    // 7 AI Bots for full 8-player battle!
    let botId = 2;
    for (let i = 0; i < roster.length; i++) {
      if (roster[i].charKey === localSkin) continue;

      const botPlayer = new window.Player(botId, roster[i].name, roster[i].charKey, true);
      const spawnPt = this.mapManager.spawnPoints[botId - 1] || this.mapManager.spawnPoints[0];
      botPlayer.resetAt(spawnPt);

      const botBrain = new window.BotController(botPlayer);
      this.players.push(botPlayer);
      this.bots.push(botBrain);
      botId++;
    }

    // Initial drops falling from sky
    this.spawnInitialDrops();

    // Start 60 FPS Game Loop
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  spawnInitialDrops() {
    // Drop initial slugs so players can pick them up immediately
    const chutePositions = [550, 1150, 1900, 2550, 3100];
    chutePositions.forEach(x => {
      const randomSlugKey = window.ALL_SLUG_KEYS[Math.floor(Math.random() * window.ALL_SLUG_KEYS.length)];
      this.fallingDrops.push(new window.FallingSlugDrop(randomSlugKey, x, 120));
    });

    // Drop an initial upgrade crate
    this.fallingDrops.push(new window.FallingSlugDrop('fire', 1700, 120));
    this.upgradeCrates.push(new window.FallingUpgradeCrate('twin_blast', 1900, 100));
  }

  gameLoop(currentTime) {
    const dt = Math.min(0.08, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    if (!this.isPaused && !this.isMatchOver) {
      this.update(dt);
    }

    this.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  update(dt) {
    // 1. Match Timer Countdown
    this.matchTime -= dt;
    if (this.matchTime <= 0) {
      this.matchTime = 0;
      this.endMatch();
    }

    // 2. Periodic Slug & Upgrade Drops from Sky
    this.slugSpawnTimer -= dt;
    if (this.slugSpawnTimer <= 0) {
      this.slugSpawnTimer = 4.0 + Math.random() * 2.5;
      if (this.fallingDrops.length < 9) {
        const randomX = 350 + Math.random() * (this.mapManager.width - 700);
        const randomSlugKey = window.ALL_SLUG_KEYS[Math.floor(Math.random() * window.ALL_SLUG_KEYS.length)];
        this.fallingDrops.push(new window.FallingSlugDrop(randomSlugKey, randomX, 100));
      }
    }

    this.upgradeSpawnTimer -= dt;
    if (this.upgradeSpawnTimer <= 0) {
      this.upgradeSpawnTimer = 10.0 + Math.random() * 6.0;
      if (this.upgradeCrates.length < 5) {
        const randomX = 400 + Math.random() * (this.mapManager.width - 800);
        const randomUpgradeKey = window.ALL_UPGRADE_KEYS[Math.floor(Math.random() * window.ALL_UPGRADE_KEYS.length)];
        this.upgradeCrates.push(new window.FallingUpgradeCrate(randomUpgradeKey, randomX, 100));
      }
    }

    // 3. Update Local Player
    if (this.localPlayer) {
      // Calculate aim angle from player to mouse world coordinate
      const mouseWorld = this.camera.toWorld(this.input.mouseScreenX || this.canvas.width / 2, this.input.mouseScreenY || this.canvas.height / 2);
      this.input.aimAngle = Math.atan2(mouseWorld.y - (this.localPlayer.y - 6), mouseWorld.x - this.localPlayer.x);
      this.input.mouseWorldX = mouseWorld.x;
      this.input.mouseWorldY = mouseWorld.y;

      this.localPlayer.update(dt, this.mapManager, this.particleManager, this.input);

      // Continuous fire while mouse is held down (only during gameplay, never during modal interactions)
      if (this.input.isMouseDown && !this.isSwapModalOpen && !this.isPaused && !this.isMatchOver) {
        this.localPlayer.fire(this.projectiles, this.particleManager);
      }

      // Check drop pickups & full-inventory swap option
      this.localPlayer.checkDropPickup(this.fallingDrops, (drop) => {
        this.openSwapModal(drop);
      });

      // Check upgrade pickups
      this.localPlayer.checkUpgradePickup(this.upgradeCrates, (name) => {
        this.showToast(`ACQUIRED: ${name.toUpperCase()}!`);
      });

      // Camera Scope check
      if (!this.localPlayer.hasScope && this.camera.zoom !== 1.0) {
        this.camera.setZoom(1.0);
      }
    }

    // 4. Update AI Bots
    for (let i = 0; i < this.bots.length; i++) {
      this.bots[i].update(
        dt,
        this.players,
        this.fallingDrops,
        this.upgradeCrates,
        this.projectiles,
        this.particleManager
      );
    }

    // 5. Update Falling Drops
    for (let i = this.fallingDrops.length - 1; i >= 0; i--) {
      const drop = this.fallingDrops[i];
      if (!drop.update(dt, this.mapManager, this.particleManager)) {
        this.fallingDrops.splice(i, 1);
      }
    }

    // 6. Update Upgrade Crates
    for (let i = this.upgradeCrates.length - 1; i >= 0; i--) {
      const crate = this.upgradeCrates[i];
      if (!crate.update(dt, this.mapManager, this.particleManager)) {
        this.upgradeCrates.splice(i, 1);
      }
    }

    // 7. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      if (!proj.update(dt, this.mapManager, this.particleManager, this.players)) {
        this.projectiles.splice(i, 1);
      }
    }

    // 8. Update Particles
    this.particleManager.update(dt);

    // 9. Update Camera
    this.camera.update(dt, this.localPlayer, { x: this.input.mouseWorldX, y: this.input.mouseWorldY });

    // 10. Update HUD Elements
    this.updateHUD();
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. 2.5D Multi-plane Parallax Background
    this.mapManager.renderBackground(this.ctx, this.camera);

    // 2. 2.5D Extruded Platforms
    this.mapManager.renderPlatforms(this.ctx, this.camera);

    // 3. Falling Drops & Upgrade Crates
    for (let i = 0; i < this.fallingDrops.length; i++) {
      this.fallingDrops[i].render(this.ctx, this.camera);
    }
    for (let i = 0; i < this.upgradeCrates.length; i++) {
      this.upgradeCrates[i].render(this.ctx, this.camera);
    }

    // 4. Snip Slug 3-Bounce Laser Aiming Line
    this.renderLaserAimLine();

    // 5. Projectiles
    for (let i = 0; i < this.projectiles.length; i++) {
      this.projectiles[i].render(this.ctx, this.camera);
    }

    // 6. Players & Bots
    const hasThermal = this.localPlayer && this.localPlayer.hasThermalScanner;
    for (let i = 0; i < this.players.length; i++) {
      const p = this.players[i];
      const isLocal = (p === this.localPlayer);
      p.render(this.ctx, this.camera, isLocal, hasThermal && !isLocal);
    }

    // 7. Aim Reticle & Laser Trajectory (Positioned a little far away from player)
    this.renderAimReticle();

    // 7. Particles, Slime Puddles & Volumetric Smoke Screens
    this.particleManager.render(
      this.ctx,
      this.camera,
      hasThermal,
      this.localPlayer ? this.localPlayer.id : null
    );

    // 8. Foreground Atmospheric Framing
    this.mapManager.renderForeground(this.ctx, this.camera);

    // 9. Minimap Radar
    this.renderRadar();
  }

  // --- Snip Slug 3-Bounce Laser Sight ---
  renderLaserAimLine() {
    if (!this.localPlayer || !this.localPlayer.isAlive) return;
    const activeSlug = this.localPlayer.getActiveSlug();

    // Snip slug feature: Show aim laser line bouncing through walls 3 times!
    if (!activeSlug || activeSlug.type !== 'snip') return;

    let startX = this.localPlayer.x;
    let startY = this.localPlayer.y - 6;
    let angle = this.localPlayer.aimAngle;
    const maxBounces = 3;

    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(255, 34, 85, 0.85)';
    this.ctx.lineWidth = 2 * this.camera.zoom;
    this.ctx.setLineDash([8, 4]);

    for (let b = 0; b < maxBounces; b++) {
      const lineLen = 1400;
      const endX = startX + Math.cos(angle) * lineLen;
      const endY = startY + Math.sin(angle) * lineLen;

      const hit = this.mapManager.raycast(startX, startY, endX, endY);
      const spStart = this.camera.toScreen(startX, startY, 0);

      this.ctx.beginPath();
      this.ctx.moveTo(spStart.x, spStart.y);

      if (hit) {
        const spHit = this.camera.toScreen(hit.x, hit.y, 0);
        this.ctx.lineTo(spHit.x, spHit.y);
        this.ctx.stroke();

        // Little laser bounce point spark
        this.ctx.fillStyle = '#ff2255';
        this.ctx.beginPath();
        this.ctx.arc(spHit.x, spHit.y, 4 * this.camera.zoom, 0, Math.PI * 2);
        this.ctx.fill();

        // Calculate reflected angle
        const vx = Math.cos(angle);
        const vy = Math.sin(angle);
        const dot = vx * hit.normalX + vy * hit.normalY;
        const rvx = vx - 2 * dot * hit.normalX;
        const rvy = vy - 2 * dot * hit.normalY;

        startX = hit.x + hit.normalX * 2;
        startY = hit.y + hit.normalY * 2;
        angle = Math.atan2(rvy, rvx);
      } else {
        const spEnd = this.camera.toScreen(endX, endY, 0);
        this.ctx.lineTo(spEnd.x, spEnd.y);
        this.ctx.stroke();
        break;
      }
    }

    this.ctx.restore();
  }

  // --- Aim Reticle (Stable in one place near player, no connecting line) ---
  renderAimReticle() {
    if (!this.localPlayer || !this.localPlayer.isAlive) return;

    const aimAngle = this.localPlayer.aimAngle;
    // Stable, constant distance near player (85px, never expands or stretches)
    const aimDist = 85;
    const targetX = this.localPlayer.x + Math.cos(aimAngle) * aimDist;
    const targetY = (this.localPlayer.y - 6) + Math.sin(aimAngle) * aimDist;

    const st = this.camera.toScreen(targetX, targetY, 0);
    const zoom = this.camera.zoom;
    const time = performance.now() * 0.003;

    const activeSlug = this.localPlayer.getActiveSlug();
    const hasSlug = (activeSlug && activeSlug.ammo > 0);
    const slugDef = (hasSlug && window.SLUG_DEFINITIONS) ? (activeSlug.def || window.SLUG_DEFINITIONS[activeSlug.type]) : null;
    const themeColor = (slugDef && slugDef.color) ? slugDef.color : '#00e5ff';

    this.ctx.save();
    this.ctx.translate(st.x, st.y);

    // Glowing Soft Ambient Halo
    const reticleR = 13 * zoom;
    const grad = this.ctx.createRadialGradient(0, 0, 1, 0, 0, reticleR * 1.8);
    grad.addColorStop(0, themeColor + '66');
    grad.addColorStop(0.5, themeColor + '22');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    this.ctx.fillStyle = grad;
    this.ctx.globalAlpha = 0.85;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, reticleR * 1.8, 0, Math.PI * 2);
    this.ctx.fill();

    // Outer Rotating Tech Brackets
    this.ctx.save();
    this.ctx.rotate(time * 1.5);
    this.ctx.strokeStyle = themeColor;
    this.ctx.lineWidth = Math.max(1.5, 2 * zoom);
    this.ctx.shadowColor = themeColor;
    this.ctx.shadowBlur = 8 * zoom;
    this.ctx.globalAlpha = 0.9;

    for (let a = 0; a < 4; a++) {
      const startAngle = a * (Math.PI / 2) + Math.PI / 9;
      const endAngle = startAngle + Math.PI / 4.5;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, reticleR, startAngle, endAngle);
      this.ctx.stroke();
    }
    this.ctx.restore();

    // 4 Precision Crosshair Tick Marks (N, S, E, W)
    const tickInner = 5 * zoom;
    const tickOuter = 14 * zoom;
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = Math.max(1.2, 1.8 * zoom);
    this.ctx.shadowColor = themeColor;
    this.ctx.shadowBlur = 5 * zoom;
    this.ctx.globalAlpha = 1.0;

    this.ctx.beginPath();
    this.ctx.moveTo(0, -tickOuter); this.ctx.lineTo(0, -tickInner);
    this.ctx.moveTo(0, tickInner); this.ctx.lineTo(0, tickOuter);
    this.ctx.moveTo(-tickOuter, 0); this.ctx.lineTo(-tickInner, 0);
    this.ctx.moveTo(tickInner, 0); this.ctx.lineTo(tickOuter, 0);
    this.ctx.stroke();

    // Center Target Pip
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 2.2 * zoom, 0, Math.PI * 2);
    this.ctx.fill();

    // Unarmed Warning Ring (if no ammo or empty)
    if (!hasSlug) {
      this.ctx.strokeStyle = '#ff3344';
      this.ctx.lineWidth = 1.5 * zoom;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, reticleR + 4 * zoom, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  // --- Radar / Minimap ---
  renderRadar() {
    if (!this.radarCtx) return;
    const rw = this.radarCanvas.width;
    const rh = this.radarCanvas.height;

    this.radarCtx.fillStyle = 'rgba(10, 16, 26, 0.9)';
    this.radarCtx.fillRect(0, 0, rw, rh);

    const scaleX = rw / this.mapManager.width;
    const scaleY = rh / this.mapManager.height;

    // Platforms outline with theme-coded holo colors
    for (let i = 0; i < this.mapManager.platforms.length; i++) {
      const p = this.mapManager.platforms[i];
      let color = 'rgba(0, 240, 255, 0.35)'; // tech default
      if (p.theme === 'crystal') color = 'rgba(192, 132, 252, 0.4)';
      else if (p.theme === 'heated') color = 'rgba(255, 85, 0, 0.4)';
      else if (p.theme === 'rock' || p.theme === 'bedrock') color = 'rgba(16, 185, 129, 0.35)';

      this.radarCtx.fillStyle = color;
      this.radarCtx.fillRect(p.x * scaleX, p.y * scaleY, Math.max(2, p.w * scaleX), Math.max(2, p.h * scaleY));
    }

    // Falling slug drops
    this.radarCtx.fillStyle = '#ff9900';
    for (let i = 0; i < this.fallingDrops.length; i++) {
      const d = this.fallingDrops[i];
      this.radarCtx.beginPath();
      this.radarCtx.arc(d.x * scaleX, d.y * scaleY, 2.5, 0, Math.PI * 2);
      this.radarCtx.fill();
    }

    // Upgrade crates
    this.radarCtx.fillStyle = '#a855f7';
    for (let i = 0; i < this.upgradeCrates.length; i++) {
      const c = this.upgradeCrates[i];
      this.radarCtx.beginPath();
      this.radarCtx.arc(c.x * scaleX, c.y * scaleY, 3, 0, Math.PI * 2);
      this.radarCtx.fill();
    }

    // Players blips
    for (let i = 0; i < this.players.length; i++) {
      const p = this.players[i];
      if (!p.isAlive) continue;
      this.radarCtx.fillStyle = (p === this.localPlayer) ? '#00ff66' : '#ff2255';
      this.radarCtx.beginPath();
      this.radarCtx.arc(p.x * scaleX, p.y * scaleY, (p === this.localPlayer) ? 4 : 3, 0, Math.PI * 2);
      this.radarCtx.fill();
    }
  }

  // --- HUD Updates ---
  updateHUD() {
    if (!this.localPlayer) return;

    // Health & Boost Bars
    const hpPercent = (this.localPlayer.health / this.localPlayer.maxHealth) * 100;
    const boostPercent = (this.localPlayer.boost / this.localPlayer.maxBoost) * 100;
    const shieldPercent = (this.localPlayer.shieldHealth / this.localPlayer.maxShieldHealth) * 100;

    const hpFill = document.getElementById('health-fill');
    const hpText = document.getElementById('health-text');
    if (hpFill) hpFill.style.width = `${Math.max(0, hpPercent)}%`;
    if (hpText) hpText.textContent = `${Math.ceil(this.localPlayer.health)} HP`;

    const boostFill = document.getElementById('boost-fill');
    const boostText = document.getElementById('boost-text');
    if (boostFill) boostFill.style.width = `${Math.max(0, boostPercent)}%`;
    if (boostText) boostText.textContent = `${Math.ceil(boostPercent)}%`;

    const shieldRow = document.getElementById('shield-row');
    const shieldFill = document.getElementById('shield-fill');
    const shieldText = document.getElementById('shield-text');
    if (shieldRow && shieldFill) {
      if (this.localPlayer.hasShield && this.localPlayer.shieldHealth > 0) {
        shieldRow.style.display = 'flex';
        shieldFill.style.width = `${shieldPercent}%`;
        if (shieldText) shieldText.textContent = `${Math.ceil(this.localPlayer.shieldHealth)}`;
      } else {
        shieldRow.style.display = 'none';
      }
    }

    // Match Timer
    const timerEl = document.getElementById('match-timer');
    if (timerEl) {
      const mins = Math.floor(this.matchTime / 60);
      const secs = Math.floor(this.matchTime % 60);
      timerEl.textContent = `${mins}:${String(secs).padStart(2, '0')}`;
    }

    // 3-Slot Slug Holster Slots & 5 Ammo Pips
    for (let i = 0; i < 3; i++) {
      const slotEl = document.getElementById(`slug-slot-${i + 1}`);
      const slugData = this.localPlayer.slugSlots[i];
      const isActive = (this.localPlayer.activeSlotIndex === i);

      if (slotEl) {
        if (isActive) slotEl.classList.add('active');
        else slotEl.classList.remove('active');

        const nameEl = slotEl.querySelector('.slot-name');
        const iconBox = slotEl.querySelector('.slot-icon-box');
        const pipsBox = slotEl.querySelector('.slot-ammo-pips');
        const emptyText = slotEl.querySelector('.slot-empty-text');

        if (slugData) {
          const def = window.SLUG_DEFINITIONS[slugData.type];
          if (nameEl) nameEl.textContent = def ? def.name : 'Slug';
          if (emptyText) emptyText.style.display = 'none';
          if (pipsBox) pipsBox.style.display = 'flex';

          // Update Icon
          if (iconBox && def && !iconBox.dataset.loadedType || iconBox.dataset.loadedType !== slugData.type) {
            iconBox.dataset.loadedType = slugData.type;
            iconBox.innerHTML = '';
            const canvasIcon = this.atlasManager.createIconCanvas(def.atlas, def.iconSprite, 40);
            iconBox.appendChild(canvasIcon);
          }

          // Update 5 Ammo Pips
          if (pipsBox) {
            pipsBox.innerHTML = '';
            for (let a = 0; a < 5; a++) {
              const pip = document.createElement('div');
              pip.className = 'ammo-pip';
              if (a < slugData.ammo) {
                pip.classList.add('filled');
                if (isActive) pip.classList.add('active-pip');
              }
              pipsBox.appendChild(pip);
            }
          }
        } else {
          if (nameEl) nameEl.textContent = 'EMPTY';
          if (iconBox) iconBox.innerHTML = '';
          if (iconBox) iconBox.dataset.loadedType = '';
          if (pipsBox) pipsBox.style.display = 'none';
          if (emptyText) emptyText.style.display = 'block';
        }
      }
    }

    // Active Gun Upgrades Tray
    this.updateUpgradesTray();

    // Thermal Scanner Screen Overlay
    const thermalOverlay = document.getElementById('thermal-overlay');
    if (thermalOverlay) {
      thermalOverlay.style.display = this.localPlayer.hasThermalScanner ? 'block' : 'none';
    }
  }

  updateUpgradesTray() {
    const tray = document.getElementById('upgrades-tray');
    if (!tray || !this.localPlayer) return;

    tray.innerHTML = '';
    const upgrades = [
      { active: this.localPlayer.hasTwinBlast, def: window.UPGRADE_DEFINITIONS.twin_blast, timer: this.localPlayer.twinBlastTimer },
      { active: this.localPlayer.hasAttackBoost, def: window.UPGRADE_DEFINITIONS.attack_boost, timer: this.localPlayer.attackBoostTimer },
      { active: this.localPlayer.hasRapidFire, def: window.UPGRADE_DEFINITIONS.rapid_fire, timer: this.localPlayer.rapidFireTimer },
      { active: this.localPlayer.hasScope, def: window.UPGRADE_DEFINITIONS.scope, timer: this.localPlayer.scopeTimer },
      { active: this.localPlayer.hasShield && this.localPlayer.shieldHealth > 0, def: window.UPGRADE_DEFINITIONS.shield, timer: this.localPlayer.shieldHealth },
      { active: this.localPlayer.hasThermalScanner, def: window.UPGRADE_DEFINITIONS.thermal_scanner, timer: this.localPlayer.thermalScannerTimer },
      { active: this.localPlayer.hasJetpackBoost, def: window.UPGRADE_DEFINITIONS.jetpack, timer: this.localPlayer.jetpackBoostTimer }
    ];

    upgrades.forEach(u => {
      if (u.active) {
        const badge = document.createElement('div');
        badge.className = 'upgrade-badge';
        badge.innerHTML = `<span>${u.def.icon}</span> <span>${u.def.name}</span>`;
        tray.appendChild(badge);
      }
    });
  }

  // --- Contextual Swap Option ---
  openSwapModal(drop) {
    this.isSwapModalOpen = true;
    this.input.isMouseDown = false;
    this.pendingSwapDrop = drop;
    const modal = document.getElementById('swap-modal');
    if (!modal) return;

    const desc = modal.querySelector('.swap-desc');
    if (desc) {
      const dropName = (drop.def && drop.def.name) ? drop.def.name : (window.SLUG_DEFINITIONS && window.SLUG_DEFINITIONS[drop.type] ? window.SLUG_DEFINITIONS[drop.type].name : drop.type);
      desc.textContent = `All 3 holster slots full! Swap ${dropName} into which slot?`;
    }

    // Set buttons
    for (let i = 0; i < 3; i++) {
      const btn = document.getElementById(`swap-btn-${i + 1}`);
      const slug = this.localPlayer.slugSlots[i];
      if (btn && slug) {
        const def = window.SLUG_DEFINITIONS ? window.SLUG_DEFINITIONS[slug.type] : null;
        btn.innerHTML = `<span>[Slot ${i + 1}]</span> <span>${def ? def.name : 'Slug'} (${slug.ammo}/5)</span>`;
      }
    }

    modal.style.display = 'flex';
  }

  executeSwap(slotIndex) {
    this.input.isMouseDown = false;
    if (this.pendingSwapDrop && this.localPlayer) {
      this.localPlayer.swapSlug(slotIndex, this.pendingSwapDrop, this.fallingDrops);
      this.closeSwapModal();
    }
  }

  closeSwapModal() {
    this.isSwapModalOpen = false;
    this.input.isMouseDown = false;
    this.pendingSwapDrop = null;
    const modal = document.getElementById('swap-modal');
    if (modal) modal.style.display = 'none';
  }

  // --- Kill Feed ---
  addKillFeed(killer, victim, weaponType) {
    const container = document.getElementById('kill-feed');
    if (!container) return;

    const def = window.SLUG_DEFINITIONS[weaponType];
    const weaponName = def ? def.name : weaponType;

    const item = document.createElement('div');
    item.className = 'kill-item';
    item.innerHTML = `
      <span class="kill-killer">${killer}</span>
      <span class="kill-icon">➔ [${weaponName}] ➔</span>
      <span class="kill-victim">${victim}</span>
    `;

    container.appendChild(item);
    setTimeout(() => {
      if (item.parentNode) item.parentNode.removeChild(item);
    }, 4500);
  }

  showToast(text) {
    const warningEl = document.getElementById('unarmed-warning');
    if (warningEl) {
      warningEl.textContent = text;
      warningEl.style.color = '#00ffcc';
      warningEl.style.background = 'rgba(0, 255, 204, 0.25)';
      warningEl.style.borderColor = '#00ffcc';
      warningEl.style.display = 'block';
      setTimeout(() => {
        warningEl.style.display = 'none';
        warningEl.textContent = 'NO SLUGS LOADED - GRAB SLUGS FROM SKY TO FIRE!';
        warningEl.style.color = '#ff3355';
        warningEl.style.background = 'rgba(255, 34, 68, 0.2)';
        warningEl.style.borderColor = '#ff3355';
      }, 2000);
    }
  }

  // --- Scoreboard Modal ---
  toggleScoreboard(show) {
    const modal = document.getElementById('scoreboard-modal');
    if (!modal) return;

    if (show) {
      const tbody = document.getElementById('scoreboard-body');
      if (tbody) {
        tbody.innerHTML = '';
        // Sort by kills descending
        const sorted = [...this.players].sort((a, b) => b.kills - a.kills);

        sorted.forEach(p => {
          const row = document.createElement('tr');
          row.className = `sb-row ${p === this.localPlayer ? 'player-row' : ''}`;
          row.innerHTML = `
            <td>
              <div class="sb-player-name">
                <span>${p.name}</span>
              </div>
            </td>
            <td>${p.kills}</td>
            <td>${p.deaths}</td>
            <td>${p.score}</td>
            <td style="color:${p.isAlive ? '#00ff66' : '#ff4444'}">${p.isAlive ? 'ALIVE' : 'RESPAWNING'}</td>
          `;
          tbody.appendChild(row);
        });
      }
      modal.style.display = 'flex';
    } else {
      modal.style.display = 'none';
    }
  }

  // --- Input Listeners ---
  setupInputListeners() {
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') this.input.left = true;
      if (k === 'd' || k === 'arrowright') this.input.right = true;
      if (k === 'w' || k === 'arrowup' || e.code === 'Space') this.input.thrust = true;
      if (k === 's' || k === 'arrowdown') this.input.down = true;

      // Holster selection keys [1], [2], [3]
      if (k === '1' && this.localPlayer) this.localPlayer.activeSlotIndex = 0;
      if (k === '2' && this.localPlayer) this.localPlayer.activeSlotIndex = 1;
      if (k === '3' && this.localPlayer) this.localPlayer.activeSlotIndex = 2;

      // Swap key [E]
      if (k === 'e') {
        if (this.pendingSwapDrop) {
          this.executeSwap(this.localPlayer.activeSlotIndex);
        } else if (this.localPlayer && this.localPlayer.currentNearbyDrop) {
          this.localPlayer.swapSlug(this.localPlayer.activeSlotIndex, this.localPlayer.currentNearbyDrop, this.fallingDrops);
        }
      }

      // Scope zoom toggle [Z]
      if (k === 'z') {
        if (this.localPlayer && this.localPlayer.hasScope) {
          const newZoom = this.camera.cycleZoomScope();
          this.showToast(`SCOPE ZOOM: ${Math.round(newZoom * 100)}%`);
        }
      }

      // Scoreboard [Tab]
      if (k === 'tab') {
        e.preventDefault();
        this.toggleScoreboard(true);
      }

      // Mute toggle [M]
      if (k === 'm') {
        this.audioManager.toggleMute();
      }
    });

    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') this.input.left = false;
      if (k === 'd' || k === 'arrowright') this.input.right = false;
      if (k === 'w' || k === 'arrowup' || e.code === 'Space') this.input.thrust = false;
      if (k === 's' || k === 'arrowdown') this.input.down = false;
      if (k === 'tab') {
        e.preventDefault();
        this.toggleScoreboard(false);
      }
    });

    window.addEventListener('mousemove', (e) => {
      this.input.mouseScreenX = e.clientX;
      this.input.mouseScreenY = e.clientY;
    });

    window.addEventListener('mousedown', (e) => {
      // Check if clicking inside UI elements, modals, buttons, cards, or holster
      const isUI = e.target.closest('#swap-modal') ||
                   e.target.closest('.slug-slot') ||
                   e.target.closest('.holster-slots-container') ||
                   e.target.closest('#start-overlay') ||
                   e.target.closest('#scoreboard-modal') ||
                   e.target.closest('button') ||
                   e.target.closest('.char-card');

      if (isUI || this.isSwapModalOpen || this.isPaused || this.isMatchOver) {
        this.input.isMouseDown = false;
        return;
      }

      if (e.button === 0) { // Left Click = Fire
        this.input.isMouseDown = true;
        if (this.localPlayer) {
          this.localPlayer.fire(this.projectiles, this.particleManager);
        }
      } else if (e.button === 2) { // Right Click = Scope Zoom
        e.preventDefault();
        if (this.localPlayer && this.localPlayer.hasScope) {
          const newZoom = this.camera.cycleZoomScope();
          this.showToast(`SCOPE ZOOM: ${Math.round(newZoom * 100)}%`);
        }
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.input.isMouseDown = false;
      }
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    // Mouse wheel cycles slug slots
    window.addEventListener('wheel', (e) => {
      if (!this.localPlayer) return;
      if (e.deltaY > 0) {
        this.localPlayer.activeSlotIndex = (this.localPlayer.activeSlotIndex + 1) % 3;
      } else if (e.deltaY < 0) {
        this.localPlayer.activeSlotIndex = (this.localPlayer.activeSlotIndex + 2) % 3;
      }
    });
  }

  setupUIListeners() {
    // Holster slot clicks - select slot without firing blaster
    for (let i = 0; i < 3; i++) {
      const slotEl = document.getElementById(`slug-slot-${i + 1}`);
      if (slotEl) {
        slotEl.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          this.input.isMouseDown = false;
        });
        slotEl.addEventListener('click', (e) => {
          e.stopPropagation();
          this.input.isMouseDown = false;
          if (this.localPlayer) {
            this.localPlayer.activeSlotIndex = i;
          }
        });
      }
    }

    // Swap modal container and buttons - select or cancel without firing
    const swapModal = document.getElementById('swap-modal');
    if (swapModal) {
      swapModal.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        this.input.isMouseDown = false;
      });
      swapModal.addEventListener('click', (e) => {
        e.stopPropagation();
        this.input.isMouseDown = false;
      });
    }

    for (let i = 0; i < 3; i++) {
      const btn = document.getElementById(`swap-btn-${i + 1}`);
      if (btn) {
        btn.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          this.input.isMouseDown = false;
        });
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.input.isMouseDown = false;
          this.executeSwap(i);
        });
      }
    }

    const cancelSwap = document.getElementById('swap-btn-cancel');
    if (cancelSwap) {
      cancelSwap.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        this.input.isMouseDown = false;
      });
      cancelSwap.addEventListener('click', (e) => {
        e.stopPropagation();
        this.input.isMouseDown = false;
        this.closeSwapModal();
      });
    }

    // Audio & Mute button
    const muteBtn = document.getElementById('mute-btn');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        const isMuted = this.audioManager.toggleMute();
        muteBtn.textContent = isMuted ? '🔇' : '🔊';
      });
    }

    // Start button
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.startMatch(this.selectedCharKey);
      });
    }

    // Character picker
    const cards = document.querySelectorAll('.char-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedCharKey = card.dataset.char;
      });
    });
  }

  endMatch() {
    this.isMatchOver = true;
    this.toggleScoreboard(true);
    const title = document.querySelector('.sb-title');
    if (title) title.textContent = 'MATCH FINISHED - FINAL LEADERBOARD';
  }
}

window.Game = Game;
window.addEventListener('DOMContentLoaded', () => {
  window.gameInstance = new Game();
  window.gameInstance.init();
});
