import axios from "axios";

interface IElectricCheck {
  fio: string;
  address: string;
  pay_type?: string;
  region?: string;
  subRegion: string;
  account: string;
  balance?: string;
  last_paid_date?: string;
  last_paid?: string;
}

export async function getElectricResidentDetails({
  accountNumber,
  region,
  caoto,
}: {
  accountNumber: string;
  region: number;
  caoto: number;
}): Promise<IElectricCheck | null> {
  let data = (
    await axios.post("https://api-e3abced5.payme.uz/api/cheque.create", {
      method: "cheque.create",
      params: {
        amount: 50000,
        merchant_id: "5a5dffd8687ee421a5c4b0e6",
        account: {
          account: accountNumber,
          region: region,
          subRegion: caoto,
        },
      },
    })
  ).data?.result?.cheque; //.account;
  let arr: any[] = data?.account;
  if (!arr) return null;
  // .cheque.account as {
  //   name: "fio" | "address" | "pay_type" | "region" | "subRegion" | "account";
  //   title: string;
  //   value: string;
  //   main: boolean;
  // }[];
  const details: any = {};
  arr.forEach((d) => {
    details[d.name] = d.value;
  });

  return details;
}
