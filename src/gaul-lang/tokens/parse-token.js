export class ParseToken {
  constructor (type, value, result = null) {
    this.type = type;
    this.value = value;
    this._result = result;
  }

  match (expected, func) {
    if (this._result) return this;
    if (this.type === expected) {
      return new ParseToken(this.type, this.value, func());
    }

    return this;
  }

  matchAny (expected, func) {
    if (this._result) return this;
    if (expected.includes(this.type)) {
      return new ParseToken(this.type, this.value, func());
    }

    return this;
  }

  else (func) {
    if (this._result) return this;

    return new ParseToken(this.type, this.value, func());
  }

  result () {
    return this._result;
  }
}
