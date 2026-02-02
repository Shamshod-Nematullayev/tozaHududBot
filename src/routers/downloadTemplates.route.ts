import { Router } from "express";
import path from "path";
import { catchAsync } from "./controllers/utils/catchAsync.js";

const router = Router();

// dynamic routes
// fileName is name of the file on src/lib/templates
const templates: {
  url: string;
  fileName: string;
}[] = [
  {
    url: "/import-acts",
    fileName: "importActTemplate.xlsx",
  },
  {
    url: "/send-excel-to-group",
    fileName: "sendToGroupTemplate.xlsx",
  },
];

templates.forEach(({ url, fileName }) => {
  router.get(
    url,
    catchAsync((req, res) => {
      res.download(
        path.join(process.cwd(), "src", "lib", "templates", fileName)
      );
    })
  );
});

export default router;
