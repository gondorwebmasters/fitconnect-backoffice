'use client';

import type { AnimationEvent, ChangeEvent, FocusEvent } from 'react';
import type { Country, Value } from 'react-phone-number-input/input';

import { useMemo, useState, forwardRef } from 'react';
import { AsYouType } from 'libphonenumber-js';

import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from '@/components/iconify';
import { AUTOFILL_ANIMATION_NAME } from '@/theme/core/components/textfield';

import { getCountryCode, resolvePhoneNumber } from './utils';
import { CountryListPopover } from './list';

import type { PhoneInputProps } from './types';

// ----------------------------------------------------------------------

/**
 * Controlamos el parseo/formateo del teléfono directamente (en vez de dejar
 * que `react-phone-number-input` lo haga con `country` fijo en modo "solo
 * nacional") porque ese modo no sabe separar un código de país que llegue
 * pegado sin "+" — algo que pasa a menudo cuando el navegador autorrellena
 * el campo de golpe. Aquí, cada cambio (tecleo o autorrelleno) se reinterpreta
 * con `resolvePhoneNumber`, que sí distingue ambos casos.
 */
export const PhoneInput = forwardRef<HTMLDivElement, PhoneInputProps>(
  ({ value, onChange, onBlur, placeholder, country: inputCountryCode, disableSelect, sx, ...other }, ref) => {
    const [selectedCountry, setSelectedCountry] = useState(() => getCountryCode(value, inputCountryCode));

    // Texto mostrado en el campo: solo el número nacional, formateado con
    // separadores como en el país seleccionado (p. ej. "691 66 07 72") — el
    // código de país lo aporta la bandera, no el texto.
    const displayValue = useMemo(() => {
      if (!value) return '';
      return new AsYouType(selectedCountry).input(value);
    }, [value, selectedCountry]);

    /**
     * Reinterpreta el texto crudo del campo (lo que haya, completo o a medio
     * escribir) y actualiza el valor guardado y, si corresponde, la bandera.
     * Si todavía no es un número reconocible se guardan los dígitos tal cual
     * se van tecleando, sin forzar ninguna interpretación.
     */
    const applyRawText = (raw: string) => {
      const resolved = resolvePhoneNumber(raw, selectedCountry);
      if (resolved) {
        if (resolved.country !== selectedCountry) setSelectedCountry(resolved.country);
        if (resolved.nationalNumber !== value) onChange(resolved.nationalNumber as Value);
        return;
      }
      // Todavía no es un número completo/reconocible (p. ej. "+3", "+35" al
      // empezar a teclear en internacional) — se conserva el "+" en vez de
      // descartarlo a ciegas, o se pierde lo que el usuario está escribiendo.
      const digitsOnly = raw.replace(/[^\d+]/g, '');
      if (digitsOnly !== value) onChange(digitsOnly as Value);
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => applyRawText(event.target.value);

    const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
      applyRawText(event.target.value);
      onBlur?.(event);
    };

    return (
      <TextField
        inputRef={ref}
        fullWidth
        autoComplete="tel"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder ?? 'Introduzca el número de teléfono '}
        // Transparente, igual que el resto de inputs del sistema — sin fondo
        // propio, más allá de cualquier resto de estado de autorrelleno del
        // navegador (que puede persistir de una interacción anterior).
        sx={[
          { '& .MuiOutlinedInput-root': { bgcolor: 'transparent' } },
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
        slotProps={{
          htmlInput: {
            // El autorrelleno del navegador puede escribir el número
            // completo en el <input> nativo sin disparar `onChange` — este
            // truco de CSS (ver `textfield.tsx`) lo detecta en cuanto ocurre.
            onAnimationStart: (event: AnimationEvent<HTMLInputElement>) => {
              if (event.animationName === AUTOFILL_ANIMATION_NAME) applyRawText(event.currentTarget.value);
            },
          },
          input: disableSelect
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
                endAdornment: value ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      edge="end"
                      aria-label="Borrar número"
                      tabIndex={-1}
                      onClick={() => onChange('' as Value)}
                      sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: 'action.hover' } }}
                    >
                      <Iconify icon="mingcute:close-line" width={16} />
                    </IconButton>
                  </InputAdornment>
                ) : undefined,
              },
        }}
        {...other}
      />
    );
  }
);
