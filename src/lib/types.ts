import { Dispatch, SetStateAction } from "react";
import { SEARCH_OPTION_ICONS } from "./constants";

export type SetterType<T> = Dispatch<SetStateAction<T>>;

export type SearchOption = {
  label: string;
  icon: keyof typeof SEARCH_OPTION_ICONS;
  href: string;
};
