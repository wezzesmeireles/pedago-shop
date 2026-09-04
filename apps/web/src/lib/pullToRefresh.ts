export const PULL_REFRESH_THRESHOLD = 56;
export const PULL_REFRESH_MAX_DISTANCE = 112;

export function dampedPullDistance(deltaY: number): number {
  if (deltaY <= 0) return 0;
  return Math.min(PULL_REFRESH_MAX_DISTANCE, deltaY * 0.58);
}

export function shouldRefresh(distance: number): boolean {
  return distance >= PULL_REFRESH_THRESHOLD;
}
