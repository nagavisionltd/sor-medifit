export interface Vector2 {
  x: number;
  y: number;
}

export interface Character {
  id: string;
  name: string;
  position: Vector2;
  velocity: Vector2;
  health: number;
  maxHealth: number;
  facing: 'left' | 'right';
  state: CharacterState;
  animation: Animation;
  hitbox: Rectangle;
  attackBox?: Rectangle;
  isAttacking: boolean;
  attackCooldown: number;
  invulnerable: boolean;
  invulnerabilityTime: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type CharacterState = 
  | 'idle' 
  | 'walking' 
  | 'punching' 
  | 'hit' 
  | 'dying' 
  | 'dead';

export interface Animation {
  frames: number[];
  currentFrame: number;
  frameTime: number;
  maxFrameTime: number;
  loop: boolean;
  finished: boolean;
}

export interface Enemy extends Character {
  type: 'punk' | 'bruiser' | 'boss';
  aiState: 'patrol' | 'chase' | 'attack' | 'stunned';
  aiTimer: number;
  targetPosition: Vector2;
  attackRange: number;
  patrolStart: number;
  patrolEnd: number;
}

export interface GameState {
  currentLevel: number;
  score: number;
  lives: number;
  gameStatus: 'menu' | 'playing' | 'paused' | 'gameOver' | 'levelComplete';
  selectedCharacter: 'blaze' | 'axel' | null;
  camera: Vector2;
  levelProgress: number;
  enemiesDefeated: number;
  combo: number;
  comboTimer: number;
}

export interface AudioAssets {
  sfx_punch: HTMLAudioElement;
  sfx_hit: HTMLAudioElement;
  sfx_enemy_hit: HTMLAudioElement;
  sfx_enemy_death: HTMLAudioElement;
  sfx_special: HTMLAudioElement;
  sfx_throw: HTMLAudioElement;
  music_level1: HTMLAudioElement;
  music_level2: HTMLAudioElement;
  music_level3: HTMLAudioElement;
}

export interface SpriteAssets {
  blaze: HTMLImageElement;
  axel: HTMLImageElement;
  background1: HTMLImageElement;
  background2: HTMLImageElement;
  background3: HTMLImageElement;
}