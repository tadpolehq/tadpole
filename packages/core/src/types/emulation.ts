export interface UserAgentBrandVersion {
  brand: string;
  version: string;
}

export interface UserAgentMetadata {
  brands: UserAgentBrandVersion[];
  fullVersionList: UserAgentBrandVersion[];
  platform: string;
  platformVersion: string;
  architecture: string;
  model: string;
  mobile: boolean;
  bitness?: string;
}
