import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Phone, Mail, MapPin, Calendar, AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { patients, appointments, invoices } from "../../data/mockData";

export default function PatientDetailPage() {
  const { id } = useParams();
  const patient = patients.find((p) => p.id === id);

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-lg text-muted-foreground">Patient not found</p>
        <Link to="/patients">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Patients
          </Button>
        </Link>
      </div>
    );
  }

  const patientAppointments = appointments.filter((a) => a.patientId === patient.id);
  const patientInvoices = invoices.filter((i) => i.patientId === patient.id);

  return (
    <div className="flex flex-col gap-6">
      {/* Back Nav */}
      <Link to="/patients" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="h-4 w-4" /> Back to Patients
      </Link>

      {/* Profile Header */}
      <Card>
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {patient.name.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{patient.name}</h1>
              <Badge variant={patient.status === "Active" ? "default" : "secondary"}>
                {patient.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Patient ID: {patient.id}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Mail className="h-4 w-4" /> {patient.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="h-4 w-4" /> {patient.phone}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {patient.address}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Edit</Button>
            <Button size="sm">Book Appointment</Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Gender / Age</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{patient.gender}, {patient.age}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Registered</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{patient.registeredDate}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Last Visit</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{patient.lastVisit}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Allergies</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {patient.allergies.length > 0 ? (
                patient.allergies.map((a) => (
                  <Badge key={a} variant="destructive" className="text-xs gap-1">
                    <AlertCircle className="h-3 w-3" /> {a}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-foreground">None reported</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">Medical History</TabsTrigger>
          <TabsTrigger value="appointments">Appointments ({patientAppointments.length})</TabsTrigger>
          <TabsTrigger value="billing">Billing ({patientInvoices.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Medical History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed">{patient.medicalHistory}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {patientAppointments.length > 0 ? (
                <div className="divide-y divide-border">
                  {patientAppointments.map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{apt.reason}</p>
                          <p className="text-xs text-muted-foreground">
                            {apt.date} at {apt.time} - {apt.doctorName}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          apt.status === "Completed" ? "secondary" :
                          apt.status === "Cancelled" ? "destructive" : "default"
                        }
                        className="text-xs"
                      >
                        {apt.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-6 text-center text-sm text-muted-foreground">No appointments found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {patientInvoices.length > 0 ? (
                <div className="divide-y divide-border">
                  {patientInvoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">{inv.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {inv.date} - {inv.items.map((i) => i.treatment).join(", ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-foreground">${inv.total}</span>
                        <Badge
                          variant={
                            inv.status === "Paid" ? "default" :
                            inv.status === "Overdue" ? "destructive" : "secondary"
                          }
                          className="text-xs"
                        >
                          {inv.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-6 text-center text-sm text-muted-foreground">No invoices found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
