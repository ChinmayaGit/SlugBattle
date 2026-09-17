// js/upgrades.js - Falling Gun Upgrades & Crates (Twin Blast, Boost, Rapid Fire, Scope, Shield, Thermal, Health, Jetpack)

const UPGRADE_DEFINITIONS = {
  twin_blast: {
    id: 'twin_blast',
    name: 'Twin Blast',
    duration: 20.0,
    color: '#00e5ff',
    icon: '⚡2x',
    description: 'Shoots double slugs in parallel spread'
  },
  attack_boost: {
    id: 'attack_boost',
    name: 'Attack Boost',
    duration: 20.0,
    color: '#ff2200',
    icon: '🔥ATK',
    description: 'Deals 2x damage with all slug attacks'
  },
  rapid_fire: {
    id: 'rapid_fire',
    name: 'Rapid Fire',
    duration: 20.0,
    color: '#ffaa00',
    icon: '⏩SPD',
    description: '3x firing rate with minimal cooldown'
  },
  scope: {
    id: 'scope',
    name: 'Zoom Scope',
    duration: 35.0,
    color: '#a855f7',
    icon: '🎯ZOOM',
    description: 'Zoom camera in & out with RMB or Z'
  },
  shield: {
    id: 'shield',
    name: 'Energy Shield',
    duration: 30.0,
    color: '#8a2be2',
    icon: '🛡️SHLD',
    description: 'Absorbs up to 100 incoming damage'
  },
  thermal_scanner: {
    id: 'thermal_scanner',
    name: 'Thermal Scanner',
    duration: 25.0,
    color: '#00ffcc',
    icon: '👁️SCAN',
    description: 'See enemy outlines through smoke screens'
  },
  health_box: {
    id: 'health_box',
    name: 'Health Box',
    duration: 0, // Instant
    color: '#00ff66',
    icon: '➕HP',
    description: 'Instantly restores health to 100%'
  },
  jetpack: {
    id: 'jetpack',
    name: 'Jetpack Boost',
    duration: 25.0,
    color: '#ff7700',
    icon: '🚀BOOST',
    description: 'High capacity thrusters with super boost'
  }
};

const ALL_UPGRADE_KEYS = Object.keys(UPGRADE_DEFINITIONS);

class FallingUpgradeCrate {
  constructor(upgradeKey, x, y) {
    this.key = upgradeKey;
    this.def = UPGRADE_DEFINITIONS[upgradeKey];
    this.x = x;
    this.y = y;
    this.vy = 90; // Parachute descent
    this.radius = 24;
    this.isGrounded = false;
    this.life = 35.0;
    this.bobPhase = Math.random() * Math.PI * 2;
  }

  update(dt, mapManager, particleManager) {
    this.life -= dt;
    if (this.life <= 0) return false;

    this.bobPhase += dt * 3.5;

    if (!this.isGrounded) {
      this.y += this.vy * dt;

      // Parachute smoke trail
      if (Math.random() < 0.15) {
        particleManager.emitSlugTrail(this.x, this.y, this.def.color);
      }

      // Ground collision
      const box = { x: this.x, y: this.y + 12, w: 22, h: 22 };
      const hits = mapManager.checkCollision(box);
      if (hits.length > 0) {
        this.isGrounded = true;
        this.y = hits[0].y - 14;
      }
    }

    return true;
  }

  render(ctx, camera) {
    const bobOffset = this.isGrounded ? Math.sin(this.bobPhase) * 4 : 0;
    const sp = camera.toScreen(this.x, this.y + bobOffset, 0);

    ctx.save();
    ctx.translate(sp.x, sp.y);

    // Parachute visual while in air
    if (!this.isGrounded) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(0, -32 * camera.zoom, 18 * camera.zoom, Math.PI, 0);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-18 * camera.zoom, -32 * camera.zoom);
      ctx.lineTo(0, 0);
      ctx.moveTo(18 * camera.zoom, -32 * camera.zoom);
      ctx.lineTo(0, 0);
      ctx.stroke();
    }

    // Glowing crate aura
    const haloR = (this.radius + 6) * camera.zoom;
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, haloR);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, this.def.color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, haloR, 0, Math.PI * 2);
    ctx.fill();

    // High tech crate body
    const size = this.radius * 2 * camera.zoom;
    ctx.fillStyle = '#141d2b';
    ctx.strokeStyle = this.def.color;
    ctx.lineWidth = 2 * camera.zoom;
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.strokeRect(-size / 2, -size / 2, size, size);

    // Upgrade icon text / badge
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${12 * camera.zoom}px Orbitron, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.def.icon, 0, 0);

    // Name label
    ctx.font = `bold ${9 * camera.zoom}px Orbitron, sans-serif`;
    ctx.fillText(this.def.name, 0, -size / 2 - 8 * camera.zoom);

    ctx.restore();
  }
}

window.UPGRADE_DEFINITIONS = UPGRADE_DEFINITIONS;
window.ALL_UPGRADE_KEYS = ALL_UPGRADE_KEYS;
window.FallingUpgradeCrate = FallingUpgradeCrate;

