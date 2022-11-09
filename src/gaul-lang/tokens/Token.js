class Token {
  constructor (type) {
    this.type = type;
  }
}

class Symbol extends Token {}

class Keyword extends Token {}

class EOF extends Token {
  constructor () {
    super("eof");
  }
}

class Tab extends Token {
  constructor () {
    super("tab");
  }
}

class NewLine extends Token {
  constructor () {
    super("newline");
  }
}

class Num extends Token {
  constructor (value) {
    super("num");
    this.value = value;
  }
}

class Str extends Token {
  constructor (value) {
    super("str");
    this.value = value;
  }
}

class Id extends Token {
  constructor (value) {
    super("id");
    this.value = value;
  }
}

export { EOF, Tab, NewLine, Keyword, Num, Str, Symbol, Id };
