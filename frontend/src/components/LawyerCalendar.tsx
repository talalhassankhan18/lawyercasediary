import React, { Component, ReactNode, useState, useEffect } from "react";
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
  User,
  Gavel,
  Coffee,
  RefreshCw,
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
import axios from "axios";
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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
  const [selectedSlots, setSelectedSlots] = useState<{
    [key in keyof Omit<WeeklySchedule, "lawyerId" | "id">]: string[];
  }>({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
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
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Authentication token missing. Please log in again.");
        toast.error("Authentication token missing. Please log in again.");
        return;
      }
      const response = await axios.get(`${API_URL}/api/calendar/me`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });
      const lawyer: Lawyer = response.data;
      if (!lawyer.id) throw new Error("Invalid lawyer data.");
      setLawyerId(lawyer.id);
    } catch (err: any) {
      console.error("Fetch lawyer ID error:", err);
      setError(err.response?.data?.error || err.message || "Fetch failed.");
      toast.error(error);
      if (err.response?.status === 401) localStorage.removeItem("authToken");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCalendarData = async () => {
    if (!lawyerId) {
      setError("Lawyer ID missing.");
      toast.error("Lawyer ID missing.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Authentication token missing. Please log in again.");
        toast.error("Authentication token missing. Please log in again.");
        return;
      }
      const [eventsRes, holidaysRes, slotsRes, scheduleRes, hearingsRes] =
        await Promise.all([
          axios.get(`${API_URL}/api/calendar/events`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
          }),
          axios.get(`${API_URL}/api/calendar/holidays`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
          }),
          axios.get(`${API_URL}/api/calendar/slots`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
          }),
          axios.get(`${API_URL}/api/calendar/weekly-schedule`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
          }),
          axios.get(`${API_URL}/api/calendar/upcoming-hearings`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
          }),
        ]);

      const data: CalendarData = {
        events: Array.isArray(eventsRes.data)
          ? eventsRes.data
              .filter((e: CalendarEvent) => e.date)
              .map((e: CalendarEvent) => ({
                ...e,
                id: e.id || `temp-${Math.random().toString(36).substr(2)}`,
                date: e.date || format(new Date(), "yyyy-MM-dd"),
                client: e.client || "N/A",
                title: e.title || "Untitled Event",
                time: e.time || "TBD",
                status: updateEventStatus(e),
                caseDetails: e.caseDetails || {
                  caseNumber: "N/A",
                  opponentName: "N/A",
                },
              }))
          : [],
        holidays: Array.isArray(holidaysRes.data)
          ? holidaysRes.data.filter((h: Holiday) => validateDate(h.date))
          : [],
        availableSlots: Array.isArray(slotsRes.data)
          ? slotsRes.data.filter((s: AvailableSlot) => validateDate(s.date))
          : [],
        weeklySchedule: scheduleRes.data || null,
        upcomingHearings: Array.isArray(hearingsRes.data)
          ? hearingsRes.data
              .filter((e: CalendarEvent) => validateDate(e.date))
              .map((e: CalendarEvent) => ({
                ...e,
                id: e.id || `temp-${Math.random().toString(36).substr(2)}`,
                date: e.date || format(new Date(), "yyyy-MM-dd"),
                client: e.client || "N/A",
                title: e.title || "Untitled Hearing",
                time: e.time || "TBD",
                status: updateEventStatus(e),
                caseDetails: e.caseDetails || {
                  caseNumber: "N/A",
                  opponentName: "N/A",
                },
              }))
          : [],
      };
      setCalendarData(data);
      if (data.weeklySchedule) {
        setSelectedSlots({
          monday: data.weeklySchedule.monday.hours || [],
          tuesday: data.weeklySchedule.tuesday.hours || [],
          wednesday: data.weeklySchedule.wednesday.hours || [],
          thursday: data.weeklySchedule.thursday.hours || [],
          friday: data.weeklySchedule.friday.hours || [],
          saturday: data.weeklySchedule.saturday.hours || [],
        });
      }
    } catch (err: any) {
      console.error("Fetch calendar data error:", err);
      setError(err.response?.data?.error || err.message || "Fetch failed.");
      toast.error(error);
      if (err.response?.status === 401) localStorage.removeItem("authToken");
      setCalendarData({
        events: [],
        holidays: [],
        availableSlots: [],
        weeklySchedule: null,
        upcomingHearings: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateDate = (date: string | undefined): boolean =>
    !!date && isValid(parseISO(date));

  const generateAvailableSlots = (date: Date) => {
    if (!isValid(date)) return [];
    const dateString = format(date, "yyyy-MM-dd");
    const isFriday = date.getDay() === 5;
    const isSundayOrHoliday =
      isSunday(date) ||
      calendarData.holidays.some((h) => h.date === dateString);

    if (isSundayOrHoliday) return [];

    const startHour = 9;
    const endHour = 17;
    const breakStart = isFriday ? "12:30" : "13:00";
    const breakEnd = isFriday ? "14:30" : "14:00";
    const slots: string[] = [];

    let currentTime = new Date(date);
    currentTime.setHours(startHour, 0, 0, 0);
    const endTime = new Date(date);
    endTime.setHours(endHour, 0, 0, 0);
    const breakStartTime = parseISO(`${dateString}T${breakStart}:00`);
    const breakEndTime = parseISO(`${dateString}T${breakEnd}:00`);

    const dayOfWeek = format(date, "EEEE").toLowerCase() as keyof Omit<
      WeeklySchedule,
      "lawyerId" | "id"
    >;
    const daySchedule = calendarData.weeklySchedule?.[dayOfWeek] ?? {
      available: true,
      hours: availableHours,
    };
    const isAvailable = daySchedule.available;
    const availableHoursForDay = daySchedule.hours || [];

    if (!isAvailable) return [];

    while (currentTime < endTime) {
      const slotTime = format(currentTime, "HH:mm");
      if (
        !isWithinInterval(currentTime, {
          start: breakStartTime,
          end: breakEndTime,
        }) &&
        availableHoursForDay.includes(slotTime)
      ) {
        const existingEvent = calendarData.events.find(
          (e) =>
            e.date === dateString &&
            e.time === slotTime &&
            e.eventType === "hearing"
        );
        if (!existingEvent) slots.push(slotTime);
      }
      currentTime = addMinutes(currentTime, 60);
    }
    return slots;
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!lawyerId) {
      setError("Lawyer ID missing.");
      toast.error("Lawyer ID missing.");
      return;
    }
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication token missing. Please log in again.");
      toast.error("Authentication token missing. Please log in again.");
      return;
    }
    const form = e.target as HTMLFormElement;
    const formData = {
      title: (
        form.elements.namedItem("title") as HTMLInputElement
      ).value.trim(),
      client: (
        form.elements.namedItem("client") as HTMLInputElement
      ).value.trim(),
      eventType: (form.elements.namedItem("type") as HTMLSelectElement).value,
      date: (form.elements.namedItem("date") as HTMLInputElement).value,
      time: (form.elements.namedItem("time") as HTMLSelectElement).value,
      location:
        (
          form.elements.namedItem("location") as HTMLInputElement
        ).value.trim() || undefined,
      notes:
        (
          form.elements.namedItem("notes") as HTMLTextAreaElement
        ).value.trim() || undefined,
      status: "pending" as const,
    };
    if (
      !formData.title ||
      !formData.client ||
      !formData.eventType ||
      !formData.date ||
      !formData.time
    ) {
      setError("All required fields must be filled.");
      toast.error("All required fields must be filled.");
      return;
    }
    if (!isValid(parseISO(formData.date))) {
      setError("Invalid date format.");
      toast.error("Invalid date format.");
      return;
    }
    try {
      const response = await axios.post(
        `${API_URL}/api/calendar/events`,
        { ...formData, lawyerId },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        }
      );
      setIsAddEventOpen(false);
      await fetchCalendarData();
      toast.success("Event added successfully.");
    } catch (err: any) {
      console.error("Add event error:", err);
      setError(
        err.response?.data?.error || err.message || "Failed to add event."
      );
      toast.error(error);
      if (err.response?.status === 401) localStorage.removeItem("authToken");
    }
  };

  const handleSetWeeklySchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!lawyerId) {
      setError("Lawyer ID missing.");
      toast.error("Lawyer ID missing.");
      return;
    }
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication token missing. Please log in again.");
      toast.error("Authentication token missing. Please log in again.");
      return;
    }
    const formData = {
      monday: {
        available: selectedSlots.monday.length > 0,
        hours: selectedSlots.monday,
      },
      tuesday: {
        available: selectedSlots.tuesday.length > 0,
        hours: selectedSlots.tuesday,
      },
      wednesday: {
        available: selectedSlots.wednesday.length > 0,
        hours: selectedSlots.wednesday,
      },
      thursday: {
        available: selectedSlots.thursday.length > 0,
        hours: selectedSlots.thursday,
      },
      friday: {
        available: selectedSlots.friday.length > 0,
        hours: selectedSlots.friday,
      },
      saturday: {
        available: selectedSlots.saturday.length > 0,
        hours: selectedSlots.saturday,
      },
    };
    try {
      const response = await axios.post(
        `${API_URL}/api/calendar/weekly-schedule`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        }
      );
      setIsScheduleOpen(false);
      await fetchCalendarData();
      toast.success("Weekly schedule updated successfully.");
    } catch (err: any) {
      console.error("Set weekly schedule error:", err);
      setError(
        err.response?.data?.error || err.message || "Failed to set schedule."
      );
      toast.error(error);
      if (err.response?.status === 401) localStorage.removeItem("authToken");
    }
  };

  const handleSlotToggle = (day: keyof typeof selectedSlots, slot: string) => {
    setSelectedSlots((prev) => ({
      ...prev,
      [day]: prev[day].includes(slot)
        ? prev[day].filter((s) => s !== slot)
        : [...prev[day], slot].sort(),
    }));
  };

  const getEventsForDate = (date: Date) => {
    if (!isValid(date)) return { events: [], holiday: null };
    const dateString = format(date, "yyyy-MM-dd");
    const eventsForDate = calendarData.events.filter(
      (e) => e.date && isSameDay(parseISO(e.date), date)
    );
    const holiday =
      calendarData.holidays.find((h) => h.date === dateString) ||
      (isSunday(date) ? { date: dateString, name: "Sunday Holiday" } : null);
    return { events: eventsForDate, holiday };
  };

  const handleRefresh = async () => {
    try {
      await fetchCalendarData();
      toast.info("Calendar data refreshed.");
    } catch (err) {
      console.error("Refresh error:", err);
      toast.error("Failed to refresh data.");
    }
  };

  const updateEventStatus = (event: CalendarEvent): CalendarEvent["status"] => {
    const now = new Date("2025-07-24T10:23:00+05:00"); // Current date and time in PKT
    if (event.status === "pending" && event.date) {
      const eventDateTime = parseISO(`${event.date}T${event.time || "00:00"}`);
      if (isAfter(now, eventDateTime)) {
        return "closed";
      }
    }
    return event.status || "pending";
  };

  const handleUpdateStatus = async (eventId: string, currentStatus: string) => {
    if (currentStatus !== "pending") return;
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Authentication token missing. Please log in again.");
        toast.error("Authentication token missing. Please log in again.");
        return;
      }
      await axios.patch(
        `${API_URL}/api/calendar/events/${eventId}`,
        { status: "completed" },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        }
      );
      await fetchCalendarData();
      toast.success("Event status updated to completed.");
    } catch (err: any) {
      console.error("Update status error:", err);
      setError(err.response?.data?.error || err.message || "Update failed.");
      toast.error(error);
      if (err.response?.status === 401) localStorage.removeItem("authToken");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedDateEvents = selectedDate
    ? getEventsForDate(selectedDate)
    : { events: [], holiday: null };

  return (
    <div className="p-2 sm:p-4 space-y-4 sm:space-y-6 min-h-screen bg-white">
      {isLoading && <p className="text-black text-center">Loading...</p>}
      {error && (
        <div className="text-red-600 text-sm text-center">
          {error}
          <Button
            variant="link"
            onClick={fetchLawyerId}
            className="ml-2 text-black"
          >
            Retry
          </Button>
        </div>
      )}
      {!isLoading && !error && (
        <>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-black">
                Lawyer Calendar
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Manage your hearings, consultations, and schedule
              </p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isLoading || !lawyerId}
                className="w-full sm:w-auto bg-white text-black border-gray-300 hover:bg-gray-100"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>
              <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
                <DialogTrigger asChild>
                  <Button
                    disabled={isLoading || !lawyerId}
                    className="w-full sm:w-auto bg-black text-white hover:bg-gray-800"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xs sm:max-w-sm md:max-w-md bg-white">
                  <DialogHeader>
                    <DialogTitle className="text-black">
                      Add New Event
                    </DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={handleAddEvent}
                    className="space-y-1 sm:space-y-2 p-1 sm:p-2"
                  >
                    <div>
                      <Label htmlFor="title" className="text-black">
                        Event Title
                      </Label>
                      <Input
                        id="title"
                        name="title"
                        placeholder="Enter event title"
                        required
                        className="w-full border-gray-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="client" className="text-black">
                        Client
                      </Label>
                      <Input
                        id="client"
                        name="client"
                        placeholder="Client name"
                        required
                        className="w-full border-gray-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="type" className="text-black">
                        Event Type
                      </Label>
                      <Select name="type" required>
                        <SelectTrigger className="w-full border-gray-300">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hearing">Court Hearing</SelectItem>
                          <SelectItem value="consultation">
                            Client Consultation
                          </SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="deadline">Deadline</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="date" className="text-black">
                        Date
                      </Label>
                      <Input
                        id="date"
                        name="date"
                        type="date"
                        required
                        defaultValue={
                          selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""
                        }
                        onChange={(e) => {
                          const newDate = parseISO(e.target.value);
                          if (isValid(newDate)) setSelectedDate(newDate);
                        }}
                        className="w-full border-gray-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="time" className="text-black">
                        Time
                      </Label>
                      <Select name="time" required>
                        <SelectTrigger className="w-full border-gray-300">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedDate &&
                            generateAvailableSlots(selectedDate).map((slot) => (
                              <SelectItem key={slot} value={slot}>
                                {slot}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="location" className="text-black">
                        Location
                      </Label>
                      <Input
                        id="location"
                        name="location"
                        placeholder="Court room or office"
                        className="w-full border-gray-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes" className="text-black">
                        Notes
                      </Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        placeholder="Additional notes"
                        className="w-full border-gray-300"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-black text-white hover:bg-gray-800"
                      disabled={isLoading || !lawyerId}
                    >
                      Add Event
                    </Button>
                  </form>
                  {error && (
                    <p className="text-red-600 text-sm mt-1">{error}</p>
                  )}
                </DialogContent>
              </Dialog>
              <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={isLoading || !lawyerId}
                    className="w-full sm:w-auto bg-white text-black border-gray-300 hover:bg-gray-100"
                  >
                    Set Weekly Schedule
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-full max-w-2xl px-2 sm:px-4 space-y-1 mx-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xs sm:text-sm text-black font-semibold leading-tight">
                      Set Weekly Schedule
                    </DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={handleSetWeeklySchedule}
                    className="w-full space-y-1"
                  >
                    {[
                      "monday",
                      "tuesday",
                      "wednesday",
                      "thursday",
                      "friday",
                      "saturday",
                    ].map((day) => (
                      <div
                        key={day}
                        className="border border-gray-300 rounded-md p-1 bg-white shadow-sm overflow-x-auto"
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <Label className="text-[10px] font-medium capitalize text-black leading-none">
                            {day}
                          </Label>
                          <Button
                            type="button"
                            variant={
                              selectedSlots[day as keyof typeof selectedSlots]
                                .length > 0
                                ? "default"
                                : "outline"
                            }
                            onClick={() =>
                              handleSlotToggle(
                                day as keyof typeof selectedSlots,
                                selectedSlots[day as keyof typeof selectedSlots]
                                  .length > 0
                                  ? ""
                                  : availableHours[0]
                              )
                            }
                            className="text-[9px] px-1 py-[2px] h-auto bg-black text-white hover:bg-gray-800 disabled:bg-gray-300"
                            disabled={isLoading}
                          >
                            {selectedSlots[day as keyof typeof selectedSlots]
                              .length > 0
                              ? "Disable"
                              : "Enable"}
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-0.5 mt-0.5">
                          {availableHours.map((slot) => (
                            <Button
                              key={slot}
                              type="button"
                              variant={
                                selectedSlots[
                                  day as keyof typeof selectedSlots
                                ].includes(slot)
                                  ? "default"
                                  : "outline"
                              }
                              className={`text-[9px] px-1 py-[2px] h-auto min-w-[38px] ${
                                selectedSlots[
                                  day as keyof typeof selectedSlots
                                ].includes(slot)
                                  ? "bg-black text-white"
                                  : "bg-white text-black border-gray-300 hover:bg-gray-100"
                              } disabled:bg-gray-200 disabled:text-gray-500`}
                              onClick={() =>
                                handleSlotToggle(
                                  day as keyof typeof selectedSlots,
                                  slot
                                )
                              }
                              disabled={
                                selectedSlots[day as keyof typeof selectedSlots]
                                  .length === 0 || isLoading
                              }
                            >
                              {slot}
                            </Button>
                          ))}
                        </div>
                        <p className="text-[9px] text-gray-600 mt-0.5 leading-tight">
                          Break:{" "}
                          {day === "friday" ? "12:30 - 14:30" : "13:00 - 14:00"}
                        </p>
                      </div>
                    ))}
                    <Button
                      type="submit"
                      className="w-full mt-1 bg-black text-white hover:bg-gray-800 text-xs py-1.5"
                      disabled={isLoading || !lawyerId}
                    >
                      Save Schedule
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4">
            <div className="lg:col-span-2">
              <Card className="p-2 sm:p-4 bg-white border border-gray-300 shadow-sm">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) =>
                    date && isValid(date) && setSelectedDate(date)
                  }
                  className="rounded-md border-0"
                  disabled={isLoading}
                  modifiers={{
                    hearing: calendarData.events
                      .filter(
                        (e) => e.eventType === "hearing" && validateDate(e.date)
                      )
                      .map((e) => parseISO(e.date)),
                    holiday: calendarData.holidays
                      .filter((h) => validateDate(h.date))
                      .map((h) => parseISO(h.date))
                      .concat(
                        Array.from({ length: 7 }, (_, i) =>
                          addDays(
                            startOfWeek(selectedDate || new Date(), {
                              weekStartsOn: 1,
                            }),
                            i
                          )
                        ).filter((d) => isSunday(d))
                      ),
                  }}
                  modifiersStyles={{
                    hearing: {
                      backgroundColor: "#000000",
                      color: "#FFFFFF",
                      borderRadius: "50%",
                    },
                    holiday: {
                      backgroundColor: "#FFFF00",
                      color: "#000000",
                      borderRadius: "50%",
                    },
                  }}
                />
              </Card>
            </div>
            <Card className="p-2 sm:p-4 bg-white border border-gray-300 shadow-sm">
              <h3 className="text-lg font-semibold mb-2 sm:mb-4 text-black">
                {selectedDate
                  ? format(selectedDate, "MMMM dd, yyyy")
                  : "Select a Date"}
              </h3>
              {selectedDateEvents.events.length > 0 ||
              selectedDateEvents.holiday ? (
                <>
                  {selectedDateEvents.events.map((event) => (
                    <div
                      key={event.id}
                      className="mb-1 sm:mb-2 p-1 sm:p-2 bg-gray-100 border border-gray-300 rounded"
                    >
                      <div className="flex items-center gap-1 sm:gap-2 text-black">
                        <Gavel className="w-3 sm:w-4 h-3 sm:h-4" />
                        <span className="font-medium text-sm">Event</span>
                      </div>
                      <p className="text-black text-sm mt-1">
                        {event.title || "Untitled Event"} at{" "}
                        {event.time || "TBD"}
                      </p>
                      {event.eventType === "hearing" && event.caseDetails && (
                        <p className="text-black text-sm mt-1">
                          Case: {event.caseDetails.caseNumber || "N/A"}
                        </p>
                      )}
                    </div>
                  ))}
                  {selectedDateEvents.holiday && (
                    <div className="mb-1 sm:mb-2 p-1 sm:p-2 bg-gray-200 border border-gray-300 rounded">
                      <div className="flex items-center gap-1 sm:gap-2 text-black">
                        <Coffee className="w-3 sm:w-4 h-3 sm:h-4" />
                        <span className="font-medium text-sm">Holiday</span>
                      </div>
                      <p className="text-black text-sm mt-1">
                        {selectedDateEvents.holiday.name || "N/A"}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-600 text-sm">No events or holidays</p>
              )}
            </Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
            <Card className="p-2 sm:p-4 bg-white border border-gray-300 shadow-sm">
              <h3 className="text-lg font-semibold mb-2 sm:mb-4 text-black">
                Upcoming Hearings
              </h3>
              <div className="space-y-1 sm:space-y-2">
                {calendarData.upcomingHearings.length > 0 ? (
                  calendarData.upcomingHearings
                    .filter(
                      (e) => e.date && isAfter(parseISO(e.date), new Date())
                    )
                    .sort((a, b) =>
                      a.date && b.date
                        ? parseISO(a.date).getTime() -
                          parseISO(b.date).getTime()
                        : 0
                    )
                    .slice(0, 3)
                    .map((event) => (
                      <div
                        key={event.id}
                        className="p-1 sm:p-2 bg-gray-100 rounded"
                      >
                        <p className="font-medium text-sm text-black">
                          {event.title || "Untitled Hearing"}
                        </p>
                        <p className="text-xs text-gray-600">
                          Client: {event.client || "N/A"} | Location:{" "}
                          {event.location || "N/A"}
                        </p>
                        <p className="text-xs text-gray-600">
                          Next Hearing:{" "}
                          {event.date && isValid(parseISO(event.date))
                            ? format(parseISO(event.date), "MMMM dd, yyyy")
                            : "TBD"}{" "}
                          at {event.time || "TBD"}
                        </p>
                        <p className="text-xs text-gray-600">
                          Case: {event.caseDetails?.caseNumber || "N/A"}
                        </p>
                        <p className="text-xs text-gray-600">
                          Status: {event.status || "pending"}
                        </p>
                        <p className="text-xs text-gray-600">
                          Opponent: {event.caseDetails?.opponentName || "N/A"}
                        </p>
                        <Badge
                          variant="outline"
                          className="text-xs mt-1 bg-gray-200 text-black"
                        >
                          {event.date && isValid(parseISO(event.date))
                            ? format(parseISO(event.date), "MMM dd")
                            : "TBD"}
                        </Badge>
                      </div>
                    ))
                ) : (
                  <p className="text-gray-600 text-sm">No upcoming hearings</p>
                )}
              </div>
            </Card>
            <Card className="p-2 sm:p-4 bg-white border border-gray-300 shadow-sm">
              <h3 className="text-lg font-semibold mb-2 sm:mb-4 text-black">
                Weekly Schedule
              </h3>
              <div className="space-y-2 sm:space-y-4">
                {calendarData.weeklySchedule ? (
                  [
                    "monday",
                    "tuesday",
                    "wednesday",
                    "thursday",
                    "friday",
                    "saturday",
                  ].map((day) => {
                    const schedule = calendarData.weeklySchedule
                      ? calendarData.weeklySchedule[
                          day as keyof Omit<WeeklySchedule, "lawyerId" | "id">
                        ] ?? { available: false, hours: [] }
                      : { available: false, hours: [] };
                    const dayEvents = calendarData.events.filter(
                      (e) =>
                        e.eventType === "hearing" &&
                        e.date &&
                        format(parseISO(e.date), "EEEE").toLowerCase() === day
                    );
                    return (
                      <div
                        key={day}
                        className="p-1 sm:p-2 bg-gray-100 border border-gray-300 rounded"
                      >
                        <h4 className="text-md font-medium text-black capitalize mb-1 sm:mb-2">
                          {day}
                        </h4>
                        <div className="grid grid-cols-4 gap-1 sm:grid-cols-6 md:grid-cols-8">
                          {availableHours.map((hour) => {
                            const isBreak =
                              (day === "friday" &&
                                hour >= "12:30" &&
                                hour < "14:30") ||
                              (day !== "friday" &&
                                hour >= "13:00" &&
                                hour < "14:00");
                            const event = dayEvents.find(
                              (e) => e.time === hour
                            );
                            return (
                              <span
                                key={hour}
                                className="text-xs p-1 text-center rounded text-black"
                                style={{
                                  backgroundColor: isBreak
                                    ? "#F9FAFB"
                                    : event
                                    ? "#E5E7EB"
                                    : schedule.available &&
                                      schedule.hours.includes(hour)
                                    ? "#D1D5DB"
                                    : "#FFFFFF",
                                }}
                              >
                                {hour}:{" "}
                                {isBreak
                                  ? "Break"
                                  : event
                                  ? `${event.eventType} (${event.client})`
                                  : schedule.available &&
                                    schedule.hours.includes(hour)
                                  ? "Available"
                                  : "Unavailable"}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-600 text-sm">
                    No weekly schedule set
                  </p>
                )}
              </div>
            </Card>
            <ErrorBoundary>
              <Card className="p-2 sm:p-4 bg-white border border-gray-300 shadow-sm">
                <h3 className="text-lg font-semibold mb-2 sm:mb-4 text-black">
                  Events
                </h3>
                <div className="space-y-1 sm:space-y-2">
                  {isLoading ? (
                    <p className="text-gray-600 text-sm">Loading...</p>
                  ) : calendarData.events.length > 0 ? (
                    calendarData.events.map((event) => (
                      <div
                        key={event.id}
                        className="p-1 sm:p-2 bg-gray-100 border border-gray-300 rounded flex items-start justify-between"
                      >
                        <div>
                          <p className="font-medium text-sm text-black">
                            {event.title || "Untitled Event"}
                          </p>
                          <p className="text-xs text-gray-600">
                            Date:{" "}
                            {event.date && isValid(parseISO(event.date))
                              ? format(parseISO(event.date), "MMMM dd, yyyy")
                              : "TBD"}{" "}
                            at {event.time || "TBD"}
                          </p>
                          <p className="text-xs text-gray-600">
                            Client: {event.client || "N/A"}
                          </p>
                          {event.eventType === "hearing" &&
                            event.caseDetails && (
                              <p className="text-xs text-gray-600">
                                Case: {event.caseDetails.caseNumber || "N/A"}
                              </p>
                            )}
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <Badge
                            variant={
                              event.status === "confirmed"
                                ? "default"
                                : event.status === "closed"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-xs bg-gray-200 text-black"
                          >
                            {event.status || "pending"}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 text-sm">No events available</p>
                  )}
                </div>
              </Card>
            </ErrorBoundary>
          </div>
        </>
      )}
    </div>
  );
};
