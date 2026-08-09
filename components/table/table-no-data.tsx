import type { SxProps, Theme } from '@mui/material/styles';

import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import { EmptyContent } from '../empty-content';

// ----------------------------------------------------------------------

export type TableNoDataProps = {
  notFound: boolean;
  message?: string;
  sx?: SxProps<Theme>;
};

export function TableNoData({ notFound, message, sx }: TableNoDataProps) {
  return (
    <TableRow>
      {notFound ? (
        <TableCell colSpan={12}>
          <EmptyContent filled title={message} sx={{ py: 10, ...sx }} />
        </TableCell>
      ) : (
        <TableCell colSpan={12} sx={{ p: 0 }} />
      )}
    </TableRow>
  );
}
