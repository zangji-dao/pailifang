import { Building2, DollarSign, Wallet, FileSignature, CheckCircle2, Search, Users, Plus } from "lucide-react";

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

// 合同创建流程的大步骤配置
export const mainSteps: MainStep[] = [
  {
    id: "enterprise",
    title: "选择企业",
    description: "选择入驻企业",
    icon: Building2,
    status: "pending",
    subSteps: [
      {
        id: "search",
        title: "搜索企业",
        description: "搜索并选择入驻企业",
        icon: Search,
      },
      {
        id: "confirm",
        title: "确认企业",
        description: "确认企业基本信息",
        icon: Users,
      },
    ],
  },
  {
    id: "service_fee",
    title: "服务费",
    description: "场地类型和服务费",
    icon: DollarSign,
    status: "pending",
    subSteps: [
      {
        id: "select_space",
        title: "场地与费用",
        description: "选择场地类型、数量和服务费",
        icon: DollarSign,
      },
    ],
  },
  {
    id: "deposit",
    title: "押金",
    description: "押金和其他费用",
    icon: Wallet,
    status: "pending",
    subSteps: [
      {
        id: "deposit_items",
        title: "押金明细",
        description: "添加押金项目",
        icon: Plus,
      },
    ],
  },
  {
    id: "contract",
    title: "合同信息",
    description: "甲乙方和期限",
    icon: FileSignature,
    status: "pending",
    subSteps: [
      {
        id: "party_info",
        title: "甲乙方信息",
        description: "确认甲乙方基本信息",
        icon: Building2,
      },
      {
        id: "duration",
        title: "服务期限",
        description: "填写服务期限",
        icon: FileSignature,
      },
    ],
  },
  {
    id: "complete",
    title: "创建完成",
    description: "确认并创建合同",
    icon: CheckCircle2,
    status: "pending",
    subSteps: [
      {
        id: "review",
        title: "信息确认",
        description: "确认所有合同信息",
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
  currentSubStepId: string
): { mainStepId: string; subStepId: string } | null {
  const index = getStepIndex(currentMainStepId, currentSubStepId);
  if (!index) return null;

  const { mainIndex, subIndex } = index;
  const currentMainStep = mainSteps[mainIndex];

  // 检查当前大步骤是否有下一个子步骤
  if (subIndex < currentMainStep.subSteps.length - 1) {
    const nextSubStep = currentMainStep.subSteps[subIndex + 1];
    return { mainStepId: currentMainStepId, subStepId: nextSubStep.id };
  }

  // 移动到下一个大步骤的第一个子步骤
  if (mainIndex < mainSteps.length - 1) {
    const nextMainStep = mainSteps[mainIndex + 1];
    return { mainStepId: nextMainStep.id, subStepId: nextMainStep.subSteps[0].id };
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

// 步骤颜色配置 - 使用语义化变量
export const stepColors: Record<string, { bg: string; text: string; light: string; ring: string }> = {
  enterprise: {
    bg: "bg-step-sky",
    text: "text-step-sky",
    light: "bg-step-sky-muted",
    ring: "ring-step-sky/30",
  },
  service_fee: {
    bg: "bg-step-violet",
    text: "text-step-violet",
    light: "bg-step-violet-muted",
    ring: "ring-step-violet/30",
  },
  deposit: {
    bg: "bg-step-amber",
    text: "text-step-amber",
    light: "bg-step-amber-muted",
    ring: "ring-step-amber/30",
  },
  contract: {
    bg: "bg-step-rose",
    text: "text-step-rose",
    light: "bg-step-rose-muted",
    ring: "ring-step-rose/30",
  },
  complete: {
    bg: "bg-step-emerald",
    text: "text-step-emerald",
    light: "bg-step-emerald-muted",
    ring: "ring-step-emerald/30",
  },
};
