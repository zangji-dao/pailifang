import { 
  MapPin, 
  FileText, 
  PenTool, 
  CreditCard, 
  CheckCircle2,
  Building2,
  Store,
  Hash,
  Upload,
  User,
  FileSignature,
  Receipt,
  BadgeCheck
} from "lucide-react";

// 子步骤定义
export interface SubStep {
  id: string;
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  isOptional?: boolean;
}

// 大步骤定义
export interface MainStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  subSteps: SubStep[];
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
}

// 入驻流程的大步骤配置
export const mainSteps: MainStep[] = [
  {
    id: "address",
    title: "分配地址",
    description: "选择基地和工位号",
    icon: MapPin,
    status: "pending",
    subSteps: [
      {
        id: "select_base",
        title: "选择基地",
        description: "选择入驻的合作基地",
        icon: Building2,
      },
      {
        id: "select_type",
        title: "选择类型",
        description: "选择企业入驻类型",
        icon: Store,
      },
      {
        id: "select_station",
        title: "选择工位",
        description: "选择可用工位号",
        icon: Hash,
        isOptional: true, // 非入驻企业可跳过
      },
      {
        id: "upload_proof",
        title: "上传证明",
        description: "上传房屋产权证明",
        icon: Upload,
        isOptional: true, // 非入驻企业可跳过
      },
      {
        id: "confirm_info",
        title: "确认信息",
        description: "确认企业基本信息",
        icon: User,
      },
    ],
  },
  {
    id: "registration",
    title: "工商注册",
    description: "上传工商执照",
    icon: FileText,
    status: "pending",
    subSteps: [
      {
        id: "upload_license",
        title: "上传执照",
        description: "上传营业执照照片",
        icon: Upload,
      },
      {
        id: "fill_info",
        title: "填写信息",
        description: "填写工商注册信息",
        icon: FileText,
      },
    ],
  },
  {
    id: "contract",
    title: "签订合同",
    description: "电子合同签订",
    icon: PenTool,
    status: "pending",
    subSteps: [
      {
        id: "review_contract",
        title: "查看合同",
        description: "查看合同条款",
        icon: FileText,
      },
      {
        id: "sign_contract",
        title: "签署合同",
        description: "电子签名确认",
        icon: FileSignature,
      },
    ],
  },
  {
    id: "payment",
    title: "费用缴纳",
    description: "缴纳相关费用",
    icon: CreditCard,
    status: "pending",
    subSteps: [
      {
        id: "view_fees",
        title: "查看费用",
        description: "查看应缴费用明细",
        icon: Receipt,
      },
      {
        id: "upload_payment",
        title: "上传凭证",
        description: "上传缴费凭证",
        icon: Upload,
      },
      {
        id: "confirm_payment",
        title: "确认缴费",
        description: "确认缴费完成",
        icon: BadgeCheck,
      },
    ],
  },
  {
    id: "complete",
    title: "入驻完成",
    description: "完成入驻流程",
    icon: CheckCircle2,
    status: "pending",
    subSteps: [
      {
        id: "review_all",
        title: "信息确认",
        description: "确认所有入驻信息",
        icon: CheckCircle2,
      },
    ],
  },
];

// 获取步骤索引
export function getStepIndex(mainStepId: string, subStepId: string): { mainIndex: number; subIndex: number } | null {
  for (let i = 0; i < mainSteps.length; i++) {
    if (mainSteps[i].id === mainStepId) {
      for (let j = 0; j < mainSteps[i].subSteps.length; j++) {
        if (mainSteps[i].subSteps[j].id === subStepId) {
          return { mainIndex: i, subIndex: j };
        }
      }
    }
  }
  return null;
}

// 获取下一个步骤
export function getNextStep(
  currentMainStepId: string, 
  currentSubStepId: string,
  skipOptional: boolean = false
): { mainStepId: string; subStepId: string } | null {
  const index = getStepIndex(currentMainStepId, currentSubStepId);
  if (!index) return null;

  const { mainIndex, subIndex } = index;
  const currentMainStep = mainSteps[mainIndex];

  // 检查当前大步骤是否有下一个子步骤
  if (subIndex < currentMainStep.subSteps.length - 1) {
    const nextSubStep = currentMainStep.subSteps[subIndex + 1];
    // 如果需要跳过可选步骤且下一个是可选的，继续找
    if (skipOptional && nextSubStep.isOptional) {
      return getNextStep(currentMainStepId, nextSubStep.id, skipOptional);
    }
    return { mainStepId: currentMainStepId, subStepId: nextSubStep.id };
  }

  // 移动到下一个大步骤的第一个子步骤
  if (mainIndex < mainSteps.length - 1) {
    const nextMainStep = mainSteps[mainIndex + 1];
    const firstSubStep = nextMainStep.subSteps[0];
    if (skipOptional && firstSubStep.isOptional) {
      return getNextStep(nextMainStep.id, firstSubStep.id, skipOptional);
    }
    return { mainStepId: nextMainStep.id, subStepId: firstSubStep.id };
  }

  return null; // 已经是最后一步
}

// 获取上一个步骤
export function getPrevStep(
  currentMainStepId: string,
  currentSubStepId: string
): { mainStepId: string; subStepId: string } | null {
  const index = getStepIndex(currentMainStepId, currentSubStepId);
  if (!index) return null;

  const { mainIndex, subIndex } = index;

  // 检查当前大步骤是否有上一个子步骤
  if (subIndex > 0) {
    const prevSubStep = mainSteps[mainIndex].subSteps[subIndex - 1];
    return { mainStepId: currentMainStepId, subStepId: prevSubStep.id };
  }

  // 移动到上一个大步骤的最后一个子步骤
  if (mainIndex > 0) {
    const prevMainStep = mainSteps[mainIndex - 1];
    const lastSubStep = prevMainStep.subSteps[prevMainStep.subSteps.length - 1];
    return { mainStepId: prevMainStep.id, subStepId: lastSubStep.id };
  }

  return null; // 已经是第一步
}

// 计算总体进度
export function calculateProgress(
  completedSteps: Set<string>
): { mainStepId: string; completed: number; total: number }[] {
  return mainSteps.map(step => ({
    mainStepId: step.id,
    completed: step.subSteps.filter(s => completedSteps.has(`${step.id}_${s.id}`)).length,
    total: step.subSteps.length,
  }));
}
