import { db } from "./firebaseConfig.js";
import { Request } from "express";
import { serializeWebhooks } from "./serializer.js";
import { WEBHOOKS_DOC_PATH } from "./constants.js";

export const configPublisher = async (req: Request) => {
  const { tableConfigPath, tablePath } = req.body;
  const tableWebhooksConfig = (await db.doc(tableConfigPath).get()).get(
    "webhooks"
  );
  const serializedWebhooks = serializeWebhooks(tableWebhooksConfig, tablePath);
  await db
    .doc(WEBHOOKS_DOC_PATH)
    .set(
      { [encodeURIComponent(tableConfigPath)]: serializedWebhooks },
      { merge: true }
    );
  return { success: true, message: "webhooks successfully published" };
};
