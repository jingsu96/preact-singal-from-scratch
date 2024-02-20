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

  _value;

  constructor(value) {
    this._value = value;
  }

  get value() {
    if (!this._active) {
      activate(this);
    }

    return this._value;
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
    try {
      let ret = compute();
      signal._value = ret;
    } catch (e) {}
  }

  signal._updater = updater;
  return signal;
};
