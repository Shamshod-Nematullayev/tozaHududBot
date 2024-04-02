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

// Documents contain sections, you can have multiple sections per document, go here to learn more about sections
// This simple example will only contain one section
// small function for text
function toTitleCase(str) {
  return str.toLowerCase().replace(/\b\w/g, function (char) {
    return char.toUpperCase();
  });
}
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
        properties: {},
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
                text: `        ${sana} йилда фуқаролик ишлари бўйича Каттақўрғон туманлараро судининг судяси ${kirillga(
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
                text: `        Қарздор, Каттақўрғон тумани, “${mfy_name}” МФЙда яшовчи (${javobgar_tugilgan_sanasi} йилда туғилган, фуқаролик паспорт маълумотлари ${passport_seriya}, ЖШШИР: ${pinfl}, лицавой: ${licshet}, иш жойи номаълум) ${javobgar_name}дан ундирувчи “Анваржон Бизнес Инвест” МЧЖнинг фойдасига маиший чиқиндиларни олиб чиқиш учун жами ${qarzdorlik.toLocaleString(
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
                text: `Қарздор ${javobgar_name}дан асосий қарз ${qarzdorlik.toLocaleString(
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
                text: `Қарздор ${javobgar_name}дан почта ҳаражати 17.000 сўм (МФО 01097, Х/Р:20208000900611603001, ИНН:303421898)га ундирилсин.`,
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
                text: `Қарздор ${javobgar_name}дан давлат фойдасига 340.000 сўм миқдорида давлат божи ундирилсин.`,
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
                text: `Суд раиси                                                                                ${kirillga(
                  toTitleCase(sudya_name)
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
    fs.writeFileSync("./uploads/sudBuyruqlari/" + licshet + ".docx", buffer);
    console.log(licshet, "done");
    return { success: true };
  });
}
s;

module.exports = { createNewSudBuyruq };
