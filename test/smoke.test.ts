import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import plugin from "../src/index.ts";
import { getChangedFiles } from "../src/git-diff.ts";
import { handleSimplifySettingsCommand, parseArgs } from "../src/simplify-command.ts";
import { readSimplifySettings } from "../src/settings.ts";

describe("omp-simplify", () => {
  test("registers both slash commands", () => {
    const commands: string[] = [];
    plugin({
      on() {},
      registerCommand(name: string) {
        commands.push(name);
      },
    } as never);

    expect(commands).toEqual(["simplify", "simplify-settings"]);
  });

  test("parses quoted file arguments", () => {
    expect(parseArgs('--ref=main "src/foo bar.ts" plain.ts').files).toEqual([
      "src/foo bar.ts",
      "plain.ts",
    ]);
  });

  test("parses nul-delimited git name-status output", async () => {
    const pi = {
      async exec(command: string, args: readonly string[]) {
        expect(command).toBe("git");
        expect(args).toEqual(["diff", "--name-status", "-z", "HEAD"]);
        return {
          code: 0,
          stdout: "M\0src/space name.ts\0R100\0old name.ts\0new name.ts\0",
        };
      },
    };

    await expect(getChangedFiles(pi as never, "/tmp", { files: [], ref: "HEAD", staged: false })).resolves.toEqual([
      { path: "src/space name.ts", status: "modified" },
      { path: "new name.ts", status: "renamed" },
    ]);
  });

  test("reads legacy settings but writes current omp settings", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "simplify-settings-"));
    try {
      await mkdir(join(cwd, ".pi"), { recursive: true });
      await writeFile(
        join(cwd, ".pi", "settings.json"),
        JSON.stringify({ piSimplify: { prompt: "anthropic", autoRun: true, autoRunCooldownMs: 1234 } }),
      );
      await expect(readSimplifySettings(cwd)).resolves.toEqual({
        prompt: "anthropic",
        autoRun: true,
        autoRunCooldownMs: 1234,
      });

      await handleSimplifySettingsCommand("--project --auto=off", {
        cwd,
        ui: {
          notify() {},
          select() {
            throw new Error("unexpected select");
          },
        },
      } as never);
      expect(JSON.parse(await readFile(join(cwd, ".omp", "settings.json"), "utf8")).piSimplify.autoRun).toBe(false);
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  test("surfaces malformed current settings", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "simplify-settings-"));
    try {
      await mkdir(join(cwd, ".omp"), { recursive: true });
      await writeFile(join(cwd, ".omp", "settings.json"), "{");
      await expect(readSimplifySettings(cwd)).rejects.toThrow(SyntaxError);
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
});
