class Variable {
  constructor (name) {
    this.name = name;
  }

  eval (env) {
    const value = env.get(this.name);

    if (value == null) {
      throw SyntaxError(`Unknown variable: '${this.name}'`);
    }

    return value;
  }
}

export { Variable };
