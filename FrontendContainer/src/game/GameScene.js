import Phaser from 'phaser';
import useGameStore from '../store/store';
import { evalVectorField } from './vectorField';
import { integrateRK4 } from './integrators';
import { detectCollision, buildObstacles, buildGoal } from './collision';
import { randomColor } from '../utils/colors';

const TRAIL_MAX = 1000;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.particle = null;
    this.trail = [];
    this.graphics = null;
    this.t = 0;
    this.goal = null;
    this.obstacles = [];
  }

  /** Initialize game objects */
  create() {
    this.graphics = this.add.graphics();
    const store = useGameStore.getState();

    // Setup particle
    this.particle = this.add.circle(store.startPos.x, store.startPos.y, 6, 0x6ee7ff);
    this.particle.setDepth(2);

    // Build obstacles and goal for challenge mode
    this.rebuildChallengeObjects();

    // Input to reset on double click
    this.input.on('pointerdown', (pointer) => {
      if (pointer.getDuration() < 250 && pointer.getDistance() < 5) {
        // single click moves start position
        useGameStore.getState().setStartPos({ x: pointer.x, y: pointer.y });
        this.particle.setPosition(pointer.x, pointer.y);
        this.trail.length = 0;
      }
    });
  }

  rebuildChallengeObjects() {
    // Remove existing
    if (this.goal) this.goal.destroy();
    this.obstacles.forEach(o => o.destroy());
    this.obstacles = [];

    const store = useGameStore.getState();
    if (!store.challengeMode) return;

    // Build a goal and random obstacles with deterministic layout
    this.goal = buildGoal(this, store.goalPos.x, store.goalPos.y, 12);
    this.obstacles = buildObstacles(this, this.scale.width, this.scale.height, 6);
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05) * useGameStore.getState().speed;
    const { playing, parsedField, bounds, challengeMode } = useGameStore.getState();

    // Draw vector field grid lightly
    this.renderVectorField();

    if (!playing || !parsedField) return;

    // Integrate particle using RK4 with vector field
    const { x, y } = this.particle;
    const deriv = (s, tt) => evalVectorField(parsedField, s.x, s.y, this.t + tt);
    const next = integrateRK4({ x, y }, deriv, dt);

    // Keep within bounds
    const clamped = {
      x: Phaser.Math.Clamp(next.x, bounds.xMin, bounds.xMax),
      y: Phaser.Math.Clamp(next.y, bounds.yMin, bounds.yMax)
    };
    this.particle.setPosition(clamped.x, clamped.y);
    this.t += dt;

    // Append to trail
    this.trail.push({ x: clamped.x, y: clamped.y, c: 0x1bb2c8 });
    if (this.trail.length > TRAIL_MAX) this.trail.shift();

    // Render trail and target/obstacles
    this.renderTrail();

    if (challengeMode) {
      const hit = detectCollision(this.particle, this.obstacles);
      if (hit) {
        useGameStore.getState().onCollision();
        // bounce back slightly
        const jitter = Phaser.Math.Vector2.Random().scale(8);
        this.particle.setPosition(
          Phaser.Math.Clamp(this.particle.x + jitter.x, bounds.xMin, bounds.xMax),
          Phaser.Math.Clamp(this.particle.y + jitter.y, bounds.yMin, bounds.yMax)
        );
      }
      // Check goal proximity
      if (this.goal) {
        const d = Phaser.Math.Distance.Between(this.particle.x, this.particle.y, this.goal.x, this.goal.y);
        if (d < this.goal.radius + 6) {
          useGameStore.getState().onGoalReached();
          // Randomize next goal and obstacles; increase difficulty
          const s = useGameStore.getState();
          const nx = Phaser.Math.Between(50, this.scale.width - 50);
          const ny = Phaser.Math.Between(50, this.scale.height - 50);
          s.setGoalPos({ x: nx, y: ny });
          this.rebuildChallengeObjects();
          this.trail.push({ x: this.particle.x, y: this.particle.y, c: 0x3ecf8e });
        }
      }
    }

    // update elapsed time in store
    useGameStore.getState().tickTime(dt);
  }

  renderVectorField() {
    const { parsedField } = useGameStore.getState();
    const w = this.scale.width;
    const h = this.scale.height;

    this.graphics.clear();

    // Grid
    this.graphics.lineStyle(1, 0x0f141c, 1);
    for (let i = 0; i <= w; i += 50) {
      this.graphics.lineBetween(i, 0, i, h);
    }
    for (let j = 0; j <= h; j += 50) {
      this.graphics.lineBetween(0, j, w, j);
    }

    if (!parsedField) return;
    // Vector field arrows
    const step = 50;
    for (let gx = 25; gx < w; gx += step) {
      for (let gy = 25; gy < h; gy += step) {
        const v = evalVectorField(parsedField, gx, gy, this.t);
        const len = Math.min(30, Math.hypot(v.fx, v.fy) * 10);
        const endx = gx + (v.fx / (Math.hypot(v.fx, v.fy) || 1)) * len;
        const endy = gy + (v.fy / (Math.hypot(v.fx, v.fy) || 1)) * len;
        const col = 0x1bb2c8;
        this.graphics.lineStyle(2, col, 0.8);
        this.graphics.lineBetween(gx, gy, endx, endy);
        // arrow head
        const angle = Math.atan2(endy - gy, endx - gx);
        const head = 6;
        this.graphics.lineBetween(endx, endy, endx - head * Math.cos(angle - 0.5), endy - head * Math.sin(angle - 0.5));
        this.graphics.lineBetween(endx, endy, endx - head * Math.cos(angle + 0.5), endy - head * Math.sin(angle + 0.5));
      }
    }
  }

  renderTrail() {
    // Trail path
    this.graphics.lineStyle(2, 0x6ee7ff, 0.9);
    for (let i = 1; i < this.trail.length; i++) {
      const a = this.trail[i - 1];
      const b = this.trail[i];
      const col = b.c || 0x6ee7ff;
      this.graphics.lineStyle(2, col, 0.8);
      this.graphics.lineBetween(a.x, a.y, b.x, b.y);
    }

    // Goal and obstacles
    const store = useGameStore.getState();
    if (store.challengeMode) {
      if (this.goal) {
        this.graphics.fillStyle(0x3ecf8e, 1);
        this.graphics.fillCircle(this.goal.x, this.goal.y, this.goal.radius);
      }
      this.graphics.fillStyle(0xe24a4a, 1);
      this.obstacles.forEach((o) => {
        if (o.shape === 'circle') {
          this.graphics.fillCircle(o.x, o.y, o.radius);
        } else {
          this.graphics.fillRect(o.x - o.w / 2, o.y - o.h / 2, o.w, o.h);
        }
      });
    }
  }
}
