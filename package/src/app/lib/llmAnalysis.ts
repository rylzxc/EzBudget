import OpenAI from "openai";
import {
  CategoryTrend,
  MonthlyTrend,
  Transaction,
  TransactionCategory,
} from "./types";
import { prisma } from "@/database/src/client";

const openai = new OpenAI({ apiKey: "" });

async function getLLMRecommendations(context: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a financial advisor providing concise, actionable spending recommendations. Provide 3-5 specific suggestions based on the analysis context.",
        },
        {
          role: "user",
          content: `Based on this spending analysis: ${context}\n\nGenerate 3-5 specific recommendations to improve financial health. Return only a bulleted list without additional commentary.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const recommendations = response.choices[0]?.message?.content;
    if (!recommendations) return [];

    // Parse the bulleted list into an array
    return recommendations
      .split("\n")
      .filter(
        (line) => line.trim().startsWith("-") || line.trim().startsWith("•")
      )
      .map((line) => line.replace(/^[-•]\s*/, "").trim());
  } catch (error) {
    console.error("LLM call failed:", error);
    return []; // Fallback to default recommendations
  }
}

export interface AnalysisResult {
  insights: string[];
  trends: CategoryTrend[];
  recommendations: string[];
  warning?: string;
}

async function getMonthlyTrends(
  transactions: Transaction[],
  category?: TransactionCategory
): Promise<CategoryTrend> {
  // Filter by category if specified
  const filteredTransactions = category
    ? transactions.filter((t) => t.category === category)
    : transactions;

  // Group by month
  const monthlyData = filteredTransactions.reduce((acc, transaction) => {
    const monthKey = transaction.timestamp.toISOString().slice(0, 7);
    if (!acc[monthKey]) {
      acc[monthKey] = { total: 0, count: 0 };
    }
    acc[monthKey].total += transaction.amount;
    acc[monthKey].count++;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  // Convert to array and sort by date
  const monthlyTrends: MonthlyTrend[] = Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      total: data.total,
      count: data.count,
    }))
    .sort((a, b) => b.month.localeCompare(a.month));

  // Calculate percentage change between last two months
  if (monthlyTrends.length < 2) {
    return {
      category: category || TransactionCategory.OTHER,
      currentMonth: monthlyTrends[0]?.total || 0,
      previousMonth: 0,
      changePercent: 0,
    };
  }

  const [current, previous] = monthlyTrends;
  const changePercent =
    previous.total > 0
      ? ((current.total - previous.total) / previous.total) * 100
      : 100;

  return {
    category: category || TransactionCategory.OTHER,
    currentMonth: current.total,
    previousMonth: previous.total,
    changePercent: parseFloat(changePercent.toFixed(1)),
  };
}

export async function analyzeSpending(
  userId: number,
  question: string
): Promise<AnalysisResult> {
  // Step 1: Detect analysis type from question
  const analysisType = detectAnalysisType(question);

  // Step 2: Query relevant data
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      timestamp: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // Last 90 days
    },
    orderBy: { timestamp: "desc" },
  }) as unknown as Transaction[];

  // Step 3: Generate insights
  switch (analysisType) {
    case "REDUCTION_ADVICE":
      return generateReductionAdvice(transactions, question);
    case "SPIKE_ANALYSIS":
      return analyzeSpendingSpike(transactions, question);
    default:
      return generalSpendingAnalysis(transactions);
  }
}

function detectAnalysisType(question: string): string {
  if (/reduce|cut|lower/i.test(question)) return "REDUCTION_ADVICE";
  if (/spike|increase|jump/i.test(question)) return "SPIKE_ANALYSIS";
  return "GENERAL_ANALYSIS";
}

async function generateReductionAdvice(
  transactions: Transaction[],
  question: string
): Promise<AnalysisResult> {
  // Extract category from question
  const categoryMatch = question.match(
    /food|transport|housing|insurance|investment|other/i
  );
  const category = categoryMatch
    ? (categoryMatch[0].toUpperCase() as TransactionCategory)
    : null;

  // Get monthly trends
  const monthlyTrend = await getMonthlyTrends(
    transactions,
    category || undefined
  );

  // Identify top merchants
  const topMerchants = transactions
    .filter((t) => (category ? t.category === category : true))
    .reduce((acc: Record<string, number>, t) => {
      acc[t.merchant] = (acc[t.merchant] || 0) + t.amount;
      return acc;
    }, {});

  const topMerchantsList = Object.entries(topMerchants)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const context = `User wants to reduce spending in ${
    category || "all categories"
  }. 
    Current trend: ${
      monthlyTrend.changePercent >= 0 ? "increase" : "decrease"
    } of ${Math.abs(monthlyTrend.changePercent)}%.
    Top merchants: ${topMerchantsList
      .map(([m, a]) => `${m} ($${a})`)
      .join(", ")}`;

  const recommendations = (await getLLMRecommendations(context)) || [
    "Switch to generic brands at supermarkets (potential 15-20% savings)",
    "Implement a 'no eating out' week each month",
    "Use cash envelopes for discretionary spending",
  ];

  return {
    insights: [
      category
        ? `Your ${category} spending ${
            monthlyTrend.changePercent >= 0 ? "increased" : "decreased"
          } by ${Math.abs(monthlyTrend.changePercent)}% last month`
        : `Your overall spending ${
            monthlyTrend.changePercent >= 0 ? "increased" : "decreased"
          } by ${Math.abs(monthlyTrend.changePercent)}% last month`,
      `Top spending sources: ${topMerchantsList
        .map(([merchant, amount]) => `${merchant} ($${amount.toFixed(2)})`)
        .join(", ")}`,
    ],
    trends: [monthlyTrend],
    recommendations,
    ...(monthlyTrend.changePercent > 20
      ? {
          warning: `Warning: Significant increase in ${
            category || "overall"
          } spending`,
        }
      : {}),
  };
}

async function analyzeSpendingSpike(
  transactions: Transaction[],
  question: string
): Promise<AnalysisResult> {
  const categoryMatch = question.match(
    /food|transport|housing|insurance|investment|other/i
  );
  const category = categoryMatch?.[0].toUpperCase() as TransactionCategory;

  if (!category) {
    return {
      insights: ["No specific category mentioned for spike analysis"],
      trends: [],
      recommendations: ["Please specify a category (e.g. food, transport)"],
      warning: "Category not specified",
    };
  }

  const recentTransactions = transactions
    .filter((t) => t.category === category)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  if (recentTransactions.length === 0) {
    return {
      insights: [`No recent transactions found in ${category} category`],
      trends: [],
      recommendations: [],
    };
  }

  // Calculate average and detect spikes
  const avgSpend =
    recentTransactions.reduce((sum, t) => sum + t.amount, 0) /
    recentTransactions.length;
  const spikes = recentTransactions.filter((t) => t.amount > avgSpend * 1.5);

  // Get trend data
  const trend = await getMonthlyTrends(transactions, category);

  const context = `Detected ${
    spikes.length
  } unusual ${category} transactions (above $${(avgSpend * 1.5).toFixed(2)}).
    Most significant: ${spikes[0]?.merchant || "none"} ($${
    spikes[0]?.amount.toFixed(2) || "0"
  }).
    Monthly trend: ${trend.changePercent >= 0 ? "+" : ""}${
    trend.changePercent
  }%`;

  const recommendations =
    (await getLLMRecommendations(context)) ||
    (spikes.length > 0
      ? [
          "Review recurring subscriptions in this category",
          "Set up spending alerts for transactions over $50",
          "Consider bulk purchasing for frequently bought items",
        ]
      : [
          `Your ${category.toLowerCase()} spending appears normal`,
          "Consider setting a budget if you haven't already",
        ]);

  return {
    insights: [
      spikes.length > 0
        ? `Detected ${
            spikes.length
          } unusual ${category} transactions (above $${(avgSpend * 1.5).toFixed(
            2
          )})`
        : `No unusual transactions detected in ${category}`,
      spikes.length > 0
        ? `Most significant: ${spikes[0].merchant} ($${spikes[0].amount.toFixed(
            2
          )}) on ${spikes[0].timestamp.toLocaleDateString()}`
        : `Average ${category.toLowerCase()} transaction: $${avgSpend.toFixed(
            2
          )}`,
      `Monthly trend: ${trend.changePercent >= 0 ? "+" : ""}${
        trend.changePercent
      }%`,
    ],
    trends: [trend],
    recommendations,
    ...(spikes.length > 3
      ? {
          warning: `Multiple unusual transactions (${spikes.length}) detected in ${category}`,
        }
      : {}),
  };
}

async function generalSpendingAnalysis(
  transactions: Transaction[]
): Promise<AnalysisResult> {
  // Get trends for all categories
  const categories = Object.values(TransactionCategory);
  const categoryTrends = await Promise.all(
    categories.map((cat) => getMonthlyTrends(transactions, cat))
  );

  // Identify top spending categories
  const topCategories = [...categoryTrends]
    .sort((a, b) => b.currentMonth - a.currentMonth)
    .slice(0, 3);

  // Find largest increase
  const largestIncrease = [...categoryTrends]
    .filter((t) => t.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)[0];

  // Find unusual transactions
  const unusualTransactions = transactions
    .filter((t) => t.amount > 100)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  const context = `Top spending categories: ${topCategories
    .map((c) => `${c.category} ($${c.currentMonth})`)
    .join(", ")}.
    ${
      largestIncrease
        ? `${largestIncrease.category} increased by ${largestIncrease.changePercent}%`
        : ""
    }
    ${
      unusualTransactions.length > 0
        ? `Unusual transactions: ${unusualTransactions
            .map((t) => `${t.merchant} ($${t.amount})`)
            .join(", ")}`
        : ""
    }`;

  const recommendations = (await getLLMRecommendations(context)) || [
    "Review your top spending categories for potential savings",
    "Set up alerts for large transactions",
    "Consider consolidating similar expenses",
  ];

  return {
    insights: [
      `Top spending categories: ${topCategories
        .map((c) => `${c.category} ($${c.currentMonth})`)
        .join(", ")}`,
      largestIncrease
        ? `${largestIncrease.category} spending increased by ${largestIncrease.changePercent}%`
        : "",
      unusualTransactions.length > 0
        ? `Unusual transactions: ${unusualTransactions
            .map((t) => `${t.merchant} ($${t.amount})`)
            .join(", ")}`
        : "",
    ].filter(Boolean),
    trends: categoryTrends,
    recommendations,
  };
}
