/**
 * Quill 编辑器测试页面
 * 验证选区管理功能
 */
'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import QuillEditor, { QuillEditorRef } from '@/components/QuillEditor';

// 示例 HTML 内容
const SAMPLE_HTML = `
<h1 style="text-align: center;"><span style="font-family: SimHei; font-size: 22pt;">合同模板标题</span></h1>
<p><span style="font-family: SimSun; font-size: 12pt;"><strong>甲方：</strong>{{企业名称}}<br/><strong>乙方：</strong>{{乙方名称}}<br/><strong>签订日期：</strong>{{签订日期}}</span></p>
<h2><span style="font-family: SimHei; font-size: 16pt;">一、合同条款</span></h2>
<p style="text-align: justify;"><span style="font-family: SimSun; font-size: 12pt;">根据《中华人民共和国民法典》及相关法律法规的规定，甲乙双方本着平等自愿、诚实信用的原则，就相关事宜达成如下协议：</span></p>
<p style="text-align: justify;"><span style="font-family: SimSun; font-size: 12pt;">1.1 甲方同意将位于{{地址}}的房屋出租给乙方使用。<br/>1.2 租赁期限为{{租赁期限}}年，自{{开始日期}}起至{{结束日期}}止。<br/>1.3 租金为人民币{{租金金额}}元/月，押金为人民币{{押金金额}}元。</span></p>
<h2><span style="font-family: SimHei; font-size: 16pt;">二、双方权利义务</span></h2>
<p style="text-align: justify;"><span style="font-family: SimSun; font-size: 12pt;">2.1 甲方应保证房屋符合出租条件，并负责房屋的主体结构维修。<br/>2.2 乙方应按时支付租金，并合理使用房屋及其设施。<br/>2.3 乙方不得擅自改变房屋结构或用途。</span></p>
<div style="text-align: right;"><span style="font-family: SimSun; font-size: 12pt;"><p>甲方签章：____________</p><p>乙方签章：____________</p><p>签订日期：{{签订日期}}</p></span></div>
`;

export default function QuillTestPage() {
  const [html, setHtml] = useState(SAMPLE_HTML);
  const editorRef = useRef<QuillEditorRef>(null);

  const handleChange = (newHtml: string) => {
    setHtml(newHtml);
  };

  const handleCopy = () => {
    if (editorRef.current) {
      navigator.clipboard.writeText(editorRef.current.getHTML());
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Quill 编辑器测试</h1>
      <p className="text-muted-foreground mb-6">
        <strong>选中文字后，点击工具栏按钮设置格式</strong> - Quill 的选区管理非常稳定
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 编辑器 */}
        <Card className="overflow-hidden">
          <CardHeader className="py-2 border-b">
            <CardTitle className="text-base">编辑区域</CardTitle>
          </CardHeader>
          <CardContent className="p-4 bg-gray-100">
            <div className="bg-white shadow-lg p-4 min-h-[500px]">
              <QuillEditor
                ref={editorRef}
                initialContent={SAMPLE_HTML}
                onChange={handleChange}
                placeholder="请输入合同内容..."
              />
            </div>
          </CardContent>
        </Card>

        {/* HTML 输出 */}
        <Card className="overflow-hidden">
          <CardHeader className="py-2 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">HTML 输出</CardTitle>
              <Button variant="outline" size="sm" onClick={handleCopy}>
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
            <li>在编辑器中选中一段文字</li>
            <li>点击工具栏的<strong>字体</strong>下拉框选择字体</li>
            <li>点击工具栏的<strong>字号</strong>下拉框选择字号</li>
            <li>点击工具栏的<strong>公文格式</strong>下拉框应用预设</li>
            <li>点击<strong>加粗、斜体、下划线</strong>等按钮</li>
            <li><strong>观察选区是否保持，格式是否正确应用</strong></li>
          </ol>
        </CardContent>
      </Card>

      {/* 功能说明 */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Quill 编辑器特性</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>✅ 选区管理稳定，不会丢失选区</li>
            <li>✅ 支持自定义字体（宋体、黑体、楷体、仿宋、微软雅黑）</li>
            <li>✅ 支持自定义字号（10pt - 24pt）</li>
            <li>✅ 支持公文格式预设（一键应用）</li>
            <li>✅ 支持行高设置</li>
            <li>✅ 支持对齐方式（左对齐、居中、右对齐、两端对齐）</li>
            <li>✅ 开源免费，社区活跃</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
