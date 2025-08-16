import { GameState, Vector2 } from '../types/GameTypes';
import { Player } from './Player';
import { Enemy } from './Enemy';
import AudioManager from './AudioManager';
import SpriteManager from './SpriteManager';
import InputManager from './InputManager';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameState: GameState;
  private player: Player | null = null;
  private enemies: Enemy[] = [];
  private lastTime = 0;
  private assetsLoaded = false;
  private backgroundOffset = 0;
  private levelWidth = 2048;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    this.gameState = {
      currentLevel: 1,
      score: 0,
      lives: 3,
      gameStatus: 'menu',
      selectedCharacter: null,
      camera: { x: 0, y: 0 },
      levelProgress: 0,
      enemiesDefeated: 0,
      combo: 0,
      comboTimer: 0
    };
    
    this.setupCanvas();
    this.loadAssets();
  }

  private setupCanvas(): void {
    this.canvas.width = 1024;
    this.canvas.height = 768;
    this.ctx.imageSmoothingEnabled = false; // Pixel perfect rendering
  }

  private async loadAssets(): Promise<void> {
    try {
      await Promise.all([
        SpriteManager.loadSprites(),
        AudioManager.loadAudio()
      ]);
      this.assetsLoaded = true;
    } catch (error) {
      console.error('Failed to load assets:', error);
    }
  }

  start(): void {
    this.gameLoop(0);
  }

  private gameLoop = (currentTime: number): void => {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number): void {
    if (!this.assetsLoaded) return;

    switch (this.gameState.gameStatus) {
      case 'menu':
        this.updateMenu();
        break;
      case 'playing':
        this.updateGameplay(deltaTime);
        break;
      case 'gameOver':
        this.updateGameOver();
        break;
    }
  }

  private updateMenu(): void {
    // Character selection
    if (InputManager.isKeyPressed('Digit1')) {
      this.selectCharacter('blaze');
    } else if (InputManager.isKeyPressed('Digit2')) {
      this.selectCharacter('axel');
    }

    if (InputManager.isPunching() && this.gameState.selectedCharacter) {
      this.startGame();
    }
  }

  private updateGameplay(deltaTime: number): void {
    if (!this.player) return;

    // Update player
    this.player.update(deltaTime);

    // Update enemies
    this.enemies.forEach(enemy => {
      enemy.update(deltaTime, this.player!);
    });

    // Check collisions
    this.checkCollisions();

    // Update camera
    this.updateCamera();

    // Update combo timer
    if (this.gameState.comboTimer > 0) {
      this.gameState.comboTimer -= deltaTime;
      if (this.gameState.comboTimer <= 0) {
        this.gameState.combo = 0;
      }
    }

    // Spawn enemies
    this.spawnEnemies();

    // Check level completion
    this.checkLevelCompletion();

    // Remove dead enemies
    this.enemies = this.enemies.filter(enemy => enemy.state !== 'dead');
  }

  private updateGameOver(): void {
    if (InputManager.isPunching()) {
      this.resetGame();
    }
  }

  private checkCollisions(): void {
    if (!this.player) return;

    // Player attacks vs enemies
    if (this.player.attackBox && this.player.isAttacking) {
      this.enemies.forEach(enemy => {
        if (this.isColliding(this.player!.attackBox!, enemy.hitbox)) {
          const defeated = enemy.takeDamage(20);
          if (defeated) {
            this.gameState.score += enemy.type === 'boss' ? 500 : enemy.type === 'bruiser' ? 200 : 100;
            this.gameState.enemiesDefeated++;
            this.gameState.combo = this.player!.getComboCount();
            this.gameState.comboTimer = 2000;
          }
        }
      });
    }

    // Enemy attacks vs player
    this.enemies.forEach(enemy => {
      if (enemy.attackBox && enemy.isAttacking) {
        if (this.isColliding(enemy.attackBox, this.player!.hitbox)) {
          this.player!.takeDamage(enemy.getAttackDamage());
          if (this.player!.health <= 0) {
            this.gameState.lives--;
            if (this.gameState.lives <= 0) {
              this.gameState.gameStatus = 'gameOver';
            } else {
              this.respawnPlayer();
            }
          }
        }
      }
    });
  }

  private isColliding(rect1: { x: number; y: number; width: number; height: number }, 
                     rect2: { x: number; y: number; width: number; height: number }): boolean {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  private updateCamera(): void {
    if (!this.player) return;

    const targetX = this.player.position.x - this.canvas.width / 2;
    this.gameState.camera.x = Math.max(0, Math.min(this.levelWidth - this.canvas.width, targetX));
    
    // Update level progress
    this.gameState.levelProgress = this.gameState.camera.x / (this.levelWidth - this.canvas.width);
  }

  private spawnEnemies(): void {
    if (this.enemies.length < 3 && Math.random() < 0.01) {
      const spawnX = this.gameState.camera.x + this.canvas.width + 50;
      const spawnY = 200 + Math.random() * 200;
      const enemyType = Math.random() > 0.7 ? 'bruiser' : 'punk';
      
      this.enemies.push(new Enemy(enemyType, spawnX, spawnY));
    }
  }

  private checkLevelCompletion(): void {
    if (this.gameState.enemiesDefeated >= 20) {
      this.gameState.gameStatus = 'levelComplete';
      AudioManager.stopMusic();
    }
  }

  private selectCharacter(character: 'blaze' | 'axel'): void {
    this.gameState.selectedCharacter = character;
  }

  private startGame(): void {
    this.gameState.gameStatus = 'playing';
    this.player = new Player(this.gameState.selectedCharacter!, 100, 300);
    this.enemies = [];
    
    // Spawn initial enemies
    for (let i = 0; i < 3; i++) {
      const enemy = new Enemy('punk', 300 + i * 150, 250 + Math.random() * 100);
      this.enemies.push(enemy);
    }
    
    AudioManager.playMusic('music_level1');
  }

  private respawnPlayer(): void {
    if (this.player) {
      this.player.health = this.player.maxHealth;
      this.player.position.x = 100;
      this.player.position.y = 300;
      this.player.state = 'idle';
    }
  }

  private resetGame(): void {
    this.gameState = {
      currentLevel: 1,
      score: 0,
      lives: 3,
      gameStatus: 'menu',
      selectedCharacter: null,
      camera: { x: 0, y: 0 },
      levelProgress: 0,
      enemiesDefeated: 0,
      combo: 0,
      comboTimer: 0
    };
    this.player = null;
    this.enemies = [];
    AudioManager.stopMusic();
  }

  private render(): void {
    if (!this.assetsLoaded) {
      this.renderLoadingScreen();
      return;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    switch (this.gameState.gameStatus) {
      case 'menu':
        this.renderMenu();
        break;
      case 'playing':
        this.renderGameplay();
        break;
      case 'gameOver':
        this.renderGameOver();
        break;
      case 'levelComplete':
        this.renderLevelComplete();
        break;
    }
  }

  private renderLoadingScreen(): void {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Loading...', this.canvas.width / 2, this.canvas.height / 2);
  }

  private renderMenu(): void {
    // Background
    this.ctx.fillStyle = 'linear-gradient(45deg, #1a1a2e, #16213e)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Title
    this.ctx.fillStyle = '#ff6b35';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('STREETS OF RAGE', this.canvas.width / 2, 150);

    // Character selection
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '24px Arial';
    this.ctx.fillText('Select Character:', this.canvas.width / 2, 250);

    // Character options
    this.ctx.font = '20px Arial';
    this.ctx.fillStyle = this.gameState.selectedCharacter === 'blaze' ? '#ff6b35' : '#fff';
    this.ctx.fillText('1 - Blaze Fielding', this.canvas.width / 2 - 100, 320);
    
    this.ctx.fillStyle = this.gameState.selectedCharacter === 'axel' ? '#ff6b35' : '#fff';
    this.ctx.fillText('2 - Axel Stone', this.canvas.width / 2 + 100, 320);

    // Instructions
    if (this.gameState.selectedCharacter) {
      this.ctx.fillStyle = '#ffeb3b';
      this.ctx.font = '18px Arial';
      this.ctx.fillText('Press SPACE to Start!', this.canvas.width / 2, 450);
    }

    // Controls
    this.ctx.fillStyle = '#bbb';
    this.ctx.font = '14px Arial';
    this.ctx.fillText('Arrow Keys: Move | Space: Punch | X: Special', this.canvas.width / 2, 520);
  }

  private renderGameplay(): void {
    // Draw background
    this.renderBackground();

    // Draw game objects
    this.ctx.save();
    this.ctx.translate(-this.gameState.camera.x, 0);

    // Draw enemies
    this.enemies.forEach(enemy => {
      this.renderCharacter(enemy);
    });

    // Draw player
    if (this.player) {
      this.renderCharacter(this.player);
    }

    this.ctx.restore();

    // Draw UI
    this.renderUI();
  }

  private renderBackground(): void {
    const bg = SpriteManager.getSprite('background2');
    if (bg) {
      const bgWidth = bg.width;
      const scrollX = this.gameState.camera.x * 0.5; // Parallax effect
      
      for (let i = -1; i <= Math.ceil(this.canvas.width / bgWidth) + 1; i++) {
        this.ctx.drawImage(bg, i * bgWidth - (scrollX % bgWidth), 0, bgWidth, this.canvas.height);
      }
    }
  }

  private renderCharacter(character: Player | Enemy): void {
    const spriteSheet = character instanceof Player 
      ? SpriteManager.getSprite(character.getCharacterType())
      : SpriteManager.getSprite('axel'); // Use Axel sprites for enemies for now

    if (!spriteSheet) return;

    // Different frame sizes for different characters
    let frameWidth = 64;
    let frameHeight = 64;
    let framesPerRow = 8;
    
    if (character instanceof Player && character.getCharacterType() === 'axel') {
      frameWidth = 48;
      frameHeight = 80;
      framesPerRow = 10;
    } else if (character instanceof Player && character.getCharacterType() === 'blaze') {
      frameWidth = 48;
      frameHeight = 64;
      framesPerRow = 8;
    }
    
    const frame = character.animation.frames[character.animation.currentFrame] || 0;
    
    const sx = (frame % framesPerRow) * frameWidth;
    const sy = Math.floor(frame / framesPerRow) * frameHeight;

    const alpha = character.invulnerable ? Math.sin(Date.now() * 0.02) * 0.5 + 0.5 : 1;
    this.ctx.globalAlpha = alpha;

    SpriteManager.drawSprite(
      this.ctx,
      character instanceof Player ? character.getCharacterType() : 'axel',
      sx, sy, frameWidth, frameHeight,
      character.position.x - frameWidth / 2,
      character.position.y - frameHeight / 2,
      frameWidth, frameHeight,
      character.facing === 'left'
    );

    this.ctx.globalAlpha = 1;

    // Draw health bar for enemies
    if (character instanceof Enemy && character.health < character.maxHealth) {
      this.renderHealthBar(character.position.x, character.position.y - 40, character.health, character.maxHealth, 40);
    }
  }

  private renderHealthBar(x: number, y: number, health: number, maxHealth: number, width: number): void {
    const height = 6;
    const healthPercent = health / maxHealth;

    // Background
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(x - width / 2, y, width, height);

    // Health
    this.ctx.fillStyle = healthPercent > 0.3 ? '#4caf50' : '#f44336';
    this.ctx.fillRect(x - width / 2, y, width * healthPercent, height);
  }

  private renderUI(): void {
    // Player health bar
    if (this.player) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(20, 20, 200, 30);
      
      this.ctx.fillStyle = '#f44336';
      const healthPercent = this.player.health / this.player.maxHealth;
      this.ctx.fillRect(25, 25, 190 * healthPercent, 20);
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '16px Arial';
      this.ctx.fillText(`Health: ${this.player.health}/${this.player.maxHealth}`, 30, 40);
    }

    // Score
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 80);
    
    // Lives
    this.ctx.fillText(`Lives: ${this.gameState.lives}`, 20, 110);

    // Combo
    if (this.gameState.combo > 1) {
      this.ctx.fillStyle = '#ffeb3b';
      this.ctx.font = 'bold 24px Arial';
      this.ctx.fillText(`${this.gameState.combo}x COMBO!`, 20, 140);
    }

    // Level progress
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(this.canvas.width - 220, 20, 200, 20);
    this.ctx.fillStyle = '#4caf50';
    this.ctx.fillRect(this.canvas.width - 215, 25, 190 * this.gameState.levelProgress, 10);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.fillText('Progress', this.canvas.width - 25, 35);

    // Enemies defeated
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Enemies: ${this.gameState.enemiesDefeated}/20`, 20, this.canvas.height - 20);
  }

  private renderGameOver(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#f44336';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, 250);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`Final Score: ${this.gameState.score}`, this.canvas.width / 2, 320);

    this.ctx.fillStyle = '#ffeb3b';
    this.ctx.font = '18px Arial';
    this.ctx.fillText('Press SPACE to Restart', this.canvas.width / 2, 400);
  }

  private renderLevelComplete(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#4caf50';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('LEVEL COMPLETE!', this.canvas.width / 2, 250);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`Score: ${this.gameState.score}`, this.canvas.width / 2, 320);
    this.ctx.fillText(`Enemies Defeated: ${this.gameState.enemiesDefeated}`, this.canvas.width / 2, 350);
  }
}