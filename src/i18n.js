import { derived, writable } from "svelte/store";
import translations from "./translations";

//Locales
export const locale = writable("en");
export const locales = Object.keys(translations);

function translate(locale, key) {
  if (!key) throw new Error("no key provided to $t()");
  if (!locale) throw new Error(`no translation for key "${key}"`);

  //Take translation from translation object
  let text = translations[locale][key];
  if (!text) throw new Error(`no translation found for ${locale}.${key}`);

  return text;
}

//Translation
export const t = derived(
  locale,
  ($locale) =>
    (key = {}) =>
      translate($locale, key),
);
