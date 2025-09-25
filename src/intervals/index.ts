import { agenda } from "../config/agenda.js";
import { jobsConfig } from "config/jobsConfig.js";

export function initJobs() {
  for (const job of jobsConfig) {
    agenda.define(job.name, job.handler);
    agenda.start();

    agenda.every(job.schedule, job.name);
  }
}
