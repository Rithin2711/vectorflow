import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import GameScene from '../game/GameScene';
import useGameStore from '../store/store';

// PUBLIC_INTERFACE
export default function VectorFieldCanvas() {
  /** Mounts a Phaser game instance rendering the simulation and game. */
  const phaserRef = useRef(null);
  const { setPhaserGame } = useGameStore();

  useEffect(() => {
    const parent = phaserRef.current;
    const config = {
      type: Phaser.AUTO,
      parent,
      width: parent.clientWidth,
      height: parent.clientHeight,
      backgroundColor: '#0a0d12',
      physics: { default: 'arcade' },
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: [GameScene]
    };
    const game = new Phaser.Game(config);
    setPhaserGame(game);

    const handleResize = () => {
      game.scale.resize(parent.clientWidth, parent.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      setPhaserGame(null);
      game.destroy(true);
    };
  }, [setPhaserGame]);

  return <div ref={phaserRef} className="phaser-parent" style={{ width: '100%', height: '70vh' }} />;
}
