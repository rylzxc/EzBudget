import dynamic from "next/dynamic";
import { useTheme } from '@mui/material/styles';
import { Grid, Stack, Typography, Avatar, Box, CircularProgress } from '@mui/material';
import { IconArrowUpRight, IconArrowDownRight } from '@tabler/icons-react';
import { Transaction, TransactionCategory } from '@prisma/client';
import { useEffect, useState } from 'react';
import { getUserTransactions } from '@/app/lib/fetchTransactions';

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface MonthlySpendingPieProps {
  userId: number;
  month: number;
  year: number;
}

const MonthlySpendingPie = ({ userId, month, year }: MonthlySpendingPieProps) => {
  const theme = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [prevMonthData, setPrevMonthData] = useState<number | null>(null);

  // Generate colors for each category
  const categoryColors = {
    FOOD: theme.palette.primary.main,
    TRANSPORT: theme.palette.secondary.main,
    HOUSING: theme.palette.error.main,
    INSURANCE: theme.palette.warning.main,
    INVESTMENT: theme.palette.info.main,
    OTHER: theme.palette.success.main
  };

  // Fetch transactions when month/year changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch current month's transactions
        const currentData = await getUserTransactions(userId, month, year);
        setTransactions(currentData);

        // Fetch previous month's data for comparison
        let prevMonth = month - 1;
        let prevYear = year;
        if (prevMonth === 0) {
          prevMonth = 12;
          prevYear = year - 1;
        }

        const prevData = await getUserTransactions(userId, prevMonth, prevYear);
        const prevTotal = prevData.reduce((sum: any, t: { amount: any; }) => sum + t.amount, 0);
        setPrevMonthData(prevTotal);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch transaction data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, month, year]);

  // Calculate total spending per category
  const categoryTotals = transactions.reduce((acc, transaction) => {
    const category = transaction.category || 'OTHER';
    acc[category] = (acc[category] || 0) + transaction.amount;
    return acc;
  }, {} as Record<TransactionCategory | 'OTHER', number>);

  // Prepare data for chart
  const categories = Object.keys(categoryTotals) as TransactionCategory[];
  const series = categories.map(category => categoryTotals[category]);
  const colors = categories.map(category => categoryColors[category]);
  const totalSpending = series.reduce((sum, amount) => sum + amount, 0);

  // Calculate percentage change from previous month
  const percentageChange = prevMonthData && prevMonthData > 0 
    ? ((totalSpending - prevMonthData) / prevMonthData) * 100 
    : 0;

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: 'donut',
      fontFamily: "'Plus Jakarta Sans', sans-serif;",
      foreColor: '#adb0bb',
      toolbar: {
        show: false,
      },
    },
    colors: colors,
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: () => `$${totalSpending.toFixed(2)}`
            }
          }
        }
      }
    },
    labels: categories.map(c => c.charAt(0) + c.slice(1).toLowerCase()),
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
      dropShadow: {
        enabled: false,
      }
    },
    legend: {
      position: 'bottom',
      formatter: (legendName, opts) => {
        return `${legendName}: $${categoryTotals[legendName.toUpperCase() as TransactionCategory]?.toFixed(2) || '0.00'}`;
      }
    },
    tooltip: {
      theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
      y: {
        formatter: (val: number) => `$${val.toFixed(2)} (${((val / totalSpending) * 100).toFixed(1)}%)`
      }
    },
    stroke: {
      show: false
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, color: 'error.main' }}>
        <Typography>{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, height: '100%' }}>
      <Typography variant="h5" gutterBottom>
        Spending Breakdown - {new Date(year, month - 1).toLocaleString('default', { month: 'long' })} {year}
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Stack spacing={2}>
            <Typography variant="h3" fontWeight="700">
              ${totalSpending.toFixed(2)}
            </Typography>
            {prevMonthData !== null && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar sx={{ 
                  bgcolor: percentageChange >= 0 ? theme.palette.success.light : theme.palette.error.light,
                  width: 24, 
                  height: 24 
                }}>
                  {percentageChange >= 0 ? 
                    <IconArrowUpRight width={16} color={theme.palette.success.main} /> : 
                    <IconArrowDownRight width={16} color={theme.palette.error.main} />
                  }
                </Avatar>
                <Typography variant="subtitle2" fontWeight="600" color={percentageChange >= 0 ? 'success.main' : 'error.main'}>
                  {Math.abs(percentageChange).toFixed(1)}%
                </Typography>
                <Typography variant="subtitle2" color="textSecondary">
                  vs last month
                </Typography>
              </Stack>
            )}
          </Stack>
        </Grid>
        <Grid item xs={12} md={6}>
          <Chart
            options={options}
            series={series}
            type="donut"
            height={300}
          />
        </Grid>
      </Grid>

      {/* Category indicators */}
      <Grid container spacing={2} mt={2}>
        {categories.map((category) => (
          <Grid item xs={6} sm={4} key={category}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar sx={{ 
                width: 12, 
                height: 12, 
                bgcolor: categoryColors[category] 
              }} />
              <Typography variant="body2">
                {category.charAt(0) + category.slice(1).toLowerCase()}
              </Typography>
            </Stack>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default MonthlySpendingPie;