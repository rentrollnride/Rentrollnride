import { createHmac, timingSafeEqual } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
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
const APPROVED_TRAVEL_AREA = "North Carolina, South Carolina, Virginia, and Washington, DC";

function signConfig() {
  return {
    apiKey: process.env.DROPBOX_SIGN_API_KEY?.trim() ?? "",
    templateId: process.env.DROPBOX_SIGN_TEMPLATE_ID?.trim() ?? "",
    clientId: process.env.DROPBOX_SIGN_CLIENT_ID?.trim() ?? "",
    testMode: process.env.DROPBOX_SIGN_TEST_MODE === "true",
  };
}

function signingEnabled() {
  const config = signConfig();
  return Boolean(config.apiKey && config.templateId);
}

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

async function sendAgreement(args: {
  rentalId: string;
  customer: { name: string; email: string; phone: string };
  vehicle: { year: number; make: string; model: string };
  pickupAt: Date;
  expectedReturnAt: Date;
  rateType: string;
  rate: number;
  deposit: number;
}) {
  const config = signConfig();
  if (!config.apiKey || !config.templateId) {
    throw new Error("Electronic signature is not configured.");
  }

  const payload: Record<string, unknown> = {
    template_ids: [config.templateId],
    subject: `Rent Ride Roll LLC rental agreement — ${args.vehicle.year} ${args.vehicle.make} ${args.vehicle.model}`,
    message: "Please review and sign your Rent Ride Roll LLC rental agreement to confirm your reservation. Payment and the refundable deposit are handled at pickup.",
    signers: [{
      role: "Renter",
      name: args.customer.name,
      email_address: args.customer.email,
    }],
    metadata: {
      rental_id: args.rentalId,
      renter_name: args.customer.name,
      renter_email: args.customer.email,
      renter_phone: args.customer.phone,
      vehicle: `${args.vehicle.year} ${args.vehicle.make} ${args.vehicle.model}`,
      pickup: dateLabel(args.pickupAt),
      return_at: dateLabel(args.expectedReturnAt),
      rate: `${money(args.rate)} ${args.rateType}`,
      deposit: money(args.deposit),
      approved_travel_area: APPROVED_TRAVEL_AREA,
    },
    test_mode: config.testMode,
  };
  if (config.clientId) payload.client_id = config.clientId;

  const response = await fetch("https://api.hellosign.com/v3/signature_request/send_with_template", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.apiKey}:`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });

  const data = await response.json() as {
    signature_request?: { signature_request_id?: string };
    error?: { error_msg?: string };
  };
  if (!response.ok || !data.signature_request?.signature_request_id) {
    const providerMessage = data.error?.error_msg || "";
    console.warn("Dropbox Sign send failed", {
      status: response.status,
      message: providerMessage,
      templateId: config.templateId,
      testMode: config.testMode,
    });
    if (/paid API plan|test_mode=1|api\/pricing/i.test(providerMessage)) {
      throw new Error("Electronic signature is temporarily unavailable. Please call or text us to complete your reservation.");
    }
    throw new Error("We could not send the rental agreement. Please try again or call/text us for help.");
  }
  return data.signature_request.signature_request_id;
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
    enabled: signingEnabled(),
    holdMinutes: HOLD_MINUTES,
    deposit: 300,
    approvedTravelArea: APPROVED_TRAVEL_AREA,
  });
});

router.post("/public/reservations", async (req, res): Promise<void> => {
  if (!signingEnabled()) {
    res.status(503).json({ error: "Online reservations are not available yet. Please call or text to reserve." });
    return;
  }

  const vehicleId = typeof req.body?.vehicleId === "string" ? req.body.vehicleId : "";
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = normalizeEmail(req.body?.email);
  const phone = normalizePhone(req.body?.phone);
  const pickupAt = new Date(req.body?.pickupAt);
  const expectedReturnAt = new Date(req.body?.expectedReturnAt);

  if (!vehicleId || name.length < 2 || !email.includes("@") || phone.length < 7 ||
      !Number.isFinite(pickupAt.getTime()) || !Number.isFinite(expectedReturnAt.getTime()) ||
      expectedReturnAt <= pickupAt || pickupAt.getTime() < Date.now() - 5 * 60_000) {
    res.status(400).json({ error: "Enter valid renter details and pickup/return dates." });
    return;
  }

  const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, vehicleId)).limit(1);
  if (!vehicle || vehicle.archived || !vehicle.detailsConfirmed) {
    res.status(404).json({ error: "This vehicle is not available for online reservation." });
    return;
  }

  const conflict = await reservationConflict(vehicle.id, pickupAt, expectedReturnAt);
  if (conflict) {
    res.status(409).json({ error: conflict });
    return;
  }

  const durationDays = Math.max(1, Math.ceil((expectedReturnAt.getTime() - pickupAt.getTime()) / 86_400_000));
  const rateType = durationDays >= 7 ? "weekly" : "daily";
  const rate = rateType === "weekly" ? vehicle.weeklyRate : vehicle.dailyRate;
  const holdExpiresAt = new Date(Date.now() + HOLD_MINUTES * 60_000);

  let customer = (await db.select().from(customersTable)
    .where(or(eq(customersTable.email, email), eq(customersTable.phone, phone)))
    .limit(1))[0];

  if (!customer) {
    [customer] = await db.insert(customersTable).values({ name, email, phone }).returning();
  } else {
    [customer] = await db.update(customersTable)
      .set({ name, email, phone })
      .where(eq(customersTable.id, customer.id))
      .returning();
  }

  const [rental] = await db.insert(rentalsTable).values({
    customerId: customer.id,
    vehicleId: vehicle.id,
    pickupAt,
    expectedReturnAt,
    rateType,
    rate,
    deposit: 300,
    depositStatus: "not_collected",
    status: "reserved",
    agreementStatus: "sending",
    holdExpiresAt,
    notes: "Created from public online reservation.",
  }).returning();

  try {
    const providerId = await sendAgreement({
      rentalId: rental.id,
      customer: { name: customer.name, email: customer.email ?? email, phone: customer.phone },
      vehicle,
      pickupAt,
      expectedReturnAt,
      rateType,
      rate,
      deposit: 300,
    });

    const [updated] = await db.update(rentalsTable).set({
      agreementStatus: "sent",
      agreementProviderId: providerId,
      agreementSentAt: new Date(),
    }).where(eq(rentalsTable.id, rental.id)).returning();

    res.status(201).json({
      id: updated.id,
      token: updated.publicToken,
      agreementStatus: updated.agreementStatus,
      holdExpiresAt: updated.holdExpiresAt?.toISOString() ?? null,
      message: "Reservation held. Check your email and sign the agreement to confirm it.",
    });
  } catch (error) {
    await db.delete(rentalsTable).where(eq(rentalsTable.id, rental.id));
    res.status(502).json({ error: error instanceof Error ? error.message : "Unable to send the rental agreement." });
  }
});

router.get("/public/reservations/:token", async (req, res): Promise<void> => {
  const token = req.params.token;
  const [rental] = await db.select({
    id: rentalsTable.id,
    agreementStatus: rentalsTable.agreementStatus,
    holdExpiresAt: rentalsTable.holdExpiresAt,
    agreementSignedAt: rentalsTable.agreementSignedAt,
    status: rentalsTable.status,
  }).from(rentalsTable).where(eq(rentalsTable.publicToken, token)).limit(1);

  if (!rental) {
    res.status(404).json({ error: "Reservation not found." });
    return;
  }

  const expired = rental.agreementStatus !== "signed" &&
    Boolean(rental.holdExpiresAt && rental.holdExpiresAt.getTime() <= Date.now());

  res.json({
    id: rental.id,
    agreementStatus: expired ? "expired" : rental.agreementStatus,
    signedAt: rental.agreementSignedAt?.toISOString() ?? null,
    holdExpiresAt: rental.holdExpiresAt?.toISOString() ?? null,
    status: expired ? "cancelled" : rental.status,
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
  }).from(rentalsTable);
  res.json(rows.map((row) => ({
    ...row,
    sentAt: row.sentAt?.toISOString() ?? null,
    signedAt: row.signedAt?.toISOString() ?? null,
    holdExpiresAt: row.holdExpiresAt?.toISOString() ?? null,
  })));
});

router.post("/rentals/:id/agreement/send", async (req, res): Promise<void> => {
  if (!signingEnabled()) {
    res.status(503).json({ error: "Dropbox Sign is not configured." });
    return;
  }

  const rows = await db.select({ rental: rentalsTable, customer: customersTable, vehicle: vehiclesTable })
    .from(rentalsTable)
    .innerJoin(customersTable, eq(rentalsTable.customerId, customersTable.id))
    .innerJoin(vehiclesTable, eq(rentalsTable.vehicleId, vehiclesTable.id))
    .where(eq(rentalsTable.id, req.params.id))
    .limit(1);
  const row = rows[0];
  if (!row) {
    res.status(404).json({ error: "Rental not found." });
    return;
  }
  if (!row.customer.email) {
    res.status(400).json({ error: "Add the customer's email before sending an agreement." });
    return;
  }
  if (row.rental.agreementStatus === "signed") {
    res.status(409).json({ error: "This agreement is already signed." });
    return;
  }

  try {
    const providerId = await sendAgreement({
      rentalId: row.rental.id,
      customer: { name: row.customer.name, email: row.customer.email, phone: row.customer.phone },
      vehicle: row.vehicle,
      pickupAt: row.rental.pickupAt,
      expectedReturnAt: row.rental.expectedReturnAt,
      rateType: row.rental.rateType,
      rate: row.rental.rate,
      deposit: row.rental.deposit,
    });
    const holdExpiresAt = row.rental.holdExpiresAt ?? new Date(Date.now() + HOLD_MINUTES * 60_000);
    await db.update(rentalsTable).set({
      agreementStatus: "sent",
      agreementProviderId: providerId,
      agreementSentAt: new Date(),
      holdExpiresAt,
    }).where(eq(rentalsTable.id, row.rental.id));
    res.json({ ok: true, agreementStatus: "sent" });
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : "Unable to send agreement." });
  }
});

function parseWebhookBody(req: Request) {
  const raw = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";
  if (!raw) {
    if (typeof req.body?.json === "string") return JSON.parse(req.body.json);
    return req.body;
  }
  const contentType = req.header("content-type") ?? "";
  if (contentType.includes("application/json")) return JSON.parse(raw);
  const match = raw.match(/name="json"\r?\n\r?\n([\s\S]*?)\r?\n--/);
  if (!match) throw new Error("Invalid callback payload.");
  return JSON.parse(match[1]);
}

router.post("/public/signature/webhook", async (req: Request, res: Response): Promise<void> => {
  const config = signConfig();
  if (!config.apiKey) {
    res.status(503).send("Signature verification is not configured.");
    return;
  }

  try {
    const payload = parseWebhookBody(req) as any;
    const event = payload?.event;
    const expected = createHmac("sha256", config.apiKey)
      .update(`${event?.event_time ?? ""}${event?.event_type ?? ""}`)
      .digest("hex");
    const received = String(event?.event_hash ?? "");
    if (expected.length !== received.length ||
        !timingSafeEqual(Buffer.from(expected), Buffer.from(received))) {
      res.status(401).send("Invalid signature.");
      return;
    }

    const rentalId = payload?.signature_request?.metadata?.rental_id;
    if (typeof rentalId === "string") {
      const type = String(event?.event_type ?? "");
      if (type === "signature_request_all_signed") {
        await db.update(rentalsTable).set({
          agreementStatus: "signed",
          agreementSignedAt: new Date(),
          holdExpiresAt: null,
        }).where(eq(rentalsTable.id, rentalId));
      } else if (type === "signature_request_declined") {
        await db.update(rentalsTable).set({
          agreementStatus: "declined",
          status: "cancelled",
        }).where(eq(rentalsTable.id, rentalId));
      } else if (type === "signature_request_canceled") {
        await db.update(rentalsTable).set({
          agreementStatus: "cancelled",
          status: "cancelled",
        }).where(eq(rentalsTable.id, rentalId));
      } else if (type === "signature_request_email_bounce") {
        await db.update(rentalsTable).set({ agreementStatus: "email_bounced" })
          .where(eq(rentalsTable.id, rentalId));
      }
    }

    res.status(200).type("text/plain").send("Hello API Event Received");
  } catch {
    res.status(400).send("Invalid callback.");
  }
});

export default router;
