// js/slugs.js - Complete Implementation of All 15 Slugs, Abilities & Falling Drops

const SLUG_DEFINITIONS = {
  bubble: {
    id: 'bubble',
    name: 'Bubble Slug',
    atlas: 'bubble',
    iconSprite: 'bubbleIcon',
    bigSprite: 'bubbleBig',
    powerSprite: 'bubblePower',
    targetH: 52,
    color: '#00e5ff',
    speed: 750,
    damage: 25,
    description: 'Reflects 3 attacks & grants float flight'
  },
  drill: {
    id: 'drill',
    name: 'Drill Slug',
    atlas: 'vinedrill',
    iconSprite: 'vinedrillIcon',
    bigSprite: 'vinedrillBig',
    powerSprite: 'vinedrillPower',
    targetH: 26,
    color: '#32cd32',
    speed: 850,
    damage: 40,
    description: 'Drills through 1 solid wall to hit target'
  },
  snip: {
    id: 'snip',
    name: 'Snip Slug',
    atlas: 'heatseeker',
    iconSprite: 'heatseekerIcon',
    bigSprite: 'heatseekerBig',
    powerSprite: 'heatseekerPower',
    animFrames: [
      'shot_phosporo0001', 'shot_phosporo0002', 'shot_phosporo0003',
      'shot_phosporo0004', 'shot_phosporo0005', 'shot_phosporo0006'
    ],
    targetH: 42,
    color: '#ff2255',
    speed: 1300,
    damage: 65,
    description: '3-bounce laser aiming line & ricochet shot'
  },
  blast: {
    id: 'blast',
    name: 'Blast Slug',
    atlas: 'grenuke',
    iconSprite: 'grenukeIcon',
    bigSprite: 'grenukeBig',
    powerSprite: 'grenukePower',
    animFrames: [
      'grenuke_shot0001', 'grenuke_shot0002', 'grenuke_shot0003',
      'grenuke_shot0004', 'grenuke_shot0005', 'grenuke_shot0006',
      'grenuke_shot0007', 'grenuke_shot0008', 'grenuke_shot0009'
    ],
    targetH: 42,
    color: '#ff8800',
    speed: 700,
    damage: 90,
    description: 'Sticks to wall/enemy & detonates after 3 sec'
  },
  fight: {
    id: 'fight',
    name: 'Fight Slug',
    atlas: 'bludgeon',
    iconSprite: 'bludgeonIcon',
    bigSprite: 'bludgeonBig',
    powerSprite: 'bludgeonPower',
    animFrames: [
      'ramstone_lev3_0001', 'ramstone_lev3_0002', 'ramstone_lev3_0003', 'ramstone_lev3_0004',
      'ramstone_lev3_0005', 'ramstone_lev3_0006', 'ramstone_lev3_0007', 'ramstone_lev3_0008',
      'ramstone_lev3_0009', 'ramstone_lev3_0010', 'ramstone_lev3_0011', 'ramstone_lev3_0012',
      'ramstone_lev3_0013', 'ramstone_lev3_0014', 'ramstone_lev3_0015', 'ramstone_lev3_0016'
    ],
    targetH: 38,
    color: '#ff4400',
    speed: 800,
    damage: 60,
    description: 'Heavy power hit with extreme knockback'
  },
  fire: {
    id: 'fire',
    name: 'Fire Slug',
    atlas: 'infernus',
    iconSprite: 'infernusIcon',
    bigSprite: 'infernusBig',
    powerSprite: 'infernusPower',
    animFrames: [
      'slug_fire_shot0001', 'slug_fire_shot0002', 'slug_fire_shot0003',
      'slug_fire_shot0004', 'slug_fire_shot0005'
    ],
    targetH: 42,
    color: '#ff3300',
    speed: 820,
    damage: 45,
    description: 'Direct fire damage + 3 sec burn effect'
  },
  lightning: {
    id: 'lightning',
    name: 'Lightning Slug',
    atlas: 'tazerling',
    iconSprite: 'tazerlingIcon',
    bigSprite: 'tazerlingBig',
    powerSprite: 'tazerlingPower',
    animFrames: [
      'slug_electric_ball0001', 'slug_electric_ball0002',
      'slug_electric_ball0003', 'slug_electric_ball0004'
    ],
    targetH: 42,
    color: '#ffff00',
    speed: 950,
    damage: 35,
    description: 'Shock damage + 5 sec paralyzing stun'
  },
  cutter: {
    id: 'cutter',
    name: 'Cutter Slug',
    atlas: 'porkyspline',
    iconSprite: 'porkysplineIcon',
    bigSprite: 'porkysplineBig',
    powerSprite: 'porkysplinePower',
    targetH: 42,
    color: '#cc44ff',
    speed: 780,
    damage: 40,
    isSpinning: true,
    description: 'Pierces multiple enemies & boomerangs back'
  },
  slim: {
    id: 'slim',
    name: 'Slim Slug',
    atlas: 'darkspores',
    iconSprite: null, // Custom rendered
    bigSprite: null,
    powerSprite: 'shroom_pellet0001',
    animFrames: [
      'shroom_pellet0001', 'shroom_pellet0002', 'shroom_pellet0003',
      'shroom_pellet0004', 'shroom_pellet0005', 'shroom_pellet0006', 'shroom_pellet0007'
    ],
    targetH: 34,
    color: '#44ff22',
    speed: 720,
    damage: 20,
    description: 'Creates slippery slime puddle on surface'
  },
  ice: {
    id: 'ice',
    name: 'Ice Slug',
    atlas: 'frostcrawler',
    iconSprite: 'frostcrawlerIcon',
    bigSprite: 'frostcrawlerBig',
    powerSprite: 'frostcrawlerPower',
    targetH: 42,
    color: '#88eeff',
    speed: 800,
    damage: 35,
    description: 'Frost damage + 3 sec freezing ice block stun'
  },
  smoke: {
    id: 'smoke',
    name: 'Smoke Slug',
    atlas: 'darkspores',
    iconSprite: null,
    bigSprite: null,
    powerSprite: 'power_up0001',
    animFrames: [
      'FXdizzy_0001', 'FXdizzy_0002', 'FXdizzy_0003', 'FXdizzy_0004',
      'FXdizzy_0005', 'FXdizzy_0006', 'FXdizzy_0007'
    ],
    targetH: 38,
    color: '#554477',
    speed: 750,
    damage: 15,
    description: 'Blinding smoke screen (only shooter/thermal sees)'
  },
  piper: {
    id: 'piper',
    name: 'Piper Slug',
    atlas: 'yang',
    iconSprite: 'yangIcon',
    bigSprite: 'yangBig',
    powerSprite: 'yangPower',
    targetH: 38,
    color: '#00ffff',
    speed: 900,
    damage: 40,
    description: 'Super rebound slug bouncing off surfaces'
  },
  storm: {
    id: 'storm',
    name: 'Storm Slug',
    atlas: 'yang',
    iconSprite: 'yangIcon',
    bigSprite: 'yangBig',
    powerSprite: 'yangPower',
    targetH: 38,
    color: '#99bbff',
    speed: 780,
    damage: 45,
    description: 'Cyclone vortex flings nearby players away'
  },
  heal: {
    id: 'heal',
    name: 'Heal Slug',
    atlas: 'enigmo',
    iconSprite: 'enigmoIcon',
    bigSprite: 'enigmoBig',
    powerSprite: 'enigmoPower',
    targetH: 42,
    color: '#00ff88',
    speed: 700,
    damage: 0,
    description: 'Restores user health continuously over 5 sec'
  },
  pieper: {
    id: 'pieper',
    name: 'Pieper Slug',
    atlas: 'hypnogrif',
    iconSprite: 'hypnogrifIcon',
    bigSprite: 'hypnogrifBig',
    powerSprite: 'hypnogrifPower',
    animFrames: [
      'hypno_shot0001', 'hypno_shot0002', 'hypno_shot0003',
      'hypno_shot0004', 'hypno_shot0005', 'hypno_shot0006',
      'hypno_shot0007', 'hypno_shot0008', 'hypno_shot0009'
    ],
    targetH: 42,
    color: '#ff00aa',
    speed: 850,
    damage: 30,
    description: 'Telekinetically redirects incoming slugs at shooter'
  }
};

// Aliases for robustness (atlas names & alternate names)
SLUG_DEFINITIONS.infernus = SLUG_DEFINITIONS.fire;
SLUG_DEFINITIONS.tazerling = SLUG_DEFINITIONS.lightning;
SLUG_DEFINITIONS.frostcrawler = SLUG_DEFINITIONS.ice;
SLUG_DEFINITIONS.bludgeon = SLUG_DEFINITIONS.fight;
SLUG_DEFINITIONS.grenuke = SLUG_DEFINITIONS.blast;
SLUG_DEFINITIONS.vinedrill = SLUG_DEFINITIONS.drill;
SLUG_DEFINITIONS.heatseeker = SLUG_DEFINITIONS.snip;
SLUG_DEFINITIONS.porkyspline = SLUG_DEFINITIONS.cutter;
SLUG_DEFINITIONS.wildspores = SLUG_DEFINITIONS.slim;
SLUG_DEFINITIONS.darkspores = SLUG_DEFINITIONS.smoke;
SLUG_DEFINITIONS.enigmo = SLUG_DEFINITIONS.heal;
SLUG_DEFINITIONS.hypnogrif = SLUG_DEFINITIONS.pieper;

const ALL_SLUG_KEYS = [
  'bubble', 'drill', 'snip', 'blast', 'fight', 'fire', 'lightning',
  'cutter', 'slim', 'ice', 'smoke', 'piper', 'storm', 'heal', 'pieper'
];

// --- Active Projectile Slug Entity ---
class ActiveSlugProjectile {
  constructor(slugType, shooter, startX, startY, angle, isTwin = false) {
    this.def = SLUG_DEFINITIONS[slugType] || SLUG_DEFINITIONS.fire;
    this.type = this.def.id;
    this.shooter = shooter;
    this.shooterId = shooter ? shooter.id : null;

    this.x = startX;
    this.y = startY;
    this.startX = startX;
    this.startY = startY;

    // Apply attack boost if shooter has it
    const damageMultiplier = shooter && shooter.hasAttackBoost ? 2.0 : 1.0;
    this.damage = this.def.damage * damageMultiplier;

    this.angle = angle + (isTwin ? (Math.random() * 0.1 - 0.05) : 0);
    this.speed = this.def.speed;
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;

    this.radius = 16;
    this.life = 6.0;
    this.bounces = 0;
    this.maxBounces = (this.type === 'snip' || this.type === 'piper') ? 3 : 0;

    // Specific slug behaviors
    this.isSticky = (this.type === 'blast');
    this.isStuck = false;
    this.stuckTarget = null; // Sticking to player or wall
    this.stuckTimer = 3.0; // 3 sec timer for blast slug
    this.nextBeepTime = 0.5;

    this.phasedPlatform = null; // Drill slug wall penetration

    this.isReturning = false; // Cutter slug boomerang
    this.hitVictims = new Set(); // Cutter slug multi-hit tracker

    this.rotation = this.angle;
    this.age = 0.0;
    this.transformDuration = 0.14; // In-flight velocimorph transformation window
    this.hasTransformed = false;
  }

  update(dt, mapManager, particleManager, players) {
    this.life -= dt;
    if (this.life <= 0) return false;

    this.age += dt;
    if (!this.hasTransformed && this.age >= this.transformDuration) {
      this.hasTransformed = true;
      if (window.audioManager && window.audioManager.playSlugTransform) {
        window.audioManager.playSlugTransform();
      }
      particleManager.emitExplosion(this.x, this.y, 26, this.def.color);
    }

    // 1. Blast Slug Sticky countdown
    if (this.isStuck) {
      if (this.stuckTarget && this.stuckTarget.isAlive) {
        this.x = this.stuckTarget.x + this.stuckOffsetX;
        this.y = this.stuckTarget.y + this.stuckOffsetY;
      }
      this.stuckTimer -= dt;
      this.nextBeepTime -= dt;
      if (this.nextBeepTime <= 0) {
        window.audioManager.playCountdownBeep();
        particleManager.emitSlugTrail(this.x, this.y, '#ffff00');
        this.nextBeepTime = Math.max(0.15, this.stuckTimer / 3.0 * 0.5);
      }
      if (this.stuckTimer <= 0) {
        // Detonate!
        particleManager.emitExplosion(this.x, this.y, 140, '#ff4400');
        this.applyAreaDamage(140, this.damage, players, particleManager);
        return false; // Remove projectile
      }
      return true;
    }

    // 2. Cutter Slug Boomerang return behavior
    if (this.type === 'cutter') {
      const distFromStart = Math.hypot(this.x - this.startX, this.y - this.startY);
      if (distFromStart > 650 && !this.isReturning) {
        this.isReturning = true;
      }
      if (this.isReturning && this.shooter) {
        const dx = this.shooter.x - this.x;
        const dy = this.shooter.y - this.y;
        const distToShooter = Math.hypot(dx, dy);
        if (distToShooter < 30) {
          return false; // Reached shooter, disappears without pickup
        }
        const returnAngle = Math.atan2(dy, dx);
        this.vx = Math.cos(returnAngle) * this.speed;
        this.vy = Math.sin(returnAngle) * this.speed;
      }
    }

    // 3. Movement
    const nextX = this.x + this.vx * dt;
    const nextY = this.y + this.vy * dt;

    // Trail particles
    particleManager.emitSlugTrail(this.x, this.y, this.def.color, this.type);

    // 4. Platform Collision & Bouncing
    const isDrill = (this.type === 'drill');
    const hit = mapManager.raycast(this.x, this.y, nextX, nextY, isDrill);

    if (hit) {
      if (this.isSticky) {
        // Stick to wall
        this.isStuck = true;
        this.x = hit.x;
        this.y = hit.y;
        window.audioManager.playCountdownBeep();
        return true;
      }

      if (this.bounces < this.maxBounces) {
        this.bounces++;
        window.audioManager.playReflect();
        // Reflect velocity across normal
        const dot = this.vx * hit.normalX + this.vy * hit.normalY;
        this.vx = this.vx - 2 * dot * hit.normalX;
        this.vy = this.vy - 2 * dot * hit.normalY;
        this.x = hit.x + hit.normalX * 3;
        this.y = hit.y + hit.normalY * 3;
        this.angle = Math.atan2(this.vy, this.vx);
      } else {
        // Impact on wall
        this.onImpact(hit.x, hit.y, null, particleManager, players);
        return false;
      }
    } else {
      this.x = nextX;
      this.y = nextY;
    }

    this.rotation = Math.atan2(this.vy, this.vx);

    // 5. Player Collision Testing
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (!p.isAlive) continue;
      // Do not hit shooter initially unless returned/reflected
      if (p === this.shooter && !this.isReturning && !this.isReflected) continue;

      const dist = Math.hypot(p.x - this.x, p.y - this.y);
      if (dist < p.radius + this.radius) {
        // Check if victim has Bubble Shield or Pieper Slug manipulation
        if (p.bubbleReflectCount > 0) {
          p.bubbleReflectCount--;
          window.audioManager.playReflect();
          particleManager.emitSlugTrail(this.x, this.y, '#00e5ff', 'bubble');
          // Rebound back toward shooter
          this.vx = -this.vx * 1.2;
          this.vy = -this.vy * 1.2;
          this.shooter = p;
          this.isReflected = true;
          return true;
        }

        if (p.isPieperActive) {
          window.audioManager.playReflect();
          particleManager.emitSlugTrail(this.x, this.y, '#ff00aa', 'vortex');
          // Redirect to attack original shooter!
          if (this.shooter) {
            const dx = this.shooter.x - this.x;
            const dy = this.shooter.y - this.y;
            const angle = Math.atan2(dy, dx);
            this.vx = Math.cos(angle) * this.speed * 1.3;
            this.vy = Math.sin(angle) * this.speed * 1.3;
          } else {
            this.vx = -this.vx;
            this.vy = -this.vy;
          }
          this.shooter = p;
          this.isReflected = true;
          return true;
        }

        // Blast slug sticks to enemy body
        if (this.isSticky) {
          this.isStuck = true;
          this.stuckTarget = p;
          this.stuckOffsetX = this.x - p.x;
          this.stuckOffsetY = this.y - p.y;
          window.audioManager.playCountdownBeep();
          return true;
        }

        // Cutter slug hits and continues
        if (this.type === 'cutter') {
          if (!this.hitVictims.has(p)) {
            this.hitVictims.add(p);
            p.takeDamage(this.damage, this.shooter, this.type);
            particleManager.emitSlugTrail(p.x, p.y, this.def.color);
          }
          continue;
        }

        // Standard impact
        this.onImpact(this.x, this.y, p, particleManager, players);
        return false;
      }
    }

    return true;
  }

  onImpact(x, y, directTarget, particleManager, players) {
    if (directTarget) {
      directTarget.takeDamage(this.damage, this.shooter, this.type);
    }

    // Elemental Ability Triggers
    switch (this.type) {
      case 'fire':
        particleManager.emitExplosion(x, y, 70, '#ff3300');
        if (directTarget) directTarget.applyBurn(3.0); // 3 sec burn
        this.applyAreaDamage(80, this.damage * 0.4, players, particleManager, (v) => v.applyBurn(3.0));
        break;

      case 'lightning':
        particleManager.emitLightningSparks(x, y, x, y);
        if (directTarget) directTarget.applyStun(5.0, 'electric'); // 5 sec stun
        break;

      case 'ice':
        particleManager.emitIceCrystals(x, y);
        if (directTarget) directTarget.applyStun(3.0, 'frost'); // 3 sec frost stun
        break;

      case 'fight':
        particleManager.emitExplosion(x, y, 60, '#ff6600');
        if (directTarget) {
          // Massive knockback impulse
          directTarget.vx += Math.cos(this.angle) * 750;
          directTarget.vy += Math.sin(this.angle) * 750 - 250;
        }
        break;

      case 'slim':
        particleManager.emitSlimePuddle(x, y, 90, this.shooterId);
        break;

      case 'smoke':
        particleManager.emitSmokeScreen(x, y, 160, this.shooterId);
        break;

      case 'storm':
        particleManager.emitVortex(x, y, 140);
        this.applyAreaDamage(140, this.damage, players, particleManager, (v) => {
          // Flings nearby enemies away from impact center
          const angle = Math.atan2(v.y - y, v.x - x);
          v.vx += Math.cos(angle) * 850;
          v.vy += Math.sin(angle) * 850 - 300;
        });
        break;

      case 'heal':
        if (this.shooter && this.shooter.isAlive) {
          this.shooter.applyHeal(5.0); // 5 sec heal
        }
        particleManager.emitHealCross(x, y);
        break;

      case 'bubble':
        if (this.shooter && this.shooter.isAlive) {
          this.shooter.bubbleReflectCount = 3;
          this.shooter.hasBubbleFlight = true;
          this.shooter.bubbleFlightTimer = 6.0;
        }
        particleManager.emitSlugTrail(x, y, '#00e5ff', 'bubble');
        break;

      case 'pieper':
        if (this.shooter && this.shooter.isAlive) {
          this.shooter.isPieperActive = true;
          this.shooter.pieperTimer = 5.0;
        }
        break;

      default:
        particleManager.emitExplosion(x, y, 40, this.def.color);
        break;
    }
  }

  applyAreaDamage(radius, dmg, players, particleManager, onVictim = null) {
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (!p.isAlive) continue;
      const dist = Math.hypot(p.x - this.x, p.y - this.y);
      if (dist <= radius) {
        const falloff = 1.0 - (dist / radius) * 0.5;
        p.takeDamage(dmg * falloff, this.shooter, this.type);
        if (onVictim) onVictim(p);
      }
    }
  }

  render(ctx, camera) {
    const sp = camera.toScreen(this.x, this.y, 0);

    ctx.save();
    ctx.translate(sp.x, sp.y);

    const isTransformed = this.age >= this.transformDuration;
    const progress = Math.min(1.0, this.age / this.transformDuration);

    // 1. Transformation energy flare & shockwave ring (first 140ms after launch)
    if (!isTransformed) {
      const flashRadius = (18 + progress * 26) * camera.zoom;
      const flashGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, flashRadius);
      flashGrad.addColorStop(0, '#ffffff');
      flashGrad.addColorStop(0.45, this.def.color);
      flashGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = flashGrad;
      ctx.beginPath();
      ctx.arc(0, 0, flashRadius, 0, Math.PI * 2);
      ctx.fill();

      // Shockwave ring
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1, 3.0 * (1.0 - progress) * camera.zoom);
      ctx.beginPath();
      ctx.arc(0, 0, flashRadius * 0.85, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 2. Glowing energy aura around slug
    const auraRadius = this.radius * (isTransformed ? 2.4 : 1.7) * camera.zoom;
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, auraRadius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, this.def.color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
    ctx.fill();

    // 3. Sprite rotation and orientation
    if (this.def.isSpinning) {
      ctx.rotate(this.age * 18);
    } else {
      ctx.rotate(this.rotation);
      // Flip vertically when facing left so the creature is right-side up
      if (Math.abs(this.rotation) > Math.PI / 2) {
        ctx.scale(1, -1);
      }
    }

    // 4. Sprite Drawing: Protoform early on, transforming into full Velocimorph battle form
    if (this.age < this.transformDuration * 0.4 && this.def.bigSprite && this.def.atlas) {
      // Early protoform leaving the barrel
      const protoScale = (0.55 + 0.45 * (this.age / (this.transformDuration * 0.4))) * camera.zoom;
      window.atlasManager.drawSprite(
        ctx,
        this.def.atlas,
        this.def.bigSprite,
        0, 0,
        34 * protoScale,
        28 * protoScale
      );
    } else {
      // Transformed Velocimorph Form!
      let spriteName = this.def.powerSprite;
      if (this.def.animFrames && this.def.animFrames.length > 0) {
        const frameIdx = Math.floor(this.age * 16) % this.def.animFrames.length;
        spriteName = this.def.animFrames[frameIdx];
      }

      if (spriteName && this.def.atlas) {
        const sData = window.atlasManager.getSpriteData(this.def.atlas, spriteName);
        const baseH = (this.def.targetH || 42);
        const morphScale = (!isTransformed ? (0.7 + 0.3 * progress) : 1.0);
        const destH = baseH * morphScale * camera.zoom;
        let destW = destH;
        if (sData && sData.w && sData.h) {
          destW = destH * (sData.w / sData.h);
        }

        window.atlasManager.drawSprite(
          ctx,
          this.def.atlas,
          spriteName,
          0, 0,
          destW,
          destH
        );
      } else if (this.def.bigSprite && this.def.atlas) {
        window.atlasManager.drawSprite(
          ctx,
          this.def.atlas,
          this.def.bigSprite,
          0, 0,
          36 * camera.zoom,
          30 * camera.zoom
        );
      } else {
        // Elemental projectile fallback
        ctx.fillStyle = this.def.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, 20 * camera.zoom, 10 * camera.zoom, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(8 * camera.zoom, -2 * camera.zoom, 3 * camera.zoom, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Blast slug flashing ticker visual
    if (this.isStuck) {
      ctx.fillStyle = '#ffff00';
      ctx.font = `bold ${12 * camera.zoom}px Orbitron, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(Math.ceil(this.stuckTimer) + 's', 0, -20 * camera.zoom);
    }

    ctx.restore();
  }
}

// --- Falling Slug Drop Entity (Descends from sky for pickup) ---
class FallingSlugDrop {
  constructor(slugType, x, y) {
    this.def = SLUG_DEFINITIONS[slugType] || SLUG_DEFINITIONS.fire;
    this.type = this.def.id;
    this.x = x;
    this.y = y;
    this.vy = 80; // Gentle parachute descent
    this.radius = 24;
    this.isGrounded = false;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.life = 35.0; // Despawns after 35s if uncollected
  }

  update(dt, mapManager, particleManager) {
    this.life -= dt;
    if (this.life <= 0) return false;

    this.bobPhase += dt * 3.5;

    if (!this.isGrounded) {
      this.y += this.vy * dt;
      // Spawn gentle glowing sparkle
      if (Math.random() < 0.15) {
        particleManager.emitSlugTrail(this.x, this.y, this.def.color);
      }

      // Check ground collision
      const box = { x: this.x, y: this.y + 12, w: 20, h: 20 };
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

    // Glowing capsule halo
    const haloR = (this.radius + 8) * camera.zoom;
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, haloR);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, this.def.color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, haloR, 0, Math.PI * 2);
    ctx.fill();

    // High-tech slug capsule glass pod
    ctx.fillStyle = 'rgba(10, 20, 35, 0.85)';
    ctx.strokeStyle = this.def.color;
    ctx.lineWidth = 2 * camera.zoom;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * camera.zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Slug icon / art inside pod
    if (this.def.iconSprite && this.def.atlas) {
      window.atlasManager.drawSprite(
        ctx,
        this.def.atlas,
        this.def.iconSprite,
        0, 0,
        32 * camera.zoom,
        28 * camera.zoom
      );
    } else {
      ctx.fillStyle = this.def.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, 12 * camera.zoom, 7 * camera.zoom, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Top slug name indicator
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${10 * camera.zoom}px Orbitron, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(this.def.name, 0, -28 * camera.zoom);

    ctx.restore();
  }
}

window.SLUG_DEFINITIONS = SLUG_DEFINITIONS;
window.ALL_SLUG_KEYS = ALL_SLUG_KEYS;
window.ActiveSlugProjectile = ActiveSlugProjectile;
window.FallingSlugDrop = FallingSlugDrop;

