import { Axios } from 'axios';

let counter = 0;
let inactivityTimer: any = null;

export async function identificationAbonent(tozaMakonApi: Axios, residentId: number, value: boolean = true) {
  // 1. Har safar funksiya chaqirilganda eski taymerni tozalaymiz
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }

  // 2. Yangi harakatsizlik taymerini o'rnatamiz (70 soniya)
  inactivityTimer = setTimeout(() => {
    counter = 0;
    console.log('Harakatsizlik tufayli counter nolga tushirildi.');
  }, 70000);

  counter++;
  if (counter % 10 === 0 && counter !== 0) {
    await new Promise((resolve) => setTimeout(resolve, 70000));
    counter = 0;
  }
  return await tozaMakonApi.patch('/user-service/residents/identified', {
    identified: value,
    residentIds: [residentId],
  });
}
