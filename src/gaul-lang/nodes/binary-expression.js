class BinaryExpression {
  constructor (left, right) {
    this.left = left;
    this.right = right;
  }

  eval (env) {
    throw Error("Must implement an eval() method");
  }
}

class Add extends BinaryExpression {
  eval (env) {
    return this.left.eval(env) + this.right.eval(env);
  }
}

class Subtract extends BinaryExpression {
  eval (env) {
    return this.left.eval(env) - this.right.eval(env);
  }
}

class Multiply extends BinaryExpression {
  eval (env) {
    return this.left.eval(env) * this.right.eval(env);
  }
}

class Divide extends BinaryExpression {
  eval (env) {
    return this.left.eval(env) / this.right.eval(env);
  }
}

class Modulo extends BinaryExpression {
  eval (env) {
    return this.left.eval(env) % this.right.eval(env);
  }
}

class And extends BinaryExpression {
  eval (env) {
    return this.left.eval(env) && this.right.eval(env);
  }
}

class Or extends BinaryExpression {
  eval (env) {
    return this.left.eval(env) || this.right.eval(env);
  }
}

class GT extends BinaryExpression {
  eval (env) {
    return this.left.eval(env) > this.right.eval(env);
  }
}

class GTE extends BinaryExpression {
  eval (env) {
    return this.left.eval(env) >= this.right.eval(env);
  }
}

class LT extends BinaryExpression {
  eval (env) {
    return this.left.eval(env) < this.right.eval(env);
  }
}

class LTE extends BinaryExpression {
  eval (env) {
    return this.left.eval(env) <= this.right.eval(env);
  }
}

class Equal extends BinaryExpression {
  eval (env) {
    return this.left.eval(env) === this.right.eval(env);
  }
}

class NotEqual extends BinaryExpression {
  eval (env) {
    return this.left.eval(env) !== this.right.eval(env);
  }
}

export {
  Add,
  Subtract,
  Multiply,
  Divide,
  Modulo,
  And,
  Or,
  GT,
  GTE,
  LT,
  LTE,
  Equal,
  NotEqual,
};
