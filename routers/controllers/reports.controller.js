const { Abonent, Nazoratchi } = require("../../requires");
const Excel = require("exceljs");

module.exports.getConfirmedAbonentCountsReportByInspectors = async (
  req,
  res
) => {
  try {
    const { fromDate, toDate, page = 1, limit = 10 } = req.query;
    const inspectors = await Nazoratchi.find({
      companyId: req.user.companyId,
    })
      .select(["name", "_id", "id"])
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    const allRowsCount = await Nazoratchi.countDocuments({
      companyId: req.user.companyId,
    });
    const result = [];
    const promises = inspectors.map(async (inspector) => {
      inspector.pnflConfirmed = await Abonent.countDocuments({
        "shaxsi_tasdiqlandi.confirm": true,
        "shaxsi_tasdiqlandi.inspector._id": inspector._id,
        companyId: req.user.companyId,
      });
      inspector.etkConfirmed = await Abonent.countDocuments({
        "ekt_kod_tasdiqlandi.confirm": true,
        "ekt_kod_tasdiqlandi.inspector._id": inspector._id,

        companyId: req.user.companyId,
      });
      let filters = {
        companyId: req.user.companyId,
        "shaxsi_tasdiqlandi.inspector._id": inspector._id,
      };
      if (fromDate) {
        filters["shaxsi_tasdiqlandi.updated_at"] = {
          $gte: new Date(fromDate),
        };
      }
      if (toDate) {
        filters["shaxsi_tasdiqlandi.updated_at"] = {
          ...filters["shaxsi_tasdiqlandi.updated_at"],
          $lte: new Date(toDate),
        };
      }
      inspector.pnflConfirmedByDate = await Abonent.countDocuments(filters);
      filters = {
        companyId: req.user.companyId,
        "ekt_kod_tasdiqlandi.inspector._id": inspector._id,
      };
      if (fromDate) {
        filters["ekt_kod_tasdiqlandi.updated_at"] = {
          $gte: new Date(fromDate),
        };
      }
      if (toDate) {
        filters["shaxsi_tasdiqlandi.updated_at"] = {
          ...filters["shaxsi_tasdiqlandi.updated_at"],
          $lte: new Date(toDate),
        };
      }
      inspector.etkConfirmedByDate = await Abonent.countDocuments(filters);
      result.push(inspector);
    });
    await Promise.all(promises);
    res.json({ rows: result, count: allRowsCount });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.error(error);
  }
};

module.exports.getConfirmedAbonentCountsReportByInspectorsExcel = async (
  req,
  res
) => {
  try {
    const { fromDate, toDate } = req.query;
    const inspectors = await Nazoratchi.find({
      companyId: req.user.companyId,
    })
      .select(["name", "_id", "id"])
      .lean();
    const result = [];
    const promises = inspectors.map(async (inspector) => {
      inspector.pnflConfirmed = await Abonent.countDocuments({
        "shaxsi_tasdiqlandi.confirm": true,
        "shaxsi_tasdiqlandi.inspector._id": inspector._id,
        companyId: req.user.companyId,
      });
      inspector.etkConfirmed = await Abonent.countDocuments({
        "ekt_kod_tasdiqlandi.confirm": true,
        "ekt_kod_tasdiqlandi.inspector._id": inspector._id,

        companyId: req.user.companyId,
      });
      let filters = {
        companyId: req.user.companyId,
        "shaxsi_tasdiqlandi.inspector._id": inspector._id,
      };
      if (fromDate) {
        filters["shaxsi_tasdiqlandi.updated_at"] = {
          $gte: new Date(fromDate),
        };
      }
      if (toDate) {
        filters["shaxsi_tasdiqlandi.updated_at"] = {
          ...filters["shaxsi_tasdiqlandi.updated_at"],
          $lte: new Date(toDate),
        };
      }
      inspector.pnflConfirmedByDate = await Abonent.countDocuments(filters);
      filters = {
        companyId: req.user.companyId,
        "ekt_kod_tasdiqlandi.inspector._id": inspector._id,
      };
      if (fromDate) {
        filters["ekt_kod_tasdiqlandi.updated_at"] = {
          $gte: new Date(fromDate),
        };
      }
      if (toDate) {
        filters["shaxsi_tasdiqlandi.updated_at"] = {
          ...filters["shaxsi_tasdiqlandi.updated_at"],
          $lte: new Date(toDate),
        };
      }
      inspector.etkConfirmedByDate = await Abonent.countDocuments(filters);
      result.push(inspector);
    });
    await Promise.all(promises);
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
