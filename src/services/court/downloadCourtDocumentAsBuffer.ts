import axios from "axios";

interface Response {
  data: string; //base64
  name: string;
  type: string;
  size: number;
}

const downloadCourtDocumentAsBuffer = async (id: string): Promise<Response> => {
  return (await axios.get(`cabinet/case/download_as_buffer/${id}`)).data;
};

export default downloadCourtDocumentAsBuffer;
