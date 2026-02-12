import { Axios } from "axios";
import { Citizen } from "types/billing";

interface EmptyCitizen {
  id: null;
  birthDate: null;
  firstName: null;
  lastName: null;
  patronymic: null;
  passport: null;
  photo: "";
  email: null;
  inn: null;
  passportGivenDate: null;
  passportIssuer: null;
  passportExpireDate: null;
  foreignCitizen: boolean;
  pnfl: null;
}

/**
 * Fetches a citizen's information from the TozaMakon API.
 *
 * @param {Axios} tozaMakonApi - The Axios instance to use for the API request.
 * @param {Object} params - Parameters for the API request.
 * @param {string} [params.passport] - The passport number of the citizen.
 * @param {string} [params.birthdate] - The birthdate of the citizen in 'YYYY-MM-DD' format.
 * @param {string} [params.pinfl] - The personal identification number of the citizen.
 * @returns {Promise<Citizen>} A promise that resolves to the citizen information.
 */
export async function getCitizen(
  tozaMakonApi: Axios,
  params: {
    passport?: string;
    birthdate?: string;
    pinfl?: string;
    photoStatus?: "WITH_PHOTO" | "WITHOUT_PHOTO";
  }
): Promise<Citizen | EmptyCitizen> {
  return (
    await tozaMakonApi.get("/user-service/citizens", {
      params,
    })
  ).data;
}
