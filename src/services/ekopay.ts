import { Axios } from "axios";

interface IDataRow {
  accepted_transactions_count: number;
  accepted_transactions_sum: number;
  all_transactions_count: number;
  all_transactions_sum: number;
  branchs_level: number;
  cancel_transactions_count: number;
  cancel_transactions_sum: number;
  cash_transaction_cnt: number;
  cash_transaction_sum: number;
  humo_transaction_cnt: number;
  humo_transaction_sum: number;
  id: number;
  name: string;
  ordering: null;
  progress_transactions_count: number;
  progress_transactions_sum: number;
  uzcard_transaction_cnt: number;
  uzcard_transaction_sum: number;
}

function getTodayDateFormat(): string {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

export async function getIncomeReportFromInspectors(
  ekopayApi: Axios,
  params: {
    parent_id: number;
    date_from: string;
    date_to: string;
    companies_id: number;
    sys_companies_id: number;
  } = {
    parent_id: 32,
    date_from: getTodayDateFormat(),
    date_to: getTodayDateFormat(),
    companies_id: 1144,
    sys_companies_id: 503,
  }
): Promise<IDataRow[]> {
  return (
    await ekopayApi.get(
      "/ecopay/transaction-report;descending=false;page=1;perPage=100",
      {
        headers: { login: "dxsh24107" },
        params: {
          ...params,
        },
      }
    )
  ).data.rows;
}
