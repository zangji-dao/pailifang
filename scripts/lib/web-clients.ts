import { fetchRemoteDocument } from '../../src/lib/document-fetch';

interface WebSearchItem {
  title: string;
  site_name: string;
  url: string;
  snippet: string;
}

interface WebSearchResult {
  web_items: WebSearchItem[];
  summary?: string;
}

interface SearchPayloadItem {
  title?: string;
  name?: string;
  url?: string;
  link?: string;
  snippet?: string;
  description?: string;
  body?: string;
  site_name?: string;
  source?: string;
  displayUrl?: string;
}

interface SearchPayload {
  web_items?: SearchPayloadItem[];
  results?: SearchPayloadItem[];
  organic?: SearchPayloadItem[];
  web?: { results?: SearchPayloadItem[] };
  webPages?: { value?: SearchPayloadItem[] };
  summary?: string;
  error?: string | { message?: string };
}

export class Config {
  readonly searchApiUrl = process.env.SEARCH_API_URL || '';
  readonly searchApiKey = process.env.SEARCH_API_KEY || '';
  readonly searchApiMethod = (process.env.SEARCH_API_METHOD || 'POST').toUpperCase();
}

export class SearchClient {
  constructor(private readonly config: Config) {}

  async webSearch(query: string, count = 10, summary = false): Promise<WebSearchResult> {
    return this.search(query, { count, needSummary: summary });
  }

  async advancedSearch(
    query: string,
    options: { sites?: string; count?: number; needSummary?: boolean } = {},
  ): Promise<WebSearchResult> {
    return this.search(query, options);
  }

  private async search(
    query: string,
    options: { sites?: string; count?: number; needSummary?: boolean },
  ): Promise<WebSearchResult> {
    if (!this.config.searchApiUrl) {
      throw new Error('SEARCH_API_URL 未配置，无法执行历史检索脚本');
    }

    const count = options.count || 10;
    const summary = options.needSummary || false;

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (this.config.searchApiKey) {
      const headerName = process.env.SEARCH_API_KEY_HEADER || 'Authorization';
      const prefix = process.env.SEARCH_API_KEY_PREFIX ?? 'Bearer ';
      headers[headerName] = `${prefix}${this.config.searchApiKey}`;
    }

    let requestUrl = this.config.searchApiUrl;
    const request: RequestInit = { method: this.config.searchApiMethod, headers };

    if (this.config.searchApiMethod === 'GET') {
      const url = new URL(requestUrl);
      url.searchParams.set(process.env.SEARCH_API_QUERY_PARAM || 'q', query);
      url.searchParams.set(process.env.SEARCH_API_COUNT_PARAM || 'count', count.toString());
      if (options.sites) {
        url.searchParams.set('sites', options.sites);
      }
      requestUrl = url.toString();
    } else {
      headers['Content-Type'] = 'application/json';
      request.body = JSON.stringify({ query, count, summary, sites: options.sites });
    }

    const response = await fetch(requestUrl, request);
    const payload = await response.json() as SearchPayload;

    if (!response.ok) {
      const errorMessage = typeof payload.error === 'string'
        ? payload.error
        : payload.error?.message;
      throw new Error(errorMessage || `搜索服务请求失败: HTTP ${response.status}`);
    }

    const rawItems = payload.web_items
      || payload.results
      || payload.organic
      || payload.web?.results
      || payload.webPages?.value
      || [];

    return {
      summary: payload.summary,
      web_items: rawItems.flatMap((item) => {
        const url = item.url || item.link;
        if (!url) {
          return [];
        }

        let siteName = item.site_name || item.source || item.displayUrl || '';
        if (!siteName) {
          try {
            siteName = new URL(url).hostname;
          } catch {
            siteName = '';
          }
        }

        return [{
          title: item.title || item.name || url,
          site_name: siteName,
          url,
          snippet: item.snippet || item.description || item.body || '',
        }];
      }),
    };
  }
}

export class FetchClient {
  constructor(config: Config) {
    void config;
  }

  async fetch(url: string) {
    const document = await fetchRemoteDocument(url);

    return {
      title: document.title,
      url: document.url,
      filetype: new URL(document.url).pathname.toLowerCase().endsWith('.pdf') ? 'pdf' : 'html',
      status_code: 0,
      status_message: 'success',
      content: [
        { type: 'text' as const, text: document.text },
        ...document.links.map((link) => ({ type: 'link' as const, url: link })),
      ],
    };
  }
}
