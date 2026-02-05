import { Router } from "express";
import {
  createTask,
  deleteManyTasks,
  deleteTask,
  getAllTasks,
  getAllTasksToExcel,
  getTaskById,
  updateTask,
} from "./controllers/tasks.controller.js";
import { catchAsync } from "./controllers/utils/catchAsync.js";

const router = Router();

// get all tasks
router.get("/", catchAsync(getAllTasks));
// get all tasks to excel
router.get("/excel", catchAsync(getAllTasksToExcel));
// get task by id
router.get("/:id", catchAsync(getTaskById));
// create task
router.post("/", catchAsync(createTask));
// update task
router.put("/:id", catchAsync(updateTask));
// delete task by id
router.delete("/:id", catchAsync(deleteTask));
// delete many
router.delete("/", catchAsync(deleteManyTasks));

export default router;
