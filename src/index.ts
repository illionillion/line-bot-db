import {
  middleware,
  MiddlewareConfig,
  WebhookEvent,
  TextMessage,
  MessageAPIResponseBase,
} from "@line/bot-sdk";
import {
  MessagingApiClient,
  MessagingApiBlobClient,
} from "@line/bot-sdk/dist/messaging-api/api";
import express, { Application, Request, Response } from "express";
import { load } from "ts-dotenv";
import { downloadContent } from "./lib/downloadContent";
import sqlite3 from "sqlite3";
import path from "path";

const env = load({
  CHANNEL_ACCESS_TOKEN: String,
  CHANNEL_SECRET: String,
  PORT: Number,
});

const PORT = env.PORT || 3000;
const db = new sqlite3.Database("db.sqlite3");

const config = {
  channelAccessToken: env.CHANNEL_ACCESS_TOKEN || "",
  channelSecret: env.CHANNEL_SECRET || "",
};
const middlewareConfig: MiddlewareConfig = config;
const client = new MessagingApiClient({
  channelAccessToken: env.CHANNEL_ACCESS_TOKEN || "",
});
const clientB = new MessagingApiBlobClient({
  channelAccessToken: env.CHANNEL_ACCESS_TOKEN || "",
});

const app: Application = express();
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use("/public", express.static(path.join(__dirname, "/public/")));

app.get("/", async (_: Request, res: Response) => {
  db.serialize(() => {
    db.all("select * from message_table", (err, rows) => {
      if (!err) {
        const data = {
          content: rows,
        };
        res.render("index", data);
      }
    });
  });
});

const textEventHandler = async (
  event: WebhookEvent
): Promise<MessageAPIResponseBase | undefined> => {
  if (event.type !== "message") {
    return;
  }

  const { replyToken, source } = event;

  switch (event.message.type) {
    case "text": {
      const { text } = event.message;

      const resText = (() => {
        switch (Math.floor(Math.random() * 3)) {
          case 0:
            return text.split("").reverse().join("");
          case 1:
            return text.split("").join(" ");
          default:
            return text.split("").reverse().join(" ");
        }
      })();
      console.log(resText);
      db.run(
        "insert into message_table (user_id, content) values (?, ?)",
        source.userId,
        text
      );

      const response: TextMessage = {
        type: "text",
        text: resText,
      };
      await client.replyMessage({
        replyToken: replyToken,
        messages: [response],
      });
      break;
    }
    case "image": {
      const { id } = event.message;
      const image_path = "/public/images/" + source.userId + "-" + id + ".jpeg";
      await downloadContent(id, image_path, clientB);
      db.run(
        "insert into message_table (user_id, image_path) values (?, ?)",
        source.userId,
        image_path
      );
      const response: TextMessage = {
        type: "text",
        text: "画像を受け取りました。",
      };
      await client.replyMessage({
        replyToken: replyToken,
        messages: [response],
      });
      break;
    }
    default:
      break;
  }
};

app.post(
  "/webhook",
  middleware(middlewareConfig),
  async (req: Request, res: Response): Promise<Response> => {
    const events: WebhookEvent[] = req.body.events;
    await Promise.all(
      events.map(async (event: WebhookEvent) => {
        try {
          await textEventHandler(event);
        } catch (err: unknown) {
          if (err instanceof Error) {
            console.error(err);
          }
          return res.status(500);
        }
      })
    );
    return res.status(200);
  }
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.post("/delete", function (req, res, next) {
  const { id } = req.body;
  //SQL文, DataBaseのレコード作成
  db.run(
    "delete from message_table where id = ?",
    id
  );
  res.redirect("/")
});

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}/`);
});
