import type { Value } from '@/values.js';

export type RemoteObjectId = string;

export interface RemoteObject {
  // TODO: Add remaining fields
  objectId?: RemoteObjectId;
  value: Value;
}

export interface ExceptionDetails {
  // TODO: Add remaining fields
  text: string;
}

export interface PropertyDescriptor {
  // TODO: Add remaining fields
  name: string;
  value?: RemoteObject;
}
