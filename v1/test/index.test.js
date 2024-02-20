import { expect, test, describe } from 'vitest';
import { signal, computed } from '../';

describe('singal', () => {
  test('should return value', () => {
    const v = [1, 2];
    const s = signal(v);
    expect(s.value).toBe(v);
  });

  test('should support .toString()', () => {
    const s = signal(1);
    expect(s.toString()).toBe('1');
  });

  describe('.peek()', () => {
    test('should get value', () => {
      const s = signal(1);
      expect(s.peek()).toBe(1);
    });

    test('should not trigger a read', () => {});
  });

  describe('.subscribe()', () => {
    test('should subscribe to a singal', () => {});

    test('should subscribe to a singal', () => {});
  });
});

describe('computed', () => {
  test('should return value', () => {
    const a = signal('a');
    const b = signal('b');

    const c = computed(() => a.value + b.value);
    expect(c.value).toBe('ab');
  });
});
