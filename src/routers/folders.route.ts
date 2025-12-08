import { Router } from "express";
import {
  addArizaToFolder,
  closeFolder,
  getFolderById,
  getFolders,
} from "./controllers/folders.controller.js";
import { catchAsync } from "./controllers/utils/catchAsync.js";

const router = Router();

router.get("/", catchAsync(getFolders));

router.get("/:folderId", catchAsync(getFolderById));

router.post("/close-folder", catchAsync(closeFolder));

router.post("/add-ariza-to-folder", catchAsync(addArizaToFolder));

export default router;
