export type AiMessageContent = string | Array<{
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
    detail?: 'high' | 'low' | 'auto';
  };
}>;

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: AiMessageContent;
}

interface InvokeAiOptions {
  model: string;
  temperature?: number;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
}

type ChatCompletionContent = string | Array<{ type?: string; text?: string }>;

function getTextContent(content?: ChatCompletionContent): string {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content.map((item) => item.text || '').join('');
  }

  return '';
}

export async function invokeAi(messages: AiMessage[], options: InvokeAiOptions): Promise<string> {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');

  if (!apiKey) {
    throw new Error('AI_API_KEY 未配置');
  }
  if (!options.model) {
    throw new Error('AI 模型未配置');
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model,
      messages,
      temperature: options.temperature ?? 0.1,
    }),
  });

  const payload = await response.json() as ChatCompletionResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message || `AI 服务请求失败: HTTP ${response.status}`);
  }

  const content = getTextContent(payload.choices?.[0]?.message?.content);
  if (!content) {
    throw new Error('AI 服务返回了空内容');
  }

  return content;
}
