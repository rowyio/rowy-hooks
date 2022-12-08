import { Logging } from "@google-cloud/logging";
import { getProjectId } from "../metadataService.js";
import { WebhookType } from "../types.js";

interface RowyLogging {
  log: (payload: any) => void;
  warn: (payload: any) => void;
  error: (payload: any) => void;
}

type IHooksSource = "conditions" | "parser";

class LoggingFactory {
  public static async createHooksLogging(
    type: WebhookType,
    hooksSource: IHooksSource,
    webhookName: string,
    url: string,
    tablePath: string
  ) {
    const projectId = await getProjectId();
    return new LoggingHooks(projectId, type, hooksSource, webhookName, url, tablePath);
  }
}

class LoggingHooks implements RowyLogging {
  private readonly logging: Logging;
  private readonly type: WebhookType;
  private readonly hooksSource: IHooksSource;
  private readonly webhookName: string;
  private readonly url: string;
  private readonly tablePath: string;

  constructor(
    projectId: string,
    type: WebhookType,
    hooksSource: IHooksSource,
    webhookName: string,
    url: string,
    tablePath: string
  ) {
    this.type = type;
    this.hooksSource = hooksSource;
    this.webhookName = webhookName;
    this.url = url;
    this.tablePath = tablePath;
    this.logging = new Logging({ projectId });
  }

  private async logWithSeverity(payload: any, severity: string) {
    const log = this.logging.log(`rowy-logging`);
    const metadata = {
      severity,
    };
    const payloadSize = JSON.stringify(payload).length;
    const entry = log.entry(metadata, {
      functionType: "hooks",
      loggingSource: "hooks",
      type: this.type,
      hooksSource: this.hooksSource,
      webhookName: this.webhookName,
      url: this.url,
      tablePath: this.tablePath,
      payload: payloadSize > 250000 ? { v: "payload too large" } : payload,
    });
    await log.write(entry);
  }

  async log(payload: any) {
    await this.logWithSeverity(payload, "DEFAULT");
  }

  async warn(payload: any) {
    await this.logWithSeverity(payload, "WARNING");
  }

  async error(payload: any) {
    await this.logWithSeverity(payload, "ERROR");
  }
}

export { LoggingFactory, RowyLogging };
