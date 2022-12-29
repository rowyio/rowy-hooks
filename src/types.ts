export const webhookTypes = [
  "basic",
  "typeform",
  "sendgrid",
  "stripe",
  "github",
  "webform",
] as const;

export type WebhookType = typeof webhookTypes[number];

export const webhookNames: Record<WebhookType, string> = {
  sendgrid: "Sendgrid",
  typeform: "Typeform",
  stripe: "Stripe",
  basic: "Basic",
  github: "Github",
  webform: "Webform",
};

export interface IWebhookEditor {
  displayName: string;
  photoURL: string;
  lastUpdate: number;
}

export interface IWebhook {
  // rowy meta fields
  name: string;
  auth: {
    enabled: boolean;
    secret: string;
  };
  active: boolean;
  lastEditor: IWebhookEditor;
  // webhook specific fields
  endpoint: string;
  type: WebhookType;
  parser: string;
  conditions: string;
  secret?: string;
}
