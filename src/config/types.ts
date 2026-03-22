/**
 * 配置类型定义
 */

export type Environment = 'development' | 'production';

export interface ApiConfig {
  baseUrl: string;
  prefix: string;
  timeout: number;
}

export interface StorageConfig {
  uploadUrl: string;
  presignedUrlExpiry: number;
  maxFileSize: number;
  allowedTypes: string[];
}

export interface DatabaseConfig {
  url: string;
}

export interface CorsConfig {
  origin: string;
  methods: string[];
  allowedHeaders: string[];
}

export interface FrontendConfig {
  assetPrefix: string;
  imagePlaceholder: string;
}

export interface DebugConfig {
  enabled: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface MapConfig {
  // 高德地图 API Key（Web端）
  amapKey: string;
  // 默认中心点经度
  defaultCenterLng: number;
  // 默认中心点纬度
  defaultCenterLat: number;
  // 默认缩放级别
  defaultZoom: number;
}

export interface AppConfig {
  env: Environment;
  api: ApiConfig;
  backend: ApiConfig;
  storage: StorageConfig;
  database: DatabaseConfig;
  cors: CorsConfig;
  frontend: FrontendConfig;
  debug: DebugConfig;
  map: MapConfig;
}
