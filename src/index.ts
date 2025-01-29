import Elysia, { t } from "elysia";
import { Channel, Message } from "./models";
import staticPlugin from "@elysiajs/static";

new Elysia()
    .use(staticPlugin())
    .post("/messages", async (ctx) => {
        const { message, channel } = ctx.body;
        
        const c = await Channel.findOne({
            name: channel,
        });
        
        if (!c) {
            await Channel.create({
                name: channel,
            });
        }
        
        const m = await Message.create({
            text: message,
            channel,
        });
        
        return m;
    }, {
        body: t.Object({
            message: t.String({
                minLength: 1,
                maxLength: 500,
            }),
            channel: t.String({
                minLength: 1,
                maxLength: 16,
            }),
        })
    })
    .post("/channels", async (ctx) => {
        const { channel } = ctx.body;
        
        const c = await Channel.findOne({
            name: channel,
        });
        
        if (c) {
            return c;
        }
        
        const newChannel = await Channel.create({
            name: channel,
        });
        
        return newChannel;
    }, {
        body: t.Object({
            channel: t.String({
                minLength: 1,
                maxLength: 16,
            }),
        })
    })
    .get("/channels", async () => {
        const channels = await Channel.find();
        
        return channels;
    })
    .get("/messages", async (ctx) => {
        const { channel } = ctx.query;
        
        const messages = await Message.find({
            channel,
        });
        
        return messages;
    }, {
        query: t.Object({
            channel: t.String({
                minLength: 1,
                maxLength: 16,
            }),
        })
    })
    .ws("/messages", {
        body: t.Object({
            channel: t.String({
                minLength: 1,
                maxLength: 16,
            }),
        }),
        message(ws, message) {
            ws.subscribe(message.channel);
        },
    })
    .listen(3579);