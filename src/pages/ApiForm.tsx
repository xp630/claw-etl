import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { getDataSources, getTableList, getTableColumns, saveApi, getApiDetail } from '../lib/api';
import type { DataSource, ApiConfig, ApiInputParam, ApiOutputParam, TableInfo, ColumnInfo } from '../types';

const STEPS = ['基本信息', '字段配置', '参数配置', 'Mock配置'];

export default function ApiForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 数据源和表
  const [datasources, setDatasources] = useState<DataSource[]>([]);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);

  // 表单数据
  const [formData, setFormData] = useState<ApiConfig>({
    name: '',
    path: '',
    method: 'POST',
    datasourceId: undefined as any,
    datasourceName: '',
    databaseName: '',
    tableName: '',
    description: '',
    queryFields: '',
    paginationEnabled: 1,
    mockEnabled: 1,
    mockData: '',
    status: 1,
  });

  // 输入参数
  const [inputParams, setInputParams] = useState<ApiInputParam[]>([]);
  // 输出参数
  const [outputParams, setOutputParams] = useState<ApiOutputParam[]>([]);

  useEffect(() => {
    loadDataSources();
    if (isEdit && id) {
      loadApiDetail(parseInt(id));
    }
  }, [id]);

  useEffect(() => {
    if (formData.databaseName) {
      loadTables(formData.databaseName);
    }
  }, [formData.databaseName]);

  useEffect(() => {
    if (formData.databaseName && formData.tableName) {
      loadColumns(formData.databaseName, formData.tableName);
    }
  }, [formData.tableName]);

  const loadDataSources = async () => {
    try {
      const data = await getDataSources();
      setDatasources(data);
    } catch (error) {
      console.error('Failed to load datasources:', error);
    }
  };

  const loadTables = async (database: string) => {
    try {
      const data = await getTableList(database);
      setTables(data);
    } catch (error) {
      console.error('Failed to load tables:', error);
    }
  };

  const loadColumns = async (dbName: string, tableName: string) => {
    try {
      const data = await getTableColumns(dbName, tableName);
      setColumns(data);
      // 自动生成输入参数和输出参数
      autoGenerateParams(data);
    } catch (error) {
      console.error('Failed to load columns:', error);
    }
  };

  const loadApiDetail = async (apiId: number) => {
    setLoading(true);
    try {
      const data = await getApiDetail(apiId);
      if (data) {
        setFormData(data);
        // TODO: 加载输入输出参数
      }
    } catch (error) {
      console.error('Failed to load API detail:', error);
    } finally {
      setLoading(false);
    }
  };

  // 自动生成输入/输出参数
  const autoGenerateParams = (cols: ColumnInfo[]) => {
    // 输入参数：所有字段
    const inputs: ApiInputParam[] = cols.map(col => ({
      paramName: col.columnName,
      columnName: col.columnName,
      paramType: mapDataType(col.dataType),
      required: col.isPrimary ? 1 : 0,
      description: col.columnComment || '',
    }));
    // 添加分页参数
    inputs.push(
      { paramName: 'page', paramType: 'integer', required: 0, defaultValue: '1', description: '页码' },
      { paramName: 'pageSize', paramType: 'integer', required: 0, defaultValue: '10', description: '每页条数' }
    );
    setInputParams(inputs);

    // 输出参数：所有字段
    const outputs: ApiOutputParam[] = cols.map(col => ({
      columnName: col.columnName,
      dataType: mapDataType(col.dataType),
      description: col.columnComment || '',
    }));
    setOutputParams(outputs);

    // 自动填充查询字段
    const queryFields = cols.map(c => c.columnName).join(',');
    setFormData(prev => ({ ...prev, queryFields }));
  };

  const mapDataType = (dataType: string): string => {
    const type = dataType.toLowerCase();
    if (type.includes('int') || type.includes('bigint')) return 'integer';
    if (type.includes('decimal') || type.includes('float') || type.includes('double')) return 'decimal';
    if (type.includes('date') && !type.includes('time')) return 'date';
    if (type.includes('time')) return 'datetime';
    if (type.includes('bool')) return 'boolean';
    return 'string';
  };

  const handleDataSourceChange = (dsId: number) => {
    const ds = datasources.find(d => d.id === dsId);
    if (ds) {
      setFormData(prev => ({
        ...prev,
        datasourceId: ds.id,
        datasourceName: ds.name,
        databaseName: ds.databaseName,
        tableName: '',
      }));
      setTables([]);
      setColumns([]);
    }
  };

  const handleTableChange = (tableName: string) => {
    setFormData(prev => ({ ...prev, tableName }));
  };

  // 输入参数操作
  const addInputParam = () => {
    setInputParams([...inputParams, {
      paramName: '',
      columnName: '',
      paramType: 'string',
      required: 0,
      description: '',
    }]);
  };

  const updateInputParam = (index: number, field: keyof ApiInputParam, value: any) => {
    const newParams = [...inputParams];
    newParams[index] = { ...newParams[index], [field]: value };
    setInputParams(newParams);
  };

  const removeInputParam = (index: number) => {
    setInputParams(inputParams.filter((_, i) => i !== index));
  };

  // 输出参数操作
  const updateOutputParam = (index: number, field: keyof ApiOutputParam, value: any) => {
    const newParams = [...outputParams];
    newParams[index] = { ...newParams[index], [field]: value };
    setOutputParams(newParams);
  };

  const removeOutputParam = (index: number) => {
    setOutputParams(outputParams.filter((_, i) => i !== index));
  };

  const toggleOutputParam = (index: number) => {
    const newParams = [...outputParams];
    // 这里可以通过选中状态控制，暂时不做复杂处理
  };

  // 自动生成Mock数据
  const generateMockData = () => {
    const mock: any = {
      code: 1,
      data: {
        list: outputParams.slice(0, 3).map(p => {
          const obj: any = {};
          if (p.alias) obj[p.alias] = getMockValue(p.dataType || 'string');
          else obj[p.columnName] = getMockValue(p.dataType || 'string');
          return obj;
        }),
        total: 100,
        page: 1,
        pageSize: 10,
      },
      msg: 'success',
    };
    setFormData(prev => ({ ...prev, mockData: JSON.stringify(mock, null, 2) }));
  };

  const getMockValue = (type: string): any => {
    switch (type) {
      case 'integer': return 1;
      case 'decimal': return 1.00;
      case 'boolean': return true;
      case 'date': return '2026-01-01';
      case 'datetime': return '2026-01-01 10:00:00';
      default: return 'sample';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: 保存输入输出参数
      await saveApi(formData);
      navigate('/apis');
    } catch (error) {
      console.error('Failed to save API:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.name && formData.path && formData.datasourceId && formData.tableName;
      case 1:
        return outputParams.length > 0;
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/apis')}
            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-white">
            {isEdit ? '编辑API' : '创建API'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/apis')}
            className="px-4 py-2 text-slate-400 hover:text-white"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {/* 步骤条 */}
      <div className="flex items-center justify-center gap-4 p-4 border-b border-slate-700/50">
        {STEPS.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm ${
              index < currentStep ? 'bg-green-500 text-white' :
              index === currentStep ? 'bg-purple-500 text-white' :
              'bg-slate-700 text-slate-400'
            }`}>
              {index < currentStep ? '✓' : index + 1}
            </div>
            <span className={`ml-2 text-sm ${index === currentStep ? 'text-white' : 'text-slate-400'}`}>
              {step}
            </span>
            {index < STEPS.length - 1 && (
              <div className={`w-12 h-0.5 mx-4 ${index < currentStep ? 'bg-green-500' : 'bg-slate-700'}`} />
            )}
          </div>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            加载中...
          </div>
        ) : (
          <>
            {/* 步骤1: 基本信息 */}
            {currentStep === 0 && (
              <div className="max-w-2xl space-y-6">
                <div className="bg-[#1e293b]/60 rounded-xl border border-slate-700/50 p-6 space-y-4">
                  <h3 className="text-white font-medium">基本信息</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">数据源 *</label>
                      <select
                        value={formData.datasourceId || ''}
                        onChange={(e) => handleDataSourceChange(parseInt(e.target.value))}
                        className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white"
                      >
                        <option value="">请选择数据源</option>
                        {datasources.map(ds => (
                          <option key={ds.id} value={ds.id}>{ds.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">数据库</label>
                      <input
                        type="text"
                        value={formData.databaseName}
                        readOnly
                        className="w-full px-4 py-2.5 bg-slate-800/30 border border-slate-700/50 rounded-lg text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">表 *</label>
                      <div className="flex gap-2">
                        <select
                          value={formData.tableName}
                          onChange={(e) => handleTableChange(e.target.value)}
                          className="flex-1 px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white"
                        >
                          <option value="">请选择表</option>
                          {tables.map(t => (
                            <option key={t.tableName} value={t.tableName}>
                              {t.tableName} {t.tableComment ? `(${t.tableComment})` : ''}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => formData.databaseName && loadTables(formData.databaseName)}
                          className="px-3 py-2 bg-slate-700 rounded-lg text-slate-300 hover:bg-slate-600"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">请求方式</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-white">
                          <input
                            type="radio"
                            name="method"
                            checked={formData.method === 'GET'}
                            onChange={() => setFormData({ ...formData, method: 'GET' })}
                            className="accent-purple-500"
                          />
                          GET
                        </label>
                        <label className="flex items-center gap-2 text-white">
                          <input
                            type="radio"
                            name="method"
                            checked={formData.method === 'POST'}
                            onChange={() => setFormData({ ...formData, method: 'POST' })}
                            className="accent-purple-500"
                          />
                          POST
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">API名称 *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="例如：用户查询"
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">API路径 *</label>
                    <input
                      type="text"
                      value={formData.path}
                      onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                      placeholder="例如：/api/user/list"
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">描述</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 步骤2: 字段配置 */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="bg-[#1e293b]/60 rounded-xl border border-slate-700/50 p-6">
                  <h3 className="text-white font-medium mb-4">选择输出字段</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {columns.map(col => (
                      <label key={col.columnName} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-700">
                        <input
                          type="checkbox"
                          checked={outputParams.some(p => p.columnName === col.columnName)}
                          onChange={() => {
                            if (outputParams.some(p => p.columnName === col.columnName)) {
                              removeOutputParam(outputParams.findIndex(p => p.columnName === col.columnName));
                            } else {
                              setOutputParams([...outputParams, {
                                columnName: col.columnName,
                                alias: '',
                                dataType: mapDataType(col.dataType),
                                description: col.columnComment || '',
                              }]);
                            }
                          }}
                          className="accent-purple-500"
                        />
                        <span className="text-white text-sm">{col.columnName}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-[#1e293b]/60 rounded-xl border border-slate-700/50 p-6">
                  <h3 className="text-white font-medium mb-4">已选字段</h3>
                  <table className="w-full">
                    <thead className="bg-slate-800/30">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs text-slate-400">字段</th>
                        <th className="px-4 py-2 text-left text-xs text-slate-400">别名</th>
                        <th className="px-4 py-2 text-left text-xs text-slate-400">类型</th>
                        <th className="px-4 py-2 text-left text-xs text-slate-400">说明</th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {outputParams.map((param, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-white">{param.columnName}</td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={param.alias || ''}
                              onChange={(e) => updateOutputParam(index, 'alias', e.target.value)}
                              placeholder="可选"
                              className="px-2 py-1 bg-slate-800/50 border border-slate-700/50 rounded text-white text-sm"
                            />
                          </td>
                          <td className="px-4 py-2 text-slate-400 text-sm">{param.dataType}</td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={param.description || ''}
                              onChange={(e) => updateOutputParam(index, 'description', e.target.value)}
                              className="px-2 py-1 bg-slate-800/50 border border-slate-700/50 rounded text                            />
                          -white text-sm"
</td>
                          <td className="px-4 py-2">
                            <button
                              onClick={() => removeOutputParam(index)}
                              className="p-1 text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 步骤3: 参数配置 */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="bg-[#1e293b]/60 rounded-xl border border-slate-700/50 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-medium">请求参数</h3>
                    <button
                      onClick={addInputParam}
                      className="flex items-center gap-1 px-3 py-1 bg-purple-500 text-white rounded-lg text-sm"
                    >
                      <Plus className="w-3 h-3" /> 添加
                    </button>
                  </div>
                  <table className="w-full">
                    <thead className="bg-slate-800/30">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs text-slate-400">参数名</th>
                        <th className="px-4 py-2 text-left text-xs text-slate-400">对应字段</th>
                        <th className="px-4 py-2 text-left text-xs text-slate-400">类型</th>
                        <th className="px-4 py-2 text-left text-xs text-slate-400">必填</th>
                        <th className="px-4 py-2 text-left text-xs text-slate-400">默认值</th>
                        <th className="px-4 py-2 text-left text-xs text-slate-400">说明</th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {inputParams.map((param, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={param.paramName}
                              onChange={(e) => updateInputParam(index, 'paramName', e.target.value)}
                              className="px-2 py-1 bg-slate-800/50 border border-slate-700/50 rounded text-white text-sm w-24"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={param.columnName || ''}
                              onChange={(e) => updateInputParam(index, 'columnName', e.target.value)}
                              className="px-2 py-1 bg-slate-800/50 border border-slate-700/50 rounded text-white text-sm w-24"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <select
                              value={param.paramType}
                              onChange={(e) => updateInputParam(index, 'paramType', e.target.value)}
                              className="px-2 py-1 bg-slate-800/50 border border-slate-700/50 rounded text-white text-sm"
                            >
                              <option value="string">string</option>
                              <option value="integer">integer</option>
                              <option value="decimal">decimal</option>
                              <option value="date">date</option>
                              <option value="datetime">datetime</option>
                              <option value="boolean">boolean</option>
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="checkbox"
                              checked={param.required === 1}
                              onChange={(e) => updateInputParam(index, 'required', e.target.checked ? 1 : 0)}
                              className="accent-purple-500"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={param.defaultValue || ''}
                              onChange={(e) => updateInputParam(index, 'defaultValue', e.target.value)}
                              className="px-2 py-1 bg-slate-800/50 border border-slate-700/50 rounded text-white text-sm w-20"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={param.description || ''}
                              onChange={(e) => updateInputParam(index, 'description', e.target.value)}
                              className="px-2 py-1 bg-slate-800/50 border border-slate-700/50 rounded text-white text-sm"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <button
                              onClick={() => removeInputParam(index)}
                              className="p-1 text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-[#1e293b]/60 rounded-xl border border-slate-700/50 p-6">
                  <h3 className="text-white font-medium mb-4">分页配置</h3>
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="checkbox"
                      checked={formData.paginationEnabled === 1}
                      onChange={(e) => setFormData({ ...formData, paginationEnabled: e.target.checked ? 1 : 0 })}
                      className="accent-purple-500"
                    />
                    启用分页
                  </label>
                </div>
              </div>
            )}

            {/* 步骤4: Mock配置 */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-[#1e293b]/60 rounded-xl border border-slate-700/50 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-medium">Mock配置</h3>
                    <label className="flex items-center gap-2 text-white">
                      <input
                        type="checkbox"
                        checked={formData.mockEnabled === 1}
                        onChange={(e) => setFormData({ ...formData, mockEnabled: e.target.checked ? 1 : 0 })}
                        className="accent-purple-500"
                      />
                      启用Mock
                    </label>
                  </div>
                  {formData.mockEnabled === 1 && (
                    <div className="space-y-4">
                      <button
                        onClick={generateMockData}
                        className="px-3 py-1 bg-purple-500 text-white rounded-lg text-sm"
                      >
                        根据字段生成
                      </button>
                      <textarea
                        value={formData.mockData || ''}
                        onChange={(e) => setFormData({ ...formData, mockData: e.target.value })}
                        rows={15}
                        className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white font-mono text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 底部按钮 */}
      <div className="flex items-center justify-between p-4 border-t border-slate-700/50">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          上一步
        </button>
        <button
          onClick={() => {
            if (currentStep < STEPS.length - 1) {
              setCurrentStep(currentStep + 1);
            }
          }}
          disabled={!canProceed()}
          className="flex items-center gap-2 px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
        >
          {currentStep === STEPS.length - 1 ? '完成' : '下一步'}
          {currentStep < STEPS.length - 1 && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
