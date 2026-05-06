import { Router } from "express";
import * as scanService from "./scan.service";
import { validation } from "../../middleware/validation.middleware";
import { scanIdSchema, targetSchema } from "./scan.validation";
import { authentication } from "../../middleware/authentication.middleware";

const router = Router();

router.post(
  "/normal-scan",
  authentication(),
  validation(targetSchema),
  scanService.normalScan
);

router.get(
  "/",
  authentication(),
  scanService.getAllScans
);

router.get(
  "/:scanId/stream",
  // authentication(),
  validation(scanIdSchema),
  scanService.streamScanProgress
);

router.get(
  "/:scanId/result",
  authentication(),
  validation(scanIdSchema),
  scanService.getScanResult
);

router.get(
  "/:scanId/vulnerabilities",
  authentication(),
  validation(scanIdSchema),
  scanService.getScanVulnerabilities
);

router.get(
  "/:scanId/full-details", 
  authentication(),
  validation(scanIdSchema),
  scanService.getFullScanDetails
);

router.patch(
  "/:scanId/stop",
  authentication(),
  validation(scanIdSchema),
  scanService.stopScan
);
router.post(
  "/:scanId/generate-report",
  authentication(),
  // validation(scanIdSchema),
  scanService.generateReportAI
);

export default router;