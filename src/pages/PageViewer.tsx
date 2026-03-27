import PageRenderer from '../components/PageRenderer';
import { useEffect, useState } from 'react';
import { getPageConfig, getPageConfigList } from '../lib/api';

export default function PageViewer() {
  const [components, setComponents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 从 URL 获取 code（格式：/render/xxx）
  const pathParts = window.location.hash.replace('#/', '').split('/');
  const code = pathParts.length >= 2 ? pathParts[1] : null;

  useEffect(() => {
    if (!code) {
      setError('页面编码不存在');
      setLoading(false);
      return;
    }

    const loadPage = async () => {
      try {
        // 获取页面列表找到对应的 page
        const res = await getPageConfigList({ page: 1, limit: 1000 });
        const page = res.list.find((p: any) => p.code === code);
        
        if (!page) {
          setError('页面不存在');
          setLoading(false);
          return;
        }
        
        // 获取页面详情
        const pageConfig = await getPageConfig(page.id);
        if (!pageConfig) {
          setError('页面不存在或已被禁用');
          setLoading(false);
          return;
        }

        // 解析 components - 后端返回的是扁平结构，需要转成树形
        const compsData = pageConfig.components;
        let flatComps = [];
        
        if (Array.isArray(compsData)) {
          flatComps = compsData;
        } else if (compsData && compsData.components) {
          flatComps = compsData.components;
        }
        
        // 扁平结构转树形
        const compMap = new Map<string, any>();
        const rootComps: any[] = [];
        
        flatComps.forEach((c: any) => {
          let props = typeof c.props === 'string' ? JSON.parse(c.props) : (c.props || {});
          // props 里的某些字段可能还是 JSON 字符串，需要递归解析
          const parseProps = (p: any): any => {
            if (typeof p === 'string') {
              try {
                return parseProps(JSON.parse(p));
              } catch {
                return p;
              }
            }
            if (Array.isArray(p)) {
              return p.map(parseProps);
            }
            if (typeof p === 'object' && p !== null) {
              const result: any = {};
              for (const key in p) {
                result[key] = parseProps(p[key]);
              }
              return result;
            }
            return p;
          };
          props = parseProps(props);
          
          const id = String(c.id);
          compMap.set(id, {
            id,
            type: c.type,
            label: c.type,
            props,
            children: []
          });
        });
        
        flatComps.forEach((c: any) => {
          const comp = compMap.get(String(c.id));
          const parentId = c.parentId;
          if (parentId != null && parentId !== undefined) {
            const parent = compMap.get(String(parentId));
            if (parent) {
              parent.children = parent.children || [];
              parent.children.push(comp);
            } else {
              rootComps.push(comp);
            }
          } else {
            rootComps.push(comp);
          }
        });
        
        setComponents(rootComps);
      } catch (err) {
        console.error('Failed to load page:', err);
        setError('加载页面失败');
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [code]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 mb-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <PageRenderer components={components} />
    </div>
  );
}
