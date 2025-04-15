
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { Stack, Typography } from '@mui/material';

import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { ApexOptions } from "apexcharts";
import { MonthlyData } from "../page";

interface MonthlyDataProps {
  data: MonthlyData;
}

const CurrentExpenditure: React.FC<MonthlyDataProps> = ({ data }) => {
  const labels: (keyof MonthlyData)[] = ['food', 'transport', 'utilities', 'discretionary', 'housing', 'invest'];
  const values: number[] = labels.map(label => data[label]);
  // round value to 2 decimal places
  const roundedValues = values.map(value => Math.round(value * 100) / 100);
  // sum up values
  const total_exp = roundedValues.reduce((acc, value) => acc + value, 0);

  // chart color
  const series: number[] = roundedValues;
  const options: ApexOptions = {
    chart: {
      type: 'donut',
    },
    labels: labels,
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  }

  return (
    <DashboardCard title="This Month's Expenditure">
      <Stack direction="column" spacing={2}>
        <Typography variant="h3" fontWeight={700}>
          ${total_exp}
        </Typography>
        <Chart
          options={options}
          series={series}
          type="donut"
          height={320} width={"100%"}
        />
      </Stack>
    </DashboardCard>
  );
};

export default CurrentExpenditure;
