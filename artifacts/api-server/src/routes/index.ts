import { Router, type IRouter } from "express";
import healthRouter from "./health";
import electronRouter from "./electron";

const router: IRouter = Router();

router.use(healthRouter);
router.use(electronRouter);

export default router;
