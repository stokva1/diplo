-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "actor_membership_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" UUID NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_attachments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "uploaded_by_membership_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size_bytes" INTEGER NOT NULL,
    "purpose" VARCHAR(30) NOT NULL DEFAULT 'OTHER',
    "storage_key" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "file_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "accepted_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "trip_log_retention_months" INTEGER NOT NULL DEFAULT 60,
    "issue_photo_retention_months" INTEGER NOT NULL DEFAULT 24,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "ico" VARCHAR(20),
    "contact_email" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vehicle_id" UUID NOT NULL,
    "membership_id" UUID NOT NULL,
    "start_at" TIMESTAMPTZ(6) NOT NULL,
    "end_at" TIMESTAMPTZ(6) NOT NULL,
    "origin" VARCHAR(255) NOT NULL,
    "destination" VARCHAR(255) NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "cancelled_at" TIMESTAMPTZ(6),
    "cancelled_by_membership_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vehicle_id" UUID NOT NULL,
    "created_by_membership_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "start_at" TIMESTAMPTZ(6) NOT NULL,
    "end_at" TIMESTAMPTZ(6) NOT NULL,
    "cost" DECIMAL(10,2),
    "invoice_file_id" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "cancelled_at" TIMESTAMPTZ(6),
    "cancelled_by_membership_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reservation_id" UUID NOT NULL,
    "odometer_start_km" INTEGER NOT NULL,
    "odometer_end_km" INTEGER NOT NULL,
    "distance_km" INTEGER GENERATED ALWAYS AS ("odometer_end_km" - "odometer_start_km") STORED,
    "refueled" BOOLEAN NOT NULL DEFAULT false,
    "refueling_cost" DECIMAL(10,2),
    "refueling_receipt_file_id" UUID,
    "note" TEXT,
    "completed_by_membership_id" UUID NOT NULL,
    "completed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email_verified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_issue_attachments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vehicle_issue_id" UUID NOT NULL,
    "file_attachment_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_issue_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_issues" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vehicle_id" UUID NOT NULL,
    "reservation_id" UUID,
    "reported_by_membership_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    "resolved_by_membership_id" UUID,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "manager_membership_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "license_plate" VARCHAR(30) NOT NULL,
    "brand" VARCHAR(100) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "vin" VARCHAR(50),
    "fuel_type" VARCHAR(30) NOT NULL,
    "current_odometer_km" INTEGER NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    "note" TEXT,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_audit_logs_actor_membership_id" ON "audit_logs"("actor_membership_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_audit_logs_entity" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_organization_id" ON "audit_logs"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_token_hash_key" ON "email_verification_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "idx_email_verification_tokens_expires_at" ON "email_verification_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "idx_email_verification_tokens_user_id" ON "email_verification_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "file_attachments_storage_key_key" ON "file_attachments"("storage_key");

-- CreateIndex
CREATE INDEX "idx_file_attachments_organization_id" ON "file_attachments"("organization_id");

-- CreateIndex
CREATE INDEX "idx_file_attachments_purpose" ON "file_attachments"("purpose");

-- CreateIndex
CREATE INDEX "idx_file_attachments_uploaded_by_membership_id" ON "file_attachments"("uploaded_by_membership_id");

-- CreateIndex
CREATE INDEX "idx_invitations_created_by_id" ON "invitations"("created_by_id");

-- CreateIndex
CREATE INDEX "idx_invitations_email" ON "invitations"("email");

-- CreateIndex
CREATE INDEX "idx_invitations_organization_id" ON "invitations"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_memberships_organization_user" ON "memberships"("organization_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_settings_organization_id_key" ON "organization_settings"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "idx_password_reset_tokens_expires_at" ON "password_reset_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "idx_password_reset_tokens_user_id" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "idx_reservations_cancelled_by_membership_id" ON "reservations"("cancelled_by_membership_id");

-- CreateIndex
CREATE INDEX "idx_reservations_membership_id" ON "reservations"("membership_id");

-- CreateIndex
CREATE INDEX "idx_reservations_status" ON "reservations"("status");

-- CreateIndex
CREATE INDEX "idx_reservations_vehicle_time" ON "reservations"("vehicle_id", "start_at", "end_at");

-- CreateIndex
CREATE INDEX "idx_service_events_cancelled_by_membership_id" ON "service_events"("cancelled_by_membership_id");

-- CreateIndex
CREATE INDEX "idx_service_events_created_by_membership_id" ON "service_events"("created_by_membership_id");

-- CreateIndex
CREATE INDEX "idx_service_events_invoice_file_id" ON "service_events"("invoice_file_id");

-- CreateIndex
CREATE INDEX "idx_service_events_status" ON "service_events"("status");

-- CreateIndex
CREATE INDEX "idx_service_events_vehicle_time" ON "service_events"("vehicle_id", "start_at", "end_at");

-- CreateIndex
CREATE UNIQUE INDEX "trip_logs_reservation_id_key" ON "trip_logs"("reservation_id");

-- CreateIndex
CREATE INDEX "idx_trip_logs_completed_by_membership_id" ON "trip_logs"("completed_by_membership_id");

-- CreateIndex
CREATE INDEX "idx_trip_logs_refueling_receipt_file_id" ON "trip_logs"("refueling_receipt_file_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_vehicle_issue_attachments_file_attachment_id" ON "vehicle_issue_attachments"("file_attachment_id");

-- CreateIndex
CREATE INDEX "idx_vehicle_issue_attachments_vehicle_issue_id" ON "vehicle_issue_attachments"("vehicle_issue_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_vehicle_issue_attachments_issue_file" ON "vehicle_issue_attachments"("vehicle_issue_id", "file_attachment_id");

-- CreateIndex
CREATE INDEX "idx_vehicle_issues_reported_by_membership_id" ON "vehicle_issues"("reported_by_membership_id");

-- CreateIndex
CREATE INDEX "idx_vehicle_issues_reservation_id" ON "vehicle_issues"("reservation_id");

-- CreateIndex
CREATE INDEX "idx_vehicle_issues_resolved_by_membership_id" ON "vehicle_issues"("resolved_by_membership_id");

-- CreateIndex
CREATE INDEX "idx_vehicle_issues_status" ON "vehicle_issues"("status");

-- CreateIndex
CREATE INDEX "idx_vehicle_issues_vehicle_id" ON "vehicle_issues"("vehicle_id");

-- CreateIndex
CREATE INDEX "idx_vehicles_manager_membership_id" ON "vehicles"("manager_membership_id");

-- CreateIndex
CREATE INDEX "idx_vehicles_organization_id" ON "vehicles"("organization_id");

-- CreateIndex
CREATE INDEX "idx_vehicles_status" ON "vehicles"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_vehicles_organization_license_plate" ON "vehicles"("organization_id", "license_plate");

-- CreateIndex
CREATE UNIQUE INDEX "uq_vehicles_organization_vin_not_null" ON "vehicles"("organization_id", "vin") WHERE (vin IS NOT NULL);

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_membership_id_fkey" FOREIGN KEY ("actor_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "file_attachments" ADD CONSTRAINT "file_attachments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "file_attachments" ADD CONSTRAINT "file_attachments_uploaded_by_membership_id_fkey" FOREIGN KEY ("uploaded_by_membership_id") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "organization_settings" ADD CONSTRAINT "organization_settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_cancelled_by_membership_id_fkey" FOREIGN KEY ("cancelled_by_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "service_events" ADD CONSTRAINT "service_events_cancelled_by_membership_id_fkey" FOREIGN KEY ("cancelled_by_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "service_events" ADD CONSTRAINT "service_events_created_by_membership_id_fkey" FOREIGN KEY ("created_by_membership_id") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "service_events" ADD CONSTRAINT "service_events_invoice_file_id_fkey" FOREIGN KEY ("invoice_file_id") REFERENCES "file_attachments"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "service_events" ADD CONSTRAINT "service_events_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trip_logs" ADD CONSTRAINT "trip_logs_completed_by_membership_id_fkey" FOREIGN KEY ("completed_by_membership_id") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trip_logs" ADD CONSTRAINT "trip_logs_refueling_receipt_file_id_fkey" FOREIGN KEY ("refueling_receipt_file_id") REFERENCES "file_attachments"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trip_logs" ADD CONSTRAINT "trip_logs_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vehicle_issue_attachments" ADD CONSTRAINT "vehicle_issue_attachments_file_attachment_id_fkey" FOREIGN KEY ("file_attachment_id") REFERENCES "file_attachments"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vehicle_issue_attachments" ADD CONSTRAINT "vehicle_issue_attachments_vehicle_issue_id_fkey" FOREIGN KEY ("vehicle_issue_id") REFERENCES "vehicle_issues"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vehicle_issues" ADD CONSTRAINT "vehicle_issues_reported_by_membership_id_fkey" FOREIGN KEY ("reported_by_membership_id") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vehicle_issues" ADD CONSTRAINT "vehicle_issues_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vehicle_issues" ADD CONSTRAINT "vehicle_issues_resolved_by_membership_id_fkey" FOREIGN KEY ("resolved_by_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vehicle_issues" ADD CONSTRAINT "vehicle_issues_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_manager_membership_id_fkey" FOREIGN KEY ("manager_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- Custom CHECK constraints not represented by Prisma Schema

ALTER TABLE "memberships"
    ADD CONSTRAINT "ck_memberships_role"
        CHECK ("role" IN ('ADMIN', 'MEMBER')),
    ADD CONSTRAINT "ck_memberships_status"
        CHECK ("status" IN ('ACTIVE', 'DISABLED'));

ALTER TABLE "vehicles"
    ADD CONSTRAINT "ck_vehicles_fuel_type"
        CHECK ("fuel_type" IN (
                               'PETROL',
                               'DIESEL',
                               'ELECTRIC',
                               'HYBRID',
                               'LPG',
                               'CNG',
                               'OTHER'
            )),
    ADD CONSTRAINT "ck_vehicles_status"
        CHECK ("status" IN ('ACTIVE', 'UNAVAILABLE', 'ARCHIVED')),
    ADD CONSTRAINT "ck_vehicles_current_odometer_km"
        CHECK ("current_odometer_km" >= 0);

ALTER TABLE "reservations"
    ADD CONSTRAINT "ck_reservations_status"
        CHECK ("status" IN ('ACTIVE', 'CANCELLED')),
    ADD CONSTRAINT "ck_reservations_time_order"
        CHECK ("end_at" > "start_at"),
    ADD CONSTRAINT "ck_reservations_cancelled_fields"
        CHECK (
            (
                "status" = 'CANCELLED'
                AND "cancelled_at" IS NOT NULL
            )
            OR
            (
                "status" = 'ACTIVE'
                AND "cancelled_at" IS NULL
                AND "cancelled_by_membership_id" IS NULL
            )
        );

ALTER TABLE "file_attachments"
    ADD CONSTRAINT "ck_file_attachments_file_size"
        CHECK ("file_size_bytes" >= 0),
    ADD CONSTRAINT "ck_file_attachments_purpose"
        CHECK (
            "purpose" IN (
                'FUEL_RECEIPT',
                'ISSUE_PHOTO',
                'SERVICE_INVOICE',
                'OTHER'
            )
        );

ALTER TABLE "trip_logs"
    ADD CONSTRAINT "ck_trip_logs_odometer_start"
        CHECK ("odometer_start_km" >= 0),
    ADD CONSTRAINT "ck_trip_logs_odometer_end"
        CHECK ("odometer_end_km" >= "odometer_start_km"),
    ADD CONSTRAINT "ck_trip_logs_refueling_cost"
        CHECK (
            "refueling_cost" IS NULL
            OR "refueling_cost" >= 0
        ),
    ADD CONSTRAINT "ck_trip_logs_refueling_cost_requires_refueled"
        CHECK (
            "refueled" = true
            OR "refueling_cost" IS NULL
        );

ALTER TABLE "vehicle_issues"
    ADD CONSTRAINT "ck_vehicle_issues_status"
        CHECK ("status" IN ('OPEN', 'RESOLVED')),
    ADD CONSTRAINT "ck_vehicle_issues_resolved_fields"
        CHECK (
            (
                "status" = 'RESOLVED'
                AND "resolved_at" IS NOT NULL
            )
            OR
            (
                "status" = 'OPEN'
                AND "resolved_at" IS NULL
                AND "resolved_by_membership_id" IS NULL
            )
        );

ALTER TABLE "service_events"
    ADD CONSTRAINT "ck_service_events_time_order"
        CHECK ("end_at" > "start_at"),
    ADD CONSTRAINT "ck_service_events_cost"
        CHECK (
            "cost" IS NULL
            OR "cost" >= 0
        ),
    ADD CONSTRAINT "ck_service_events_status"
        CHECK ("status" IN ('ACTIVE', 'CANCELLED')),
    ADD CONSTRAINT "ck_service_events_cancelled_fields"
        CHECK (
            (
                "status" = 'CANCELLED'
                AND "cancelled_at" IS NOT NULL
            )
            OR
            "status" = 'ACTIVE'
        );

ALTER TABLE "organization_settings"
    ADD CONSTRAINT "ck_organization_settings_trip_log_retention"
        CHECK ("trip_log_retention_months" > 0),
    ADD CONSTRAINT "ck_organization_settings_issue_photo_retention"
        CHECK ("issue_photo_retention_months" > 0);