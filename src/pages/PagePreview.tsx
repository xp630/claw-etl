import { useEffect, useState } from 'react';
import PageContent from '../components/PageContent';

interface ComponentConfig {
  id: string;
  type: string;
  label: string;
  props: Record<string, unknown>;
  children?: ComponentConfig[];
}

interface PageConfig {
  components: ComponentConfig[];
  layout?: string;
}

export default function PagePreview() {
  const [config, setConfig] = useState<PageConfig | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('page_preview_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log('[PagePreview] Loaded config:', JSON.stringify(parsed, null, 2));
        setConfig(parsed);
      } catch (e) {
        console.error('[PagePreview] Failed to parse config:', e);
      }
    }
  }, []);

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <PageContent
      components={config.components}
      name="页面预览"
      backPath="/pages"
      showRefresh
      onRefresh={() => {
        const saved = localStorage.getItem('page_preview_config');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setConfig(parsed);
          } catch (e) {
            console.error('刷新失败:', e);
          }
        }
      }}
    />
  );
}
