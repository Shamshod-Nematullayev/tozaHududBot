import { Axios } from 'axios';
import { AbonentSearchQuery, IAbonent } from 'types/billing';

export async function searchAbonent(
  tozaMakonApi: Axios,
  query: AbonentSearchQuery
): Promise<{ content: IAbonent[]; totalPages: number; totalElements: number }> {
  console.log(query);
  const data = (
    await tozaMakonApi.get('/user-service/residents', {
      params: query,
    })
  ).data;

  return data;
}
