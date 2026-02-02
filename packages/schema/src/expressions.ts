import {
  Parser as ExpressionParser,
  type Value as ExpressionValue,
} from 'expr-eval';

export { ExpressionParser, type ExpressionValue };

export type Frame = Map<string, ExpressionValue>;

export interface IVariableStack {
  get globals(): Frame;
  get currentFrame(): Frame;
  flatten(): Record<string, ExpressionValue>;
  get(name: string): ExpressionValue | undefined;
  pushFrame(): void;
  popFrame(): void;
}

export class VariableStack implements IVariableStack {
  private globals_: Frame;
  private frames_: Array<Frame>;

  constructor(globals?: Record<string, ExpressionValue>) {
    this.globals_ = new Map(Object.entries(globals || {}));
    this.frames_ = [];
  }

  get globals(): Frame {
    return this.globals_;
  }

  get currentFrame(): Frame {
    return this.frames_.at(-1) ?? this.globals;
  }

  flatten(): Record<string, ExpressionValue> {
    const values = Object.fromEntries(this.globals_.entries());
    for (const frame of this.frames_) {
      for (const [key, value] of frame) {
        values[key] = value;
      }
    }
    return values;
  }

  get(name: string): ExpressionValue | undefined {
    for (let i = this.frames_.length - 1; i >= 0; i--) {
      const frame = this.frames_[i]!;
      const val = frame.get(name);
      if (val !== undefined) return val;
    }

    return this.globals_.get(name);
  }

  pushFrame() {
    this.frames_.push(new Map());
  }

  popFrame() {
    this.frames_.pop();
  }
}

export interface ExpressionContext {
  parser: ExpressionParser;
  stack: IVariableStack;
}
