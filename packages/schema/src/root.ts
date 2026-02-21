import { parse } from 'kdljs';
import { readFile } from 'node:fs/promises';
import { Err, Ok, type Result } from 'ts-results-es';
import { SchemaError } from './error.js';
import type { ILoader } from './loader.js';
import { LayoutMetaType } from './meta/index.js';
import type { ISlotStack } from './slots.js';
import {
  Type,
  TypeParseContext,
  type Document,
  type Node,
} from './types/base.js';

export interface RootParams<TOut> {
  meta: LayoutMetaType;
  main: Type<Node, TOut>;
  mainNodeName?: string;
}

export type ProcessResult = Result<void, SchemaError>;
export type ExecuteResult<TOut> = Result<TOut, SchemaError>;

export class Root<TOut> {
  private meta_: LayoutMetaType;
  private main_: Type<Node, TOut>;
  private mainNodeName_: string;

  constructor({ meta, main, mainNodeName }: RootParams<TOut>) {
    this.meta_ = meta;
    this.main_ = main;
    this.mainNodeName_ = mainNodeName ?? 'main';
  }

  get meta(): LayoutMetaType {
    return this.meta_;
  }

  get main(): Type<Node, TOut> {
    return this.main_;
  }

  async process(
    document: Document,
    ctx: TypeParseContext,
  ): Promise<ProcessResult> {
    const result = await this.processDocument_(document, ctx);
    if (result.isErr()) return new Err(result.error);
    return Ok.EMPTY;
  }

  async executeFile(
    filePath: string,
    loader: ILoader,
    slotStack: ISlotStack,
  ): Promise<ExecuteResult<TOut>> {
    const result = await this.readFile_(filePath);
    if (result.isErr()) return new Err(result.error);
    return await this.execute(result.value, {
      filePath,
      loader,
      namespace: [],
      slotStack,
    });
  }

  async execute(
    document: Document,
    ctx: TypeParseContext,
  ): Promise<ExecuteResult<TOut>> {
    const mainNode = await this.processDocument_(document, ctx);
    if (mainNode.isErr()) return new Err(mainNode.error);
    if (mainNode === undefined) {
      return new Err(
        new SchemaError({
          message: `No ${this.mainNodeName_} node found for execution`,
        }),
      );
    }
    return this.main_.parse(mainNode.value, ctx);
  }

  private async readFile_(
    path: string,
  ): Promise<Result<Document, SchemaError>> {
    let text;
    try {
      text = await readFile(path, 'utf-8');
    } catch (err) {
      return new Err(
        new SchemaError({
          message: `Error reading file: ${(err as Error).message}`,
        }),
      );
    }
    const result = parse(text);
    if (result.errors.length) {
      const message = result.errors.map((e) => e.message).join(', ');
      return new Err(
        new SchemaError({ message: `Error parsing KDL: ${message}` }),
      );
    }

    return new Ok(result.output!);
  }

  private async processDocument_(
    document: Document,
    ctx: TypeParseContext,
  ): Promise<Result<Node | undefined, SchemaError>> {
    const metaNodes = [];
    let mainNode;
    for (const node of document) {
      if (node.name === this.mainNodeName_) {
        if (mainNode !== undefined) {
          return new Err(
            new SchemaError({
              message: `Only one ${this.mainNodeName_} may be defined in the document`,
            }),
          );
        }

        mainNode = node;
      } else {
        metaNodes.push(node);
      }
    }

    const metaResult = await this.meta_.parse(metaNodes, ctx);
    if (metaResult.isErr()) {
      return new Err(metaResult.error);
    }

    return new Ok(mainNode);
  }
}
