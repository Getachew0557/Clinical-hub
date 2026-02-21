import { useState } from "react";
import { Search, FileText, Plus, Pill, StickyNote, Image as ImageIcon, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { patients } from "../../data/mockData";
import { toast } from "sonner";

const mockRecords = [
  {
    id: "EMR001",
    patientId: "P001",
    patientName: "John Anderson",
    date: "2026-02-10",
    doctor: "Dr. Sarah Khan",
    diagnosis: "Pulpitis - Tooth #14",
    treatment: "Root Canal Therapy completed successfully. Temporary crown placed.",
    prescription: "Amoxicillin 500mg TID x 7 days, Ibuprofen 400mg PRN",
    notes: "Patient tolerated procedure well. Follow-up in 2 weeks for permanent crown.",
    attachments: ["X-Ray #14 (Pre-op)", "X-Ray #14 (Post-op)"],
    type: "Treatment",
  },
  {
    id: "EMR002",
    patientId: "P002",
    patientName: "Emily Roberts",
    date: "2026-02-15",
    doctor: "Dr. Ahmad Ras",
    diagnosis: "Orthodontic Progress - Normal",
    treatment: "Wire adjustment on upper and lower arches. Elastic bands replaced.",
    prescription: "None",
    notes: "Good progress. Teeth alignment improving. Next adjustment in 4 weeks.",
    attachments: ["Progress Photo - Front", "Progress Photo - Side"],
    type: "Follow-up",
  },
  {
    id: "EMR003",
    patientId: "P003",
    patientName: "Michael Chen",
    date: "2026-01-28",
    doctor: "Dr. James Wilson",
    diagnosis: "Chronic Periodontitis - Moderate",
    treatment: "Scaling and root planing completed in all four quadrants.",
    prescription: "Chlorhexidine Mouthwash 0.12% BID x 14 days",
    notes: "Patient advised on improved oral hygiene techniques. Re-evaluation in 6 weeks.",
    attachments: ["Periodontal Chart"],
    type: "Treatment",
  },
  {
    id: "EMR004",
    patientId: "P004",
    patientName: "Sarah Williams",
    date: "2026-02-18",
    doctor: "Dr. Ahmad Ras",
    diagnosis: "Post-orthodontic retention",
    treatment: "Permanent retainer bonded to lower anteriors. Removable retainer fitted for upper.",
    prescription: "None",
    notes: "Instructions given for retainer care. Review in 3 months.",
    attachments: [],
    type: "Treatment",
  },
  {
    id: "EMR005",
    patientId: "P008",
    patientName: "Jennifer Lee",
    date: "2026-02-19",
    doctor: "Dr. Sarah Khan",
    diagnosis: "Cosmetic consultation - Veneers",
    treatment: "Impressions taken for porcelain veneer preparation. Shade A1 selected.",
    prescription: "None",
    notes: "Patient approved treatment plan for 6 upper anterior veneers. Procedure scheduled for next week.",
    attachments: ["Smile Design Mock-up", "Shade Guide Photo"],
    type: "Consultation",
  },
];

export default function EMRPage() {
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(mockRecords[0]);
  const [addRecordOpen, setAddRecordOpen] = useState(false);

  const filtered = mockRecords.filter(
    (r) =>
      r.patientName.toLowerCase().includes(search.toLowerCase()) ||
      r.diagnosis.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Medical Records</h1>
          <p className="text-sm text-muted-foreground">Electronic Medical Records (EMR)</p>
        </div>
        <Dialog open={addRecordOpen} onOpenChange={setAddRecordOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Record</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Medical Record</DialogTitle>
              <DialogDescription>Create a new EMR entry for a patient</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Medical record added!");
                setAddRecordOpen(false);
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
                <Label>Diagnosis</Label>
                <Input placeholder="Enter diagnosis..." required />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Treatment</Label>
                <Textarea placeholder="Describe treatment performed..." rows={3} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Prescription</Label>
                <Textarea placeholder="Medications prescribed..." rows={2} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Notes</Label>
                <Textarea placeholder="Additional clinical notes..." rows={2} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Attach Files</Label>
                <Input type="file" multiple className="text-sm" />
                <p className="text-xs text-muted-foreground">X-rays, photos, documents</p>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setAddRecordOpen(false)}>Cancel</Button>
                <Button type="submit">Save Record</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Records List */}
        <div className="xl:col-span-1 flex flex-col gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              aria-label="Search medical records"
            />
          </div>

          <div className="flex flex-col gap-2">
            {filtered.map((record) => (
              <Card
                key={record.id}
                className={`cursor-pointer transition-colors ${
                  selectedRecord.id === record.id ? "border-primary bg-primary/5" : "hover:bg-secondary/50"
                }`}
                onClick={() => setSelectedRecord(record)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {record.patientName.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{record.patientName}</p>
                      <p className="text-xs text-muted-foreground truncate">{record.diagnosis}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {record.date}
                        </span>
                        <Badge variant="outline" className="text-[10px]">{record.type}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Record Detail */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{selectedRecord.patientName}</CardTitle>
                  <CardDescription>
                    {selectedRecord.date} - {selectedRecord.doctor} - {selectedRecord.id}
                  </CardDescription>
                </div>
                <Badge>{selectedRecord.type}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="prescription">Prescription</TabsTrigger>
                  <TabsTrigger value="attachments">Attachments</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4 flex flex-col gap-5">
                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">Diagnosis</h3>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{selectedRecord.diagnosis}</p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-accent" />
                      <h3 className="text-sm font-semibold text-foreground">Treatment</h3>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{selectedRecord.treatment}</p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <StickyNote className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold text-foreground">Clinical Notes</h3>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{selectedRecord.notes}</p>
                  </div>
                </TabsContent>

                <TabsContent value="prescription" className="mt-4">
                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Pill className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">Prescription</h3>
                    </div>
                    {selectedRecord.prescription !== "None" ? (
                      <div className="flex flex-col gap-2">
                        {selectedRecord.prescription.split(", ").map((med, i) => (
                          <div key={i} className="flex items-center gap-3 rounded-md bg-secondary p-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                              <Pill className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-sm text-foreground">{med}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No medications prescribed</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="attachments" className="mt-4">
                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">Attachments</h3>
                    </div>
                    {selectedRecord.attachments.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {selectedRecord.attachments.map((att, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-secondary/50 cursor-pointer transition-colors"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                              <ImageIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{att}</p>
                              <p className="text-xs text-muted-foreground">Click to view</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No attachments</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
