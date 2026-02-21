import { useState } from "react";
import { Link } from "react-router-dom";
import { Stethoscope, Calendar, FileText, Receipt, MessageSquare, ArrowLeft, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const portalAppointments = [
  { id: "A001", date: "2026-02-21", time: "09:00", doctor: "Dr. Sarah Khan", reason: "Root Canal Follow-up", status: "Upcoming" },
  { id: "A008", date: "2026-02-22", time: "09:00", doctor: "Dr. Omar Fadel", reason: "Wisdom Tooth Evaluation", status: "Upcoming" },
  { id: "A010", date: "2026-02-20", time: "15:00", doctor: "Dr. Omar Fadel", reason: "Post-Extraction Follow-up", status: "Completed" },
];

const portalInvoices = [
  { id: "INV001", date: "2026-02-10", total: 900, status: "Paid" },
  { id: "INV005", date: "2026-01-28", total: 250, status: "Overdue" },
];

const chatMessages = [
  { from: "clinic", text: "Hello John! How can we help you today?", time: "10:30 AM" },
  { from: "patient", text: "I have a question about my upcoming appointment.", time: "10:32 AM" },
  { from: "clinic", text: "Of course! What would you like to know about your appointment on Feb 21st?", time: "10:33 AM" },
];

export default function PatientPortalPage() {
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState(chatMessages);

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages([...messages, { from: "patient", text: chatInput, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    setChatInput("");
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { from: "clinic", text: "Thank you for your message! Our team will review and respond shortly.", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Portal Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Patient Portal</h1>
              <p className="text-xs text-muted-foreground">Ras Dental Clinic</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">JA</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground">John Anderson</span>
            </div>
            <Link to="/login">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Staff Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Tabs defaultValue="appointments" className="flex flex-col gap-4">
          <TabsList className="w-fit">
            <TabsTrigger value="appointments" className="gap-2">
              <Calendar className="h-4 w-4" /> Appointments
            </TabsTrigger>
            <TabsTrigger value="records" className="gap-2">
              <FileText className="h-4 w-4" /> Records
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <Receipt className="h-4 w-4" /> Billing
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" /> Chat
            </TabsTrigger>
          </TabsList>

          {/* Appointments */}
          <TabsContent value="appointments">
            <div className="flex flex-col gap-4">
              {/* Book new */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Book an Appointment</CardTitle>
                  <CardDescription>Schedule your next visit</CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      toast.success("Appointment requested! We will confirm shortly.");
                    }}
                    className="grid grid-cols-1 gap-4 sm:grid-cols-3"
                  >
                    <div className="flex flex-col gap-2">
                      <Label>Preferred Date</Label>
                      <Input type="date" defaultValue="2026-02-25" required />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Preferred Time</Label>
                      <Select>
                        <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="09:00">09:00 AM</SelectItem>
                          <SelectItem value="10:00">10:00 AM</SelectItem>
                          <SelectItem value="11:00">11:00 AM</SelectItem>
                          <SelectItem value="14:00">02:00 PM</SelectItem>
                          <SelectItem value="15:00">03:00 PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button type="submit" className="w-full">Request Appointment</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Existing Appointments */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Your Appointments</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {portalAppointments.map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{apt.reason}</p>
                          <p className="text-xs text-muted-foreground">{apt.doctor}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" /> {apt.date} at {apt.time}
                          </p>
                        </div>
                      </div>
                      <Badge variant={apt.status === "Upcoming" ? "default" : "secondary"} className="text-xs">
                        {apt.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Records */}
          <TabsContent value="records">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Treatment History</CardTitle>
                <CardDescription>Your medical records summary</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {[
                  { date: "2026-02-10", treatment: "Root Canal Therapy", doctor: "Dr. Sarah Khan", notes: "Tooth #14 treatment completed. Temporary crown placed." },
                  { date: "2025-11-15", treatment: "Dental Cleaning", doctor: "Dr. James Wilson", notes: "Routine cleaning and polishing. Good oral health." },
                  { date: "2025-06-22", treatment: "Teeth Whitening", doctor: "Dr. Maria Garcia", notes: "In-office whitening treatment. 3 shades improvement." },
                ].map((record, i) => (
                  <div key={i} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">{record.treatment}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{record.date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">By {record.doctor}</p>
                    <p className="text-sm text-foreground leading-relaxed">{record.notes}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing */}
          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Invoices</CardTitle>
                <CardDescription>View and download your bills</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {portalInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{inv.id}</p>
                      <p className="text-xs text-muted-foreground">{inv.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-foreground">${inv.total}</span>
                      <Badge
                        variant={inv.status === "Paid" ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {inv.status}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => toast.info("Downloading...")}>
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat */}
          <TabsContent value="chat">
            <Card className="flex flex-col" style={{ height: "500px" }}>
              <CardHeader>
                <CardTitle className="text-base">Chat with Clinic</CardTitle>
                <CardDescription>Send us a message and we will respond shortly</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden">
                {/* Messages */}
                <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-2">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.from === "patient" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-xl px-4 py-2.5 ${
                          msg.from === "patient"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-[10px] mt-1 ${msg.from === "patient" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Input */}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    className="flex-1"
                    aria-label="Chat message"
                  />
                  <Button onClick={sendMessage} size="icon" aria-label="Send message">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
