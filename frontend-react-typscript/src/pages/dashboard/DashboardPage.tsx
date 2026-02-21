import { Users, CalendarDays, Receipt, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { patients, appointments, invoices, inventory } from "../../data/mockData";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const stats = [
  {
    title: "Total Patients",
    value: patients.length.toString(),
    change: "+12%",
    icon: Users,
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Today's Appointments",
    value: appointments.filter((a) => a.date === "2026-02-21").length.toString(),
    change: "+3",
    icon: CalendarDays,
    color: "bg-accent/10 text-accent",
  },
  {
    title: "Revenue (Feb)",
    value: `$${invoices.reduce((sum, inv) => sum + inv.total, 0).toLocaleString()}`,
    change: "+8.2%",
    icon: Receipt,
    color: "bg-success/10 text-success",
  },
  {
    title: "Low Stock Items",
    value: inventory.filter((i) => i.status !== "In Stock").length.toString(),
    change: "Needs attention",
    icon: AlertTriangle,
    color: "bg-warning/10 text-warning",
  },
];

const weeklyData = [
  { day: "Mon", appointments: 12, revenue: 2400 },
  { day: "Tue", appointments: 15, revenue: 3100 },
  { day: "Wed", appointments: 10, revenue: 2000 },
  { day: "Thu", appointments: 18, revenue: 3600 },
  { day: "Fri", appointments: 14, revenue: 2800 },
  { day: "Sat", appointments: 8, revenue: 1600 },
  { day: "Sun", appointments: 0, revenue: 0 },
];

const treatmentDistribution = [
  { name: "Orthodontics", value: 30 },
  { name: "Endodontics", value: 25 },
  { name: "Periodontics", value: 20 },
  { name: "Prosthodontics", value: 15 },
  { name: "Surgery", value: 10 },
];

const COLORS = [
  "oklch(0.55 0.15 230)",
  "oklch(0.70 0.14 170)",
  "oklch(0.65 0.18 280)",
  "oklch(0.75 0.15 60)",
  "oklch(0.60 0.20 25)",
];

const monthlyRevenue = [
  { month: "Sep", revenue: 18500 },
  { month: "Oct", revenue: 21200 },
  { month: "Nov", revenue: 19800 },
  { month: "Dec", revenue: 24100 },
  { month: "Jan", revenue: 22600 },
  { month: "Feb", revenue: 26500 },
];

const todayAppointments = appointments.filter((a) => a.date === "2026-02-21");

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back. Here is an overview of your clinic today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Weekly Appointments */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Weekly Appointments</CardTitle>
            <CardDescription>Appointment volume this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 240)" />
                  <XAxis dataKey="day" fontSize={12} stroke="oklch(0.50 0.02 250)" />
                  <YAxis fontSize={12} stroke="oklch(0.50 0.02 250)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(1 0 0)",
                      border: "1px solid oklch(0.91 0.01 240)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="appointments" fill="oklch(0.55 0.15 230)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Treatment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Treatment Types</CardTitle>
            <CardDescription>Distribution this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={treatmentDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {treatmentDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(1 0 0)",
                      border: "1px solid oklch(0.91 0.01 240)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {treatmentDistribution.map((item, i) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  {item.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue + Today's Appointments */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Revenue Trend */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Revenue Trend</CardTitle>
            <CardDescription>Last 6 months performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 240)" />
                  <XAxis dataKey="month" fontSize={12} stroke="oklch(0.50 0.02 250)" />
                  <YAxis fontSize={12} stroke="oklch(0.50 0.02 250)" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(1 0 0)",
                      border: "1px solid oklch(0.91 0.01 240)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="oklch(0.70 0.14 170)" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Today's Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today's Schedule</CardTitle>
            <CardDescription>{todayAppointments.length} appointments</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {todayAppointments.slice(0, 5).map((apt) => (
              <div
                key={apt.id}
                className="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {apt.patientName.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{apt.patientName}</p>
                  <p className="text-xs text-muted-foreground truncate">{apt.reason}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {apt.time}
                  </div>
                  <Badge
                    variant={
                      apt.status === "In Progress" ? "default" :
                      apt.status === "Completed" ? "secondary" : "outline"
                    }
                    className="text-[10px]"
                  >
                    {apt.status}
                  </Badge>
                </div>
              </div>
            ))}
            {todayAppointments.length > 5 && (
              <p className="text-center text-xs text-muted-foreground">
                +{todayAppointments.length - 5} more appointments
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
