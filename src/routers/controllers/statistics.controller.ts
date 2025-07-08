import { Response } from "express";
import { MyRequest } from "interfaces/express.interfaces";

import { Abonent } from "@models/Abonent";

import { LastUpdate } from "@models/LastUpdate";

import { NewAbonent } from "@models/NewAbonents";

export const getIdentityStat = async (req: MyRequest, res: Response) => {
  try {
    const allAbonentsCount = await Abonent.countDocuments({
      companyId: req.user?.companyId,
    });
    const confirmed = await Abonent.countDocuments({
      "shaxsi_tasdiqlandi.confirm": {
        $ne: true,
      },
      companyId: req.user?.companyId,
    });
    res.json({
      allAbonentsCount,
      confirmed: allAbonentsCount - confirmed,
    });
    console.log(allAbonentsCount, confirmed, "id");
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.error(error);
  }
};

export const getETKConfirmStat = async (req: MyRequest, res: Response) => {
  try {
    const allAbonentsCount = await Abonent.countDocuments({
      companyId: req.user?.companyId,
    });
    const confirmed = await Abonent.countDocuments({
      "ekt_kod_tasdiqlandi.confirm": {
        $ne: true,
      },
      companyId: req.user?.companyId,
    });
    res.json({
      allAbonentsCount,
      confirmed: allAbonentsCount - confirmed,
    });
    console.log(allAbonentsCount, confirmed, "etk");
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.error(error);
  }
};

export const getLastUpdateDateAbonentsSaldo = async (
  req: MyRequest,
  res: Response
) => {
  try {
    const lastUpdateDate = (
      await LastUpdate.findOne({
        key: `abonents-update-${req.user?.companyId}`,
      })
    ).last_update;
    res.json({ lastUpdateDate });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.error(error);
  }
};

export const getNewAbonentRequstsCount = async (
  req: MyRequest,
  res: Response
) => {
  try {
    const count = await NewAbonent.countDocuments({
      companyId: req.user?.companyId,
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.error(error);
  }
};
