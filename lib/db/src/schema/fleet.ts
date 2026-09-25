import {
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const vehiclesTable = pgTable("vehicles", {
  id: uuid("id").primaryKey().defaultRandom(),
  year: integer("year").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  vehicleClass: text("vehicle_class").notNull(),
  unitNumber: text("unit_number").notNull().unique(),
  licensePlate: text("license_plate").notNull().unique(),
  vin: text("vin"),
  capacity: integer("capacity").notNull(),
  transmission: text("transmission").notNull().default("Automatic"),
  features: text("features").array().notNull().default([]),
  dailyRate: numeric("daily_rate", { precision: 10, scale: 2, mode: "number" }).notNull(),
  weeklyRate: numeric("weekly_rate", { precision: 10, scale: 2, mode: "number" }).notNull(),
  status: text("status").notNull().default("available"),
  imageUrl: text("image_url").notNull(),
  detailsConfirmed: boolean("details_confirmed").notNull().default(false),
  notes: text("notes"),
  archived: boolean("archived").notNull().default(false),
  ...timestamps,
});

export const customersTable = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  notes: text("notes"),
  dateOfBirth: date("date_of_birth"),
  ...timestamps,
});

export const rentalsTable = pgTable("rentals", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customersTable.id),
  vehicleId: uuid("vehicle_id")
    .notNull()
    .references(() => vehiclesTable.id),
  pickupAt: timestamp("pickup_at", { withTimezone: true }).notNull(),
  expectedReturnAt: timestamp("expected_return_at", { withTimezone: true }).notNull(),
  actualReturnAt: timestamp("actual_return_at", { withTimezone: true }),
  rateType: text("rate_type").notNull(),
  rate: numeric("rate", { precision: 10, scale: 2, mode: "number" }).notNull(),
  deposit: numeric("deposit", { precision: 10, scale: 2, mode: "number" }).notNull().default(300),
  depositStatus: text("deposit_status").notNull().default("not_collected"),
  status: text("status").notNull().default("reserved"),
  agreementStatus: text("agreement_status").notNull().default("not_sent"),
  rentalDays: integer("rental_days"),
  estimatedBaseTotal: numeric("estimated_base_total", { precision: 10, scale: 2, mode: "number" }),
  estimatedTax: numeric("estimated_tax", { precision: 10, scale: 2, mode: "number" }),
  estimatedTotal: numeric("estimated_total", { precision: 10, scale: 2, mode: "number" }),
  agreementProviderId: text("agreement_provider_id"),
  agreementSentAt: timestamp("agreement_sent_at", { withTimezone: true }),
  agreementSignedAt: timestamp("agreement_signed_at", { withTimezone: true }),
  holdExpiresAt: timestamp("hold_expires_at", { withTimezone: true }),
  publicToken: uuid("public_token").notNull().defaultRandom(),
  agreementVersion: text("agreement_version").notNull().default("RRR-2026-09-25-v1"),
  agreementSnapshot: text("agreement_snapshot"),
  agreementHash: text("agreement_hash"),
  signerName: text("signer_name"),
  signerIp: text("signer_ip"),
  signerUserAgent: text("signer_user_agent"),
  signerConsentAt: timestamp("signer_consent_at", { withTimezone: true }),
  notes: text("notes"),
  ...timestamps,
});

export const maintenancePeriodsTable = pgTable("maintenance_periods", {
  id: uuid("id").primaryKey().defaultRandom(),
  vehicleId: uuid("vehicle_id")
    .notNull()
    .references(() => vehiclesTable.id),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  reason: text("reason"),
  notes: text("notes"),
  ...timestamps,
});

export const rentalNotesTable = pgTable("rental_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  rentalId: uuid("rental_id")
    .notNull()
    .references(() => rentalsTable.id),
  note: text("note").notNull(),
  ...timestamps,
});

export type Vehicle = typeof vehiclesTable.$inferSelect;
export type Customer = typeof customersTable.$inferSelect;
export type Rental = typeof rentalsTable.$inferSelect;
export type MaintenancePeriod = typeof maintenancePeriodsTable.$inferSelect;
