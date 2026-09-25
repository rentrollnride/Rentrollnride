import { createHash } from "node:crypto";
import { Router, type IRouter } from "express";
import { and, eq, gt, isNull, lt, or } from "drizzle-orm";
import {
  db,
  customersTable,
  maintenancePeriodsTable,
  rentalsTable,
  vehiclesTable,
} from "@workspace/db";

const router: IRouter = Router();
const HOLD_MINUTES = 60;
const AGREEMENT_VERSION = "RRR-2026-09-25-v1";
const APPROVED_TRAVEL_AREA = "North Carolina, South Carolina, Virginia, and Washington, DC";
const SHORT_TERM_RENTAL_TAX_RATE = 0.08;
const MAX_ONLINE_RENTAL_DAYS = 7;

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function dateLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizePhone(value: unknown) {
  return typeof value === "string" ? value.replace(/[^0-9+]/g, "").trim() : "";
}

function ageOn(dateOfBirth: string, onDate: Date) {
  const dob = new Date(dateOfBirth + "T12:00:00Z");
  if (!Number.isFinite(dob.getTime())) return -1;
  let age = onDate.getUTCFullYear() - dob.getUTCFullYear();
  const beforeBirthday =
    onDate.getUTCMonth() < dob.getUTCMonth() ||
    (onDate.getUTCMonth() === dob.getUTCMonth() && onDate.getUTCDate() < dob.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

function agreementSnapshot(args: {
  customer: { name: string; email: string; phone: string; dateOfBirth: string };
  vehicle: { year: number; make: string; model: string };
  pickupAt: Date;
  expectedReturnAt: Date;
  rateType: string;
  rate: number;
  deposit: number;
  rentalDays: number;
  estimatedBaseTotal: number;
  estimatedTax: number;
  estimatedTotal: number;
}) {
  return [
    "RENT RIDE ROLL LLC",
    "VEHICLE RENTAL AGREEMENT & POLICY ACKNOWLEDGMENT",
    `Agreement version: ${AGREEMENT_VERSION}`,
    "",
    `Renter: ${args.customer.name}`,
    `Email: ${args.customer.email}`,
    `Phone: ${args.customer.phone}`,
    `Date of birth: ${args.customer.dateOfBirth}`,
    `Vehicle: ${args.vehicle.year} ${args.vehicle.make} ${args.vehicle.model}`,
    `Pickup: ${dateLabel(args.pickupAt)}`,
    `Scheduled return: ${dateLabel(args.expectedReturnAt)}`,
    `Rental rate: ${money(args.rate)} ${args.rateType}`,
    `Rental days: ${args.rentalDays}`,
    `Base rental total: ${money(args.estimatedBaseTotal)}`,
    `NC short-term motor vehicle rental tax (8%): ${money(args.estimatedTax)}`,
    `Total estimated rental price due at pickup: ${money(args.estimatedTotal)}`,
    `Refundable security deposit collected separately at pickup: ${money(args.deposit)}`,
    `Approved travel area: ${APPROVED_TRAVEL_AREA}`,
    "",
    "1. DRIVER ELIGIBILITY AND AUTHORIZED DRIVERS",
    "The renter must present a valid driver's license, current proof of insurance acceptable to Rent Ride Roll LLC, and an accepted debit or credit card before taking possession of the vehicle. Renters age 21 and older meet the standard age requirement. Renters ages 18 through 20 may be subject to an under-age fee disclosed before the rental is confirmed. Only drivers approved by Rent Ride Roll LLC may operate the vehicle. The renter remains responsible for the vehicle and the conduct of every authorized driver during the rental period.",
    "",
    "2. PAYMENT AND REFUNDABLE DEPOSIT",
    `Rental charges are due as agreed. A refundable ${money(args.deposit)} deposit is collected at pickup. The deposit may be applied, to the extent permitted by law and this Agreement, toward unpaid rental charges, tolls, citations, cleaning or smoking charges, damage, fuel, late-return charges, or other amounts properly due. Any remaining refundable balance will be returned or released in accordance with the Company's stated process and the payment provider's processing time.`,
    "",
    "3. TICKETS, CITATIONS, PARKING CHARGES, AND TOLLS",
    "The renter is responsible for tolls, parking charges, traffic or camera citations, impound charges, and similar third-party charges arising from possession or use of the vehicle during the rental period, except to the extent caused solely by the Company before the rental began. The Company will not add a separate administrative fee unless that fee was specifically disclosed and agreed to in writing before it was incurred.",
    "",
    "4. SMOKING, VAPING, AND CLEANING",
    "Smoking and vaping are prohibited in the vehicle. The renter is responsible for documented, reasonable cleaning, deodorizing, remediation, or restoration costs caused by smoking, vaping, excessive dirt, stains, odors, biohazards, pet-related damage, or other conditions beyond ordinary use. No flat smoking or cleaning fee will be charged unless its exact amount was clearly disclosed and agreed to before the rental.",
    "",
    "5. VEHICLE CONDITION AND DAMAGE",
    "The renter must return the vehicle in substantially the same condition in which it was received, ordinary wear excepted. Subject to applicable law and insurance coverage, the renter is responsible for documented direct loss of or damage to the vehicle occurring during the rental period, including reasonable repair, towing, and storage costs actually attributable to the incident. The renter must promptly report any accident, theft, vandalism, warning light, mechanical issue, or material damage and cooperate with reasonable incident and insurance documentation. Vehicle condition, mileage, and fuel level should be documented at pickup and return, and that condition record becomes part of this Agreement.",
    "",
    "6. DRUGS, ILLEGAL SUBSTANCES, CONTRABAND, AND UNLAWFUL USE",
    "The vehicle may not be used to transport, possess, conceal, manufacture, distribute, or facilitate the use or sale of illegal drugs, controlled substances, stolen property, or other illegal contraband. The vehicle may not be used in connection with criminal activity or for any unlawful purpose.",
    "",
    "7. WEAPONS",
    "Weapons may not be carried, stored, or transported in the vehicle in violation of applicable federal, state, or local law or any written Company policy disclosed before pickup. The renter is solely responsible for compliance with all laws regarding possession and transportation of any lawful weapon.",
    "",
    "8. APPROVED TRAVEL AREA",
    `Unless the Company gives prior written approval, the vehicle may be operated only within ${APPROVED_TRAVEL_AREA}. Travel outside this approved area requires advance written approval. Any additional charge or changed mileage term for approved travel outside this area must be stated in a written amendment accepted by the renter before that travel occurs. Unauthorized travel outside the approved area may constitute a breach of this Agreement.`,
    "",
    "9. PROHIBITED VEHICLE USE",
    "The vehicle may not be operated by an unauthorized or unlicensed driver; used while the driver is impaired by alcohol, drugs, or any substance that makes driving unsafe; used for racing, speed testing, towing or pushing another vehicle without approval, or off-road use inconsistent with the vehicle's intended use; overloaded beyond legal or manufacturer limits; subleased or re-rented; or intentionally operated in a manner that creates an unreasonable risk of damage, loss, or injury.",
    "",
    "10. FUEL, MILEAGE, LATE RETURN, AND EXTENSIONS",
    "The renter must comply with the fuel, mileage, pickup, and return terms disclosed for the rental. The vehicle must be returned by the scheduled return time unless the Company approves an extension. Extensions are not effective until approved by the Company. The renter is responsible for any properly disclosed late-return, excess-mileage, refueling, or related charges permitted under this Agreement and applicable law.",
    "",
    "11. INSURANCE AND FINANCIAL RESPONSIBILITY",
    "The renter must maintain the insurance required by the Company for the rental and is responsible for verifying coverage directly with the renter's insurer. Rent Ride Roll LLC does not represent that the renter's personal policy covers this rental. Nothing in this Agreement expands or reduces insurance coverage beyond the applicable policy terms or applicable law. Rent Ride Roll LLC does not sell insurance through this website.",
    "",
    "12. ACCIDENTS, BREAKDOWNS, IMPOUNDMENT, AND LAW ENFORCEMENT",
    "The renter must promptly notify the Company of any collision, theft, impoundment, law-enforcement contact involving the vehicle, or significant mechanical problem. The renter must not abandon the vehicle or authorize repairs, towing, or other material work without Company approval except where immediate action is reasonably necessary for safety or required by law.",
    "",
    "13. CANCELLATIONS, CHANGES, AND EARLY RETURNS",
    "Cancellation, date changes, early returns, refunds, and reservation holds are governed by the written terms disclosed for the specific rental. No cancellation window or refund is promised unless it is stated in writing by the Company.",
    "",
    "14. NO TRANSFER OR SUBLEASE",
    "The renter may not assign, transfer, sublease, re-rent, or otherwise give possession of the vehicle or this Agreement to another person without prior written approval from the Company.",
    "",
    "15. ELECTRONIC RECORDS AND SIGNATURE",
    "For this rental transaction, the renter may choose paper or electronic records. Before signing electronically, the renter may request a paper agreement or withdraw electronic consent without an electronic-processing fee by calling Rent Ride Roll LLC at (919) 356-5164. Electronic consent applies only to this rental transaction unless the renter separately agrees otherwise. After signing, the renter may print or save the agreement and may request a paper copy. To use electronic records, the renter needs internet access, a current web browser, and the ability to display and save or print the agreement. By checking the electronic-consent box and signing, the renter confirms the ability to access and retain the agreement.",
    "",
    "16. NORTH CAROLINA SCHOOL BUS NOTICE",
    "It is unlawful in North Carolina to pass a school bus that is stopped and receiving or discharging passengers. Rent Ride Roll LLC will also provide any placard or written notice required by North Carolina law at the pickup location.",
    "",
    "17. ENTIRE AGREEMENT; CONTROLLING TERMS",
    "This document, together with any vehicle-condition report, rate disclosure, approved extension, and other written rental terms provided by the Company, constitutes the rental agreement between the parties. If any provision is found unenforceable, the remaining provisions remain in effect to the extent permitted by law.",
    "",
    "RENTER ACKNOWLEDGMENT",
    "By electronically signing, the renter acknowledges reviewing the rental information and policies above, having an opportunity to ask questions, and agreeing to comply with this Agreement.",
  ].join("\n");
}

async function reservationConflict(vehicleId: string, pickupAt: Date, expectedReturnAt: Date) {
  const now = new Date();
  const [rental] = await db
    .select({ id: rentalsTable.id })
    .from(rentalsTable)
    .where(and(
      eq(rentalsTable.vehicleId, vehicleId),
      lt(rentalsTable.pickupAt, expectedReturnAt),
      gt(rentalsTable.expectedReturnAt, pickupAt),
      or(
        eq(rentalsTable.status, "out"),
        and(
          eq(rentalsTable.status, "reserved"),
          or(isNull(rentalsTable.holdExpiresAt), gt(rentalsTable.holdExpiresAt, now)),
        ),
      ),
    ))
    .limit(1);
  if (rental) return "Those dates conflict with an existing reservation.";

  const [maintenance] = await db
    .select({ id: maintenancePeriodsTable.id })
    .from(maintenancePeriodsTable)
    .where(and(
      eq(maintenancePeriodsTable.vehicleId, vehicleId),
      lt(maintenancePeriodsTable.startAt, expectedReturnAt),
      gt(maintenancePeriodsTable.endAt, pickupAt),
    ))
    .limit(1);
  if (maintenance) return "That vehicle is unavailable during part of those dates.";
  return null;
}

router.get("/public/reservation-config", (_req, res): void => {
  res.json({
    enabled: true,
    signingMode: "native",
    holdMinutes: HOLD_MINUTES,
    deposit: 300,
    approvedTravelArea: APPROVED_TRAVEL_AREA,
  });
});

router.post("/public/reservations", async (req, res): Promise<void> => {
  const vehicleId = typeof req.body?.vehicleId === "string" ? req.body.vehicleId : "";
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = normalizeEmail(req.body?.email);
  const phone = normalizePhone(req.body?.phone);
  const dateOfBirth = typeof req.body?.dateOfBirth === "string" ? req.body.dateOfBirth.trim() : "";
  const pickupAt = new Date(req.body?.pickupAt);
  const expectedReturnAt = new Date(req.body?.expectedReturnAt);

  if (!vehicleId || name.length < 2 || !email.includes("@") || phone.length < 7 || !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) ||
      !Number.isFinite(pickupAt.getTime()) || !Number.isFinite(expectedReturnAt.getTime()) ||
      expectedReturnAt <= pickupAt || pickupAt.getTime() < Date.now() - 5 * 60_000) {
    res.status(400).json({ error: "Enter valid renter details and pickup/return dates." });
    return;
  }

  const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, vehicleId)).limit(1);
  if (!vehicle || vehicle.archived || !vehicle.detailsConfirmed || vehicle.status === "maintenance") {
    res.status(404).json({ error: "This vehicle is not available for online reservation." });
    return;
  }

  const renterAge = ageOn(dateOfBirth, pickupAt);
  if (renterAge < 18) {
    res.status(400).json({ error: "Renter must be at least 18 years old on the pickup date." });
    return;
  }
  if (renterAge < 21) {
    res.status(409).json({ error: "Online booking for ages 18–20 is temporarily unavailable until the under-age fee is configured. Please call or text us." });
    return;
  }

  const conflict = await reservationConflict(vehicle.id, pickupAt, expectedReturnAt);
  if (conflict) {
    res.status(409).json({ error: conflict });
    return;
  }

  const durationDays = Math.max(1, Math.ceil((expectedReturnAt.getTime() - pickupAt.getTime()) / 86_400_000));
  if (durationDays > MAX_ONLINE_RENTAL_DAYS) {
    res.status(409).json({ error: "Online reservations are currently limited to 7 days until extended-rental pricing is configured. Please call or text us for a longer rental." });
    return;
  }
  const rateType = durationDays === 7 ? "weekly" : "daily";
  const rate = rateType === "weekly" ? vehicle.weeklyRate : vehicle.dailyRate;
  const estimatedBaseTotal = rateType === "weekly" ? vehicle.weeklyRate : vehicle.dailyRate * durationDays;
  const estimatedTax = Math.round(estimatedBaseTotal * SHORT_TERM_RENTAL_TAX_RATE * 100) / 100;
  const estimatedTotal = Math.round((estimatedBaseTotal + estimatedTax) * 100) / 100;
  const holdExpiresAt = new Date(Date.now() + HOLD_MINUTES * 60_000);

  let customer = (await db.select().from(customersTable)
    .where(or(eq(customersTable.email, email), eq(customersTable.phone, phone)))
    .limit(1))[0];

  if (!customer) {
    [customer] = await db.insert(customersTable).values({ name, email, phone, dateOfBirth }).returning();
  } else {
    [customer] = await db.update(customersTable)
      .set({ name, email, phone, dateOfBirth })
      .where(eq(customersTable.id, customer.id))
      .returning();
  }

  const snapshot = agreementSnapshot({
    customer: { name: customer.name, email: customer.email ?? email, phone: customer.phone, dateOfBirth },
    vehicle,
    pickupAt,
    expectedReturnAt,
    rateType,
    rate,
    deposit: 300,
    rentalDays: durationDays,
    estimatedBaseTotal,
    estimatedTax,
    estimatedTotal,
  });
  const hash = createHash("sha256").update(snapshot).digest("hex");

  const [rental] = await db.insert(rentalsTable).values({
    customerId: customer.id,
    vehicleId: vehicle.id,
    pickupAt,
    expectedReturnAt,
    rateType,
    rate,
    deposit: 300,
    rentalDays: durationDays,
    estimatedBaseTotal,
    estimatedTax,
    estimatedTotal,
    depositStatus: "not_collected",
    status: "reserved",
    agreementStatus: "pending_signature",
    agreementVersion: AGREEMENT_VERSION,
    agreementSnapshot: snapshot,
    agreementHash: hash,
    holdExpiresAt,
    notes: "Created from public online reservation; native electronic signature required.",
  }).returning();

  res.status(201).json({
    id: rental.id,
    token: rental.publicToken,
    agreementStatus: rental.agreementStatus,
    holdExpiresAt: rental.holdExpiresAt?.toISOString() ?? null,
    signingUrl: `/sign/${rental.publicToken}`,
    message: "Reservation held. Review and sign the agreement to confirm it.",
  });
});

router.get("/public/reservations/:token", async (req, res): Promise<void> => {
  const rows = await db
    .select({ rental: rentalsTable, customer: customersTable, vehicle: vehiclesTable })
    .from(rentalsTable)
    .innerJoin(customersTable, eq(rentalsTable.customerId, customersTable.id))
    .innerJoin(vehiclesTable, eq(rentalsTable.vehicleId, vehiclesTable.id))
    .where(eq(rentalsTable.publicToken, req.params.token))
    .limit(1);
  const row = rows[0];

  if (!row) {
    res.status(404).json({ error: "Reservation not found." });
    return;
  }

  const expired = row.rental.agreementStatus !== "signed" &&
    Boolean(row.rental.holdExpiresAt && row.rental.holdExpiresAt.getTime() <= Date.now());

  res.json({
    id: row.rental.id,
    agreementStatus: expired ? "expired" : row.rental.agreementStatus,
    signedAt: row.rental.agreementSignedAt?.toISOString() ?? null,
    holdExpiresAt: row.rental.holdExpiresAt?.toISOString() ?? null,
    status: expired ? "cancelled" : row.rental.status,
    agreementVersion: row.rental.agreementVersion,
    agreementHash: row.rental.agreementHash,
    agreementText: row.rental.agreementSnapshot,
    renter: {
      name: row.customer.name,
      email: row.customer.email,
      phone: row.customer.phone,
    },
    vehicle: {
      year: row.vehicle.year,
      make: row.vehicle.make,
      model: row.vehicle.model,
    },
    pickupAt: row.rental.pickupAt.toISOString(),
    expectedReturnAt: row.rental.expectedReturnAt.toISOString(),
    rateType: row.rental.rateType,
    rate: row.rental.rate,
    deposit: row.rental.deposit,
    rentalDays: row.rental.rentalDays,
    estimatedBaseTotal: row.rental.estimatedBaseTotal,
    estimatedTax: row.rental.estimatedTax,
    estimatedTotal: row.rental.estimatedTotal,
    approvedTravelArea: APPROVED_TRAVEL_AREA,
    electronicRecordDisclosure: {
      paperOption: "You may request a paper agreement before signing.",
      withdrawBeforeSigning: "You may withdraw electronic consent before signing without an electronic-processing fee by calling (919) 356-5164.",
      scope: "Electronic consent applies only to this rental transaction unless separately agreed otherwise.",
      copies: "You may print or save the agreement and may request a paper copy after signing.",
      requirements: "Internet access, a current web browser, and the ability to display and save or print this agreement.",
    },
  });
});

router.post("/public/reservations/:token/sign", async (req, res): Promise<void> => {
  const rows = await db
    .select({ rental: rentalsTable, customer: customersTable })
    .from(rentalsTable)
    .innerJoin(customersTable, eq(rentalsTable.customerId, customersTable.id))
    .where(eq(rentalsTable.publicToken, req.params.token))
    .limit(1);
  const row = rows[0];

  if (!row) {
    res.status(404).json({ error: "Reservation not found." });
    return;
  }
  if (row.rental.agreementStatus === "signed") {
    res.json({ ok: true, agreementStatus: "signed", signedAt: row.rental.agreementSignedAt?.toISOString() ?? null });
    return;
  }
  if (row.rental.holdExpiresAt && row.rental.holdExpiresAt.getTime() <= Date.now()) {
    await db.update(rentalsTable)
      .set({ status: "cancelled", agreementStatus: "expired" })
      .where(eq(rentalsTable.id, row.rental.id));
    res.status(410).json({ error: "This reservation hold expired. Please start a new reservation." });
    return;
  }

  const signerName = typeof req.body?.signerName === "string" ? req.body.signerName.trim() : "";
  const consent = req.body?.consent === true;
  const electronicConsent = req.body?.electronicConsent === true;
  if (signerName.length < 2 || !consent || !electronicConsent) {
    res.status(400).json({ error: "Enter your full legal name and accept both signature acknowledgments." });
    return;
  }
  if (signerName.localeCompare(row.customer.name, undefined, { sensitivity: "base" }) !== 0) {
    res.status(400).json({ error: "The signer name must match the renter name on the reservation." });
    return;
  }

  const signedAt = new Date();
  const forwarded = req.header("x-forwarded-for");
  const signerIp = forwarded?.split(",")[0]?.trim() || req.ip || null;
  const signerUserAgent = req.header("user-agent")?.slice(0, 1000) || null;

  await db.update(rentalsTable).set({
    agreementStatus: "signed",
    agreementSignedAt: signedAt,
    signerConsentAt: signedAt,
    signerName,
    signerIp,
    signerUserAgent,
    holdExpiresAt: null,
    agreementProviderId: null,
  }).where(eq(rentalsTable.id, row.rental.id));

  res.json({
    ok: true,
    agreementStatus: "signed",
    signedAt: signedAt.toISOString(),
    agreementHash: row.rental.agreementHash,
  });
});

router.get("/agreements", async (_req, res): Promise<void> => {
  const rows = await db.select({
    rentalId: rentalsTable.id,
    agreementStatus: rentalsTable.agreementStatus,
    providerId: rentalsTable.agreementProviderId,
    sentAt: rentalsTable.agreementSentAt,
    signedAt: rentalsTable.agreementSignedAt,
    holdExpiresAt: rentalsTable.holdExpiresAt,
    signerName: rentalsTable.signerName,
    agreementVersion: rentalsTable.agreementVersion,
    agreementHash: rentalsTable.agreementHash,
    publicToken: rentalsTable.publicToken,
  }).from(rentalsTable);
  res.json(rows.map((row) => ({
    ...row,
    sentAt: row.sentAt?.toISOString() ?? null,
    signedAt: row.signedAt?.toISOString() ?? null,
    holdExpiresAt: row.holdExpiresAt?.toISOString() ?? null,
    signingUrl: `/sign/${row.publicToken}`,
  })));
});

router.post("/rentals/:id/agreement/send", async (req, res): Promise<void> => {
  const [rental] = await db.select().from(rentalsTable).where(eq(rentalsTable.id, req.params.id)).limit(1);
  if (!rental) {
    res.status(404).json({ error: "Rental not found." });
    return;
  }
  if (rental.agreementStatus === "signed") {
    res.status(409).json({ error: "This agreement is already signed." });
    return;
  }
  const holdExpiresAt = rental.holdExpiresAt ?? new Date(Date.now() + HOLD_MINUTES * 60_000);
  await db.update(rentalsTable).set({
    agreementStatus: "pending_signature",
    holdExpiresAt,
  }).where(eq(rentalsTable.id, rental.id));

  res.json({
    ok: true,
    agreementStatus: "pending_signature",
    signingUrl: `/sign/${rental.publicToken}`,
  });
});

export default router;
