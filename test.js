const { tozaMakonApi } = require("./api/tozaMakon");
const fs = require("fs");

tozaMakonApi
  .get("/file-service/buckets/download", {
    params: {
      file: "tozamakon/nfs/specific_acts/2025/04/14/ddb4db76a2de476f9bd65c63fc62070d.png",
    },
    responseType: "arraybuffer",
  })
  .then(({ data }) => {
    fs.writeFile("./uploads/aaaa.png", data, { encoding: "utf-8" }, (err) => {
      if (err) console.error(err);
    });
  });
