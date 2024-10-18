const { Schema, default: mongoose } = require("mongoose");

const schema = new Schema({
  type: {
    type: String,
    enum: ["akt_warning", "akt_canceled", "akt_deleted", "akt_not_confirmed", ],
    required: true,
  },
  message_id: {
    type: Number,
  },
  ariza_id: {
    type: String,
    required: true,
  },
  status: {
    enum: ["new", "read"],
    type: String,
    required: true,
    default: "new",
  },
  params: Object
});

module.exports.Notification = mongoose.model("notification", schema);
