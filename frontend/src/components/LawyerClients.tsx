import React, { useState, useEffect } from "react";
import api from "../lib/api";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  Search,
  Phone,
  Mail,
  User,
  Eye,
  MessageSquare,
  Briefcase,
  History,
  Plus,
  Trash2,
} from "lucide-react";
import { Case } from "../../../types/case";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";

interface CommunicationLog {
  _id: string;
  date: string;
  type: string;
  summary: string;
  outcome?: string;
  createdAt: string;
}

interface Client {
  name: string;
  email: string | "N/A";
  phone: string | "N/A";
  address: string | "N/A";
  caseType: string;
  status: "Active" | "Completed";
  joinDate: string | undefined;
  totalCases: number;
  totalFees: number;
  lastContact: string | undefined;
  nextHearing: string | undefined;
  cases: Case[];
}

export const LawyerClients = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [lawyerId, setLawyerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile Tabs
  const [activeTab, setActiveTab] = useState<"overview" | "logs">("overview");

  // Comm Logs State
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [isAddingLog, setIsAddingLog] = useState(false);

  // New Log Form
  const [logDate, setLogDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [logType, setLogType] = useState("Call");
  const [logSummary, setLogSummary] = useState("");
  const [logOutcome, setLogOutcome] = useState("");
  const [submittingLog, setSubmittingLog] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchLawyerAndClients = async () => {
      try {
        const lr = await api.get("/lawyers/me");
        const lId = lr.data.user?.id || lr.data._id || lr.data.id;
        setLawyerId(lId);

        const cr = await api.get(`/cases?lawyerId=${lId}&all=true`);
        const allCases: Case[] = cr.data.cases || [];

        const clientMap = new Map<string, Client>();
        allCases.forEach((c) => {
          const clientName = c.client.name?.trim() || "Unknown Client";
          const existingClient = clientMap.get(clientName) || {
            name: clientName,
            email: c.client.email || "N/A",
            phone: c.client.phone || "N/A",
            address: c.court || "N/A",
            caseType: c.title,
            status: "Completed",
            joinDate: undefined,
            totalCases: 0,
            totalFees: 0,
            lastContact: undefined,
            nextHearing: undefined,
            cases: [],
          };

          if (["In Progress", "Pending"].includes(c.status)) {
            existingClient.status = "Active";
          }

          if (c.createdAt) {
            const createdAtDate = new Date(c.createdAt);
            if (!isNaN(createdAtDate.getTime())) {
              if (!existingClient.joinDate || createdAtDate < new Date(existingClient.joinDate)) {
                existingClient.joinDate = createdAtDate.toISOString().split("T")[0];
              }
            }
          }

          existingClient.totalCases++;
          existingClient.totalFees += Number(c.fees || 0);

          if (c.nextHearing) {
            if (!existingClient.nextHearing || new Date(c.nextHearing) < new Date(existingClient.nextHearing)) {
              existingClient.nextHearing = c.nextHearing;
            }
          }

          existingClient.cases.push(c);
          clientMap.set(clientName, existingClient);
        });

        setClients(Array.from(clientMap.values()));
      } catch (error: any) {
        if (error.response?.status === 401) {
          toast.error("Session expired.");
          navigate("/login");
        } else {
          toast.error("Failed to load client data.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchLawyerAndClients();
  }, [navigate]);

  const loadClientLogs = async (clientName: string) => {
    setLoadingLogs(true);
    try {
      // safely encode clientName incase of spaces
      const res = await api.get(`/clients/${encodeURIComponent(clientName)}/logs`);
      setLogs(res.data);
    } catch (err) {
      toast.error("Failed to load communication logs.");
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleOpenProfile = (client: Client) => {
    setSelectedClient(client);
    setActiveTab("overview");
    setIsAddingLog(false);
    loadClientLogs(client.name);
  };

  const handleSaveLog = async () => {
    if (!logSummary || !selectedClient) return;
    setSubmittingLog(true);
    try {
      await api.post(`/clients/${encodeURIComponent(selectedClient.name)}/logs`, {
        date: logDate,
        type: logType,
        summary: logSummary,
        outcome: logOutcome
      });
      toast.success("Log added successfully.");
      setIsAddingLog(false);
      setLogSummary("");
      setLogOutcome("");
      // Refresh
      loadClientLogs(selectedClient.name);
    } catch (err) {
      toast.error("Failed to add log.");
    } finally {
      setSubmittingLog(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!selectedClient) return;
    if (!window.confirm("Delete this log?")) return;
    try {
      await api.delete(`/clients/${encodeURIComponent(selectedClient.name)}/logs/${logId}`);
      toast.success("Log deleted.");
      loadClientLogs(selectedClient.name);
    } catch (err) {
      toast.error("Failed to delete log.");
    }
  };

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'Meeting': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Call': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Email': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.caseType || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 border-l-4 border-blue-600 pl-3">Clients Database</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage comprehensive client relationships, total files, & communication tracking.</p>
        </div>
        <div className="px-4 py-2 bg-blue-50 text-blue-800 rounded-lg text-sm font-semibold border-blue-100 border">
          Total Active Clients: {clients.length}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500 animate-pulse">Loading profiles...</div>
      ) : clients.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
          <p className="text-gray-500 font-medium">No clients found</p>
          <p className="text-gray-400 text-sm mt-1">Clients are automatically aggregated from your Case records.</p>
        </div>
      ) : (
        <>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search clients by name or case title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <Card key={client.name} className="p-5 border-t-4 border-t-white hover:border-t-blue-500 hover:shadow-lg transition-all duration-300 relative group cursor-pointer" onClick={() => handleOpenProfile(client)}>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-full"><Eye className="w-4 h-4" /></div>
                </div>

                <div className="flex items-center gap-4 mb-5">
                  <Avatar className="w-14 h-14 border shadow-sm">
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-lg font-bold">
                      {client.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 truncate pr-6">{client.name}</h3>
                    <Badge variant="outline" className={`mt-1 ${client.status === "Active" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                      {client.status} Client
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" /> {client.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 truncate">
                    <Mail className="w-4 h-4 text-gray-400" /> {client.email}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-between items-center bg-gray-50 -mx-5 -mb-5 p-4 rounded-b-xl">
                  <div className="text-center">
                    <p className="text-xs text-gray-400 font-medium mb-1">Total Cases</p>
                    <p className="font-bold text-gray-900">{client.totalCases}</p>
                  </div>
                  <div className="w-px h-8 bg-gray-200"></div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400 font-medium mb-1">Financial Value</p>
                    <p className="font-bold text-green-700">${client.totalFees.toLocaleString()}</p>
                  </div>
                  <div className="w-px h-8 bg-gray-200"></div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400 font-medium mb-1">Next Hearing</p>
                    <p className={`font-bold ${client.nextHearing ? 'text-blue-600' : 'text-gray-400'}`}>
                      {client.nextHearing ? format(new Date(client.nextHearing), "MMM dd") : "None"}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Full Profile Modal */}
          <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0">
              {selectedClient && (
                <>
                  <DialogHeader className="p-6 pb-0">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16 border shadow-sm">
                          <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-xl font-bold">
                            {selectedClient.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <DialogTitle className="text-2xl font-bold text-gray-900">{selectedClient.name}</DialogTitle>
                          <p className="text-sm text-gray-500 font-medium mt-1">Client since {selectedClient.joinDate ? format(new Date(selectedClient.joinDate), "MMMM yyyy") : "Unknown"}</p>
                        </div>
                      </div>
                      <Badge className={selectedClient.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {selectedClient.status}
                      </Badge>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-6 border-b">
                      <button
                        onClick={() => setActiveTab("overview")}
                        className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'overview' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                      >
                        <User className="w-4 h-4" /> Profile & Cases
                      </button>
                      <button
                        onClick={() => setActiveTab("logs")}
                        className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'logs' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                      >
                        <MessageSquare className="w-4 h-4" /> Communication History
                        <Badge variant="secondary" className="ml-1 px-1.5 py-0 min-w-[20px] rounded-full text-xs">{logs.length}</Badge>
                      </button>
                    </div>
                  </DialogHeader>

                  <div className="overflow-y-auto p-6 bg-gray-50 flex-1">

                    {/* OVERVIEW TAB */}
                    {activeTab === "overview" && (
                      <div className="space-y-6">
                        {/* Summary Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-white border rounded-xl p-4 shadow-sm text-center">
                            <Phone className="w-5 h-5 mx-auto text-blue-500 mb-2" />
                            <p className="text-xs text-gray-500 uppercase font-medium">Phone</p>
                            <p className="font-semibold text-gray-900 truncate mt-1">{selectedClient.phone}</p>
                          </div>
                          <div className="bg-white border rounded-xl p-4 shadow-sm text-center">
                            <Mail className="w-5 h-5 mx-auto text-blue-500 mb-2" />
                            <p className="text-xs text-gray-500 uppercase font-medium">Email</p>
                            <p className="font-semibold text-gray-900 truncate mt-1">{selectedClient.email}</p>
                          </div>
                          <div className="bg-white border rounded-xl p-4 shadow-sm text-center">
                            <Briefcase className="w-5 h-5 mx-auto text-indigo-500 mb-2" />
                            <p className="text-xs text-gray-500 uppercase font-medium">Total Files</p>
                            <p className="font-semibold text-gray-900 truncate mt-1">{selectedClient.totalCases}</p>
                          </div>
                          <div className="bg-white border rounded-xl p-4 shadow-sm text-center">
                            <History className="w-5 h-5 mx-auto text-green-500 mb-2" />
                            <p className="text-xs text-gray-500 uppercase font-medium">Est. Financial Value</p>
                            <p className="font-semibold text-green-700 truncate mt-1">${selectedClient.totalFees.toLocaleString()}</p>
                          </div>
                        </div>

                        {/* Files Timeline */}
                        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                          <div className="p-4 border-b bg-gray-50 font-bold text-gray-800 flex justify-between items-center">
                            Client legal files
                          </div>
                          <div className="divide-y divide-gray-100">
                            {selectedClient.cases.map(c => (
                              <div key={c._id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-gray-900">{c.title}</h4>
                                    <Badge variant="outline" className="text-xs font-semibold px-2 py-0 bg-white">#{c.caseNumber}</Badge>
                                  </div>
                                  <p className="text-sm text-gray-500">Opponent: {c.opponentName || 'N/A'} • Court: {c.court}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  {c.nextHearing && <p className="text-xs text-gray-500 font-medium mb-1 border border-blue-100 bg-blue-50 text-blue-700 px-2 py-0.5 rounded inline-block">Next: {format(new Date(c.nextHearing), "MMM dd, yyyy")}</p>}
                                  <p className="text-sm font-semibold capitalize text-gray-700">Status: {c.status}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* LOGS TAB */}
                    {activeTab === "logs" && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-blue-500" /> Activity & Contact Log
                          </h3>
                          <Button size="sm" onClick={() => setIsAddingLog(!isAddingLog)} disabled={isAddingLog} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4 mr-1" /> Log Communication
                          </Button>
                        </div>

                        {/* Add Log Form */}
                        {isAddingLog && (
                          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 shadow-inner mb-4 animate-in fade-in slide-in-from-top-2">
                            <h4 className="font-semibold text-blue-900 mb-3 text-sm">Create New Log Entry</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                              <div>
                                <Label className="text-xs text-gray-600">Date</Label>
                                <Input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} className="bg-white mt-1" />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600">Type of Contact</Label>
                                <Select value={logType} onValueChange={setLogType}>
                                  <SelectTrigger className="bg-white mt-1"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Call">Phone Call</SelectItem>
                                    <SelectItem value="Meeting">In-Person Meeting</SelectItem>
                                    <SelectItem value="Email">Email / Letter</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="mb-3">
                              <Label className="text-xs text-gray-600">Summary / Notes *</Label>
                              <Input placeholder="What was discussed?" value={logSummary} onChange={e => setLogSummary(e.target.value)} className="bg-white mt-1" />
                            </div>
                            <div className="mb-4">
                              <Label className="text-xs text-gray-600">Outcome / Next Steps (Optional)</Label>
                              <Input placeholder="Action required..." value={logOutcome} onChange={e => setLogOutcome(e.target.value)} className="bg-white mt-1" />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => setIsAddingLog(false)}>Cancel</Button>
                              <Button size="sm" onClick={handleSaveLog} disabled={submittingLog || !logSummary}>
                                {submittingLog ? "Saving..." : "Save Log"}
                              </Button>
                            </div>
                          </div>
                        )}

                        {loadingLogs ? (
                          <div className="py-10 text-center text-sm text-gray-500 animate-pulse">Loading history...</div>
                        ) : logs.length === 0 ? (
                          <div className="text-center py-10 bg-white border border-dashed border-gray-200 rounded-xl">
                            <p className="text-gray-500 font-medium text-sm">No communication logged yet.</p>
                          </div>
                        ) : (
                          <div className="bg-white border rounded-xl overflow-hidden shadow-sm relative">
                            {/* Vertical line for timeline effect */}
                            <div className="absolute left-[24px] top-6 bottom-6 w-px bg-gray-200 hidden sm:block"></div>

                            <div className="divide-y divide-gray-100 relative">
                              {logs.map(log => (
                                <div key={log._id} className="p-4 sm:pl-16 relative hover:bg-gray-50 transition group">
                                  {/* Timeline dot */}
                                  <div className={`hidden sm:flex absolute left-[19px] top-6 w-[11px] h-[11px] rounded-full ring-4 ring-white ${getLogTypeColor(log.type).split(' ')[0]}`}></div>

                                  <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline" className={`border ${getLogTypeColor(log.type)}`}>{log.type}</Badge>
                                      <span className="text-xs font-semibold text-gray-500">{format(new Date(log.date), "MMM dd, yyyy")}</span>
                                    </div>
                                    <button onClick={() => handleDeleteLog(log._id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 className="w-4 h-4" /></button>
                                  </div>
                                  <p className="text-gray-900 font-medium text-sm mt-1">{log.summary}</p>
                                  {log.outcome && (
                                    <div className="mt-2 bg-gray-50 border border-gray-100 p-2 rounded text-xs text-gray-600 flex gap-1.5">
                                      <span className="font-bold shrink-0">Outcome:</span> {log.outcome}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};
