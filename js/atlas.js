// js/atlas.js - TextureAtlas and Sprite Manager

class AtlasManager {
  constructor() {
    this.cacheData = null;
    this.images = {};
    this.isLoaded = false;
    this.loadProgress = 0;
  }

  async init(onProgress) {
    try {
      const resp = await fetch('assets/spritesheets/atlas_cache.json');
      this.cacheData = await resp.json();

      const requiredAtlases = [
        'player', 'pronto', 'trixie', 'kord', 'drake', 'mario', 'nacho', 'darkPerip',
        'infernus', 'frostcrawler', 'tazerling', 'bludgeon', 'grenuke', 'bubble',
        'vinedrill', 'heatseeker', 'porkyspline', 'wildspores', 'darkspores', 'enigmo',
        'hypnogrif', 'yang', 'common', 'consumables', 'effects'
      ];

      let loadedCount = 0;
      const totalCount = requiredAtlases.length;

      const loadPromises = requiredAtlases.map(name => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = `assets/spritesheets/${name}.png`;
          img.onload = () => {
            this.images[name] = img;
            loadedCount++;
            if (onProgress) onProgress(loadedCount / totalCount);
            resolve();
          };
          img.onerror = () => {
            console.warn(`Failed to load spritesheet image: assets/spritesheets/${name}.png`);
            loadedCount++;
            if (onProgress) onProgress(loadedCount / totalCount);
            resolve();
          };
        });
      });

      await Promise.all(loadPromises);
      this.isLoaded = true;
      return true;
    } catch (e) {
      console.error('Error initializing AtlasManager:', e);
      return false;
    }
  }

  getSpriteData(atlasName, spriteName) {
    if (!this.cacheData || !this.cacheData[atlasName]) return null;
    const sprites = this.cacheData[atlasName].sprites;
    return sprites[spriteName] || null;
  }

  drawSprite(ctx, atlasName, spriteName, x, y, width, height, flipX = false, rotation = 0, opacity = 1.0) {
    const img = this.images[atlasName];
    if (!img) return false;

    const s = this.getSpriteData(atlasName, spriteName);
    if (!s) return false;

    ctx.save();
    if (opacity < 1.0) ctx.globalAlpha = opacity;

    ctx.translate(x, y);
    if (rotation !== 0) ctx.rotate(rotation);
    if (flipX) ctx.scale(-1, 1);

    const destW = width || s.w;
    const destH = height || s.h;
    const destX = -destW / 2;
    const destY = -destH / 2;

    ctx.drawImage(
      img,
      s.x, s.y, s.w, s.h,
      destX, destY, destW, destH
    );

    ctx.restore();
    return true;
  }

  createIconCanvas(atlasName, spriteName, targetSize = 44) {
    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');

    const s = this.getSpriteData(atlasName, spriteName);
    const img = this.images[atlasName];
    if (s && img) {
      const scale = Math.min((targetSize - 4) / s.w, (targetSize - 4) / s.h);
      const dw = s.w * scale;
      const dh = s.h * scale;
      const dx = (targetSize - dw) / 2;
      const dy = (targetSize - dh) / 2;

      ctx.drawImage(img, s.x, s.y, s.w, s.h, dx, dy, dw, dh);
    } else {
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.arc(targetSize / 2, targetSize / 2, targetSize / 3, 0, Math.PI * 2);
      ctx.fill();
    }
    return canvas;
  }
}

window.atlasManager = new AtlasManager();

