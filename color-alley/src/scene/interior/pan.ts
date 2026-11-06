// Shared pan state for the shop interior camera, kept in a tiny module so the
// 2D controls can drive it without importing the (lazy) interior chunk.
export const interiorPan = {
  target: 0,
  limit: 1.6,
  nudge(dir: number) {
    this.target = Math.max(-this.limit, Math.min(this.limit, this.target + dir * 0.9));
  },
};
