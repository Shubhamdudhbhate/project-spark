import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  Video,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { NyaySutraSidebar } from "@/components/dashboard/NyaySutraSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  title: string;
  caseNumber: string;
  date: Date;
  time: string;
  type: "hearing" | "deadline" | "meeting" | "judgment";
  priority?: "urgent" | "normal";
  courtRoom?: string;
  parties?: string;
}

const CourtCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [currentMonth]);

  const fetchEvents = async () => {
    try {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const { data: cases, error } = await supabase
        .from("cases")
        .select(`
          id,
          case_number,
          title,
          next_hearing_date,
          priority,
          plaintiff:profiles!cases_plaintiff_id_fkey(full_name),
          defendant:profiles!cases_defendant_id_fkey(full_name)
        `)
        .gte("next_hearing_date", monthStart.toISOString())
        .lte("next_hearing_date", monthEnd.toISOString());

      if (error) throw error;

      const formattedEvents: CalendarEvent[] = (cases || []).map((c) => ({
        id: c.id,
        title: c.title,
        caseNumber: c.case_number,
        date: new Date(c.next_hearing_date!),
        time: format(new Date(c.next_hearing_date!), "hh:mm a"),
        type: "hearing",
        priority: c.priority === "urgent" ? "urgent" : "normal",
        courtRoom: "Court Room 1",
        parties: `${c.plaintiff?.full_name || "Unknown"} vs. ${c.defendant?.full_name || "Unknown"}`,
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load calendar events");
    } finally {
      setIsLoading(false);
    }
  };

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold text-foreground min-w-48 text-center">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => setCurrentMonth(new Date())}>
          Today
        </Button>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Hearing
        </Button>
      </div>
    </div>
  );

  const renderDays = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return (
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        const dayEvents = events.filter((e) => isSameDay(e.date, currentDay));
        const isToday = isSameDay(day, new Date());
        const isSelected = isSameDay(day, selectedDate);

        days.push(
          <motion.div
            key={day.toString()}
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedDate(currentDay)}
            className={cn(
              "min-h-28 p-2 border border-border/30 rounded-lg cursor-pointer transition-all",
              !isSameMonth(day, currentMonth) && "opacity-40",
              isToday && "border-primary/50 bg-primary/5",
              isSelected && "ring-2 ring-primary/50"
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className={cn(
                  "text-sm font-medium",
                  isToday && "text-primary",
                  !isSameMonth(day, currentMonth) && "text-muted-foreground"
                )}
              >
                {format(day, "d")}
              </span>
              {dayEvents.length > 0 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  {dayEvents.length}
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              {dayEvents.slice(0, 2).map((event) => (
                <div
                  key={event.id}
                  className={cn(
                    "text-xs p-1 rounded truncate",
                    event.priority === "urgent"
                      ? "bg-urgent/20 text-urgent"
                      : "bg-primary/20 text-primary"
                  )}
                >
                  {event.time} - {event.caseNumber}
                </div>
              ))}
              {dayEvents.length > 2 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{dayEvents.length - 2} more
                </div>
              )}
            </div>
          </motion.div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-1">
          {days}
        </div>
      );
      days = [];
    }

    return <div className="space-y-1">{rows}</div>;
  };

  const selectedDayEvents = events.filter((e) => isSameDay(e.date, selectedDate));

  const getEventTypeIcon = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "hearing":
        return <Users className="h-4 w-4 text-primary" />;
      case "deadline":
        return <AlertTriangle className="h-4 w-4 text-urgent" />;
      case "meeting":
        return <Video className="h-4 w-4 text-emerald-400" />;
      case "judgment":
        return <FileText className="h-4 w-4 text-amber-400" />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <NyaySutraSidebar />

      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              Court Calendar
            </h1>
            <p className="text-muted-foreground mt-1">Manage hearings, deadlines, and court schedules</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Calendar */}
          <div className="col-span-9">
            <Card className="card-glass border-border/50">
              <CardContent className="p-6">
                {renderHeader()}
                {renderDays()}
                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  renderCells()
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="col-span-3 space-y-6">
            {/* Selected Day Events */}
            <Card className="card-glass border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  {format(selectedDate, "EEEE, MMMM d")}
                  <Badge variant="outline">{selectedDayEvents.length} events</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {selectedDayEvents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No events scheduled</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDayEvents.map((event) => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-muted/50">
                              {getEventTypeIcon(event.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{event.caseNumber}</span>
                                {event.priority === "urgent" && (
                                  <AlertTriangle className="h-3 w-3 text-urgent" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{event.title}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {event.time}
                                </span>
                                {event.courtRoom && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {event.courtRoom}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Upcoming Deadlines */}
            <Card className="card-glass border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Upcoming Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm font-medium text-amber-400">Reply Due</p>
                    <p className="text-xs text-muted-foreground">WP/1024/2025 - Tomorrow</p>
                  </div>
                  <div className="p-2 rounded-lg bg-urgent/10 border border-urgent/20">
                    <p className="text-sm font-medium text-urgent">Judgment Reserved</p>
                    <p className="text-xs text-muted-foreground">BAIL/502/2025 - 3 days</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="card-glass border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Hearings</span>
                    <span className="font-semibold">{events.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Urgent Matters</span>
                    <span className="font-semibold text-urgent">
                      {events.filter((e) => e.priority === "urgent").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Working Days</span>
                    <span className="font-semibold">22</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CourtCalendar;
