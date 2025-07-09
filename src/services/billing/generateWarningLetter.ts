import { Axios } from "axios";

export function formatCurrentDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function generateWarningLetter(
  api: Axios,
  residentId: number,
  kSaldo: number
): Promise<Buffer> {
  const body = {
    lang: "UZ-CYRL",
    oneWarningInOnePage: false,
    residentIds: [residentId],
    warningBasis: `${kSaldo.toLocaleString()} soʻm qarzdor`,
    warningDate: formatCurrentDate(),
  };
  const res = await api.post(`/user-service/court-warnings/batch`, body, {
    responseType: "arraybuffer",
  });

  return res.data;
}
