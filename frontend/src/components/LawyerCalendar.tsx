import React, { Component, ReactNode, useState, useEffect } from "react";
import api from "../lib/api";
import { Calendar } from "../components/ui/calendar";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  MapPin,
  Gavel,
  Coffee,
  RefreshCw,
  Download,
  User,
} from "lucide-react";
import {
  format,
  isSameDay,
  parseISO,
  isSunday,
  addDays,
  startOfWeek,
  isAfter,
  addMinutes,
  isWithinInterval,
  isValid,
} from "date-fns";
import {
  CalendarEvent,
  Holiday,
  AvailableSlot,
  WeeklySchedule,
  Lawyer,
} from "../../../types/calendar";
import { toast } from "sonner";

// Error Boundary to catch rendering errors
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <h1 className="text-red-600 text-center">
          Error rendering events. Please try again.
        </h1>
      );
    }
    return this.props.children;
  }
}

interface LawyerCalendarProps {
  lawyerId?: string;
}

interface CalendarData {
  events: CalendarEvent[];
  holidays: Holiday[];
  availableSlots: AvailableSlot[];
  weeklySchedule: WeeklySchedule | null;
  upcomingHearings: CalendarEvent[];
}

export const LawyerCalendar: React.FC<LawyerCalendarProps> = ({
  lawyerId: propLawyerId,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isAddHolidayOpen, setIsAddHolidayOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [calendarData, setCalendarData] = useState<CalendarData>({
    events: [],
    holidays: [],
    availableSlots: [],
    weeklySchedule: null,
    upcomingHearings: [],
  });
  const [lawyerId, setLawyerId] = useState<string | undefined>(propLawyerId);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newEvent, setNewEvent] = useState({
    type: "hearing",
    time: "09:00",
    period: "AM",
  });
  const [newHoliday, setNewHoliday] = useState({
    name: "",
    date: format(new Date(), "yyyy-MM-dd"),
  });

  const availableHours = Array.from({ length: 8 }, (_, i) => {
    const hour = 9 + i;
    return `${hour.toString().padStart(2, "0")}:00`;
  });

  useEffect(() => {
    if (!propLawyerId) {
      fetchLawyerId();
    } else {
      setLawyerId(propLawyerId);
    }
  }, [propLawyerId]);

  useEffect(() => {
    if (lawyerId) fetchCalendarData();
  }, [lawyerId]);

  const fetchLawyerId = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get("/calendar/me");
      const lawyer: Lawyer = response.data;
      if (!lawyer.id) throw new Error("Invalid lawyer data.");
      setLawyerId(lawyer.id);
    } catch (err: any) {
      console.error("Fetch lawyer ID error:", err);
      setError(err.response?.data?.error || err.message || "Fetch failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCalendarData = async () => {
    if (!lawyerId) return;
    setIsLoading(true);
    try {
      const [eventsRes, holidaysRes, hearingsRes] =
        await Promise.all([
          api.get("/calendar/events"),
          api.get("/calendar/holidays"),
          api.get("/calendar/upcoming-hearings"),
        ]);

      const data: CalendarData = {
        events: Array.isArray(eventsRes.data)
          ? eventsRes.data.map((e: any) => ({
            ...e,
            id: e.id || e._id,
            status: updateEventStatus(e),
          }))
          : [],
        holidays: Array.isArray(holidaysRes.data) ? holidaysRes.data : [],
        availableSlots: [],
        weeklySchedule: null,
        upcomingHearings: Array.isArray(hearingsRes.data) ? hearingsRes.data : [],
      };
      setCalendarData(data);
    } catch (err: any) {
      console.error("Fetch calendar data error:", err);
      setError(err.response?.data?.error || err.message || "Fetch failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const validateDate = (date: string | undefined): boolean =>
    !!date && isValid(parseISO(date));

  const updateEventStatus = (event: any): CalendarEvent["status"] => {
    const now = new Date();
    if (event.status === "pending" && event.date) {
      const eventDateTime = parseISO(`${event.date}T${event.time || "00:00"}`);
      if (isAfter(now, eventDateTime)) {
        return "closed";
      }
    }
    return event.status || "pending";
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const dateValue = (form.elements.namedItem("date") as HTMLInputElement).value;
    const titleVal = (form.elements.namedItem("title") as HTMLInputElement).value.trim();
    const clientVal = (form.elements.namedItem("client") as HTMLInputElement).value.trim();
    const timeVal = (form.elements.namedItem("time") as HTMLInputElement).value;

    if (!dateValue || !titleVal || !clientVal || !timeVal) {
      toast.error("Please fill in all required fields.");
      return;
    }

    // Check for existing hearings/events on the same day
    const conflicts = calendarData.events.filter(ev => ev.date === dateValue);
    if (conflicts.length > 0) {
      toast.warning(`Scheduling Alert: You already have ${conflicts.length} event(s) on this date.`);
    }

    const selectedDateObj = parseISO(dateValue);

    // STRICT HOLIDAY BLOCK
    const isSun = isSunday(selectedDateObj);
    const isHoli = calendarData.holidays.some(h => h.date === dateValue);

    if (isSun || isHoli) {
      toast.error("Strict Block: Cannot add events on Sundays or Official Holidays.");
      return;
    }

    // Convert 12h to 24h for API
    let [hours, minutes] = timeVal.split(':');
    let h = parseInt(hours);
    if (newEvent.period === "PM" && h < 12) h += 12;
    if (newEvent.period === "AM" && h === 12) h = 0;
    const finalTime = `${h.toString().padStart(2, '0')}:${minutes}`;

    const formData = {
      title: titleVal,
      client: clientVal,
      eventType: newEvent.type,
      date: dateValue,
      time: finalTime,
    };

    try {
      setIsLoading(true);
      await api.post("/calendar/events", { ...formData, lawyerId });
      setIsAddEventOpen(false);
      await fetchCalendarData();
      toast.success("Event added successfully.");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to add event.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHoliday.name || !newHoliday.date) {
      toast.error("Please fill in all holiday fields.");
      return;
    }

    try {
      setIsLoading(true);
      await api.post("/calendar/holidays", { ...newHoliday, lawyerId });
      setIsAddHolidayOpen(false);
      setNewHoliday({ name: "", date: format(new Date(), "yyyy-MM-dd") });
      await fetchCalendarData();
      toast.success("Holiday added successfully.");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to add holiday.");
    } finally {
      setIsLoading(false);
    }
  };

  const getEventsForDate = (date: Date) => {
    if (!isValid(date)) return { events: [], holiday: null };
    const dateString = format(date, "yyyy-MM-dd");

    // Combine events and upcoming hearings for that date
    const manualEvents = calendarData.events.filter(
      (e) => e.date && isSameDay(parseISO(e.date), date)
    );

    const caseHearings = calendarData.upcomingHearings.filter(
      (h) => h.date && isSameDay(parseISO(h.date), date)
    ).map(h => ({
      id: h.id,
      title: `Case: ${h.title}`,
      client: h.client,
      time: h.time,
      status: h.status,
      type: 'case'
    }));

    const holiday =
      calendarData.holidays.find((h) => h.date === dateString) ||
      (isSunday(date) ? { date: dateString, name: "Sunday Holiday" } : null);

    return {
      events: [...manualEvents, ...caseHearings],
      holiday
    };
  };

  const handleRefresh = async () => {
    await fetchCalendarData();
    toast.info("Calendar data refreshed.");
  };

  const selectedDateEvents = selectedDate
    ? getEventsForDate(selectedDate)
    : { events: [], holiday: null };

  const handleExportICS = async () => {
    try {
      const res = await api.get("/calendar/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "hearings_calendar.ics");
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("Calendar exported successfully!");
    } catch (err) {
      toast.error("Failed to export calendar.");
    }
  };

  return (
    <div className="p-4 space-y-6 min-h-screen bg-white">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-outfit">Lawyer Calendar</h1>
          <p className="text-gray-600">Manage your practice schedule</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportICS} className="text-sm border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100">
            <Download className="w-4 h-4 mr-1.5" /> Export to .ICS
          </Button>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Dialog open={isAddHolidayOpen} onOpenChange={setIsAddHolidayOpen}>
            <Button variant="outline" onClick={() => setIsAddHolidayOpen(true)} className="border-red-200 text-red-600 hover:bg-red-50">
              <CalendarIcon className="w-4 h-4 mr-2" /> Add Holiday
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Custom Holiday</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddHoliday} className="space-y-4">
                <div>
                  <Label>Holiday Name</Label>
                  <Input
                    value={newHoliday.name}
                    onChange={(e) => setNewHoliday(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Local Festival, Office Closure"
                    required
                  />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newHoliday.date}
                    onChange={(e) => setNewHoliday(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Add Holiday"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
            <Button onClick={() => setIsAddEventOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Event
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Event</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddEvent} className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input name="title" required />
                </div>
                <div>
                  <Label>Client</Label>
                  <Input name="client" required />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select
                    value={newEvent.type}
                    onValueChange={(v) => setNewEvent(prev => ({ ...prev, type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hearing">Court Hearing</SelectItem>
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Input name="date" type="date" required defaultValue={format(selectedDate, "yyyy-MM-dd")} />
                  </div>
                  <div>
                    <Label>Time (HH:MM)</Label>
                    <div className="flex gap-2">
                      <Input name="time" type="time" required step="300" className="flex-1" />
                      <Select
                        value={newEvent.period}
                        onValueChange={(v) => setNewEvent(prev => ({ ...prev, period: v }))}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add Event"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-4 lg:col-span-2">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="rounded-xl border border-gray-100 shadow-sm"
            modifiers={{
              manualEvent: (date) => calendarData.events.some(e => {
                const parsed = e.date ? parseISO(e.date) : null;
                return parsed && isValid(parsed) && isSameDay(parsed, date);
              }),
              caseHearing: (date) => calendarData.upcomingHearings.some(h => {
                const parsed = h.date ? parseISO(h.date) : null;
                return parsed && isValid(parsed) && isSameDay(parsed, date);
              }),
              holiday: (date) => {
                const isHoli = calendarData.holidays.some(h => {
                  const parsed = h.date ? parseISO(h.date) : null;
                  return parsed && isValid(parsed) && isSameDay(parsed, date);
                });
                return isHoli || isSunday(date);
              }
            }}
            modifiersClassNames={{
              manualEvent: "relative after:absolute after:bottom-1 after:left-1/3 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-blue-600 after:rounded-full font-bold text-blue-900 bg-blue-50/50",
              caseHearing: "relative after:absolute after:bottom-1 after:left-2/3 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-green-600 after:rounded-full font-bold text-green-900 bg-green-50/50",
              holiday: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-red-500 after:rounded-full text-red-500 bg-red-50/50"
            }}
          />
        </Card>
        <Card className="p-4 border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Events for {format(selectedDate, "MMM d")}</h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-600"></div>
                <span className="text-[10px] text-gray-500">Case</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                <span className="text-[10px] text-gray-500">Meeting</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-[10px] text-gray-500">Off</span>
              </div>
            </div>
          </div>
          {selectedDateEvents.holiday && (
            <Badge variant="destructive" className="mb-4 w-full justify-center">
              {selectedDateEvents.holiday.name}
            </Badge>
          )}
          <div className="space-y-4">
            {selectedDateEvents.events.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No events scheduled</p>
            ) : (
              selectedDateEvents.events.map((event) => (
                <div key={event.id} className="p-3 border rounded-lg space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">{event.title}</h4>
                    <Badge>{event.status}</Badge>
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> {event.time}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <User className="w-4 h-4" /> {event.client}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
