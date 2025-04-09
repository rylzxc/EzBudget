"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  Grid,
  Box,
  Card,
  Typography,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  Select,
  FormLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
} from "@mui/material";
// components
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import Logo from "@/app/(DashboardLayout)/layout/shared/logo/Logo";
import { updateUser } from "@/server/actions/register";

const OnboardingModal = () => {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId;
  const userIdNum = Array.isArray(userId)
    ? parseInt(userId[0], 10)
    : parseInt(userId, 10);

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1 fields
    age: 0,
    number_of_kids: 0,
    monthly_take_home: 0,

    // Step 2 fields
    planning_to_buy_home: false,
    repaying_home_loans: false,
    supporting_aged_parents: false,

    // Step 3 fields
    transport_expenditure: 0,
    food_expenditure: 0,
    housing_expenditure: 0,
    emergency_funds: 0,

    // Step 4 fields
    main_financial_goal: "",
    budget_flexibility: "",
    financial_struggle: "",
  });

  const financialGoals = [
    "Save money",
    "Pay off debt",
    "Track spending",
    "Stick to a budget",
    "Invest",
    "Build emergency fund",
    "Save for a big purchase",
  ];

  const flexibilityOptions = [
    "Very structured",
    "Somewhat flexible",
    "I just want to track for now",
  ];

  const struggleAreas = [
    "Overspending",
    "Staying consistent",
    "Managing bills",
    "Saving money",
    "Planning for future",
    "Understanding where my money goes",
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    if (!userId) {
      toast.error("You must be logged in to complete onboarding");
      return;
    }

    const processedData = {
      ...formData,
      age: Number(formData.age),
      number_of_kids: Number(formData.number_of_kids),
      monthly_take_home: Number(formData.monthly_take_home),
      transport_expenditure: Number(formData.transport_expenditure),
      food_expenditure: Number(formData.food_expenditure),
      housing_expenditure: Number(formData.housing_expenditure),
      emergency_funds: Number(formData.emergency_funds),
    };

    console.log("Submitting onboarding data:", processedData);

    setLoading(true);
    try {
      const result = await updateUser(userIdNum, processedData);
      console.log("Onboarding result:", result);

      if (result.success) {
        toast.success("Onboarding completed successfully!");
        router.push("/");
      } else {
        toast.error(result.error || "Failed to save onboarding data");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    "Personal Information",
    "Life Situation",
    "Financial Details",
    "Budgeting Goals",
  ];

  return (
    <PageContainer title="Onboarding" description="Complete your profile setup">
      <Box
        sx={{
          position: "relative",
          "&:before": {
            content: '""',
            background: "radial-gradient(#d2f1df, #d3d7fa, #bad8f4)",
            backgroundSize: "400% 400%",
            animation: "gradient 15s ease infinite",
            position: "absolute",
            height: "100%",
            width: "100%",
            opacity: "0.3",
          },
        }}
      >
        <Grid
          container
          spacing={0}
          justifyContent="center"
          sx={{ height: "100vh" }}
        >
          <Grid
            item
            xs={12}
            sm={12}
            lg={4}
            xl={3}
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <Card
              elevation={9}
              sx={{ p: 4, zIndex: 1, width: "100%", maxWidth: "500px" }}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                mb={3}
              >
                <Logo />
              </Box>

              <Typography variant="h5" textAlign="center" gutterBottom>
                Welcome to EzBudget!
              </Typography>
              <Typography
                variant="subtitle1"
                textAlign="center"
                color="textSecondary"
                mb={3}
              >
                Let's set you up for budgeting success.
              </Typography>

              <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {/* Step 1 Content */}
              {activeStep === 0 && (
                <Box>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Age"
                    name="age"
                    type="number"
                    value={formData.age}
                    onChange={handleChange}
                  />

                  <TextField
                    fullWidth
                    margin="normal"
                    label="Number of Kids"
                    name="number_of_kids"
                    type="number"
                    value={formData.number_of_kids}
                    onChange={handleChange}
                  />

                  <TextField
                    fullWidth
                    margin="normal"
                    label="Monthly Take Home Pay ($)"
                    name="monthly_take_home"
                    type="number"
                    value={formData.monthly_take_home}
                    onChange={handleChange}
                  />
                </Box>
              )}

              {/* Step 2 Content */}
              {activeStep === 1 && (
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="planning_to_buy_home"
                        checked={formData.planning_to_buy_home}
                        onChange={handleChange}
                      />
                    }
                    label="Are you planning to buy a home?"
                  />

                  <FormControlLabel
                    control={
                      <Checkbox
                        name="repaying_home_loans"
                        checked={formData.repaying_home_loans}
                        onChange={handleChange}
                      />
                    }
                    label="Are you repaying home loans?"
                    sx={{ mt: 1 }}
                  />

                  <FormControlLabel
                    control={
                      <Checkbox
                        name="supporting_aged_parents"
                        checked={formData.supporting_aged_parents}
                        onChange={handleChange}
                      />
                    }
                    label="Are you supporting aged parents?"
                    sx={{ mt: 1 }}
                  />
                </Box>
              )}

              {/* Step 3 Content */}
              {activeStep === 2 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Monthly Expenditures ($)
                  </Typography>

                  <TextField
                    fullWidth
                    margin="normal"
                    label="Transport"
                    name="transport_expenditure"
                    type="number"
                    value={formData.transport_expenditure}
                    onChange={handleChange}
                  />

                  <TextField
                    fullWidth
                    margin="normal"
                    label="Food"
                    name="food_expenditure"
                    type="number"
                    value={formData.food_expenditure}
                    onChange={handleChange}
                  />

                  <TextField
                    fullWidth
                    margin="normal"
                    label="Housing"
                    name="housing_expenditure"
                    type="number"
                    value={formData.housing_expenditure}
                    onChange={handleChange}
                  />

                  <TextField
                    fullWidth
                    margin="normal"
                    label="Emergency Funds"
                    name="emergency_funds"
                    type="number"
                    value={formData.emergency_funds}
                    onChange={handleChange}
                  />
                </Box>
              )}

              {activeStep === 3 && (
                <Box>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="main-goal-label">
                      What's your main financial goal right now?
                    </InputLabel>
                    <Select
                      labelId="main-goal-label"
                      name="main_financial_goal"
                      value={formData.main_financial_goal}
                      onChange={handleSelectChange}
                      label="What's your main financial goal right now?"
                    >
                      {financialGoals.map((goal) => (
                        <MenuItem key={goal} value={goal}>
                          {goal}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth margin="normal">
                    <InputLabel id="struggle-label">
                      Which area of your finances do you struggle with most?
                    </InputLabel>
                    <Select
                      labelId="struggle-label"
                      name="financial_struggle"
                      value={formData.financial_struggle}
                      onChange={handleSelectChange}
                      label="Which area of your finances do you struggle with most?"
                    >
                      {struggleAreas.map((area) => (
                        <MenuItem key={area} value={area}>
                          {area}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl component="fieldset" fullWidth margin="normal">
                    <FormLabel component="legend">
                      How much flexibility do you want in your budget?
                    </FormLabel>
                    <RadioGroup
                      name="budget_flexibility"
                      value={formData.budget_flexibility}
                      onChange={handleChange}
                    >
                      {flexibilityOptions.map((option) => (
                        <FormControlLabel
                          key={option}
                          value={option}
                          control={<Radio />}
                          label={option}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                </Box>
              )}

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}
              >
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  variant="outlined"
                >
                  Back
                </Button>

                {activeStep === steps.length - 1 ? (
                  <Button variant="contained" onClick={handleSubmit}>
                    Finish
                  </Button>
                ) : (
                  <Button variant="contained" onClick={handleNext}>
                    Next
                  </Button>
                )}
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default OnboardingModal;
