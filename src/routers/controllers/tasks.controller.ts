import { lotinga } from "@bot/middlewares/smallFunctions/lotinKiril.js";
import { SpecialTaskItem } from "@models/SpecialTaskItem.js";
import {
  createTaskBodySchema,
  findTaskIdSchema,
  getAbonentFiltesQuerySchema,
  updateTaskBodySchema,
} from "@schemas/tasks.schema.js";
import { Request, Response } from "express";
import z from "zod";
import { createWorkbook } from "./utils/excel/createWorkbook.js";
import { abonentsExcelConfig } from "./utils/excel/exporters/abonents.exporter.js";
import { tasksExcelConfig } from "./utils/excel/exporters/tasks.exporter.js";
import { Mahalla } from "@models/Mahalla.js";

export const getAllTasks = async (req: Request, res: Response) => {
  const { limit, page, sortDirection, sortField, filters } =
    getAbonentFiltesQuerySchema.parse(req.query);

  const skip = (page - 1) * limit;

  const filtersObj: any = { companyId: req.user.companyId };
  if (filters?.accountNumber)
    filtersObj.accountNumber = new RegExp(filters.accountNumber, "i");
  if (filters?.fullName)
    filtersObj.fullName = new RegExp(lotinga(filters.fullName), "i");
  if (filters?.mahallaId) filtersObj.mahallaId = filters.mahallaId;
  if (filters?.type) filtersObj.type = filters.type;
  if (filters?.nazoratchi_id) filtersObj.nazoratchi_id = filters.nazoratchi_id;
  if (filters?.status) filtersObj.status = filters.status;

  const data = await SpecialTaskItem.find(filtersObj)
    .skip(skip)
    .limit(limit)
    .sort({ [sortField || "createdAt"]: sortDirection });

  const totalCount = await SpecialTaskItem.countDocuments(filtersObj);
  const meta = {
    total: totalCount,
    page,
    limit,
  };
  res.json({ ok: true, data, meta });
};

export const getAllTasksToExcel = async (req: Request, res: Response) => {
  const { sortDirection, sortField, filters } =
    getAbonentFiltesQuerySchema.parse(req.query);

  const filtersObj: any = { companyId: req.user.companyId };
  if (filters?.accountNumber)
    filtersObj.accountNumber = new RegExp(filters.accountNumber, "i");
  if (filters?.fullName)
    filtersObj.fullName = new RegExp(lotinga(filters.fullName), "i");
  if (filters?.mahallaId) filtersObj.mahallaId = filters.mahallaId;
  if (filters?.type) filtersObj.type = filters.type;
  if (filters?.nazoratchi_id) filtersObj.nazoratchi_id = filters.nazoratchi_id;
  if (filters?.status) filtersObj.status = filters.status;

  const tasks = await SpecialTaskItem.find(filtersObj).sort({
    [sortField || "createdAt"]: sortDirection,
  });

  console.log(filtersObj);

  const mahallas = await Mahalla.find({ companyId: req.user.companyId });

  const types = {
    phone: "Telefon",
    electricity: "Elektr hisob raqami",
  };
  const statuses = {
    completed: "Bajarilgan",
    "in-progress": "Jarayonda",
    rejected: "Muvaffaqqiyatsiz yakunlangan",
  };

  const workbook = createWorkbook(
    tasks.map((task, index) => ({
      accountNumber: task.accountNumber,
      fullName: task.fullName,
      mahallaId: task.mahallaId,
      type: types[task.type],
      nazoratchi_id: task.nazoratchi_id,
      status: statuses[task.status],
      purpose: task.purpose,
      id: task.id,
      nazoratchiName: task.nazoratchiName,
      order_number: index + 1,
      mahallaName: mahallas.find((m) => m.id === task.mahallaId)?.name || "",
    })),
    tasksExcelConfig
  );

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=tasks.xlsx");

  await workbook.xlsx.write(res);
};

export const getTaskById = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { id } = findTaskIdSchema.parse(req.params);
  const data = await SpecialTaskItem.findOne({
    _id: id,
    companyId: req.user.companyId,
  });
  if (!data)
    return res.status(404).json({ ok: false, message: "Task topilmadi" });
  res.json(data);
};

export const createTask = async (req: Request, res: Response) => {
  const body = createTaskBodySchema.parse(req.body);
  const data = await SpecialTaskItem.create({
    ...body,
    companyId: req.user.companyId,
  });
  res.status(201).json(data);
};

export const updateTask = async (req: Request, res: Response): Promise<any> => {
  const body = updateTaskBodySchema.parse(req.body);
  const { id } = findTaskIdSchema.parse(req.params);

  const data = await SpecialTaskItem.findOneAndUpdate(
    { _id: id, companyId: req.user.companyId },
    { $set: body },
    { new: true }
  );
  if (!data)
    return res.status(404).json({ ok: false, message: "Task topilmadi" });
  res.json(data);
};

export const deleteTask = async (req: Request, res: Response): Promise<any> => {
  const { id } = findTaskIdSchema.parse(req.params);
  const data = await SpecialTaskItem.findOneAndDelete({
    _id: id,
    companyId: req.user.companyId,
  });
  if (!data)
    return res.status(404).json({ ok: false, message: "Task topilmadi" });
  res.status(200).send();
};

export const deleteManyTasks = async (req: Request, res: Response) => {
  const { ids } = z.parse(z.object({ ids: z.array(z.string()) }), req.body);
  const data = await SpecialTaskItem.deleteMany({ _id: { $in: ids } });
  res.json({ ok: true, data });
};
