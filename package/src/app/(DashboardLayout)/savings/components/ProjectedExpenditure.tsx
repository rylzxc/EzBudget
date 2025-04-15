
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { Stack, Typography } from '@mui/material';

import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { ApexOptions } from "apexcharts";
import { useEffect, useState } from "react";
import { MonthlyData } from "../page";

const CurrentExpenditure = () => {
  const [data, setData] = useState<MonthlyData>({
    food: 0,
    transport: 0,
    utilities: 0,
    discretionary: 0,
    housing: 0,
    invest: 0,
    take_home: 0,
  });

  useEffect(() => {
    // obtain total expenditure data from server
    fetch('http://127.0.0.1:8000/predict/predict_total_expenditure/1')
      .then(response => response.json())
      .then(data => {
        console.log("total expenditure", data);
        const monthlyData: MonthlyData = {
          food: data["food"],
          transport: data["transport"],
          utilities: data["utilities"],
          discretionary: data["discretionary"],
          housing: data["housing"],
          invest: data["invest"],
          take_home: data["take_home"],
        }
        // set data
        setData(monthlyData);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  });

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
    <DashboardCard title="Next Month's Expenditure (Projected)">
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
