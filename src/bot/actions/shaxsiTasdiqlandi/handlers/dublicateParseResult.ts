type DublicateType = "cadastrDublicate" | "HETDublicate" | "other_error";

interface DublicateParseResult {
  type: DublicateType;
  dublicateLicshet?: string;
}

export function parseDublicateError(
  message: string,
  originalLicshet: string
): DublicateParseResult {
  if (message.includes("Kadastr raqami dublikat")) {
    const match = message.match(/dublikat kiritilgan hisob raqami: (\d+)/);
    if (match) {
      const dublicateLicshet = match[1];
      if (dublicateLicshet !== originalLicshet) {
        return {
          type: "cadastrDublicate",
          dublicateLicshet,
        };
      }
    }
  }

  if (message.includes("Elektr energiyasi hisob raqami dublikat")) {
    const match = message.match(/dublikat kiritilgan hisob raqami: (\d+)/);
    if (match) {
      const dublicateLicshet = match[1];
      if (dublicateLicshet !== originalLicshet) {
        return {
          type: "HETDublicate",
          dublicateLicshet,
        };
      }
    }
  }

  return {
    type: "other_error",
  };
}
