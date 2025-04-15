import Chart from "react-apexcharts";
import React, { useEffect, useState } from "react";
import { useTheme } from '@mui/material/styles';
import { ApexOptions } from "apexcharts";
import DashboardCard from "../../components/shared/DashboardCard";

interface DataPoint {
  x: number; // timestamp
  y: number | [number, number]; // single value or range
}

const ProjectedSavings = () => {
  // state to store data
  const [data, setData] = useState<DataPoint[]>([]);
  const [rangeData, setRangeData] = useState<DataPoint[]>([]);

  useEffect(() => {
    // obtain data from server (localhost:8000)
    fetch('http://127.0.0.1:8000/predict/predict_cumulative_savings/6')
      .then(response => response.json())
      .then(data => {
        console.log("cumulative savings", data);
        // put data into series
        // obtain the current year and month
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        const lowerBound = data["lower"]
        const upperBound = data["upper"]
        const pred = data["pred"] // only contains predicted data, can prepend previous savings
        // set data
        console.log("pred", pred);
        const seriesData: DataPoint[] = []
        for (let i = 0; i < 6; i++) {
          const date = new Date(currentYear, currentMonth + i, 1);
          seriesData.push({ x: date.getTime(), y: pred[i.toString()].toFixed(2) });
        }
        const rangeSeries: DataPoint[] = []
        for (let i = 0; i < 6; i++) {
          const date = new Date(currentYear, currentMonth + i, 1);
          rangeSeries.push({ x: date.getTime(), y: [lowerBound[i.toString()].toFixed(2), upperBound[i.toString()].toFixed(2)] });
        }
        // set data
        setData(seriesData);
        setRangeData(rangeSeries);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }, []);

  // chart color
  const theme = useTheme();
  const secondary = theme.palette.secondary.main;
  const secondarylight = '#c6ccf9';

  const options: ApexOptions = {
    chart: {
      type: "line",
      stacked: false,
    },
    stroke: {
      curve: 'straight',
      width: [2, 0]
    },
    dataLabels: {
      enabled: true,
      enabledOnSeries: [0]
    },
    xaxis: {
      type: "datetime",
      labels: {
        format: "MMM yyyy", // e.g., "Jan 2025"
      },
    },
    tooltip: {
      theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
    },
  };

  const series: ApexAxisChartSeries = [
    {
      type: 'line',
      name: 'Amount',
      color: secondary,
      data: data,
    }, {
      type: 'rangeArea',
      name: 'Projected Range',
      color: secondarylight,
      data: rangeData,
    }
  ];

  return (
    <DashboardCard
      title="Current and Projected Savings">
      <Chart options={options} series={series} type="rangeArea" height={300}/>
    </DashboardCard>
  )
};

export default ProjectedSavings;
