let currentSignal = null;
const pending = new Set();

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

  _pending = 0;

  _value;

  constructor(value) {
    this._value = value;
  }

  get value() {
    if (!this._active) {
      activate(this);
    }

    if (!currentSignal) {
      return this._value;
    }

    // subscribe the current computed to this signal:
    this._subs.add(currentSignal);

    // TODO dependency

    return this._value;
  }

  set value(value) {
    if (this._readonly) {
      throw new Error('Cannot write to a readonly signal');
    }

    if (this._value !== value) {
      this._value = value;
      pending.add(this);

      if (this._pending === 0) {
        mark(this);
      }

      // TODO: pending, and mark
      sweep(pending);
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

  /**
   * A custom update routine to run when this Signal's value changes.
   * @internal
   */
  _updater() {
    // override me to handle updates
  }

  _setCurrent() {
    currentSignal = this;
  }
}

export const signal = (value) => {
  return new Singal(value);
};

export const subscribe = (signal, to) => {
  signal._active = true;
  signal.deps.add(to);
  to._subs.add(signal);
};

export const activate = (signal) => {
  signal._active = true;
  // TODO: refresh stale
  signal._updater();
};

/**
 * Mark a signal and its dependencies as pending
 */
const mark = (signal) => {
  signal._pending = signal._pending + 1;
  if (signal._pending === 1) {
    signal._subs.forEach((sub) => {
      mark(sub);
    });
  }
};

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

const sweep = (subs) => {
  subs.forEach((signal) => {
    // pending
    if (signal._pending > 0) {
      // TODO: flag
      signal._pending -= 1;
      signal._updater();
      sweep(signal._subs);
    }
  });
};

// t: computed (lazy)
//    -> create new signal
//    -> set to readonly
//        -> set updater
// get t.value
//    -> invoke updater
//    -> set new result
export const computed = (compute) => {
  const signal = new Singal();
  signal._readonly = true;
  function updater() {
    signal._setCurrent(); // for re-compute

    try {
      let ret = compute();
      signal._value = ret;
    } catch (e) {}
  }

  signal._updater = updater;
  return signal;
};

/**
 * effect (eager)
 *
 * -> create a computed signal
 *    -> activate the signal, since the computed is lazy
 *
 */
export const effect = (fn) => {
  // TODO: batch
  const s = computed(() => fn());

  activate(s);

  // TODO destroy
};
