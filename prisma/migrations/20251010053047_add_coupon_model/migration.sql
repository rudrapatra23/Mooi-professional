-- CreateTable
CREATE TABLE "Coupon" (
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL,
    "forNewUser" BOOLEAN NOT NULL,
    "forMember" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("code")
);
