import { Schema, model } from "mongoose";

const schema = new Schema({
  name: String,
  items: Array(),
});

export const SudMaterial = model("sud_material", schema);
