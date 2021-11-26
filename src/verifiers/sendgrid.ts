import { Request } from "express";
import { EventWebhook, EventWebhookHeader } from "@sendgrid/eventwebhook";

function sendgrid (request: Request, auth: any) {
    const { secret } = auth;
    // The SendGrid EventWebhookHeader provides methods for getting
    // the necessary header names.
    // Remember to cast these header names to lowercase to access them correctly
    const signatureKey = EventWebhookHeader.SIGNATURE().toLowerCase();
    const timestampKey = EventWebhookHeader.TIMESTAMP().toLowerCase();
    // Retrieve SendGrid's headers so they can be used to validate
    // the request
    const signature = request.headers[signatureKey] as string;
    const timestamp = request.headers[timestampKey] as string;

    const ew = new EventWebhook();
    const key = ew.convertPublicKeyToECDSA(secret);
    const rawEvent =
      JSON.stringify(request.body).split("},{").join("},\r\n{") + "\r\n";
    return ew.verifySignature(key, rawEvent, signature, timestamp);
  }

export default sendgrid;