const { Schema, default: mongoose } = require("mongoose");

const schema = new Schema({
  type: {
    type: String,
    enum: ["akt_warning", "akt_canceled", "akt_deleted"],
    required: true,
  },
  message_id: {
    type: Number,
  },
  ariza_id: {
    type: Number,
    required: true,
  },
  status: {
    enum: ["new", "read"],
    type: String,
    required: true,
    default: "new",
  },
});

module.exports.Notification = mongoose.model("notification", schema);
