import { Axios } from 'axios';

export interface PermamentPerson {
  DateBirth: string;
  Id: string;
  Person: string;
  Pinpp: string;
  RegistrationDate: string;
  Sex: string;
  Status: number;
}

export interface House {
  cadastralNumber: string;
  fullAddress: string;
  houseNumber: string;
  houseType: string;
  isLegal: boolean;
  numberOfOwners: number;
  objectType: string;
  streetName: string;
  owners: {
    name: string;
    passport: string;
    pinfl: string;
    type: string;
  }[];
}

export interface PermamentsResponse {
  Data: {
    PermanentPersons: PermamentPerson[] | null;
    TemproaryPersons: PermamentPerson[] | null;
  };
  house: House | null;
}

export async function getIIBInhabitants(tozaMakonApi: Axios, cadastralNumber: string): Promise<PermamentsResponse> {
  return (
    await tozaMakonApi.get('/user-service/mvds/permanent-person', {
      params: {
        cad: cadastralNumber,
      },
    })
  ).data;
}
