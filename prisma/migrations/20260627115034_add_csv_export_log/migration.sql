-- CreateTable
CREATE TABLE "csv_export_logs" (
    "id" TEXT NOT NULL,
    "exported_by" TEXT NOT NULL,
    "applicant_count" INTEGER NOT NULL,
    "file_name" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "exported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "csv_export_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "csv_export_logs" ADD CONSTRAINT "csv_export_logs_exported_by_fkey" FOREIGN KEY ("exported_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
