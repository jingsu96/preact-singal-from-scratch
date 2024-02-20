import { expect, test, describe } from 'vitest';
import { signal } from '../';

describe('singal', () => {
  test('should return value', () => {
    const v = [1, 2];
    const s = signal(v);
    expect(s.value).toBe(v);
  });
});
