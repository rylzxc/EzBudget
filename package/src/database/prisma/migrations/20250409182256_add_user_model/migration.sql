-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "age" INTEGER,
    "number_of_kids" INTEGER NOT NULL DEFAULT 0,
    "monthly_take_home" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "planning_to_buy_home" BOOLEAN NOT NULL DEFAULT false,
    "repaying_home_loans" BOOLEAN NOT NULL DEFAULT false,
    "supporting_aged_parents" BOOLEAN NOT NULL DEFAULT false,
    "transport_expenditure" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "food_expenditure" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "housing_expenditure" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "emergency_funds" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "main_financial_goal" TEXT,
    "budget_flexibility" TEXT,
    "financial_struggle" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
