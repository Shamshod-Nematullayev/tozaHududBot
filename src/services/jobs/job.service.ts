import { Agenda } from "agenda";
import { importActJob } from "./importAct.job.js";
import { JobName, JobNames, JobPayloads } from "./job.type.js";

export class JobService {
  constructor(private readonly agenda: Agenda) {
    this.agenda = agenda;
    this.defineJobs();
  }

  private async defineJobs() {
    this.agenda.define(JobNames.ImportActs, importActJob);
  }

  async startJob<T extends JobPayloads[JobName]>(jobName: JobName, data: T) {
    const job = await this.agenda.create(jobName, data).save();
    return job.attrs._id;
  }

  async getJobStatus(id: string): Promise<{
    status: "completed" | "in-progress";
    lastFinishedAt: Date | undefined;
  } | null> {
    const [job] = await this.agenda.jobs({ _id: id });
    if (!job) return null;

    const { lastFinishedAt } = job.attrs;
    const status = lastFinishedAt ? "completed" : "in-progress";
    return { status, lastFinishedAt };
  }

  async getJobsStatusPerUser(userId: string): Promise<
    {
      status: "completed" | "in-progress";
      lastFinishedAt: Date | undefined;
    }[]
  > {
    const jobs = await this.agenda.jobs({ "attrs.data.userId": userId });
    return jobs.map((job) => {
      const { lastFinishedAt } = job.attrs;
      const status = lastFinishedAt ? "completed" : "in-progress";
      return { status, lastFinishedAt };
    });
  }

  async getJobsStatusPerCompany(companyId: number): Promise<
    {
      status: "completed" | "in-progress";
      lastFinishedAt: Date | undefined;
    }[]
  > {
    const jobs = await this.agenda.jobs({ "attrs.data.companyId": companyId });
    return jobs.map((job) => {
      const { lastFinishedAt } = job.attrs;
      const status = lastFinishedAt ? "completed" : "in-progress";
      return { status, lastFinishedAt };
    });
  }
}
