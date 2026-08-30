export type Environment = 'development' | 'production';

export interface EnvironmentConfig {
  env: Environment;
  isDevelopment: boolean;
  isProduction: boolean;
  server: {
    port: number;
    bodyLimit: string;
  };
  alipay: {
    appId: string;
    privateKey: string;
    publicKey: string;
    redirectUri: string;
  };
  ysWith: {
    appKey: string;
    appSecret: string;
  };
}

export function detectEnvironment(): Environment {
  return process.env.NODE_ENV === 'production' ? 'production' : 'development';
}

export function getEnvironmentConfig(): EnvironmentConfig {
  const env = detectEnvironment();
  const appUrl = process.env.APP_URL || 'http://localhost:5000';

  return {
    env,
    isDevelopment: env === 'development',
    isProduction: env === 'production',
    server: {
      port: Number.parseInt(process.env.PORT || '4001', 10),
      bodyLimit: process.env.BODY_LIMIT || '50mb',
    },
    alipay: {
      appId: process.env.ALIPAY_APPID || '',
      privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
      publicKey: process.env.ALIPAY_PUBLIC_KEY || '',
      redirectUri: process.env.ALIPAY_REDIRECT_URI || `${appUrl}/api/alipay/callback`,
    },
    ysWith: {
      appKey: process.env.YSWITH_APP_KEY || '',
      appSecret: process.env.YSWITH_APP_SECRET || '',
    },
  };
}

export const config = getEnvironmentConfig();
export const isDevelopment = () => config.isDevelopment;
export const isProduction = () => config.isProduction;
