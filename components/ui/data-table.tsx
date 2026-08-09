"use client";

import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import type { ReactNode } from "react";

import { Checkbox } from "./checkbox";

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
}

export interface DataTableSelection<T> {
  selectedIds: Set<string>;
  onToggle: (row: T) => void;
  onToggleAll: () => void;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  /** Añade una columna de checkboxes a la izquierda para selección múltiple. */
  selection?: DataTableSelection<T>;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  loading,
  emptyMessage = "Sin resultados",
  selection,
}: DataTableProps<T>) {
  const allSelected = selection ? rows.length > 0 && rows.every((row) => selection.selectedIds.has(rowKey(row))) : false;
  const colSpan = columns.length + (selection ? 1 : 0);

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            {selection ? (
              <TableCell padding="checkbox">
                <Checkbox checked={allSelected} onChange={selection.onToggleAll} aria-label="Seleccionar todo" />
              </TableCell>
            ) : null}
            {columns.map((column) => (
              <TableCell key={column.key} className={column.className}>
                {column.header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && rows.length === 0
            ? Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {selection ? (
                    <TableCell padding="checkbox">
                      <Skeleton variant="rounded" width={20} height={20} />
                    </TableCell>
                  ) : null}
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : rows.map((row) => {
                const key = rowKey(row);
                const selected = selection?.selectedIds.has(key) ?? false;
                return (
                  <TableRow
                    key={key}
                    hover={Boolean(onRowClick)}
                    selected={selected}
                    onClick={() => onRowClick?.(row)}
                    sx={onRowClick ? { cursor: "pointer" } : undefined}
                  >
                    {selection ? (
                      <TableCell padding="checkbox" onClick={(event) => event.stopPropagation()}>
                        <Checkbox
                          checked={selected}
                          onChange={() => selection.onToggle(row)}
                          aria-label="Seleccionar fila"
                        />
                      </TableCell>
                    ) : null}
                    {columns.map((column) => (
                      <TableCell key={column.key} className={column.className}>
                        {column.render(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
          {!loading && rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan} sx={{ py: 8, textAlign: "center", color: "text.disabled" }}>
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
