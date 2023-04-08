const mahallalar = require("../../lib/mahallalar.json");
module.exports = function qaysiMahalla(id) {
  let res = "";
  mahallalar.forEach((mfy) => {
    if (mfy.id == id) res = mfy.name;
  });
  return res;
};
