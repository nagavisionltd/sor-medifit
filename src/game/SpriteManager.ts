import { SpriteAssets } from '../types/GameTypes';

class SpriteManager {
  private assets: Partial<SpriteAssets> = {};

  async loadSprites(): Promise<SpriteAssets> {
    const spriteUrls = {
      blaze: 'https://play.rosebud.ai/assets/blaze_sprites.png?l8YY',
      axel: 'https://play.rosebud.ai/assets/axel_transparent.png?BYNY',
      background1: 'https://play.rosebud.ai/assets/background_stage1.png?QbEp',
      background2: 'https://play.rosebud.ai/assets/background_warehouse_exterior.png?LDPN',
      background3: 'https://play.rosebud.ai/assets/backgorund_sunset_area.png?XhpB'
    };

    const loadPromises = Object.entries(spriteUrls).map(([key, url]) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          this.assets[key as keyof SpriteAssets] = img;
          resolve();
        };
        img.onerror = reject;
        img.src = url;
      });
    });

    await Promise.all(loadPromises);
    return this.assets as SpriteAssets;
  }

  getSprite(name: keyof SpriteAssets): HTMLImageElement | null {
    return this.assets[name] || null;
  }

  drawSprite(
    ctx: CanvasRenderingContext2D,
    spriteName: keyof SpriteAssets,
    sx: number, sy: number, sw: number, sh: number,
    dx: number, dy: number, dw: number, dh: number,
    flipX: boolean = false
  ): void {
    const sprite = this.getSprite(spriteName);
    if (!sprite) return;

    ctx.save();
    
    if (flipX) {
      ctx.scale(-1, 1);
      dx = -dx - dw;
    }

    ctx.drawImage(sprite, sx, sy, sw, sh, dx, dy, dw, dh);
    ctx.restore();
  }
}

export default new SpriteManager();