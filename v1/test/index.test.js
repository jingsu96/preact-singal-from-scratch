import { expect, test, describe, vi } from 'vitest';
import { signal, computed, effect } from '../';

/**
 * signal
 *   -> initialize a new signal with the value
 *      -> some internal properties
 *          -> getter
 *             -> if not active, activate (call the updater)
 *             -> if there has a current signal, add the current signal to the subs, means the current signal is depend on this signal
 *             -> return value
 *          -> setter
 *             -> if readonly, throw error
 *             -> if value is not equal to new value, set the value to new value, add to pending, and mark
 */
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

    test('should not trigger a read', () => {
      const s = signal(1);
      const fn = vi.fn(() => s.peek());
      effect(fn);
      s.value = 2;
      expect(fn).toBeCalledTimes(1);
    });

    test('should refresh value if stale', () => {
      const s = signal(1);
      const s1 = computed(() => s.value + 1);

      const dispose = effect(() => {
        s1.value;
      });

      dispose();

      s.value = 2;

      expect(s1.peek()).toBe(3);
    });
  });

  describe('.subscribe()', () => {
    test('should subscribe to a singal', () => {
      const fn = vi.fn();
      const s = signal(1);

      s.subscribe(fn);
      expect(fn).toHaveBeenCalledWith(1);
    });

    test('should subscribe to a singal', () => {
      const fn = vi.fn();
      const s = signal(1);

      const dispose = s.subscribe(fn);

      dispose();
      fn.mockClear();

      s.value = 2;
      expect(fn).not.toBeCalled(2);
    });
  });
});

/**
 * effect (eager)
 *   -> call the computed
 *   -> immediately activate the computed
 */
describe('effect()', () => {
  test('should init with value', () => {
    const s = signal(123);
    const fn = vi.fn(() => s.value);

    effect(fn);

    expect(fn).toHaveBeenCalled();
    expect(fn).toHaveReturnedWith(123);
  });

  test('should subscribe to signals', () => {
    const s = signal(123);
    const fn = vi.fn(() => s.value);

    effect(fn);
    fn.mockClear();

    s.value = 456;

    expect(fn).toHaveBeenCalled();
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

  test('should dispose of subscription', () => {
    const s = signal(123);
    const y = signal(456);
    const fn = vi.fn(() => s.value + y.value);
    const dispose = effect(fn);

    fn.mockClear();
    dispose();
    expect(fn).not.toBeCalled();

    s.value = 456;
    y.value = 789;
    expect(fn).not.toBeCalled();
  });

  test('should unsubscribe from signals', () => {
    const s = signal(123);
    const fn = vi.fn(() => s.value);
    const dispose = effect(fn);

    fn.mockClear();
    dispose();

    s.value = 456;
    expect(fn).not.toBeCalled();
  });
});

/**
 * computed (lazy)
 *    -> create a new signal, and set to readonly
 *    -> set updater
 *        -> set the signal to current signal (for re-compute)
 *        -> try to compute the value (call the compute function), e.g. () => a.value + b.value
 *        -> set the value to the signal
 */
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

  test('should conditionally unsubscribe from signals', () => {
    const a = signal('a');
    const b = signal('b');
    const cond = signal(true);
    const fn = vi.fn(() => (cond.value ? a.value : b.value));

    const c = computed(fn);
    expect(c.value).toBe('a');
    expect(fn).toBeCalledTimes(1);

    cond.value = false;
    expect(c.value).toBe('b');
    expect(fn).toBeCalledTimes(2);

    fn.mockClear();

    a.value = 'aa';
    expect(c.value).toBe('b');
    expect(fn).not.toBeCalled();
  });

  describe('graph update', () => {
    test('should run computeds once for mutliple dep changes', () => {
      const a = signal('a');
      const b = signal('b');

      const fn = vi.fn(() => a.value + b.value);

      const c = computed(fn);

      expect(c.value).toBe('ab');
      expect(fn).toBeCalledTimes(1);

      fn.mockClear();
      a.value = 'aa';

      expect(fn).toBeCalledTimes(1);
    });

    test('should drop A -> B -> A updates', () => {
      // make a graph
      //    a
      //   / \
      //   b  c
      //   |
      //   d
      //   |
      //   e
      const a = signal('a');
      const b = computed(() => a.value + 'b');
      const c = computed(() => a.value + 'c');
      const d = computed(() => a.value + b.value);

      const fn = vi.fn(() => 'd: ' + d.value);
      const e = computed(fn);

      e.value;

      expect(fn).toHaveBeenCalledOnce();

      fn.mockClear();

      a.value = 'A';

      expect(fn).toHaveBeenCalledOnce();
    });

    test('should only update every signal once (diamond graph)', () => {
      // In this scenario "D" should only update once when "A" receives
      // an update. This is sometimes referred to as the "diamond" scenario.
      //     A
      //   /   \
      //  B     C
      //   \   /
      //     D

      const a = signal('a');
      const b = computed(() => a.value); // b depends on a
      const c = computed(() => a.value); // c depends on a

      const fn = vi.fn(() => b.value + ' ' + c.value); // d depends on b and c
      const d = computed(fn);

      expect(d.value).toBe('a a');
      expect(fn).toBeCalledTimes(1);

      a.value = 'aa';
      expect(d.value).toBe('aa aa');
      expect(fn).toBeCalledTimes(2);
    });
  });
});
