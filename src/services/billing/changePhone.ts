import { Axios } from "axios";

interface Payload {
  phoneNumber: string;
  residentId: number;
}

export async function changePhone(tozaMakonApi: Axios, payload: Payload) {
  return await tozaMakonApi.patch(
    "/user-service/residents/change-phone/" + payload.residentId,
    payload
  );
}
