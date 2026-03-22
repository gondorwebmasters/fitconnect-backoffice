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
  Sun, Moon, ChevronDown, Check, RefreshCw,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { UserRoleEnum } from "@/graphql/types";
import { toast } from "sonner";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "Usuarios", path: "/users" },
  { icon: Package, label: "Productos", path: "/products" },
  { icon: Building2, label: "Empresas", path: "/companies" },
  { icon: Calendar, label: "Horarios", path: "/schedules" },
  { icon: Crown, label: "Planes", path: "/plans" },
  { icon: RefreshCw, label: "Suscripciones", path: "/subscriptions" },
  { icon: Receipt, label: "Transacciones", path: "/transactions" },
  { icon: CreditCard, label: "Métodos de Pago", path: "/payment-methods" },
  { icon: Bell, label: "Notificaciones", path: "/notifications" },
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
  const { user, logout, activeCompanyId, companies, selectCompany } = useFitConnectAuth();
  const { theme, toggleTheme } = useTheme();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [switchingCompany, setSwitchingCompany] = useState<string | null>(null);

  const activeMenuItem = menuItems.find((item) => {
    if (item.path === "/") return location === "/";
    return location.startsWith(item.path);
  });

  const activeCompany = companies.find((c) => c.id === activeCompanyId);
  const isBoss = user?.contextRole === UserRoleEnum.BOSS;

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

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

  const handleSwitchCompany = async (companyId: string) => {
    if (companyId === activeCompanyId) return;
    setSwitchingCompany(companyId);
    try {
      await selectCompany(companyId);
      toast.success('Empresa cambiada correctamente');
      // Stay on current page — the data will refetch with new x-company-id
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
                  <div className="h-6 w-6 rounded-md bg-[#F97316] flex items-center justify-center shrink-0">
                    <span className="text-white text-[10px] font-bold">FC</span>
                  </div>
                  <span className="font-semibold tracking-tight truncate text-sm">FitConnect</span>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            {/* Boss company switcher */}
            {isBoss && companies.length > 1 && !isCollapsed && (
              <div className="px-3 py-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-accent/30 hover:bg-accent/60 transition-colors text-left">
                      <Building2 className="h-4 w-4 text-[#F97316] shrink-0" />
                      <span className="text-xs font-medium truncate flex-1">{activeCompany?.name || 'Seleccionar empresa'}</span>
                      <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Cambiar empresa</DropdownMenuLabel>
                    {companies.map((company) => (
                      <DropdownMenuItem
                        key={company.id}
                        onClick={() => handleSwitchCompany(company.id)}
                        disabled={switchingCompany !== null}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2 w-full">
                          {company.logo?.url ? (
                            <img src={company.logo.url} alt="" className="h-5 w-5 rounded object-cover shrink-0" />
                          ) : (
                            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <span className="truncate flex-1 text-sm">{company.name}</span>
                          {company.id === activeCompanyId && <Check className="h-4 w-4 text-[#F97316] shrink-0" />}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

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
                      <item.icon className={`h-4 w-4 ${isActive ? "text-[#F97316]" : ""}`} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

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
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarImage src={user?.pictureUrl?.url || ""} />
                    <AvatarFallback className="text-xs font-medium bg-[#F97316]/10 text-[#F97316]">
                      {(user?.name?.[0] || user?.nickname?.[0] || "?").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name && user?.surname ? `${user.name} ${user.surname}` : user?.nickname || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">{user?.email || "—"}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {isBoss && companies.length > 1 && (
                  <>
                    <DropdownMenuItem onClick={() => setLocation("/select-company")} className="cursor-pointer">
                      <Building2 className="mr-2 h-4 w-4" /> Cambiar Empresa
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => setLocation("/settings")} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" /> Configuración
                </DropdownMenuItem>
                <DropdownMenuSeparator />
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
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

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
    </>
  );
}
