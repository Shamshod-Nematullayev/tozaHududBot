import { Automobile } from '@models/Automobile.js';
import { Request, Response } from 'express';
import z, { number } from 'zod';

export const getAutomobiles = async (req: Request, res: Response): Promise<any> => {
  const filters: any = z
    .object({
      status: z.enum(['soz', 'nosoz']).optional(),
      mahallaId: z.coerce.number().optional(),
    })
    .parse(req.query);

  if (filters.mahallaId) {
    filters.mahallalar = { $elemMatch: { mahallaId: filters.mahallaId } };
    delete filters.mahallaId;
  }

  const automobiles = await Automobile.find({
    ...filters,
    companyId: req.user.companyId,
  });
  res.json(automobiles);
};

export const getAutomobileById = async (req: Request, res: Response): Promise<any> => {
  const automobile = await Automobile.findOne({
    _id: req.params.id,
    companyId: req.user.companyId,
  });
  res.json(automobile);
};

export const createAutomobile = async (req: Request, res: Response): Promise<any> => {
  const automobileData = z
    .object({
      name: z.string(),
      model: z.string(),
      year: z.number(),
      km: z.number().optional(),
      currentDriver: z.string().optional(),
      status: z.enum(['soz', 'nosoz']).default('soz'),
      tozamakonId: z.number(),
      phone: z.string().optional(),
      mahallalar: z.array(
        z.object({
          mahallaId: z.number(),
          name: z.string(),
          service: z.array(
            z.object({
              serviceId: z.number(),
              name: z.string(),
            })
          ),
        })
      ),
    })
    .parse(req.body);

  const newAutomobile = await Automobile.create({
    ...automobileData,
    companyId: req.user.companyId,
  });
  res.status(201).json(newAutomobile);
};

export const updateAutomobile = async (req: Request, res: Response): Promise<any> => {
  const automobileData = z
    .object({
      name: z.string().optional(),
      model: z.string().optional(),
      year: z.number().optional(),
      km: z.number().optional(),
      currentDriver: z.string().optional(),
      status: z.enum(['soz', 'nosoz']).optional(),
      tozamakonId: z.number().optional(),
      phone: z.string().optional(),
    })
    .parse(req.body);

  const updatedAutomobile = await Automobile.findOneAndUpdate(
    {
      _id: req.params.id,
      companyId: req.user.companyId,
    },
    {
      ...automobileData,
    },
    {
      new: true,
    }
  );

  res.json(updatedAutomobile);
};

export const deleteAutomobile = async (req: Request, res: Response): Promise<any> => {
  await Automobile.findOneAndDelete({
    _id: req.params.id,
    companyId: req.user.companyId,
  });
  res.status(204).send();
};

export const addMahallaToAutomobile = async (req: Request, res: Response): Promise<any> => {
  const mahallaData = z
    .object({
      mahallaId: z.number(),
      name: z.string(),
      service: z.array(
        z.object({
          day: z.number().refine((val) => [1, 2, 3, 4, 5, 6, 7].includes(val)),
          time: z.number().refine((val) => [0.5, 1].includes(val)),
        })
      ),
    })
    .parse(req.body);

  const updatedAutomobile = await Automobile.findOneAndUpdate(
    {
      _id: req.params.id,
      companyId: req.user.companyId,
    },
    {
      $push: { mahallalar: mahallaData },
    },
    {
      new: true,
    }
  );

  res.json(updatedAutomobile);
};

export const removeMahallaFromAutomobile = async (req: Request, res: Response): Promise<any> => {
  const mahallaId = z.coerce.number().parse(req.params.mahallaId);

  const updatedAutomobile = await Automobile.findOneAndUpdate(
    {
      _id: req.params.autoId,
      companyId: req.user.companyId,
    },
    {
      $pull: { mahallalar: { mahallaId: mahallaId } },
    },
    {
      new: true,
    }
  );

  res.json(updatedAutomobile);
};

export const updateMahallaInAutomobile = async (req: Request, res: Response): Promise<any> => {
  const data = z
    .object({
      mahallaId: z.number(),
      newMahallaId: z.number().optional(),
      newMahallaName: z.string().optional(),
      service: z.array(
        z.object({
          day: z.number(),
          time: z.number(),
        })
      ),
    })
    .parse(req.body);

  const updated = await Automobile.findOneAndUpdate(
    {
      _id: req.params.id,
      companyId: req.user.companyId,
      'mahallalar.mahallaId': data.mahallaId,
    },
    {
      $set: {
        'mahallalar.$.mahallaId': data.newMahallaId,
        'mahallalar.$.name': data.newMahallaName,
        'mahallalar.$.service': data.service,
      },
    },
    { new: true }
  );

  res.json(updated);
};
