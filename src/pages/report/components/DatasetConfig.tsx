/**
 * 数据集配置组件
 * 用于创建和编辑数据集
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useDataset, SqlExecuteRequest } from '../hooks/useDataset';
import type { SqlExecuteResult } from '../services/reportApi';
import type { ChartDataset } from '../types';

export interface DatasetConfigProps {
  /** 数据集ID（编辑模式） */
  datasetId?: string;
  /** 确定回调 */
  onConfirm?: (dataset: ChartDataset) => void;
  /** 取消回调 */
  onCancel?: () => void;
  /** 数据源列表 */
  datasources?: { id: string; name: string }[];
}

export interface DatasetFormData {
  name: string;
  datasourceId: string;
  sql: string;
  description: string;
}

const initialFormData: DatasetFormData = {
  name: '',
  datasourceId: '',
  sql: '',
  description: '',
};

export const DatasetConfig: React.FC<DatasetConfigProps> = ({
  datasetId,
  onConfirm,
  onCancel,
  datasources = [],
}) => {
  const {
    getDataset,
    createDataset,
    updateDataset,
    executeSql,
  } = useDataset();

  const [formData, setFormData] = useState<DatasetFormData>(initialFormData);
  const [previewData, setPreviewData] = useState<SqlExecuteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // 加载数据集数据（编辑模式）
  useEffect(() => {
    if (datasetId) {
      setLoading(true);
      setIsEditing(true);
      getDataset(datasetId)
        .then((dataset) => {
          if (dataset) {
            setFormData({
              name: dataset.name,
              datasourceId: dataset.datasourceId,
              sql: dataset.sql,
              description: dataset.description || '',
            });
          }
        })
        .catch((err) => {
          setError(err.message || '加载数据集失败');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [datasetId, getDataset]);

  // 处理表单字段变化
  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // 清除之前的预览数据
    setPreviewData(null);
  }, []);

  // 预览 SQL 查询结果
  const handlePreview = useCallback(async () => {
    if (!formData.sql || !formData.datasourceId) {
      setError('请填写 SQL 语句和数据源');
      return;
    }

    setLoading(true);
    setError(null);

    const request: SqlExecuteRequest = {
      sql: formData.sql,
      datasourceId: formData.datasourceId,
    };

    try {
      const result = await executeSql(request);
      setPreviewData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '预览失败');
      setPreviewData(null);
    } finally {
      setLoading(false);
    }
  }, [formData.sql, formData.datasourceId, executeSql]);

  // 确认保存
  const handleConfirm = useCallback(async () => {
    if (!formData.name) {
      setError('请输入数据集名称');
      return;
    }
    if (!formData.datasourceId) {
      setError('请选择数据源');
      return;
    }
    if (!formData.sql) {
      setError('请输入 SQL 语句');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let result: ChartDataset;
      if (isEditing && datasetId) {
        result = await updateDataset(datasetId, formData);
      } else {
        result = await createDataset(formData);
      }
      onConfirm?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setLoading(false);
    }
  }, [formData, isEditing, datasetId, updateDataset, createDataset, onConfirm]);

  // 取消
  const handleCancel = useCallback(() => {
    setFormData(initialFormData);
    setPreviewData(null);
    setError(null);
    onCancel?.();
  }, [onCancel]);

  // 渲染预览表格
  const renderPreviewTable = () => {
    if (!previewData || previewData.data.length === 0) {
      return <div className="text-gray-500 p-4">暂无数据</div>;
    }

    return (
      <div className="overflow-auto max-h-64">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {previewData.columns.map((col) => (
                <th key={col} className="px-4 py-2 text-left font-medium text-gray-700 border">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewData.data.slice(0, 10).map((row, idx) => (
              <tr key={idx} className="border">
                {previewData.columns.map((col) => (
                  <td key={col} className="px-4 py-2 border">
                    {String(row[col] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {previewData.total > 10 && (
          <div className="text-gray-500 text-sm p-2">
            仅显示前 10 条，共 {previewData.total} 条
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="dataset-config p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4">
        {isEditing ? '编辑数据集' : '创建数据集'}
      </h3>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">
          {error}
        </div>
      )}

      {/* 表单 */}
      <div className="space-y-4">
        {/* 数据集名称 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            数据集名称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入数据集名称"
          />
        </div>

        {/* 数据源 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            数据源 <span className="text-red-500">*</span>
          </label>
          <select
            name="datasourceId"
            value={formData.datasourceId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">请选择数据源</option>
            {datasources.map((ds) => (
              <option key={ds.id} value={ds.id}>
                {ds.name}
              </option>
            ))}
          </select>
        </div>

        {/* SQL 语句 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SQL 查询语句 <span className="text-red-500">*</span>
          </label>
          <textarea
            name="sql"
            value={formData.sql}
            onChange={handleChange}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="SELECT * FROM table_name WHERE &#123;&#123;param&#125;&#125; = 'value'"
          />
          <p className="mt-1 text-xs text-gray-500">
            支持 &#123;&#123;参数名&#125;&#125; 格式的参数占位符
          </p>
        </div>

        {/* 描述 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            描述
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="数据集描述（可选）"
          />
        </div>

        {/* 预览按钮 */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePreview}
            disabled={loading || !formData.sql || !formData.datasourceId}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '预览中...' : '预览数据'}
          </button>
        </div>

        {/* 预览结果 */}
        {previewData !== null && (
          <div className="border border-gray-200 rounded">
            <div className="px-4 py-2 bg-gray-50 font-medium text-sm">
              预览结果 ({previewData.total} 条)
            </div>
            {renderPreviewTable()}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
        >
          取消
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
};

export default DatasetConfig;
