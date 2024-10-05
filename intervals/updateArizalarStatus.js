const {
  getAktsFromPacket,
} = require("../api/cleancity/dxsh/getAktsFromPacket");
const { bot } = require("../core/bot");
const { Ariza } = require("../models/Ariza");
const { NOTIFICATIONS_CHANNEL_ID } = require("../constants");
const { Notification } = require("../models/Notification");
const { Markup } = require("telegraf");
const dvaynik_bekor_qilish_pachka_id = 4442829;

const callbackFunction = async function () {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const arizalar = await Ariza.find({
      status: "tasdiqlangan",
      akt_date: {
        $gte: startOfMonth,
        $lt: now,
      },
    });
    const pachka_ids = [];
    arizalar.forEach((ariza) => {
      pachka_ids.includes(ariza.akt_pachka_id)
        ? null
        : pachka_ids.push(ariza.akt_pachka_id);
    });
    let counter = 0;
    const fetchPachka = async () => {
      if (counter == pachka_ids.length) return;
      const pachka_id = pachka_ids[counter];
      const aktlar = (await getAktsFromPacket(pachka_ids[counter])).rows;
      if (aktlar.length < 1) {
        throw new Error(`Aktlar bazadan olib bo'lmadi`, pachka_ids[counter]);
      }
      let i = 0;
      const checkAkt = async () => {
        const filteredArizalar = arizalar.filter(
          (a) =>
            a.akt_pachka_id === pachka_id &&
            a.status == "tasdiqlangan" &&
            a.akt_id
        );
        if (i == filteredArizalar.length) {
          counter++;
          fetchPachka();
          return;
        }
        const ariza = filteredArizalar[i];
        const akt = aktlar.find((akt) => akt.id == ariza.akt_id);
        if (!akt) {
          const existing_notification = await Notification.findOne({
            ariza_id: ariza._id,
            type: "akt_deleted",
          });
          if (existing_notification) {
            i++;
            return await checkAkt();
          }
          const notification = await Notification.create({
            ariza_id: ariza._id,
            status: "new",
            type: "akt_deleted",
          });
          const msg = await bot.telegram.sendMessage(
            NOTIFICATIONS_CHANNEL_ID,
            `⚠️Akt topilmadi⚠️\nakt_id: <code>${ariza.akt_id}</code> pachka_id: <code>${ariza.akt_pachka_id}</code>\n ariza_number: <code>${ariza.document_number}</code>`,
            {
              reply_markup: Markup.inlineKeyboard([
                [
                  Markup.button.callback(
                    "mark as read",
                    `notification_${notification._id}`
                  ),
                ],
              ]).reply_markup,
              parse_mode: "HTML",
            }
          );
          await notification.updateOne({
            $set: { message_id: msg.message_id },
          });
          await ariza.updateOne({
            $set: {
              akt_statuses_name: "bekor qilindi",
              canceling_description: "Akt bekor qilingan",
              is_canceled: true,
            },
          });
          i++;
          return await checkAkt();
        }
        switch (akt.akt_statuses_name) {
          case "Tasdiqlangan bekor qilindi":
            {
              const canceling_description = akt.rejected_description
                ? akt.rejected_description
                : akt.warning_description;
              const existing_notification = await Notification.findOne({
                ariza_id: ariza._id,
                type: "akt_canceled",
              });
              if (existing_notification) {
                i++;
                return await checkAkt();
              }
              const notification = await Notification.create({
                ariza_id: ariza._id,
                status: "new",
                type: "akt_canceled",
              });
              const msg = await bot.telegram.sendMessage(
                NOTIFICATIONS_CHANNEL_ID,
                `⚠️Akt bekor qilingan⚠️\nakt_id: <code>${ariza.akt_id}</code> pachka_id: <code>${ariza.akt_pachka_id}</code>\n ariza_number: <code>${ariza.document_number}</code>\nAsos: ${canceling_description}`,
                {
                  reply_markup: Markup.inlineKeyboard([
                    [
                      Markup.button.callback(
                        "mark as read",
                        `notification_${notification._id}`
                      ),
                    ],
                  ]).reply_markup,
                  parse_mode: "HTML",
                }
              );
              await notification.updateOne({
                $set: { message_id: msg.message_id },
              });
              await ariza.updateOne({
                $set: {
                  akt_statuses_name: "bekor qilindi",
                  canceling_description,
                  is_canceled: true,
                },
              });
              i++;
              return await checkAkt();
            }
            break;
          case "Камчилик тўғирланди":
            console.log("Камчилик тўғирланди", akt.licshet);
            await ariza.updateOne({
              $set: {
                akt_statuses_name: "Камчилик тўғирланди",
                is_canceled: false,
              },
            });
            i++;
            return await checkAkt();
            break;
          case "Огоҳлантирилди": {
            console.log("Огоҳлантирилди", akt.licshet);
            const existing_notification = await Notification.findOne({
              ariza_id: ariza._id,
              type: "akt_warning",
            });
            if (existing_notification) {
              i++;
              return await checkAkt();
            }
            const notification = await Notification.create({
              ariza_id: ariza._id,
              status: "new",
              type: "akt_warning",
            });
            const msg = await bot.telegram.sendMessage(
              NOTIFICATIONS_CHANNEL_ID,
              `⚠️Akt ogohlantirildi⚠️\nakt_id: <code>${ariza.akt_id}</code> pachka_id: <code>${ariza.akt_pachka_id}</code>\n ariza_number: <code>${ariza.document_number}</code>`,
              {
                reply_markup: Markup.inlineKeyboard([
                  [
                    Markup.button.callback(
                      "mark as read",
                      `notification_${notification._id}`
                    ),
                  ],
                ]).reply_markup,
                parse_mode: "HTML",
              }
            );
            await notification.updateOne({
              $set: { message_id: msg.message_id },
            });
            i++;
            await checkAkt();
            break;
          }
          case "Tasdiqlandi":
            i++;
            console.log("Tasdiqlandi", akt.licshet);
            return await checkAkt();
            break;
          case "Yangi":
            console.log("Yangi", akt.licshet);
            if (akt.stack_akts_id != dvaynik_bekor_qilish_pachka_id) {
              const existing_notification = await Notification.findOne({
                ariza_id: ariza._id,
                type: "akt_not_confirmed",
              });
              if (existing_notification) {
                i++;
                return await checkAkt();
              }
              const notification = await Notification.create({
                ariza_id: ariza._id,
                type: "akt_not_confirmed",
              });
              const msg = await bot.telegram.sendMessage(
                NOTIFICATIONS_CHANNEL_ID,
                `⚠️Akt tasdiqlanmagan⚠️\nakt_id: <code>${ariza.akt_id}</code> pachka_id: <code>${ariza.akt_pachka_id}</code>\n ariza_number: <code>${ariza.document_number}</code>`,
                {
                  reply_markup: Markup.inlineKeyboard([
                    [
                      Markup.button.callback(
                        "mark as read",
                        `notification_${notification._id}`
                      ),
                    ],
                  ]).reply_markup,
                  parse_mode: "HTML",
                }
              );
              await notification.updateOne({
                $set: { message_id: msg.message_id },
              });
            }
            i++;
            await checkAkt();
            break;
          default:
            throw new Error(
              "Noma'lum akt statusi aniqlandi" + JSON.stringify(akt)
            );
        }
      };
      await checkAkt();
    };
    fetchPachka();
  } catch (error) {
    console.error(error.message);
  }
};

setInterval(async () => {
  try {
    const now = new Date();
    function isThisTime(minut) {
      const currentHour = now.getHours();
      const currentMinut = now.getMinutes();
      return currentMinut == minut;
    }
    if (isThisTime(15) || isThisTime(45)) {
      await callbackFunction();
    }
  } catch (error) {
    console.error(
      "updateArizalarStatus intervalida xatolik kuzatildi " + error.message
    );
  }
}, 1000 * 60);
