import { ICreateActPayload } from '@services/billing/createAct.js';

export interface BaseJobData {
  userId: string;
  companyId: number;
}

export const JobNames = {
  ImportActs: 'ImportActs',
  ExcelToImageAndSendTelegram: 'ExcelToImageAndSendTelegram',
  UpdateArizasStatus: 'UpdateArizasStatus',
} as const;

export type JobName = (typeof JobNames)[keyof typeof JobNames];

export interface JobPayloads {
  [JobNames.ImportActs]: BaseJobData & {
    acts: ICreateActPayload[];
  };
  [JobNames.ExcelToImageAndSendTelegram]: BaseJobData & {
    excelFilePath: string;
    telegramChatId: number | string;
  };
  [JobNames.UpdateArizasStatus]: BaseJobData & {
    arizaIds: string[];
  };
}
