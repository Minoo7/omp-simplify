import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { SimplifyPromptMode } from "./types.ts";

export const DEFAULT_PROMPT_MODE: SimplifyPromptMode = "built-in";
export const SETTINGS_KEY = "piSimplify";

export interface SimplifySettings {
  readonly prompt: SimplifyPromptMode;
  readonly autoRun: boolean;
  readonly autoRunCooldownMs?: number;
}

interface RawSimplifySettings {
  readonly prompt?: unknown;
  readonly autoRun?: unknown;
  readonly autoRunCooldownMs?: unknown;
}

type RawSettings = Record<string, unknown> & {
  readonly piSimplify?: RawSimplifySettings;
};

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

function isPromptMode(value: unknown): value is SimplifyPromptMode {
  return value === "built-in" || value === "anthropic";
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function asPositiveNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

async function readJsonIfExists(path: string): Promise<RawSettings | undefined> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as RawSettings;
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") return undefined;
    throw error;
  }
}

async function readJsonOrEmpty(path: string): Promise<RawSettings> {
  return await readJsonIfExists(path) ?? {};
}

export async function readSimplifySettings(cwd: string): Promise<SimplifySettings> {
  const globalLegacySettings = await readJsonIfExists(getLegacyGlobalSettingsPath());
  const globalSettings = await readJsonIfExists(getGlobalSettingsPath());
  const projectLegacySettings = await readJsonIfExists(getLegacyProjectSettingsPath(cwd));
  const projectSettings = await readJsonIfExists(getProjectSettingsPath(cwd));

  const mergedSettings = [
    projectSettings,
    projectLegacySettings,
    globalSettings,
    globalLegacySettings,
  ];
  const autoRunCooldownMs = readMergedAutoRunCooldownMs(mergedSettings);

  return {
    prompt: readMergedPromptMode(mergedSettings),
    autoRun: readMergedAutoRun(mergedSettings),
    ...(autoRunCooldownMs === undefined ? {} : { autoRunCooldownMs }),
  };
}

export async function readSimplifyPromptMode(cwd: string): Promise<SimplifyPromptMode> {
  return (await readSimplifySettings(cwd)).prompt;
}

export async function writeSimplifyPromptMode(
  cwd: string,
  mode: SimplifyPromptMode,
  scope: "global" | "project" = "global",
): Promise<void> {
  await writeSimplifySetting(cwd, scope, { prompt: mode });
}

export async function writeAutoRun(
  cwd: string,
  autoRun: boolean,
  scope: "global" | "project" = "global",
): Promise<void> {
  await writeSimplifySetting(cwd, scope, { autoRun });
}

async function writeSimplifySetting(
  cwd: string,
  scope: "global" | "project",
  values: Record<string, unknown>,
): Promise<void> {
  const path = scope === "project" ? getProjectSettingsPath(cwd) : getGlobalSettingsPath();
  const settings = await readJsonOrEmpty(path);
  const existing = typeof settings[SETTINGS_KEY] === "object" && settings[SETTINGS_KEY] !== null
    ? settings[SETTINGS_KEY] as Record<string, unknown>
    : {};

  settings[SETTINGS_KEY] = { ...existing, ...values };
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
}

function readMergedPromptMode(settings: readonly (RawSettings | undefined)[]): SimplifyPromptMode {
  for (const candidate of settings) {
    const mode = candidate?.piSimplify?.prompt;
    if (isPromptMode(mode)) return mode;
  }

  return DEFAULT_PROMPT_MODE;
}

function readMergedAutoRun(settings: readonly (RawSettings | undefined)[]): boolean {
  for (const candidate of settings) {
    const autoRun = asBoolean(candidate?.piSimplify?.autoRun);
    if (autoRun !== undefined) return autoRun;
  }

  return false;
}

function readMergedAutoRunCooldownMs(settings: readonly (RawSettings | undefined)[]): number | undefined {
  for (const candidate of settings) {
    const cooldownMs = asPositiveNumber(candidate?.piSimplify?.autoRunCooldownMs);
    if (cooldownMs !== undefined) return cooldownMs;
  }

  return undefined;
}

function getConfigDirName(): string {
  return process.env.PI_CONFIG_DIR || ".omp";
}

export function getGlobalSettingsPath(): string {
  return join(homedir(), getConfigDirName(), "agent", "settings.json");
}

export function getProjectSettingsPath(cwd: string): string {
  return join(cwd, getConfigDirName(), "settings.json");
}

function getLegacyGlobalSettingsPath(): string {
  return join(homedir(), ".pi", "agent", "settings.json");
}

function getLegacyProjectSettingsPath(cwd: string): string {
  return join(cwd, ".pi", "settings.json");
}
