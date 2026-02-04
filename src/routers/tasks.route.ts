import { Router } from "express";
import {
  createTask,
  deleteManyTasks,
  deleteTask,
  getAllTasks,
  getTaskById,
  updateTask,
} from "./controllers/tasks.controller.js";

const router = Router();

// get all tasks
router.get("/", getAllTasks);
// get task by id
router.get("/:id", getTaskById);
// create task
router.post("/", createTask);
// update task
router.put("/:id", updateTask);
// delete task by id
router.delete("/:id", deleteTask);
// delete many
router.delete("/", deleteManyTasks);

export default router;
