import * as BinaryExpression from './nodes/binary-expression.js';
import * as Literal from './nodes/Literal.js';
import * as Statement from './nodes/Statement.js';
import * as UnaryExpression from './nodes/unary-expression.js';
import { ParseToken } from './tokens/parse-token.js';
import { Keywords } from './keywords.js';
import { Program } from './nodes/program.js';
import { Variable } from './nodes/Variable.js';

export default class Parser {
    constructor(it) {
        this.it = it;
        this.nextToken = null;

        this.advance();
    }

    advance() {
        const token = this.it.next().value;

        this.nextToken = new ParseToken(token.type, token.value);
    }

    consume(expected) {
        const currentToken = this.nextToken;

        if (this.nextToken.type !== expected) {
            if (this.nextToken.type === 'eof') {
                throw SyntaxError(
                    `Unexpected end of file, missing ${expected} at ...`,
                );
            }

            if (expected === 'tab') {
                throw SyntaxError(`Missing indentation at ...`);
            }

            throw SyntaxError(
                `Expected token of type ${expected}, but got one of ${this.type} instead`,
            );
        }

        this.advance();

        return currentToken.value;
    }

    parse() {
        return this.parseProgram();
    }

    /**
     * <Program>
     *  : <Statement> <Program>
     *  | empty
     *  ;
     */
    parseProgram() {
        const statements = [];
        let matched = true;

        while (matched) {
            this.nextToken
                .match('eof', () => {
                    matched = false;
                    return new Statement.Empty();
                })
                .else(() => {
                    statements.push(this.parseStatement());
                });
        }

        return new Program(statements);
    }

    /**
     * <Statement>
     *  : <If>
     *  | <Assignment>
     *  | <Input>
     *  | <Output>
     *  | <Expression>
     *  ;
     */
    parseStatement() {
        return this.nextToken
            .match(Keywords.FOR, () => this.parseFor())
            .match(Keywords.IF, () => this.parseIf())
            .match(Keywords.INPUT, () => this.parseInput())
            .match(Keywords.PRINT, () => this.parseOutput())
            .match('id', () => this.parseAssignment())
            .else(() => this.parseExpression())
            .result();
    }

    /**
     * <For>
     *  : "ulangi" <Identifier> "dari" <Expression> "sampe" <For-block>
     *  ;
     */
    parseFor() {
        this.advance();

        const identifier = this.parseIdentifier();

        this.consume(Keywords.RANGE_START);
        const start = this.parseExpression();

        this.consume(Keywords.RANGE_END);
        const end = this.parseExpression();

        const block = this.parseForBlock();
        this.advance();

        return new Statement.For(identifier, start, end, block);
    }

    /**
     * <For-block>
     *  : <Statement> <For-block>
     *  | empty
     *  ;
     */
    parseForBlock() {
        const statements = [];
        let matched = true;

        while (matched) {
            this.nextToken
                .match(Keywords.END, () => {
                    matched = false;
                    return new Statement.Empty();
                })
                .match('eof', () => {
                    this.consume(Keywords.END);
                })
                .else(() => {
                    statements.push(this.parseStatement());
                });
        }

        return new Statement.Multiple(statements);
    }

    /**
     * <If>
     *  : "kalo" <Expression> <If-block> <If-end>
     *  ;
     */
    parseIf() {
        this.advance();

        const condition = this.parseExpression();
        const trueBlock = this.parseIfBlock();
        const falseBlock = this.parseIfEnd();

        return new Statement.If(condition, trueBlock, falseBlock);
    }

    /**
     * <If-block>
     *  : <Statement> <If-block>
     *  | empty
     *  ;
     */
    parseIfBlock() {
        const statements = [];
        let matched = true;

        while (matched) {
            this.nextToken
                .matchAny(
                    [Keywords.END, Keywords.ELSEIF, Keywords.ELSE],
                    () => {
                        matched = false;
                        return new Statement.Empty();
                    },
                )
                .match('eof', () => {
                    this.consume(Keywords.END);
                })
                .else(() => {
                    statements.push(this.parseStatement());
                });
        }

        return new Statement.Multiple(statements);
    }

    /**
     * <If-end>
     *  : "kalogak" <Expression> <If-block> <If-end>
     *  | "lainnya" <If-block> "yaudah"
     *  | "yaudah"
     *  ;
     */
    parseIfEnd() {
        return this.nextToken
            .match(Keywords.ELSEIF, () => {
                return this.parseIf();
            })
            .match(Keywords.ELSE, () => {
                this.advance();
                const block = this.parseIfBlock();
                this.advance();
                return block;
            })
            .match(Keywords.END, () => {
                this.advance();
                return new Statement.Empty();
            })
            .result();
    }

    /**
     * <Input>
     *  : "baca" <Identifier>
     *  ;
     */
    parseInput() {
        this.advance();
        const identifier = this.parseIdentifier();
        return new Statement.Input(identifier);
    }

    /**
     * <Output>
     *  : "tulis" <Expression>
     *  ;
     */
    parseOutput() {
        this.advance();
        const expression = this.parseExpression();
        return new Statement.Print(expression);
    }

    /**
     * <Assignment>
     *  : identifier "itu" <Expression>
     *  ;
     */
    parseAssignment() {
        const identifier = this.parseIdentifier();
        this.consume(Keywords.ASSIGN);
        return new Statement.Assignment(identifier, this.parseExpression());
    }

    /**
     * <Expression>
     *  : <Expression> "dan" <Expression>
     *  | <Expression> "atau" <Expression>
     *  | "bukan" <Expression>
     *  | <CompExpression>
     *  ;
     */
    // TODO: refactor this sometime
    parseExpression() {
        let left = this.parseCompExpression();
        let matched = true;

        while (matched) {
            left = this.nextToken
                .match(Keywords.NOT, () => {
                    this.advance();
                    return new UnaryExpression.Not(this.parseExpression());
                })
                .match(Keywords.AND, () => {
                    this.advance();
                    return new BinaryExpression.And(
                        left,
                        this.parseCompExpression(),
                    );
                })
                .match(Keywords.OR, () => {
                    this.advance();
                    return new BinaryExpression.Or(
                        left,
                        this.parseCompExpression(),
                    );
                })
                .else(() => {
                    matched = false;
                    return left;
                })
                .result();
        }

        return left;
    }

    /**
     * <CompExpression>
     *  : <ArithExpression> ">" <ArithExpression>
     *  | <ArithExpression> ">=" <ArithExpression>
     *  | <ArithExpression> "<" <ArithExpression>
     *  | <ArithExpression> "<=" <ArithExpression>
     *  | <ArithExpression> "==" <ArithExpression>
     *  | <ArithExpression> "!=" <ArithExpression>
     *  | <ArithExpression>
     */
    parseCompExpression() {
        const left = this.parseArithExpression();

        return this.nextToken
            .match('>', () => {
                this.advance();
                return new BinaryExpression.GT(
                    left,
                    this.parseArithExpression(),
                );
            })
            .match('<', () => {
                this.advance();
                return new BinaryExpression.LT(
                    left,
                    this.parseArithExpression(),
                );
            })
            .match('<=', () => {
                this.advance();
                return new BinaryExpression.LTE(
                    left,
                    this.parseArithExpression(),
                );
            })
            .match('>=', () => {
                this.advance();
                return new BinaryExpression.GTE(
                    left,
                    this.parseArithExpression(),
                );
            })
            .match('!=', () => {
                this.advance();
                return new BinaryExpression.NotEqual(
                    left,
                    this.parseArithExpression(),
                );
            })
            .match('==', () => {
                this.advance();
                return new BinaryExpression.Equal(
                    left,
                    this.parseArithExpression(),
                );
            })
            .else(() => left)
            .result();
    }

    /**
     * <ArithExpression>
     *  : <ArithExpression> "+" <ArithExpression>
     *  | <ArithExpression> "-" <ArithExpression>
     *  | <Term>
     *  ;
     */
    parseArithExpression() {
        let left = this.parseTerm();
        let matched = true;

        while (matched) {
            left = this.nextToken
                .match('+', () => {
                    this.advance();
                    return new BinaryExpression.Add(left, this.parseTerm());
                })
                .match('-', () => {
                    this.advance();
                    return new BinaryExpression.Subtract(
                        left,
                        this.parseTerm(),
                    );
                })
                .else(() => {
                    matched = false;
                    return left;
                })
                .result();
        }

        return left;
    }

    /**
     * <Term>
     *  : <Term> "*" <Term>
     *  | <Term> "/" <Term>
     *  | <Unary>
     *  ;
     */
    parseTerm() {
        let left = this.parseUnary();
        let matched = true;

        while (matched) {
            left = this.nextToken
                .match('*', () => {
                    this.advance();
                    return new BinaryExpression.Multiply(
                        left,
                        this.parseUnary(),
                    );
                })
                .match('/', () => {
                    this.advance();
                    return new BinaryExpression.Divide(left, this.parseUnary());
                })
                .match('%', () => {
                    this.advance();
                    return new BinaryExpression.Modulo(left, this.parseUnary());
                })
                .else(() => {
                    matched = false;
                    return left;
                })
                .result();
        }

        return left;
    }

    /**
     * <Unary>
     *  : "-" number
     *  | "bukan" <Expression>
     *  | <Literal>
     *  ;
     */
    parseUnary() {
        return this.nextToken
            .match('-', () => {
                this.advance();
                return new UnaryExpression.Negative(this.parseNumber());
            })
            .else(() => this.parseLiteral())
            .result();
    }

    /**
     * <Literal>
     *  : "(" <Expression> ")"
     *  | boolean
     *  | number
     *  | string
     *  | identifier
     *  ;
     */
    parseLiteral() {
        return this.nextToken
            .match('(', () => {
                this.advance();
                const expression = this.parseExpression();
                this.consume(')');
                return expression;
            })
            .matchAny([Keywords.TRUE, Keywords.FALSE], () =>
                this.parseBoolean(),
            )
            .match('num', () => this.parseNumber())
            .match('str', () => this.parseString())
            .match('id', () => this.parseIdentifier())
            .result();
    }

    /**
     * identifier
     */
    parseIdentifier() {
        const value = this.consume('id');
        return new Variable(value);
    }

    /**
     * boolean
     */
    parseBoolean() {
        return this.nextToken
            .match(Keywords.TRUE, () => {
                this.advance();
                return new Literal.Boolean(true);
            })
            .match(Keywords.FALSE, () => {
                this.advance();
                return new Literal.Boolean(false);
            })
            .result();
    }

    /**
     * number
     */
    parseNumber() {
        const value = this.consume('num');
        return new Literal.Number(Number(value));
    }

    /**
     * string
     */
    parseString() {
        const value = this.consume('str');
        return new Literal.String(value);
    }
}
