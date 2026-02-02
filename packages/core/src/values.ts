export interface Object<T> {
  [key: string]: T;
}

export type Value =
  | number
  | string
  | boolean
  | null
  | undefined
  | Array<Value>
  | Object<Value>
  | Map<string, Value>;

export type Output = Map<string, Value>;
