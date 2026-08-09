import type { StackProps } from '@mui/material/Stack';
import type { SxProps, Theme } from '@mui/material/styles';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { pxToRem } from '@/theme/styles';

import { Image } from '../image';

// ----------------------------------------------------------------------

export type EmptyContentProps = StackProps & {
  title?: string;
  imgUrl?: string | React.ReactNode;
  filled?: boolean;
  description?: string;
  action?: React.ReactNode;
  slotProps?: {
    img?: SxProps<Theme>;
    title?: SxProps<Theme>;
    description?: SxProps<Theme>;
  };
};

export function EmptyContent({
  sx,
  imgUrl,
  action,
  filled,
  slotProps,
  description,
  title,
  ...other
}: EmptyContentProps) {
  return (
    <Stack
      flexGrow={1}
      alignItems="center"
      justifyContent="center"
      sx={{
        px: 3,
        height: 1,
        ...(filled && {
          borderRadius: 2,
        }),
        ...sx,
      }}
      {...other}
    >
      {typeof imgUrl === 'string' ? <Image src={imgUrl} sx={{ width: 1, maxWidth: 160, ...slotProps?.img }} /> : imgUrl}

      {title && (
        <Typography
          component="span"
          variant="body2"
          sx={{
            fontWeight: 'fontWeightBold',
            fontSize: pxToRem(13),
            textAlign: 'center',
            ...slotProps?.title,
            mt: 2,
          }}
        >
          {title}
        </Typography>
      )}

      {description && (
        <Typography
          variant="caption"
          sx={{
            mt: 1,
            textAlign: 'center',
            ...slotProps?.description,
            fontWeight: 'fontWeightRegular',
            fontSize: pxToRem(13),
          }}
        >
          {description}
        </Typography>
      )}

      {action}
    </Stack>
  );
}
