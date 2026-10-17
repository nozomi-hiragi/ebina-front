import * as v from "valibot";
import { binetteSchema, binetteVersionSchema } from "./schema";
import type { Binette } from "./types";

export class BinetteError extends Error {
  constructor(public readonly code: "unsupported_version" | "invalid_format", message: string) {
    super(message);
    this.name = "BinetteError";
  }
}

export function parseBinette(value: unknown): Binette {
  const version = v.safeParse(binetteVersionSchema, value, { abortEarly: true });
  if (!version.success) throw new BinetteError("invalid_format", version.issues[0].message);
  if (version.output.binette.split(".")[0] !== "0") {
    throw new BinetteError("unsupported_version", "この Binette のバージョンには対応していません。");
  }
  const result = v.safeParse(binetteSchema, value, { abortEarly: true });
  if (!result.success) throw new BinetteError("invalid_format", result.issues[0].message);
  return result.output;
}
