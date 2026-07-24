interface ApiConfigProps {
  apiUrl: string;
  httpTimeout: number;
  defaultCountry: string;
}

export interface ConfigProps {
  port: number;
  api: ApiConfigProps;
  appEnv: string;
  frontEndLink: string;
}
