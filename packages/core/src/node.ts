import type { Runtime } from './types/index.js';

export interface NodeParams {
  remoteObjectId: Runtime.RemoteObjectId;
  isCollection?: boolean;
}

export class Node {
  private remoteObjectId_: Runtime.RemoteObjectId;
  private isCollection_: boolean;

  constructor({ remoteObjectId, isCollection = false }: NodeParams) {
    this.remoteObjectId_ = remoteObjectId;
    this.isCollection_ = isCollection;
  }

  get remoteObjectId() {
    return this.remoteObjectId_;
  }

  get isCollection() {
    return this.isCollection_;
  }
}
