import { createTozaMakonApi } from "@api/tozaMakon.js";
import { Abonent } from "@models/Abonent.js";
import { Company } from "@models/Company.js";
import { Mahalla } from "@models/Mahalla.js";
import { Nazoratchi } from "@models/Nazoratchi.js";
import { getReportDataQuerySchema } from "@schemas/reports.schema.js";
import { getReportsResidentIdentifications } from "@services/billing/getReportsResidentIdentifications.js";
import { formatDate } from "@services/utils/formatDate.js";
import Excel from "exceljs";
import { Request, Response } from "express";
import z from "zod";
async function countConfirmed(
  inspectorId: string | number,
  companyId: number,
  field: string,
  fromDate: Date,
  toDate: Date,
  searchInspectorIdType: "inspector._id" | "inspector_id"
) {
  const baseFilter = {
    [`${field}.confirm`]: true,
    [`${field}.${searchInspectorIdType}`]: inspectorId,
    companyId,
  };

  const byDateFilter: any = {
    ...baseFilter,
  };

  if (fromDate) {
    byDateFilter[`${field}.updated_at`] = { $gte: fromDate };
  }

  if (toDate) {
    const end = toDate;
    end.setHours(23, 59, 59, 999);
    byDateFilter[`${field}.updated_at`] = {
      ...byDateFilter[`${field}.updated_at`],
      $lte: end,
    };
  }

  const total = await Abonent.countDocuments(baseFilter);
  const byDate = await Abonent.countDocuments(byDateFilter);

  return { total, byDate };
}

async function getReportData(req: Request) {
  const {
    fromDate,
    toDate,
    page = 1,
    limit = 10,
  } = getReportDataQuerySchema.parse(req.query);
  const inspectors = await Nazoratchi.find({
    companyId: req.user.companyId,
  })
    .select(["name", "_id", "id"])
    .skip(req.query.page ? (page - 1) * limit : 0)
    .limit(req.query.page ? limit : 1000)
    .lean();

  const result = await Promise.all(
    inspectors.map(async (inspector) => {
      const { total: pnflConfirmed, byDate: pnflConfirmedByDate } =
        await countConfirmed(
          inspector._id.toString(),
          req.user.companyId,
          "shaxsi_tasdiqlandi",
          fromDate,
          toDate,
          "inspector._id"
        );
      const { total: etkConfirmed, byDate: etkConfirmedByDate } =
        await countConfirmed(
          inspector.id,
          req.user.companyId,
          "ekt_kod_tasdiqlandi",
          fromDate,
          toDate,
          "inspector_id"
        );
      return {
        ...inspector,
        pnflConfirmed,
        pnflConfirmedByDate,
        etkConfirmed,
        etkConfirmedByDate,
      };
    })
  );

  const count = await Nazoratchi.countDocuments({
    companyId: req.user.companyId,
  });

  return { result, count };
}

export const getConfirmedAbonentCountsReportByInspectors = async (
  req: Request,
  res: Response
) => {
  const { result, count } = await getReportData(req);
  res.json({ rows: result, count });
};

export const getConfirmedAbonentCountsReportByInspectorsExcel = async (
  req: Request,
  res: Response
) => {
  const { result } = await getReportData(req);
  const workbook = new Excel.Workbook();
  const worksheet = workbook.addWorksheet("Reports");
  worksheet.columns = [
    { header: "No", key: "index", width: 10 },
    { header: "Nazoratchi ID", key: "id", width: 30 },
    { header: "Nazoratchi", key: "name", width: 30 },
    { header: "Jami PNFL", key: "pnflConfirmed", width: 30 },
    {
      header: "Tanlangan vaqt oralig'idagi PNFL",
      key: "pnflConfirmedByDate",
      width: 30,
    },
    { header: "SVET kodi", key: "etkConfirmed", width: 30 },
    {
      header: "Tanlangan vaqt oralig'idagi SVET kodi",
      key: "etkConfirmedByDate",
      width: 30,
    },
  ];
  result.forEach((row, index) => {
    worksheet.addRow({
      index: index + 1,
      id: row.id,
      name: row.name,
      pnflConfirmed: row.pnflConfirmed,
      pnflConfirmedByDate: row.pnflConfirmedByDate,
      etkConfirmed: row.etkConfirmed,
      etkConfirmedByDate: row.etkConfirmedByDate,
    });
  });
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0070C0" },
    };
  });
  // Export qilish
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=reports.xlsx");
  await workbook.xlsx.write(res);
};

export const getConfirmedAbonentCountsReportByMahalla = async (
  req: Request,
  res: Response,
  dontSendResponse: "dontSend" | any
) => {
  const { limit = 300, page = 1 } = z
    .object({
      limit: z.coerce.number().optional(),
      page: z.coerce.number().optional(),
    })
    .parse(req.query);
  const skip = (page - 1) * limit;
  const company = await Company.findOne({ id: req.user.companyId });
  if (!company) throw "Company not found";

  const mahallas = await Mahalla.find({ companyId: req.user.companyId })
    .lean()
    .select("id name biriktirilganNazoratchi")
    .skip(skip)
    .limit(limit);
  const mahallaCount = await Mahalla.countDocuments({
    companyId: req.user.companyId,
  });

  const now = new Date();
  const identificationsReport = await getReportsResidentIdentifications(
    createTozaMakonApi(req.user.companyId),
    {
      companyId: req.user.companyId,
      districtId: company.districtId,
      regionId: company.regionId,
      dateFrom: formatDate(new Date(now.getFullYear(), now.getMonth(), 1)),
      dateTo: formatDate(now),
    }
  );

  const result = await Promise.all(
    mahallas.map(async (mahalla) => {
      const pnflConfirmed = await Abonent.countDocuments({
        companyId: req.user.companyId,
        mahallas_id: mahalla.id,
        "shaxsi_tasdiqlandi.confirm": true,
      });
      const etkConfirmed = await Abonent.countDocuments({
        companyId: req.user.companyId,
        mahallas_id: mahalla.id,
        "ekt_kod_tasdiqlandi.confirm": true,
      });
      const i = identificationsReport.find((i) => i.id == mahalla.id);
      return {
        ...mahalla,
        pnflConfirmed,
        etkConfirmed,
        allAbonents: i?.residentCount,
        identified: i?.totalIdentifiedCount,
      };
    })
  );
  if (dontSendResponse !== "dontSend")
    res.json({ rows: result, count: mahallaCount });
  return { result, count: mahallaCount };
};

export const getConfirmedAbonentCountsReportByMahallaExcel = async (
  req: Request,
  res: Response
) => {
  const { result } = await getConfirmedAbonentCountsReportByMahalla(
    req,
    res,
    "dontSend"
  );
  const workbook = new Excel.Workbook();
  const worksheet = workbook.addWorksheet("Reports");
  worksheet.columns = [
    { header: "No", key: "index", width: 10 },
    { header: "Mahalla ID", key: "id", width: 30 },
    { header: "Mahalla", key: "name", width: 30 },
    { header: "Jami abonentlar soni", key: "allAbonents", width: 30 },
    {
      header: "Biriktirilgan Nazoratchi",
      key: "biriktirilganNazoratchi",
      width: 30,
    },
    { header: "Jami PNFL", key: "pnflConfirmed", width: 30 },
    { header: "SVET kodi", key: "etkConfirmed", width: 30 },
    { header: "Idintifikatsiyalanganlar", key: "identified", width: 30 },
  ];
  result.forEach((row, index) => {
    worksheet.addRow({
      index: index + 1,
      id: row.id,
      name: row.name,
      pnflConfirmed: row.pnflConfirmed,
      etkConfirmed: row.etkConfirmed,
      allAbonents: row.allAbonents,
      biriktirilganNazoratchi: row.biriktirilganNazoratchi?.inspector_name,
      identified: row.identified,
    });
  });
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0070C0" },
    };
  });
  // Export qilish
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=reports.xlsx");
  await workbook.xlsx.write(res);
};
