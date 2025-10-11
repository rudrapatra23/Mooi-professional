/*
  Warnings:

  - You are about to drop the column `coupon` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `isCouponUsed` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `isPaid` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `paidAt` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `razorpayOrderId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `razorpayPaymentId` on the `Order` table. All the data in the column will be lost.
  - The `status` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[razorpayId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."Order" DROP CONSTRAINT "Order_addressId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Order" DROP CONSTRAINT "Order_userId_fkey";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "coupon",
DROP COLUMN "isCouponUsed",
DROP COLUMN "isPaid",
DROP COLUMN "paidAt",
DROP COLUMN "razorpayOrderId",
DROP COLUMN "razorpayPaymentId",
ADD COLUMN     "addressJson" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "gst" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "itemsJson" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "razorpayId" TEXT,
ADD COLUMN     "shipping" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'created',
ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "addressId" DROP NOT NULL,
ALTER COLUMN "paymentMethod" SET DEFAULT 'COD';

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "method" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL,
    "signature" TEXT,
    "metaJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_razorpayPaymentId_key" ON "Payment"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "Payment_razorpayPaymentId_idx" ON "Payment"("razorpayPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_razorpayId_key" ON "Order"("razorpayId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
