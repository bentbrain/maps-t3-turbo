import { useEffect } from "react";
import { useUser } from "@clerk/chrome-extension";
import { LoaderCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router";

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoaded) return; // Wait for auth to load

    if (isSignedIn && location.pathname === "/signin") {
      // User is signed in but on signin page, redirect to dashboard
      navigate("/", { replace: true });
    } else if (!isSignedIn && location.pathname !== "/signin") {
      // User is not signed in but not on signin page, redirect to signin
      navigate("/signin", { replace: true });
    }
  }, [isSignedIn, isLoaded, location.pathname, navigate]);

  // Show loading while auth state is being determined
  if (!isLoaded) {
    return (
      <div className="absolute inset-0 grid place-items-center">
        <LoaderCircle className="size-4 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
};
