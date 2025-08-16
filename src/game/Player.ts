import { Character, Vector2, Animation, Rectangle } from '../types/GameTypes';
import InputManager from './InputManager';
import AudioManager from './AudioManager';

export class Player implements Character {
  id = 'player';
  name: string;
  position: Vector2;
  velocity: Vector2;
  health: number;
  maxHealth = 100;
  facing: 'left' | 'right' = 'right';
  state: Character['state'] = 'idle';
  animation: Animation;
  hitbox: Rectangle;
  attackBox?: Rectangle;
  isAttacking = false;
  attackCooldown = 0;
  invulnerable = false;
  invulnerabilityTime = 0;
  
  private characterType: 'blaze' | 'axel';
  private speed = 3;
  private comboCount = 0;
  private comboTimer = 0;
  private specialEnergy = 100;

  constructor(characterType: 'blaze' | 'axel', startX: number, startY: number) {
    this.characterType = characterType;
    this.name = characterType === 'blaze' ? 'Blaze' : 'Axel';
    this.position = { x: startX, y: startY };
    this.velocity = { x: 0, y: 0 };
    this.health = this.maxHealth;
    
    // Adjust hitbox based on character
    if (characterType === 'axel') {
      this.hitbox = { x: 0, y: 0, width: 40, height: 70 };
    } else {
      this.hitbox = { x: 0, y: 0, width: 40, height: 60 };
    }
    
    this.animation = {
      frames: [0],
      currentFrame: 0,
      frameTime: 0,
      maxFrameTime: 200,
      loop: true,
      finished: false
    };
  }

  update(deltaTime: number): void {
    this.handleInput();
    this.updateMovement(deltaTime);
    this.updateAnimation(deltaTime);
    this.updateTimers(deltaTime);
    this.updateHitbox();
  }

  private handleInput(): void {
    if (this.state === 'hit' || this.state === 'dying') return;

    let moving = false;
    this.velocity.x = 0;
    this.velocity.y = 0;

    // Movement
    if (InputManager.isMovingLeft()) {
      this.velocity.x = -this.speed;
      this.facing = 'left';
      moving = true;
    }
    if (InputManager.isMovingRight()) {
      this.velocity.x = this.speed;
      this.facing = 'right';
      moving = true;
    }
    if (InputManager.isMovingUp()) {
      this.velocity.y = -this.speed * 0.7;
      moving = true;
    }
    if (InputManager.isMovingDown()) {
      this.velocity.y = this.speed * 0.7;
      moving = true;
    }

    // Attack
    if (InputManager.isPunching() && this.attackCooldown <= 0 && !this.isAttacking) {
      this.startAttack();
    }

    // Special attack
    if (InputManager.isSpecialAttack() && this.specialEnergy >= 20 && this.attackCooldown <= 0) {
      this.startSpecialAttack();
    }

    // Set state based on movement
    if (this.state !== 'punching' && this.state !== 'hit') {
      this.state = moving ? 'walking' : 'idle';
    }
  }

  private updateMovement(deltaTime: number): void {
    this.position.x += this.velocity.x * deltaTime / 16;
    this.position.y += this.velocity.y * deltaTime / 16;

    // Constrain to screen bounds
    this.position.x = Math.max(0, Math.min(2000, this.position.x));
    this.position.y = Math.max(200, Math.min(400, this.position.y));
  }

  private updateAnimation(deltaTime: number): void {
    this.animation.frameTime += deltaTime;

    if (this.animation.frameTime >= this.animation.maxFrameTime) {
      this.animation.frameTime = 0;
      
      if (this.animation.currentFrame < this.animation.frames.length - 1) {
        this.animation.currentFrame++;
      } else if (this.animation.loop) {
        this.animation.currentFrame = 0;
      } else {
        this.animation.finished = true;
        if (this.state === 'punching') {
          this.state = 'idle';
          this.isAttacking = false;
          this.attackBox = undefined;
        }
      }
    }

    this.setAnimationFrames();
  }

  private setAnimationFrames(): void {
    // Different frame mappings for different characters
    const isAxel = this.characterType === 'axel';
    
    switch (this.state) {
      case 'idle':
        this.animation.frames = isAxel ? [0, 1, 2] : [0, 1];
        this.animation.maxFrameTime = 500;
        this.animation.loop = true;
        break;
      case 'walking':
        this.animation.frames = isAxel ? [10, 11, 12, 13, 14, 15] : [2, 3, 4, 5];
        this.animation.maxFrameTime = 150;
        this.animation.loop = true;
        break;
      case 'punching':
        this.animation.frames = isAxel ? [20, 21, 22] : [6, 7, 8];
        this.animation.maxFrameTime = 100;
        this.animation.loop = false;
        break;
      case 'hit':
        this.animation.frames = isAxel ? [30] : [9];
        this.animation.maxFrameTime = 300;
        this.animation.loop = false;
        break;
    }
  }

  private updateTimers(deltaTime: number): void {
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }
    if (this.invulnerabilityTime > 0) {
      this.invulnerabilityTime -= deltaTime;
      if (this.invulnerabilityTime <= 0) {
        this.invulnerable = false;
      }
    }
    if (this.comboTimer > 0) {
      this.comboTimer -= deltaTime;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    }
  }

  private updateHitbox(): void {
    this.hitbox.x = this.position.x - this.hitbox.width / 2;
    this.hitbox.y = this.position.y - this.hitbox.height / 2;
  }

  private startAttack(): void {
    this.state = 'punching';
    this.isAttacking = true;
    this.attackCooldown = 300;
    this.comboCount++;
    this.comboTimer = 1000;
    
    this.animation.currentFrame = 0;
    this.animation.finished = false;
    
    // Create attack hitbox
    const attackRange = 60;
    this.attackBox = {
      x: this.facing === 'right' 
        ? this.position.x 
        : this.position.x - attackRange,
      y: this.position.y - 30,
      width: attackRange,
      height: 60
    };

    AudioManager.playSound('sfx_punch');
  }

  private startSpecialAttack(): void {
    this.specialEnergy -= 20;
    this.startAttack();
    AudioManager.playSound('sfx_special');
  }

  takeDamage(damage: number): void {
    if (this.invulnerable) return;

    this.health -= damage;
    this.state = 'hit';
    this.invulnerable = true;
    this.invulnerabilityTime = 1000;
    this.comboCount = 0;
    
    this.animation.currentFrame = 0;
    this.animation.finished = false;

    AudioManager.playSound('sfx_hit');

    if (this.health <= 0) {
      this.state = 'dying';
    }

    // Knockback
    const knockbackForce = 2;
    this.velocity.x = this.facing === 'right' ? -knockbackForce : knockbackForce;
  }

  getComboCount(): number {
    return this.comboCount;
  }

  getSpecialEnergy(): number {
    return this.specialEnergy;
  }

  getCharacterType(): 'blaze' | 'axel' {
    return this.characterType;
  }
}