import React, { useState, useEffect, useCallback } from 'react';
import { ColumnConfig } from './types';
import { getFeatureDetail } from '../../lib/api';
import type { Feature, FeatureColumn } from '../../types';

interface FormRendererProps {
  datasourceId?: number;
  tableName?: string;
  featureId?: number;
  columns?: ColumnConfig[];
  showAdd?: boolean;
  showEdit?: boolean;
}

interface FormField {
  key: string;
  label: string;
  fieldType: string;
  visible?: boolean;
  required?: boolean;
  defaultValue?: unknown;
  placeholder?: string;
  dataDictionary?: string;
  dateFormat?: string;
  options?: string[];
  queryCondition?: boolean;
}

function FormRenderer({
  datasourceId,
  tableName,
  featureId,
  columns,
  showAdd = true,
  showEdit = true,
}: FormRendererProps) {
  const [formColumns, setFormColumns] = useState<FormField[]>([]);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load feature detail to get form fields
  const loadFormConfig = useCallback(async () => {
    if (!featureId) {
      setError('请先在右侧绑定数据源和 Feature');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const feature = await getFeatureDetail(featureId);
      
      if (!feature) {
        setError('未找到对应的 Feature');
        return;
      }

      // Build form fields from feature columns
      const fields: FormField[] = [];
      
      // If columns prop is provided, use it
      if (columns && columns.length > 0) {
        columns.forEach((col: ColumnConfig) => {
          const isVisible = col.visible === undefined || col.visible === true;
          const isNotAction = col.fieldType !== 'action';
          const isNotQueryCondition = col.queryCondition !== true;
          if (isVisible && isNotAction && isNotQueryCondition) {
            fields.push({
              key: col.key,
              label: col.label,
              fieldType: col.fieldType || 'text',
              visible: isVisible,
              required: col.required || false,
              defaultValue: col.defaultValue,
              placeholder: col.placeholder || '',
              dataDictionary: col.dataDictionary,
              dateFormat: col.dateFormat,
              queryCondition: col.queryCondition,
            });
          }
        });
      } else if (feature.columns && Array.isArray(feature.columns)) {
        // Build from feature columns
        feature.columns.forEach((col: FeatureColumn) => {
          const isVisible = col.visible === undefined || col.visible === true;
          const isNotAction = col.fieldType !== 'action';
          const isNotQueryCondition = col.queryCondition !== true;
          if (isVisible && isNotAction && isNotQueryCondition) {
            fields.push({
              key: col.fieldName,
              label: col.fieldLabel,
              fieldType: col.fieldType || 'text',
              visible: isVisible,
              required: false,
              defaultValue: undefined,
              placeholder: '',
              dataDictionary: col.dataDictionary,
              dateFormat: undefined,
              queryCondition: col.queryCondition,
            });
          }
        });
      }

      setFormColumns(fields);

      // Initialize form values with default values
      const initialValues: Record<string, unknown> = {};
      fields.forEach(field => {
        initialValues[field.key] = field.defaultValue ?? '';
      });
      setFormValues(initialValues);
    } catch (err) {
      console.error('Failed to load feature detail:', err);
      setError('加载表单配置失败');
    } finally {
      setLoading(false);
    }
  }, [featureId, columns]);

  useEffect(() => {
    loadFormConfig();
  }, [loadFormConfig]);

  const handleInputChange = (key: string, value: unknown) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    const resetValues: Record<string, unknown> = {};
    formColumns.forEach(field => {
      resetValues[field.key] = field.defaultValue ?? '';
    });
    setFormValues(resetValues);
  };

  const handleSubmit = () => {
    // Validate required fields
    const missing: string[] = [];
    formColumns.forEach(field => {
      if (field.required && !formValues[field.key]) {
        missing.push(field.label);
      }
    });

    if (missing.length > 0) {
      alert(`请填写必填字段：${missing.join('、')}`);
      return;
    }

    console.log('Form submitted:', formValues);
    alert('表单已提交，请查看控制台输出');
  };

  // Not configured
  if (!featureId) {
    return (
      <div className="p-6 border border-dashed border-gray-300 rounded bg-gray-50 text-center">
        <div className="text-gray-400 text-sm">请先在右侧绑定数据源和 Feature</div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="p-6 border border-dashed border-gray-300 rounded bg-gray-50 text-center">
        <div className="text-gray-400 text-sm">加载中...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 border border-dashed border-red-300 rounded bg-red-50 text-center">
        <div className="text-red-400 text-sm">{error}</div>
      </div>
    );
  }

  // Empty fields
  if (formColumns.length === 0) {
    return (
      <div className="p-6 border border-dashed border-gray-300 rounded bg-gray-50 text-center">
        <div className="text-gray-400 text-sm">未配置表单字段</div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded bg-white p-4">
      <div className="space-y-4">
        {formColumns.map(field => (
          <div key={field.key} className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            {field.fieldType === 'textarea' && (
              <textarea
                value={String(formValues[field.key] ?? '')}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                placeholder={field.placeholder || `请输入${field.label}`}
                disabled={!showEdit}
                className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 resize-none disabled:bg-gray-100"
                rows={3}
              />
            )}
            
            {field.fieldType === 'select' && (
              <select
                value={String(formValues[field.key] ?? '')}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                disabled={!showEdit}
                className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">{field.placeholder || '请选择'}</option>
                {field.options?.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}
            
            {field.fieldType === 'date' && (
              <input
                type={field.dateFormat?.includes('time') || field.dateFormat?.includes('HH') ? 'datetime-local' : 'date'}
                value={String(formValues[field.key] ?? '')}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                placeholder={field.placeholder || `请选择${field.label}`}
                disabled={!showEdit}
                className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
              />
            )}
            
            {field.fieldType === 'number' && (
              <input
                type="number"
                value={formValues[field.key] as number ?? ''}
                onChange={(e) => handleInputChange(field.key, e.target.value ? Number(e.target.value) : '')}
                placeholder={field.placeholder || `请输入${field.label}`}
                disabled={!showEdit}
                className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
              />
            )}

            {field.fieldType === 'checkbox' && (
              <label className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  checked={Boolean(formValues[field.key])}
                  onChange={(e) => handleInputChange(field.key, e.target.checked)}
                  disabled={!showEdit}
                  className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500">{field.placeholder || '是'}</span>
              </label>
            )}
            
            {(field.fieldType === 'text' || !field.fieldType) && (
              <input
                type="text"
                value={String(formValues[field.key] ?? '')}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                placeholder={field.placeholder || `请输入${field.label}`}
                disabled={!showEdit}
                className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
              />
            )}
          </div>
        ))}
      </div>

      {/* Action buttons */}
      {(showAdd || showEdit) && (
        <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
          {(showAdd || showEdit) && (
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
            >
              提交
            </button>
          )}
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition-colors"
          >
            重置
          </button>
        </div>
      )}
    </div>
  );
}

export default FormRenderer;
