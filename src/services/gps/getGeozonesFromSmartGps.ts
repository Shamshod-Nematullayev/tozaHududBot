import { Axios } from "axios";

export async function getGeozonesFromSmartGps(smartGpsApi: Axios, ): Promise<any[]> {
    let itemId //
    const res = await smartGpsApi.post('/wialon/ajax.html?svc=core/batch', {
        params: JSON.stringify({
            svc: "core/batch",
            params: {
                svc: "resource/get_notification_data",
                params: {
                    itemId: 
                }
            }
        })
    })
}