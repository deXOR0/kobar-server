class UnaryExpression {
  constructor (arg) {
    this.arg = arg;
  }

  eval (env) {
    throw Error("Must implement an eval() method");
  }
}

class Not extends UnaryExpression {
  eval (env) {
    return !this.arg.eval(env);
  }
}

class Negative extends UnaryExpression {
  eval (env) {
    return -this.arg.eval(env);
  }
}

export { Negative, Not };
