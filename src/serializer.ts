import { IWebhook } from "./types";
/* Convert webhook objects into a single readable string */
export const serializeWebhooks = (
  webhooks: IWebhook[],
  tablePath: string
): string =>
  webhooks
    .filter((webhooks) => webhooks.active)
    .map(
      ({ name, type, endpoint, auth, conditions, parser }) => `{
          name: "${name}",
          type: "${type}",
          url: "/wh/${tablePath}/${endpoint}",
          auth: ${JSON.stringify(auth)},
          endpoint: "${endpoint}",
          tablePath: "${tablePath}",
          conditions: ${conditions
            .replace(/^.*:\s*Condition\s*=/, "")
            .replace(/\s*;\s*$/, "")},
          parser: ${parser
            .replace(
              /(?:require\(.*)@\d+\.\d+\.\d+/g,
              (capture) => capture.split("@")[0]
            )
            .replace(/^.*:\s*\w*Parser\s*=/, "")
            .replace(/\s*;\s*$/, "")}
        }`
    )
    .join(",");
