import { Router } from "express";
import * as reportService from './report.service'
import { authentication } from "../../middleware/authentication.middleware";
const router = Router();

router.post(
  '/:scanId/generate',
  authentication(),
  reportService.generateReport
)
router.get(
  "/:reportId/status",
  authentication(),
  reportService.getReportStatus
);
router.get(
  "/scan/:scanId",
  authentication(),
  reportService.getReportsByScan
);
router.delete(
  "/:reportId", 
  authentication(), 
  reportService.deleteReport
);
export default router;