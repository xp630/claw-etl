import { getApiDetail, api } from './api';

class DataBridge {
  // 统一 API 调用
  async request(apiId: number, params: object = {}): Promise<any> {
    console.log('[DataBridge] request called with apiId:', apiId, 'params:', params);
    if (!apiId) {
      console.warn('[DataBridge] No apiId provided');
      return { list: [], total: 0 };
    }
    
    const apiConfig = await getApiDetail(apiId);
    if (!apiConfig) {
      console.error('[DataBridge] API config not found for apiId:', apiId);
      return { list: [], total: 0 };
    }
    console.log('[DataBridge] API config found:', apiConfig.path, apiConfig.method);

    let path = apiConfig.path || '';
    if (path.startsWith('/api/')) {
      path = path.substring(4);
    }
    path = `/api${path}`;

    try {
      let response;
      if (apiConfig.method === 'GET') {
        response = await api.get(path, { params });
      } else {
        response = await api.post(path, params);
      }
      const data = response.data;
      console.log('[DataBridge] Response data:', data);

      // 标准化返回格式
      if (Array.isArray(data)) {
        return { list: data, total: data.length };
      } else if (data.list) {
        return { list: data.list, total: data.total || data.list.length };
      } else if (data.data && Array.isArray(data.data)) {
        return { list: data.data, total: data.total || data.data.length };
      }
      return { list: [], total: 0 };
    } catch (error) {
      console.error('[DataBridge] API request failed:', error);
      return { list: [], total: 0 };
    }
  }
}

export const dataBridge = new DataBridge();
