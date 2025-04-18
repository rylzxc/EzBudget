"use client";
import { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Slider,
  FormControlLabel,
  Switch,
  TextField,
} from "@mui/material";
import { getUser } from "@/app/lib/fetchUser";
import { User } from "@prisma/client";

interface Recommendation {
  id: number;
  message: string;
  category: string;
}

interface BudgetBreakdown {
  needs: number;
  wants: number;
  savings: number;
  needsPercentage: number;
  wantsPercentage: number;
  savingsPercentage: number;
}

interface EditableBudget {
  age: number;
  number_of_kids: number;
  monthly_take_home: number;
  planning_to_buy_home: boolean;
  repaying_home_loans: boolean;
  supporting_aged_parents: boolean;
  owns_car: boolean;
  transport_expenditure: number;
  food_expenditure: number;
  housing_expenditure: number;
  insurance_expenditure: number;
  other_needs_expenditure: number;
  emergency_funds: number;
  investment_expenditure: number;
  monthly_savings: number;
}

interface WeightSettings {
  transport: number;
  food: number;
  housing: number;
  insurance: number;
  other_needs: number;
  savings: number;
  investments: number;
}

const defaultWeights: WeightSettings = {
  transport: 1,
  food: 1,
  housing: 1,
  insurance: 1,
  other_needs: 1,
  savings: 1,
  investments: 1,
};

export default function WhatIfPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User>();
  const [breakdown, setBreakdown] = useState<BudgetBreakdown | null>(null);
  const [weights, setWeights] = useState<WeightSettings>(defaultWeights);
  const [useCustomWeights, setUseCustomWeights] = useState(false);
  const [optimization, setOptimization] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState<"analysis" | "optimization">(
    "analysis"
  );
  const [editableBudget, setEditableBudget] = useState<EditableBudget>({
    age: 0,
    number_of_kids: 0,
    monthly_take_home: 0,
    planning_to_buy_home: false,
    repaying_home_loans: false,
    supporting_aged_parents: false,
    owns_car: false,
    transport_expenditure: 0,
    food_expenditure: 0,
    housing_expenditure: 0,
    insurance_expenditure: 0,
    other_needs_expenditure: 0,
    emergency_funds: 0,
    investment_expenditure: 0,
    monthly_savings: 0,
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getUser(6);
        if (!user) throw new Error("No user found");
        setUser(user);
        setEditableBudget({
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
          monthly_savings: user.monthly_savings,
        });
        calculateBudgetBreakdown(user);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      }
    };
    fetchUser();
  }, []);

  const handleWeightChange = (
    category: keyof WeightSettings,
    value: number
  ) => {
    setWeights((prev) => ({
      ...prev,
      [category]: value,
    }));
  };

  const handleOptimize = async () => {
    if (!user) {
      setError("User data not loaded");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8001/optimize-budget", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          budget_data: editableBudget,
          weights: useCustomWeights ? weights : undefined,
        }),
      });

      if (!response.ok) throw new Error("Optimization failed");

      const data = await response.json();
      setOptimization(data.optimization);
      setCurrentTab("optimization");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Optimization error");
    } finally {
      setLoading(false);
    }
  };

  const handleBudgetChange = (field: keyof EditableBudget, value: any) => {
    setEditableBudget((prev) => ({
      ...prev,
      [field]: typeof value === "string" ? parseFloat(value) || 0 : value,
    }));
  };

  // Add this component to render editable fields
  const BudgetInputField = ({
    label,
    field,
    type = "number",
  }: {
    label: string;
    field: keyof EditableBudget;
    type?: string;
  }) => (
    <Box sx={{ mb: 2 }}>
      <Typography gutterBottom>{label}</Typography>
      {type === "number" ? (
        <TextField
          fullWidth
          type="number"
          value={editableBudget[field]}
          onChange={(e) => handleBudgetChange(field, e.target.value)}
          variant="outlined"
          size="small"
        />
      ) : (
        <FormControlLabel
          control={
            <Switch
              checked={editableBudget[field] as boolean}
              onChange={(e) => handleBudgetChange(field, e.target.checked)}
            />
          }
          label={editableBudget[field] ? "Yes" : "No"}
        />
      )}
    </Box>
  );

  const renderWeightSlider = (
    category: keyof WeightSettings,
    label: string
  ) => (
    <Box sx={{ mb: 2 }}>
      <Typography gutterBottom>
        {label} (Weight: {weights[category].toFixed(1)})
      </Typography>
      <Slider
        value={weights[category]}
        onChange={(_, value) => handleWeightChange(category, value as number)}
        min={0.1}
        max={5}
        step={0.1}
        valueLabelDisplay="auto"
        disabled={!useCustomWeights}
      />
    </Box>
  );

  const calculateBudgetBreakdown = (user: User) => {
    const totalIncome = user.monthly_take_home;

    // Calculate needs (transport, food, housing, insurance, other needs)
    const needsTotal =
      user.transport_expenditure +
      user.food_expenditure +
      user.housing_expenditure +
      user.insurance_expenditure +
      user.other_needs_expenditure;

    // Calculate savings (monthly savings + investments)
    const savingsTotal = user.monthly_savings + user.investment_expenditure;

    // Calculate wants (remaining amount)
    const wantsTotal = totalIncome - needsTotal - savingsTotal;

    setBreakdown({
      needs: needsTotal,
      wants: wantsTotal,
      savings: savingsTotal,
      needsPercentage: Math.round((needsTotal / totalIncome) * 100),
      wantsPercentage: Math.round((wantsTotal / totalIncome) * 100),
      savingsPercentage: Math.round((savingsTotal / totalIncome) * 100),
    });
  };

  const handleGetRecommendations = async () => {
    if (!user) {
      setError("User not loaded");
      return;
    }

    setLoading(true);
    setError("");
    setRecommendations([]);
    setOptimization(null);

    try {
      const response = await fetch("http://localhost:8001/analyze-budget", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
          monthly_savings: user.monthly_savings,
        }),
      });

      if (!response.ok) throw new Error("Failed to get recommendations");

      const data = await response.json();
      const categorizedRecs = data.recommendations.map(
        (msg: string, i: number) => {
          let category = "General Advice";
          if (msg.includes("transport")) category = "Transportation";
          if (msg.includes("insurance")) category = "Insurance";
          if (msg.includes("housing")) category = "Housing";
          if (msg.includes("savings") || msg.includes("emergency"))
            category = "Savings";

          return { id: i, message: msg, category };
        }
      );

      setRecommendations(categorizedRecs);
      setOptimization(data.optimization);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const groupByCategory = (recs: Recommendation[]) => {
    return recs.reduce((acc: Record<string, Recommendation[]>, rec) => {
      if (!acc[rec.category]) acc[rec.category] = [];
      acc[rec.category].push(rec);
      return acc;
    }, {});
  };

  const groupedRecommendations = groupByCategory(recommendations);

  if (!user || !breakdown) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Loading user data...</Typography>
      </Box>
    );
  }

  function BudgetAllocationItem({
    label,
    current,
    optimized,
  }: {
    label: string;
    current?: number;
    optimized?: number;
  }) {
    if (current === undefined || optimized === undefined) return null;

    const difference = optimized - current;
    const differencePercent = current > 0 ? (difference / current) * 100 : 0;

    return (
      <Box sx={{ mb: 2 }}>
        <Typography fontWeight="bold">{label}</Typography>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography>Current: ${current.toFixed(2)}</Typography>
          <Typography>Optimized: ${optimized.toFixed(2)}</Typography>
        </Box>
        <Typography
          color={
            difference > 0
              ? "success.main"
              : difference < 0
              ? "error.main"
              : undefined
          }
        >
          {difference >= 0 ? "+" : ""}
          {difference.toFixed(2)} ({differencePercent.toFixed(1)}%)
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Budget What-If Analysis
      </Typography>

      {/* Tabs */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant={currentTab === "analysis" ? "contained" : "outlined"}
          onClick={() => setCurrentTab("analysis")}
          sx={{ mr: 2 }}
        >
          Expert Analysis
        </Button>
        <Button
          variant={currentTab === "optimization" ? "contained" : "outlined"}
          onClick={() => setCurrentTab("optimization")}
        >
          Budget Optimization
        </Button>
      </Box>

      {/* Current Budget Summary */}
      {currentTab === "analysis" && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Current Budget Overview
              </Typography>

              <Grid container spacing={2}>
                {/* Personal Information */}
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    Personal Information
                  </Typography>
                  <Typography>Age: {user.age}</Typography>
                  <Typography>Kids: {user.number_of_kids}</Typography>
                  <Typography>
                    Car Owner: {user.owns_car ? "Yes" : "No"}
                  </Typography>
                  <Typography>
                    Supporting Parents:{" "}
                    {user.supporting_aged_parents ? "Yes" : "No"}
                  </Typography>
                </Grid>

                {/* Income and Major Expenses */}
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    Income & Expenses
                  </Typography>
                  <Typography>
                    Monthly Income: ${user.monthly_take_home.toFixed(2)}
                  </Typography>
                  <Typography>
                    Housing: ${user.housing_expenditure.toFixed(2)}
                  </Typography>
                  <Typography>
                    Transport: ${user.transport_expenditure.toFixed(2)}
                  </Typography>
                  <Typography>
                    Food: ${user.food_expenditure.toFixed(2)}
                  </Typography>
                </Grid>

                {/* Financial Details */}
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    Financial Details
                  </Typography>
                  <Typography>
                    Insurance: ${user.insurance_expenditure.toFixed(2)}
                  </Typography>
                  <Typography>
                    Other Needs: ${user.other_needs_expenditure.toFixed(2)}
                  </Typography>
                  <Typography>
                    Investments: ${user.investment_expenditure.toFixed(2)}
                  </Typography>
                  <Typography>
                    Emergency Funds: ${user.emergency_funds.toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Budget Breakdown Visualization */}
              <Typography variant="subtitle1" color="primary" gutterBottom>
                Budget Allocation
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Paper elevation={3} sx={{ p: 2, bgcolor: "primary.light" }}>
                    <Typography variant="subtitle2">Needs</Typography>
                    <Typography variant="h6">
                      ${breakdown.needs.toFixed(2)}
                    </Typography>
                    <Typography>
                      ({breakdown.needsPercentage}% of income)
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper
                    elevation={3}
                    sx={{ p: 2, bgcolor: "secondary.light" }}
                  >
                    <Typography variant="subtitle2">Wants</Typography>
                    <Typography variant="h6">
                      ${breakdown.wants.toFixed(2)}
                    </Typography>
                    <Typography>
                      ({breakdown.wantsPercentage}% of income)
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper elevation={3} sx={{ p: 2, bgcolor: "success.light" }}>
                    <Typography variant="subtitle2">Savings</Typography>
                    <Typography variant="h6">
                      ${breakdown.savings.toFixed(2)}
                    </Typography>
                    <Typography>
                      ({breakdown.savingsPercentage}% of income)
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Recommendation Button */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleGetRecommendations}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                "Get Expert Recommendations"
              )}
            </Button>
          </Box>
        </>
      )}

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Recommendations Display */}
      {recommendations.length > 0 && currentTab !== "optimization" && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Expert Recommendations
            </Typography>
            {Object.entries(groupedRecommendations).map(([category, recs]) => (
              <Box key={category} sx={{ mb: 3 }}>
                <Typography variant="subtitle1" color="primary" gutterBottom>
                  {category}
                </Typography>
                <ul style={{ marginTop: 0, paddingLeft: 20 }}>
                  {recs.map((rec) => (
                    <li key={rec.id}>
                      <Typography variant="body1">{rec.message}</Typography>
                    </li>
                  ))}
                </ul>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {currentTab === "optimization" && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Customize Budget Before Optimization
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" color="primary" gutterBottom>
                  Personal Information
                </Typography>
                <BudgetInputField label="Age" field="age" />
                <BudgetInputField
                  label="Number of Kids"
                  field="number_of_kids"
                />
                <BudgetInputField
                  label="Monthly Take Home Pay"
                  field="monthly_take_home"
                />
                <BudgetInputField
                  label="Owns Car"
                  field="owns_car"
                  type="checkbox"
                />
                <BudgetInputField
                  label="Supporting Aged Parents"
                  field="supporting_aged_parents"
                  type="checkbox"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" color="primary" gutterBottom>
                  Expenses
                </Typography>
                <BudgetInputField
                  label="Transport"
                  field="transport_expenditure"
                />
                <BudgetInputField label="Food" field="food_expenditure" />
                <BudgetInputField label="Housing" field="housing_expenditure" />
                <BudgetInputField
                  label="Insurance"
                  field="insurance_expenditure"
                />
                <BudgetInputField
                  label="Other Needs"
                  field="other_needs_expenditure"
                />
                <BudgetInputField
                  label="Emergency Funds"
                  field="emergency_funds"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" color="primary" gutterBottom>
                  Savings & Investments
                </Typography>
                <BudgetInputField
                  label="Investments"
                  field="investment_expenditure"
                />
                <BudgetInputField
                  label="Monthly Savings"
                  field="monthly_savings"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <FormControlLabel
              control={
                <Switch
                  checked={useCustomWeights}
                  onChange={(e) => setUseCustomWeights(e.target.checked)}
                />
              }
              label="Use custom weights"
              sx={{ mb: 2 }}
            />

            {useCustomWeights && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Adjustment Weights
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Higher weights mean the optimizer will try harder to keep this
                  category close to its current value
                </Typography>

                {renderWeightSlider("transport", "Transportation")}
                {renderWeightSlider("food", "Food")}
                {renderWeightSlider("housing", "Housing")}
                {renderWeightSlider("insurance", "Insurance")}
                {renderWeightSlider("other_needs", "Other Needs")}
                {renderWeightSlider("savings", "Savings")}
                {renderWeightSlider("investments", "Investments")}
              </Paper>
            )}

            <Button
              variant="contained"
              onClick={handleOptimize}
              disabled={loading}
              fullWidth
              size="large"
            >
              {loading ? <CircularProgress size={24} /> : "Optimize Budget"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {optimization && currentTab !== "analysis" && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Optimized Budget Allocation
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" color="primary">
                  Needs (${optimization.total_needs?.toFixed(2) || 0})
                </Typography>
                <BudgetAllocationItem
                  label="Transport"
                  current={user?.transport_expenditure}
                  optimized={optimization.transport_expenditure}
                />
                <BudgetAllocationItem
                  label="Food"
                  current={user?.food_expenditure}
                  optimized={optimization.food_expenditure}
                />
                <BudgetAllocationItem
                  label="Housing"
                  current={user?.housing_expenditure}
                  optimized={optimization.housing_expenditure}
                />
                <BudgetAllocationItem
                  label="Insurance"
                  current={user?.insurance_expenditure}
                  optimized={optimization.insurance_expenditure}
                />
                <BudgetAllocationItem
                  label="Other Needs"
                  current={user?.other_needs_expenditure}
                  optimized={optimization.other_needs_expenditure}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" color="primary">
                  Savings & Wants ($
                  {(
                    optimization.monthly_savings + optimization.total_wants
                  )?.toFixed(2) || 0}
                  )
                </Typography>
                <BudgetAllocationItem
                  label="Savings"
                  current={user?.monthly_savings}
                  optimized={optimization.monthly_savings}
                />
                <BudgetAllocationItem
                  label="Investments"
                  current={user?.investment_expenditure}
                  optimized={optimization.investment_expenditure}
                />
                <BudgetAllocationItem
                  label="Wants"
                  current={
                    user?.monthly_take_home -
                    user?.housing_expenditure -
                    user?.transport_expenditure -
                    user?.food_expenditure -
                    user?.insurance_expenditure -
                    user?.investment_expenditure -
                    user?.other_needs_expenditure -
                    user?.monthly_savings
                  }
                  optimized={optimization.total_wants}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
