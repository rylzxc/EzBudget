"use client";
import { Grid, Box } from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
// components
import SalesOverview from "@/app/(DashboardLayout)/components/dashboard/SalesOverview";
import YearlyBreakup from "@/app/(DashboardLayout)/components/dashboard/YearlyBreakup";
import RecentTransactions from "@/app/(DashboardLayout)/components/dashboard/RecentTransactions";
import MonthlyEarnings from "@/app/(DashboardLayout)/components/dashboard/MonthlyEarnings";
import ExpertRecommendations from "./components/dashboard/ExpertRecommendations";
import TransactionHistory from "./components/dashboard/TransactionHistory";
import { useState } from "react";

const Dashboard = () => {
  const [oMonth, setOMonth] = useState<number>(new Date().getMonth() + 1);
  const [oYear, setOYear] = useState<number>(new Date().getFullYear());
  return (
    <PageContainer title="Dashboard" description="this is Dashboard">
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={12}>
            <TransactionHistory userId={6} />
          </Grid>
          {/* <Grid item xs={12} lg={4}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <YearlyBreakup />
              </Grid>
              <Grid item xs={12}>
                <MonthlyEarnings />
              </Grid>
            </Grid>
          </Grid> */}
          <Grid item xs={12} lg={6}>
            <RecentTransactions />
          </Grid>
          {/* <Grid item xs={12} lg={6}>
            <ExpertRecommendations user={user} />
          </Grid> */}
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default Dashboard;
