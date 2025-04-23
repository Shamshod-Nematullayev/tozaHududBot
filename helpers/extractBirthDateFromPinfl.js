function extractBirthDateString(jshshir) {
  if (!/^\d{14}$/.test(jshshir)) {
    throw new Error("Noto‘g‘ri JShShIR formati");
  }

  const g = parseInt(jshshir[0], 10);
  const yearPart = jshshir.slice(5, 7);
  const month = jshshir.slice(3, 5);
  const day = jshshir.slice(1, 3);

  let century;
  if (g === 1 || g === 2) century = "18";
  else if (g === 3 || g === 4) century = "19";
  else if (g === 5 || g === 6) century = "20";
  else throw new Error("Noma'lum asr kodi");

  const fullYear = century + yearPart;

  return `${fullYear}-${month}-${day}`;
}

module.exports = { extractBirthDateString };
