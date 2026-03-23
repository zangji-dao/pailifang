import { Router } from 'express';
import {
  getIndustries,
  getIndustryById,
  createIndustry,
  updateIndustry,
  deleteIndustry,
  updateIndustriesOrder,
} from '../controllers/industryController';

const router = Router();

// 获取所有行业列表
router.get('/', getIndustries);

// 获取单个行业
router.get('/:id', getIndustryById);

// 创建行业
router.post('/', createIndustry);

// 更新行业
router.put('/:id', updateIndustry);

// 删除行业
router.delete('/:id', deleteIndustry);

// 批量更新排序
router.post('/reorder', updateIndustriesOrder);

export default router;
