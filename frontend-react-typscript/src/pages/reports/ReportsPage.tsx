import { Download, Calendar, Users, DollarSign, TrendingUp, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "sonner";

const monthlyPatients = [
  { month: "Sep", new: 15, returning: 45 },
  { month: "Oct", new: 22, returning: 52 },
  { month: "Nov", new: 18, returning: 48 },
  { month: "Dec", new: 12, returning: 38 },
  { month: "Jan", new: 25, returning: 55 },
  { month: "Feb", new: 20, returning: 50 },
];

const revenueByService = [
  { service: "Orthodontics", revenue: 12500 },
  { service: "Endodontics", revenue: 9800 },
  { service: "Periodontics", revenue: 7200 },
  { service: "Prosthodontics", revenue: 8400 },
  { service: "Oral Surgery", revenue: 6100 },
  { service: "General", revenue: 5500 },
];

const appointmentTrend = [
  { week: "W1", completed: 42, cancelled: 3, noShow: 2 },
  { week: "W2", completed: 38, cancelled: 5, noShow: 1 },
  { week: "W3", completed: 45, cancelled: 2, noShow: 3 },
  { week: "W4", completed: 40, cancelled: 4, noShow: 2 },
];

const paymentMethods = [
  { name: "Insurance", value: 42 },
  { name: "Cash", value: 28 },
  { name: "Card", value: 22 },
  { name: "Mobile", value: 8 },
];

const COLORS = [
  "oklch(0.55 0.15 230)",
  "oklch(0.70 0.14 170)",
  "oklch(0.75 0.15 60)",
  "oklch(0.60 0.20 25)",
];

const dailyRevenue = [
  { day: "Mon", revenue: 3200 },
  { day: "Tue", revenue: 4100 },
  { day: "Wed", revenue: 2800 },
  { day: "Thu", revenue: 4500 },
  { day: "Fri", revenue: 3900 },
  { day: "Sat", revenue: 1800 },
];

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">Clinic performance insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Select defaultValue="feb2026">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="feb2026">February 2026</SelectItem>
              <SelectItem value="jan2026">January 2026</SelectItem>
              <SelectItem value="dec2025">December 2025</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2" onClick={() => toast.info("Exporting report...")}>
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Patients", value: "70", change: "+12%", icon: Users, color: "bg-primary/10 text-primary" },
          { label: "Appointments", value: "182", change: "+8%", icon: Calendar, color: "bg-accent/10 text-accent" },
          { label: "Revenue", value: "$49,500", change: "+15.3%", icon: DollarSign, color: "bg-success/10 text-success" },
          { label: "Avg Per Visit", value: "$272", change: "+5.1%", icon: Activity, color: "bg-warning/10 text-warning" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> {stat.change}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="patients">
        <TabsList>
          <TabsTrigger value="patients">Patient Analytics</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="mt-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Patient Volume</CardTitle>
                <CardDescription>New vs returning patients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyPatients}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 240)" />
                      <XAxis dataKey="month" fontSize={12} stroke="oklch(0.50 0.02 250)" />
                      <YAxis fontSize={12} stroke="oklch(0.50 0.02 250)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "oklch(1 0 0)",
                          border: "1px solid oklch(0.91 0.01 240)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="new" fill="oklch(0.55 0.15 230)" radius={[4, 4, 0, 0]} name="New" />
                      <Bar dataKey="returning" fill="oklch(0.70 0.14 170)" radius={[4, 4, 0, 0]} name="Returning" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment Methods</CardTitle>
                <CardDescription>Distribution by payment type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethods}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {paymentMethods.map((_, index) => (
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
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  {paymentMethods.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      {item.name} ({item.value}%)
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="mt-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Revenue by Service</CardTitle>
                <CardDescription>Top earning departments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueByService} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 240)" />
                      <XAxis type="number" fontSize={12} stroke="oklch(0.50 0.02 250)" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <YAxis dataKey="service" type="category" fontSize={11} stroke="oklch(0.50 0.02 250)" width={90} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "oklch(1 0 0)",
                          border: "1px solid oklch(0.91 0.01 240)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                      />
                      <Bar dataKey="revenue" fill="oklch(0.55 0.15 230)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Daily Revenue</CardTitle>
                <CardDescription>This week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 240)" />
                      <XAxis dataKey="day" fontSize={12} stroke="oklch(0.50 0.02 250)" />
                      <YAxis fontSize={12} stroke="oklch(0.50 0.02 250)" tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "oklch(1 0 0)",
                          border: "1px solid oklch(0.91 0.01 240)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="oklch(0.70 0.14 170)" fill="oklch(0.70 0.14 170 / 0.15)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="appointments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Appointment Outcomes</CardTitle>
              <CardDescription>Weekly breakdown by status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={appointmentTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 240)" />
                    <XAxis dataKey="week" fontSize={12} stroke="oklch(0.50 0.02 250)" />
                    <YAxis fontSize={12} stroke="oklch(0.50 0.02 250)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "oklch(1 0 0)",
                        border: "1px solid oklch(0.91 0.01 240)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="completed" fill="oklch(0.55 0.15 230)" radius={[4, 4, 0, 0]} name="Completed" />
                    <Bar dataKey="cancelled" fill="oklch(0.75 0.15 60)" radius={[4, 4, 0, 0]} name="Cancelled" />
                    <Bar dataKey="noShow" fill="oklch(0.60 0.20 25)" radius={[4, 4, 0, 0]} name="No Show" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
