export type BinetteAsset = { type: string } & (
  | { content: string; src?: never }
  | { src: string; content?: never }
);

export type Binette = {
  binette: string;
  title?: string;
  assets?: Record<string, BinetteAsset>;
} & (
  | { type?: never; content?: never; entry?: never }
  | ({ type: "html" | "js" } & (
      | { content: string; entry?: never }
      | { entry: string; content?: never }
    ))
);
