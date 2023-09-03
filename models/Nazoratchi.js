const { default: mongoose } = require("mongoose");

const schema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },

  nowUser: String,
  activ: {
    type: Boolean,
    default: true,
  },
  biriktirilgan: Array,
});

// id: ekopay tizimida nazoratchi nomiga yaratilgan id
// name: nazoratchining Familiya ism sharifi
// nowUser: hozirgi kunda apparatdan foydalanayotgan xodimning fish
// activ: hozirgi kunda ishlayaptimi yoki yo'q
// biriktirilgan: Shu nazoratchiga biriktirilgan mahallalar

module.exports.Nazoratchi = mongoose.model("inpektor", schema);
