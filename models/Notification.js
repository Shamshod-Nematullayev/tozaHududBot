const { Schema, default: mongoose } = require("mongoose");

const senderSchema = new Schema({
  id: String,
  name: String,
  phone: String,
  email: String,
  role: String,
});

const receiverSchema = new Schema({
  id: String,
  name: String,
  phone: String,
  email: String,
});

const schema = new Schema(
  {
    type: {
      type: String,
      enum: ["alert", "info", "task"],
      required: true,
    },
    message: String,
    ariza_id: String,
    status: {
      enum: ["new", "read"],
      type: String,
      required: true,
      default: "new",
    },
    sender: senderSchema,
    receiver: receiverSchema,
    params: Object,
  },
  { timestamps: true, versionKey: false }
);

module.exports.Notification = mongoose.model("notification", schema);
