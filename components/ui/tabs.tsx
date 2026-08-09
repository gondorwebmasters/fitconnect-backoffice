"use client";

import MuiTab from "@mui/material/Tab";
import MuiTabs from "@mui/material/Tabs";

interface TabsProps {
  items: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

export function Tabs({ items, value, onChange }: TabsProps) {
  return (
    <MuiTabs value={value} onChange={(_event, newValue: string) => onChange(newValue)}>
      {items.map((item) => (
        <MuiTab key={item.value} value={item.value} label={item.label} />
      ))}
    </MuiTabs>
  );
}
