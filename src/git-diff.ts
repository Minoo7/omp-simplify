import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";
import type { ChangedFile, SimplifyOptions } from "./types.ts";

const STATUS_MAP: Record<string, ChangedFile["status"]> = {
  M: "modified",
  A: "added",
  R: "renamed",
  C: "copied",
};

function parseDiffOutput(stdout: string): ChangedFile[] {
  const files: ChangedFile[] = [];
  const parts = stdout.split("\0");

  for (let index = 0; index < parts.length;) {
    const rawStatus = parts[index++];
    if (!rawStatus) continue;

    const status = STATUS_MAP[rawStatus[0]];
    if (!status) {
      index += 1;
      continue;
    }

    if (status === "renamed" || status === "copied") {
      index += 1;
    }

    const path = parts[index++];
    if (path) {
      files.push({ path, status });
    }
  }

  return files;
}

export async function getChangedFiles(
  pi: ExtensionAPI,
  cwd: string,
  options: SimplifyOptions,
): Promise<ChangedFile[]> {
  if (options.files.length > 0) {
    return options.files.map((path) => ({ path, status: "modified" as const }));
  }

  const args = ["diff", "--name-status", "-z"];
  if (options.staged) {
    args.push("--cached");
  } else {
    args.push(options.ref);
  }

  const result = await pi.exec("git", args, { cwd });
  if (result.code === 0) {
    const files = parseDiffOutput(result.stdout);
    if (files.length > 0) return files;
  }

  const fallback = await pi.exec("git", ["diff", "--name-status", "-z", "HEAD~1"], { cwd });
  if (fallback.code === 0) {
    return parseDiffOutput(fallback.stdout);
  }

  return [];
}
