type DublicateType =
  | "cadastrDublicate"
  | "HETDublicate"
  | "notPhoto"
  | "brokenCaoto"
  | "brokenETK"
  | "brokenPasport"
  | "hasKirillOnName"
  | "other_error"
  | "brokenCadastr"
  | "brokenJSHSHIR";

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

  if (
    message.includes(
      "Elektr energiyasi soato identifikatsiya qoidalariga mos emas"
    )
  ) {
    return {
      type: "brokenCaoto",
    };
  }

  if (
    message.includes(
      "Elektr energiyasi hisob raqami identifikatsiya qoidalariga mos emas"
    )
  ) {
    return { type: "brokenETK" };
  }

  if (
    message.includes("Pasport seriyasi identifikatsiya qoidalariga mos emas")
  ) {
    return { type: "brokenPasport" };
  }

  if (message.includes("Ism familiyasida kirill harflari mavjud")) {
    return { type: "hasKirillOnName" };
  }

  if (message.includes("JSHSHIR identifikatsiya qoidalariga mos emas")) {
    return { type: "brokenJSHSHIR" };
  }

  if (message.includes("Kadastr raqami identifikatsiya qoidalariga mos emas")) {
    return { type: "brokenCadastr" };
  }

  return {
    type: "other_error",
  };
}
