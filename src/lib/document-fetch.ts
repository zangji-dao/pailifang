import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { PDFParse } from 'pdf-parse';

export interface RemoteDocument {
  url: string;
  title: string;
  text: string;
  links: string[];
}

const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;

function isPrivateAddress(address: string): boolean {
  if (address === '::1' || address.startsWith('fc') || address.startsWith('fd') || address.startsWith('fe80:')) {
    return true;
  }

  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) {
    return false;
  }

  return parts[0] === 10
    || parts[0] === 127
    || (parts[0] === 169 && parts[1] === 254)
    || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    || (parts[0] === 192 && parts[1] === 168);
}

async function validateRemoteUrl(input: string): Promise<URL> {
  const url = new URL(input);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('仅支持 HTTP/HTTPS 文档地址');
  }

  if (url.hostname === 'localhost') {
    throw new Error('不允许访问本机地址');
  }

  const addresses = isIP(url.hostname)
    ? [{ address: url.hostname }]
    : await lookup(url.hostname, { all: true });

  if (addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error('不允许访问内网地址');
  }

  return url;
}

function decodeHtml(text: string): string {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractHtmlMetadata(html: string, baseUrl: URL): Pick<RemoteDocument, 'title' | 'text' | 'links'> {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const links = Array.from(html.matchAll(/<a\s[^>]*href=["']([^"']+)["']/gi))
    .flatMap((match) => {
      try {
        return [new URL(match[1], baseUrl).toString()];
      } catch {
        return [];
      }
    });

  return {
    title: titleMatch ? decodeHtml(titleMatch[1]) : baseUrl.pathname.split('/').pop() || baseUrl.hostname,
    text: decodeHtml(html),
    links: Array.from(new Set(links)),
  };
}

export async function fetchRemoteDocument(input: string): Promise<RemoteDocument> {
  let currentUrl = await validateRemoteUrl(input);

  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    const response = await fetch(currentUrl, {
      redirect: 'manual',
      headers: { 'User-Agent': 'PiCube/1.0 document fetcher' },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        throw new Error(`文档重定向缺少 Location: HTTP ${response.status}`);
      }
      currentUrl = await validateRemoteUrl(new URL(location, currentUrl).toString());
      continue;
    }

    if (!response.ok) {
      throw new Error(`文档下载失败: HTTP ${response.status}`);
    }

    const contentLength = Number(response.headers.get('content-length') || '0');
    if (contentLength > MAX_DOCUMENT_BYTES) {
      throw new Error('文档超过 20MB 限制');
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_DOCUMENT_BYTES) {
      throw new Error('文档超过 20MB 限制');
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/pdf') || currentUrl.pathname.toLowerCase().endsWith('.pdf')) {
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        return {
          url: currentUrl.toString(),
          title: currentUrl.pathname.split('/').pop() || 'PDF document',
          text: result.text,
          links: [],
        };
      } finally {
        await parser.destroy();
      }
    }

    const html = buffer.toString('utf8');
    return {
      url: currentUrl.toString(),
      ...extractHtmlMetadata(html, currentUrl),
    };
  }

  throw new Error('文档重定向次数过多');
}
