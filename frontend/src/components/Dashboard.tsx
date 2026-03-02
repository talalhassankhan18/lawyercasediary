import React, { useState, useEffect } from "react";
import api from "../lib/api";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  FolderOpen,
  Calendar,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  AlertCircle,
  Grid3X3,
  List,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Toggle } from "../components/ui/toggle";
import { parseISO, isValid, isBefore, format } from "date-fns";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

interface Case {
  _id: string;
  title: string;
  caseNumber: string;
  client: { name: string; phone: string; email: string };
  opponentName: string;
  court: string;
  status: string;
  nextHearing: string | null;
}

interface Fee {
  totalFee: number;
}

interface Hearing {
  id?: string;
  title: string;
  client: string;
  date: string;
  time: string;
  caseDetails: { caseNumber: string; opponentName: string };
  status: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  priority: "High" | "Medium" | "Low";
}

interface Stat {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  change: string;
}

export const Dashboard = () => {
  const [recentCasesView, setRecentCasesView] = useState<"cards" | "table">(
    "cards"
  );
  const [upcomingTasksView, setUpcomingTasksView] = useState<"cards" | "table">(
    "cards"
  );
  const navigate = useNavigate();
  const [lawyerId, setLawyerId] = useState<string | null>(null);
  const [totalCases, setTotalCases] = useState<number>(0);
  const [upcomingHearings, setUpcomingHearings] = useState<Hearing[]>([]);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [activeClients, setActiveClients] = useState<number>(0);
  const [recentCases, setRecentCases] = useState<Case[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Event[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch lawyer ID
  useEffect(() => {
    const fetchLawyerId = async () => {
      try {
        const response = await api.get("/lawyers/me");
        const id = response.data.user?.id || response.data._id || response.data.id;
        if (!id) {
          throw new Error("Lawyer ID not found in response");
        }
        setLawyerId(id);
      } catch (err: any) {
        console.error("Error fetching lawyer ID:", err);
        setError("Error fetching lawyer data. Please verify your connection.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchLawyerId();
  }, []);

  // Fetch all required data
  useEffect(() => {
    if (!lawyerId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [casesRes, hearingsRes, feesRes, eventsRes, holidaysRes] = await Promise.all([
          api.get(`/cases?lawyerId=${lawyerId}`).catch((err) => {
            console.error("Cases fetch error:", err);
            return { data: { cases: [] } };
          }),
          api.get(`/calendar/upcoming-hearings`).catch((err) => {
            console.error("Hearings fetch error:", err);
            return { data: [] };
          }),
          api.get(`/fees`).catch((err) => {
            console.error("Fees fetch error:", err);
            return { data: [] };
          }),
          api.get(`/calendar/events`).catch((err) => {
            console.error("Events fetch error:", err);
            return { data: [] };
          }),
          api.get(`/calendar/holidays`).catch((err) => {
            console.error("Holidays fetch error:", err);
            return { data: [] };
          }),
        ]);

        const cases: Case[] = casesRes.data?.cases || casesRes.data || [];
        const hearings: Hearing[] = hearingsRes.data || [];
        const fees: Fee[] = feesRes.data || [];
        const events: Event[] = eventsRes.data || [];
        const holidays: any[] = holidaysRes.data || [];

        // Total Cases
        setTotalCases(cases.length || 0);

        // Active Clients
        const clientMap = new Map();
        cases.forEach((caseItem) => {
          if (
            caseItem?.client?.name &&
            (caseItem.status === "In Progress" || caseItem.status === "Pending")
          ) {
            clientMap.set(caseItem.client.name, true);
          }
        });
        setActiveClients(clientMap.size);

        // Total Revenue
        const revenue = fees.reduce(
          (sum, fee) => sum + (Number(fee?.totalFee) || 0),
          0
        );
        setTotalRevenue(revenue);

        // Recent Cases (from upcoming hearings)
        const processedRecentCases = hearings
          .filter((hearing) => {
            try {
              const date = parseISO(hearing?.date || "");
              return isValid(date) && !isBefore(date, new Date());
            } catch {
              return false;
            }
          })
          .slice(0, 3)
          .map((hearing) => ({
            _id: hearing.id || `hearing-${Math.random().toString(36).substr(2, 9)}`,
            title: hearing.title || "Untitled Hearing",
            caseNumber: hearing.caseDetails?.caseNumber || "N/A",
            client: { name: hearing.client || "N/A", phone: "", email: "" },
            opponentName: hearing.caseDetails?.opponentName || "N/A",
            court: "N/A",
            status: hearing.status || "Pending",
            nextHearing: hearing.date || null,
          }));
        setRecentCases(processedRecentCases);

        // Combine Events and Holidays into "Upcoming Tasks"
        const upcomingHolidays = holidays
          .filter(h => {
            const date = parseISO(h.date);
            return isValid(date) && !isBefore(date, new Date());
          })
          .map(h => ({
            id: `holiday-${(h as any)._id || h.id}`,
            title: `Holiday: ${h.name}`,
            date: h.date,
            priority: "High" as const,
            type: 'holiday'
          }));

        const upcomingEvents = events
          .filter(e => {
            const date = parseISO(e.date);
            return isValid(date) && !isBefore(date, new Date());
          })
          .map(e => ({
            id: (e as any).id || (e as any)._id,
            title: e.title,
            date: e.date,
            priority: e.priority || "Medium",
            type: 'event'
          }));

        // Add auto-reminders for hearings in next 48 hours
        const prepReminders = upcomingHearings
          .filter(h => {
            const date = parseISO(h.date);
            const moveIn48h = new Date(Date.now() + 48 * 60 * 60 * 1000);
            return isValid(date) && isBefore(date, moveIn48h);
          })
          .map(h => ({
            id: `prep-${h.id}`,
            title: `Prepare for: ${h.title}`,
            date: h.date,
            priority: "High" as const,
            type: 'prep'
          }));

        const allTasks = [...upcomingHolidays, ...upcomingEvents, ...prepReminders]
          .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
          .slice(0, 10);

        setUpcomingTasks(allTasks);

        // Upcoming Hearings Count
        setUpcomingHearings(
          hearings.filter((hearing) => {
            try {
              const date = parseISO(hearing?.date || "");
              return isValid(date) && !isBefore(date, new Date());
            } catch {
              return false;
            }
          })
        );
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Error fetching dashboard data. Displaying available data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [lawyerId]);

  const isFeeUnlocked = sessionStorage.getItem("feeUnlocked") === "true";

  const stats: Stat[] = [
    {
      title: "Total Cases",
      value: totalCases.toString(),
      icon: FolderOpen,
      color: "bg-blue-500",
      change: `Updated ${format(new Date(), "MMM d")}`,
    },
    {
      title: "Upcoming Hearings",
      value: upcomingHearings.length.toString(),
      icon: Calendar,
      color: "bg-green-500",
      change:
        upcomingHearings.length > 0
          ? `Next: ${format(parseISO(upcomingHearings[0].date), "MMM d")}`
          : "None",
    },
    {
      title: "Total Revenue",
      value: isFeeUnlocked ? `Rs ${totalRevenue.toLocaleString()}` : "••••••",
      icon: TrendingUp,
      color: "bg-yellow-500",
      change: isFeeUnlocked ? `Updated ${format(new Date(), "MMM d")}` : "Locked Section",
    },
    {
      title: "Active Clients",
      value: activeClients.toString(),
      icon: Users,
      color: "bg-purple-500",
      change: `Updated ${format(new Date(), "MMM d")}`,
    },
  ];

  const renderRecentCasesCards = () => (
    <div className="space-y-3 md:space-y-4">
      {recentCases.length === 0 && (
        <p className="text-sm text-gray-500">No recent cases available.</p>
      )}
      {recentCases.map((caseItem) => (
        <div
          key={caseItem._id}
          className="border-l-4 border-blue-500 pl-3 md:pl-4 py-2"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 text-sm md:text-base break-words">
                {caseItem.title}
              </h4>
              <p className="text-xs md:text-sm text-gray-600 truncate">
                Client: {caseItem.client.name}
              </p>
              <p className="text-xs md:text-sm text-gray-600 truncate">
                Court: {caseItem.court}
              </p>
            </div>
            <Badge
              variant={caseItem.status === "Closed" ? "secondary" : "default"}
              className={`text-xs self-start sm:self-auto flex-shrink-0 ${caseItem.status === "In Progress"
                ? "bg-green-100 text-green-800"
                : caseItem.status === "Pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : ""
                }`}
            >
              {caseItem.status}
            </Badge>
          </div>
          {caseItem.nextHearing && (
            <div className="flex items-center gap-1 mt-2 text-xs md:text-sm text-gray-500">
              <Clock className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              <span className="truncate">
                Next hearing:{" "}
                {format(parseISO(caseItem.nextHearing), "yyyy-MM-dd")}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderRecentCasesTable = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Case Title</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Court</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Next Hearing</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recentCases.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-sm text-gray-500"
              >
                No recent cases available.
              </TableCell>
            </TableRow>
          )}
          {recentCases.map((caseItem) => (
            <TableRow key={caseItem._id}>
              <TableCell className="font-medium text-sm break-words">
                {caseItem.title}
              </TableCell>
              <TableCell className="text-sm">{caseItem.client.name}</TableCell>
              <TableCell className="text-sm">{caseItem.court}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    caseItem.status === "Closed" ? "secondary" : "default"
                  }
                  className={`text-xs ${caseItem.status === "In Progress"
                    ? "bg-green-100 text-green-800"
                    : caseItem.status === "Pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : ""
                    }`}
                >
                  {caseItem.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">
                {caseItem.nextHearing ? (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    {format(parseISO(caseItem.nextHearing), "yyyy-MM-dd")}
                  </div>
                ) : (
                  "-"
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const renderUpcomingTasksCards = () => (
    <div className="space-y-3 md:space-y-4">
      {upcomingTasks.length === 0 ? (
        <div className="text-center py-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
          <p className="text-sm text-gray-500 mb-4">No upcoming events or holidays.</p>
          <Button variant="outline" size="sm" onClick={() => navigate("/calendar")}>
            <Calendar className="w-3 h-3 mr-2" /> Add a Meeting
          </Button>
        </div>
      ) : (
        upcomingTasks.map((task: any) => (
          <div
            key={task.id}
            className={`border-l-4 pl-3 md:pl-4 py-2 rounded-r-lg shadow-sm transition-all hover:shadow-md ${task.type === 'holiday' ? 'border-red-500 bg-red-50/30' :
              task.type === 'prep' ? 'border-amber-500 bg-amber-50/30' : 'border-purple-500 bg-purple-50/10'
              }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-gray-900 text-sm md:text-base break-words flex items-center gap-2">
                  {task.title}
                  {task.type === 'holiday' && <Badge variant="destructive" className="text-[10px] h-4 leading-3 px-1.5 uppercase font-bold">Holiday</Badge>}
                  {task.type === 'prep' && <Badge variant="outline" className="text-[10px] h-4 leading-3 px-1.5 border-amber-500 text-amber-600 bg-amber-50 font-bold uppercase">Action</Badge>}
                </h4>
                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 mt-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  {format(parseISO(task.date), "EEEE, MMM d")}
                </div>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] uppercase font-bold ${task.priority === "High"
                  ? "border-red-200 text-red-700 bg-white"
                  : task.priority === "Medium"
                    ? "border-yellow-200 text-yellow-700 bg-white"
                    : "border-green-200 text-green-700 bg-white"
                  }`}
              >
                {task.priority}
              </Badge>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderUpcomingTasksTable = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Priority</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {upcomingTasks.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={3}
                className="text-center text-sm text-gray-500"
              >
                No upcoming tasks available.
              </TableCell>
            </TableRow>
          )}
          {upcomingTasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium text-sm break-words">
                {task.title}
              </TableCell>
              <TableCell className="text-sm">
                {format(parseISO(task.date), "MMM d")}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      task.priority === "High"
                        ? "destructive"
                        : task.priority === "Medium"
                          ? "default"
                          : "secondary"
                    }
                    className="text-xs"
                  >
                    {task.priority}
                  </Badge>
                  {task.priority === "High" && (
                    <AlertCircle className="w-3 h-3 text-red-500" />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 text-center text-gray-500">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto">
      {error && (
        <div className="text-center text-red-500 text-sm mb-4">{error}</div>
      )}
      <div className="text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Dashboard
        </h1>
        <p className="text-gray-600 text-sm md:text-base">
          Welcome back! Here's your practice overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-medium text-gray-600 truncate">
                  {stat.title}
                </p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 truncate">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {stat.change}
                </p>
              </div>
              <div
                className={`p-2 md:p-3 rounded-full ${stat.color} text-white flex-shrink-0 ml-2`}
              >
                <stat.icon className="w-4 h-4 md:w-6 md:h-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Cases */}
        <Card className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Recent Cases</h3>
              <Badge variant="secondary" className="self-start sm:self-auto">
                {recentCases.length} Active
              </Badge>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <Toggle
                pressed={recentCasesView === "cards"}
                onPressedChange={() => setRecentCasesView("cards")}
                size="sm"
              >
                <Grid3X3 className="w-3 h-3" />
              </Toggle>
              <Toggle
                pressed={recentCasesView === "table"}
                onPressedChange={() => setRecentCasesView("table")}
                size="sm"
              >
                <List className="w-3 h-3" />
              </Toggle>
            </div>
          </div>
          {recentCasesView === "cards"
            ? renderRecentCasesCards()
            : renderRecentCasesTable()}
        </Card>

        {/* Upcoming Tasks */}
        <Card className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Upcoming Tasks</h3>
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0" />
            </div>
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <Toggle
                pressed={upcomingTasksView === "cards"}
                onPressedChange={() => setUpcomingTasksView("cards")}
                size="sm"
              >
                <Grid3X3 className="w-3 h-3" />
              </Toggle>
              <Toggle
                pressed={upcomingTasksView === "table"}
                onPressedChange={() => setUpcomingTasksView("table")}
                size="sm"
              >
                <List className="w-3 h-3" />
              </Toggle>
            </div>
          </div>
          {upcomingTasksView === "cards"
            ? renderUpcomingTasksCards()
            : renderUpcomingTasksTable()}
        </Card>
      </div>
    </div>
  );
};
