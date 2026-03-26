import React from 'react';
import ReactECharts from 'echarts-for-react';
import { ChartShell, type ChartShellProps } from '../ChartShell';

export interface BarChartData {
  xAxis: string[];
  series: Array<{
    name: string;
    data: number[];
  }>;
}

export interface BarChartProps extends Omit<ChartShellProps, 'children'> {
  data: BarChartData;
  height?: number;
}

/**
 * 柱状图组件
 */
export const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  loading = false,
  error,
  height = 300,
}) => {
  const isEmpty = !data.xAxis?.length && !data.series?.length;

  const option = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: data.series?.map((s) => s.name),
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.xAxis,
    },
    yAxis: {
      type: 'value',
    },
    series: data.series?.map((s) => ({
      name: s.name,
      type: 'bar',
      data: s.data,
    })),
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
