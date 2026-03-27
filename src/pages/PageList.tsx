import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPageConfigList, deletePageConfig } from '../lib/api';

interface PageItem {
  id: number;
  name: string;
  code: string;
  description: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

const PageList: React.FC = () => {
  const navigate = useNavigate();
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const loadPages = async () => {
    setLoading(true);
    try {
      const res = await getPageConfigList({ page: 1, limit: 100, keyword: search });
      setPages(res.list);
    } catch (err) {
      console.error('加载页面列表失败', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadPages();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个页面吗？')) return;
    try {
      await deletePageConfig(id);
      loadPages();
    } catch (err) {
      console.error('删除失败', err);
    }
  };

  const handleEdit = (id: number) => {
    navigate(`/page-editor?pageId=${id}`);
  };

  const handleCreate = () => {
    navigate('/page-editor?new=true');
  };

  const handlePreview = (id: number) => {
    window.open(`#/preview?pageId=${id}`, '_blank');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">页面配置</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          新建页面
        </button>
      </div>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索页面名称或编码..."
          className="flex-1 px-3 py-2 border rounded"
        />
        <button type="submit" className="px-4 py-2 bg-gray-100 border rounded hover:bg-gray-200">
          搜索
        </button>
      </form>

      {loading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : pages.length === 0 ? (
        <div className="text-center py-8 text-gray-500">暂无数据</div>
      ) : (
        <table className="w-full bg-white border rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">页面名称</th>
              <th className="px-4 py-3 text-left">页面编码</th>
              <th className="px-4 py-3 text-left">描述</th>
              <th className="px-4 py-3 text-left">状态</th>
              <th className="px-4 py-3 text-left">创建时间</th>
              <th className="px-4 py-3 text-left">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {pages.map((page) => (
              <tr key={page.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{page.id}</td>
                <td className="px-4 py-3">{page.name}</td>
                <td className="px-4 py-3">{page.code}</td>
                <td className="px-4 py-3 text-gray-500">{page.description || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${page.status === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {page.status === 1 ? '启用' : '禁用'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{page.updatedAt || page.createdAt}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(page.id)}
                      className="text-blue-500 hover:underline"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handlePreview(page.id)}
                      className="text-green-500 hover:underline"
                    >
                      预览
                    </button>
                    <button
                      onClick={() => handleDelete(page.id)}
                      className="text-red-500 hover:underline"
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PageList;
