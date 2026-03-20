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
          <Layout className="w-6 h-6 text-purple-400" />
          <h1 className="text-2xl font-bold text-white">功能管理</h1>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增功能
        </button>
      </div>

      {/* 搜索栏 */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="搜索功能名称或编码..."
          value={searchKeyword}
          onChange={(e) => {
            setSearchKeyword(e.target.value);
            setPage(1);
          }}
          onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50"
        />
      </div>

      {/* 列表 */}
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">功能名称</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">编码</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">关联API</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">描述</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">状态</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-400">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  加载中...
                </td>
              </tr>
            ) : features.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  暂无数据
                </td>
              </tr>
            ) : (
              features.map((feature) => (
                <tr key={feature.id} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                  <td className="px-4 py-3 text-white font-medium">{feature.name}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-sm">{feature.code}</td>
                  <td className="px-4 py-3 text-slate-400">{feature.queryApiName || '-'}</td>
                  <td className="px-4 py-3 text-slate-400 truncate max-w-xs">{feature.description || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      feature.status === 1
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {feature.status === 1 ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                        title="预览"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <Link
                        to={`/features/${feature.id}`}
                        className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => {
                          setDeleteId(feature.id!);
                          setShowDeleteConfirm(true);
                        }}
                        className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400 transition-colors"
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700/50">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">共 {total} 条记录</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 bg-slate-800/50 border border-slate-700/50 rounded text-sm text-white"
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
                className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-white px-2">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">确认删除</h3>
            <p className="text-slate-400 mb-6">确定要删除这个功能吗？此操作不可恢复。</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteId(null);
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => deleteId && handleDelete(deleteId)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
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
          <div className="bg-slate-800 w-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-700 shrink-0">
              <h3 className="text-lg font-semibold text-white">新增功能</h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
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