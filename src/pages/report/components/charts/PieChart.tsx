import React from 'react';
import ReactECharts from 'echarts-for-react';
import { ChartShell, type ChartShellProps } from '../ChartShell';

export interface PieChartData {
  series: Array<{
    name: string;
    value: number;
  }>;
}

export interface PieChartProps extends Omit<ChartShellProps, 'children'> {
  data: PieChartData;
  height?: number;
}

/**
 * 饼图组件
 */
export const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  loading = false,
  error,
  height = 300,
}) => {
  const isEmpty = !data.series?.length;

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      data: data.series?.map((s) => s.name),
    },
    series: [
      {
        name: '数据',
        type: 'pie',
        radius: '50%',
        data: data.series,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };

  if (isEmpty) {
    return <ChartShell title={title} data={[]} loading={loading} error={error} />;
  }

  return (
    <ChartShell title={title} data={data} loading={loading} error={error}>
      <ReactECharts
        option={option}
        style={{ height: `${height}px`, width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </ChartShell>
  );
};
