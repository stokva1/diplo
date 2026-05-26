-- Diplo - EA-friendly PostgreSQL DDL
-- Datovy model pro MVP aplikace spravy sdilenych firemnich vozidel
-- Verze podle aktualnich zdroju: UUID, Membership, jedno vozidlo = max. jeden spravce,
-- Reservation.status v DB pouze ACTIVE/CANCELLED, FINISHED je prezentacni stav v API.
-- Membership.status pouze ACTIVE/DISABLED; pozvani lide jsou v invitations, ne v memberships.
-- ServiceEvent ma status ACTIVE/CANCELLED a canceled metadata.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(255) NOT NULL,
    ico varchar(20),
    contact_email varchar(255),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email varchar(255) NOT NULL UNIQUE,
    password_hash varchar(255) NOT NULL,
    name varchar(255) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memberships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    role varchar(20) NOT NULL DEFAULT 'MEMBER',
    status varchar(20) NOT NULL DEFAULT 'ACTIVE',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_memberships_organization_user UNIQUE (organization_id, user_id),
    CONSTRAINT ck_memberships_role CHECK (role IN ('ADMIN', 'MEMBER')),
    CONSTRAINT ck_memberships_status CHECK (status IN ('ACTIVE', 'DISABLED'))
);

CREATE TABLE IF NOT EXISTS invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email varchar(255) NOT NULL,
    name varchar(255),
    token_hash varchar(255) NOT NULL,
    expires_at timestamptz NOT NULL,
    accepted_at timestamptz,
    cancelled_at timestamptz,
    created_by_id uuid NOT NULL REFERENCES memberships(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitations_organization_id ON invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_created_by_id ON invitations(created_by_id);

CREATE TABLE IF NOT EXISTS vehicles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    manager_membership_id uuid REFERENCES memberships(id) ON DELETE SET NULL,
    name varchar(255) NOT NULL,
    license_plate varchar(30) NOT NULL,
    brand varchar(100) NOT NULL,
    model varchar(100) NOT NULL,
    vin varchar(50),
    fuel_type varchar(30) NOT NULL,
    current_odometer_km integer NOT NULL,
    status varchar(30) NOT NULL DEFAULT 'ACTIVE',
    note text,
    archived_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_vehicles_organization_license_plate UNIQUE (organization_id, license_plate),
    CONSTRAINT ck_vehicles_fuel_type CHECK (fuel_type IN ('PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'LPG', 'CNG', 'OTHER')),
    CONSTRAINT ck_vehicles_status CHECK (status IN ('ACTIVE', 'UNAVAILABLE', 'ARCHIVED')),
    CONSTRAINT ck_vehicles_current_odometer_km CHECK (current_odometer_km >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_vehicles_organization_vin_not_null
ON vehicles(organization_id, vin)
WHERE vin IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vehicles_organization_id ON vehicles(organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_manager_membership_id ON vehicles(manager_membership_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);

CREATE TABLE IF NOT EXISTS reservations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    membership_id uuid NOT NULL REFERENCES memberships(id) ON DELETE RESTRICT,
    start_at timestamptz NOT NULL,
    end_at timestamptz NOT NULL,
    origin varchar(255) NOT NULL,
    destination varchar(255) NOT NULL,
    purpose text NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'ACTIVE',
    cancelled_at timestamptz,
    cancelled_by_membership_id uuid REFERENCES memberships(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_reservations_status CHECK (status IN ('ACTIVE', 'CANCELLED')),
    CONSTRAINT ck_reservations_time_order CHECK (end_at > start_at),
    CONSTRAINT ck_reservations_cancelled_fields CHECK (
        (status = 'CANCELLED' AND cancelled_at IS NOT NULL)
        OR
        (status = 'ACTIVE' AND cancelled_at IS NULL AND cancelled_by_membership_id IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_reservations_vehicle_time ON reservations(vehicle_id, start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_reservations_membership_id ON reservations(membership_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_cancelled_by_membership_id ON reservations(cancelled_by_membership_id);

CREATE TABLE IF NOT EXISTS file_attachments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    uploaded_by_membership_id uuid NOT NULL REFERENCES memberships(id) ON DELETE RESTRICT,
    file_name varchar(255) NOT NULL,
    mime_type varchar(100) NOT NULL,
    file_size_bytes integer NOT NULL,
    purpose varchar(30) NOT NULL DEFAULT 'OTHER',
    storage_key varchar(500) NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    CONSTRAINT ck_file_attachments_file_size CHECK (file_size_bytes >= 0),
    CONSTRAINT ck_file_attachments_purpose CHECK (purpose IN ('FUEL_RECEIPT', 'ISSUE_PHOTO', 'SERVICE_INVOICE', 'OTHER'))
);

CREATE INDEX IF NOT EXISTS idx_file_attachments_organization_id ON file_attachments(organization_id);
CREATE INDEX IF NOT EXISTS idx_file_attachments_uploaded_by_membership_id ON file_attachments(uploaded_by_membership_id);
CREATE INDEX IF NOT EXISTS idx_file_attachments_purpose ON file_attachments(purpose);

CREATE TABLE IF NOT EXISTS trip_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id uuid NOT NULL UNIQUE REFERENCES reservations(id) ON DELETE RESTRICT,
    odometer_start_km integer NOT NULL,
    odometer_end_km integer NOT NULL,
    distance_km integer GENERATED ALWAYS AS (odometer_end_km - odometer_start_km) STORED,
    refueled boolean NOT NULL DEFAULT false,
    refueling_cost numeric(10,2),
    refueling_receipt_file_id uuid REFERENCES file_attachments(id) ON DELETE SET NULL,
    note text,
    completed_by_membership_id uuid NOT NULL REFERENCES memberships(id) ON DELETE RESTRICT,
    completed_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_trip_logs_odometer_start CHECK (odometer_start_km >= 0),
    CONSTRAINT ck_trip_logs_odometer_end CHECK (odometer_end_km >= odometer_start_km),
    CONSTRAINT ck_trip_logs_refueling_cost CHECK (refueling_cost IS NULL OR refueling_cost >= 0),
    CONSTRAINT ck_trip_logs_refueling_cost_requires_refueled CHECK (refueled = true OR refueling_cost IS NULL)
);

CREATE INDEX IF NOT EXISTS idx_trip_logs_completed_by_membership_id ON trip_logs(completed_by_membership_id);
CREATE INDEX IF NOT EXISTS idx_trip_logs_refueling_receipt_file_id ON trip_logs(refueling_receipt_file_id);

CREATE TABLE IF NOT EXISTS vehicle_issues (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    reservation_id uuid REFERENCES reservations(id) ON DELETE SET NULL,
    reported_by_membership_id uuid NOT NULL REFERENCES memberships(id) ON DELETE RESTRICT,
    description text NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'OPEN',
    resolved_by_membership_id uuid REFERENCES memberships(id) ON DELETE SET NULL,
    resolved_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_vehicle_issues_status CHECK (status IN ('OPEN', 'RESOLVED')),
    CONSTRAINT ck_vehicle_issues_resolved_fields CHECK (
        (status = 'RESOLVED' AND resolved_at IS NOT NULL)
        OR
        (status = 'OPEN' AND resolved_at IS NULL AND resolved_by_membership_id IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_vehicle_issues_vehicle_id ON vehicle_issues(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_issues_reservation_id ON vehicle_issues(reservation_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_issues_reported_by_membership_id ON vehicle_issues(reported_by_membership_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_issues_resolved_by_membership_id ON vehicle_issues(resolved_by_membership_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_issues_status ON vehicle_issues(status);

CREATE TABLE IF NOT EXISTS vehicle_issue_attachments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_issue_id uuid NOT NULL REFERENCES vehicle_issues(id) ON DELETE CASCADE,
    file_attachment_id uuid NOT NULL REFERENCES file_attachments(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_vehicle_issue_attachments_issue_file UNIQUE (vehicle_issue_id, file_attachment_id)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_issue_attachments_vehicle_issue_id ON vehicle_issue_attachments(vehicle_issue_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_issue_attachments_file_attachment_id ON vehicle_issue_attachments(file_attachment_id);

CREATE TABLE IF NOT EXISTS service_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    created_by_membership_id uuid NOT NULL REFERENCES memberships(id) ON DELETE RESTRICT,
    title varchar(255) NOT NULL,
    description text,
    start_at timestamptz NOT NULL,
    end_at timestamptz NOT NULL,
    cost numeric(10,2),
    invoice_file_id uuid REFERENCES file_attachments(id) ON DELETE SET NULL,
    status varchar(20) NOT NULL DEFAULT 'ACTIVE',
    cancelled_at timestamptz,
    cancelled_by_membership_id uuid REFERENCES memberships(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_service_events_time_order CHECK (end_at > start_at),
    CONSTRAINT ck_service_events_cost CHECK (cost IS NULL OR cost >= 0),
    CONSTRAINT ck_service_events_status CHECK (status IN ('ACTIVE', 'CANCELLED')),
    CONSTRAINT ck_service_events_cancelled_fields CHECK (
        (status = 'CANCELLED' AND cancelled_at IS NOT NULL)
        OR (status = 'ACTIVE')
    )
);

CREATE INDEX IF NOT EXISTS idx_service_events_vehicle_time ON service_events(vehicle_id, start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_service_events_created_by_membership_id ON service_events(created_by_membership_id);
CREATE INDEX IF NOT EXISTS idx_service_events_invoice_file_id ON service_events(invoice_file_id);
CREATE INDEX IF NOT EXISTS idx_service_events_status ON service_events(status);
CREATE INDEX IF NOT EXISTS idx_service_events_cancelled_by_membership_id ON service_events(cancelled_by_membership_id);

CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    actor_membership_id uuid REFERENCES memberships(id) ON DELETE SET NULL,
    action varchar(100) NOT NULL,
    entity_type varchar(100) NOT NULL,
    entity_id uuid NOT NULL,
    old_values jsonb,
    new_values jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_membership_id ON audit_logs(actor_membership_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

CREATE TABLE IF NOT EXISTS organization_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    trip_log_retention_months integer NOT NULL DEFAULT 60,
    issue_photo_retention_months integer NOT NULL DEFAULT 24,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_organization_settings_trip_log_retention CHECK (trip_log_retention_months > 0),
    CONSTRAINT ck_organization_settings_issue_photo_retention CHECK (issue_photo_retention_months > 0)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash varchar(255) NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    used_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
