class Literal {
  constructor (value) {
    this.value = value;
  }

  eval () {
    throw new Error("Must implement an eval() method");
  }
}

class StringLiteral extends Literal {
  eval () {
    return this.value;
  }
}

class NumberLiteral extends Literal {
  eval () {
    return Number(this.value);
  }
}

class BooleanLiteral extends Literal {
  eval () {
    return !!this.value;
  }
}

export {
  StringLiteral as String,
  NumberLiteral as Number,
  BooleanLiteral as Boolean,
};
