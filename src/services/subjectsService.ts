/**
 * 科目管理 API 服务
 */

export interface Subject {
  id: string;
  ledger_id: string;
  code: string;
  name: string;
  parent_id: string | null;
  level: number;
  type: "asset" | "liability" | "equity" | "cost" | "profit_loss";
  direction: "debit" | "credit";
  is_leaf: boolean;
  is_active: boolean;
  remark?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSubjectData {
  ledgerId: string;
  code: string;
  name: string;
  parentId?: string | null;
  type: "asset" | "liability" | "equity" | "cost" | "profit_loss";
  direction: "debit" | "credit";
  isActive?: boolean;
  remark?: string;
}

export interface UpdateSubjectData {
  id: string;
  name?: string;
  isActive?: boolean;
  remark?: string;
}

export interface SubjectListParams {
  ledgerId?: string;
  type?: string;
  parentId?: string | null;
  isActive?: boolean;
  search?: string;
}

/**
 * 获取科目列表
 */
export async function getSubjects(params: SubjectListParams = {}): Promise<{ success: boolean; data: Subject[]; error?: string }> {
  try {
    const searchParams = new URLSearchParams();
    
    if (params.ledgerId) searchParams.set("ledgerId", params.ledgerId);
    if (params.type) searchParams.set("type", params.type);
    if (params.parentId !== undefined) searchParams.set("parentId", params.parentId || "null");
    if (params.isActive !== undefined) searchParams.set("isActive", String(params.isActive));
    if (params.search) searchParams.set("search", params.search);

    const response = await fetch(`/api/accounts?${searchParams.toString()}`);
    return await response.json();
  } catch (error) {
    console.error("获取科目列表失败:", error);
    return { success: false, data: [], error: "网络错误" };
  }
}

/**
 * 创建科目
 */
export async function createSubject(data: CreateSubjectData): Promise<{ success: boolean; data?: Subject; error?: string }> {
  try {
    const response = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("创建科目失败:", error);
    return { success: false, error: "网络错误" };
  }
}

/**
 * 更新科目
 */
export async function updateSubject(data: UpdateSubjectData): Promise<{ success: boolean; data?: Subject; error?: string }> {
  try {
    const response = await fetch("/api/accounts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("更新科目失败:", error);
    return { success: false, error: "网络错误" };
  }
}

/**
 * 删除科目
 */
export async function deleteSubject(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/accounts?id=${id}`, {
      method: "DELETE",
    });
    return await response.json();
  } catch (error) {
    console.error("删除科目失败:", error);
    return { success: false, error: "网络错误" };
  }
}

/**
 * 生成科目编码
 * 一级科目: 4位编码 (系统预设)
 * 明细科目: 上级编码 + 2位序号
 */
export function generateSubjectCode(parentCode: string, existingCodes: string[]): string {
  if (!parentCode) {
    // 一级科目不应该使用此方法生成
    throw new Error("一级科目编码为系统预设，不可自动生成");
  }

  // 找出所有以 parentCode 开头的编码
  const childCodes = existingCodes.filter(
    (code) => code.startsWith(parentCode) && code.length === parentCode.length + 2
  );

  if (childCodes.length === 0) {
    return `${parentCode}01`;
  }

  // 找出最大序号
  const maxSeq = childCodes.reduce((max, code) => {
    const seq = parseInt(code.slice(-2), 10);
    return seq > max ? seq : max;
  }, 0);

  // 生成新序号
  const newSeq = maxSeq + 1;
  if (newSeq > 99) {
    throw new Error("明细科目已达到上限（99个）");
  }

  return `${parentCode}${String(newSeq).padStart(2, "0")}`;
}

/**
 * 格式化科目类型显示名称
 */
export function formatSubjectType(type: string): string {
  const typeMap: Record<string, string> = {
    asset: "资产",
    liability: "负债",
    equity: "所有者权益",
    cost: "成本",
    profit_loss: "损益",
  };
  return typeMap[type] || type;
}

/**
 * 格式化余额方向显示名称
 */
export function formatDirection(direction: string): string {
  return direction === "debit" ? "借" : "贷";
}
