/**
 * 萤石云 API 路由
 */

import { Router, Request, Response } from 'express';
import {
  getDeviceList,
  getCameraList,
  getLiveAddress,
  getLiveAddresses,
  closeLive,
} from '../services/ysWithService';

const router = Router();

/**
 * 关闭直播
 * POST /api/yswith/live/close
 * Body: { deviceSerial, cameraNo? }
 */
router.post('/live/close', async (req: Request, res: Response) => {
  try {
    const { deviceSerial, cameraNo = 1 } = req.body;
    
    if (!deviceSerial) {
      // 关闭所有摄像头的直播
      const cameras = await getCameraList();
      for (const camera of cameras) {
        try {
          await closeLive(camera.deviceSerial, camera.cameraNo);
        } catch (e) {
          // 忽略错误
        }
      }
    } else {
      await closeLive(deviceSerial, cameraNo);
    }
    
    res.json({
      success: true,
      message: '直播已关闭',
    });
  } catch (error: any) {
    console.error('关闭直播失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '关闭直播失败',
    });
  }
});

/**
 * 获取设备列表
 * GET /api/yswith/devices
 */
router.get('/devices', async (req: Request, res: Response) => {
  try {
    const devices = await getDeviceList();
    res.json({
      success: true,
      data: devices,
    });
  } catch (error: any) {
    console.error('获取设备列表失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取设备列表失败',
    });
  }
});

/**
 * 获取摄像头列表
 * GET /api/yswith/cameras
 */
router.get('/cameras', async (req: Request, res: Response) => {
  try {
    const cameras = await getCameraList();
    res.json({
      success: true,
      data: cameras,
    });
  } catch (error: any) {
    console.error('获取摄像头列表失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取摄像头列表失败',
    });
  }
});

/**
 * 获取单个摄像头的直播地址
 * GET /api/yswith/live/:deviceSerial/:cameraNo?
 */
router.get('/live/:deviceSerial/:cameraNo?', async (req: Request, res: Response) => {
  try {
    const { deviceSerial, cameraNo = '1' } = req.params;
    const quality = (req.query.quality as 'standard' | 'hd') || 'standard';
    
    const address = await getLiveAddress(deviceSerial, parseInt(cameraNo, 10), quality);
    res.json({
      success: true,
      data: address,
    });
  } catch (error: any) {
    console.error('获取直播地址失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取直播地址失败',
    });
  }
});

/**
 * 批量获取直播地址
 * POST /api/yswith/live/batch
 * Body: { sources: [{ deviceSerial, cameraNo }] }
 */
router.post('/live/batch', async (req: Request, res: Response) => {
  try {
    const { sources } = req.body;
    
    if (!sources || !Array.isArray(sources) || sources.length === 0) {
      res.status(400).json({
        success: false,
        error: '请提供摄像头列表',
      });
      return;
    }
    
    const addresses = await getLiveAddresses(sources);
    res.json({
      success: true,
      data: addresses,
    });
  } catch (error: any) {
    console.error('批量获取直播地址失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '批量获取直播地址失败',
    });
  }
});

/**
 * 获取所有摄像头及直播地址
 * GET /api/yswith/all
 * Query: closeFirst=1 先关闭所有直播再获取
 */
router.get('/all', async (req: Request, res: Response) => {
  try {
    const { closeFirst, camera } = req.query;
    
    // 获取摄像头列表
    const cameras = await getCameraList();
    
    // 如果指定了关闭直播
    if (closeFirst === '1') {
      console.log('先关闭所有直播...');
      for (const cam of cameras) {
        try {
          await closeLive(cam.deviceSerial, cam.cameraNo);
        } catch (e) {
          // 忽略错误
        }
      }
      // 等待一下让服务器处理
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 如果指定了单个摄像头
    let targetCameras = cameras;
    if (camera) {
      targetCameras = cameras.filter(c => c.deviceSerial === camera);
    }
    
    // 批量获取直播地址
    const sources = targetCameras.map(c => ({
      deviceSerial: c.deviceSerial,
      cameraNo: c.cameraNo,
    }));
    
    let addresses: any[] = [];
    if (sources.length > 0) {
      try {
        addresses = await getLiveAddresses(sources);
      } catch (e) {
        console.error('获取直播地址失败:', e);
      }
    }
    
    // 合并数据
    const result = targetCameras.map(camera => {
      const address = addresses.find(
        a => a.deviceSerial === camera.deviceSerial && a.cameraNo === camera.cameraNo
      );
      return {
        ...camera,
        liveAddress: address || null,
      };
    });
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('获取摄像头列表失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取摄像头列表失败',
    });
  }
});

export default router;
