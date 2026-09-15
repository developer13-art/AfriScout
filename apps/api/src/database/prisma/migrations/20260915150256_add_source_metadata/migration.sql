-- AlterTable
ALTER TABLE "source_suggestions" ADD COLUMN     "metadata" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "sources" ADD COLUMN     "metadata" JSONB NOT NULL DEFAULT '{}';
