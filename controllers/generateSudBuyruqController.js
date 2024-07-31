const { SudMaterial } = require("../models/SudMaterial");
const fs = require("fs");
const {
  Document,
  TextRun,
  Packer,
  Paragraph,
  PageBreak,
  LevelFormat,
  AlignmentType,
} = require("docx");
const { kirillga } = require("../middlewares/smallFunctions/lotinKiril");
const path = require("path");

// Documents contain sections, you can have multiple sections per document, go here to learn more about sections
// This simple example will only contain one section
// small function for text
function toTitleCase(str) {
  return str.toLowerCase().replace(/\b\w/g, function (char) {
    return char.toUpperCase();
  });
}
function cmToTwentieths(cm) {
  return Math.round(cm * 28.3464567);
}
const topMarginCm = 10.5;
const leftMarginCm = 30;
const bottomMarginCm = 10.5;
const rightMarginCm = 10.5;
const topMargin = cmToTwentieths(topMarginCm);
const leftMargin = cmToTwentieths(leftMarginCm);
const bottomMargin = cmToTwentieths(bottomMarginCm);
const rightMargin = cmToTwentieths(rightMarginCm);
function createNewSudBuyruq({
  licshet,
  sud_ijro_raqami,
  sana,
  sudya_name,
  javobgar_name,
  mfy_name,
  javobgar_tugilgan_sanasi,
  pinfl,
  passport_seriya,
  qarzdorlik,
}) {
  mfy_name[0] = mfy_name[0].toUpperCase();
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "my-numbering",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.START,
              style: {
                paragraph: {
                  indent: { left: 600, hanging: 350 },
                },
                run: {
                  font: "Cambria",
                  size: 28,
                },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1.5 * 567, // 567 twips = 1cm
              left: 3 * 567, // 567 twips = 1cm
              bottom: 1.5 * 567, // 567 twips = 1cm
              right: 1.5 * 567, // 567 twips = 1cm
            },
          },
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "СУД  БУЙРУҒИ",
                bold: true,
                font: "Cambria",
                size: 28,
              }),
            ],
            alignment: "center",
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: sud_ijro_raqami,
                font: "Cambria",
                size: 28,
              }),
            ],
            alignment: "right",
          }),
          new Paragraph({
            children: [], // Just newline without text
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `        ${sana.split("-")[2]}.${sana.split("-")[1]}.${
                  sana.split("-")[0]
                } йилда фуқаролик ишлари бўйича Каттақўрғон туманлараро судининг судяси ${kirillga(
                  toTitleCase(sudya_name)
                )}, аризачи Каттақўрғон прокурори  “Анваржон Бизнес Инвест” МЧЖ манфаатини кўзлаб қарздор ${kirillga(
                  toTitleCase(javobgar_name)
                )}дан дебитор қарздорликни ундириш ҳақида суд буйруғини чиқариш тўғрисидаги аризасини кўриб чиқиб, Ўзбекистон Республикаси ФПК 171-моддаси б-банди ва 172- моддаларини қўллаб,`,
                font: "Cambria",
                size: 28,
              }),
            ],
            alignment: "both",
          }),
          new Paragraph({
            children: [], // Just newline without text
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "БУЮРАМАН:",
                bold: true,
                font: "Cambria",
                size: 28,
              }),
            ],
            alignment: "center",
          }),
          new Paragraph({
            children: [], // Just newline without text
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `        Қарздор, Каттақўрғон тумани, “${kirillga(
                  mfy_name
                )}” МФЙда яшовчи (${javobgar_tugilgan_sanasi} йилда туғилган, фуқаролик паспорт маълумотлари ${passport_seriya}, ЖШШИР: ${pinfl}, лицавой: ${licshet}, иш жойи номаълум) ${kirillga(
                  toTitleCase(javobgar_name)
                )}дан ундирувчи “Анваржон Бизнес Инвест” МЧЖнинг фойдасига маиший чиқиндиларни олиб чиқиш учун жами ${qarzdorlik.toLocaleString(
                  "en-US"
                )} сўм ва 17.000 сўм олдиндан тўланган почта харажати ундирилсин.`,
                font: "Cambria",
                size: 28,
              }),
            ],
            alignment: "both",
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Қарздор ${kirillga(
                  toTitleCase(javobgar_name)
                )}дан асосий қарз ${qarzdorlik.toLocaleString(
                  "en-US"
                )} сўм Банк: “Ориент Финанс банк” АТБ (МФО:01037, ИНН:303421898, Х/Р:22604000105565269040) га ундирилсин`,
                font: "Cambria",
                size: 28,
              }),
            ],
            numbering: {
              reference: "my-numbering",
              level: 0,
            },
            alignment: "both",
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Қарздор ${kirillga(
                  toTitleCase(javobgar_name)
                )}дан почта ҳаражати 17.000 сўм (МФО 01097, Х/Р:20208000900611603001, ИНН:303421898)га ундирилсин.`,
                font: "Cambria",
                size: 28,
              }),
            ],
            numbering: {
              reference: "my-numbering",
              level: 0,
            },
            alignment: "both",
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Қарздор ${kirillga(
                  toTitleCase(javobgar_name)
                )}дан давлат фойдасига 340.000 сўм миқдорида давлат божи ундирилсин.`,
                font: "Cambria",
                size: 28,
              }),
            ],
            numbering: {
              reference: "my-numbering",
              level: 0,
            },
            alignment: "both",
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `        Суд буйруғининг кўчирма нусхасини олган кундан эътиборан ўн кунлик муддат ичида қарздор арз қилинган талабга қарши ўз эътирозларини буйруқни чиқарган судга юборишга ҳақли.`,
                font: "Cambria",
                size: 28,
              }),
            ],
            alignment: "both",
          }),
          new Paragraph({ children: [] }),
          new Paragraph({ children: [] }),
          new Paragraph({
            children: [
              new TextRun({
                text: `${
                  sudya_name == "RAVSHANOV ZAFAR USMANOVICH"
                    ? "Суд раиси"
                    : "Судья"
                }                                                                      ${kirillga(
                  toTitleCase(
                    sudya_name.split(" ")[1][0] +
                      ". " +
                      sudya_name.split(" ")[2][0] +
                      ". " +
                      sudya_name.split(" ")[0]
                  )
                )}`,
                bold: true,
                font: "Cambria",
                size: 28,
              }),
            ],
            alignment: "center",
          }),
        ],
      },
    ],
  });

  // Used to export the file into a .docx file
  return Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync(
      path.join(
        "./uploads/sudBuyruqlari/" + sudya_name + "/" + licshet + ".docx"
      ),
      buffer
    );
    console.log(licshet, "done");
    return { success: true };
  });
}

module.exports = { createNewSudBuyruq };
