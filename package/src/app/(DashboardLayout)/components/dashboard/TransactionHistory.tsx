import React, { useEffect, useState } from 'react';
import { Select, MenuItem, Box, Typography, CircularProgress, SelectChangeEvent } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import dynamic from "next/dynamic";
import { getUserTransactions } from '@/app/lib/fetchTransactions'; 
import { Transaction, TransactionCategory } from '@prisma/client';
import { ApexOptions } from 'apexcharts';

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface TransactionChartData {
  series: { name: string; data: number[] }[];
  categories: string[];
}

const TransactionHistory = ({ userId }: { userId: number }) => {
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [chartData, setChartData] = useState<TransactionChartData>({
    series: [],
    categories: []
  });

  const theme = useTheme();
  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.success.main
  ];

  // Fetch transactions when month/year changes
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const data = await getUserTransactions(userId, month, year);
        setTransactions(data);
        processChartData(data);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [month, year, userId]);

  // Process transactions into chart data
  const processChartData = (transactions: Transaction[]) => {
    // Group by date and category
    const dailyData: Record<string, Record<TransactionCategory, number>> = {};
    const categoryTotals: Record<TransactionCategory, number> = {
      FOOD: 0,
      TRANSPORT: 0,
      HOUSING: 0,
      INSURANCE: 0,
      INVESTMENT: 0,
      OTHER: 0
    };

    transactions.forEach(transaction => {
      const date = new Date(transaction.timestamp).toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit'
      });

      if (!dailyData[date]) {
        dailyData[date] = {
          FOOD: 0,
          TRANSPORT: 0,
          HOUSING: 0,
          INSURANCE: 0,
          INVESTMENT: 0,
          OTHER: 0
        };
      }

      if (transaction.category) {
        dailyData[date][transaction.category] += transaction.amount;
        categoryTotals[transaction.category] += transaction.amount;
      }
    });

    // Prepare series data for chart
    const series = Object.entries(categoryTotals)
      .filter(([_, total]) => total > 0)
      .map(([category, total], index) => ({
        name: category.charAt(0) + category.slice(1).toLowerCase(),
        data: Object.keys(dailyData).map(date => dailyData[date][category as TransactionCategory]),
        color: colors[index % colors.length]
      }));

    setChartData({
      series,
      categories: Object.keys(dailyData)
    });
  };

  const handleMonthChange = (event: SelectChangeEvent<number>) => {
    setMonth(Number(event.target.value));
  };

  const handleYearChange = (event: SelectChangeEvent<number>) => {
    setYear(Number(event.target.value));
  };

  const options: ApexOptions = {
    chart: {
      type: 'bar',
      stacked: true,
      fontFamily: "'Plus Jakarta Sans', sans-serif;",
      foreColor: '#adb0bb',
      toolbar: {
        show: true,
      },
      height: 370,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '35%',
        borderRadius: 6,
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: true,
      position: 'bottom',
    },
    grid: {
      borderColor: 'rgba(0,0,0,0.1)',
      strokeDashArray: 3,
      xaxis: {
        lines: {
          show: false,
        },
      },
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    xaxis: {
      categories: chartData.categories,
      axisBorder: {
        show: false,
      },
    },
    yaxis: {
      title: {
        text: 'Amount ($)',
      },
      labels: {
        formatter: (val: number) => `$${val.toFixed(2)}`,
      },
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (val: number) => `$${val.toFixed(2)}`,
      },
    },
    fill: {
      opacity: 1,
    },
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Transaction History</Typography>
        <Box display="flex" gap={2}>
          <Select
            value={month}
            onChange={handleMonthChange}
            size="small"
            sx={{ minWidth: 120 }}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <MenuItem key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('default', { month: 'long' })}
              </MenuItem>
            ))}
          </Select>
          <Select
            value={year}
            onChange={handleYearChange}
            size="small"
            sx={{ minWidth: 120 }}
          >
            {Array.from({ length: 5 }, (_, i) => {
              const y = new Date().getFullYear() - 2 + i;
              return (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              );
            })}
          </Select>
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height={370}>
          <CircularProgress />
        </Box>
      ) : transactions.length === 0 ? (
        <Box display="flex" justifyContent="center" alignItems="center" height={370}>
          <Typography>No transactions found for selected period</Typography>
        </Box>
      ) : (
        <Chart
          options={options}
          series={chartData.series}
          type="bar"
          height={370}
          width="100%"
        />
      )}
    </Box>
  );
};

export default TransactionHistory;