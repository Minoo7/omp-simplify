import type { ExtensionAPI, ExtensionCommandContext } from "@oh-my-pi/pi-coding-agent";
import { createAutoSimplifyHooks } from "./auto-simplify.ts";
import {
  COMMAND_NAME,
  SETTINGS_COMMAND_NAME,
  handleSimplifyCommand,
  handleSimplifySettingsCommand,
} from "./simplify-command.ts";

export default function (pi: ExtensionAPI): void {
  createAutoSimplifyHooks(pi);

  pi.registerCommand(COMMAND_NAME, {
    description:
      "Review recently changed files for clarity, consistency, and maintainability improvements",
    handler(args: string, ctx: ExtensionCommandContext): Promise<void> {
      return handleSimplifyCommand(args, ctx, pi);
    },
  });

  pi.registerCommand(SETTINGS_COMMAND_NAME, {
    description: "Choose whether /simplify uses the built-in or Anthropic simplification prompt",
    handler(args: string, ctx: ExtensionCommandContext): Promise<void> {
      return handleSimplifySettingsCommand(args, ctx);
    },
  });
}
