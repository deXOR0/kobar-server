import * as Token from "./tokens/token.js";
import PeekableIterator from "./peekable-iterator.js";
import { Keywords } from "./keywords.js";

export default class Lexer {
  constructor (it) {
    this.it = new PeekableIterator(it);
  }

  [Symbol.iterator] () {
    return this;
  }

  next () {
    const {
      value: { current, next },
      done,
    } = this.it.next();

    if (done) return { value: new Token.EOF(), done: true };

    if (current.match(/[ \n\t]/)) {
      return this.next();
      // } else if (current === "\t") {
      //   return { value: new Token.Tab(), done: false };
    } else if (current.match(/[()\\[\]]/)) {
      return { value: new Token.Symbol(current), done: false };
    } else if (current.match(/[+\-\\*/%]/)) {
      return { value: new Token.Symbol(current), done: false };
    } else if (current.match(/[=!><]/)) {
      return {
        value: new Token.Symbol(this.#consumeToken(current, next, /=/)),
        done: false,
      };
    } else if (current.match(/[.0-9]/)) {
      return {
        value: new Token.Num(this.#consumeToken(current, next, /[.0-9]/)),
        done: false,
      };
    } else if (current.match(/"/)) {
      return {
        value: new Token.Str(this.#consumeString()),
        done: false,
      };
    } else if (current.match(/\w/)) {
      const token = this.#consumeToken(current, next, /\w/);
      return {
        value: this.#isKeyword(token)
          ? new Token.Keyword(token)
          : new Token.Id(token),
        done: false,
      };
    }

    throw SyntaxError(`Invalid token: '${current}'`);
  }

  #consumeString () {
    let str = "";

    while (true) {
      const { value, done } = this.it.next();

      if (done) throw SyntaxError(`Missing " at end of string at ...`);

      const current = value.current;

      if (current === '"') return str;

      str += current;
    }
  }

  #consumeToken (current, next, matcher) {
    let str = current;

    while (next?.match(matcher)) {
      const { value, done } = this.it.next();

      if (done) return str;

      ({ current, next } = value);

      str += current;
    }

    return str;
  }

  #isKeyword (token) {
    return Object.values(Keywords).includes(token);
  }
}
