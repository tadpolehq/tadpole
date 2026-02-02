import { Err, Ok, type Result } from 'ts-results-es';
import { SchemaError } from '../error.js';
import {
  NodeArgsTupleType,
  NodePropertiesStructType,
  NodeType,
  OptionalType,
  StringType,
  type Document,
  type Node,
  type TypeParseContext,
} from '../types/index.js';
import { IMetaType } from './base.js';

export const ImportSchema = new NodeType({
  composition: {
    args: new NodeArgsTupleType({ members: [new StringType()] }),
    options: new NodePropertiesStructType({
      members: {
        repo: new OptionalType({
          wrapped: new StringType({
            validators: [
              {
                func: (v: string) => !/\s/.test(v),
                message: 'Repo cannot contain spaces',
              },
            ],
          }),
        }),
        ref: new OptionalType({
          wrapped: new StringType({
            validators: [
              {
                func: (v: string) => /^[a-z0-9]{1}[a-z0-9._/-]+$/i.test(v),
                message: 'Invalid ref',
              },
            ],
          }),
        }),
      },
    }),
  },
});

export type ImportMetaProcessDocument = (
  document: Document,
  ctx: TypeParseContext,
) => Promise<Result<void, SchemaError>>;

export class ImportMetaType implements IMetaType<Node> {
  constructor(private processDocument_: ImportMetaProcessDocument) {}

  async parse(
    value: Node | undefined,
    ctx: TypeParseContext,
  ): Promise<Result<void, SchemaError>> {
    if (value === undefined) return new Err(new SchemaError({ message: '' }));

    const result = ImportSchema.parse(value, ctx);
    if (result.isErr()) {
      return new Err(result.error);
    }

    const [path] = result.value.args;
    const { repo, ref } = result.value.options;
    const loadResult =
      repo === undefined
        ? await ctx.loader.loadFromFilePath(ctx.filePath, path)
        : await ctx.loader.loadFromGitRepo(path, repo, ref);

    if (loadResult.isErr())
      return new Err(
        new SchemaError({
          message: `Import failed: ${loadResult.error.message}`,
        }),
      );

    if (loadResult.value.cached) return Ok.EMPTY;
    return await this.processDocument_(loadResult.value.document, {
      ...ctx,
      filePath: loadResult.value.resolvedPath,
      namespace: [],
    });
  }
}
