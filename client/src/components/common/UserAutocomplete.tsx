import { useEffect, useRef, useState } from "react";
import { apolloClient } from "@/graphql/apollo-client";
import { GET_USERS } from "@/graphql/operations";
import { User } from "@/graphql/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAutocompleteProps {
  /** The selected user ID (controlled) */
  value: string;
  /** Called with the selected user's ID, or "" when cleared */
  onChange: (userId: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

interface UserOption {
  id: string;
  displayName: string;
  email?: string | null;
  initials: string;
}

function toOption(u: User): UserOption {
  const full = [u.name, u.surname].filter(Boolean).join(" ") || u.nickname || u.email || "Usuario";
  const initials = full
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return { id: u.id, displayName: full, email: u.email, initials };
}

export function UserAutocomplete({
  value,
  onChange,
  label = "Usuario",
  placeholder = "Buscar usuario por nombre...",
  className,
  required = false,
  disabled = false,
}: UserAutocompleteProps) {
  const [inputText, setInputText] = useState("");
  const [options, setOptions] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // When value is set externally (e.g. edit mode), resolve the display name
  useEffect(() => {
    if (!value) {
      setSelectedLabel("");
      setInputText("");
      return;
    }
    // If we already have the label for this value, skip
    if (selectedLabel) return;
    // Try to find in current options first
    const found = options.find((o) => o.id === value);
    if (found) {
      setSelectedLabel(found.displayName);
      setInputText(found.displayName);
      return;
    }
    // Otherwise fetch by ID via query with empty string (will return all, find by id)
    // We use a minimal query to resolve the label
    apolloClient
      .query({ query: GET_USERS, variables: { query: "", page: 1 }, fetchPolicy: "cache-first" })
      .then((res) => {
      const result2 = (res.data as Record<string, unknown>)?.getUsers as { users?: User[] } | undefined;
      const users: User[] = result2?.users ?? [];
      const match = users.find((u) => u.id === value);
      if (match) {
        const opt = toOption(match);
        setSelectedLabel(opt.displayName);
        setInputText(opt.displayName);
      }
      })
      .catch(() => {});
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        // If user typed but didn't select, revert to selected label
        if (value && selectedLabel) {
          setInputText(selectedLabel);
        } else if (!value) {
          setInputText("");
        }
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [value, selectedLabel]);

  function handleInputChange(text: string) {
    setInputText(text);
    // If text is cleared, clear the selection
    if (!text.trim()) {
      onChange("");
      setSelectedLabel("");
      setOptions([]);
      setOpen(false);
      return;
    }
    setOpen(true);
    // Debounce the API call
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchUsers(text.trim());
    }, 280);
  }

  async function fetchUsers(query: string) {
    setLoading(true);
    try {
      const res = await apolloClient.query({
        query: GET_USERS,
        variables: { query, page: 1 },
        fetchPolicy: "network-only",
      });
      const result = (res.data as Record<string, unknown>)?.getUsers as { users?: User[] } | undefined;
      const users: User[] = result?.users ?? [];
      setOptions(users.slice(0, 10).map(toOption));
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(opt: UserOption) {
    onChange(opt.id);
    setSelectedLabel(opt.displayName);
    setInputText(opt.displayName);
    setOpen(false);
  }

  function handleClear() {
    onChange("");
    setSelectedLabel("");
    setInputText("");
    setOptions([]);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {label && (
        <Label className="text-sm font-medium mb-1 block">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <div className="relative">
        <Input
          value={inputText}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (!value && inputText.trim()) setOpen(true);
            else if (!value) {
              // Show recent/all on focus with empty input
              fetchUsers("");
              setOpen(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className="pr-8"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          {!loading && value && (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg max-h-60 overflow-y-auto">
          {loading && options.length === 0 ? (
            <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Buscando...
            </div>
          ) : options.length === 0 ? (
            <div className="px-3 py-2.5 text-sm text-muted-foreground">
              No se encontraron usuarios
            </div>
          ) : (
            options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent blur before click
                  handleSelect(opt);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left",
                  opt.id === value && "bg-accent/60 font-medium"
                )}
              >
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                    {opt.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="truncate font-medium">{opt.displayName}</span>
                  {opt.email && (
                    <span className="truncate text-xs text-muted-foreground">{opt.email}</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
