/**
 * TipTap 编辑器测试页面
 * 用于验证新编辑器的选区管理功能
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTiptapEditor } from "../hooks/useTiptapEditor";
import { TiptapToolbar } from "../components/TiptapToolbar";

// 示例 HTML 内容
const SAMPLE_HTML = `
<h1 style="text-align: center; font-family: SimHei; font-size: 22pt;">合同模板标题</h1>
<p style="font-family: SimSun; font-size: 12pt; line-height: 1.5;">
  <strong>甲方：</strong>{{企业名称}}<br>
  <strong>乙方：</strong>{{乙方名称}}<br>
  <strong>签订日期：</strong>{{签订日期}}
</p>
<h2 style="font-family: SimHei; font-size: 16pt;">一、合同条款</h2>
<p style="font-family: SimSun; font-size: 12pt; line-height: 1.5; text-align: justify;">
  根据《中华人民共和国民法典》及相关法律法规的规定，甲乙双方本着平等自愿、诚实信用的原则，就相关事宜达成如下协议：
</p>
<p style="font-family: SimSun; font-size: 12pt; line-height: 1.5; text-align: justify;">
  1.1 甲方同意将位于{{地址}}的房屋出租给乙方使用。<br>
  1.2 租赁期限为{{租赁期限}}年，自{{开始日期}}起至{{结束日期}}止。<br>
  1.3 租金为人民币{{租金金额}}元/月，押金为人民币{{押金金额}}元。
</p>
<h2 style="font-family: SimHei; font-size: 16pt;">二、双方权利义务</h2>
<p style="font-family: SimSun; font-size: 12pt; line-height: 1.5; text-align: justify;">
  2.1 甲方应保证房屋符合出租条件，并负责房屋的主体结构维修。<br>
  2.2 乙方应按时支付租金，并合理使用房屋及其设施。<br>
  2.3 乙方不得擅自改变房屋结构或用途。
</p>
<div style="text-align: right; font-family: SimSun; font-size: 12pt; line-height: 1.5;">
  <p>甲方签章：____________</p>
  <p>乙方签章：____________</p>
  <p>签订日期：{{签订日期}}</p>
</div>
`;

export default function TiptapTestPage() {
  const [html, setHtml] = useState(SAMPLE_HTML);

  const { editor, EditorContent, handleApplyPreset } = useTiptapEditor({
    initialContent: SAMPLE_HTML,
    onUpdate: (newHtml: string) => {
      setHtml(newHtml);
      console.log('内容更新:', newHtml.substring(0, 100));
    },
  });

  if (!editor) {
    return <div className="flex items-center justify-center h-screen">加载编辑器...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">TipTap 编辑器测试</h1>
      <p className="text-muted-foreground mb-6">
        测试选区管理功能：选中文字后点击工具栏格式按钮，选区应该不会丢失
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 编辑器 */}
        <Card className="overflow-hidden">
          <CardHeader className="py-2 border-b">
            <CardTitle className="text-base">编辑区域</CardTitle>
          </CardHeader>
          <TiptapToolbar editor={editor} onApplyPreset={handleApplyPreset} />
          <CardContent className="p-4 bg-gray-100 max-h-[600px] overflow-auto">
            <div className="bg-white shadow-lg p-8 min-h-[500px]">
              <EditorContent editor={editor} />
            </div>
          </CardContent>
        </Card>

        {/* HTML 输出 */}
        <Card className="overflow-hidden">
          <CardHeader className="py-2 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">HTML 输出</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(html)}
              >
                复制
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-[600px] whitespace-pre-wrap">
              {html}
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* 测试说明 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">测试步骤</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>在编辑器中选中一段文字（蓝色高亮应该出现）</li>
            <li>点击工具栏的字体、字号、或公文格式下拉框</li>
            <li><strong>关键点：蓝色高亮应该保持不消失</strong></li>
            <li>选择一个选项，格式应该应用到选中文字</li>
            <li>如果选区丢失，说明还有问题需要修复</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
