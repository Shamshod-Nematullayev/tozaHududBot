import express from "express";
const router = express.Router();
import {
  getAllInspectors,
  setInspectorToMfy,
  unsetInspectorToMfy,
  addInspector,
  setInspectorInactive,
  setInspectorTelegramId,
  getInspectorsFromTozaMakon,
  checkTelegramId,
} from "./controllers/inspectors.controller.js";

router.get("/", getAllInspectors);

router.post("/set-inspector-to-mfy/:mfy_id", setInspectorToMfy);

router.post("/unset-inspector-to-mfy/:mfy_id", unsetInspectorToMfy);

router.get("/get-inspectors-from-toza-makon", getInspectorsFromTozaMakon);

router.post("/add-inspector", addInspector);

router.get("/check-telegram/:user_id", checkTelegramId);

router.post("/set-inspector-telegram-id", setInspectorTelegramId);

router.post("/set-inspector-inactive/:id", setInspectorInactive);

export default router;
