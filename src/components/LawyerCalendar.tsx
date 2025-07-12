
import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  MapPin,
  User,
  Gavel,
  Coffee
} from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';

export const LawyerCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);

  const upcomingHearings = [
    {
      id: 1,
      title: 'Property Dispute Hearing',
      client: 'Ahmed Ali',
      court: 'District Court Room 3',
      date: '2024-07-08',
      time: '10:00 AM',
      type: 'hearing',
      status: 'confirmed'
    },
    {
      id: 2,
      title: 'Criminal Defense Case',
      client: 'Imran Shah',
      court: 'Sessions Court Room 1',
      date: '2024-07-10',
      time: '2:00 PM',
      type: 'hearing',
      status: 'pending'
    },
    {
      id: 3,
      title: 'Client Consultation',
      client: 'Fatima Khan',
      court: 'Office',
      date: '2024-07-09',
      time: '11:00 AM',
      type: 'consultation',
      status: 'confirmed'
    }
  ];

  const holidays = [
    { date: '2024-07-14', name: 'Youm-e-Takbeer' },
    { date: '2024-08-14', name: 'Independence Day' },
    { date: '2024-07-17', name: 'Ashura' }
  ];

  const availableSlots = [
    { date: '2024-07-08', slots: ['9:00 AM', '11:00 AM', '3:00 PM'] },
    { date: '2024-07-09', slots: ['10:00 AM', '2:00 PM', '4:00 PM'] },
    { date: '2024-07-10', slots: ['9:00 AM', '1:00 PM'] }
  ];

  const getEventsForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const hearings = upcomingHearings.filter(h => h.date === dateString);
    const holiday = holidays.find(h => h.date === dateString);
    return { hearings, holiday };
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : { hearings: [], holiday: null };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600">Manage your hearings, consultations, and schedule</p>
        </div>
        <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title</Label>
                <Input id="title" placeholder="Enter event title" />
              </div>
              <div>
                <Label htmlFor="client">Client</Label>
                <Input id="client" placeholder="Client name" />
              </div>
              <div>
                <Label htmlFor="type">Event Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hearing">Court Hearing</SelectItem>
                    <SelectItem value="consultation">Client Consultation</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" />
              </div>
              <div>
                <Label htmlFor="time">Time</Label>
                <Input id="time" type="time" />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="Court room or office" />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" placeholder="Additional notes" />
              </div>
              <Button className="w-full">Add Event</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border-0"
              modifiers={{
                hearing: upcomingHearings.map(h => parseISO(h.date)),
                holiday: holidays.map(h => parseISO(h.date))
              }}
              modifiersStyles={{
                hearing: { backgroundColor: '#3B82F6', color: 'white', borderRadius: '50%' },
                holiday: { backgroundColor: '#EF4444', color: 'white', borderRadius: '50%' }
              }}
            />
          </Card>
        </div>

        {/* Selected Date Events */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {selectedDate ? format(selectedDate, 'MMMM dd, yyyy') : 'Select a Date'}
          </h3>
          
          {selectedDateEvents.holiday && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <Coffee className="w-4 h-4" />
                <span className="font-medium">Holiday</span>
              </div>
              <p className="text-red-600 text-sm mt-1">{selectedDateEvents.holiday.name}</p>
            </div>
          )}

          <div className="space-y-3">
            {selectedDateEvents.hearings.map((hearing) => (
              <div key={hearing.id} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {hearing.type === 'hearing' ? (
                        <Gavel className="w-4 h-4 text-blue-600" />
                      ) : (
                        <User className="w-4 h-4 text-green-600" />
                      )}
                      <span className="font-medium text-sm">{hearing.title}</span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {hearing.time}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {hearing.client}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {hearing.court}
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant={hearing.status === 'confirmed' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {hearing.status}
                  </Badge>
                </div>
              </div>
            ))}
            
            {selectedDateEvents.hearings.length === 0 && !selectedDateEvents.holiday && (
              <p className="text-gray-500 text-sm">No events scheduled for this date</p>
            )}
          </div>
        </Card>
      </div>

      {/* Upcoming Events Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Upcoming Hearings</h3>
          <div className="space-y-3">
            {upcomingHearings.slice(0, 3).map((hearing) => (
              <div key={hearing.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{hearing.title}</p>
                  <p className="text-xs text-gray-600">{hearing.client} • {hearing.date} at {hearing.time}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {format(parseISO(hearing.date), 'MMM dd')}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Available Time Slots</h3>
          <div className="space-y-3">
            {availableSlots.slice(0, 3).map((day, index) => (
              <div key={index} className="p-3 bg-green-50 rounded-lg">
                <p className="font-medium text-sm text-green-800">{format(parseISO(day.date), 'MMMM dd')}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {day.slots.map((slot, slotIndex) => (
                    <Badge key={slotIndex} variant="secondary" className="text-xs bg-green-100 text-green-700">
                      {slot}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
