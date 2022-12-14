export type TypeApiMethods =
  | "get"
  | "head"
  | "post"
  | "put"
  | "delete"
  | "options"
  | "patch";

export type TypeApiTypes = "static" | "JavaScript";

export type TypeApi = {
  version?: number;
  name: string;
  path: string;
  method: TypeApiMethods;
  type: TypeApiTypes; // @TODO V1
  filename?: string;
  value: string;
};

export const ApiMethodList: TypeApiMethods[] = [
  "get",
  "post",
  "put",
  "delete",
  "patch",
];
