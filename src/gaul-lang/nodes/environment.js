class Environment {
  constructor (parent = null, variables = {}, inputStream = []) {
    this.parent = parent;
    this.variables = variables;
    this.inputStream = inputStream;
    this.outputStream = [];
  }

  set (name, value) {
    this.variables[name] = value;
  }

  get (name) {
    if (name in this.variables) return this.variables[name];

    if (this.parent) return this.parent.get(name);

    return null;
  }

  remove (name) {
    if (name in this.variables) delete this.variables[name];
  }
}

export { Environment };
