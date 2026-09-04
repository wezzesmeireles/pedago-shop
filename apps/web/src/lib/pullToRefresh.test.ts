import { describe, expect, it } from 'vitest';
import {
  dampedPullDistance,
  PULL_REFRESH_MAX_DISTANCE,
  PULL_REFRESH_THRESHOLD,
  shouldRefresh,
} from './pullToRefresh';

describe('pull to refresh', () => {
  it('ignora o movimento para cima', () => {
    expect(dampedPullDistance(-40)).toBe(0);
  });

  it('amortece e limita o arrasto', () => {
    expect(dampedPullDistance(100)).toBe(46);
    expect(dampedPullDistance(1000)).toBe(PULL_REFRESH_MAX_DISTANCE);
  });

  it('atualiza somente depois do limite visual', () => {
    expect(shouldRefresh(PULL_REFRESH_THRESHOLD - 1)).toBe(false);
    expect(shouldRefresh(PULL_REFRESH_THRESHOLD)).toBe(true);
  });
});
