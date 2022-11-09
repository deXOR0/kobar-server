class Statement {
  eval (env) {
    throw Error("Must implement an eval() method");
  }
}

class Empty extends Statement {}

class Multiple extends Statement {
  constructor (statements) {
    super();
    this.statements = statements;
  }

  eval (env) {
    this.statements.forEach((statement) => statement.eval(env));
  }
}

class Assignment extends Statement {
  constructor (left, right) {
    super();
    this.left = left;
    this.right = right;
  }

  eval (env) {
    env.set(this.left.name, this.right.eval(env));
  }
}

class If extends Statement {
  constructor (condition, trueStatement, falseStatement) {
    super();
    this.condition = condition;
    this.trueStatement = trueStatement;
    this.falseStatement = falseStatement;
  }

  eval (env) {
    if (this.condition.eval(env)) {
      this.trueStatement.eval(env);
    } else {
      this.falseStatement.eval(env);
    }
  }
}

class For extends Statement {
  constructor (identifier, start, end, statement) {
    super();
    this.identifier = identifier;
    this.start = start;
    this.end = end;
    this.statement = statement;
  }

  eval (env) {
    for (
      let counter = this.start.eval(env);
      counter <= this.end.eval(env);
      counter++
    ) {
      env.set(this.identifier.name, counter);
      this.statement.eval(env);
    }
  }
}

class Input extends Statement {
  constructor (identifier) {
    super();
    this.identifier = identifier;
  }

  eval (env) {
    const value = env.inputStream.pop();

    if (value == null) {
      throw EvalError(`Missing input`);
    }

    env.set(this.identifier.name, value);
  }
}

class Print extends Statement {
  constructor (expression) {
    super();
    this.expression = expression;
  }

  eval (env) {
    const expression = this.expression.eval(env).toString();
    env.outputStream.push(expression);
  }
}

export { Empty, Multiple, Assignment, If, For, Input, Print };
