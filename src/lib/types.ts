import { Dispatch, SetStateAction } from "react";
import { SEARCH_OPTION_ICONS } from "./constants";

export type SetterType<T> = Dispatch<SetStateAction<T>>;

export type ParamsId<T extends string> = {
  params: Promise<Record<T, string>>;
};

export type SearchOption = {
  label: string;
  icon: keyof typeof SEARCH_OPTION_ICONS;
  href: string;
};

export type SocketStatus = "idle" | "connecting" | "open" | "closed" | "error";

export type DeepKeys<T> = T extends object
  ? {
      [K in keyof T]: K | DeepKeys<T[K]>;
    }[keyof T]
  : never;
