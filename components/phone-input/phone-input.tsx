import type { TextFieldProps } from '@mui/material/TextField';
import type { Country, Value } from 'react-phone-number-input/input';

import { useState, forwardRef } from 'react';
import PhoneNumberInput, { getCountryCallingCode, parsePhoneNumber } from 'react-phone-number-input/input';

import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { getCountryCode } from './utils';
import { CountryListPopover } from './list';

import type { PhoneInputProps } from './types';

// ----------------------------------------------------------------------

/**
 * Nuestro backend guarda el teléfono como dígitos nacionales sin prefijo
 * (p. ej. "620433331"), pero `react-phone-number-input` exige E.164 interno
 * ("+34620433331") — sin esta conversión advierte en consola y no puede
 * detectar el país ni formatear mientras se escribe.
 */
function toE164(value: string, country: Country): Value | undefined {
  if (!value) return undefined;
  if (value.startsWith('+')) return value as Value;
  const callingCode = getCountryCallingCode(country);
  return `+${callingCode}${value.replace(/^0+/, '')}` as Value;
}

function fromE164(value: Value | undefined, country: Country): string {
  if (!value) return '';
  const callingCode = getCountryCallingCode(country);
  if (value.startsWith(`+${callingCode}`)) return value.slice(callingCode.length + 1);
  const parsed = parsePhoneNumber(value);
  return parsed?.nationalNumber ? String(parsed.nationalNumber) : value.replace(/^\+/, '');
}

export const PhoneInput = forwardRef<HTMLDivElement, PhoneInputProps>(
  ({ value, onChange, placeholder, country: inputCountryCode, disableSelect, ...other }, ref) => {
    const defaultCountryCode = getCountryCode(value, inputCountryCode);

    const [selectedCountry, setSelectedCountry] = useState(defaultCountryCode);

    return (
      <PhoneNumberInput
        ref={ref}
        // `InputSmart` (the default caret-aware renderer) ignores
        // `inputComponent` entirely — only `InputBasic` (smartCaret={false})
        // actually mounts it, which is what lets this render as a real MUI
        // TextField (floating label, size, etc.) instead of a bare <input>.
        smartCaret={false}
        className="phone-input"
        country={selectedCountry}
        inputComponent={CustomInput}
        value={toE164(value, selectedCountry)}
        onChange={(newValue) => onChange(fromE164(newValue, selectedCountry))}
        placeholder={placeholder ?? 'Introduzca el número de teléfono '}
        InputProps={
          disableSelect
            ? undefined
            : {
                startAdornment: (
                  <InputAdornment position="start" sx={{ ml: 1 }}>
                    <CountryListPopover
                      countryCode={selectedCountry}
                      onClickCountry={(inputValue: Country) => setSelectedCountry(inputValue)}
                    />
                  </InputAdornment>
                ),
              }
        }
        {...other}
      />
    );
  }
);

// ----------------------------------------------------------------------

const CustomInput = forwardRef<HTMLInputElement, TextFieldProps>(({ ...props }, ref) => (
  <TextField inputRef={ref} fullWidth {...props} />
));
