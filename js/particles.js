// js/particles.js - 2.5D Particle Engine & Environmental Hazards

class ParticleManager {
  constructor() {
    this.particles = [];
    this.slimePuddles = []; // Active slippery slime areas
    this.smokeScreens = []; // Active smoke screens
  }

  update(dt) {
    // 1. Update general particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.gravity || 0) * dt;
      p.size += (p.growth || 0) * dt;
      p.rotation = (p.rotation || 0) + (p.rotSpeed || 0) * dt;

      if (p.friction) {
        p.vx *= Math.pow(p.friction, dt * 60);
        p.vy *= Math.pow(p.friction, dt * 60);
      }
    }

    // 2. Update Slime Puddles
    for (let i = this.slimePuddles.length - 1; i >= 0; i--) {
      const puddle = this.slimePuddles[i];
      puddle.duration -= dt;
      if (puddle.duration <= 0) {
        this.slimePuddles.splice(i, 1);
        continue;
      }
      // Occasional slime bubble
      if (Math.random() < 0.2) {
        this.emitSlimeBubble(puddle.x + (Math.random() * 2 - 1) * puddle.radius, puddle.y);
      }
    }

    // 3. Update Smoke Screens
    for (let i = this.smokeScreens.length - 1; i >= 0; i--) {
      const smoke = this.smokeScreens[i];
      smoke.duration -= dt;
      if (smoke.duration <= 0) {
        this.smokeScreens.splice(i, 1);
        continue;
      }
      // Volumetric puffs expanding
      if (smoke.puffs.length < 24 && Math.random() < 0.4) {
        smoke.puffs.push({
          relX: (Math.random() * 2 - 1) * smoke.radius * 0.7,
          relY: (Math.random() * 2 - 1) * smoke.radius * 0.7,
          size: 35 + Math.random() * 45,
          growth: 12 + Math.random() * 8,
          alpha: 0.6 + Math.random() * 0.35,
          life: 3.5 + Math.random() * 2
        });
      }
      // Update individual puffs
      for (let j = smoke.puffs.length - 1; j >= 0; j--) {
        const puff = smoke.puffs[j];
        puff.size += puff.growth * dt;
        puff.alpha -= (dt / puff.life);
        if (puff.alpha <= 0) smoke.puffs.splice(j, 1);
      }
    }
  }

  // --- Particle Emitters ---

  emitJetpackFlame(x, y, vx, vy) {
    const count = 3;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() * 2 - 1) * 4,
        y: y + (Math.random() * 2 - 1) * 3,
        vx: vx * 0.3 + (Math.random() * 2 - 1) * 35,
        vy: vy + 120 + Math.random() * 140, // Thrusts downward
        size: 8 + Math.random() * 6,
        growth: -6,
        life: 0.25 + Math.random() * 0.15,
        maxLife: 0.4,
        color: Math.random() > 0.3 ? '#ff8800' : '#ffff44',
        type: 'glowCircle'
      });
    }

    // Dark smoke trail
    if (Math.random() < 0.4) {
      this.particles.push({
        x: x,
        y: y + 8,
        vx: (Math.random() * 2 - 1) * 20,
        vy: 40 + Math.random() * 50,
        size: 10,
        growth: 18,
        life: 0.45,
        maxLife: 0.45,
        color: 'rgba(60, 65, 80, 0.4)',
        type: 'smoke'
      });
    }
  }

  emitExplosion(x, y, radius = 90, color = '#ff6600') {
    window.audioManager.playExplosion(radius / 90);

    // Shockwave ring
    this.particles.push({
      x, y, vx: 0, vy: 0,
      size: 10, growth: radius * 3.5,
      life: 0.35, maxLife: 0.35,
      color: color,
      type: 'shockwave'
    });

    // Intense fire core
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * (radius * 3.5);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        friction: 0.88,
        gravity: 60,
        size: 16 + Math.random() * 18,
        growth: -14,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        color: Math.random() > 0.4 ? color : '#ffffaa',
        type: 'glowCircle'
      });
    }

    // Debris & smoke puffs
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * (radius * 1.8);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        friction: 0.92,
        size: 18 + Math.random() * 22,
        growth: 24,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0,
        color: 'rgba(40, 45, 55, 0.6)',
        type: 'smoke'
      });
    }
  }

  emitSlugTrail(x, y, color, type = 'glow') {
    this.particles.push({
      x: x + (Math.random() * 2 - 1) * 3,
      y: y + (Math.random() * 2 - 1) * 3,
      vx: (Math.random() * 2 - 1) * 15,
      vy: (Math.random() * 2 - 1) * 15,
      size: 7 + Math.random() * 5,
      growth: -8,
      life: 0.22,
      maxLife: 0.22,
      color: color,
      type: type === 'bubble' ? 'bubbleRing' : 'glowCircle'
    });
  }

  emitLightningSparks(x, y, targetX, targetY) {
    window.audioManager.playZap();
    const count = 8;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() * 2 - 1) * 12,
        y: y + (Math.random() * 2 - 1) * 12,
        vx: (Math.random() * 2 - 1) * 160,
        vy: (Math.random() * 2 - 1) * 160,
        friction: 0.85,
        size: 3 + Math.random() * 3,
        life: 0.25 + Math.random() * 0.15,
        maxLife: 0.4,
        color: '#00ffff',
        type: 'spark'
      });
    }
  }

  emitIceCrystals(x, y) {
    window.audioManager.playFreeze();
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 120,
        friction: 0.94,
        size: 6 + Math.random() * 6,
        growth: -2,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() * 2 - 1) * 8,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0,
        color: '#b3f0ff',
        type: 'crystal'
      });
    }
  }

  emitHealCross(x, y) {
    this.particles.push({
      x: x + (Math.random() * 2 - 1) * 18,
      y: y + (Math.random() * 2 - 1) * 10,
      vx: 0,
      vy: -55 - Math.random() * 35,
      size: 14,
      growth: -2,
      life: 0.8,
      maxLife: 0.8,
      color: '#00ff88',
      type: 'cross'
    });
  }

  emitSlimePuddle(x, y, radius = 90, shooterId = null) {
    window.audioManager.playSlimeSlip();
    this.slimePuddles.push({
      x, y,
      radius,
      duration: 10.0, // Stays on surface for 10 seconds
      maxDuration: 10.0,
      shooterId
    });

    // Splatter particles
    for (let i = 0; i < 18; i++) {
      const angle = -Math.PI / 2 + (Math.random() * 2 - 1) * 1.2;
      const speed = 60 + Math.random() * 140;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 350,
        size: 8 + Math.random() * 8,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8,
        color: '#44ff22',
        type: 'slime'
      });
    }
  }

  emitSlimeBubble(x, y) {
    this.particles.push({
      x, y,
      vx: (Math.random() * 2 - 1) * 5,
      vy: -15 - Math.random() * 15,
      size: 4 + Math.random() * 4,
      growth: 2,
      life: 0.4,
      maxLife: 0.4,
      color: '#22dd11',
      type: 'bubbleRing'
    });
  }

  emitSmokeScreen(x, y, radius = 180, shooterId = null) {
    this.smokeScreens.push({
      x, y,
      radius,
      duration: 10.0,
      maxDuration: 10.0,
      shooterId,
      puffs: []
    });
  }

  emitVortex(x, y, radius = 140) {
    this.particles.push({
      x, y,
      vx: 0, vy: 0,
      size: 20, growth: radius * 2,
      rotation: 0, rotSpeed: 12,
      life: 0.6, maxLife: 0.6,
      color: 'rgba(180, 220, 255, 0.8)',
      type: 'vortex'
    });
  }

  // --- 2.5D Rendering ---

  render(ctx, camera, localPlayerHasThermal = false, localPlayerId = null) {
    // 1. Render Slime Puddles on platforms
    for (let i = 0; i < this.slimePuddles.length; i++) {
      const puddle = this.slimePuddles[i];
      const sp = camera.toScreen(puddle.x, puddle.y, 0);
      const r = puddle.radius * camera.zoom;
      const alpha = Math.min(1.0, puddle.duration / 1.5) * 0.75;

      ctx.save();
      ctx.translate(sp.x, sp.y);
      ctx.scale(1, 0.4); // Flattened on platform surface

      const grad = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
      grad.addColorStop(0, `rgba(50, 255, 20, ${alpha})`);
      grad.addColorStop(0.7, `rgba(30, 200, 10, ${alpha * 0.7})`);
      grad.addColorStop(1, 'rgba(0, 180, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Slime surface ripples
      ctx.strokeStyle = `rgba(180, 255, 120, ${alpha * 0.6})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    }

    // 2. Render Particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const sp = camera.toScreen(p.x, p.y, p.depthZ || 0);
      const alpha = p.life / p.maxLife;
      const size = p.size * camera.zoom;
      if (size <= 0.5) continue;

      ctx.save();
      ctx.translate(sp.x, sp.y);
      if (p.rotation) ctx.rotate(p.rotation);

      if (p.type === 'glowCircle') {
        ctx.globalAlpha = Math.min(1.0, alpha * 1.2);
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, p.color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'smoke') {
        ctx.globalAlpha = alpha * 0.5;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'shockwave') {
        ctx.globalAlpha = alpha * 0.7;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(2, 6 * camera.zoom * alpha);
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'bubbleRing') {
        ctx.globalAlpha = alpha * 0.7;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'cross') {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        const armW = size * 0.35;
        ctx.fillRect(-armW / 2, -size / 2, armW, size);
        ctx.fillRect(-size / 2, -armW / 2, size, armW);
      } else if (p.type === 'crystal') {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size * 0.6, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(-size * 0.6, 0);
        ctx.closePath();
        ctx.fill();
      } else if (p.type === 'vortex') {
        ctx.globalAlpha = alpha * 0.8;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 4 * camera.zoom;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 1.5);
        ctx.stroke();
      }

      ctx.restore();
    }

    // 3. Render Smoke Screens (Volumetric Blinding Fog)
    for (let i = 0; i < this.smokeScreens.length; i++) {
      const smoke = this.smokeScreens[i];
      const isShooter = localPlayerId && smoke.shooterId === localPlayerId;
      // If the local player is shooter or has thermal scanner, render transparent outline
      const seeThrough = isShooter || localPlayerHasThermal;

      const sp = camera.toScreen(smoke.x, smoke.y, 0);
      const r = smoke.radius * camera.zoom;

      ctx.save();
      const baseAlpha = seeThrough ? 0.35 : 0.95;

      const grad = ctx.createRadialGradient(sp.x, sp.y, r * 0.1, sp.x, sp.y, r);
      grad.addColorStop(0, `rgba(18, 14, 28, ${baseAlpha})`);
      grad.addColorStop(0.6, `rgba(32, 22, 45, ${baseAlpha * 0.9})`);
      grad.addColorStop(1, 'rgba(10, 8, 16, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, r, 0, Math.PI * 2);
      ctx.fill();

      // Additional volumetric billow puffs
      for (let j = 0; j < smoke.puffs.length; j++) {
        const puff = smoke.puffs[j];
        const puffP = camera.toScreen(smoke.x + puff.relX, smoke.y + puff.relY, 0);
        const puffR = puff.size * camera.zoom;

        ctx.fillStyle = `rgba(24, 18, 36, ${puff.alpha * baseAlpha})`;
        ctx.beginPath();
        ctx.arc(puffP.x, puffP.y, puffR, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }
}

window.ParticleManager = ParticleManager;

