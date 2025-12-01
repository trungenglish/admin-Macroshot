import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { VENDOR_MONITORED } from '@/constants';
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from 'recharts';

const chartConfig = {
  monitored: { 
    label: 'Total monitored', 
    color: 'var(--chart-3)' 
  },
  limit: { 
    label: 'Unmonitored', 
    color: 'var(--chart-secondary)' 
  },
} satisfies ChartConfig;

export const AppRadialChart = () => {
  const totalLimits = VENDOR_MONITORED[0].monitored + VENDOR_MONITORED[0].limit;
  return (
    <ChartContainer
      config={chartConfig}
      className='w-[200px] h-[110px]'
    >
      <RadialBarChart
        data={VENDOR_MONITORED}
        innerRadius={90}
        outerRadius={140}
        cy={104}
        startAngle={0}
        endAngle={180}
      >
        <RadialBar
          dataKey='limit'
          stackId='a'
          fill='var(--color-limit)'
          cornerRadius={20}
          className='stroke-transparent stroke-2'
        />

        <RadialBar
          dataKey='monitored'
          stackId='a'
          fill='var(--color-monitored)'
          cornerRadius={20}
          className='stroke-transparent stroke-2 fill-transparent'
        />

        <PolarRadiusAxis
          tick={false}
          tickLine={false}
          axisLine={false}
        >
          <Label
            content={({ viewBox }) => {
              if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor='middle'
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className='fill-foreground text-2xl font-bold'
                    >
                      {totalLimits.toLocaleString()}
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </PolarRadiusAxis>

        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent />}
        />
      </RadialBarChart>
    </ChartContainer>
  );
};
