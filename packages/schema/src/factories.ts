import {
  BooleanBuilder,
  DefaultBuilder,
  DiscriminatedUnionBuilder,
  DocumentArrayBuilder,
  DocumentRecordBuilder,
  DocumentStructBuilder,
  DocumentTupleBuilder,
  EnumBuilder,
  ExpressionBuilder,
  IntoBuilder,
  NameBuilder,
  NodeArgsArrayBuilder,
  NodeArgsTupleBuilder,
  NodeBuilder,
  NodeChildrenArrayBuilder,
  NodeChildrenRecordBuilder,
  NodeChildrenStructBuilder,
  NodeChildrenTupleBuilder,
  NodePropertiesRecordBuilder,
  NodePropertiesStructBuilder,
  NullableBuilder,
  NumberBuilder,
  OptionalBuilder,
  RegistryUnionBuilder,
  SlotBuilder,
  StringBuilder,
  UnionBuilder,
  type Builder,
  type ExtractTypesFromBuilders,
} from './builders/index.js';
import {
  ImportMetaType,
  LayoutMetaType,
  ModuleMetaType,
  RegisterMetaType,
  type IMetaType,
  type ImportMetaProcessDocument,
} from './meta/index.js';
import type { IRegistry } from './registry.js';
import { Root, type RootParams } from './root.js';
import type { IExpressionValueType, Node, Type, Value } from './types/index.js';

export function anyOf<TOut, TType extends Type<Node, TOut>>(
  registry: IRegistry<Node, TOut, TType>,
) {
  return new RegistryUnionBuilder(registry);
}

export function args<TMembers extends Builder<Value, any, Type<Value, any>>[]>(
  members: [...TMembers],
): NodeArgsTupleBuilder<ExtractTypesFromBuilders<TMembers>> {
  return new NodeArgsTupleBuilder(
    members.map((m) => m.build()) as [...ExtractTypesFromBuilders<TMembers>],
  );
}

export function argsArray<TOut, TWrapped extends Type<Value, TOut>>(
  wrapped: Builder<Value, TOut, TWrapped>,
): NodeArgsArrayBuilder<TOut, TWrapped> {
  return new NodeArgsArrayBuilder(wrapped.build());
}

export function boolean() {
  return new BooleanBuilder();
}

export function children<TOut, TWrapped extends Type<Node, TOut>>(
  wrapped: Builder<Node, TOut, TWrapped>,
): NodeChildrenArrayBuilder<TOut, TWrapped> {
  return new NodeChildrenArrayBuilder(wrapped.build());
}

export function childrenRecord<TOut, TValue extends Type<Node, TOut>>(
  value: Builder<Node, TOut, TValue>,
): NodeChildrenRecordBuilder<TOut, TValue> {
  return new NodeChildrenRecordBuilder(value.build());
}

export function childrenStruct<
  TMembers extends Record<string, Builder<Node, any, Type<Node, any>>>,
>(
  members: TMembers,
): NodeChildrenStructBuilder<ExtractTypesFromBuilders<TMembers>> {
  return new NodeChildrenStructBuilder(
    Object.entries(members).reduce(
      (o, [key, type]) => {
        o[key] = type.build();
        return o;
      },
      {} as Record<string, Type<Node, any>>,
    ) as ExtractTypesFromBuilders<TMembers>,
  );
}

export function childrenTuple<
  TMembers extends Builder<Node, any, Type<Node, any>>[],
>(
  members: [...TMembers],
): NodeChildrenTupleBuilder<ExtractTypesFromBuilders<TMembers>> {
  return new NodeChildrenTupleBuilder(
    members.map((m) => m.build()) as [...ExtractTypesFromBuilders<TMembers>],
  );
}

export function choice<
  TOut,
  TMapping extends Record<string, Builder<Node, TOut, Type<Node, TOut>>>,
>(
  mapping: TMapping,
): DiscriminatedUnionBuilder<TOut, ExtractTypesFromBuilders<TMapping>> {
  return new DiscriminatedUnionBuilder(
    Object.entries(mapping).reduce(
      (o, [key, type]) => {
        o[key] = type.build();
        return o;
      },
      {} as Record<string, Type<Node, TOut>>,
    ) as ExtractTypesFromBuilders<TMapping>,
  );
}

export function document<TOut, TWrapped extends Type<Node, TOut>>(
  wrapped: Builder<Node, TOut, TWrapped>,
): DocumentArrayBuilder<TOut, TWrapped> {
  return new DocumentArrayBuilder(wrapped.build());
}

export function documentRecord<TOut, TValue extends Type<Node, TOut>>(
  value: Builder<Node, TOut, TValue>,
): DocumentRecordBuilder<TOut, TValue> {
  return new DocumentRecordBuilder(value.build());
}

export function documentStruct<
  TMembers extends Record<string, Builder<Node, any, Type<Node, any>>>,
>(
  members: TMembers,
): DocumentStructBuilder<ExtractTypesFromBuilders<TMembers>> {
  return new DocumentStructBuilder(
    Object.entries(members).reduce(
      (o, [key, type]) => {
        o[key] = type.build();
        return o;
      },
      {} as Record<string, Type<Node, any>>,
    ) as ExtractTypesFromBuilders<TMembers>,
  );
}

export function documentTuple<
  TMembers extends Builder<Node, any, Type<Node, any>>[],
>(
  members: [...TMembers],
): DocumentTupleBuilder<ExtractTypesFromBuilders<TMembers>> {
  return new DocumentTupleBuilder(
    members.map((m) => m.build()) as [...ExtractTypesFromBuilders<TMembers>],
  );
}

function default_<
  TOut,
  TWrapped extends Type<Value, TOut> & IExpressionValueType<TOut>,
>(
  wrapped: Builder<Value, TOut, TWrapped>,
  defaultValue: TOut,
): DefaultBuilder<TOut, TWrapped> {
  return new DefaultBuilder(wrapped.build(), defaultValue);
}

function enum_<const T extends string>(values: T[]) {
  return new EnumBuilder(values);
}

export function expression<
  TOut,
  TWrapped extends Type<Value, TOut> & IExpressionValueType<TOut>,
>(wrapped: Builder<Value, TOut, TWrapped>): ExpressionBuilder<TOut, TWrapped> {
  return new ExpressionBuilder(wrapped.build());
}

export function into<TIn, TOut, TWrapped extends Type<TIn, TOut>, TInto>(
  wrapped: Builder<TIn, TOut, TWrapped>,
  into: (value: TOut) => TInto,
): IntoBuilder<TIn, TOut, TWrapped, TInto> {
  return new IntoBuilder(wrapped.build(), into);
}

export function name(): NameBuilder {
  return new NameBuilder();
}

export function node<
  TMap extends Record<string, Builder<Node, any, Type<Node, any>>>,
>(map: TMap): NodeBuilder<ExtractTypesFromBuilders<TMap>> {
  return new NodeBuilder(
    Object.entries(map).reduce(
      (o, [key, type]) => {
        o[key] = type.build();
        return o;
      },
      {} as Record<string, Type<Node, any>>,
    ) as ExtractTypesFromBuilders<TMap>,
  );
}

export function nullable<
  TOut,
  TWrapped extends Type<Value, TOut> & IExpressionValueType<TOut>,
>(wrapped: Builder<Value, TOut, TWrapped>): NullableBuilder<TOut, TWrapped> {
  return new NullableBuilder(wrapped.build());
}

export function number(): NumberBuilder {
  return new NumberBuilder();
}

export function optional<
  TOut,
  TWrapped extends Type<Value, TOut> & IExpressionValueType<TOut>,
>(wrapped: Builder<Value, TOut, TWrapped>): OptionalBuilder<TOut, TWrapped> {
  return new OptionalBuilder(wrapped.build());
}

export function properties<
  TMembers extends Record<string, Builder<Value, any, Type<Value, any>>>,
>(
  members: TMembers,
): NodePropertiesStructBuilder<ExtractTypesFromBuilders<TMembers>> {
  return new NodePropertiesStructBuilder(
    Object.entries(members).reduce(
      (o, [key, type]) => {
        o[key] = type.build();
        return o;
      },
      {} as Record<string, Type<Value, any>>,
    ) as ExtractTypesFromBuilders<TMembers>,
  );
}

export function propertiesRecord<TOut, TValue extends Type<Value, TOut>>(
  value: Builder<Value, TOut, TValue>,
): NodePropertiesRecordBuilder<TOut, TValue> {
  return new NodePropertiesRecordBuilder(value.build());
}

export function slot<TOut, TWrapped extends Type<Node, TOut>>(
  wrapped: Builder<Node, TOut, TWrapped>,
): SlotBuilder<TOut, TWrapped> {
  return new SlotBuilder(wrapped.build());
}

export function string(): StringBuilder {
  return new StringBuilder();
}

export function union<
  TTypes extends Builder<
    Value,
    any,
    Type<Value, any> & IExpressionValueType<any>
  >[],
>(types: [...TTypes]): UnionBuilder<ExtractTypesFromBuilders<TTypes>> {
  return new UnionBuilder(
    types.map((t) => t.build()) as [...ExtractTypesFromBuilders<TTypes>],
  );
}

export { default_ as default, enum_ as enum };

export const meta = {
  import: (processDocument: ImportMetaProcessDocument) =>
    new ImportMetaType(processDocument),
  layout: (layout: Map<string, IMetaType<Node>>) => new LayoutMetaType(layout),
  module: (layout: LayoutMetaType) => new ModuleMetaType(layout),
  register: <TOut>(
    children: Builder<Node, TOut, Type<Node, TOut>>,
    registry: IRegistry<Node, TOut, Type<Node, TOut>>,
  ) => new RegisterMetaType(children, registry),
};

export function root<TOut>({
  main,
  mainNodeName,
  meta,
}: RootParams<TOut>): Root<TOut> {
  return new Root({ main, mainNodeName, meta });
}
