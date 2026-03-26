import React from 'react';
import ReactECharts from 'echarts-for-react';
import { ChartShell, type ChartShellProps } from '../ChartShell';

export interface LineChartData {
  xAxis: string[];
  series: Array<{
    name: string;
    data: number[];
  }>;
}

export interface LineChartProps extends Omit<ChartShellProps, 'children'> {
  data: LineChartData;
  height?: number;
}

/**
 * 折线图组件
 */
export const LineChart: React.FC<LineChartProps> = ({
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
      boundaryGap: false,
      data: data.xAxis,
    },
    yAxis: {
      type: 'value',
    },
    series: data.series?.map((s) => ({
      name: s.name,
      type: 'line',
      data: s.data,
      smooth: true,
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
