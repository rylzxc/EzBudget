-- CreateEnum
CREATE TYPE "TransactionCategory" AS ENUM ('FOOD', 'TRANSPORT', 'HOUSING', 'INSURANCE', 'INVESTMENT', 'OTHER');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "category" "TransactionCategory";
