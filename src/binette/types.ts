import type { InferOutput } from "valibot";
import type { binetteAssetSchema, binetteSchema } from "./schema";

export type BinetteAsset = InferOutput<typeof binetteAssetSchema>;
export type Binette = InferOutput<typeof binetteSchema>;
