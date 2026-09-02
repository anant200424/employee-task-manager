import {
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  CountryCode,
} from "libphonenumber-js";
import examples from "libphonenumber-js/mobile/examples";

export interface CountryOption {
  iso: CountryCode;
  name: string;
  dialCode: string;
  flag: string;
  exampleDigits: number; // expected national significant number length, for placeholder/hints
}

// Converts an ISO 3166-1 alpha-2 code (e.g. "IN") into its flag emoji
// by mapping each letter to a Unicode Regional Indicator Symbol.
const isoToFlagEmoji = (iso: string): string =>
  iso
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));

let regionNames: Intl.DisplayNames | undefined;
try {
  regionNames = new Intl.DisplayNames(["en"], { type: "region" });
} catch {
  regionNames = undefined;
}

// Guarantees a properly capitalized country name ("India", not "india" or
// "iN") no matter what the Intl API (or its absence) returns.
const toTitleCase = (value: string): string =>
  value
    .toLowerCase()
    .split(/(\s|-)/)
    .map((part) =>
      part.trim() ? part.charAt(0).toUpperCase() + part.slice(1) : part,
    )
    .join("");

const buildCountryList = (): CountryOption[] => {
  const list: CountryOption[] = getCountries().map((iso) => {
    const example = getExampleNumber(iso, examples);
    const rawName = regionNames?.of(iso) || iso;
    return {
      iso,
      name: toTitleCase(rawName),
      dialCode: `+${getCountryCallingCode(iso)}`,
      flag: isoToFlagEmoji(iso),
      exampleDigits: example ? example.nationalNumber.length : 10,
    };
  });

  return list.sort((a, b) => a.name.localeCompare(b.name));
};

export const COUNTRIES: CountryOption[] = buildCountryList();

export const getCountryByIso = (iso: string): CountryOption | undefined =>
  COUNTRIES.find((c) => c.iso === iso);

export const DEFAULT_COUNTRY_ISO: CountryCode = "IN";
