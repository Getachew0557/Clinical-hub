import { useState, useMemo } from "react";
import { Plus, Search, ChevronLeft, ChevronRight, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { appointments, doctors, patients } from "../../data/mockData";
import { toast } from "sonner";

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00",
];

const statusColorMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  Scheduled: "outline",
  "In Progress": "default",
  Completed: "secondary",
  Cancelled: "destructive",
};

export default function AppointmentsPage() {
  const [selectedDate, setSelectedDate] = useState("2026-02-21");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [view, setView] = useState<"list" | "calendar">("list");

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((a) => {
        const matchesSearch =
          a.patientName.toLowerCase().includes(search.toLowerCase()) ||
          a.doctorName.toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      });
  }, [search]);

  const dateAppointments = appointments.filter((a) => a.date === selectedDate);

  // Generate week dates for calendar view
  const weekDates = useMemo(() => {
    const base = new Date(selectedDate);
    const dayOfWeek = base.getDay();
    const monday = new Date(base);
    monday.setDate(base.getDate() - ((dayOfWeek + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split("T")[0];
    });
  }, [selectedDate]);

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const navigateDate = (dir: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
          <p className="text-sm text-muted-foreground">{appointments.length} total appointments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Book Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>New Appointment</DialogTitle>
              <DialogDescription>Schedule a new appointment</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Appointment booked successfully!");
                setDialogOpen(false);
              }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <Label>Patient</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Doctor</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                  <SelectContent>
                    {doctors.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name} - {d.specialty}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Date</Label>
                  <Input type="date" defaultValue="2026-02-21" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Time</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Type</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Check-up">Check-up</SelectItem>
                    <SelectItem value="Treatment">Treatment</SelectItem>
                    <SelectItem value="Follow-up">Follow-up</SelectItem>
                    <SelectItem value="Consultation">Consultation</SelectItem>
                    <SelectItem value="Emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Reason / Notes</Label>
                <Textarea placeholder="Describe the reason for the visit..." rows={2} />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Book Appointment</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as "list" | "calendar")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>

          {/* Date Nav */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateDate(-1)} aria-label="Previous day">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
            <Button variant="outline" size="icon" onClick={() => navigateDate(1)} aria-label="Next day">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* List View */}
        <TabsContent value="list" className="mt-4">
          {/* Search */}
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search appointments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              aria-label="Search appointments"
            />
          </div>

          <div className="flex flex-col gap-3">
            {filteredAppointments.map((apt) => (
              <Card key={apt.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {apt.patientName.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">{apt.patientName}</p>
                      <p className="text-xs text-muted-foreground">{apt.reason}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <User className="h-3 w-3" /> {apt.doctorName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{apt.date}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        <Clock className="h-3 w-3" /> {apt.time}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <Badge variant={statusColorMap[apt.status] || "outline"} className="text-xs">
                        {apt.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">{apt.type}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Calendar View */}
        <TabsContent value="calendar" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Weekly Schedule</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <div className="min-w-[700px]">
                {/* Day headers */}
                <div className="grid grid-cols-8 border-b border-border">
                  <div className="p-3 text-xs font-medium text-muted-foreground">Time</div>
                  {weekDates.map((date, i) => {
                    const isToday = date === "2026-02-21";
                    return (
                      <div
                        key={date}
                        className={`p-3 text-center ${isToday ? "bg-primary/5" : ""}`}
                      >
                        <p className="text-xs font-medium text-muted-foreground">{dayNames[i]}</p>
                        <p className={`text-sm font-semibold ${isToday ? "text-primary" : "text-foreground"}`}>
                          {new Date(date + "T12:00:00").getDate()}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Time rows */}
                {timeSlots.filter((_, i) => i % 2 === 0).map((slot) => (
                  <div key={slot} className="grid grid-cols-8 border-b border-border last:border-0">
                    <div className="p-2 text-xs text-muted-foreground flex items-start justify-end pr-3 pt-3">
                      {slot}
                    </div>
                    {weekDates.map((date) => {
                      const slotAppts = appointments.filter(
                        (a) => a.date === date && (a.time === slot || a.time === `${slot.split(":")[0]}:30`)
                      );
                      const isToday = date === "2026-02-21";
                      return (
                        <div
                          key={date + slot}
                          className={`min-h-[60px] border-l border-border p-1 ${isToday ? "bg-primary/5" : ""}`}
                        >
                          {slotAppts.map((a) => (
                            <div
                              key={a.id}
                              className="mb-1 rounded-md bg-primary/10 border border-primary/20 p-1.5 text-[10px] cursor-pointer hover:bg-primary/20 transition-colors"
                            >
                              <p className="font-medium text-foreground truncate">{a.patientName}</p>
                              <p className="text-muted-foreground truncate">{a.time}</p>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
