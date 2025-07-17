type DublicateType =
  | "cadastrDublicate"
  | "HETDublicate"
  | "notPhoto"
  | "other_error";

interface DublicateParseResult {
  type: DublicateType;
  dublicateLicshet?: string;
}

export function parseError(
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

  if (message.includes("Rasm mavjud emas")) {
    return {
      type: "notPhoto",
    };
  }

  return {
    type: "other_error",
  };
}
