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

/**
 * `<PhoneInput>` (modo "solo nacional") no sabe reconocer un código de país
 * pegado sin "+" — algo que puede colarse cuando el navegador autorrellena
 * el campo de golpe (con todo el formulario, sin que el usuario llegue a
 * enfocar ese campo en concreto) y la corrección en vivo del propio input no
 * llega a dispararse. Esta función reintenta interpretar el texto crudo
 * primero como número nacional del país dado y, si no es válido así, asume
 * que en realidad le faltaba el "+" delante y lo corrige — absorbiendo el
 * código de país en vez de dejarlo pegado al número.
 *
 * Sirve como red de seguridad final: se puede volver a aplicar justo antes
 * de enviar el formulario, sin depender de que el campo llegara a perder el
 * foco o de que el propio input detectara el autorrelleno a tiempo.
 */
export function resolvePhoneNumber(
  raw: string,
  country: Country = 'ES',
): { nationalNumber: string; country: Country } | null {
  const cleaned = raw.replace(/[^\d+]/g, '');
  if (!cleaned) return null;

  const asNational = parsePhoneNumber(cleaned, country);
  if (asNational?.isValid()) {
    return { nationalNumber: String(asNational.nationalNumber), country: asNational.country ?? country };
  }

  if (!cleaned.startsWith('+')) {
    const asInternational = parsePhoneNumber(`+${cleaned}`);
    if (asInternational?.isValid()) {
      return { nationalNumber: String(asInternational.nationalNumber), country: asInternational.country ?? country };
    }
  }

  return null;
}

/** Como `resolvePhoneNumber`, pero solo devuelve los dígitos nacionales (o el texto original si no se pudo normalizar). */
export function normalizePhoneNumber(raw: string, country: Country = 'ES'): string {
  if (!raw) return raw;
  return resolvePhoneNumber(raw, country)?.nationalNumber ?? raw;
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
