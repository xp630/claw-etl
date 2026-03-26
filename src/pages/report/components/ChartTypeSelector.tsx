/**
 * 图表类型选择器组件
 * 可视化选择图表类型，简化添加流程
 */

import React from 'react';
import { Card, Modal, Form, Input, Space, Typography } from 'antd';
import { LineChartOutlined, BarChartOutlined, PieChartOutlined, TableOutlined } from '@ant-design/icons';
import type { ChartConfig } from '../types/report';

const { Text } = Typography;

export interface ChartTypeSelectorProps {
  /** 弹窗是否打开 */
  open: boolean;
  /** 关闭弹窗 */
  onCancel: () => void;
  /** 选择图表类型后的回调 */
  onSelect: (type: ChartConfig['type'], title: string) => void;
}

// 图表类型定义
const CHART_TYPES: Array<{
  type: ChartConfig['type'];
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
}> = [
  {
    type: 'line',
    icon: <LineChartOutlined style={{ fontSize: 32 }} />,
    label: '折线图',
    description: '展示数据随时间变化的趋势',
    color: '#00d4ff',
  },
  {
    type: 'bar',
    icon: <BarChartOutlined style={{ fontSize: 32 }} />,
    label: '柱状图',
    description: '对比不同类别的数据大小',
    color: '#7b2cbf',
  },
  {
    type: 'pie',
    icon: <PieChartOutlined style={{ fontSize: 32 }} />,
    label: '饼图',
    description: '展示各部分占总体的比例',
    color: '#ff6b6b',
  },
  {
    type: 'table',
    icon: <TableOutlined style={{ fontSize: 32 }} />,
    label: '数据表',
    description: '展示结构化的表格数据',
    color: '#00ff88',
  },
];

/**
 * 图表类型选择器
 * 
 * 使用方式：
 * const [selectorOpen, setSelectorOpen] = useState(false);
 * 
 * <ChartTypeSelector
 *   open={selectorOpen}
 *   onCancel={() => setSelectorOpen(false)}
 *   onSelect={(type, title) => {
 *     // 添加图表逻辑
 *     setSelectorOpen(false);
 *   }}
 * />
 */
export const ChartTypeSelector: React.FC<ChartTypeSelectorProps> = ({
  open,
  onCancel,
  onSelect,
}) => {
  const [form] = Form.useForm();

  const handleOk = () => {
    const values = form.getFieldsValue();
    if (values.title && values.type) {
      onSelect(values.type, values.title);
      form.resetFields();
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const handleTypeSelect = (type: ChartConfig['type']) => {
    form.setFieldsValue({ type });
  };

  return (
    <Modal
      title="选择图表类型"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="确认添加"
      cancelText="取消"
      width={520}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ type: undefined, title: '' }}
      >
        {/* 图表类型卡片选择 */}
        <Form.Item
          name="type"
          label="图表类型"
          rules={[{ required: true, message: '请选择图表类型' }]}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
          }}>
            {CHART_TYPES.map((chartType) => (
              <Card
                key={chartType.type}
                hoverable
                onClick={() => handleTypeSelect(chartType.type)}
                style={{
                  borderColor: 'transparent',
                  transition: 'all 0.3s ease',
                }}
                styles={{
                  body: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: 16,
                  }
                }}
                className="chart-type-card"
              >
                <div style={{ color: chartType.color, marginBottom: 8 }}>
                  {chartType.icon}
                </div>
                <Text strong style={{ marginBottom: 4 }}>{chartType.label}</Text>
                <Text type="secondary" style={{ fontSize: 12, textAlign: 'center' }}>
                  {chartType.description}
                </Text>
              </Card>
            ))}
          </div>
        </Form.Item>

        {/* 图表标题 */}
        <Form.Item
          name="title"
          label="图表标题"
          rules={[{ required: true, message: '请输入图表标题' }]}
        >
          <Input placeholder="例如：月度销售趋势" />
        </Form.Item>

        {/* 提示信息 */}
        <div style={{
          background: '#f5f5f5',
          padding: 12,
          borderRadius: 6,
          marginTop: 8,
        }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            💡 其他配置（数据集、X轴、Y轴）可在图表配置弹窗中单独设置。
          </Text>
        </div>
      </Form>

      <style>{`
        .chart-type-card:hover {
          border-color: #00d4ff !important;
          box-shadow: 0 2px 8px rgba(0, 212, 255, 0.2);
        }
      `}</style>
    </Modal>
  );
};

export default ChartTypeSelector;
