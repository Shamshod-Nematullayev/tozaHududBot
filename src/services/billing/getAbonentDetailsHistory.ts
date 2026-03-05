import { Axios } from 'axios';
import { AbonentDetailsHistoryRow } from 'types/billing';

export async function getAbonentDetailsHistory(
  tozaMakonApi: Axios,
  residentId: number,
  params: {
    page: number;
    size: number;
  } = {
    size: 100,
    page: 0,
  }
): Promise<AbonentDetailsHistoryRow[]> {
  return (
    await tozaMakonApi.get(`/auditing-service/audits/${residentId}`, {
      params: {
        ...params,
      },
    })
  ).data.content;
}
