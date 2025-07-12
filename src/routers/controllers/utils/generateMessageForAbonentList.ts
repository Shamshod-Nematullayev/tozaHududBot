export function generateMessageForAbonentList({
  minSaldo,
  maxSaldo,
  identified,
  etkStatus,
  mahalla_name,
}: {
  minSaldo?: string;
  maxSaldo?: string;
  identified?: "true" | "false";
  etkStatus?: "true" | "false";
  mahalla_name: string;
}): string {
  let parts = [];
  // 1. Qarz chegarasi
  if (minSaldo && maxSaldo) {
    parts.push(
      `${minSaldo} dan yuqori va ${maxSaldo} dan kam qarzdorligi bo‘lgan`
    );
  } else if (minSaldo) {
    parts.push(`${minSaldo} dan yuqori qarzdorligi bo‘lgan`);
  } else if (maxSaldo) {
    parts.push(`${maxSaldo} dan kam qarzdorligi bo‘lgan`);
  }

  // 2. Shaxsi tasdiqlanmagan
  if (identified === "true") {
    parts.push("shaxsi tasdiqlangan");
  } else if (identified === "false") {
    parts.push("shaxsi tasdiqmalangan");
  }

  // 3. Elektr kodi holati
  if (etkStatus === "true") {
    parts.push("elektr kodi kiritilgan");
  } else if (etkStatus === "false") {
    parts.push("elektr kodi kiritilmagan");
  }
  // 4. Yakuniy matn
  if (parts.length === 0)
    return `${mahalla_name} abonentlar aholi nazoratchisi uchun ro'yxat`;

  return `Ro'yxat: ${mahalla_name} ${parts.join(
    ", "
  )} abonentlar aholi nazoratchisi uchun.`;
}
