import { Axios } from 'axios';

export async function confirmActTozamakon(tozaMakonApi: Axios, actIds: number[]) {
  return await tozaMakonApi.patch('/billing-service/acts', {
    actStatus: 'CONFIRMED',
    id: actIds,
  });
}
