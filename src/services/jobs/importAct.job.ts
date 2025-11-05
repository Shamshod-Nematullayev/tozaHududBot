import { Job } from "agenda";
import { JobNames, JobPayloads } from "./job.type.js";

export async function importActJob(
  job: Job<JobPayloads[typeof JobNames.ImportActs]>
) {
  console.log("Import Act Job started with data:", job.attrs.data);
  // Job logic here
  console.log("Import Act Job completed");
  job.attrs.name;
}
