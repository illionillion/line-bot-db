import { MessagingApiBlobClient } from "@line/bot-sdk/dist/messaging-api/api";
import { createWriteStream } from "fs";

export const downloadContent = async (messageId: string, downloadPath: string, client: MessagingApiBlobClient) => {
    const stream = await client.getMessageContent(messageId);
    return await new Promise((resolve, reject) => {
      const writable = createWriteStream("./src" + downloadPath);
      stream.pipe(writable);
      stream.on("end", () => resolve("./src" + downloadPath));
      stream.on("error", reject);
    });
  };
  