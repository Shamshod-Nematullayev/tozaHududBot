import z from "zod";

// 1. PermamentPerson sxemasi
const PermamentPersonSchema = z.object({
    DateBirth: z.string(),
    Person: z.string(),
    Pinpp: z.string().optional(),
    RegistrationDate: z.string(),
    Sex: z.string(),
  });
  
  // 2. House sxemasi
  const HouseSchema = z.object({
    cadastralNumber: z.string(),
    fullAddress: z.string(),
    houseNumber: z.string(),
    houseType: z.string(),
    isLegal: z.boolean(),
    numberOfOwners: z.number(),
    objectType: z.string(),
    streetName: z.string(),
    owners: z.array(
      z.object({
        name: z.string(),
        passport: z.string(),
        pinfl: z.string(),
        type: z.string(),
      })
    ),
  });
  
  // 3. PermamentsResponse sxemasi (Asosiy validator)
  export const PermamentsSchema = z.object({
    Data: z.object({
      PermanentPersons: z.array(PermamentPersonSchema).nullable(),
      TemproaryPersons: z.array(PermamentPersonSchema).nullable(),
    }),
    house: HouseSchema.nullable(),
  });