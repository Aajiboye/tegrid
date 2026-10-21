interface ApiConfigProps {
  apiUrl: string;
  httpTimeout: number;
  defaultCountry: string;
}

interface PaymentConfigProps {
  upfrontReleasePercentage: number;
  paystackSecret: string;
  paystackPublicKey: string;
  callbackUrl: string;
}

export interface ConfigProps {
  port: number;
  api: ApiConfigProps;
  payment: PaymentConfigProps;
  appEnv: string;
  frontEndLink: string;
}
