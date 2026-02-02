import { Axios } from "axios";

export interface Response {
  data: ResponseData;
  status: number;
  statusText: string;
}

export interface ResponseData {
  id: number | null;
  message: Message;
  smsc_data: SmscData;
  sent_at: string | null;
  submit_sm_resp_at: string | null;
  delivery_sm_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  request_id: string;
  price: number;
  total_price: number;
  is_ad: boolean;
  nick: string;
  to: string;
  message: string;
  encoding: number;
  parts_count: number;
  parts: {
    msgid: {
      group: number;
      accepted: boolean;
      dlr_time: string | null;
      dlr_state: string | null;
      part_index: number;
      accept_time: string | null;
      accept_status: number;
    };
  };
}

export interface SmscData {
  msgid: string[];
}

export async function getStatusById(eskiz: Axios, id: number | string) {
  return (await eskiz.get("/message/sms/status_by_id/" + id)).data;
}
