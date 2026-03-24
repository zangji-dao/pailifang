import { Building2, FileCheck, FileSignature, CheckCircle2, Search, Users, Landmark } from "lucide-react";

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
    id: "space",
    title: "场地类型",
    description: "选择场地和服务",
    icon: FileCheck,
    status: "pending",
    subSteps: [
      {
        id: "select_space",
        title: "选择场地",
        description: "选择场地类型和数量",
        icon: FileCheck,
      },
    ],
  },
  {
    id: "contract",
    title: "合同信息",
    description: "填写合同详情",
    icon: FileSignature,
    status: "pending",
    subSteps: [
      {
        id: "party_info",
        title: "甲乙方信息",
        description: "确认甲乙方基本信息",
        icon: Landmark,
      },
      {
        id: "fee_duration",
        title: "费用与期限",
        description: "填写费用和服务期限",
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
  space: {
    bg: "bg-step-violet",
    text: "text-step-violet",
    light: "bg-step-violet-muted",
    ring: "ring-step-violet/30",
  },
  contract: {
    bg: "bg-step-amber",
    text: "text-step-amber",
    light: "bg-step-amber-muted",
    ring: "ring-step-amber/30",
  },
  complete: {
    bg: "bg-step-emerald",
    text: "text-step-emerald",
    light: "bg-step-emerald-muted",
    ring: "ring-step-emerald/30",
  },
};
