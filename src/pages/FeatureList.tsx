import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Layout, Eye, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getFeatures, deleteFeature } from '../lib/api';
import type { Feature } from '../types';
import FeatureForm from './FeatureForm';

export default function FeatureList() {
  const location = useLocation();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [total, setTotal] = useState(0);

  // 监听路径变化，当页面显示时重新加载数据
  useEffect(() => {
    loadFeatures();
  }, [page, limit, searchKeyword, location.pathname]);

  const loadFeatures = async () => {
    setLoading(true);
    try {
      const data = await getFeatures({ page, limit, keyword: searchKeyword });
      setFeatures(data.list);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load features:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteFeature(id);
      setShowDeleteConfirm(false);
      setDeleteId(null);
      loadFeatures();
    } catch (error) {
      console.error('Failed to delete feature:', error);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Layout className="w-6 h-6 text-[var(--accent)]" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">功能管理</h1>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增
        </button>
      </div>

      {/* 搜索栏 */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="搜索功能名称或编码..."
          value={searchKeyword}
          onChange={(e) => {
            setSearchKeyword(e.target.value);
            setPage(1);
          }}
          onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
          className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-light)]"
        />
      </div>

      {/* 列表 */}
      <div className="bg-[var(--bg-table-header)] rounded-xl border border-[var(--border-light)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-light)]">
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-muted)]">功能名称</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-muted)]">编码</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-muted)]">关联API</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-muted)]">描述</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-muted)]">状态</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-[var(--text-muted)]">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[var(--text-muted)]">
                  加载中...
                </td>
              </tr>
            ) : features.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[var(--text-muted)]">
                  暂无数据
                </td>
              </tr>
            ) : (
              features.map((feature) => (
                <tr key={feature.id} className="border-b border-[var(--border-light)] hover:bg-[var(--bg-hover-light)]">
                  <td className="px-4 py-3 text-[var(--text-primary)] truncate font-medium">{feature.name}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)] truncate font-mono text-sm">{feature.code}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)] truncate">{feature.queryApiName || '-'}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)] truncate truncate max-w-xs">{feature.description || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      feature.status === 1
                        ? 'bg-[var(--success)]/20 text-[var(--success)]'
                        : 'bg-[var(--bg-secondary)]/20 text-[var(--text-muted)]'
                    }`}>
                      {feature.status === 1 ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="p-1.5 hover:bg-[var(--bg-hover)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        title="预览"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <Link
                        to={`/features/${feature.id}`}
                        className="p-1.5 hover:bg-[var(--bg-hover)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => {
                          setDeleteId(feature.id!);
                          setShowDeleteConfirm(true);
                        }}
                        className="p-1.5 hover:bg-[var(--bg-hover)] rounded text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* 分页组件 */}
        {total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-light)]">
            <div className="flex items-center gap-4">
              <span className="text-sm text-[var(--text-muted)]">共 {total} 条记录</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded text-sm text-[var(--text-primary)]"
              >
                <option value={5}>5条/页</option>
                <option value={10}>10条/页</option>
                <option value={20}>20条/页</option>
                <option value={50}>50条/页</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-[var(--text-primary)] px-2">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-light)] p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">确认删除</h3>
            <p className="text-[var(--text-muted)] mb-6">确定要删除这个功能吗？此操作不可恢复。</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteId(null);
                }}
                className="px-4 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => deleteId && handleDelete(deleteId)}
                className="px-4 py-2 bg-[var(--danger)] hover:opacity-90 text-white rounded-lg transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新增功能模态框 */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-stretch justify-center z-50">
          <div className="bg-[var(--bg-secondary)] w-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-light)] shrink-0">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">新增功能</h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 min-h-0">
              <FeatureForm onSuccess={() => {
                setShowNewModal(false);
                loadFeatures();
              }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}