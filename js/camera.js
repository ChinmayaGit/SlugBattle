// js/camera.js - 2.5D Dynamic Camera with Depth Perspective & Scope Zoom

class Camera25D {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;

    this.focalDistance = 800; // 3D perspective focal depth
    this.zoom = 1.0;
    this.targetZoom = 1.0;
    this.minZoom = 0.55;
    this.maxZoom = 1.6;

    this.shakeTrauma = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;

    this.lookAheadDistance = 140;
    this.lookAheadX = 0;
    this.lookAheadY = 0;
  }

  update(dt, targetPlayer, mouseWorldPos) {
    if (!targetPlayer) return;

    // Smooth aim look-ahead offset
    if (mouseWorldPos) {
      const dx = mouseWorldPos.x - targetPlayer.x;
      const dy = mouseWorldPos.y - targetPlayer.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 10) {
        const factor = Math.min(1.0, dist / 400);
        this.lookAheadX = (dx / dist) * this.lookAheadDistance * factor;
        this.lookAheadY = (dy / dist) * this.lookAheadDistance * factor;
      }
    } else {
      this.lookAheadX = 0;
      this.lookAheadY = 0;
    }

    this.targetX = targetPlayer.x + this.lookAheadX;
    this.targetY = targetPlayer.y + this.lookAheadY;

    // Smooth spring lerp
    const lerpSpeed = 7.0 * dt;
    this.x += (this.targetX - this.x) * Math.min(1.0, lerpSpeed);
    this.y += (this.targetY - this.y) * Math.min(1.0, lerpSpeed);

    // Zoom lerp
    const zoomSpeed = 4.0 * dt;
    this.zoom += (this.targetZoom - this.zoom) * Math.min(1.0, zoomSpeed);

    // Screen shake decay
    if (this.shakeTrauma > 0) {
      this.shakeTrauma = Math.max(0, this.shakeTrauma - dt * 2.2);
      const shakeAmount = Math.pow(this.shakeTrauma, 2) * 22;
      this.shakeOffsetX = (Math.random() * 2 - 1) * shakeAmount;
      this.shakeOffsetY = (Math.random() * 2 - 1) * shakeAmount;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  addShake(trauma = 0.5) {
    this.shakeTrauma = Math.min(1.0, this.shakeTrauma + trauma);
  }

  setZoom(zoomLevel) {
    this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoomLevel));
  }

  cycleZoomScope() {
    // Cycles between normal, wide tactical, and sniper scope
    if (Math.abs(this.targetZoom - 1.0) < 0.1) {
      this.setZoom(1.4); // Zoom in
    } else if (this.targetZoom > 1.1) {
      this.setZoom(0.7); // Zoom out
    } else {
      this.setZoom(1.0); // Reset normal
    }
    return this.targetZoom;
  }

  // 2.5D Perspective Projection: Transforms (worldX, worldY, depthZ) to screen coordinates
  toScreen(worldX, worldY, depthZ = 0) {
    const depthFactor = this.focalDistance / (this.focalDistance + depthZ);
    const effectiveZoom = this.zoom * depthFactor;

    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;

    const screenX = (worldX - (this.x + this.shakeOffsetX)) * effectiveZoom + cx;
    const screenY = (worldY - (this.y + this.shakeOffsetY)) * effectiveZoom + cy;

    return {
      x: screenX,
      y: screenY,
      scale: effectiveZoom,
      depthFactor: depthFactor
    };
  }

  // Converts screen (pixel) coordinates to gameplay plane (Z = 0) world coordinates
  toWorld(screenX, screenY) {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;

    const worldX = (screenX - cx) / this.zoom + (this.x + this.shakeOffsetX);
    const worldY = (screenY - cy) / this.zoom + (this.y + this.shakeOffsetY);

    return { x: worldX, y: worldY };
  }

  // Gets visible world bounding box at gameplay plane (Z = 0)
  getViewportBounds(padding = 100) {
    const topLeft = this.toWorld(-padding, -padding);
    const bottomRight = this.toWorld(this.canvas.width + padding, this.canvas.height + padding);

    return {
      left: Math.min(topLeft.x, bottomRight.x),
      right: Math.max(topLeft.x, bottomRight.x),
      top: Math.min(topLeft.y, bottomRight.y),
      bottom: Math.max(topLeft.y, bottomRight.y)
    };
  }
}

window.Camera25D = Camera25D;

