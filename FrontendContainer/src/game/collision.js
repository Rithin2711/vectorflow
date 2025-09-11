import Phaser from 'phaser';

// PUBLIC_INTERFACE
export function buildGoal(scene, x, y, radius = 10) {
  /** Creates a logical goal object (not a physics body) with position and radius. */
  return { x, y, radius };
}

// PUBLIC_INTERFACE
export function buildObstacles(scene, width, height, count = 5) {
  /** Creates a set of circular or rectangular obstacles. */
  const obstacles = [];
  for (let i = 0; i < count; i++) {
    const shape = Math.random() < 0.6 ? 'circle' : 'rect';
    if (shape === 'circle') {
      obstacles.push({
        shape,
        x: Phaser.Math.Between(50, width - 50),
        y: Phaser.Math.Between(50, height - 50),
        radius: Phaser.Math.Between(10, 30)
      });
    } else {
      obstacles.push({
        shape,
        x: Phaser.Math.Between(80, width - 80),
        y: Phaser.Math.Between(80, height - 80),
        w: Phaser.Math.Between(30, 80),
        h: Phaser.Math.Between(20, 60)
      });
    }
  }
  return obstacles;
}

// PUBLIC_INTERFACE
export function detectCollision(particle, obstacles) {
  /** Checks collision between particle circle and obstacles. Returns true if any collision occurs. */
  const r = 6;
  for (const o of obstacles) {
    if (o.shape === 'circle') {
      const d = Phaser.Math.Distance.Between(particle.x, particle.y, o.x, o.y);
      if (d < r + o.radius) return true;
    } else {
      // rectangle collision
      const dx = Math.abs(particle.x - o.x);
      const dy = Math.abs(particle.y - o.y);
      if (dx <= o.w / 2 + r && dy <= o.h / 2 + r) return true;
    }
  }
  return false;
}
