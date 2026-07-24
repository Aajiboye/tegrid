import { ConfigProps } from './interfaces/IConfig';

export const config = (): ConfigProps => ({
  port: parseInt(process.env.PORT, 10) || 8080,
  api: {
    apiUrl: process.env.API_URL,
    httpTimeout: 1000,
    defaultCountry: process.env.defaultCountry || 'NG',
  },
  appEnv: process.env.APP_ENV || 'development',
  frontEndLink: process.env.FRONTEND_LINK || 'http://localhost:3000',
});
