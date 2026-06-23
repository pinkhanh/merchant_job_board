-- CreateEnum
CREATE TYPE "merchant_status" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('merchant', 'admin');

-- CreateEnum
CREATE TYPE "employment_type" AS ENUM ('part_time', 'shift', 'seasonal');

-- CreateEnum
CREATE TYPE "salary_type" AS ENUM ('hourly', 'shift', 'monthly', 'negotiable');

-- CreateEnum
CREATE TYPE "job_post_status" AS ENUM ('draft', 'live', 'paused', 'expired');

-- CreateEnum
CREATE TYPE "import_status" AS ENUM ('new', 'imported');

-- CreateEnum
CREATE TYPE "moderation_action" AS ENUM ('pause', 'unpublish');

-- CreateTable
CREATE TABLE "merchants" (
    "id" TEXT NOT NULL,
    "brand_name" TEXT NOT NULL,
    "logo_url" TEXT,
    "industry" TEXT NOT NULL,
    "banner_url" TEXT,
    "hotline" TEXT,
    "description" VARCHAR(500),
    "job_categories" JSONB NOT NULL DEFAULT '[]',
    "status" "merchant_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "merchant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "street_address" TEXT NOT NULL,
    "ward" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "lat" DECIMAL(9,6),
    "lng" DECIMAL(9,6),
    "opening_hours" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "user_role" NOT NULL,
    "merchant_id" TEXT,
    "sso_provider" TEXT,
    "sso_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historical_jds" (
    "id" TEXT NOT NULL,
    "merchant_id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historical_jds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_posts" (
    "id" TEXT NOT NULL,
    "merchant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "job_category" TEXT,
    "employment_type" "employment_type" NOT NULL,
    "salary_min" INTEGER,
    "salary_max" INTEGER,
    "salary_type" "salary_type" NOT NULL,
    "schedule" JSONB NOT NULL,
    "deadline" DATE NOT NULL,
    "experience_required" TEXT,
    "required_skills" TEXT[],
    "requirements" TEXT,
    "benefits" TEXT[],
    "description" TEXT,
    "status" "job_post_status" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "job_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_post_stores" (
    "job_post_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,

    CONSTRAINT "job_post_stores_pkey" PRIMARY KEY ("job_post_id","store_id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "job_post_id" TEXT NOT NULL,
    "applicant_name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "import_status" "import_status" NOT NULL DEFAULT 'new',
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_post_moderation_logs" (
    "id" TEXT NOT NULL,
    "job_post_id" TEXT NOT NULL,
    "admin_user_id" TEXT NOT NULL,
    "action" "moderation_action" NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_post_moderation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phone_reveal_logs" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "revealed_by" TEXT NOT NULL,
    "revealed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_reveal_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "applications_job_post_id_phone_number_key" ON "applications"("job_post_id", "phone_number");

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historical_jds" ADD CONSTRAINT "historical_jds_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_posts" ADD CONSTRAINT "job_posts_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_post_stores" ADD CONSTRAINT "job_post_stores_job_post_id_fkey" FOREIGN KEY ("job_post_id") REFERENCES "job_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_post_stores" ADD CONSTRAINT "job_post_stores_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_post_id_fkey" FOREIGN KEY ("job_post_id") REFERENCES "job_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_post_moderation_logs" ADD CONSTRAINT "job_post_moderation_logs_job_post_id_fkey" FOREIGN KEY ("job_post_id") REFERENCES "job_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_post_moderation_logs" ADD CONSTRAINT "job_post_moderation_logs_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phone_reveal_logs" ADD CONSTRAINT "phone_reveal_logs_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phone_reveal_logs" ADD CONSTRAINT "phone_reveal_logs_revealed_by_fkey" FOREIGN KEY ("revealed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
