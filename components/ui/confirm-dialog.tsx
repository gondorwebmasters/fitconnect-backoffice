"use client";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  danger,
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog fullWidth maxWidth="xs" open={open} onClose={onCancel}>
      <DialogTitle sx={{ pb: 1 }}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="contained" color={danger ? "error" : "primary"} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
