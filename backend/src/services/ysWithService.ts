/**
 * 萤石云 API 服务
 * 文档: https://open.ys7.com/doc/zh-cn/
 */

import { config } from '../config/env';

// 萤石云 API 基础地址
const YSWITH_API_BASE = 'https://open.ys7.com/api/lapp';

// Token 缓存
let cachedToken: string | null = null;
let tokenExpireTime: number = 0;

/**
 * 获取 AccessToken
 */
export async function getAccessToken(): Promise<string> {
  // 检查缓存（提前5分钟刷新）
  if (cachedToken && Date.now() < tokenExpireTime - 5 * 60 * 1000) {
    return cachedToken;
  }

  const response = await fetch(`${YSWITH_API_BASE}/token/get`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      appKey: config.ysWith.appKey,
      appSecret: config.ysWith.appSecret,
    }),
  });

  const result = await response.json();
  
  if (result.code !== '200' || !result.data) {
    throw new Error(result.msg || '获取AccessToken失败');
  }

  cachedToken = result.data.accessToken;
  tokenExpireTime = result.data.expireTime;
  
  return cachedToken;
}

/**
 * 设备信息
 */
export interface DeviceInfo {
  deviceSerial: string;  // 设备序列号
  deviceName: string;    // 设备名称
  status: number;        // 在线状态：0-离线，1-在线
  defence: number;       // 报警状态
  isEncrypt: number;     // 是否加密
  alarmStatus: number;   // 报警状态
  isDisabled: number;    // 是否禁用
}

/**
 * 摄像头信息
 */
export interface CameraInfo {
  deviceSerial: string;  // 设备序列号
  cameraName: string;    // 摄像头名称
  cameraNo: number;      // 通道号
  status: number;        // 状态：0-离线，1-在线
  isEncrypt: number;     // 是否加密
  videoQuality: number;  // 视频质量
}

/**
 * 直播地址信息
 */
export interface LiveAddress {
  deviceSerial: string;  // 设备序列号
  cameraNo: number;      // 通道号
  rtmp: string;          // RTMP 地址
  hls: string;           // HLS 地址
  flv: string;           // FLV 地址
  ws: string;            // WebSocket 地址
  rtmpHd: string;        // RTMP 高清地址
  hlsHd: string;         // HLS 高清地址
  flvHd: string;         // FLV 高清地址
  wsHd: string;          // WebSocket 高清地址
  expireTime: string;    // 过期时间
}

/**
 * 获取设备列表
 */
export async function getDeviceList(): Promise<DeviceInfo[]> {
  const token = await getAccessToken();
  
  const response = await fetch(`${YSWITH_API_BASE}/device/list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      accessToken: token,
      pageStart: '0',
      pageSize: '50',
    }),
  });

  const result = await response.json();
  
  if (result.code !== '200') {
    throw new Error(result.msg || '获取设备列表失败');
  }

  return result.data || [];
}

/**
 * 获取摄像头列表
 */
export async function getCameraList(): Promise<CameraInfo[]> {
  const token = await getAccessToken();
  
  const response = await fetch(`${YSWITH_API_BASE}/camera/list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      accessToken: token,
      pageStart: '0',
      pageSize: '50',
    }),
  });

  const result = await response.json();
  
  if (result.code !== '200') {
    throw new Error(result.msg || '获取摄像头列表失败');
  }

  return result.data || [];
}

/**
 * 开通直播功能
 */
export async function openLive(deviceSerial: string, cameraNo: number = 1): Promise<void> {
  const token = await getAccessToken();
  
  const response = await fetch(`${YSWITH_API_BASE}/live/video/open`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      accessToken: token,
      source: `${deviceSerial}:${cameraNo}`,
    }),
  });

  const result = await response.json();
  
  if (result.code !== '200' && result.code !== '20013') {
    // 20013 表示已经开通
    throw new Error(result.msg || '开通直播失败');
  }
}

/**
 * 获取直播地址
 */
export async function getLiveAddress(
  deviceSerial: string,
  cameraNo: number = 1,
  quality: 'standard' | 'hd' = 'standard'
): Promise<LiveAddress> {
  const token = await getAccessToken();
  
  // 先尝试开通直播
  try {
    await openLive(deviceSerial, cameraNo);
  } catch (e) {
    // 忽略已开通的错误
  }
  
  const response = await fetch(`${YSWITH_API_BASE}/live/address/get`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      accessToken: token,
      source: `${deviceSerial}:${cameraNo}`,
      protocol: '2',  // 1-rtmp, 2-hls, 3-flv, 4-ws
    }),
  });

  const result = await response.json();
  
  if (result.code !== '200' || !result.data || result.data.length === 0) {
    throw new Error(result.msg || '获取直播地址失败');
  }

  const address = result.data[0];
  
  return {
    deviceSerial: address.deviceSerial,
    cameraNo: address.cameraNo,
    rtmp: address.rtmp || '',
    hls: address.hls || '',
    flv: address.flv || '',
    ws: address.ws || '',
    rtmpHd: address.rtmpHd || '',
    hlsHd: address.hlsHd || '',
    flvHd: address.flvHd || '',
    wsHd: address.wsHd || '',
    expireTime: address.expireTime || '',
  };
}

/**
 * 批量获取直播地址
 */
export async function getLiveAddresses(
  sources: Array<{ deviceSerial: string; cameraNo: number }>
): Promise<LiveAddress[]> {
  // 逐个获取直播地址，更可靠
  const addresses: LiveAddress[] = [];
  
  for (const source of sources) {
    try {
      const address = await getLiveAddress(source.deviceSerial, source.cameraNo);
      addresses.push(address);
    } catch (e) {
      console.error(`获取 ${source.deviceSerial}:${source.cameraNo} 直播地址失败:`, e);
      // 添加空地址
      addresses.push({
        deviceSerial: source.deviceSerial,
        cameraNo: source.cameraNo,
        rtmp: '',
        hls: '',
        flv: '',
        ws: '',
        rtmpHd: '',
        hlsHd: '',
        flvHd: '',
        wsHd: '',
        expireTime: '',
      });
    }
  }
  
  return addresses;
}
