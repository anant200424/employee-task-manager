import mongoose, { Document, Schema } from "mongoose";

export interface IMessage extends Document {
  senderName: string;
  senderRole: string;
  content: string;
  type: "announcement" | "discussion";
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    senderName: {
      type: String,
      required: [true, "Sender name is required"],
      trim: true,
    },
    senderRole: {
      type: String,
      default: "Software Engineer",
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["announcement", "discussion"],
      default: "discussion",
    },
  },
  { timestamps: true },
);

const Message =
  mongoose.models.Message || mongoose.model<IMessage>("Message", messageSchema);

export default Message;
