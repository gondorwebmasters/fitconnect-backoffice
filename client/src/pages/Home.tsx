import { useEffect } from "react";
import { useLocation } from "wouter";

// Home redirects to dashboard — the app uses /login and DashboardLayout for all real pages.
export default function Home() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/");
  }, [setLocation]);
  return null;
}
