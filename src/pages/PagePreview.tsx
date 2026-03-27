import { useSearchParams, useNavigate } from 'react-router-dom';
import PageRenderer from '../components/PageRenderer';
import { useEffect, useState } from 'react';
import { Eye, ChevronLeft } from 'lucide-react';

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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 shadow-sm">
        <button
          onClick={() => navigate('/pages')}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors mr-3"
        >
          <ChevronLeft className="w-4 h-4" />
          返回
        </button>
        <Eye className="w-4 h-4 text-gray-400 mr-2" />
        <h1 className="text-sm font-medium text-gray-600">页面预览</h1>
        <span className="ml-3 text-xs text-gray-400">
          {config.components.length} 个组件
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => {
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
            className="px-3 py-1 text-xs border border-gray-200 text-gray-600 rounded hover:bg-gray-50 transition-colors"
          >
            刷新
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="p-5 overflow-y-auto" style={{ minHeight: 'calc(100vh - 48px)' }}>
        <div className="w-full">
          <PageRenderer components={config.components} />
        </div>
      </div>
    </div>
  );
}
