export class Singal {
  _value;

  constructor(value) {
    this._value = value;
  }

  get value() {
    return this._value;
  }

  toString() {
    return '' + this._value;
  }
}

export const signal = (value) => {
  return new Singal(value);
};
