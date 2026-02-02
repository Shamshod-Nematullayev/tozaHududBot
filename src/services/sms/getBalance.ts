import { Axios } from "axios";

interface Response {
  data: {
    balance: number;
  };
  status: "success" | "error";
}

export async function getBalance(eskiz: Axios): Promise<Response> {
  return (await eskiz.get("/user/get-limit")).data;
}
