// Aktni yangilash yoki yaratish
async function updateOrCreateAct(
  ariza,
  allAmount,
  amountWithQQS,
  amountWithoutQQS,
  description,
  inhabitantCount,
  fileId,
  kSaldo,
  actType,
  residentId,
  req
) {
  const body = {
    actType,
    amount: allAmount,
    amountWithQQS,
    amountWithoutQQS,
    description,
    fileId,
    kSaldo,
    residentId,
  };

  if (inhabitantCount) body.inhabitantCount = inhabitantCount;

  const tozaMakonApi = createTozaMakonApi(ariza.companyId);

  if (ariza.actStatus === "WARNED" || ariza.actStatus === "NEW") {
    return (
      await tozaMakonApi.put(`/billing-service/acts/${ariza.akt_id}`, {
        id: ariza.akt_id,
        ...body,
      })
    ).data;
  } else {
    const packId = (await Company.findOne({ id: req.user.companyId }))
      .akt_pachka_ids;
    const date = new Date();
    return (
      await tozaMakonApi.post("/billing-service/acts", {
        ...body,
        endPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
        startPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
        actPackId: packId[ariza.document_type].id,
      })
    ).data;
  }
}
