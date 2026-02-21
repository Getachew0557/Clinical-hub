import { useState } from "react";
import { Save, Building2, Users, Bell, Shield, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    appointments: true,
    marketing: false,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your clinic and account settings</p>
      </div>

      <Tabs defaultValue="clinic" className="flex flex-col gap-4">
        <TabsList className="w-fit">
          <TabsTrigger value="clinic" className="gap-2">
            <Building2 className="h-4 w-4" /> Clinic
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2">
            <Users className="h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" /> Security
          </TabsTrigger>
        </TabsList>

        {/* Clinic Settings */}
        <TabsContent value="clinic">
          <Card>
            <CardHeader>
              <CardTitle>Clinic Information</CardTitle>
              <CardDescription>Update your clinic details and contact information</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("Clinic settings saved!");
                }}
                className="flex flex-col gap-6"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label>Clinic Name</Label>
                    <Input defaultValue="Ras Dental Clinic Specialty Center" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Contact Email</Label>
                    <Input type="email" defaultValue="info@ras.dental" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Phone Number</Label>
                    <Input defaultValue="+1 555-0200" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Website</Label>
                    <Input defaultValue="https://ras.dental" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Address</Label>
                  <Textarea defaultValue="123 Healthcare Blvd, Suite 200, Springfield, IL 62701" rows={2} />
                </div>
                <Separator />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="flex flex-col gap-2">
                    <Label>Opening Time</Label>
                    <Input type="time" defaultValue="08:00" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Closing Time</Label>
                    <Input type="time" defaultValue="18:00" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Time Zone</Label>
                    <Select defaultValue="ct">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="et">Eastern Time</SelectItem>
                        <SelectItem value="ct">Central Time</SelectItem>
                        <SelectItem value="mt">Mountain Time</SelectItem>
                        <SelectItem value="pt">Pacific Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" className="gap-2">
                    <Save className="h-4 w-4" /> Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("Profile updated!");
                }}
                className="flex flex-col gap-6"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label>Full Name</Label>
                    <Input defaultValue={user?.name || ""} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Email</Label>
                    <Input type="email" defaultValue={user?.email || ""} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Phone</Label>
                    <Input defaultValue="+1 555-0201" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Role</Label>
                    <Input defaultValue={user?.role || ""} disabled className="capitalize" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Bio</Label>
                  <Textarea placeholder="A brief description about yourself..." rows={3} />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" className="gap-2">
                    <Save className="h-4 w-4" /> Save Profile
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {[
                {
                  key: "email" as const,
                  title: "Email Notifications",
                  description: "Receive notifications via email",
                },
                {
                  key: "sms" as const,
                  title: "SMS Notifications",
                  description: "Receive text message alerts",
                },
                {
                  key: "appointments" as const,
                  title: "Appointment Reminders",
                  description: "Get notified about upcoming appointments",
                },
                {
                  key: "marketing" as const,
                  title: "Marketing Updates",
                  description: "Receive promotional emails and updates",
                },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key]}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, [item.key]: checked }))
                    }
                  />
                </div>
              ))}
              <div className="flex justify-end">
                <Button onClick={() => toast.success("Notification preferences saved!")} className="gap-2">
                  <Save className="h-4 w-4" /> Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    toast.success("Password changed!");
                  }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-2">
                    <Label>Current Password</Label>
                    <Input type="password" required />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label>New Password</Label>
                      <Input type="password" required />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Confirm New Password</Label>
                      <Input type="password" required />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" className="gap-2">
                      <Shield className="h-4 w-4" /> Update Password
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Enable 2FA</p>
                    <p className="text-xs text-muted-foreground">
                      Use an authenticator app for additional security
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => toast.info("2FA setup would open here")}>
                    Set Up
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
