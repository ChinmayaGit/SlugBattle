// js/bot.js - Intelligent AI Bot Controller for 8-Player Cavern Battles

class BotController {
  constructor(player) {
    this.player = player;
    this.state = 'SCAVENGE'; // 'SCAVENGE', 'COMBAT', 'PATROL'
    this.target = null;
    this.decisionTimer = 0;
    this.input = {
      left: false,
      right: false,
      thrust: false,
      up: false,
      aimAngle: 0
    };
    this.preferredSlugSlot = 0;
    this.jumpTimer = 0;
  }

  update(dt, allPlayers, fallingDrops, upgradeCrates, projectilesList, particleManager) {
    if (!this.player.isAlive) return;

    this.decisionTimer -= dt;
    this.jumpTimer -= dt;

    if (this.decisionTimer <= 0) {
      this.decisionTimer = 0.25 + Math.random() * 0.2;
      this.makeDecision(allPlayers, fallingDrops, upgradeCrates);
    }

    // Execute state behavior
    this.executeBehavior(dt, fallingDrops, upgradeCrates, projectilesList, particleManager);

    // Feed input into player entity
    this.player.update(dt, window.gameInstance.mapManager, particleManager, this.input);

    // Check pickups
    this.player.checkDropPickup(fallingDrops, (drop) => {
      // Bot swap decision: Swap active slot if drop is different
      const active = this.player.getActiveSlug();
      if (!active || active.type !== drop.type) {
        this.player.swapSlug(this.player.activeSlotIndex, drop, fallingDrops);
      }
    });

    this.player.checkUpgradePickup(upgradeCrates);
  }

  makeDecision(allPlayers, fallingDrops, upgradeCrates) {
    const hasSlugs = this.player.slugSlots.some(s => s !== null && s.ammo > 0);

    // 1. If unarmed (no slugs), priority is scavenging a slug drop!
    if (!hasSlugs && fallingDrops.length > 0) {
      this.state = 'SCAVENGE';
      this.target = this.findNearest(fallingDrops);
      return;
    }

    // 2. If upgrade crate nearby and grounded, maybe grab it
    if (upgradeCrates.length > 0 && Math.random() < 0.35) {
      const nearestCrate = this.findNearest(upgradeCrates);
      if (nearestCrate && Math.hypot(this.player.x - nearestCrate.x, this.player.y - nearestCrate.y) < 700) {
        this.state = 'SCAVENGE_UPGRADE';
        this.target = nearestCrate;
        return;
      }
    }

    // 3. Combat: Find nearest enemy player
    const enemies = allPlayers.filter(p => p !== this.player && p.isAlive);
    if (enemies.length > 0) {
      this.target = this.findNearest(enemies);
      this.state = 'COMBAT';
    } else {
      this.state = 'PATROL';
    }
  }

  findNearest(list) {
    let nearest = null;
    let minDist = Infinity;
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const dist = Math.hypot(this.player.x - item.x, this.player.y - item.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = item;
      }
    }
    return nearest;
  }

  executeBehavior(dt, fallingDrops, upgradeCrates, projectilesList, particleManager) {
    this.input.left = false;
    this.input.right = false;
    this.input.thrust = false;

    if (!this.target) return;

    const dx = this.target.x - this.player.x;
    const dy = this.target.y - this.player.y;
    const dist = Math.hypot(dx, dy);

    // Aim calculation
    this.input.aimAngle = Math.atan2(dy, dx);

    switch (this.state) {
      case 'SCAVENGE':
      case 'SCAVENGE_UPGRADE':
        // Move towards item
        if (dx > 30) this.input.right = true;
        else if (dx < -30) this.input.left = true;

        // Jetpack if target is higher up
        if (dy < -40 || (this.player.isGrounded && Math.abs(dx) > 100 && this.jumpTimer <= 0)) {
          this.input.thrust = true;
          this.jumpTimer = 0.8;
        }
        break;

      case 'COMBAT':
        // Tactical distance keeping (maintain 250 - 450 range)
        if (dist > 450) {
          if (dx > 0) this.input.right = true;
          else this.input.left = true;
        } else if (dist < 220) {
          if (dx > 0) this.input.left = true;
          else this.input.right = true;
        }

        // Jump / Jetpack to dodge or reposition
        if (dy < -60 || (Math.random() < 0.05 && this.player.boost > 30)) {
          this.input.thrust = true;
        }

        // Fire Weapon if slug available
        if (dist < 750 && this.player.canFire()) {
          // Switch to a slot with ammo if active slot empty
          if (!this.player.getActiveSlug()) {
            const nextIdx = this.player.slugSlots.findIndex(s => s !== null && s.ammo > 0);
            if (nextIdx !== -1) {
              this.player.activeSlotIndex = nextIdx;
            }
          }

          if (this.player.getActiveSlug()) {
            this.player.fire(projectilesList, particleManager);
          }
        }
        break;

      case 'PATROL':
        // Roam around
        if (Math.random() < 0.02) {
          this.input.right = Math.random() > 0.5;
          this.input.left = !this.input.right;
        }
        break;
    }
  }
}

window.BotController = BotController;

