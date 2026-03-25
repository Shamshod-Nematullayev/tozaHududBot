import { Axios } from 'axios';

interface CadastrDetais {
  cadastralNumber: string | null;
  fullAddress: string | null;
  houseNumber: string | null;
  houseType: string | null;
  isLegal: boolean;
  numberOfOwners: number;
  objectType: string | null;
  owners: {
    inn: string;
    name: string;
    passport: string;
    percent: string;
    pinfl: string;
    type: string;
  }[];
  registeredDate: string | null;
  streetName: string | null;
}

export const getCadastrDetailsService = async (
  tozaMakonApi: Axios,
  cadastralNumber: string
): Promise<CadastrDetais> => {
  return (
    await tozaMakonApi.get('/user-service/houses/cadastral', {
      params: {
        cadNum: cadastralNumber,
      },
    })
  ).data;
};
