let currentSignal = null;
const pending = new Set();
let oldDeps = new Set();

export class Singal {
  /**
   * @description Set of signals that depend on this signal
   * @type {Set<Singal>}
   * */
  _subs = new Set();
  /**
   * @description Set of signals that this signal depends on
   * @type {Set<Singal>}
   * */
  _deps = new Set();

  /** @type {boolean} */
  _active = false;

  /**
   * Determine if a computed is allowed to write or not
   * @type {boolean}
   */
  _readonly = false;

  _requiresUpdate = false;
  _isComputing = false;

  _pending = 0;

  _value;

  constructor(value) {
    this._value = value;
  }

  get value() {
    if (!this._active) {
      activate(this);
    }

    if (currentSignal) {
      // subscribe the current computed to this signal:
      // TODO dependency
      this._subs.add(currentSignal);

      currentSignal._deps.add(this);
      oldDeps.delete(this);
    }

    return this._value;
  }

  set value(value) {
    if (this._readonly) {
      throw new Error('Cannot write to a readonly signal');
    }

    if (this._value !== value) {
      this._value = value;
      const isFirst = pending.size === 0;
      pending.add(this);

      if (this._pending === 0) {
        mark(this);
      }

      // TODO: pending, and mark
      if (isFirst) {
        sweep(pending);
        pending.clear();
      }
    }
  }

  peek() {
    if (!this._active) {
      activate(this);
    }
    return this._value;
  }

  toString() {
    return '' + this._value;
  }

  subscribe(fn) {
    return effect(() => fn(this._value));
  }

  /**
   * A custom update routine to run when this Signal's value changes.
   * @internal
   */
  _updater() {
    // override me to handle updates
  }

  _setCurrent() {
    let prevSignal = currentSignal;
    let prevOldDeps = oldDeps;
    currentSignal = this;
    oldDeps = this._deps;
    this._deps = new Set();

    // TODO: should unmark
    return (shouldUnmark, shouldCleanup) => {
      if (shouldUnmark) {
        this._subs.forEach(unmark);
      }

      if (shouldCleanup) {
        oldDeps.forEach((dep) => {
          unsubscribe(this, dep);
        });
      }

      oldDeps.clear();
      oldDeps = prevOldDeps;
      currentSignal = prevSignal;
    };
  }
}

export function signal(value) {
  return new Singal(value);
}

export const subscribe = (signal, to) => {
  signal._active = true;
  signal.deps.add(to);
  to._subs.add(signal);
};

export function unsubscribe(signal, from) {
  signal._deps.delete(from);
  from._subs.delete(signal);

  // cleanup nobody listen
  // test: should only subscribe to signals listened to - 2
  if (from._subs.size === 0) {
    from._active = false;
    from._deps.forEach((dep) => unsubscribe(from, dep));
  }
}

// TODO: tmpPending
function refreshStale(signal) {
  pending.delete(signal);
  signal._pending = 0;
  signal._updater();

  signal._subs.forEach((sub) => {
    if (sub._pending > 0) {
      if (sub._pending > 1) {
        sub._pending--;
      }
    }
  });
}

export function activate(signal) {
  signal._active = true;
  // TODO: refresh stale
  refreshStale(signal);
}

function unmark(signal) {
  if (!signal._requiresUpdate && signal._pending > 0 && --signal._pending === 0) {
    signal._subs.forEach(unmark);
  }
}

/**
 * Mark a signal and its dependencies as pending
 */
function mark(signal) {
  signal._pending = signal._pending + 1;
  if (signal._pending === 1) {
    signal._subs.forEach((sub) => {
      mark(sub);
    });
  }
}
/**
 * updated computed value
 *
 * -> add signal itself to the pending
 *    -> mark itself and all the subs as pending
 * -> sweep the pending
 *   -> for each pending signal
 *      -> if signal is pending
 *       -> decrease pending count
 *       -> invoke updater
 */

function sweep(subs) {
  subs.forEach((signal) => {
    // pending
    if (signal._pending > 0) {
      signal._requiresUpdate = true;

      // solve diamond problem, only update the signal once
      if (--signal._pending === 0) {
        if (signal._isComputing) {
          throw Error('Cycle detected');
        }
        signal._requiresUpdate = false;
        signal._isComputing = true;
        signal._updater();
        signal._isComputing = false;
        sweep(signal._subs);
      }
    }
  });
}

// t: computed (lazy)
//    -> create new signal
//    -> set to readonly
//        -> set updater
// get t.value
//    -> invoke updater
//    -> set new result
export function computed(compute) {
  const signal = new Singal();
  signal._readonly = true;
  function updater() {
    let finish = signal._setCurrent(); // for re-compute

    try {
      let ret = compute();
      finish(signal._value === ret, true);
      signal._value = ret;
    } catch (e) {
      console.error(e);
    }
  }

  signal._updater = updater;
  return signal;
}

/**
 * effect (eager)
 *
 * -> create a computed signal
 *    -> activate the signal, since the computed is lazy
 *
 */
export function effect(fn) {
  // TODO: batch
  const s = computed(() => batch(fn));

  activate(s);

  // TODO destroy
  return () => s._setCurrent()(true, true);
}

export function batch(cb) {
  // TODO: batch pending
  try {
    return cb();
  } finally {
  }
}
