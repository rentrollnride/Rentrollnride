import { Router, type IRouter, type Response } from "express";
import { and, asc, eq, gt, inArray, isNull, lt, lte, ne, notInArray, or, sql } from "drizzle-orm";
import {
  db,
  customersTable,
  maintenancePeriodsTable,
  rentalsTable,
  vehiclesTable,
  type Rental,
  type Vehicle,
} from "@workspace/db";
import {
  ArchiveVehicleParams,
  ArchiveVehicleResponse,
  CreateCustomerBody,
  CreateCustomerResponse,
  CreateMaintenanceBody,
  CreateMaintenanceResponse,
  CreateRentalBody,
  CreateRentalResponse,
  CreateVehicleBody,
  CreateVehicleResponse,
  ExtendRentalBody,
  ExtendRentalParams,
  ExtendRentalResponse,
  GetCustomerParams,
  GetCustomerResponse,
  GetDashboardResponse,
  GetPublicVehiclesResponse,
  ListCustomersResponse,
  ListMaintenanceResponse,
  ListRentalsResponse,
  ListVehiclesResponse,
  UpdateRentalStatusBody,
  UpdateRentalStatusParams,
  UpdateRentalStatusResponse,
  UpdateCustomerBody,
  UpdateCustomerParams,
  UpdateCustomerResponse,
  UpdateMaintenanceBody,
  UpdateMaintenanceParams,
  UpdateMaintenanceResponse,
  DeleteMaintenanceParams,
  UpdateVehicleBody,
  UpdateVehicleParams,
  UpdateVehicleResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const ACTIVE_STATUSES = ["reserved", "out"];
// These three fixed IDs belong to the preloaded example rentals, not actual
// business activity. Exclude them from every operational read until the
// production records can be removed with authenticated database access.
const EXAMPLE_RENTAL_IDS = [
  "30000000-0000-4000-8000-000000000001",
  "30000000-0000-4000-8000-000000000002",
  "30000000-0000-4000-8000-000000000003",
];
const EXAMPLE_CUSTOMER_IDS = [
  "20000000-0000-4000-8000-000000000001",
  "20000000-0000-4000-8000-000000000002",
  "20000000-0000-4000-8000-000000000003",
];

class FleetHttpError extends Error {
  constructor(
    readonly status: 400 | 404 | 409,
    message: string,
  ) {
    super(message);
  }
}

function sendFleetError(res: Response, error: unknown): boolean {
  if (!(error instanceof FleetHttpError)) return false;
  res.status(error.status).json({ error: error.message });
  return true;
}

function easternDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function computedStatus(rental: Rental): string {
  if (rental.status === "returned" || rental.status === "cancelled") {
    return rental.status;
  }
  const now = new Date();
  if (rental.status === "reserved") {
    if (rental.holdExpiresAt && rental.holdExpiresAt.getTime() <= now.getTime() && rental.agreementStatus !== "signed") {
      return "cancelled";
    }
    return rental.pickupAt.getTime() < now.getTime() ? "missed_pickup" : "reserved";
  }
  if (rental.expectedReturnAt.getTime() < now.getTime()) return "overdue";
  if (easternDateKey(rental.expectedReturnAt) === easternDateKey(now)) {
    return "due_today";
  }
  return rental.status;
}

const UNVERIFIED_FLEET_IDS = new Set([
  "10000000-0000-4000-8000-000000000004",
  "10000000-0000-4000-8000-000000000005",
]);

function detailsPending(vehicle: Vehicle): boolean {
  // Keep the seeded vehicle records; a name edit must not expose unverified
  // sample specifications. These stable IDs exist in both environments.
  return UNVERIFIED_FLEET_IDS.has(vehicle.id) && !vehicle.detailsConfirmed;
}

function publicVehicle(vehicle: Vehicle) {
  const pending = detailsPending(vehicle);
  return {
    id: vehicle.id,
    name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    vehicleClass: pending ? null : vehicle.vehicleClass,
    capacity: pending ? null : vehicle.capacity,
    transmission: pending ? null : vehicle.transmission,
    features: pending ? [] : vehicle.features,
    dailyRate: pending ? null : vehicle.dailyRate,
    weeklyRate: pending ? null : vehicle.weeklyRate,
    imageUrl: pending ? "" : vehicle.imageUrl,
    status: pending ? "details_pending" as const : vehicle.status as "available" | "out" | "maintenance",
    detailsPending: pending,
  };
}

function adminVehicle(vehicle: Vehicle) {
  const pending = detailsPending(vehicle);
  return {
    ...publicVehicle(vehicle),
    unitNumber: pending ? null : vehicle.unitNumber,
    licensePlate: pending ? null : vehicle.licensePlate,
    vin: pending ? null : vehicle.vin,
    notes: pending ? null : vehicle.notes,
    archived: vehicle.archived,
  };
}

async function hydratedRentals() {
  const rows = await db
    .select({ rental: rentalsTable, customer: customersTable, vehicle: vehiclesTable })
    .from(rentalsTable)
    .innerJoin(customersTable, eq(rentalsTable.customerId, customersTable.id))
    .innerJoin(vehiclesTable, eq(rentalsTable.vehicleId, vehiclesTable.id))
    .where(notInArray(rentalsTable.id, EXAMPLE_RENTAL_IDS))
    .orderBy(asc(rentalsTable.expectedReturnAt));

  return rows.map(({ rental, customer, vehicle }) => ({
    id: rental.id,
    customerId: customer.id,
    customerName: customer.name,
    customerPhone: customer.phone,
    vehicleId: vehicle.id,
    vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    pickupAt: rental.pickupAt.toISOString(),
    expectedReturnAt: rental.expectedReturnAt.toISOString(),
    actualReturnAt: rental.actualReturnAt?.toISOString() ?? null,
    rateType: rental.rateType as "daily" | "weekly" | "custom",
    rate: rental.rate,
    deposit: rental.deposit,
    depositStatus: rental.depositStatus as
      | "not_collected"
      | "collected"
      | "returned"
      | "partially_returned"
      | "kept",
    status: computedStatus(rental) as
      | "reserved"
      | "missed_pickup"
      | "out"
      | "due_today"
      | "overdue"
      | "returned"
      | "cancelled",
    notes: rental.notes,
  }));
}

async function conflictFor(
  executor: { select: typeof db.select },
  vehicleId: string,
  startAt: Date,
  endAt: Date,
  excludeRentalId?: string,
  excludeMaintenanceId?: string,
) {
  const now = new Date();
  const rentalConditions = [
    eq(rentalsTable.vehicleId, vehicleId),
    notInArray(rentalsTable.id, EXAMPLE_RENTAL_IDS),
    inArray(rentalsTable.status, ACTIVE_STATUSES),
    lt(rentalsTable.pickupAt, endAt),
    gt(rentalsTable.expectedReturnAt, startAt),
    or(
      eq(rentalsTable.status, "out"),
      and(
        eq(rentalsTable.status, "reserved"),
        or(isNull(rentalsTable.holdExpiresAt), gt(rentalsTable.holdExpiresAt, now)),
      ),
    ),
  ];
  if (excludeRentalId) rentalConditions.push(ne(rentalsTable.id, excludeRentalId));

  const [rentalConflict] = await executor
    .select()
    .from(rentalsTable)
    .where(and(...rentalConditions))
    .limit(1);
  if (rentalConflict) {
    return `Conflicts with an existing rental ending ${rentalConflict.expectedReturnAt.toLocaleString()}.`;
  }

  const maintenanceConditions = [
    eq(maintenancePeriodsTable.vehicleId, vehicleId),
    lt(maintenancePeriodsTable.startAt, endAt),
    gt(maintenancePeriodsTable.endAt, startAt),
  ];
  if (excludeMaintenanceId) maintenanceConditions.push(ne(maintenancePeriodsTable.id, excludeMaintenanceId));
  const [maintenanceConflict] = await executor
    .select()
    .from(maintenancePeriodsTable)
    .where(and(...maintenanceConditions))
    .limit(1);
  if (maintenanceConflict) {
    return `Conflicts with maintenance ending ${maintenanceConflict.endAt.toLocaleString()}.`;
  }
  return null;
}

async function lockVehicle(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], vehicleId: string) {
  // hashtextextended provides a stable 64-bit lock key shared by every server instance.
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${vehicleId}, 0))`);
}

async function reconcileVehicleStatus(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  vehicleId: string,
  now = new Date(),
): Promise<void> {
  const [outRental] = await tx
    .select({ id: rentalsTable.id })
    .from(rentalsTable)
    .where(and(eq(rentalsTable.vehicleId, vehicleId), eq(rentalsTable.status, "out"), notInArray(rentalsTable.id, EXAMPLE_RENTAL_IDS)))
    .limit(1);
  const [currentMaintenance] = await tx
    .select({ id: maintenancePeriodsTable.id })
    .from(maintenancePeriodsTable)
    .where(
      and(
        eq(maintenancePeriodsTable.vehicleId, vehicleId),
        lte(maintenancePeriodsTable.startAt, now),
        gt(maintenancePeriodsTable.endAt, now),
      ),
    )
    .limit(1);
  const status = outRental ? "out" : currentMaintenance ? "maintenance" : "available";
  await tx.update(vehiclesTable).set({ status }).where(eq(vehiclesTable.id, vehicleId));
}

async function currentVehicleStatuses(vehicles: Vehicle[]): Promise<Vehicle[]> {
  if (vehicles.length === 0) return vehicles;
  const now = new Date();
  const vehicleIds = vehicles.map((vehicle) => vehicle.id);
  const outRows = await db
    .select({ vehicleId: rentalsTable.vehicleId })
    .from(rentalsTable)
    .where(and(inArray(rentalsTable.vehicleId, vehicleIds), eq(rentalsTable.status, "out"), notInArray(rentalsTable.id, EXAMPLE_RENTAL_IDS)));
  const maintenanceRows = await db
    .select({ vehicleId: maintenancePeriodsTable.vehicleId })
    .from(maintenancePeriodsTable)
    .where(
      and(
        inArray(maintenancePeriodsTable.vehicleId, vehicleIds),
        lte(maintenancePeriodsTable.startAt, now),
        gt(maintenancePeriodsTable.endAt, now),
      ),
    );
  const outIds = new Set(outRows.map((row) => row.vehicleId));
  const maintenanceIds = new Set(maintenanceRows.map((row) => row.vehicleId));
  return vehicles.map((vehicle) => ({
    ...vehicle,
    status: outIds.has(vehicle.id)
      ? "out"
      : maintenanceIds.has(vehicle.id)
        ? "maintenance"
        : "available",
  }));
}

router.get("/public/vehicles", async (_req, res): Promise<void> => {
  const vehicles = await currentVehicleStatuses(await db
    .select()
    .from(vehiclesTable)
    .where(eq(vehiclesTable.archived, false))
    .orderBy(asc(vehiclesTable.year)));
  res.json(GetPublicVehiclesResponse.parse(vehicles.map(publicVehicle)));
});

router.get("/dashboard", async (_req, res): Promise<void> => {
  const vehicles = await currentVehicleStatuses(
    await db.select().from(vehiclesTable).where(eq(vehiclesTable.archived, false)),
  );
  const rentals = await hydratedRentals();
  const actionable = rentals
    .filter((r) => ["reserved", "missed_pickup", "out", "due_today", "overdue"].includes(r.status))
    .sort((a, b) => (a.status === "overdue" ? -1 : b.status === "overdue" ? 1 : 0));
  res.json(
    GetDashboardResponse.parse({
      totalVehicles: vehicles.length,
      available: vehicles.filter((v) => v.status === "available" && !detailsPending(v)).length,
      out: vehicles.filter((v) => v.status === "out").length,
      dueToday: rentals.filter((r) => r.status === "due_today").length,
      overdue: rentals.filter((r) => r.status === "overdue").length,
      rentals: actionable,
    }),
  );
});

router.get("/vehicles", async (_req, res): Promise<void> => {
  const vehicles = await currentVehicleStatuses(
    await db.select().from(vehiclesTable).orderBy(asc(vehiclesTable.year)),
  );
  res.json(ListVehiclesResponse.parse(vehicles.map(adminVehicle)));
});

router.post("/vehicles", async (req, res): Promise<void> => {
  const parsed = CreateVehicleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [vehicle] = await db
    .insert(vehiclesTable)
    .values({
      ...parsed.data,
      imageUrl: parsed.data.imageUrl || "",
      transmission: parsed.data.transmission,
      features: parsed.data.features ?? [],
      detailsConfirmed: true,
    })
    .returning();
  res.status(201).json(CreateVehicleResponse.parse(adminVehicle(vehicle)));
});

router.patch("/vehicles/:id", async (req, res): Promise<void> => {
  const params = UpdateVehicleParams.safeParse(req.params);
  const body = UpdateVehicleBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid vehicle update." });
    return;
  }
  let vehicle: Vehicle;
  try {
    vehicle = await db.transaction(async (tx) => {
      await lockVehicle(tx, params.data.id);
      const [current] = await tx.select().from(vehiclesTable).where(eq(vehiclesTable.id, params.data.id));
      if (!current) throw new FleetHttpError(404, "Vehicle not found.");

      if (detailsPending(current) && body.data.detailsConfirmed === true) {
        const required = CreateVehicleBody.safeParse(body.data);
        if (!required.success ||
            !body.data.transmission?.trim() ||
            !body.data.vehicleClass?.trim() ||
            !body.data.unitNumber?.trim() ||
            !body.data.licensePlate?.trim() ||
            !body.data.dailyRate ||
            !body.data.weeklyRate) {
          throw new FleetHttpError(400, "Enter and confirm all vehicle details, including rates and transmission, before publishing.");
        }
      }

      if (body.data.archived === true) {
        const now = new Date();
        const [rental] = await tx
          .select({ id: rentalsTable.id })
          .from(rentalsTable)
          .where(
            and(
              eq(rentalsTable.vehicleId, current.id),
              notInArray(rentalsTable.id, EXAMPLE_RENTAL_IDS),
              inArray(rentalsTable.status, ACTIVE_STATUSES),
              or(
                eq(rentalsTable.status, "out"),
                and(eq(rentalsTable.status, "reserved"), gt(rentalsTable.expectedReturnAt, now)),
              ),
            ),
          )
          .limit(1);
        const [maintenance] = await tx
          .select({ id: maintenancePeriodsTable.id })
          .from(maintenancePeriodsTable)
          .where(and(eq(maintenancePeriodsTable.vehicleId, current.id), gt(maintenancePeriodsTable.endAt, now)))
          .limit(1);
        if (rental || maintenance) {
          throw new FleetHttpError(409, "Vehicle cannot be archived while it has an active or upcoming rental or maintenance.");
        }
      }

      const now = new Date();
      await reconcileVehicleStatus(tx, current.id, now);
      const [statusSource] = await tx
        .select({ status: vehiclesTable.status })
        .from(vehiclesTable)
        .where(eq(vehiclesTable.id, current.id));
      if (body.data.status !== undefined && body.data.status !== statusSource.status) {
        throw new FleetHttpError(
          409,
          `Vehicle status is derived from current rentals and maintenance (currently ${statusSource.status}). Check out or return the rental, or create a maintenance period to change it.`,
        );
      }

      const { status: _submittedStatus, ...vehicleUpdates } = body.data;
      const [updated] = await tx
        .update(vehiclesTable)
        .set(vehicleUpdates)
        .where(eq(vehiclesTable.id, current.id))
        .returning();
      return updated;
    });
  } catch (error) {
    if (sendFleetError(res, error)) return;
    throw error;
  }
  res.json(UpdateVehicleResponse.parse(adminVehicle(vehicle)));
});

router.post("/vehicles/:id/archive", async (req, res): Promise<void> => {
  const params = ArchiveVehicleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid vehicle." });
    return;
  }
  let vehicle: Vehicle;
  try {
    vehicle = await db.transaction(async (tx) => {
      await lockVehicle(tx, params.data.id);
      const [current] = await tx.select().from(vehiclesTable).where(eq(vehiclesTable.id, params.data.id));
      if (!current) throw new FleetHttpError(404, "Vehicle not found.");
      const now = new Date();
      const [rental] = await tx
        .select({ id: rentalsTable.id })
        .from(rentalsTable)
        .where(
          and(
            eq(rentalsTable.vehicleId, current.id),
            notInArray(rentalsTable.id, EXAMPLE_RENTAL_IDS),
            inArray(rentalsTable.status, ACTIVE_STATUSES),
            or(
              eq(rentalsTable.status, "out"),
              and(eq(rentalsTable.status, "reserved"), gt(rentalsTable.expectedReturnAt, now)),
            ),
          ),
        )
        .limit(1);
      const [maintenance] = await tx
        .select({ id: maintenancePeriodsTable.id })
        .from(maintenancePeriodsTable)
        .where(and(eq(maintenancePeriodsTable.vehicleId, current.id), gt(maintenancePeriodsTable.endAt, now)))
        .limit(1);
      if (rental || maintenance) {
        throw new FleetHttpError(409, "Vehicle cannot be archived while it has an active or upcoming rental or maintenance.");
      }
      const [updated] = await tx
        .update(vehiclesTable)
        .set({ archived: true })
        .where(eq(vehiclesTable.id, current.id))
        .returning();
      return updated;
    });
  } catch (error) {
    if (sendFleetError(res, error)) return;
    throw error;
  }
  res.json(ArchiveVehicleResponse.parse(adminVehicle(vehicle)));
});

router.get("/customers", async (_req, res): Promise<void> => {
  const customers = await db.select().from(customersTable)
    .where(notInArray(customersTable.id, EXAMPLE_CUSTOMER_IDS))
    .orderBy(asc(customersTable.name));
  res.json(
    ListCustomersResponse.parse(
      customers.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })),
    ),
  );
});

router.post("/customers", async (req, res): Promise<void> => {
  const parsed = CreateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [customer] = await db.insert(customersTable).values(parsed.data).returning();
  res.status(201).json(
    CreateCustomerResponse.parse({ ...customer, createdAt: customer.createdAt.toISOString() }),
  );
});

router.get("/customers/:id", async (req, res): Promise<void> => {
  const params = GetCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid customer." });
    return;
  }
  if (EXAMPLE_CUSTOMER_IDS.includes(params.data.id)) {
    res.status(404).json({ error: "Customer not found." });
    return;
  }
  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, params.data.id));
  if (!customer) {
    res.status(404).json({ error: "Customer not found." });
    return;
  }
  const rentalHistory = (await hydratedRentals()).filter((r) => r.customerId === customer.id);
  res.json(
    GetCustomerResponse.parse({
      ...customer,
      createdAt: customer.createdAt.toISOString(),
      currentRental: rentalHistory.find((r) => ["reserved", "missed_pickup", "out", "due_today", "overdue"].includes(r.status)) ?? null,
      rentalHistory,
    }),
  );
});

router.patch("/customers/:id", async (req, res): Promise<void> => {
  const params = UpdateCustomerParams.safeParse(req.params);
  const body = UpdateCustomerBody.safeParse(req.body);
  if (!params.success || !body.success || EXAMPLE_CUSTOMER_IDS.includes(params.data.id)) {
    res.status(params.success && body.success ? 404 : 400).json({ error: params.success && body.success ? "Customer not found." : "Invalid customer update." });
    return;
  }
  const [customer] = await db.update(customersTable).set(body.data).where(eq(customersTable.id, params.data.id)).returning();
  if (!customer) {
    res.status(404).json({ error: "Customer not found." });
    return;
  }
  res.json(UpdateCustomerResponse.parse({
    id: customer.id, name: customer.name, phone: customer.phone,
    email: customer.email, notes: customer.notes, createdAt: customer.createdAt.toISOString(),
  }));
});

router.get("/rentals", async (_req, res): Promise<void> => {
  res.json(ListRentalsResponse.parse(await hydratedRentals()));
});

router.post("/rentals", async (req, res): Promise<void> => {
  const parsed = CreateRentalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (EXAMPLE_CUSTOMER_IDS.includes(parsed.data.customerId)) {
    res.status(404).json({ error: "Customer not found." });
    return;
  }
  const pickupAt = new Date(parsed.data.pickupAt);
  const expectedReturnAt = new Date(parsed.data.expectedReturnAt);
  if (!Number.isFinite(pickupAt.getTime()) || !Number.isFinite(expectedReturnAt.getTime()) || expectedReturnAt <= pickupAt) {
    res.status(400).json({ error: "Expected return must be after pickup." });
    return;
  }
  if (parsed.data.deposit !== 300) {
    res.status(400).json({ error: "New rentals require the standard $300 deposit." });
    return;
  }
  if (parsed.data.depositStatus !== "not_collected") {
    res.status(400).json({ error: "A new rental deposit must remain not collected until pickup." });
    return;
  }
  let rental: Rental;
  try {
    rental = await db.transaction(async (tx) => {
      await lockVehicle(tx, parsed.data.vehicleId);
      const [vehicle] = await tx.select().from(vehiclesTable).where(eq(vehiclesTable.id, parsed.data.vehicleId));
      if (!vehicle) throw new FleetHttpError(404, "Vehicle not found.");
      if (vehicle.archived) throw new FleetHttpError(409, "Archived vehicles cannot be booked.");
      if (detailsPending(vehicle)) throw new FleetHttpError(409, "Complete and confirm this vehicle's details before booking.");
      const [customer] = await tx.select({ id: customersTable.id }).from(customersTable)
        .where(eq(customersTable.id, parsed.data.customerId));
      if (!customer) throw new FleetHttpError(404, "Customer not found.");
      const conflict = await conflictFor(tx, vehicle.id, pickupAt, expectedReturnAt);
      if (conflict) throw new FleetHttpError(409, conflict);
      const [created] = await tx
        .insert(rentalsTable)
        .values({ ...parsed.data, pickupAt, expectedReturnAt })
        .returning();
      await reconcileVehicleStatus(tx, vehicle.id);
      return created;
    });
  } catch (error) {
    if (sendFleetError(res, error)) return;
    throw error;
  }
  const hydrated = (await hydratedRentals()).find((r) => r.id === rental.id);
  res.status(201).json(CreateRentalResponse.parse(hydrated));
});

router.post("/rentals/:id/status", async (req, res): Promise<void> => {
  const params = UpdateRentalStatusParams.safeParse(req.params);
  const body = UpdateRentalStatusBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid rental update." });
    return;
  }
  if (EXAMPLE_RENTAL_IDS.includes(params.data.id)) {
    res.status(404).json({ error: "Rental not found." });
    return;
  }
  let rental: Rental;
  try {
    rental = await db.transaction(async (tx) => {
      const [initial] = await tx.select().from(rentalsTable).where(eq(rentalsTable.id, params.data.id));
      if (!initial) throw new FleetHttpError(404, "Rental not found.");
      await lockVehicle(tx, initial.vehicleId);
      const [existing] = await tx.select().from(rentalsTable).where(eq(rentalsTable.id, initial.id));
      if (!existing) throw new FleetHttpError(404, "Rental not found.");
      const [vehicle] = await tx.select().from(vehiclesTable).where(eq(vehiclesTable.id, existing.vehicleId));
      if (!vehicle) throw new FleetHttpError(404, "Vehicle not found.");
      if (vehicle.archived && body.data.status === "out") {
        throw new FleetHttpError(409, "Archived vehicles cannot be checked out.");
      }

      const allowed =
        existing.status === body.data.status ||
        (existing.status === "reserved" && ["out", "cancelled"].includes(body.data.status)) ||
        (existing.status === "out" && body.data.status === "returned");
      if (!allowed) {
        throw new FleetHttpError(409, `Cannot transition rental from ${existing.status} to ${body.data.status}.`);
      }

      const now = new Date();
      const actualReturnAt = body.data.actualReturnAt ? new Date(body.data.actualReturnAt) : undefined;
      if (body.data.status === "out") {
        if (body.data.actualReturnAt != null) throw new FleetHttpError(400, "actualReturnAt is only valid when returning a rental.");
        if (existing.status === "reserved") {
          if (existing.pickupAt > now) throw new FleetHttpError(409, "Rental cannot be marked out before pickup time.");
          if (existing.expectedReturnAt <= now) throw new FleetHttpError(409, "A missed pickup cannot be marked out after its return deadline.");
          const conflict = await conflictFor(tx, existing.vehicleId, existing.pickupAt, existing.expectedReturnAt, existing.id);
          if (conflict) throw new FleetHttpError(409, conflict);
        }
      }
      if (body.data.status === "returned") {
        const returnedAt = actualReturnAt ?? now;
        if (!Number.isFinite(returnedAt.getTime()) || returnedAt < existing.pickupAt || returnedAt > now) {
          throw new FleetHttpError(400, "Return time must be between pickup and the current time.");
        }
      } else if (body.data.actualReturnAt != null) {
        throw new FleetHttpError(400, "actualReturnAt is only valid when returning a rental.");
      }
      const depositStatus = body.data.depositStatus ?? existing.depositStatus;
      if (depositStatus !== "not_collected" && existing.deposit <= 0) {
        throw new FleetHttpError(400, "A nonzero deposit amount is required for this deposit state.");
      }
      if (["reserved", "out"].includes(body.data.status) && ["returned", "partially_returned", "kept"].includes(depositStatus)) {
        throw new FleetHttpError(400, "An active rental cannot have a finalized deposit state.");
      }
      const [updated] = await tx
        .update(rentalsTable)
        .set({
          status: body.data.status,
          actualReturnAt: body.data.status === "returned" ? actualReturnAt ?? now : undefined,
          depositStatus: body.data.depositStatus ?? undefined,
          notes: body.data.notes ?? undefined,
        })
        .where(eq(rentalsTable.id, existing.id))
        .returning();
      await reconcileVehicleStatus(tx, existing.vehicleId, now);
      return updated;
    });
  } catch (error) {
    if (sendFleetError(res, error)) return;
    throw error;
  }
  const hydrated = (await hydratedRentals()).find((r) => r.id === rental.id);
  res.json(UpdateRentalStatusResponse.parse(hydrated));
});

router.post("/rentals/:id/extend", async (req, res): Promise<void> => {
  const params = ExtendRentalParams.safeParse(req.params);
  const body = ExtendRentalBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid extension." });
    return;
  }
  if (EXAMPLE_RENTAL_IDS.includes(params.data.id)) {
    res.status(404).json({ error: "Rental not found." });
    return;
  }
  const expectedReturnAt = new Date(body.data.expectedReturnAt);
  if (!Number.isFinite(expectedReturnAt.getTime())) {
    res.status(400).json({ error: "Expected return must be a valid date." });
    return;
  }
  let rental: Rental;
  try {
    rental = await db.transaction(async (tx) => {
      const [initial] = await tx.select().from(rentalsTable).where(eq(rentalsTable.id, params.data.id));
      if (!initial) throw new FleetHttpError(404, "Rental not found.");
      await lockVehicle(tx, initial.vehicleId);
      const [existing] = await tx.select().from(rentalsTable).where(eq(rentalsTable.id, initial.id));
      if (!existing) throw new FleetHttpError(404, "Rental not found.");
      const [vehicle] = await tx.select().from(vehiclesTable).where(eq(vehiclesTable.id, existing.vehicleId));
      if (!vehicle) throw new FleetHttpError(404, "Vehicle not found.");
      if (vehicle.archived) throw new FleetHttpError(409, "Archived vehicles cannot have rental extensions.");
      if (!["reserved", "out"].includes(existing.status)) {
        throw new FleetHttpError(409, "Only reserved or out rentals can be extended.");
      }
      if (expectedReturnAt <= existing.expectedReturnAt || expectedReturnAt <= new Date()) {
        throw new FleetHttpError(400, "An extension must move the return time later and into the future.");
      }
      const conflict = await conflictFor(tx, existing.vehicleId, existing.pickupAt, expectedReturnAt, existing.id);
      if (conflict) throw new FleetHttpError(409, conflict);
      const [updated] = await tx
        .update(rentalsTable)
        .set({ expectedReturnAt })
        .where(eq(rentalsTable.id, existing.id))
        .returning();
      await reconcileVehicleStatus(tx, existing.vehicleId);
      return updated;
    });
  } catch (error) {
    if (sendFleetError(res, error)) return;
    throw error;
  }
  const hydrated = (await hydratedRentals()).find((r) => r.id === rental.id);
  res.json(ExtendRentalResponse.parse(hydrated));
});

router.get("/maintenance", async (_req, res): Promise<void> => {
  const rows = await db
    .select({ maintenance: maintenancePeriodsTable, vehicle: vehiclesTable })
    .from(maintenancePeriodsTable)
    .innerJoin(vehiclesTable, eq(maintenancePeriodsTable.vehicleId, vehiclesTable.id))
    .orderBy(asc(maintenancePeriodsTable.startAt));
  res.json(
    ListMaintenanceResponse.parse(
      rows.map(({ maintenance, vehicle }) => ({
        id: maintenance.id,
        vehicleId: vehicle.id,
        vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        startAt: maintenance.startAt.toISOString(),
        endAt: maintenance.endAt.toISOString(),
        reason: maintenance.reason,
        notes: maintenance.notes,
      })),
    ),
  );
});

router.post("/maintenance", async (req, res): Promise<void> => {
  const parsed = CreateMaintenanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const startAt = new Date(parsed.data.startAt);
  const endAt = new Date(parsed.data.endAt);
  if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime()) || endAt <= startAt) {
    res.status(400).json({ error: "Maintenance end must be after its start." });
    return;
  }
  let result: { maintenance: typeof maintenancePeriodsTable.$inferSelect; vehicle: Vehicle };
  try {
    result = await db.transaction(async (tx) => {
      await lockVehicle(tx, parsed.data.vehicleId);
      const [vehicle] = await tx.select().from(vehiclesTable).where(eq(vehiclesTable.id, parsed.data.vehicleId));
      if (!vehicle) throw new FleetHttpError(404, "Vehicle not found.");
      if (vehicle.archived) throw new FleetHttpError(409, "Archived vehicles cannot be placed into maintenance.");
      const conflict = await conflictFor(tx, vehicle.id, startAt, endAt);
      if (conflict) throw new FleetHttpError(409, conflict);
      const [maintenance] = await tx
        .insert(maintenancePeriodsTable)
        .values({ ...parsed.data, startAt, endAt })
        .returning();
      await reconcileVehicleStatus(tx, vehicle.id);
      const [updatedVehicle] = await tx.select().from(vehiclesTable).where(eq(vehiclesTable.id, vehicle.id));
      return { maintenance, vehicle: updatedVehicle };
    });
  } catch (error) {
    if (sendFleetError(res, error)) return;
    throw error;
  }
  const { maintenance, vehicle } = result;
  res.status(201).json(
    CreateMaintenanceResponse.parse({
      id: maintenance.id,
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      startAt: maintenance.startAt.toISOString(),
      endAt: maintenance.endAt.toISOString(),
      reason: maintenance.reason,
      notes: maintenance.notes,
    }),
  );
});

router.patch("/maintenance/:id", async (req, res): Promise<void> => {
  const params = UpdateMaintenanceParams.safeParse(req.params);
  const body = UpdateMaintenanceBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid maintenance update." });
    return;
  }
  try {
    const result = await db.transaction(async (tx) => {
      const [current] = await tx.select().from(maintenancePeriodsTable).where(eq(maintenancePeriodsTable.id, params.data.id));
      if (!current) throw new FleetHttpError(404, "Maintenance period not found.");
      await lockVehicle(tx, current.vehicleId);
      const startAt = body.data.startAt ? new Date(body.data.startAt) : current.startAt;
      const endAt = body.data.endAt ? new Date(body.data.endAt) : current.endAt;
      if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime()) || endAt <= startAt) {
        throw new FleetHttpError(400, "Maintenance end must be after its start.");
      }
      const conflict = await conflictFor(tx, current.vehicleId, startAt, endAt, undefined, current.id);
      if (conflict) throw new FleetHttpError(409, conflict);
      const [updated] = await tx.update(maintenancePeriodsTable).set({ ...body.data, startAt, endAt }).where(eq(maintenancePeriodsTable.id, current.id)).returning();
      await reconcileVehicleStatus(tx, current.vehicleId);
      const [vehicle] = await tx.select().from(vehiclesTable).where(eq(vehiclesTable.id, current.vehicleId));
      return { updated, vehicle };
    });
    res.json(UpdateMaintenanceResponse.parse({
      id: result.updated.id, vehicleId: result.vehicle.id,
      vehicleName: `${result.vehicle.year} ${result.vehicle.make} ${result.vehicle.model}`,
      startAt: result.updated.startAt.toISOString(), endAt: result.updated.endAt.toISOString(),
      reason: result.updated.reason, notes: result.updated.notes,
    }));
  } catch (error) {
    if (sendFleetError(res, error)) return;
    throw error;
  }
});

router.delete("/maintenance/:id", async (req, res): Promise<void> => {
  const params = DeleteMaintenanceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid maintenance period." });
    return;
  }
  try {
    await db.transaction(async (tx) => {
      const [current] = await tx.select().from(maintenancePeriodsTable).where(eq(maintenancePeriodsTable.id, params.data.id));
      if (!current) throw new FleetHttpError(404, "Maintenance period not found.");
      await lockVehicle(tx, current.vehicleId);
      await tx.delete(maintenancePeriodsTable).where(eq(maintenancePeriodsTable.id, current.id));
      await reconcileVehicleStatus(tx, current.vehicleId);
    });
    res.status(204).send();
  } catch (error) {
    if (sendFleetError(res, error)) return;
    throw error;
  }
});

export default router;
