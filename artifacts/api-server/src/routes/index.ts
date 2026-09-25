import { Router, type IRouter } from "express";
import healthRouter from "./health";
import fleetRouter from "./fleet";
import agreementsRouter from "./agreements";

const router: IRouter = Router();

router.use(healthRouter);
router.use(fleetRouter);
router.use(agreementsRouter);

export default router;
