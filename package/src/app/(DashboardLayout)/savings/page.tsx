'use client'
import { Grid, Box } from '@mui/material';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
// components

import ProjectedSavings from '@/app/(DashboardLayout)/savings/components/ProjectedSavings';
import CurrentExpenditure from '@/app/(DashboardLayout)/savings/components/CurrentExpenditure';
import ProjectedExpenditure from '@/app/(DashboardLayout)/savings/components/ProjectedExpenditure';
import { useState } from 'react';

export interface MonthlyData {
  food: number;
  transport: number;
  utilities: number;
  discretionary: number;
  housing: number;
  invest: number;
  take_home: number;
}

const initialData: MonthlyData = {
  "food": 500,
  "transport": 100,
  "utilities": 0,
  "discretionary": 500,
  "housing": 1200,
  "invest": 0,
  "take_home": 2500,
}

// for sending new data to server
const sendData = async () => {
  // send initial data to server
  console.log("Sending data to server...");
  const data = {
    ...initialData,
    "use_public_transport": true,
  }; // make some changes
  return fetch('http://localhost:8000/predict/set_state', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
    .then(response => response.json())
    .then(_ => {
      console.log('Success sending data to server');
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

const Savings = () => {
  // state to store data
  const [data, setData] = useState(initialData);

  return (
    <PageContainer title="Dashboard" description="this is Dashboard">
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={12}>
            <ProjectedSavings />
          </Grid>
          <Grid item xs={12} lg={6}>
            <CurrentExpenditure data={data} />
          </Grid>
          <Grid item xs={12} lg={6}>
            <ProjectedExpenditure />
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  )
}

export default Savings;
