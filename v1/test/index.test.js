import { expect, test, describe, vi } from 'vitest';
import { signal, computed, effect } from '../';
import { MockedFunction } from 'vitest';

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

describe('effect()', () => {
  test('should init with value', () => {
    const s = signal(123);
    const fn = vi.fn(() => s.value);

    effect(fn);

    expect(fn).toHaveBeenCalled;
    expect(fn).toHaveReturnedWith(123);
  });

  test('should subscribe to signals', () => {
    const s = signal(123);
    const fn = vi.fn(() => s.value);

    effect(fn);
    fn.mockClear();

    s.value = 456;

    expect(fn).toHaveBeenCalled;
    expect(fn).toHaveReturnedWith(456);
  });

  test('should subscribe to multiple signals', () => {
    const a = signal(1);
    const b = signal(2);
    const fn = vi.fn(() => a.value + b.value);

    effect(fn);
    fn.mockClear();

    a.value = 2;
    b.value = 4;
    expect(fn).toHaveReturnedWith(6);
  });
});

describe('computed', () => {
  test('should return value', () => {
    const a = signal('a');
    const b = signal('b');

    const c = computed(() => a.value + b.value);
    expect(c.value).toBe('ab');
  });

  test('[SELF] should throw error if computed value is readonly', () => {
    const a = signal('a');
    const b = signal('b');

    const c = computed(() => a.value + b.value);
    expect(() => {
      c.value = 'c';
    }).toThrow('Cannot write to a readonly signal');
  });

  test('should return updated value', () => {
    const a = signal('a');
    const b = signal('b');

    const c = computed(() => a.value + b.value);
    expect(c.value).toBe('ab');

    a.value = 'c';
    expect(c.value).toBe('cb');
  });
});
