import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { RoleGuard } from "./components/RoleGuard";
import RegisterPage from "./pages/Register";
import SignInPage from "./pages/SignIn";
import AdminDashboard from "./pages/admin/Dashboard";
import AgentDashboard from "./pages/agent/Dashboard";
import DonorDashboard from "./pages/donor/Dashboard";
import NewDonationPage from "./pages/donor/NewDonation";
import NGODashboard from "./pages/ngo/Dashboard";
import { UserRole } from "./types";

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster richColors position="top-right" />
    </>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: SignInPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
});

// Donor routes
const donorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/donor",
  component: () => (
    <RoleGuard allowedRole={UserRole.donor}>
      <Outlet />
    </RoleGuard>
  ),
});

const donorDashboardRoute = createRoute({
  getParentRoute: () => donorRoute,
  path: "/",
  component: DonorDashboard,
});

const donorNewDonationRoute = createRoute({
  getParentRoute: () => donorRoute,
  path: "/new-donation",
  component: NewDonationPage,
});

// NGO routes
const ngoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ngo",
  component: () => (
    <RoleGuard allowedRole={UserRole.ngo}>
      <Outlet />
    </RoleGuard>
  ),
});

const ngoDashboardRoute = createRoute({
  getParentRoute: () => ngoRoute,
  path: "/",
  component: NGODashboard,
});

// Agent routes
const agentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/agent",
  component: () => (
    <RoleGuard allowedRole={UserRole.deliveryAgent}>
      <Outlet />
    </RoleGuard>
  ),
});

const agentDashboardRoute = createRoute({
  getParentRoute: () => agentRoute,
  path: "/",
  component: AgentDashboard,
});

// Admin routes
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: () => (
    <RoleGuard allowedRole={UserRole.admin}>
      <Outlet />
    </RoleGuard>
  ),
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/",
  component: AdminDashboard,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  registerRoute,
  donorRoute.addChildren([donorDashboardRoute, donorNewDonationRoute]),
  ngoRoute.addChildren([ngoDashboardRoute]),
  agentRoute.addChildren([agentDashboardRoute]),
  adminRoute.addChildren([adminDashboardRoute]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
