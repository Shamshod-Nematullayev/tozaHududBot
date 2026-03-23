import { Axios } from 'axios';

interface Payload {
  residentId: number;
  inhabitantCount: number;
  fileId: string;
}

export async function addInhabitantsToAbonent(tozaMakonApi: Axios, payload: Payload) {
  return await tozaMakonApi.patch(`/billing-service/residents/${payload.residentId}/inhabitant`, payload);
}
