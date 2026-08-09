"use client";
import { Iconify } from "@/components/iconify";

import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { fullName } from "@/lib/format";
import type { User } from "@/lib/graphql/types";

import { PaymentsTab } from "./payments-tab";
import { ProfileTab } from "./profile-tab";
import { SchedulesTab } from "./schedules-tab";
import { SubscriptionTab } from "./subscription-tab";

interface MemberPanelProps {
  member: User | null;
  onClose: () => void;
  onChanged: () => void;
}

export function MemberPanel({ member, onClose, onChanged }: MemberPanelProps) {
  const t = useTranslations("members.panel.tabs");
  const [tab, setTab] = useState("profile");
  const TABS = [
    { value: "profile", label: t("profile") },
    { value: "subscription", label: t("subscription") },
    { value: "payments", label: t("payments") },
    { value: "schedules", label: t("schedules") },
  ];

  return (
    <Drawer
      anchor="right"
      open={Boolean(member)}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: 1, sm: 640 } } } }}
    >
      {member ? (
        <>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ px: 4, pt: 3 }}>
            <Box>
              <Typography variant="h6">{fullName(member)}</Typography>
              <Typography variant="body2" sx={{ color: "text.disabled" }}>
                {member.email}
              </Typography>
            </Box>
            <IconButton onClick={onClose} size="small">
              <Iconify icon="mingcute:close-line" width={18} />
            </IconButton>
          </Stack>

          <Tabs
            value={tab}
            onChange={(_event, value: string) => setTab(value)}
            sx={{ px: 4, mt: 1, borderBottom: 1, borderColor: "divider" }}
          >
            {TABS.map((item) => (
              <Tab key={item.value} value={item.value} label={item.label} />
            ))}
          </Tabs>

          <Box sx={{ flex: 1, overflowY: "auto", px: 4, py: 3 }}>
            {tab === "profile" ? (
              <ProfileTab
                key={member.id}
                member={member}
                onChanged={onChanged}
                onDeleted={() => {
                  onChanged();
                  onClose();
                }}
              />
            ) : null}
            {tab === "subscription" ? <SubscriptionTab userId={member.id} role={member.contextRole} /> : null}
            {tab === "payments" ? <PaymentsTab userId={member.id} /> : null}
            {tab === "schedules" ? <SchedulesTab userId={member.id} /> : null}
          </Box>
        </>
      ) : null}
    </Drawer>
  );
}
