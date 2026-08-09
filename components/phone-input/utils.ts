import type { Country } from 'react-phone-number-input';

import { parsePhoneNumber } from 'react-phone-number-input';

import { countries } from '@/assets/data/countries';

// ----------------------------------------------------------------------

export function getCountryCode(inputValue: string, countryCode?: Country): Country {
  if (inputValue) {
    const phoneNumber = parsePhoneNumber(inputValue);

    if (phoneNumber?.country) {
      return phoneNumber.country;
    }
  }

  // España por defecto: mercado principal de la app.
  return countryCode ?? 'ES';
}

// ----------------------------------------------------------------------

export function getCountry(countryCode?: Country) {
  const option = countries.filter((country) => country.code === countryCode)[0];
  return option;
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  query: string;
  inputData: typeof countries;
};

export function applyFilter({ inputData, query }: ApplyFilterProps) {
  if (query) {
    return inputData.filter(
      (country) =>
        country.label.toLowerCase().indexOf(query.toLowerCase()) !== -1 ||
        country.code.toLowerCase().indexOf(query.toLowerCase()) !== -1 ||
        country.phone.toLowerCase().indexOf(query.toLowerCase()) !== -1
    );
  }

  return inputData;
}
