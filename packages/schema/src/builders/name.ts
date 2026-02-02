import { Builder } from './base.js';
import { NameType, type Node } from '../types/index.js';

export class NameBuilder extends Builder<Node, string, NameType> {
  override build(): NameType {
    return new NameType(this.params);
  }
}
