"use client";
import { Button, Grid, Stack, Typography, Card, CardContent, Alert, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { useState } from 'react';
import { User } from '@prisma/client';

interface Recommendation {
  category: string;
  message: string;
}

const ExpertRecommendations = ({ user }: { user: User }) => {
  const theme = useTheme();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGetRecommendations = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/expert-advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          age: user.age,
          number_of_kids: user.number_of_kids,
          monthly_take_home: user.monthly_take_home,
          planning_to_buy_home: user.planning_to_buy_home,
          repaying_home_loans: user.repaying_home_loans,
          supporting_aged_parents: user.supporting_aged_parents,
          owns_car: user.owns_car,
          transport_expenditure: user.transport_expenditure,
          food_expenditure: user.food_expenditure,
          housing_expenditure: user.housing_expenditure,
          insurance_expenditure: user.insurance_expenditure,
          other_needs_expenditure: user.other_needs_expenditure,
          emergency_funds: user.emergency_funds,
          investment_expenditure: user.investment_expenditure,
          monthly_savings: user.monthly_savings
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const groupByCategory = (recs: Recommendation[]) => {
    return recs.reduce((acc: Record<string, string[]>, rec) => {
      if (!acc[rec.category]) {
        acc[rec.category] = [];
      }
      acc[rec.category].push(rec.message);
      return acc;
    }, {});
  };

  const groupedRecommendations = groupByCategory(recommendations);

  return (
    <DashboardCard title="Expert Recommendations">
      <Stack spacing={3}>
        {error && (
          <Alert severity="error">{error}</Alert>
        )}

        {loading ? (
          <Stack alignItems="center" justifyContent="center" height={200}>
            <CircularProgress />
            <Typography mt={2}>Analyzing your financial data...</Typography>
          </Stack>
        ) : recommendations.length > 0 ? (
          Object.entries(groupedRecommendations).map(([category, messages]) => (
            <Card key={category} variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  {category}
                </Typography>
                <ul style={{ marginTop: 0, paddingLeft: 20 }}>
                  {messages.map((message, i) => (
                    <li key={i}>
                      <Typography variant="body1">{message}</Typography>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))
        ) : (
          <Stack alignItems="center" spacing={2}>
            <Typography variant="body1" textAlign="center">
              Get personalized financial recommendations based on your profile
            </Typography>
            <Button 
              variant="contained" 
              onClick={handleGetRecommendations}
              disabled={loading}
            >
              Get Expert Recommendations
            </Button>
          </Stack>
        )}
      </Stack>
    </DashboardCard>
  );
};

export default ExpertRecommendations;