class InputManager {
  private keys: Set<string> = new Set();
  private touches: Map<number, { x: number; y: number }> = new Map();
  private virtualButtons: { [key: string]: boolean } = {};

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Keyboard events
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      e.preventDefault();
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      e.preventDefault();
    });

    // Touch events for mobile
    window.addEventListener('touchstart', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        this.touches.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
      }
    });

    window.addEventListener('touchend', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        this.touches.delete(touch.identifier);
      }
    });

    window.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (this.touches.has(touch.identifier)) {
          this.touches.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
        }
      }
    });
  }

  isKeyPressed(key: string): boolean {
    return this.keys.has(key) || this.virtualButtons[key] || false;
  }

  getTouchCount(): number {
    return this.touches.size;
  }

  getFirstTouch(): { x: number; y: number } | null {
    const firstEntry = this.touches.entries().next();
    return firstEntry.done ? null : firstEntry.value[1];
  }

  setVirtualButton(button: string, pressed: boolean): void {
    this.virtualButtons[button] = pressed;
  }

  // Game-specific input mappings
  isMovingLeft(): boolean {
    return this.isKeyPressed('ArrowLeft') || this.isKeyPressed('KeyA');
  }

  isMovingRight(): boolean {
    return this.isKeyPressed('ArrowRight') || this.isKeyPressed('KeyD');
  }

  isMovingUp(): boolean {
    return this.isKeyPressed('ArrowUp') || this.isKeyPressed('KeyW');
  }

  isMovingDown(): boolean {
    return this.isKeyPressed('ArrowDown') || this.isKeyPressed('KeyS');
  }

  isPunching(): boolean {
    return this.isKeyPressed('Space') || this.isKeyPressed('KeyZ') || this.isKeyPressed('Enter');
  }

  isSpecialAttack(): boolean {
    return this.isKeyPressed('KeyX') || this.isKeyPressed('ShiftLeft');
  }
}

export default new InputManager();