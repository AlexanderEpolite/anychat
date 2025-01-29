import {connect, model, Schema} from "mongoose";
import type { IMessage } from "./types/IMessage";
import type { IChannel } from "./types/IChannel";

const username = process.env["MONGO_USERNAME"];
const password = process.env["MONGO_PASSWORD"];

await connect(`mongodb://${username}:${password}@127.0.0.1:27017/any-chat`);

const message = new Schema<IMessage>({
    text: {type: String, required: true, trim: true, maxlength: 500},
    channel: {type: String, required: true, index: true, trim: true, maxlength: 16},
    createdAt: {type: Date, default: Date.now, index: true, expires: 60 * 60 * 24 * 1000}, //1 day ttl
});

export const Message = model<IMessage>("Message", message);

const channel = new Schema<IChannel>({
    name: {type: String, required: true, index: true, trim: true, maxlength: 100},
    createdAt: {type: Date, default: Date.now, expires: 60 * 60 * 1000}, //1 hour ttl
});

export const Channel = model<IChannel>("Channel", channel);