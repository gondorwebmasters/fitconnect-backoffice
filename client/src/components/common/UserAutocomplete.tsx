import { useEffect, useRef, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_USERS } from "@/graphql/operations";
import { User } from "@/graphql/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAutocompleteProps {
  /** The selected user ID (controlled) */
  value: string;
  /** Called with the selected user's ID, or "" when cleared */
  onChange: (userId: string) => void;
  /** Optional: called with the full User object when a user is selected, or null when cleared */
  onUserSelect?: (user: User | null) => void;
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
  const full =
    [u.name, u.surname].filter(Boolean).join(" ") ||
    u.nickname ||
    u.email ||
    "Usuario";
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
  onUserSelect,
  label = "Usuario",
  placeholder = "Buscar usuario por nombre...",
  className,
  required = false,
  disabled = false,
}: UserAutocompleteProps) {
  // Keep a reference to the raw users so we can pass the full object to onUserSelect
  const rawUsersRef = useRef<User[]>([]);
  const [inputText, setInputText] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Load ALL users once — filter locally. No debounce, no repeated calls.
  const { data, loading } = useQuery(GET_USERS, {
    variables: { page: 0, filterMe: false },
    fetchPolicy: "cache-first",
    notifyOnNetworkStatusChange: false,
  });

  const allUsers: UserOption[] = (() => {
    const raw = (data as Record<string, unknown>)?.getUsers as
      | { users?: User[] }
      | undefined;
    rawUsersRef.current = raw?.users ?? [];
    return rawUsersRef.current.map(toOption);
  })();

  // Local filter: show users matching the typed text
  const filtered =
    inputText.trim().length === 0
      ? allUsers.slice(0, 20) // show first 20 when nothing typed
      : allUsers.filter(
          (u) =>
            u.displayName.toLowerCase().includes(inputText.toLowerCase()) ||
            (u.email?.toLowerCase().includes(inputText.toLowerCase()) ?? false)
        );

  // Resolve display name when value is set externally (e.g. edit mode)
  useEffect(() => {
    if (!value) {
      setSelectedLabel("");
      setInputText("");
      return;
    }
    const found = allUsers.find((o) => o.id === value);
    if (found && found.displayName !== selectedLabel) {
      setSelectedLabel(found.displayName);
      setInputText(found.displayName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, allUsers.length]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        // Revert text if user typed but didn't select
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
    if (!text.trim()) {
      onChange("");
      setSelectedLabel("");
    }
    setOpen(true);
  }

  function handleSelect(opt: UserOption) {
    onChange(opt.id);
    setSelectedLabel(opt.displayName);
    setInputText(opt.displayName);
    setOpen(false);
    if (onUserSelect) {
      const fullUser = rawUsersRef.current.find((u) => u.id === opt.id) ?? null;
      onUserSelect(fullUser);
    }
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
    setSelectedLabel("");
    setInputText("");
    setOpen(false);
    if (onUserSelect) onUserSelect(null);
  }

  function handleFocus() {
    setOpen(true);
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {label && (
        <Label className="text-sm font-medium mb-1.5 block">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <div className="relative">
        <Input
          value={inputText}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          placeholder={loading ? "Cargando usuarios..." : placeholder}
          disabled={disabled || loading}
          autoComplete="off"
          className="pr-16"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          )}
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
          {!loading && (
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform",
                open && "rotate-180"
              )}
            />
          )}
        </div>
      </div>

      {/* Dropdown */}
      {open && !loading && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2.5 text-sm text-muted-foreground">
              No se encontraron usuarios
            </div>
          ) : (
            filtered.map((opt) => (
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
                    <span className="truncate text-xs text-muted-foreground">
                      {opt.email}
                    </span>
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
