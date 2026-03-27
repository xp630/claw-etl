import { useNavigate } from 'react-router-dom';
import PageRenderer from '../components/PageRenderer';
import { ChevronLeft, RefreshCw } from 'lucide-react';

interface PageContentProps {
  components: any[];
  name?: string;
  onRefresh?: () => void;
  showRefresh?: boolean;
  backPath?: string;
}

export default function PageContent({ 
  components, 
  name, 
  onRefresh, 
  showRefresh = false,
  backPath = '/pages'
}: PageContentProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 shadow-sm">
        <button
          onClick={() => navigate(backPath)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors mr-3"
        >
          <ChevronLeft className="w-4 h-4" />
          返回
        </button>
        <span className="font-medium text-gray-600">{name || '页面'}</span>
        <span className="ml-3 text-xs text-gray-400">
          {components.length} 个组件
        </span>
        {showRefresh && onRefresh && (
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="px-3 py-1 text-xs border border-gray-200 text-gray-600 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              刷新
            </button>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="p-5 overflow-y-auto" style={{ minHeight: 'calc(100vh - 48px)' }}>
        <div className="w-full">
          <PageRenderer components={components} />
        </div>
      </div>
    </div>
  );
}
