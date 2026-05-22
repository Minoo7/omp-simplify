export interface ChangedFile {
  readonly path: string;
  readonly status: "modified" | "added" | "renamed" | "copied";
}

export type SimplifyPromptMode = "built-in" | "anthropic";

export interface SimplifyOptions {
  readonly files: readonly string[];
  readonly ref: string;
  readonly staged: boolean;
  readonly promptMode?: SimplifyPromptMode;
}

export interface ExtensionCommandContext {
  readonly cwd: string;
  readonly ui: {
    notify(message: string, level?: "info" | "warn" | "error" | string): void;
    select(message: string, options: readonly string[]): Promise<string | undefined>;
  };
}

export interface ExtensionContext extends ExtensionCommandContext {}

export interface ExtensionAPI {
  registerCommand(
    name: string,
    command: {
      readonly description: string;
      handler(args: string, ctx: ExtensionCommandContext): Promise<void>;
    },
  ): void;
  on(event: string, handler: (...args: any[]) => unknown): void;
  sendUserMessage(message: string, options?: { readonly deliverAs?: "followUp" | string }): void;
  exec(
    command: string,
    args: readonly string[],
    options?: { readonly cwd?: string },
  ): Promise<{ readonly code: number; readonly stdout: string }>;
}
