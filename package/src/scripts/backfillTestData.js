const { faker } = require('@faker-js/faker');
const dayjs = require('dayjs');
const { Pool } = require('pg');

const TransactionCategory = {
  FOOD: "FOOD",
  TRANSPORT: "TRANSPORT",
  HOUSING: "HOUSING",
  INSURANCE: "INSURANCE",
  INVESTMENT: "INVESTMENT",
  OTHER: "OTHER"
};

const pool = new Pool({ connectionString: '' });

async function main() {
  const userId = 6;
  const client = await pool.connect();

  try {
    // 1. Upsert user with all required fields
    await client.query(`
      INSERT INTO "User" (
        id, email, name, password, "monthly_take_home",
        "createdAt", "updatedAt", age, number_of_kids,
        planning_to_buy_home, repaying_home_loans,
        supporting_aged_parents, owns_car,
        transport_expenditure, food_expenditure,
        housing_expenditure, emergency_funds,
        investment_expenditure, insurance_expenditure,
        other_needs_expenditure, monthly_savings
      )
      VALUES (
        $1, $2, $3, $4, $5,
        NOW(), NOW(), $6, $7,
        $8, $9, $10, $11,
        $12, $13, $14, $15,
        $16, $17, $18, $19
      )
      ON CONFLICT (id) DO NOTHING
    `, [
      userId, 'johnTan@gmail.com', 'John Tan', 'hashed_password_placeholder', 5000,
      30, 0,  // age, number_of_kids
      false, false, false, false, // boolean fields
      0, 0, 0, 0, 0, 0, 0, 0  // expenditure fields
    ]);

    const monthsToGenerate = 6;
    const transactionsPerMonth = 30;

    for (let i = 0; i < monthsToGenerate; i++) {
      const monthDate = dayjs().subtract(i, "month");
      const daysInMonth = monthDate.daysInMonth();

      for (let j = 0; j < transactionsPerMonth; j++) {
        const category = getWeightedRandomCategory();
        const amount = generateRealisticAmount(category);
        const dayOfMonth = faker.number.int({ min: 1, max: daysInMonth });
        const merchant = generateMerchant(category);
        const timestamp = monthDate.date(dayOfMonth).toISOString();

        await client.query(`
          INSERT INTO "Transaction" (
            id, timestamp, merchant, amount, category, "userId"
          )
          VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5
          )
        `, [timestamp, merchant, amount, category, userId]);
      }
    }

    console.log(`✅ Successfully generated ${monthsToGenerate * transactionsPerMonth} transactions`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Helper functions for realistic data generation
function getWeightedRandomCategory() {
  const weights = {
    [TransactionCategory.FOOD]: 0.35,
    [TransactionCategory.TRANSPORT]: 0.2,
    [TransactionCategory.HOUSING]: 0.15,
    [TransactionCategory.INSURANCE]: 0.1,
    [TransactionCategory.INVESTMENT]: 0.1,
    [TransactionCategory.OTHER]: 0.1,
  };

  const random = Math.random();
  let cumulativeWeight = 0;

  for (const [category, weight] of Object.entries(weights)) {
    cumulativeWeight += weight;
    if (random <= cumulativeWeight) {
      return category;
    }
  }

  return TransactionCategory.OTHER;
}

function generateRealisticAmount(category) {
  const ranges = {
    [TransactionCategory.FOOD]: { min: 8, max: 150, common: 25 },
    [TransactionCategory.TRANSPORT]: { min: 3, max: 200, common: 40 },
    [TransactionCategory.HOUSING]: { min: 800, max: 2500, common: 1200 },
    [TransactionCategory.INSURANCE]: { min: 50, max: 300, common: 120 },
    [TransactionCategory.INVESTMENT]: { min: 100, max: 1000, common: 200 },
    [TransactionCategory.OTHER]: { min: 5, max: 500, common: 30 },
  };

  // 80% chance for common amount, 20% for random in range
  if (Math.random() < 0.8) {
    return faker.number.float({
      min: ranges[category].common * 0.8,
      max: ranges[category].common * 1.2,
    });
  }

  return faker.number.float({
    min: ranges[category].min,
    max: ranges[category].max,
  });
}

function generateMerchant(category) {
  const sgMerchants = {
    [TransactionCategory.FOOD]: [
      "NTUC FairPrice",
      "Sheng Siong",
      "Cold Storage",
      "Giant",
      "Kopitiam",
      "Food Republic",
      "Toast Box",
      "Ya Kun Kaya Toast",
      "Bengawan Solo",
      "Old Chang Kee",
      "Jollibee",
      "McDonald's",
      "KFC",
      "Pizza Hut",
      "GrabFood",
      "Foodpanda",
      "Starbucks",
      "LiHo Tea",
      "KOI Thé",
    ],
    [TransactionCategory.TRANSPORT]: [
      "SMRT",
      "SBS Transit",
      "Grab Ride",
      "Gojek SG",
      "ComfortDelGro Taxi",
      "Caltex SG",
      "LTA ERP",
    ],
    [TransactionCategory.HOUSING]: ["HDB Loan"],
    [TransactionCategory.INSURANCE]: ["AIA SG"],
    [TransactionCategory.INVESTMENT]: [
      "Endowus",
      "StashAway",
      "Syfe",
      "Tiger Brokers",
      "Interactive Brokers",
      "Saxo",
    ],
    [TransactionCategory.OTHER]: [
      "Shopee",
      "Lazada",
      "Qoo10",
      "Amazon",
      "Zalora",
      "Challenger",
      "Popular Bookstore",
      "Times Bookstore",
      "Guardian",
      "Watsons",
      "Uniqlo",
      "Decathlon",
      "Don Don Donki",
      "BHG",
      "Mustafa Centre",
      "Changi Recommends",
      "KrisShop",
    ],
  };

  return faker.helpers.arrayElement(sgMerchants[category]);
}

main().catch(console.error);
