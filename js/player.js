// js/player.js - Player Entity with Mini Militia Jetpack, 3-Slot Holster, Upgrades & Character Skins

class Player {
  constructor(id, name, characterKey = 'player', isBot = false) {
    this.id = id;
    this.name = name;
    this.characterKey = characterKey;
    this.isBot = isBot;

    this.x = 1900;
    this.y = 1300;
    this.vx = 0;
    this.vy = 0;
    this.width = 44;
    this.height = 68;
    this.radius = 26;

    // Movement & Jetpack
    this.speed = 320;
    this.gravity = 1100;
    this.isGrounded = false;
    this.isJetpacking = false;
    this.boost = 100;
    this.maxBoost = 100;
    this.boostDrainRate = 30; // Burn rate per sec
    this.boostRechargeRate = 40; // Recharge rate per sec when grounded
    this.aimAngle = 0;
    this.facingRight = true;
    this.jumpHoldTimer = 0;
    this.prevThrust = false;

    // Health & Combat
    this.health = 100;
    this.maxHealth = 100;
    this.isAlive = true;
    this.respawnTimer = 0;
    this.kills = 0;
    this.deaths = 0;
    this.score = 0;

    // Slug Holster (Max 3 slots, 5 ammo each)
    // Starting condition: CANNOT fire until slugs are picked up!
    this.slugSlots = [null, null, null];
    this.activeSlotIndex = 0;
    this.fireCooldown = 0;
    this.baseFireDelay = 0.45;

    // Status Effects
    this.burnTimer = 0;
    this.stunTimer = 0;
    this.stunType = null; // 'electric' or 'frost'
    this.isSlipped = false; // On slime puddle
    this.healTimer = 0;
    this.bubbleReflectCount = 0;
    this.hasBubbleFlight = false;
    this.bubbleFlightTimer = 0;
    this.isPieperActive = false;
    this.pieperTimer = 0;

    // Gun Upgrades
    this.hasTwinBlast = false;
    this.twinBlastTimer = 0;
    this.hasAttackBoost = false;
    this.attackBoostTimer = 0;
    this.hasRapidFire = false;
    this.rapidFireTimer = 0;
    this.hasScope = false;
    this.scopeTimer = 0;
    this.hasShield = false;
    this.shieldHealth = 0;
    this.maxShieldHealth = 100;
    this.hasThermalScanner = false;
    this.thermalScannerTimer = 0;
    this.hasJetpackBoost = false;
    this.jetpackBoostTimer = 0;

    // Animation & Visuals
    this.animFrame = 1;
    this.animTimer = 0;
    this.recoilTimer = 0;
    this.currentNearbyDrop = null; // For contextual swap prompt
  }

  resetAt(spawnPoint) {
    this.x = spawnPoint.x;
    this.y = spawnPoint.y;
    this.vx = 0;
    this.vy = 0;
    this.health = this.maxHealth;
    this.boost = this.maxBoost;
    this.isAlive = true;
    this.burnTimer = 0;
    this.stunTimer = 0;
    this.isSlipped = false;
    this.bubbleReflectCount = 0;
    this.hasBubbleFlight = false;
    this.isPieperActive = false;
    this.jumpHoldTimer = 0;
    this.prevThrust = false;
  }

  update(dt, mapManager, particleManager, input) {
    if (!this.isAlive) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        const spawns = mapManager.spawnPoints;
        const sp = spawns[Math.floor(Math.random() * spawns.length)];
        this.resetAt(sp);
      }
      return;
    }

    // 1. Update Timers & Status Effects
    this.updateStatusEffects(dt, particleManager);
    this.updateUpgrades(dt);

    if (this.fireCooldown > 0) this.fireCooldown -= dt;
    if (this.recoilTimer > 0) this.recoilTimer -= dt;

    // 2. Check Stunned / Slipped states
    const isImmobilized = (this.stunTimer > 0) || this.isSlipped;

    // 3. Process Movement & Jetpack Input
    let moveX = 0;
    let thrust = false;

    if (!isImmobilized && input) {
      if (input.left) moveX -= 1;
      if (input.right) moveX += 1;
      if (input.thrust || input.up) thrust = true;
      if (input.aimAngle !== undefined) this.aimAngle = input.aimAngle;
    }

    this.facingRight = Math.cos(this.aimAngle) >= 0;

    // Horizontal Acceleration
    const targetVx = moveX * this.speed;
    const accel = this.isGrounded ? 18.0 : 8.0;
    this.vx += (targetVx - this.vx) * Math.min(1.0, accel * dt);

    // Single Jump then Jetpack (Mini Militia Mechanics)
    // 1. Initial Jump Impulse: If grounded and jump button was pressed, leap immediately!
    const isNewJumpPress = thrust && !this.prevThrust;
    if (this.isGrounded && isNewJumpPress) {
      this.vy = -430;
      this.isGrounded = false;
      this.jumpHoldTimer = 0.22; // 220ms initial jump arc before jetpack engages

      // Ground jump dust puff
      const footOffset = this.facingRight ? -10 : 10;
      particleManager.emitJetpackFlame(this.x + footOffset, this.y + this.height / 2, 0, 40);

      if (!this.isBot && window.audioManager && window.audioManager.playJump) {
        window.audioManager.playJump();
      }
    }

    // 2. Jetpack Thrusters:
    // If holding thrust, countdown the initial jump arc timer before firing jetpack thrusters.
    if (thrust && this.jumpHoldTimer > 0) {
      this.jumpHoldTimer -= dt;
    }

    const canJetpack = thrust && (this.jumpHoldTimer <= 0) && (this.boost > 0);

    if (canJetpack) {
      this.isJetpacking = true;
      const thrustPower = this.hasJetpackBoost ? 1900 : 1450;
      this.vy -= thrustPower * dt;
      if (this.vy < -550) this.vy = -550;

      // Drain boost
      const drain = this.hasJetpackBoost ? this.boostDrainRate * 0.6 : this.boostDrainRate;
      this.boost = Math.max(0, this.boost - drain * dt);

      // Emit Thruster Particles from boots
      const footOffset = this.facingRight ? -10 : 10;
      particleManager.emitJetpackFlame(this.x + footOffset, this.y + this.height / 2, this.vx, this.vy);

      if (!this.isBot && window.audioManager) {
        window.audioManager.startJetpack();
      }
    } else {
      this.isJetpacking = false;
      if (!thrust) {
        this.jumpHoldTimer = 0;
      }
      if (!this.isBot && window.audioManager) {
        window.audioManager.stopJetpack();
      }

      // Bubble flight float (buoyancy)
      if (this.hasBubbleFlight) {
        if (this.vy > 60) this.vy = 60;
      }

      // Recharge boost when on ground and not actively jetpacking
      if (this.isGrounded && this.boost < this.maxBoost) {
        this.boost = Math.min(this.maxBoost, this.boost + this.boostRechargeRate * dt);
      }
    }

    this.prevThrust = thrust;

    // Gravity
    const currentGravity = this.hasBubbleFlight ? this.gravity * 0.25 : this.gravity;
    this.vy += currentGravity * dt;
    if (this.vy > 950) this.vy = 950; // Terminal velocity

    // 4. Platform Collision & Physics Resolution
    this.resolvePhysics(dt, mapManager);

    // 5. Check Environmental Slime Puddles
    this.checkSlimePuddles(particleManager.slimePuddles);

    // 6. Animation State
    this.updateAnimation(dt, moveX);
  }

  resolvePhysics(dt, mapManager) {
    // X Axis
    this.x += this.vx * dt;
    let boxX = { x: this.x, y: this.y, w: this.width, h: this.height };
    let hitsX = mapManager.checkCollision(boxX);
    if (hitsX.length > 0) {
      const p = hitsX[0];
      if (this.vx > 0) {
        this.x = p.x - this.width / 2;
      } else if (this.vx < 0) {
        this.x = p.x + p.w + this.width / 2;
      }
      this.vx = 0;
    }

    // Y Axis
    this.y += this.vy * dt;
    let boxY = { x: this.x, y: this.y, w: this.width - 4, h: this.height };
    let hitsY = mapManager.checkCollision(boxY);
    this.isGrounded = false;

    if (hitsY.length > 0) {
      const p = hitsY[0];
      if (this.vy > 0) {
        this.y = p.y - this.height / 2;
        this.vy = 0;
        this.isGrounded = true;
      } else if (this.vy < 0) {
        this.y = p.y + p.h + this.height / 2;
        this.vy = 0;
      }
    }

    // Map Boundaries
    if (this.x < 120) { this.x = 120; this.vx = 0; }
    if (this.x > mapManager.width - 120) { this.x = mapManager.width - 120; this.vx = 0; }
    if (this.y < 120) { this.y = 120; this.vy = 0; }
    if (this.y > mapManager.height - 120) {
      this.y = mapManager.height - 120;
      this.vy = 0;
      this.isGrounded = true;
    }
  }

  checkSlimePuddles(slimePuddles) {
    this.isSlipped = false;
    for (let i = 0; i < slimePuddles.length; i++) {
      const sp = slimePuddles[i];
      const dist = Math.hypot(this.x - sp.x, (this.y + this.height / 2) - sp.y);
      if (dist < sp.radius) {
        this.isSlipped = true;
        // Slide out of control
        this.vx += (this.facingRight ? 120 : -120) * 0.05;
        break;
      }
    }
  }

  updateStatusEffects(dt, particleManager) {
    // Burn effect (Fire slug)
    if (this.burnTimer > 0) {
      this.burnTimer -= dt;
      this.takeDamage(12 * dt, null, 'fire');
      if (Math.random() < 0.3) {
        particleManager.emitSlugTrail(this.x, this.y, '#ff3300');
      }
    }

    // Electric / Frost Stun effect
    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      if (this.stunType === 'electric' && Math.random() < 0.3) {
        particleManager.emitLightningSparks(this.x, this.y, this.x, this.y);
      }
    }

    // Heal effect (Heal slug)
    if (this.healTimer > 0) {
      this.healTimer -= dt;
      this.health = Math.min(this.maxHealth, this.health + 15 * dt);
      if (Math.random() < 0.2) {
        particleManager.emitHealCross(this.x, this.y);
      }
    }

    // Bubble flight timer
    if (this.bubbleFlightTimer > 0) {
      this.bubbleFlightTimer -= dt;
      if (this.bubbleFlightTimer <= 0) {
        this.hasBubbleFlight = false;
      }
    }

    // Pieper manipulation timer
    if (this.pieperTimer > 0) {
      this.pieperTimer -= dt;
      if (this.pieperTimer <= 0) {
        this.isPieperActive = false;
      }
    }
  }

  updateUpgrades(dt) {
    if (this.twinBlastTimer > 0) {
      this.twinBlastTimer -= dt;
      if (this.twinBlastTimer <= 0) this.hasTwinBlast = false;
    }
    if (this.attackBoostTimer > 0) {
      this.attackBoostTimer -= dt;
      if (this.attackBoostTimer <= 0) this.hasAttackBoost = false;
    }
    if (this.rapidFireTimer > 0) {
      this.rapidFireTimer -= dt;
      if (this.rapidFireTimer <= 0) this.hasRapidFire = false;
    }
    if (this.scopeTimer > 0) {
      this.scopeTimer -= dt;
      if (this.scopeTimer <= 0) this.hasScope = false;
    }
    if (this.thermalScannerTimer > 0) {
      this.thermalScannerTimer -= dt;
      if (this.thermalScannerTimer <= 0) this.hasThermalScanner = false;
    }
    if (this.jetpackBoostTimer > 0) {
      this.jetpackBoostTimer -= dt;
      if (this.jetpackBoostTimer <= 0) this.hasJetpackBoost = false;
    }
  }

  // --- Slug Holster & Firing Actions ---

  getActiveSlug() {
    return this.slugSlots[this.activeSlotIndex];
  }

  canFire() {
    if (!this.isAlive || this.stunTimer > 0 || this.isSlipped || this.fireCooldown > 0) {
      return false;
    }
    return true;
  }

  fire(projectilesList, particleManager) {
    if (!this.canFire()) return false;

    const activeSlug = this.getActiveSlug();

    // RULE: Starting we have guns but we can't fire until we pick up slugs!
    if (!activeSlug) {
      if (!this.isBot) {
        window.audioManager.playEmptyClick();
        this.showUnarmedNotice();
      }
      this.fireCooldown = 0.25;
      return false;
    }

    // Muzzle position in front of blaster barrel
    const muzzleDist = 34;
    const muzzleX = this.x + Math.cos(this.aimAngle) * muzzleDist;
    const muzzleY = this.y - 6 + Math.sin(this.aimAngle) * muzzleDist;

    // Sound & visuals
    window.audioManager.playBlasterFire();
    window.audioManager.playSlugScreech(activeSlug.type);
    this.recoilTimer = 0.18;

    // Spawn Projectile
    const p1 = new window.ActiveSlugProjectile(
      activeSlug.type,
      this,
      muzzleX,
      muzzleY,
      this.aimAngle,
      false
    );
    projectilesList.push(p1);

    // Twin Blast upgrade: Fires a second slug!
    if (this.hasTwinBlast) {
      const p2 = new window.ActiveSlugProjectile(
        activeSlug.type,
        this,
        muzzleX,
        muzzleY,
        this.aimAngle,
        true
      );
      projectilesList.push(p2);
    }

    // Decrement Ammo: Each slug can be used 5 times!
    activeSlug.ammo--;
    if (activeSlug.ammo <= 0) {
      // Slug depleted! Empty this slot
      this.slugSlots[this.activeSlotIndex] = null;
    }

    // Set cooldown
    const delay = this.hasRapidFire ? this.baseFireDelay * 0.35 : this.baseFireDelay;
    this.fireCooldown = delay;

    return true;
  }

  showUnarmedNotice() {
    const el = document.getElementById('unarmed-warning');
    if (el) {
      el.style.display = 'block';
      clearTimeout(this.unarmedTimeout);
      this.unarmedTimeout = setTimeout(() => {
        el.style.display = 'none';
      }, 1600);
    }
  }

  // --- Pickup & Swap Mechanics ---

  checkDropPickup(fallingDrops, swapModalCallback = null) {
    if (!this.isAlive) return;
    this.currentNearbyDrop = null;

    for (let i = fallingDrops.length - 1; i >= 0; i--) {
      const drop = fallingDrops[i];
      const dist = Math.hypot(this.x - drop.x, this.y - drop.y);

      if (dist < this.radius + drop.radius + 10) {
        this.currentNearbyDrop = drop;

        // Check if any slot is empty
        const emptySlotIdx = this.slugSlots.findIndex(s => s === null);

        if (emptySlotIdx !== -1) {
          // AUTO-PICKUP into next empty slot!
          this.slugSlots[emptySlotIdx] = {
            type: drop.type,
            ammo: 5,
            def: drop.def || (window.SLUG_DEFINITIONS ? window.SLUG_DEFINITIONS[drop.type] : null)
          };
          window.audioManager.playPickup();
          fallingDrops.splice(i, 1);
          this.currentNearbyDrop = null;
          return;
        } else {
          // ALL 3 SLOTS FULL: Prompt Swap Option!
          if (swapModalCallback && !this.isBot) {
            swapModalCallback(drop);
          }
          return;
        }
      }
    }
  }

  swapSlug(targetSlotIndex, drop, fallingDrops) {
    if (targetSlotIndex < 0 || targetSlotIndex > 2 || !drop) return;

    window.audioManager.playSwap();

    // Replace the slot with new slug
    this.slugSlots[targetSlotIndex] = {
      type: drop.type,
      ammo: 5,
      def: drop.def || (window.SLUG_DEFINITIONS ? window.SLUG_DEFINITIONS[drop.type] : null)
    };

    // Remove the fallen drop from map
    const idx = fallingDrops.indexOf(drop);
    if (idx !== -1) fallingDrops.splice(idx, 1);
    this.currentNearbyDrop = null;
  }

  // --- Upgrade Acquisition ---

  checkUpgradePickup(upgradeCrates, toastCallback = null) {
    if (!this.isAlive) return;

    for (let i = upgradeCrates.length - 1; i >= 0; i--) {
      const crate = upgradeCrates[i];
      const dist = Math.hypot(this.x - crate.x, this.y - crate.y);

      if (dist < this.radius + crate.radius + 10) {
        this.applyUpgrade(crate.key);
        window.audioManager.playPickup();
        if (toastCallback && !this.isBot) {
          toastCallback(crate.def.name);
        }
        upgradeCrates.splice(i, 1);
        return;
      }
    }
  }

  applyUpgrade(key) {
    switch (key) {
      case 'twin_blast':
        this.hasTwinBlast = true;
        this.twinBlastTimer = 20.0;
        break;
      case 'attack_boost':
        this.hasAttackBoost = true;
        this.attackBoostTimer = 20.0;
        break;
      case 'rapid_fire':
        this.hasRapidFire = true;
        this.rapidFireTimer = 20.0;
        break;
      case 'scope':
        this.hasScope = true;
        this.scopeTimer = 35.0;
        break;
      case 'shield':
        this.hasShield = true;
        this.shieldHealth = this.maxShieldHealth;
        break;
      case 'thermal_scanner':
        this.hasThermalScanner = true;
        this.thermalScannerTimer = 25.0;
        break;
      case 'health_box':
        this.health = this.maxHealth;
        break;
      case 'jetpack':
        this.hasJetpackBoost = true;
        this.jetpackBoostTimer = 25.0;
        this.boost = this.maxBoost;
        break;
    }
  }

  // --- Damage, Healing & Status Handlers ---

  takeDamage(amount, attacker = null, damageType = 'slug') {
    if (!this.isAlive) return;

    // Shield absorbs damage first
    if (this.hasShield && this.shieldHealth > 0) {
      window.audioManager.playReflect();
      if (this.shieldHealth >= amount) {
        this.shieldHealth -= amount;
        return;
      } else {
        amount -= this.shieldHealth;
        this.shieldHealth = 0;
        this.hasShield = false;
      }
    }

    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.isAlive = false;
      this.deaths++;
      this.respawnTimer = 3.0;

      if (attacker && attacker !== this) {
        attacker.kills++;
        attacker.score += 100;
        window.gameInstance.addKillFeed(attacker.name, this.name, damageType);
      } else {
        window.gameInstance.addKillFeed('The Cavern', this.name, damageType);
      }
    }
  }

  applyBurn(duration) {
    this.burnTimer = Math.max(this.burnTimer, duration);
  }

  applyStun(duration, type) {
    this.stunTimer = Math.max(this.stunTimer, duration);
    this.stunType = type;
  }

  applyHeal(duration) {
    this.healTimer = Math.max(this.healTimer, duration);
  }

  updateAnimation(dt, moveX) {
    this.animTimer += dt;
    if (Math.abs(moveX) > 0.1 && this.isGrounded) {
      // Walking frame cycle: 1 to 16
      if (this.animTimer > 0.05) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame % 16) + 1;
      }
    } else {
      this.animFrame = 1; // Idle frame
    }
  }

  // --- 2.5D Rendering ---

  render(ctx, camera, isLocalPlayer = false, showThermalOutline = false) {
    if (!this.isAlive) return;

    const sp = camera.toScreen(this.x, this.y, 0);

    ctx.save();
    ctx.translate(sp.x, sp.y);

    // Thermal Scanner Silhouette (Rendered when viewed through smoke with thermal scanner)
    if (showThermalOutline) {
      ctx.shadowColor = '#00ffcc';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 3;
      ctx.strokeRect(
        -this.width / 2 * camera.zoom,
        -this.height / 2 * camera.zoom,
        this.width * camera.zoom,
        this.height * camera.zoom
      );
    }

    // 1. Bubble Shield Visual
    if (this.bubbleReflectCount > 0) {
      const bubbleR = (this.radius + 18) * camera.zoom;
      ctx.fillStyle = 'rgba(0, 229, 255, 0.22)';
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2 * camera.zoom;
      ctx.beginPath();
      ctx.arc(0, 0, bubbleR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 2. Energy Shield Visual
    if (this.hasShield && this.shieldHealth > 0) {
      const shieldR = (this.radius + 14) * camera.zoom;
      ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2.5 * camera.zoom;
      ctx.beginPath();
      ctx.arc(0, 0, shieldR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 3. Attack Boost Aura
    if (this.hasAttackBoost) {
      const auraR = (this.radius + 10) * camera.zoom;
      const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, auraR);
      grad.addColorStop(0, 'rgba(255, 68, 0, 0.4)');
      grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, auraR, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Character Sprite Rendering
    let spriteName = this.recoilTimer > 0 ? `${this.getPrefix()}_recoil0010` : `${this.getPrefix()}00${String(this.animFrame).padStart(2, '0')}`;
    if (!window.atlasManager.getSpriteData(this.characterKey, spriteName)) {
      spriteName = `${this.getPrefix()}0001`;
    }
    const drawn = window.atlasManager.drawSprite(
      ctx,
      this.characterKey,
      spriteName,
      0, 0,
      this.width * 1.5 * camera.zoom,
      this.height * 1.2 * camera.zoom,
      !this.facingRight
    );

    if (!drawn) {
      // Fallback stylized character capsule
      ctx.fillStyle = this.isBot ? '#4f46e5' : '#00e5ff';
      ctx.fillRect(
        -this.width / 2 * camera.zoom,
        -this.height / 2 * camera.zoom,
        this.width * camera.zoom,
        this.height * camera.zoom
      );
    }

    // 5. High-Tech Slugterra Blaster Gun & Slinger Arm
    ctx.save();
    ctx.rotate(this.aimAngle);
    if (!this.facingRight) {
      ctx.scale(1, -1); // Keep blaster grip and top facing correctly
    }

    const recoilOffset = (this.recoilTimer > 0) ? -(this.recoilTimer / 0.15) * 4 * camera.zoom : 0;
    ctx.translate(recoilOffset, 0);

    const activeSlug = this.getActiveSlug();
    const slugDef = (activeSlug && window.SLUG_DEFINITIONS) ? (activeSlug.def || window.SLUG_DEFINITIONS[activeSlug.type]) : null;
    const slugColor = (activeSlug && activeSlug.ammo > 0 && slugDef && slugDef.color) ? slugDef.color : '#00e5ff';
    const z = camera.zoom;

    // A. Blaster Titanium Frame & Receiver
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = Math.max(1, 1.2 * z);
    ctx.beginPath();
    ctx.moveTo(0, -4 * z);
    ctx.lineTo(16 * z, -4 * z);
    ctx.lineTo(20 * z, -2.5 * z);
    ctx.lineTo(28 * z, -2.5 * z);
    ctx.lineTo(28 * z, 2 * z);
    ctx.lineTo(18 * z, 2.5 * z);
    ctx.lineTo(7 * z, 7 * z);   // Angled handle grip
    ctx.lineTo(2 * z, 8 * z);
    ctx.lineTo(0, 3 * z);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // B. Cylindrical Slug Chamber (Glows with active slug's elemental power)
    ctx.fillStyle = slugColor;
    ctx.shadowColor = slugColor;
    ctx.shadowBlur = 6 * z;
    ctx.beginPath();
    ctx.rect(7 * z, -3 * z, 10 * z, 5 * z);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Chamber glass shine highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(8 * z, -2 * z, 8 * z, 1.2 * z);

    // C. Muzzle Accelerator Ring & Barrel Rib
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = slugColor;
    ctx.lineWidth = 1.2 * z;
    ctx.strokeRect(26 * z, -3.5 * z, 3 * z, 6 * z);

    // D. Slinger Glove Hand Holding Grip
    ctx.fillStyle = isLocalPlayer ? '#f97316' : '#64748b';
    ctx.beginPath();
    ctx.arc(5 * z, 4.5 * z, 3.5 * z, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 6. Frost Block Overlay (Ice Slug)
    if (this.stunTimer > 0 && this.stunType === 'frost') {
      ctx.fillStyle = 'rgba(180, 240, 255, 0.55)';
      ctx.strokeStyle = '#b3f0ff';
      ctx.lineWidth = 3;
      const bw = (this.width + 16) * camera.zoom;
      const bh = (this.height + 16) * camera.zoom;
      ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
      ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
    }

    // 7. Overhead Name & Health Bar (For all players)
    const nameY = -this.height / 2 * camera.zoom - 18 * camera.zoom;
    ctx.fillStyle = isLocalPlayer ? '#00e5ff' : '#ffffff';
    ctx.font = `bold ${11 * camera.zoom}px Orbitron, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(this.name, 0, nameY);

    // Mini Health Bar
    const barW = 44 * camera.zoom;
    const barH = 5 * camera.zoom;
    const barY = nameY + 6 * camera.zoom;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(-barW / 2, barY, barW, barH);
    ctx.fillStyle = '#00ff66';
    ctx.fillRect(-barW / 2, barY, barW * (this.health / this.maxHealth), barH);

    ctx.restore();
  }

  getPrefix() {
    switch (this.characterKey) {
      case 'player': return 'eli';
      case 'trixie': return 'trixie';
      case 'kord': return 'kord';
      case 'pronto': return 'pronto';
      case 'drake': return 'drake';
      case 'mario': return 'mario';
      case 'nacho': return 'nacho';
      case 'darkPerip': return 'shadowleader';
      default: return 'eli';
    }
  }
}

window.Player = Player;
