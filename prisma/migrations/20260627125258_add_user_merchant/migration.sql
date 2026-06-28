-- CreateTable
CREATE TABLE "user_merchants" (
    "user_id" TEXT NOT NULL,
    "merchant_id" TEXT NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_merchants_pkey" PRIMARY KEY ("user_id","merchant_id")
);

-- AddForeignKey
ALTER TABLE "user_merchants" ADD CONSTRAINT "user_merchants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_merchants" ADD CONSTRAINT "user_merchants_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
