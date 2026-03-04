/*
  Warnings:

  - You are about to alter the column `amount` on the `ledger_entries` table. The data in that column could be lost. The data in that column will be cast from `Decimal(19,4)` to `Decimal(19,2)`.
  - You are about to alter the column `amount` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(19,4)` to `Decimal(19,2)`.

*/
-- AlterTable
ALTER TABLE "ledger_entries" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(19,2);

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(19,2);
