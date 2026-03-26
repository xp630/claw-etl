/**
 * 数据集表单页面
 * 支持创建和编辑数据集
 */

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Space, message, Select } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useDataset } from './hooks/useDataset';
import { getDataSources } from '../../lib/api';
import type { ChartDataset } from './types';
import type { DataSource } from '../../types';

// Content removed
const { TextArea } = Input;

export const DatasetForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const { createDataset, updateDataset, getDataset } = useDataset();
  const [loading, setLoading] = useState(false);
  const [datasources, setDatasources] = useState<DataSource[]>([]);

  useEffect(() => {
    // 加载数据源列表
    getDataSources({ page: 1, limit: 1000 }).then((res) => setDatasources(res.list)).catch(() => {});

    if (isEdit && id) {
      getDataset(id).then((dataset) => {
        if (dataset) {
          form.setFieldsValue({
            name: dataset.name,
            datasourceId: dataset.datasourceId,
            sql: dataset.sql,
            description: dataset.description,
          });
        }
      });
    }
  }, [id, isEdit, getDataset, form]);

  const handleSubmit = async (values: Record<string, string>) => {
    setLoading(true);
    try {
      if (isEdit && id) {
        await updateDataset(id, values);
        message.success('更新成功');
      } else {
        await createDataset(values);
        message.success('创建成功');
      }
      navigate('/report/datasets');
    } catch (error) {
      message.error(isEdit ? '更新失败' : '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card title={isEdit ? '编辑数据集' : '新建数据集'}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="数据集名称"
            name="name"
            rules={[{ required: true, message: '请输入数据集名称' }]}
          >
            <Input placeholder="请输入数据集名称" />
          </Form.Item>

          <Form.Item
            label="数据源"
            name="datasourceId"
            rules={[{ required: true, message: '请选择数据源' }]}
          >
            <Select placeholder="请选择数据源" allowClear>
              {datasources.map((ds) => (
                <Select.Option key={ds.id} value={ds.id}>
                  {ds.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="SQL查询"
            name="sql"
            rules={[{ required: true, message: '请输入SQL查询语句' }]}
          >
            <TextArea rows={6} placeholder="SELECT * FROM ..." />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
          >
            <TextArea rows={3} placeholder="请输入描述（可选）" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {isEdit ? '保存' : '创建'}
              </Button>
              <Button onClick={() => navigate('/report/datasets')}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default DatasetForm;
