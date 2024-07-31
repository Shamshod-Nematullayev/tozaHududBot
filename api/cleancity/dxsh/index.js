const getAbonentDXJ = require("./getAbonentDXJ");
const getAbonentCardHtml = require("./getAbonentCardHTML");
const getAbonentSaldoData = require("./getAbonentSaldoData");
const getAbonentDataByLicshet = require("./getAbonentData");
const enterYashovchiSoniAkt = require("./enterYashovchiSoniAkt");
const enterWarningLetterToBilling = require("./enterWarningLetterToBilling");
const enterQaytaHisobAkt = require("./enterQaytaHisobAkt");
const getLastAlertLetter = require("./getLastAlertLetter");
const confirmNewWarningLetterByLicshet = require("./confirmNewWarningLetterByLicshet");

module.exports = {
  getAbonentCardHtml,
  getAbonentSaldoData,
  getAbonentDXJ,
  getAbonentDataByLicshet,
  enterYashovchiSoniAkt,
  enterWarningLetterToBilling,
  enterQaytaHisobAkt,
  getLastAlertLetter,
  confirmNewWarningLetterByLicshet,
};
