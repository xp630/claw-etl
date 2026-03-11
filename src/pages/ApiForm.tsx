import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save, RefreshCw, Trash2 } from 'lucide-react';
import { getDataSources, getTableList, getTableColumns, saveApi, getApiDetail } from '../lib/api';
import type { DataSource, ApiConfig, ApiInputParam, TableInfo, ColumnInfo } from '../types';

const STEPS = ['基本信息', '参数配置', 'SQL配置', 'Mock配置'];

export default function ApiForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [datasources, setDatasources] = useState<DataSource[]>([]);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);

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

  const [inputParams, setInputParams] = useState<ApiInputParam[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [generatedSql, setGeneratedSql] = useState('');

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

  useEffect(() => {
    if (inputParams.length > 0 && formData.tableName) {
      generateSql();
    }
  }, [inputParams, formData.tableName]);

  const loadDataSources = async () => {
    try {
      const data = await getDataSources();
      const activeDatasources = data.filter((ds: DataSource) => ds.status === 1);
      setDatasources(activeDatasources);
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
      }
    } catch (error) {
      console.error('Failed to load API detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const autoGenerateParams = (cols: ColumnInfo[]) => {
    const inputs: ApiInputParam[] = cols.map(col => ({
      paramName: col.columnName,
      columnName: col.columnName,
      paramType: mapDataType(col.dataType),
      required: 0,
      defaultValue: '',
      description: col.columnComment || '',
    }));
    inputs.push(
      { paramName: 'page', paramType: 'integer', required: 0, defaultValue: '1', description: '页码' },
      { paramName: 'pageSize', paramType: 'integer', required: 0, defaultValue: '10', description: '每页条数' }
    );
    setInputParams(inputs);
    setSelectedFields(cols.map((c: ColumnInfo) => c.columnName));
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
      setInputParams([]);
      setSelectedFields([]);
    }
  };

  const handleTableChange = (tableName: string) => {
    setFormData(prev => ({ ...prev, tableName }));
  };

  const toggleAllParams = (checked: boolean) => {
    if (checked) {
      setInputParams(inputParams.map(p => ({ ...p, required: 1 })));
    } else {
      setInputParams(inputParams.map(p => ({ ...p, required: 0 })));
    }
  };

  const batchSetDefault = (defaultValue: string) => {
    const newParams = inputParams.map(p => ({ ...p, defaultValue }));
    setInputParams(newParams);
  };

  const updateInputParam = (index: number, field: keyof ApiInputParam, value: any) => {
    const newParams = [...inputParams];
    newParams[index] = { ...newParams[index], [field]: value };
    setInputParams(newParams);
  };

  const removeInputParam = (index: number) => {
    setInputParams(inputParams.filter((_, i) => i !== index));
  };

  const getOperator = (paramType: string): string => {
    switch (paramType) {
      case 'string': return 'LIKE';
      default: return '=';
    }
  };

  const generateSql = () => {
    const tableName = formData.tableName;
    if (!tableName) return;

    const queryFields = selectedFields.length > 0 ? selectedFields.join(', ') : '*';
    
    const whereConditions = inputParams
      .filter(p => p.columnName)
      .map(p => {
        const operator = getOperator(p.paramType);
        if (p.paramType === 'string') {
          return `    <if test="${p.paramName} != null and ${p.paramName} != ''">
      AND ${p.columnName} LIKE CONCAT('%', #{${p.paramName}}, '%')
    </if>`;
        }
        return `    <if test="${p.paramName} != null">
      AND ${p.columnName} ${operator} #{${p.paramName}}
    </if>`;
      })
      .join('\n');

    const sql = `<select id="${formData.name || 'query'}" parameterType="map" resultType="map">
  SELECT ${queryFields}
  FROM ${tableName}
  <where>
${whereConditions || '    1=1'}
  </where>
  <if test="page != null and pageSize != null">
    LIMIT #{pageSize}
    OFFSET #{page}
  </if>
</select>`;

    setGeneratedSql(sql);
  };

  const generateMockData = () => {
    const mock: any = {
      code: 1,
      data: {
        list: selectedFields.slice(0, 3).map((field, i) => {
          const param = inputParams.find(p => p.columnName === field);
          const obj: any = {};
          obj[field] = getMockValue(param?.paramType || 'string', i);
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

  const getMockValue = (type: string, index: number): any => {
    switch (type) {
      case 'integer': return index + 1;
      case 'decimal': return (index + 1) * 1.5;
      case 'boolean': return true;
      case 'date': return '2026-01-01';
      case 'datetime': return '2026-01-01 10:00:00';
      default: return `sample${index + 1}`;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const queryFields = selectedFields.join(', ');
      const finalFormData = { ...formData, queryFields };
      await saveApi(finalFormData);
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
        return inputParams.length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/apis')} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-white">{isEdit ? '编辑API' : '创建API'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/apis')} className="px-4 py-2 text-slate-400 hover:text-white">取消</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 p-4 border-b border-slate-700/50">
        {STEPS.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm ${
              index < currentStep ? 'bg-green-500 text-white' :
              index === currentStep ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-400'
            }`}>
              {index < currentStep ? '✓' : index + 1}
            </div>
            <span className={`ml-2 text-sm ${index === currentStep ? 'text-white' : 'text-slate-400'}`}>{step}</span>
            {index < STEPS.length - 1 && <div className={`w-12 h-0.5 mx-4 ${index < currentStep ? 'bg-green-500' : 'bg-slate-700'}`} />}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? <div className="flex items-center justify-center h-full text-slate-400">加载中...</div> : (
          <>
            {currentStep === 0 && (
              <div className="max-w-2xl space-y-6">
                <div className="bg-[#1e293b]/60 rounded-xl border border-slate-700/50 p-6 space-y-4">
                  <h3 className="text-white font-medium">基本信息</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">数据源 * (只显示启用)</label>
                      <select value={formData.datasourceId || ''} onChange={(e) => handleDataSourceChange(parseInt(e.target.value))} className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white">
                        <option value="">请选择数据源</option>
                        {datasources.map(ds => <option key={ds.id} value={ds.id}>{ds.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">数据库</label>
                      <input type="text" value={formData.databaseName} readOnly className="w-full px-4 py-2.5 bg-slate-800/30 border border-slate-700/50 rounded-lg text-slate-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">表 *</label>
                      <div className="flex gap-2">
                        <select value={formData.tableName} onChange={(e) => handleTableChange(e.target.value)} className="flex-1 px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white">
                          <option value="">请选择表</option>
                          {tables.map(t => <option key={t.tableName} value={t.tableName}>{t.tableName} {t.tableComment ? `(${t.tableComment})` : ''}</option>)}
                        </select>
                        <button onClick={() => formData.databaseName && loadTables(formData.databaseName)} className="px-3 py-2 bg-slate-700 rounded-lg text-slate-300 hover:bg-slate-600"><RefreshCw className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">请求方式</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-white"><input type="radio" name="method" checked={formData.method === 'GET'} onChange={() => setFormData({ ...formData, method: 'GET' })} className="accent-purple-500" />GET</label>
                        <label className="flex items-center gap-2 text-white"><input type="radio" name="method" checked={formData.method === 'POST'} onChange={() => setFormData({ ...formData, method: 'POST' })} className="accent-purple-500" />POST</label>
                      </div>
                    </div>
                  </div>
                  <div><label className="block text-sm text-slate-400 mb-2">API名称 *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="例如：用户查询" className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500" /></div>
                  <div><label className="block text-sm text-slate-400 mb-2">API路径 *</label><input type="text" value={formData.path} onChange={(e) => setFormData({ ...formData, path: e.target.value })} placeholder="例如：/api/user/list" className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500" /></div>
                  <div><label className="block text-sm text-slate-400 mb-2">描述</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500" /></div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="bg-[#1e293b]/60 rounded-xl border border-slate-700/50 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-medium">请求参数（自动生成，可批量删除）</h3>
                    <div className="flex gap-2">
                      <button onClick={() => toggleAllParams(true)} className="px-3 py-1 bg-slate-700 text-white rounded-lg text-sm">全选</button>
                      <button onClick={() => toggleAllParams(false)} className="px-3 py-1 bg-slate-700 text-white rounded-lg text-sm">取消全选</button>
                      <button onClick={() => batchSetDefault('')} className="px-3 py-1 bg-slate-700 text-white rounded-lg text-sm">清空默认值</button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-800/30">
                        <tr><th className="px-4 py-2 text-left text-xs text-slate-400">#</th><th className="px-4 py-2 text-left text-xs text-slate-400">参数名</th><th className="px-4 py-2 text-left text-xs text-slate-400">对应字段</th><th className="px-4 py-2 text-left text-xs text-slate-400">类型</th><th className="px-4 py-2 text-left text-xs text-slate-400">必填</th><th className="px-4 py-2 text-left text-xs text-slate-400">默认值</th><th className="px-4 py-2 text-left text-xs text-slate-400">说明</th><th className="px-4 py-2"></th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {inputParams.map((param, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-slate-400">{index + 1}</td>
                            <td className="px-4 py-2"><input type="text" value={param.paramName} onChange={(e) => updateInputParam(index, 'paramName', e.target.value)} className="px-2 py-1 bg-slate-800/50 border border-slate-700/50 rounded text-white text-sm w-24" /></td>
                            <td className="px-4 py-2"><input type="text" value={param.columnName || ''} onChange={(e) => updateInputParam(index, 'columnName', e.target.value)} className="px-2 py-1 bg-slate-800/50 border border-slate-700/50 rounded text-white text-sm w-24" /></td>
                            <td className="px-4 py-2"><select value={param.paramType} onChange={(e) => updateInputParam(index, 'paramType', e.target.value)} className="px-2 py-1 bg-slate-800/50 border border-slate-700/50 rounded text-white text-sm"><option value="string">string</option><option value="integer">integer</option><option value="decimal">decimal</option><option value="date">date</option><option value="datetime">datetime</option><option value="boolean">boolean</option></select></td>
                            <td className="px-4 py-2"><input type="checkbox" checked={param.required === 1} onChange={(e) => updateInputParam(index, 'required', e.target.checked ? 1 : 0)} className="accent-purple-500" /></td>
                            <td className="px-4 py-2"><input type="text" value={param.defaultValue || ''} onChange={(e) => updateInputParam(index, 'defaultValue', e.target.value)} className="px-2 py-1 bg-slate-800/50 border border-slate-700/50 rounded text-white text-sm w-20" /></td>
                            <td className="px-4 py-2"><input type="text" value={param.description || ''} onChange={(e) => updateInputParam(index, 'description', e.target.value)} className="px-2 py-1 bg-slate-800/50 border border-slate-700/50 rounded text-white text-sm" /></td>
                            <td className="px-4 py-2"><button onClick={() => removeInputParam(index)} className="p-1 text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="bg-[#1e293b]/60 rounded-xl border border-slate-700/50 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-medium">SQL配置（基于参数自动生成）</h3>
                    <button onClick={generateSql} className="px-3 py-1 bg-purple-500 text-white rounded-lg text-sm">重新生成</button>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-lg overflow-auto max-h-80">
                    <pre className="text-green-400 text-sm font-mono whitespace-pre">{generatedSql || '请先完成参数配置'}</pre>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-[#1e293b]/60 rounded-xl border border-slate-700/50 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-medium">Mock配置</h3>
                    <label className="flex items-center gap-2 text-white"><input type="checkbox" checked={formData.mockEnabled === 1} onChange={(e) => setFormData({ ...formData, mockEnabled: e.target.checked ? 1 : 0 })} className="accent-purple-500" />启用Mock</label>
                  </div>
                  {formData.mockEnabled === 1 && (
                    <div className="space-y-4">
                      <button onClick={generateMockData} className="px-3 py-1 bg-purple-500 text-white rounded-lg text-sm">根据字段生成</button>
                      <textarea value={formData.mockData || ''} onChange={(e) => setFormData({ ...formData, mockData: e.target.value })} rows={15} className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white font-mono text-sm" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex items-center justify-between p-4 border-t border-slate-700/50">
        <button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0} className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white disabled:opacity-50"><ArrowLeft className="w-4 h-4" />上一步</button>
        <button onClick={() => { if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1); }} disabled={!canProceed()} className="flex items-center gap-2 px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50">{currentStep === STEPS.length - 1 ? '完成' : '下一步'}{currentStep < STEPS.length - 1 && <ArrowRight className="w-4 h-4" />}</button>
      </div>
    </div>
  );
}
