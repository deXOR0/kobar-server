import { Environment } from "./environment.js";

class Program {
  constructor (statements) {
    this.statements = statements;
    this.env = null;
  }

  eval (inputs) {
    this.env = new Environment(null, {}, inputs);
    this.statements.forEach((statement) => statement.eval(this.env));
  }
}

export { Program };
