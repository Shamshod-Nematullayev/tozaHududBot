import { Abonent } from "@models/Abonent";
import { Nazoratchi } from "@models/Nazoratchi";
import Excel from "exceljs";
async function countConfirmed(inspectorId, companyId, field, fromDate, toDate) {
  const baseFilter = {
    [`${field}.confirm`]: true,
    [`${field}.inspector._id`]: inspectorId,
    companyId,
  };

  const byDateFilter = {
    ...baseFilter,
  };

  if (fromDate) {
    byDateFilter[`${field}.updated_at`] = { $gte: new Date(fromDate) };
  }

  if (toDate) {
    const end = new Date(toDate);
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

async function getReportData(req) {
  const { fromDate, toDate, page = 1, limit = 10 } = req.query;
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
          inspector._id,
          req.user.companyId,
          "shaxsi_tasdiqlandi",
          fromDate,
          toDate
        );
      const { total: etkConfirmed, byDate: etkConfirmedByDate } =
        await countConfirmed(
          inspector._id,
          req.user.companyId,
          "ekt_kod_tasdiqlandi",
          fromDate,
          toDate
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

export const getConfirmedAbonentCountsReportByInspectors = async (req, res) => {
  try {
    const { result, count } = await getReportData(req);
    res.json({ rows: result, count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getConfirmedAbonentCountsReportByInspectorsExcel = async (
  req,
  res
) => {
  try {
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
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.error(error);
  }
};
