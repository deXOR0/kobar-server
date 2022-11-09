export default class PeekableIterator {
  constructor (string) {
    this.it = string[Symbol.iterator]();
    this.#peekNext();
  }

  #peekNext () {
    this.peek = this.it.next();
  }

  [Symbol.iterator] () {
    return this;
  }

  next () {
    const { value, done } = this.peek;

    if (done) {
      return { value: { current: undefined, next: undefined }, done: true };
    }

    this.#peekNext();

    return { value: { current: value, next: this.peek.value }, done: false };
  }
}
