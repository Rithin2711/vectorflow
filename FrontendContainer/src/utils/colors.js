 // PUBLIC_INTERFACE
export function randomColor() {
  /** Returns a random hex color integer for Phaser. */
  const c = Math.floor(Math.random() * 0xffffff);
  return c;
}
