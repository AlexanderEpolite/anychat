import Elysia, { t } from "elysia";
import { Channel, Message } from "./models";
import staticPlugin from "@elysiajs/static";

const app = new Elysia()
    .use(staticPlugin({
        prefix: "/",
    }))
    .post("/messages", async (ctx) => {
        const { message, channel } = ctx.body;
        
        let c = await Channel.findOne({
            name: channel,
        });
        
        if (!c) {
            if(await Channel.countDocuments() >= 100) {
                ctx.set.status = 400;
                
                return {
                    error: "Too many channels",
                };
            }
            
            if(!channel.match(/^[a-zA-Z0-9_-]+$/)) {
                ctx.set.status = 400;
                
                return {
                    error: "Invalid channel name",
                };
            }
            
            c = await Channel.create({
                name: channel,
            });
            
            app.server?.publish("channels", JSON.stringify({name: c.name}));
        }
        
        const m = await Message.create({
            text: message,
            channel,
        });
        
        //if channel has more than 100 messages, delete the oldest one
        if(await Message.countDocuments({channel}) > 100) {
            const oldest = await Message.findOne({channel}).sort({createdAt: 1});
            oldest && await Message.deleteOne({_id: oldest._id});
        }
        
        app.server?.publish(c.name, JSON.stringify({
            channel: c.name,
            message: m.text,
        }));
        
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
        
        if(c) {
            return c;
        }
        
        if(await Channel.countDocuments() >= 100) {
            ctx.set.status = 400;
            
            return {
                error: "Too many channels",
            };
        }
        
        if(!channel.match(/^[a-zA-Z0-9_-]+$/)) {
            ctx.set.status = 400;
            
            return {
                error: "Invalid channel name",
            };
        }
        
        const newChannel = await Channel.create({
            name: channel,
        });
        
        app.server?.publish("channels", JSON.stringify({newChannelName: newChannel.name}));
        
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
        
        const c = await Channel.findOne({
            name: channel,
        });
        
        if(!c) {
            ctx.set.status = 404;
            
            return {
                error: "Channel not found",
            };
        }
        
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
            channel: t.Optional(t.String({
                minLength: 1,
                maxLength: 16,
            })),
            keepAlive: t.Optional(t.Boolean()),
        }),
        
        message(ws, message) {
            message.channel && ws.subscribe(message.channel);
        },
        
        open(ws) {
            ws.subscribe("channels");
        },
    })
    .listen(3579);