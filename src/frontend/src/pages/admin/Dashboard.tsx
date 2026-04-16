import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  Package,
  TrendingUp,
  Truck,
  UserCheck,
  UserX,
  Users,
  Utensils,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Layout } from "../../components/Layout";
import { RoleBadge, statusBadge } from "../../components/RoleBadge";
import { useAdminData, useAdminUsers } from "../../hooks/useDonations";
import type {
  DonationStatus as DS,
  UserRole as UR,
  UserStatus as US,
} from "../../types";
import { DonationStatus, UserRole, UserStatus } from "../../types";

const CHART_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

const monthlyData = [
  { month: "Nov", donations: 18 },
  { month: "Dec", donations: 24 },
  { month: "Jan", donations: 31 },
  { month: "Feb", donations: 28 },
  { month: "Mar", donations: 37 },
  { month: "Apr", donations: 44 },
];

type UserRoleFilter = "all" | UR;
type DonationStatusFilter = "all" | DS;

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminDashboard() {
  const {
    analytics,
    allDonations,
    isLoading: dataLoading,
  } = useAdminData(30000);
  const {
    users,
    isLoading: usersLoading,
    deactivateUser,
    reactivateUser,
  } = useAdminUsers();

  const [userRoleFilter, setUserRoleFilter] = useState<UserRoleFilter>("all");
  const [donationStatusFilter, setDonationStatusFilter] =
    useState<DonationStatusFilter>("all");

  const filteredUsers =
    userRoleFilter === "all"
      ? users
      : users.filter((u) => u.role === userRoleFilter);

  const filteredDonations =
    donationStatusFilter === "all"
      ? allDonations
      : allDonations.filter((d) => d.status === donationStatusFilter);

  const pieData = analytics
    ? [
        { name: "Completed", value: analytics.completed },
        { name: "Pending", value: analytics.pending },
        { name: "Accepted", value: analytics.accepted },
        { name: "Assigned", value: analytics.assigned },
        {
          name: "Rejected/Cancelled",
          value: analytics.rejected + analytics.cancelled,
        },
      ].filter((d) => d.value > 0)
    : [];

  const completionRate = analytics?.totalDonations
    ? Math.round((analytics.completed / analytics.totalDonations) * 100)
    : 0;

  const handleToggleUser = async (userId: string, currentStatus: US) => {
    try {
      if (currentStatus === UserStatus.active) {
        await deactivateUser(userId);
        toast.success("User deactivated.");
      } else {
        await reactivateUser(userId);
        toast.success("User reactivated.");
      }
    } catch {
      toast.error("Failed to update user status.");
    }
  };

  const roleFilterOptions: { value: UserRoleFilter; label: string }[] = [
    { value: "all", label: "All Roles" },
    { value: UserRole.donor, label: "Donors" },
    { value: UserRole.ngo, label: "NGOs" },
    { value: UserRole.deliveryAgent, label: "Delivery Agents" },
  ];

  const statusFilterOptions: { value: DonationStatusFilter; label: string }[] =
    [
      { value: "all", label: "All Status" },
      { value: DonationStatus.pending, label: "Pending" },
      { value: DonationStatus.accepted, label: "Accepted" },
      { value: DonationStatus.assigned, label: "Assigned" },
      { value: DonationStatus.inTransit, label: "In Transit" },
      { value: DonationStatus.completed, label: "Completed" },
      { value: DonationStatus.rejected, label: "Rejected" },
      { value: DonationStatus.cancelled, label: "Cancelled" },
    ];

  return (
    <Layout>
      <div
        className="max-w-6xl mx-auto px-4 py-6 space-y-8"
        data-ocid="admin.dashboard.page"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Platform overview ·{" "}
              {new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold text-primary">Live</span>
          </div>
        </div>

        {/* KPI Cards */}
        {dataLoading || !analytics ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
            data-ocid="admin.analytics.section"
          >
            {[
              {
                icon: Package,
                label: "Total Donations",
                value: analytics.totalDonations,
                color: "text-foreground",
                bg: "bg-muted/40",
              },
              {
                icon: CheckCircle2,
                label: "Completed Pickups",
                value: analytics.completed,
                color: "text-primary",
                bg: "bg-primary/8",
              },
              {
                icon: Clock,
                label: "Pending Donations",
                value: analytics.pending,
                color: "text-amber-600",
                bg: "bg-amber-50",
              },
              {
                icon: Building2,
                label: "Active NGOs",
                value: analytics.activeNGOs,
                color: "text-secondary",
                bg: "bg-secondary/8",
              },
              {
                icon: Utensils,
                label: "Total Food (servings)",
                value: `${analytics.totalQuantity.toLocaleString()}+`,
                color: "text-accent-foreground",
                bg: "bg-accent/10",
              },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className={`card-elevated p-4 ${bg}`}>
                <Icon className={`w-5 h-5 mb-2 ${color}`} />
                <p className={`font-bold text-2xl ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                  {label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Charts */}
        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card-elevated p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-semibold text-sm">
                  Monthly Donations Trend
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart
                  data={monthlyData}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                    }}
                  />
                  <Bar
                    dataKey="donations"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card-elevated p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-semibold text-sm">Status Breakdown</h2>
              </div>
              {pieData.length > 0 ? (
                <div className="flex items-center gap-2">
                  <ResponsiveContainer width="50%" height={170}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={72}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {pieData.map((entry, index) => (
                      <div
                        key={entry.name}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            background:
                              CHART_COLORS[index % CHART_COLORS.length],
                          }}
                        />
                        <span className="text-muted-foreground truncate">
                          {entry.name}
                        </span>
                        <span className="ml-auto font-bold">{entry.value}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Completion Rate{" "}
                        <span className="font-bold text-primary">
                          {completionRate}%
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                  No donation data yet
                </div>
              )}
            </div>
          </div>
        )}

        {/* User Management */}
        <div className="card-elevated" data-ocid="admin.users.section">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-border">
            <h2 className="font-semibold flex items-center gap-2 text-base">
              <Users className="w-4 h-4 text-muted-foreground" />
              User Management
              <span className="text-xs font-normal text-muted-foreground">
                ({filteredUsers.length} shown)
              </span>
            </h2>
            <div
              className="flex flex-wrap gap-1.5"
              data-ocid="admin.users.role_filter"
            >
              {roleFilterOptions.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setUserRoleFilter(value)}
                  data-ocid={`admin.users.filter.${value}`}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-smooth border ${
                    userRoleFilter === value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {usersLoading ? (
            <div className="p-5 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-ocid="admin.users.table">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-left">
                    <th className="px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                      Name
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                      Role
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden sm:table-cell">
                      Phone / Org
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">
                      Joined
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, i) => {
                    const isActive = user.status === UserStatus.active;
                    return (
                      <tr
                        key={user.id}
                        className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                        data-ocid={`admin.user.item.${i + 1}`}
                      >
                        <td className="px-5 py-3">
                          <div>
                            <p className="font-semibold truncate max-w-[140px]">
                              {user.name}
                            </p>
                            {user.orgName && (
                              <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                                {user.orgName}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <RoleBadge role={user.role} size="sm" />
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <p className="text-muted-foreground text-xs">
                            {user.phone}
                          </p>
                          {user.orgName && (
                            <p className="text-xs text-muted-foreground/60 truncate max-w-[160px]">
                              {user.orgName}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-primary" : "bg-muted-foreground"}`}
                            />
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              void handleToggleUser(user.id, user.status)
                            }
                            data-ocid={
                              isActive
                                ? `admin.user.deactivate_button.${i + 1}`
                                : `admin.user.reactivate_button.${i + 1}`
                            }
                            className={`text-xs h-7 px-3 ${
                              isActive
                                ? "border-destructive/40 text-destructive hover:bg-destructive/10"
                                : "border-primary/40 text-primary hover:bg-primary/10"
                            }`}
                          >
                            {isActive ? (
                              <>
                                <UserX className="w-3 h-3 mr-1" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3 h-3 mr-1" />
                                Reactivate
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredUsers.length === 0 && !usersLoading && (
                <div
                  className="py-10 text-center text-muted-foreground text-sm"
                  data-ocid="admin.users.empty_state"
                >
                  No users found for this role.
                </div>
              )}
            </div>
          )}
        </div>

        {/* All Donations */}
        <div className="card-elevated" data-ocid="admin.donations.section">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-border">
            <h2 className="font-semibold flex items-center gap-2 text-base">
              <Truck className="w-4 h-4 text-muted-foreground" />
              All Donations
              <span className="text-xs font-normal text-muted-foreground">
                ({filteredDonations.length} shown)
              </span>
            </h2>
            <div
              className="flex flex-wrap gap-1.5"
              data-ocid="admin.donations.status_filter"
            >
              {statusFilterOptions.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDonationStatusFilter(value)}
                  data-ocid={`admin.donations.filter.${value}`}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-smooth border ${
                    donationStatusFilter === value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {dataLoading ? (
            <div className="p-5 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table
                className="w-full text-sm"
                data-ocid="admin.donations.table"
              >
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-left">
                    <th className="px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                      Donor ID
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                      Food Type
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden sm:table-cell">
                      Qty
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell text-right">
                      Posted
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDonations.map((d, i) => {
                    const { className, label } = statusBadge(d.status as DS);
                    return (
                      <tr
                        key={d.id}
                        className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                        data-ocid={`admin.donation.item.${i + 1}`}
                      >
                        <td className="px-5 py-3">
                          <p className="font-semibold truncate max-w-[120px] text-xs text-muted-foreground">
                            {d.donorId.slice(0, 8)}…
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="truncate max-w-[140px]">{d.foodType}</p>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                          {d.quantity} {d.unit}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={`${className} text-xs`}
                          >
                            {label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs text-right">
                          {formatDate(d.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredDonations.length === 0 && (
                <div
                  className="py-10 text-center text-muted-foreground text-sm"
                  data-ocid="admin.donations.empty_state"
                >
                  No donations match the selected filter.
                </div>
              )}
            </div>
          )}
        </div>

        {/* System Health */}
        {analytics && (
          <div className="card-elevated p-5" data-ocid="admin.system.section">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              System Health
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Active NGOs", value: analytics.activeNGOs, ok: true },
                {
                  label: "Active Agents",
                  value: users.filter(
                    (u) =>
                      u.role === "deliveryAgent" &&
                      u.status === UserStatus.active,
                  ).length,
                  ok: true,
                },
                {
                  label: "Rejected / Cancelled",
                  value: analytics.rejected + analytics.cancelled,
                  ok: analytics.rejected + analytics.cancelled === 0,
                },
                {
                  label: "Completion Rate",
                  value: `${completionRate}%`,
                  ok: analytics.completed > 0,
                },
              ].map(({ label, value, ok }) => (
                <div
                  key={label}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/40 border border-border"
                >
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-bold text-sm mt-0.5">{value}</p>
                  </div>
                  <div
                    className={`w-3 h-3 rounded-full ${ok ? "bg-primary" : "bg-destructive"}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
