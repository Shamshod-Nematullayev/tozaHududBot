import { ICreateActPayload } from "@services/billing/createAct.js";

export const JobNames = {
  ImportActs: "ImportActs",
} as const;

export type JobName = (typeof JobNames)[keyof typeof JobNames];

export interface JobPayloads {
  [JobNames.ImportActs]: {
    acts: ICreateActPayload[];
  };
}
