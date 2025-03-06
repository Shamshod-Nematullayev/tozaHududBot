// node modules
const fs = require("fs");
const https = require("https");
const path = require("path");
const xlsx = require("json-as-xlsx");
const htmlPDF = require("html-pdf");
const ejs = require("ejs");

// required functions
const { find_address_by_pinfil_from_mvd } = require("./api/mvd-pinfil");

// telegraf resources
const { Composer } = require("telegraf");
const { bot } = require("./core/bot");
const { keyboards } = require("./lib/keyboards");
const { messages } = require("./lib/messages");

// mongo models
const { Admin } = require("./models/Admin");
const { Company } = require("./models/Company");
const { Counter } = require("./models/Counter");
const { Guvohnoma } = require("./models/Guvohnoma");
const { Abonent } = require("./models/Abonent");
const { Bildirishnoma } = require("./models/SudBildirishnoma");
const { MultiplyRequest } = require("./models/MultiplyRequest");
const { CustomDataRequest } = require("./models/CustomDataRequest");
const { Nazoratchi } = require("./models/Nazoratchi");

module.exports = {
  // node modules
  fs,
  https,
  path,
  xlsx,
  htmlPDF,
  ejs,
  // required functions
  find_address_by_pinfil_from_mvd,
  // telegraf resourses
  Composer,
  bot,
  keyboards,
  messages,
  // mongo models
  Admin,
  Company,
  Counter,
  Guvohnoma,
  Abonent,
  Bildirishnoma,
  MultiplyRequest,
  CustomDataRequest,
  Nazoratchi,
};
