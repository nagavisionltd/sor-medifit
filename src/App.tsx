import React, { useEffect, useRef } from 'react';
import { GameEngine } from './game/GameEngine';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    if (canvasRef.current && !gameEngineRef.current) {
      gameEngineRef.current = new GameEngine(canvasRef.current);
      gameEngineRef.current.start();
    }

    // Cleanup
    return () => {
      // Game engine cleanup would go here
    };
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="bg-gray-800 p-6 rounded-lg shadow-2xl">
        <h1 className="text-3xl font-bold text-white text-center mb-4">
          Streets of Rage Clone
        </h1>
        
        <canvas
          ref={canvasRef}
          className="border-4 border-gray-600 rounded-lg bg-black pixel-art"
          style={{ imageRendering: 'pixelated' }}
        />
        
        <div className="mt-4 text-center">
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <h3 className="font-semibold text-white mb-2">Desktop Controls</h3>
              <p>Arrow Keys: Move</p>
              <p>Space: Punch</p>
              <p>X: Special Attack</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Character Select</h3>
              <p>1: Select Blaze</p>
              <p>2: Select Axel</p>
              <p>Space: Start Game</p>
            </div>
          </div>
          
          <div className="mt-4 text-xs text-gray-400 max-w-2xl">
            <p className="mb-2">
              Experience classic beat 'em up gameplay with authentic Streets of Rage mechanics!
              Choose your fighter, defeat 20 enemies to complete the level, and rack up combos for bonus points.
            </p>
            <p>
              Features include character selection, combo system, multiple enemy types, 
              sound effects, background music, and smooth pixel-perfect animations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;