import { useFitConnectAuth } from "@/contexts/FitConnectAuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider,
  SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard, Users, Package, Building2, Calendar, Crown,
  CreditCard, Receipt, Bell, LogOut, PanelLeft, Settings,
  Sun, Moon, ChevronDown, Check, Loader2, UserCircle, Vote,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { UserRoleEnum } from "@/graphql/types";
import type { Company } from "@/graphql/types";
import { UserProfileDialog } from "./UserProfileDialog";
import { toast } from "sonner";
import { apolloClient } from "@/graphql/apollo-client";
import { GET_COMPANIES } from "@/graphql/operations";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "Usuarios", path: "/users" },
  { icon: Package, label: "Productos", path: "/products" },
  { icon: Building2, label: "Empresas", path: "/companies" },
  { icon: Calendar, label: "Horarios", path: "/schedules" },
  { icon: Crown, label: "Planes", path: "/plans" },
  { icon: CreditCard, label: "Suscripciones", path: "/subscriptions" },
  { icon: Receipt, label: "Transacciones", path: "/transactions" },
  { icon: CreditCard, label: "Métodos de Pago", path: "/payment-methods" },
  { icon: Bell, label: "Notificaciones", path: "/notifications" },
  { icon: Vote, label: "Encuestas", path: "/polls" },
  { icon: Settings, label: "Configuración", path: "/settings" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, isAuthenticated } = useFitConnectAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;
  if (!isAuthenticated) return null;

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({
  children, setSidebarWidth,
}: { children: React.ReactNode; setSidebarWidth: (w: number) => void }) {
  const { user, logout, activeCompanyId, companies, selectCompany, switchCompanyContext } = useFitConnectAuth();
  const { theme, toggleTheme } = useTheme();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [switchingCompany, setSwitchingCompany] = useState<string | null>(null);
  const [companySwitcherOpen, setCompanySwitcherOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const activeMenuItem = menuItems.find((item) => {
    if (item.path === "/") return location === "/";
    return location.startsWith(item.path);
  });

  // Show company switcher for boss, super_admin, or admin roles, or if user has multiple companies
  const isBoss = (
    !!user?.contextRole && [
      UserRoleEnum.BOSS,
      UserRoleEnum.SUPER_ADMIN,
      UserRoleEnum.SUPERADMIN,
      UserRoleEnum.ADMIN,
      'boss',
      'super_admin',
      'superadmin',
      'admin',
    ].includes(user.contextRole as string)
  ) || (companies && companies.length > 1);

  // Load ALL companies once when isBoss becomes true (e.g. after login)
  // Do NOT include activeCompanyId in deps — that would cause a reload loop
  // because resetStore triggers a re-render which changes activeCompanyId.
  useEffect(() => {
    if (!isBoss) return;
    setLoadingCompanies(true);
    apolloClient
      .query({
        query: GET_COMPANIES,
        variables: {},
        fetchPolicy: 'network-only',
      })
      .then(({ data }) => {
        const result = (data as Record<string, unknown>)?.getCompanies as
          | { success?: boolean; companies?: Company[]; company?: Company }
          | undefined;
        if (result?.companies && result.companies.length > 0) {
          setAllCompanies(result.companies);
        } else if (result?.company) {
          setAllCompanies([result.company]);
        } else {
          setAllCompanies(companies);
        }
      })
      .catch(() => {
        setAllCompanies(companies);
      })
      .finally(() => setLoadingCompanies(false));
  }, [isBoss]); // eslint-disable-line react-hooks/exhaustive-deps

  // The list to render in the switcher
  const switcherCompanies = isBoss && allCompanies.length > 0 ? allCompanies : companies;
  // Find the active company by comparing activeCompanyId (from React state/context)
  const activeCompany =
    allCompanies.find((c) => c.id === activeCompanyId) ??
    companies.find((c) => c.id === activeCompanyId) ??
    switcherCompanies[0];

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
      setCompanySwitcherOpen(false);
    }
  }, [isCollapsed]);

  // Resize drag logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const handleSwitchCompany = async (companyId: string, companyName?: string) => {
    if (companyId === activeCompanyId) return;
    setSwitchingCompany(companyId);
    setCompanySwitcherOpen(false);
    try {
      // Always use switchCompanyContext — it handles both boss and regular roles.
      // It updates localStorage, React state, calls UPDATE_USER mutation, and resets Apollo store.
      await switchCompanyContext(companyId, companyName);
      toast.success(`Empresa cambiada${companyName ? ` a ${companyName}` : ''} correctamente`);
    } catch {
      toast.error('Error al cambiar de empresa');
    } finally {
      setSwitchingCompany(null);
    }
  };

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0" disableTransition={isResizing}>
          {/* Header */}
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center shrink-0">
                    <span className="text-white text-[10px] font-bold">FC</span>
                  </div>
                  <span className="font-semibold tracking-tight truncate text-sm">FitConnect</span>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            {/* ===== BOSS COMPANY SWITCHER in sidebar ===== */}
            {isBoss && !isCollapsed && (
              <div className="px-3 py-2 border-b border-border/30 relative">
                <button
                  onClick={() => setCompanySwitcherOpen((o) => !o)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-accent/20 hover:bg-accent/50 transition-colors text-left"
                >
                  <div className="h-6 w-6 rounded overflow-hidden shrink-0 flex items-center justify-center bg-muted">
                    {activeCompany?.logo?.url ? (
                      <img src={activeCompany.logo.url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate text-foreground">
                      {activeCompany?.name || 'Sin empresa'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Empresa activa</p>
                  </div>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-200 ${companySwitcherOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Collapsible company list — absolute so it doesn't push nav items */}
                {companySwitcherOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-popover border border-border rounded-lg shadow-lg max-h-52 overflow-y-auto">
                    {loadingCompanies ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="ml-2 text-xs text-muted-foreground">Cargando empresas...</span>
                      </div>
                    ) : switcherCompanies.length === 0 ? (
                      <p className="text-xs text-muted-foreground px-3 py-2">No hay empresas disponibles</p>
                    ) : switcherCompanies.map((company) => {
                      const isActive = company.id === activeCompanyId;
                      const isSwitching = switchingCompany === company.id;
                      return (
                        <button
                          key={company.id}
                          onClick={() => handleSwitchCompany(company.id, company.name)}
                          disabled={switchingCompany !== null}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors text-sm
                            ${isActive
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-accent/50 text-foreground'
                            }
                            ${switchingCompany !== null && !isSwitching ? 'opacity-50' : ''}
                          `}
                        >
                          <div className="h-5 w-5 rounded overflow-hidden shrink-0 flex items-center justify-center bg-muted">
                            {company.logo?.url ? (
                              <img src={company.logo.url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Building2 className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                          <span className="flex-1 truncate text-xs font-medium">{company.name}</span>
                          {isSwitching
                            ? <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                            : isActive
                              ? <Check className="h-3 w-3 shrink-0" />
                              : null
                          }
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ===== BOSS COMPANY SWITCHER collapsed icon ===== */}
            {isBoss && isCollapsed && (
              <div className="px-2 py-2 border-b border-border/30">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="w-full flex items-center justify-center h-9 w-9 rounded-lg hover:bg-accent/50 transition-colors mx-auto"
                      title={`Empresa: ${activeCompany?.name || 'Sin empresa'}`}
                    >
                      <Building2 className="h-4 w-4 text-primary" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start" className="w-52">
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Cambiar empresa</DropdownMenuLabel>
                    {loadingCompanies ? (
                      <DropdownMenuItem disabled>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
                      </DropdownMenuItem>
                    ) : switcherCompanies.map((company) => (
                      <DropdownMenuItem
                        key={company.id}
                        onClick={() => handleSwitchCompany(company.id, company.name)}
                        disabled={switchingCompany !== null}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2 w-full">
                          {company.logo?.url
                            ? <img src={company.logo.url} alt="" className="h-5 w-5 rounded object-cover shrink-0" />
                            : <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                          }
                          <span className="truncate flex-1 text-sm">{company.name}</span>
                          {company.id === activeCompanyId && <Check className="h-4 w-4 text-primary shrink-0" />}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* ===== NAV ITEMS ===== */}
            <SidebarMenu className="px-2 py-1">
              {menuItems.map((item) => {
                const isActive = item.path === "/" ? location === "/" : location.startsWith(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className="h-10 transition-all font-normal"
                    >
                      <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          {/* ===== FOOTER: theme toggle + user menu ===== */}
          <SidebarFooter className="p-3">
            {/* Theme toggle */}
            {!isCollapsed && toggleTheme && (
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 w-full px-2 py-2 rounded-lg hover:bg-accent/50 transition-colors text-sm text-muted-foreground mb-2"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
              </button>
            )}
            {isCollapsed && toggleTheme && (
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-full py-2 rounded-lg hover:bg-accent/50 transition-colors text-muted-foreground mb-2"
                title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            )}

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left focus:outline-none">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarImage src={user?.pictureUrl?.url || ""} />
                    <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                      {(user?.name?.[0] || user?.nickname?.[0] || "?").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate leading-none">
                        {user?.name && user?.surname ? `${user.name} ${user.surname}` : user?.nickname || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-1">{user?.email || "—"}</p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-52">
                {/* Profile info header */}
                <div className="px-2 py-2 border-b border-border/50">
                  <p className="text-sm font-medium truncate">
                    {user?.name && user?.surname ? `${user.name} ${user.surname}` : user?.nickname || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email || "—"}</p>
                  <span className="inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary capitalize">
                    {user?.contextRole || 'user'}
                  </span>
                </div>

                {/* Edit profile */}
                <DropdownMenuItem
                  onClick={() => setProfileDialogOpen(true)}
                  className="cursor-pointer mt-1"
                >
                  <UserCircle className="mr-2 h-4 w-4" /> Mi Perfil
                </DropdownMenuItem>

                {/* Settings */}
                <DropdownMenuItem onClick={() => setLocation("/settings")} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" /> Configuración
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Logout */}
                <DropdownMenuItem
                  onClick={() => { logout(); setLocation("/login"); }}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Resize handle */}
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      {/* Main content */}
      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <span className="tracking-tight text-foreground">{activeMenuItem?.label ?? "Menu"}</span>
            </div>
            {toggleTheme && (
              <button onClick={toggleTheme} className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-accent transition-colors">
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            )}
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>

      {/* Profile edit dialog */}
      <UserProfileDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} />
    </>
  );
}
