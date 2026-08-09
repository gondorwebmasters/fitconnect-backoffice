import type {MuiOtpInputProps} from 'mui-one-time-password-input';
import {MuiOtpInput} from 'mui-one-time-password-input';
import {Controller, useFormContext} from 'react-hook-form';

import FormHelperText from '@mui/material/FormHelperText';

// ----------------------------------------------------------------------

type RHFCodesProps = MuiOtpInputProps & {
  name: string;
  length: number;
};

export function RHFCode({length, name, ...other}: RHFCodesProps) {
  const {control} = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({field, fieldState: {error}}) => (
        <div>
          <MuiOtpInput
            {...field}
            autoFocus

            gap={1.5}
            length={length}
            TextFieldsProps={{
              onKeyDown: (e) => {
                const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab'];
                if (!/^\d$/.test(e.key) && !allowedKeys.includes(e.key)) {
                  e.preventDefault();
                }
              },
              error: !!error, placeholder: '-', inputProps: {
                inputMode: 'numeric',
                pattern: '[0-9]*',
              }
            }}

            {...other}
          />

          {error && (
            <FormHelperText sx={{px: 2}} error>
              {error.message}
            </FormHelperText>
          )}
        </div>
      )}
    />
  );
}
