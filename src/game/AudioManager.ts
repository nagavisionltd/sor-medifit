import { AudioAssets } from '../types/GameTypes';

class AudioManager {
  private assets: Partial<AudioAssets> = {};
  private musicVolume = 0.3;
  private sfxVolume = 0.5;
  private currentMusic: HTMLAudioElement | null = null;

  async loadAudio(): Promise<AudioAssets> {
    const audioUrls = {
      sfx_punch: 'https://play.rosebud.ai/assets/Retro Weapon Gun LoFi 03.wav?B9nP',
      sfx_hit: 'https://play.rosebud.ai/assets/Retro Magic 34.wav?j7Xy',
      sfx_enemy_hit: 'https://play.rosebud.ai/assets/Retro Magic 54.wav?Ysje',
      sfx_enemy_death: 'https://play.rosebud.ai/assets/Retro Descending Short 20.wav?pTsl',
      sfx_special: 'https://play.rosebud.ai/assets/Retro PowerUP 09.wav?p1Ni',
      sfx_throw: 'https://play.rosebud.ai/assets/Retro Gun SingleShot 04.wav?WC9F',
      music_level1: 'https://play.rosebud.ai/assets/Neon Nights.mp3?IN54',
      music_level2: 'https://play.rosebud.ai/assets/Shadows and Smoke - ROCK RNB.mp3?rDyd',
      music_level3: 'https://play.rosebud.ai/assets/creepy_ambience_01.mp3?9p78'
    };

    const loadPromises = Object.entries(audioUrls).map(([key, url]) => {
      return new Promise<void>((resolve, reject) => {
        const audio = new Audio(url);
        audio.preload = 'auto';
        audio.addEventListener('canplaythrough', () => {
          this.assets[key as keyof AudioAssets] = audio;
          resolve();
        });
        audio.addEventListener('error', reject);
        audio.load();
      });
    });

    await Promise.all(loadPromises);
    return this.assets as AudioAssets;
  }

  playSound(soundName: keyof AudioAssets): void {
    const sound = this.assets[soundName];
    if (sound) {
      const clonedSound = sound.cloneNode() as HTMLAudioElement;
      clonedSound.volume = this.sfxVolume;
      clonedSound.play().catch(() => {});
    }
  }

  playMusic(musicName: keyof AudioAssets): void {
    if (this.currentMusic) {
      this.currentMusic.pause();
    }

    const music = this.assets[musicName];
    if (music) {
      this.currentMusic = music;
      music.volume = this.musicVolume;
      music.loop = true;
      music.play().catch(() => {});
    }
  }

  stopMusic(): void {
    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
      this.currentMusic = null;
    }
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.currentMusic) {
      this.currentMusic.volume = this.musicVolume;
    }
  }

  setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }
}

export default new AudioManager();