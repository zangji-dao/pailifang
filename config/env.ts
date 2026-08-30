export type Environment = 'development' | 'production';

export interface EnvironmentConfig {
  env: Environment;
  isDevelopment: boolean;
  isProduction: boolean;
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
  api: {
    baseUrl: string;
    port: number;
  };
  frontend: {
    baseUrl: string;
    port: number;
  };
  alipay: {
    appId: string;
    redirectUri: string;
  };
}

export function detectEnvironment(): Environment {
  return process.env.NODE_ENV === 'production' ? 'production' : 'development';
}

export function getEnvironmentConfig(): EnvironmentConfig {
  const env = detectEnvironment();
  const isDevelopment = env === 'development';
  const frontendBaseUrl = process.env.APP_URL || (isDevelopment ? 'http://localhost:5000' : '');

  return {
    env,
    isDevelopment,
    isProduction: !isDevelopment,
    database: {
      host: process.env.PG_HOST || 'localhost',
      port: Number.parseInt(process.env.PG_PORT || '5432', 10),
      user: process.env.PG_USER || '',
      password: process.env.PG_PASSWORD || '',
      database: process.env.PG_DATABASE || '',
    },
    api: {
      baseUrl: process.env.BACKEND_URL || 'http://localhost:4001',
      port: Number.parseInt(process.env.BACKEND_PORT || '4001', 10),
    },
    frontend: {
      baseUrl: frontendBaseUrl,
      port: Number.parseInt(process.env.FRONTEND_PORT || '5000', 10),
    },
    alipay: {
      appId: process.env.ALIPAY_APPID || '',
      redirectUri: process.env.ALIPAY_REDIRECT_URI || `${frontendBaseUrl}/api/alipay/callback`,
    },
  };
}

export const config = getEnvironmentConfig();
export const isDevelopment = () => config.isDevelopment;
export const isProduction = () => config.isProduction;
