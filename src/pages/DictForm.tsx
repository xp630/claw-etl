import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { getDictDetail, saveDict, getDictItems, saveDictItems, saveDictItem, deleteDictItem } from '../lib/api';
import type { Dict, DictItem } from '../types';

export default function DictForm({ overrideId }: { overrideId?: string }) {
  const params = useParams();
  const id = overrideId || params.id;
  const navigate = useNavigate();
  const isEdit = id && id !== 'new';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Dict>>({
    code: '',
    name: '',
    type: 'string',
    remark: '',
    status: 1,
  });
  const [items, setItems] = useState<DictItem[]>([]);
  const [newItem, setNewItem] = useState({ itemLabel: '', itemValue: '' });

  useEffect(() => {
    if (isEdit && id) {
      loadDict(parseInt(id));
    }
  }, [id]);

  const loadDict = async (dictId: number) => {
    setLoading(true);
    try {
      const dict = await getDictDetail(dictId);
      if (dict) {
        setFormData(dict);
      }
    } catch (error) {
      console.error('Failed to load dict:', error);
    } finally {
      setLoading(false);
    }
    // 单独加载字典项，不影响字典主表数据
    try {
      const dictItems = await getDictItems(dictId);
      setItems(dictItems || []);
    } catch (error) {
      console.error('Failed to load dict items:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await saveDict(formData);
      if (saved) {
        // 保存字典项
        if (saved.id) {
          await saveDictItems(saved.id, saved.code || '', items);
        }
        navigate('/dict');
      }
    } catch (error) {
      console.error('Failed to save dict:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = () => {
    if (!newItem.itemLabel || !newItem.itemValue) return;
    const item: DictItem = {
      itemLabel: newItem.itemLabel,
      itemValue: newItem.itemValue,
      sort: items.length,
      status: 1,
    };
    setItems([...items, item]);
    setNewItem({ itemLabel: '', itemValue: '' });
  };

  const handleRemoveItem = (index: number) => {
    const item = items[index];
    if (item.id) {
      // 如果是已保存的项，调用删除接口
      deleteDictItem(item.id);
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof DictItem, value: any) => {
    setItems(items.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--text-muted)]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-auto">
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => navigate('/dict')}
          className="p-2 hover:bg-slate-700 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">
          {isEdit ? '编辑字典' : '新增字典'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        <div className="bg-[var(--bg-table-header)] rounded-lg border border-[var(--border-light)] p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1">字典编码</label>
              <input
                type="text"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1">字典名称</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1">类型</label>
              <select
                value={formData.type || 'string'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'string' | 'number' })}
                className="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
              >
                <option value="string">字符串</option>
                <option value="number">数字</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1">状态</label>
              <select
                value={formData.status || 1}
                onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
              >
                <option value={1}>启用</option>
                <option value={0}>禁用</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-[var(--text-muted)] mb-1">备注</label>
              <textarea
                value={formData.remark || ''}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
              />
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-table-header)] rounded-lg border border-[var(--border-light)] p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">字典项</h2>
          </div>

          <div className="mb-3 flex gap-2">
            <input
              type="text"
              placeholder="标签"
              value={newItem.itemLabel}
              onChange={(e) => setNewItem({ ...newItem, itemLabel: e.target.value })}
              className="flex-1 px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
            />
            <input
              type="text"
              placeholder="值"
              value={newItem.itemValue}
              onChange={(e) => setNewItem({ ...newItem, itemValue: e.target.value })}
              className="flex-1 px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
            />
            <button
              type="button"
              onClick={handleAddItem}
              className="px-3 py-2 bg-[var(--accent)]/20 hover:bg-[var(--accent)]/30 text-[var(--accent)] rounded-lg transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-light)]">
                <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-muted)]">排序</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-muted)]">标签</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-muted)]">值</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-[var(--text-muted)]">操作</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-[var(--text-muted)] text-sm">
                    暂无字典项
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={index} className="border-b border-[var(--border-light)]">
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.sort || index}
                        onChange={(e) => handleItemChange(index, 'sort', parseInt(e.target.value))}
                        className="w-16 px-2 py-1 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded text-[var(--text-primary)] text-xs text-center focus:outline-none focus:border-[var(--accent-light)]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.itemLabel}
                        onChange={(e) => handleItemChange(index, 'itemLabel', e.target.value)}
                        className="w-full px-2 py-1 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-light)]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.itemValue}
                        onChange={(e) => handleItemChange(index, 'itemValue', e.target.value)}
                        className="w-full px-2 py-1 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-light)]"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-1 hover:bg-slate-700 rounded text-[var(--text-muted)] hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/dict')}
            className="px-4 py-2 bg-slate-700 hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg transition-colors text-sm"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent)] text-[var(--text-primary)] rounded-lg transition-colors text-sm disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
}
