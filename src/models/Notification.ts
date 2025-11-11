import mongoose, { Schema } from "mongoose";

interface IUserSchema {
  id: string;
  name: string;
  role?: string;
}

interface INotification {
  type: "alert" | "info" | "task";
  message: string;
  sender: IUserSchema;
  receiver: IUserSchema;
  status: "new" | "read";
  data: object;
}

const senderSchema = new Schema<IUserSchema>({
  id: String,
  name: String,
  role: String,
});

const receiverSchema = new Schema<IUserSchema>({
  id: String,
  name: String,
});

const schema = new Schema<INotification>(
  {
    type: {
      type: String,
      enum: ["alert", "info", "task"],
      required: true,
    },
    message: String,
    status: {
      enum: ["new", "read"],
      type: String,
      required: true,
      default: "new",
    },
    sender: senderSchema,
    receiver: receiverSchema,
    data: Object,
  },
  { timestamps: true, versionKey: false }
);

export const Notification = mongoose.model("notification", schema);
