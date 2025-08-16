import { Enemy as EnemyInterface, Vector2, Animation, Rectangle, Character } from '../types/GameTypes';
import { Player } from './Player';
import AudioManager from './AudioManager';

export class Enemy implements EnemyInterface {
  id: string;
  name: string;
  position: Vector2;
  velocity: Vector2;
  health: number;
  maxHealth: number;
  facing: 'left' | 'right' = 'left';
  state: Character['state'] = 'idle';
  animation: Animation;
  hitbox: Rectangle;
  attackBox?: Rectangle;
  isAttacking = false;
  attackCooldown = 0;
  invulnerable = false;
  invulnerabilityTime = 0;
  
  type: 'punk' | 'bruiser' | 'boss';
  aiState: 'patrol' | 'chase' | 'attack' | 'stunned' = 'patrol';
  aiTimer = 0;
  targetPosition: Vector2;
  attackRange: number;
  patrolStart: number;
  patrolEnd: number;

  private speed: number;
  private attackDamage: number;
  private detectionRange = 150;

  constructor(type: 'punk' | 'bruiser' | 'boss', startX: number, startY: number) {
    this.type = type;
    this.id = `enemy_${Math.random().toString(36).substr(2, 9)}`;
    this.position = { x: startX, y: startY };
    this.velocity = { x: 0, y: 0 };
    this.targetPosition = { x: startX, y: startY };
    
    // Set stats based on enemy type
    switch (type) {
      case 'punk':
        this.name = 'Punk';
        this.health = this.maxHealth = 30;
        this.speed = 1.5;
        this.attackDamage = 10;
        this.attackRange = 50;
        this.hitbox = { x: 0, y: 0, width: 40, height: 60 };
        break;
      case 'bruiser':
        this.name = 'Bruiser';
        this.health = this.maxHealth = 60;
        this.speed = 1;
        this.attackDamage = 20;
        this.attackRange = 60;
        this.hitbox = { x: 0, y: 0, width: 50, height: 70 };
        break;
      case 'boss':
        this.name = 'Boss';
        this.health = this.maxHealth = 150;
        this.speed = 2;
        this.attackDamage = 25;
        this.attackRange = 70;
        this.hitbox = { x: 0, y: 0, width: 60, height: 80 };
        break;
    }
    
    this.patrolStart = startX - 100;
    this.patrolEnd = startX + 100;
    
    this.animation = {
      frames: [0],
      currentFrame: 0,
      frameTime: 0,
      maxFrameTime: 300,
      loop: true,
      finished: false
    };
  }

  update(deltaTime: number, player: Player): void {
    if (this.state === 'dying' || this.state === 'dead') return;

    this.updateAI(player, deltaTime);
    this.updateMovement(deltaTime);
    this.updateAnimation(deltaTime);
    this.updateTimers(deltaTime);
    this.updateHitbox();
  }

  private updateAI(player: Player, deltaTime: number): void {
    const distanceToPlayer = Math.sqrt(
      Math.pow(player.position.x - this.position.x, 2) + 
      Math.pow(player.position.y - this.position.y, 2)
    );

    this.aiTimer += deltaTime;

    switch (this.aiState) {
      case 'patrol':
        this.handlePatrol();
        if (distanceToPlayer < this.detectionRange) {
          this.aiState = 'chase';
          this.aiTimer = 0;
        }
        break;

      case 'chase':
        this.handleChase(player);
        if (distanceToPlayer <= this.attackRange) {
          this.aiState = 'attack';
          this.aiTimer = 0;
        } else if (distanceToPlayer > this.detectionRange * 1.5) {
          this.aiState = 'patrol';
          this.aiTimer = 0;
        }
        break;

      case 'attack':
        this.handleAttack(player);
        if (this.aiTimer > 1000) {
          this.aiState = 'chase';
          this.aiTimer = 0;
        }
        break;

      case 'stunned':
        this.velocity.x = 0;
        this.velocity.y = 0;
        if (this.aiTimer > 800) {
          this.aiState = 'chase';
          this.aiTimer = 0;
        }
        break;
    }
  }

  private handlePatrol(): void {
    if (this.aiTimer > 2000) {
      this.targetPosition.x = Math.random() > 0.5 ? this.patrolEnd : this.patrolStart;
      this.aiTimer = 0;
    }

    const direction = this.targetPosition.x - this.position.x;
    if (Math.abs(direction) > 10) {
      this.velocity.x = direction > 0 ? this.speed * 0.5 : -this.speed * 0.5;
      this.facing = direction > 0 ? 'right' : 'left';
      this.state = 'walking';
    } else {
      this.velocity.x = 0;
      this.state = 'idle';
    }
  }

  private handleChase(player: Player): void {
    const dx = player.position.x - this.position.x;
    const dy = player.position.y - this.position.y;
    
    this.velocity.x = dx > 0 ? this.speed : -this.speed;
    this.velocity.y = Math.abs(dy) > 20 ? (dy > 0 ? this.speed * 0.7 : -this.speed * 0.7) : 0;
    
    this.facing = dx > 0 ? 'right' : 'left';
    this.state = 'walking';
  }

  private handleAttack(player: Player): void {
    if (this.attackCooldown <= 0 && !this.isAttacking) {
      this.startAttack();
    }
  }

  private updateMovement(deltaTime: number): void {
    this.position.x += this.velocity.x * deltaTime / 16;
    this.position.y += this.velocity.y * deltaTime / 16;

    // Constrain to level bounds
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
    // Use simpler frame mapping for enemies (using Axel sprite layout)
    switch (this.state) {
      case 'idle':
        this.animation.frames = [0, 1, 2];
        this.animation.maxFrameTime = 600;
        this.animation.loop = true;
        break;
      case 'walking':
        this.animation.frames = [10, 11, 12, 13];
        this.animation.maxFrameTime = 300;
        this.animation.loop = true;
        break;
      case 'punching':
        this.animation.frames = [20, 21, 22];
        this.animation.maxFrameTime = 200;
        this.animation.loop = false;
        break;
      case 'hit':
        this.animation.frames = [30];
        this.animation.maxFrameTime = 300;
        this.animation.loop = false;
        break;
      case 'dying':
        this.animation.frames = [40];
        this.animation.maxFrameTime = 500;
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
  }

  private updateHitbox(): void {
    this.hitbox.x = this.position.x - this.hitbox.width / 2;
    this.hitbox.y = this.position.y - this.hitbox.height / 2;
  }

  private startAttack(): void {
    this.state = 'punching';
    this.isAttacking = true;
    this.attackCooldown = 1500;
    
    this.animation.currentFrame = 0;
    this.animation.finished = false;
    
    // Create attack hitbox
    this.attackBox = {
      x: this.facing === 'right' 
        ? this.position.x 
        : this.position.x - this.attackRange,
      y: this.position.y - 30,
      width: this.attackRange,
      height: 60
    };

    AudioManager.playSound('sfx_punch');
  }

  takeDamage(damage: number): boolean {
    if (this.invulnerable) return false;

    this.health -= damage;
    this.state = 'hit';
    this.invulnerable = true;
    this.invulnerabilityTime = 500;
    this.aiState = 'stunned';
    this.aiTimer = 0;
    
    this.animation.currentFrame = 0;
    this.animation.finished = false;

    AudioManager.playSound('sfx_enemy_hit');

    if (this.health <= 0) {
      this.state = 'dying';
      AudioManager.playSound('sfx_enemy_death');
      return true; // Enemy defeated
    }

    // Knockback
    const knockbackForce = 1.5;
    this.velocity.x = this.facing === 'right' ? knockbackForce : -knockbackForce;
    
    return false;
  }

  getAttackDamage(): number {
    return this.attackDamage;
  }
}