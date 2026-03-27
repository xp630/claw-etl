import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPageConfigList, deletePageConfig } from '../lib/api';
import DataTable from '../components/DataTable';
import type { ColumnDef } from '../components/DataTable';

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

  const columns: ColumnDef[] = [
    { key: 'id', label: 'ID', width: 80 },
    { key: 'name', label: '页面名称', width: 150 },
    { key: 'code', label: '页面编码', width: 150 },
    { key: 'description', label: '描述', width: 200, ellipsis: true },
    { 
      key: 'status', 
      label: '状态', 
      width: 80,
      render: (value: any) => (
        <span className={`px-2 py-1 rounded text-xs ${value === 1 ? 'bg-[var(--success)]/20 text-[var(--success)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'}`}>
          {value === 1 ? '启用' : '禁用'}
        </span>
      )
    },
    { key: 'updatedAt', label: '更新时间', width: 160 },
  ];

  const loadPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPageConfigList({ page: 1, limit: 100, keyword: search });
      setPages(res.list || []);
    } catch (err) {
      console.error('加载页面列表失败', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  const handleEdit = (row: PageItem) => {
    window.open(`/page-editor?pageId=${row.id}`, '_blank');
  };

  const handlePreview = (row: PageItem) => {
    window.open(`#/preview?pageId=${row.id}`, '_blank');
  };

  const handleDelete = async (row: PageItem) => {
    if (!confirm('确定要删除这个页面吗？')) return;
    try {
      await deletePageConfig(row.id);
      loadPages();
    } catch (err) {
      console.error('删除失败', err);
    }
  };

  const handleCreate = () => {
    navigate('/page-editor?new=true');
  };

  return (
    <div className="h-full">
      <DataTable
        columns={columns}
        data={pages}
        loading={loading}
        pagination={false}
        showSearchBar={false}
        showAdd={false}
        showEdit
        showDelete
        showDetail={false}
        onEdit={handleEdit}
        onDelete={handleDelete}
        extraActions={
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)] text-sm"
          >
            新建页面
          </button>
        }
      />
    </div>
  );
};

export default PageList;
