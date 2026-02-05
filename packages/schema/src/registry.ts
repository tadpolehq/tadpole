import { Builder } from './builders/index.js';
import type { Type } from './types/index.js';

export interface RegistryParams<TIn, TOut, TType extends Type<TIn, TOut>> {
  parent?: IRegistry<TIn, TOut, TType>;
  throwOnDuplicate?: boolean;
}

export interface IRegistry<TIn, TOut, TType extends Type<TIn, TOut>> {
  get(name: string): TType | undefined;
  register(name: string, obj: TType): this;
  register(name: string, obj: Builder<TIn, TOut, TType>): this;
  registerChild(name: string, registry: IRegistry<TIn, TOut, TType>): this;
}

export class Registry<
  TIn,
  TOut,
  TType extends Type<TIn, TOut>,
> implements IRegistry<TIn, TOut, TType> {
  private parent_?: IRegistry<TIn, TOut, TType>;
  private registered_: Map<string, TType>;
  private children_: Map<string, IRegistry<TIn, TOut, TType>>;
  private throwOnDuplicate_: boolean;

  constructor({
    parent,
    throwOnDuplicate,
  }: RegistryParams<TIn, TOut, TType> = {}) {
    this.parent_ = parent;
    this.registered_ = new Map();
    this.children_ = new Map();
    this.throwOnDuplicate_ = throwOnDuplicate ?? true;
  }

  get parent(): IRegistry<TIn, TOut, TType> | undefined {
    return this.parent_;
  }

  get(name: string): TType | undefined {
    const i = name.indexOf('.');
    if (i !== -1) {
      const childName = name.substring(0, i);
      return this.children_?.get(childName)?.get(name.substring(i + 1));
    }

    return this.registered_.get(name) ?? this.parent?.get(name);
  }

  isRegistered(name: string): boolean {
    return this.registered_.get(name) !== undefined;
  }

  register(name: string, obj: TType): this;
  register(name: string, obj: Builder<TIn, TOut, TType>): this;
  register(name: string, obj: TType | Builder<TIn, TOut, TType>): this {
    if (obj instanceof Builder) obj = obj.build();

    const i = name.indexOf('.');
    if (i === -1) {
      if (this.throwOnDuplicate_ && this.registered_.has(name)) {
        throw new Error(`Name ${name} already registered`);
      }

      this.registered_.set(name, obj);
    } else {
      const childName = name.substring(0, i);
      if (!this.children_.has(childName)) {
        this.children_.set(childName, this.createChildRegistry());
      }

      this.children_.get(childName)!.register(name.substring(i + 1), obj);
    }

    return this;
  }

  registerChild(name: string, registry?: IRegistry<TIn, TOut, TType>): this {
    if (registry === undefined) registry = this.createChildRegistry();

    const i = name.indexOf('.');
    if (i === -1) {
      if (this.throwOnDuplicate_ && this.children_.has(name)) {
        throw new Error(`Registry Child Name ${name} already registered`);
      }

      this.children_.set(name, registry);
    } else {
      const childName = name.substring(0, i);
      if (!this.children_.has(childName)) {
        this.children_.set(childName, this.createChildRegistry());
      }

      this.children_
        .get(childName)!
        .registerChild(name.substring(i + 1), registry);
    }

    return this;
  }

  private createChildRegistry(): IRegistry<TIn, TOut, TType> {
    return new Registry({
      parent: this,
      throwOnDuplicate: this.throwOnDuplicate_,
    });
  }
}
