import DashboardCard from "@/app/(DashboardLayout)/components/shared/DashboardCard";
import { CreditCard, ThumbDown, ThumbUp } from "@mui/icons-material";
import {
  Timeline,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
  timelineOppositeContentClasses,
} from "@mui/lab";
import {
  Box,
  Button,
  IconButton,
  Link,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { Category, NaiveBayesClassifier } from "@/app/lib/transactionClassifier";
import { useEffect, useState } from "react";
import { trainingData } from "@/app/lib/constants";

const RecentTransactions = () => {
  const [classifier, setClassifier] = useState<NaiveBayesClassifier | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  const [transactions, setTransactions] = useState([
    { time: "08:30", merchant: "Grab", amount: "$12.50" },
    { time: "09:00", merchant: "Starbucks Raffles City", amount: "$6.80" },
    { time: "11:00", merchant: "Netflix", amount: "$20.00" },
    { time: "12:15", merchant: "McDonald's", amount: "$8.90" },
    { time: "18:00", merchant: "Kopitiam Funan", amount: "$6.10" },
  ]);
  const [newTransaction, setNewTransaction] = useState({
    merchant: "",
    amount: "",
  });

  const [feedback, setFeedback] = useState<Record<number, boolean | null>>({});
  const [correction, setCorrection] = useState<Record<number, Category | null>>(
    {}
  );
  const [boostedConfidence, setBoostedConfidence] = useState<
    Record<number, boolean>
  >({});

  const handleAddTransaction = () => {
    if (!newTransaction.merchant || !newTransaction.amount) return;

    const currentTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    setTransactions([
      ...transactions,
      {
        time: currentTime,
        merchant: newTransaction.merchant,
        amount: `S$${parseFloat(newTransaction.amount).toFixed(2)}`,
      },
    ]);

    setNewTransaction({ merchant: "", amount: "" });
  };

  const handleFeedback = (index: number, isCorrect: boolean) => {
    if (isCorrect) {
      // Mark this transaction as boosted
      setBoostedConfidence({ ...boostedConfidence, [index]: true });
    }
    setFeedback({ ...feedback, [index]: isCorrect });

    if (!isCorrect) {
      // Initialize correction with current prediction
      const currentTx = transactions[index];
      const currentPrediction =
        classifier?.classify(currentTx.merchant).category || "Transport";
      setCorrection({ ...correction, [index]: currentPrediction as Category });
    }
  };

  const handleCorrectionChange = (index: number, newCategory: Category) => {
    setCorrection({ ...correction, [index]: newCategory });
  };

  const submitCorrection = (index: number) => {
    if (!classifier || correction[index] === null) return;
  
    // 1. Boost confidence to 100% for the corrected category
    setBoostedConfidence({ ...boostedConfidence, [index]: true });
  
    // 2. (Optional) Retrain classifier - UNCOMMENT THIS
    const tx = transactions[index];
    const newTrainingData = [
      ...trainingData,
      { text: tx.merchant.toLowerCase(), category: correction[index]! },
    ];
    const updatedClassifier = new NaiveBayesClassifier(newTrainingData);
    setClassifier(updatedClassifier);
  
    // 3. Reset feedback UI states
    const newFeedback = { ...feedback };
    delete newFeedback[index];
    setFeedback(newFeedback);
  
    const newCorrection = { ...correction };
    delete newCorrection[index];
    setCorrection(newCorrection);
  };

  // Initialize classifier on mount
  useEffect(() => {
    const initClassifier = async () => {
      const classifier = new NaiveBayesClassifier(trainingData);
      // Small delay to simulate processing (remove in production)
      await new Promise((resolve) => setTimeout(resolve, 100));
      setClassifier(classifier);
      setIsLoading(false);
    };
    initClassifier();
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Transport":
        return <CreditCard fontSize="small" />;
      case "Food":
        return <CreditCard fontSize="small" />;
      case "Shopping":
        return <CreditCard fontSize="small" />;
      case "Bills":
        return <CreditCard fontSize="small" />;
      case "Entertainment":
        return <CreditCard fontSize="small" />;
      default:
        return <CreditCard fontSize="small" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Transport":
        return "primary";
      case "Food":
        return "error";
      case "Groceries":
        return "success";
      case "Shopping":
        return "warning";
      case "Bills":
        return "info";
      case "Entertainment":
        return "secondary";
      default:
        return "default";
    }
  };

  if (isLoading) {
    return (
      <DashboardCard title="Recent Transactions">
        <Typography>Loading classifier...</Typography>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="Recent Transactions"
      action={
        <Box sx={{ display: "flex", gap: 2, p: 2 }}>
          <TextField
            size="small"
            label="Merchant"
            value={newTransaction.merchant}
            onChange={(e) =>
              setNewTransaction({ ...newTransaction, merchant: e.target.value })
            }
          />
          <TextField
            size="small"
            label="Amount"
            type="number"
            value={newTransaction.amount}
            onChange={(e) =>
              setNewTransaction({ ...newTransaction, amount: e.target.value })
            }
            InputProps={{
              startAdornment: <Typography>S$</Typography>,
            }}
          />
          <Button
            variant="contained"
            onClick={handleAddTransaction}
            disabled={!newTransaction.merchant || !newTransaction.amount}
          >
            Add Transaction
          </Button>
        </Box>
      }
    >
      <Timeline
        sx={{
          p: 0,
          "& .MuiTimelineConnector-root": {
            width: "1px",
            backgroundColor: "#efefef",
          },
          [`& .${timelineOppositeContentClasses.root}`]: {
            flex: 0.5,
            paddingLeft: 0,
          },
        }}
      >
        {transactions.map((txn, i) => {
          if (!classifier) return null;

          const bayesResult = classifier.classify(txn.merchant);
          const confidencePercent = Math.round(bayesResult.confidence * 100);

          return (
            <TimelineItem key={i}>
              <TimelineOppositeContent sx={{ fontSize: "0.875rem" }}>
                {txn.time}
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot
                  color={getCategoryColor(bayesResult.category) as any}
                  variant="outlined"
                >
                  {getCategoryIcon(bayesResult.category)}
                </TimelineDot>
                {i < transactions.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent>
                <Typography fontWeight={600} fontSize="0.9rem">
                  {txn.merchant}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {bayesResult.category} • {txn.amount}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mt: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      height: 6,
                      bgcolor: "divider",
                      borderRadius: 3,
                      overflow: "hidden",
                      mr: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: `${
                          boostedConfidence[i] ? 100 : confidencePercent
                        }%`,
                        height: "100%",
                        bgcolor:
                          boostedConfidence[i] || confidencePercent > 80
                            ? "success.main"
                            : confidencePercent > 60
                            ? "warning.main"
                            : "error.main",
                      }}
                    />
                  </Box>
                  <Typography variant="caption">
                    {boostedConfidence[i] ? "100%" : `${confidencePercent}%`}{" "}
                    confidence
                  </Typography>
                </Box>
                {/* Feedback buttons */}
                {feedback[i] === undefined && (
                  <Box sx={{ display: "flex", ml: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleFeedback(i, true)}
                      color="success"
                    >
                      <ThumbUp fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleFeedback(i, false)}
                      color="error"
                    >
                      <ThumbDown fontSize="small" />
                    </IconButton>
                  </Box>
                )}

                {/* Correction UI */}
                {feedback[i] === false && (
                  <Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
                    <Select
                      value={correction[i] || bayesResult.category}
                      onChange={(e) =>
                        handleCorrectionChange(i, e.target.value as Category)
                      }
                      size="small"
                      sx={{ mr: 1, minWidth: 120 }}
                    >
                      {Object.keys(classifier.classCounts).map((cat) => (
                        <MenuItem key={cat} value={cat}>
                          {cat}
                        </MenuItem>
                      ))}
                    </Select>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => submitCorrection(i)}
                    >
                      Submit
                    </Button>
                  </Box>
                )}

                {feedback[i] === true && (
                  <Typography
                    variant="caption"
                    color="success.main"
                    sx={{ ml: 1 }}
                  >
                    Thanks!
                  </Typography>
                )}
              </TimelineContent>
            </TimelineItem>
          );
        })}
      </Timeline>
    </DashboardCard>
  );
};

export default RecentTransactions;
