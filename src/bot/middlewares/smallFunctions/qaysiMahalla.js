console.log("Mahalla modeli yuklandi 3");
import { readFile } from "fs/promises";
const mahallalar = JSON.parse(
  await readFile(new URL("./mahallalar.json", import.meta.url))
);

export default function qaysiMahalla(id) {
  let res = "";
  mahallalar.forEach((mfy) => {
    if (mfy.id == id) res = mfy.name;
  });
  return res;
}
