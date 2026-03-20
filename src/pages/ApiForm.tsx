import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save, RefreshCw, Trash2 } from 'lucide-react';
import { getDataSources, getTableList, getTableColumns, saveApi, getApiDetail } from '../lib/api';
import type { DataSource, ApiConfig, ApiInputParam, ApiOutputParam, TableInfo, ColumnInfo } from '../types';

const STEPS = ['基本信息', '参数及SQL配置', 'Mock配置'];

// 生成随机16位字符串
const generateRandomString = (length: number = 16): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function ApiForm({ overrideId }: { overrideId?: string }) {
  const navigate = useNavigate();
  const params = useParams();
  const id = overrideId || params.id;
  const [searchParams] = useSearchParams();
  const isEdit = !!id;

  const [currentStep, setCurrentStep] = useState(0);
  const [inputParamsExpanded, setInputParamsExpanded] = useState(true);
  const [outputParamsExpanded, setOutputParamsExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiParamsLoaded, setApiParamsLoaded] = useState(false);
  const [datasourcesLoaded, setDatasourcesLoaded] = useState(false);
  const isLoadingApiDetail = useRef(false);

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
    apiType: 'private', // 默认为私有
    description: '',
    querySql: '',

    mockEnabled: 1,
    mockData: '',
    status: 1,
    source: 'manual',
  });

  const [inputParams, setInputParams] = useState<ApiInputParam[]>([]);
  const [outputParams, setOutputParams] = useState<ApiOutputParam[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [generatedSql, setGeneratedSql] = useState('');

  useEffect(() => {
    loadDataSources();
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      loadApiDetail(parseInt(id));
    }
  }, [id]);

  useEffect(() => {
    if (formData.databaseName && formData.tableName && datasourcesLoaded) {
      loadColumns(formData.databaseName, formData.tableName);
    }
  }, [formData.tableName, datasourcesLoaded]);

  useEffect(() => {
    if (outputParams.length > 0 && formData.tableName) {
      generateSql();
    }
  }, [inputParams, outputParams, selectedFields, formData.tableName]);

  const loadDataSources = async () => {
    try {
      const data = await getDataSources({});
      const activeDatasources = data.list.filter((ds: DataSource) => ds.status === 1);
      setDatasources(activeDatasources);

      // 数据源加载完成后，检查URL参数并初始化表单
      const datasourceId = searchParams.get('datasourceId');
      const tableName = searchParams.get('tableName');

      if (datasourceId) {
        const dsId = parseInt(datasourceId);
        const ds = activeDatasources.find((d: DataSource) => d.id === dsId);
        if (ds) {
          // 先标记已加载，再设置表单（useEffect 会自动触发表格加载）
          setDatasourcesLoaded(true);
          setFormData(prev => ({
            ...prev,
            datasourceId: ds.id,
            datasourceName: ds.name,
            databaseName: ds.database_name || ds.dbName,
            tableName: tableName || '',
          }));
          // 如果有表名，加载表信息用于生成API名称和路径
          if (tableName) {
            loadTables(ds.databaseName).then((tableList) => {
              // 从表列表中获取表注释，生成API名称和路径
              const currentTable = tableList.find((t: TableInfo) => t.tableName === tableName);
              const tableComment = currentTable?.tableComment || tableName;
              const random5 = generateRandomString(5);
              setFormData(prev => ({
                ...prev,
                name: `${tableComment}_${random5}`,
                path: `/api/${tableName}/${random5}`,
              }));
            });
          }
        }
      } else {
        // 非URL参数模式（编辑模式或普通新建），标记数据源已加载
        setDatasourcesLoaded(true);
      }
    } catch (error) {
      console.error('Failed to load datasources:', error);
      setDatasourcesLoaded(true);
    }
  };

  const loadTables = async (database: string): Promise<TableInfo[]> => {
    try {
      const data = await getTableList(database);
      setTables(data);
      return data;
    } catch (error) {
      console.error('Failed to load tables:', error);
      return [];
    }
  };

  const loadColumns = async (dbName: string, tableName: string) => {
    try {
      const data = await getTableColumns(dbName, tableName);
      setColumns(data);
      // 仅在未加载API详情时自动生成（编辑模式下不覆盖已加载的参数）
      if (!apiParamsLoaded && !isLoadingApiDetail.current) {
        autoGenerateParams(data);
      }
    } catch (error) {
      console.error('Failed to load columns:', error);
    }
  };

  const loadApiDetail = async (apiId: number) => {
    setLoading(true);
    isLoadingApiDetail.current = true;
    try {
      const data = await getApiDetail(apiId);
      console.log('加载到的API详情:', JSON.stringify(data));
      if (data) {
        setFormData(data);
        // 设置输入参数
        if (data.inputParams) {
          console.log('inputParams:', data.inputParams);
          setInputParams(data.inputParams);
        }
        // 设置返回值和选中的字段
        if (data.outputParams) {
          console.log('outputParams:', data.outputParams);
          setOutputParams(data.outputParams);
          setSelectedFields(data.outputParams.map((p: any) => p.columnName));
        }
        // 标记API参数已加载
        setApiParamsLoaded(true);
        // 编辑模式下默认停留在基本配置步骤
        setCurrentStep(0);
        setOutputParamsExpanded(false);
      }
    } catch (error) {
      console.error('Failed to load API detail:', error);
    } finally {
      isLoadingApiDetail.current = false;
      setLoading(false);
    }
  };

  const autoGenerateParams = (cols: ColumnInfo[]) => {
    const inputs: ApiInputParam[] = [];

    // 添加表字段作为参数
    const fieldInputs = cols.map(col => ({
      paramName: col.columnName,
      columnName: col.columnName,
      paramType: col.dataType,
      required: 0,
      defaultValue: '',
      description: col.columnComment || '',
    }));

    setInputParams([...inputs, ...fieldInputs]);

    // 生成返回值 - 使用表字段，自动设置别名
    const outputs: ApiOutputParam[] = cols.map(col => ({
      columnName: col.columnName,
      alias: col.columnName, // 默认使用字段名作为别名
      dataType: col.dataType,
      description: col.columnComment || '',
    }));

    setOutputParams(outputs);
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
      const dbName = ds.databaseName || ds.database_name || ds.dbName || '';
      setFormData(prev => ({
        ...prev,
        datasourceId: ds.id,
        datasourceName: ds.name,
        databaseName: dbName,
        tableName: '',
      }));
      setTables([]);
      setColumns([]);
      setInputParams([]);
      setOutputParams([]);
      setSelectedFields([]);
      // 加载表列表
      if (dbName) {
        loadTables(dbName);
      }
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

  // 返回值操作函数
  const updateOutputParam = (index: number, field: keyof ApiOutputParam, value: any) => {
    const newParams = [...outputParams];
    newParams[index] = { ...newParams[index], [field]: value };
    setOutputParams(newParams);
  };

  const removeOutputParam = (index: number) => {
    setOutputParams(outputParams.filter((_, i) => i !== index));
  };

  const toggleOutputField = (columnName: string) => {
    if (selectedFields.includes(columnName)) {
      setSelectedFields(selectedFields.filter(f => f !== columnName));
    } else {
      setSelectedFields([...selectedFields, columnName]);
    }
  };

  const toggleAllOutputFields = (checked: boolean) => {
    if (checked) {
      setSelectedFields(outputParams.map(p => p.columnName));
    } else {
      setSelectedFields([]);
    }
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

    // 使用返回值生成查询字段，支持别名
    const queryFields = outputParams
      .filter(p => selectedFields.includes(p.columnName))
      .map(p => {
        if (p.alias && p.alias !== p.columnName) {
          return `${p.columnName} AS ${p.alias}`;
        }
        return p.columnName;
      })
      .join(', ');

    const whereConditions = inputParams
      .filter(p => p.columnName)
      .map(p => {
        const operator = getOperator(p.paramType);
        if (p.paramType === 'string') {
          return `  <if test="${p.paramName} != null and ${p.paramName} != ''">
    AND ${p.columnName} LIKE CONCAT('%', #{${p.paramName}}, '%')
  </if>`;
        }
        return `  <if test="${p.paramName} != null">
    AND ${p.columnName} ${operator} #{${p.paramName}}
  </if>`;
      })
      .join('\n');

    const sql = `SELECT ${queryFields || '*'}
FROM ${tableName}
<where>
${whereConditions || '  1=1'}
</where>`;

    setGeneratedSql(sql);
  };

  const generateMockData = () => {
    // 生成3条模拟数据记录，每条记录包含所有选中字段
    const mockList = Array.from({ length: 3 }, (_, rowIndex) => {
      const record: any = {};
      selectedFields.forEach((field, colIndex) => {
        const param = inputParams.find(p => p.columnName === field);
        record[field] = getMockValue(param?.paramType || 'string', rowIndex * selectedFields.length + colIndex);
      });
      return record;
    });

    const mock: any = {
      code: 1,
      data: {
        list: mockList,
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
      // 如果用户没有手动编辑过SQL，则使用生成的SQL
      const finalSql = formData.querySql || generatedSql;

      const selectedOutputParams = outputParams.filter(p => selectedFields.includes(p.columnName));

      const finalFormData = {
        ...formData,
        querySql: finalSql,
        inputParams: inputParams,
        outputParams: selectedOutputParams
      };

      console.log('保存数据:', JSON.stringify(finalFormData));
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
        return inputParams.length > 0 && selectedFields.length > 0;
      default:
        return true;
    }
  };

  // 保存按钮校验：基本信息必填 + 至少有一个输出字段
  const canSave = () => {
    return formData.name && formData.path && formData.datasourceId && formData.tableName && selectedFields.length > 0;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-light)]">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/apis')} className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)]">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-[var(--text-primary)]">{isEdit ? '编辑API' : '创建API'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/apis')} className="px-4 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">取消</button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 p-4 border-b border-[var(--border-light)]">
        {STEPS.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm ${
              index < currentStep ? 'bg-green-500 text-[var(--text-primary)]' :
              index === currentStep ? 'bg-[var(--accent)] text-[var(--text-primary)]' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
            }`}>
              {index < currentStep ? '✓' : index + 1}
            </div>
            <span className={`ml-2 text-sm ${index === currentStep ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>{step}</span>
            {index < STEPS.length - 1 && <div className={`w-12 h-0.5 mx-4 ${index < currentStep ? 'bg-green-500' : 'bg-[var(--bg-secondary)]'}`} />}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? <div className="flex items-center justify-center h-full text-[var(--text-muted)]">加载中...</div> : (
          <>
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="bg-[var(--bg-secondary)]/60 rounded-xl border border-[var(--border-light)] p-6 space-y-4">
                  <h3 className="text-[var(--text-primary)] font-medium">基本信息</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-[var(--text-muted)] mb-2">数据源 * (只显示启用)</label>
                      <select value={formData.datasourceId || ''} onChange={(e) => handleDataSourceChange(parseInt(e.target.value))} className="w-full px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)]">
                        <option value="">请选择数据源</option>
                        {datasources.map(ds => <option key={ds.id} value={ds.id}>{ds.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-[var(--text-muted)] mb-2">数据库</label>
                      <input type="text" value={formData.databaseName} readOnly className="w-full px-4 py-2.5 bg-[var(--bg-table-header)] border border-[var(--border-light)] rounded-lg text-[var(--text-muted)]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-[var(--text-muted)] mb-2">表 *</label>
                      <div className="flex gap-2">
                        <select value={formData.tableName} onChange={(e) => handleTableChange(e.target.value)} className="flex-1 px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)]">
                          <option value="">请选择表</option>
                          {tables.map(t => <option key={t.tableName} value={t.tableName}>{t.tableName} {t.tableComment ? `(${t.tableComment})` : ''}</option>)}
                        </select>
                        <button onClick={() => formData.databaseName && loadTables(formData.databaseName)} className="px-3 py-2 bg-[var(--bg-secondary)] rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"><RefreshCw className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-[var(--text-muted)] mb-2">请求方式</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-[var(--text-primary)]"><input type="radio" name="method" checked={formData.method === 'GET'} onChange={() => setFormData({ ...formData, method: 'GET' })} className="accent-[var(--accent)]" />GET</label>
                        <label className="flex items-center gap-2 text-[var(--text-primary)]"><input type="radio" name="method" checked={formData.method === 'POST'} onChange={() => setFormData({ ...formData, method: 'POST' })} className="accent-[var(--accent)]" />POST</label>
                      </div>
                    </div>
                  </div>
                  <div><label className="block text-sm text-[var(--text-muted)] mb-2">API名称 *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="例如：用户查询" className="w-full px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" /></div>
                  <div><label className="block text-sm text-[var(--text-muted)] mb-2">API路径 *</label><input type="text" value={formData.path} onChange={(e) => setFormData({ ...formData, path: e.target.value })} placeholder="例如：/api/user/list" className="w-full px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" /></div>
                  <div>
                    <label className="block text-sm text-[var(--text-muted)] mb-2">权限类型</label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 text-[var(--text-primary)]">
                        <input
                          type="radio"
                          name="apiType"
                          checked={formData.apiType === 'private'}
                          onChange={() => setFormData({ ...formData, apiType: 'private' })}
                          className="accent-[var(--accent)]"
                        />
                        私有
                        <span className="text-xs text-[var(--text-muted)] ml-1">(需授权)</span>
                      </label>
                      <label className="flex items-center gap-2 text-[var(--text-primary)]">
                        <input
                          type="radio"
                          name="apiType"
                          checked={formData.apiType === 'public'}
                          onChange={() => setFormData({ ...formData, apiType: 'public' })}
                          className="accent-[var(--accent)]"
                        />
                        公有
                        <span className="text-xs text-[var(--text-muted)] ml-1">(无需授权)</span>
                      </label>
                    </div>
                  </div>
                  <div><label className="block text-sm text-[var(--text-muted)] mb-2">描述</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" /></div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                {/* 请求参数 - 可折叠 */}
                <div className="bg-[var(--bg-secondary)]/60 rounded-xl border border-[var(--border-light)] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setInputParamsExpanded(!inputParamsExpanded)} className="flex items-center gap-2 text-[var(--text-primary)] font-medium">
                      <span>{inputParamsExpanded ? '▼' : '▶'}</span>
                      <span>请求参数（{inputParams.length}）</span>
                    </button>
                    {inputParamsExpanded && (
                      <div className="flex gap-2">
                        <button onClick={() => setInputParams([...inputParams, { paramName: '', columnName: '', paramType: 'string', required: 0, defaultValue: '', description: '' }])} className="px-3 py-1 bg-green-600 text-[var(--text-primary)] rounded-lg text-sm">+ 新增</button>
                      </div>
                    )}
                  </div>
                  {inputParamsExpanded && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-[var(--bg-table-header)]">
                          <tr><th className="px-4 py-2 text-left text-xs text-[var(--text-muted)]">#</th><th className="px-4 py-2 text-left text-xs text-[var(--text-muted)]">参数名</th><th className="px-4 py-2 text-left text-xs text-[var(--text-muted)]">对应字段</th><th className="px-4 py-2 text-left text-xs text-[var(--text-muted)]">类型</th><th className="px-4 py-2 text-left text-xs text-[var(--text-muted)]">必填</th><th className="px-4 py-2 text-left text-xs text-[var(--text-muted)]">默认值</th><th className="px-4 py-2 text-left text-xs text-[var(--text-muted)]">说明</th><th className="px-4 py-2"></th></tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-light)]">
                          {inputParams.map((param, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 text-[var(--text-muted)]">{index + 1}</td>
                              <td className="px-4 py-2"><input type="text" value={param.paramName} onChange={(e) => updateInputParam(index, 'paramName', e.target.value)} className="px-2 py-1 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded text-[var(--text-primary)] text-sm w-24" /></td>
                              <td className="px-4 py-2"><input type="text" value={param.columnName || ''} onChange={(e) => updateInputParam(index, 'columnName', e.target.value)} className="px-2 py-1 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded text-[var(--text-primary)] text-sm w-24" /></td>
                              <td className="px-4 py-2"><select value={param.paramType} onChange={(e) => updateInputParam(index, 'paramType', e.target.value)} className="px-2 py-1 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded text-[var(--text-primary)] text-sm"><option value="string">string</option><option value="integer">integer</option><option value="decimal">decimal</option><option value="date">date</option><option value="datetime">datetime</option><option value="boolean">boolean</option></select></td>
                              <td className="px-4 py-2"><input type="checkbox" checked={param.required === 1} onChange={(e) => updateInputParam(index, 'required', e.target.checked ? 1 : 0)} className="accent-[var(--accent)]" /></td>
                              <td className="px-4 py-2"><input type="text" value={param.defaultValue || ''} onChange={(e) => updateInputParam(index, 'defaultValue', e.target.value)} className="px-2 py-1 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded text-[var(--text-primary)] text-sm w-20" /></td>
                              <td className="px-4 py-2"><input type="text" value={param.description || ''} onChange={(e) => updateInputParam(index, 'description', e.target.value)} className="px-2 py-1 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded text-[var(--text-primary)] text-sm" /></td>
                              <td className="px-4 py-2"><button onClick={() => removeInputParam(index)} className="p-1 text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 返回值 - 可折叠 */}
                <div className="bg-[var(--bg-secondary)]/60 rounded-xl border border-[var(--border-light)] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setOutputParamsExpanded(!outputParamsExpanded)} className="flex items-center gap-2 text-[var(--text-primary)] font-medium">
                      <span>{outputParamsExpanded ? '▼' : '▶'}</span>
                      <span>返回值（{selectedFields.length}/{outputParams.length}）</span>
                    </button>
                  </div>
                  {outputParamsExpanded && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-[var(--bg-table-header)]">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs text-[var(--text-muted)]">#</th>
                            <th className="px-4 py-2 text-left text-xs text-[var(--text-muted)]">字段名</th>
                            <th className="px-4 py-2 text-left text-xs text-[var(--text-muted)]">别名</th>
                            <th className="px-4 py-2 text-left text-xs text-[var(--text-muted)]">类型</th>
                            <th className="px-4 py-2 text-left text-xs text-[var(--text-muted)]">说明</th>
                            <th className="px-4 py-2"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-light)]">
                          {outputParams.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-4 text-center text-[var(--text-muted)]">请先在第一步选择表</td>
                            </tr>
                          ) : outputParams.map((param, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 text-[var(--text-muted)]">{index + 1}</td>
                              <td className="px-4 py-2 text-[var(--text-primary)] text-sm">{param.columnName}</td>
                              <td className="px-4 py-2">
                                <input
                                  type="text"
                                  value={param.alias || ''}
                                  onChange={(e) => updateOutputParam(index, 'alias', e.target.value)}
                                  placeholder="输入别名"
                                  className="px-2 py-1 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded text-[var(--text-primary)] text-sm w-28"
                                />
                              </td>
                              <td className="px-4 py-2 text-[var(--text-muted)] text-sm">{param.dataType}</td>
                              <td className="px-4 py-2">
                                <input
                                  type="text"
                                  value={param.description || ''}
                                  onChange={(e) => updateOutputParam(index, 'description', e.target.value)}
                                  className="px-2 py-1 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded text-[var(--text-primary)] text-sm"
                                />
                              </td>
                              <td className="px-4 py-2">
                                <button onClick={() => removeOutputParam(index)} className="p-1 text-red-400 hover:text-red-300">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* SQL配置 */}
                <div className="bg-[var(--bg-secondary)]/60 rounded-xl border border-[var(--border-light)] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[var(--text-primary)] font-medium">SQL配置</h3>
                    <button onClick={generateSql} className="px-3 py-1 bg-[var(--accent)] text-[var(--text-primary)] rounded-lg text-sm">重新生成</button>
                  </div>
                  <textarea
                    value={formData.querySql || generatedSql || ''}
                    onChange={(e) => setFormData({ ...formData, querySql: e.target.value })}
                    rows={12}
                    className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-light)] rounded-lg text-green-400 font-mono text-sm resize-none"
                    placeholder="编写你的SQL查询语句..."
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="bg-[var(--bg-secondary)]/60 rounded-xl border border-[var(--border-light)] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[var(--text-primary)] font-medium">Mock配置</h3>
                    <label className="flex items-center gap-2 text-[var(--text-primary)]"><input type="checkbox" checked={formData.mockEnabled === 1} onChange={(e) => setFormData({ ...formData, mockEnabled: e.target.checked ? 1 : 0 })} className="accent-[var(--accent)]" />启用Mock</label>
                  </div>
                  {formData.mockEnabled === 1 && (
                    <div className="space-y-4">
                      <button onClick={generateMockData} className="px-3 py-1 bg-[var(--accent)] text-[var(--text-primary)] rounded-lg text-sm">根据字段生成</button>
                      <textarea value={formData.mockData || ''} onChange={(e) => setFormData({ ...formData, mockData: e.target.value })} rows={15} className="w-full px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] font-mono text-sm" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex items-center justify-between p-4 border-t border-[var(--border-light)]">
        <button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0} className="flex items-center gap-2 px-4 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-50"><ArrowLeft className="w-4 h-4" />上一步</button>
        <div className="flex items-center gap-2">
          {currentStep === STEPS.length - 1 ? (
            <>
              <button onClick={() => navigate('/apis')} className="px-4 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">取消</button>
              <button onClick={handleSave} disabled={!canSave() || saving} className="flex items-center gap-2 px-6 py-2 bg-[var(--accent)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--accent)] disabled:opacity-50">
                <Save className="w-4 h-4" />{saving ? '保存中...' : '保存'}
              </button>
            </>
          ) : (
            <button onClick={() => { if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1); }} disabled={!canProceed()} className="flex items-center gap-2 px-6 py-2 bg-[var(--accent)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--accent)] disabled:opacity-50">下一步<ArrowRight className="w-4 h-4" /></button>
          )}
        </div>
      </div>
    </div>
  );
}
