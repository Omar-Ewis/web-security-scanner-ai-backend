import { Router } from "express";
import * as botService from "./bot.service";
import { authentication } from "../../middleware/authentication.middleware";

const router = Router();

router.post(
  "/sessions",
  authentication(),
  botService.createSession
);

router.get(
  "/sessions",
  authentication(),
  botService.getAllSessions
);

router.get(
  "/sessions/:sessionId/messages",
  authentication(),
  botService.getSessionMessages
);

router.post(
  "/sessions/:sessionId/messages",
  authentication(),
  botService.sendMessage
);

router.delete(
  "/sessions/:sessionId",
  authentication(),
  botService.deleteSession
);

export default router;