console.log("Mahalla modeli yuklandi 3");
import mahallalar from "@lib/mahallalar.json";

export default function qaysiMahalla(id) {
  let res = "";
  mahallalar.forEach((mfy) => {
    if (mfy.id == id) res = mfy.name;
  });
  return res;
}
