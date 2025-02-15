const { Schema, model, default: mongoose } = require("mongoose");

const schema = new Schema(
  {
    user: Object,
    data: Object,
    inspector_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    licshet: {
      type: String,
      required: true,
    },
    reUpdating: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
module.exports.CustomDataRequest = model("custom_data_request", schema);
