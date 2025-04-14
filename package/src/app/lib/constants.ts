import { TrainingData } from "./transactionClassifier";

// Singapore-specific training data
export const trainingData: TrainingData[] = [
  // Transport (12 examples)
  { text: "grab ride to orchard", category: "Transport" },
  { text: "gojek to changi airport", category: "Transport" },
  { text: "comfort taxi trip", category: "Transport" },
  { text: "cdg zig booking", category: "Transport" },
  { text: "mrt ride", category: "Transport" },
  { text: "bus fare", category: "Transport" },
  { text: "ez link topup", category: "Transport" },
  { text: "grabhitch", category: "Transport" },
  { text: "ryde pool", category: "Transport" },
  { text: "taxi fare", category: "Transport" },
  { text: "sbs transit", category: "Transport" },
  { text: "smrt journey", category: "Transport" },

  // Food & Beverage (15 examples)
  { text: "mcdonalds bishan", category: "Food" },
  { text: "starbucks raffles city", category: "Food" },
  { text: "kfc lunch", category: "Food" },
  { text: "pizza hut delivery", category: "Food" },
  { text: "ya kun toast", category: "Food" },
  { text: "toast box breakfast", category: "Food" },
  { text: "kopitiam meal", category: "Food" },
  { text: "food republic", category: "Food" },
  { text: "hawker chan", category: "Food" },
  { text: "paradise dynasty", category: "Food" },
  { text: "din tai fung", category: "Food" },
  { text: "jollibee", category: "Food" },
  { text: "bubble tea", category: "Food" },
  { text: "liho tea", category: "Food" },
  { text: "koi thé", category: "Food" },

  // Groceries (10 examples)
  { text: "fairprice groceries", category: "Groceries" },
  { text: "cold storage market", category: "Groceries" },
  { text: "sheng shiong", category: "Groceries" },
  { text: "giant supermarket", category: "Groceries" },
  { text: "ntuc warehouse", category: "Groceries" },
  { text: "meidi ya", category: "Groceries" },
  { text: "dairy farm", category: "Groceries" },
  { text: "redmart delivery", category: "Groceries" },
  { text: "prime supermarket", category: "Groceries" },
  { text: "marketplace", category: "Groceries" },

  // Shopping (10 examples)
  { text: "shopee order", category: "Shopping" },
  { text: "lazada purchase", category: "Shopping" },
  { text: "amazon sg", category: "Shopping" },
  { text: "qoo10 buy", category: "Shopping" },
  { text: "uniqlo raffles", category: "Shopping" },
  { text: "h&m purchase", category: "Shopping" },
  { text: "zara orchard", category: "Shopping" },
  { text: "taobao direct", category: "Shopping" },
  { text: "ikea alexandra", category: "Shopping" },
  { text: "don don donki", category: "Shopping" },

  // Bills & Utilities (8 examples)
  { text: "singtel bill", category: "Bills" },
  { text: "starhub payment", category: "Bills" },
  { text: "sp services", category: "Bills" },
  { text: "pub utilities", category: "Bills" },
  { text: "town council", category: "Bills" },
  { text: "insurance premium", category: "Bills" },
  { text: "income tax", category: "Bills" },
  { text: "iras payment", category: "Bills" },

  // Entertainment (6 examples)
  { text: "netflix subscription", category: "Entertainment" },
  { text: "spotify premium", category: "Entertainment" },
  { text: "golden village", category: "Entertainment" },
  { text: "kbox karaoke", category: "Entertainment" },
  { text: "universal studios", category: "Entertainment" },
  { text: "zoo ticket", category: "Entertainment" },
];
