import React, { useState, useEffect, useRef } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Search,
  Filter,
  Calendar,
  FileText,
  FolderOpen,
  Printer,
  Clock,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  SortAsc,
  BookOpen,
  Eye,
  DollarSign,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import api from "../lib/api";
import { Case } from "../../../types/case";
import { Holiday, CalendarEvent } from "../../../types/calendar";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { isSunday, parseISO, isSameDay, isValid, format, addDays } from "date-fns";



export const CaseManagement = () => {
  const isFeeUnlocked = sessionStorage.getItem("feeUnlocked") === "true";
  const [cases, setCases] = useState<Case[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 15;
  const [loading, setLoading] = useState(false);
  const [lawyerId, setLawyerId] = useState<string | undefined>(undefined);
  const [isAddCaseOpen, setIsAddCaseOpen] = useState(false);
  const [caseToEdit, setCaseToEdit] = useState<Case | null>(null);
  const [justAddedCaseId, setJustAddedCaseId] = useState<string | null>(null);
  const navigate = useNavigate();
  const tableRef = useRef<HTMLTableElement>(null);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCaseType, setFilterCaseType] = useState("all");
  const [filterCourt, setFilterCourt] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Adjourn
  const [adjournCaseId, setAdjournCaseId] = useState<string | null>(null);
  const [adjournDate, setAdjournDate] = useState("");
  const [adjournReason, setAdjournReason] = useState("");
  const [adjournLoading, setAdjournLoading] = useState(false);

  // Proceedings
  const [viewProceedingsCase, setViewProceedingsCase] = useState<Case | null>(null);
  const [viewDetailsCase, setViewDetailsCase] = useState<Case | null>(null);
  const [addProceedingCaseId, setAddProceedingCaseId] = useState<string | null>(null);
  const [proceedingText, setProceedingText] = useState("");
  const [proceedingDate, setProceedingDate] = useState(new Date().toISOString().split("T")[0]);
  const [proceedingLoading, setProceedingLoading] = useState(false);

  const fetchLawyerData = async () => {
    try {
      const res = await api.get("/lawyers/me");
      setLawyerId(res.data.user.id);
      console.log("Lawyer ID fetched:", res.data.user.id); // Debug
    } catch (err: any) {
      console.error("Error fetching lawyer data:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        toast.error("Session expired. Please sign in again.");
        localStorage.removeItem("authToken");
        navigate("/login");
      } else if (err.response?.status === 404) {
        toast.error("User not found. Please contact support.");
      } else {
        toast.error(err.response?.data?.error || "Failed to fetch lawyer data");
      }
    }
  };

  const fetchCases = async (resetPage = false) => {
    if (!lawyerId) return;
    const currentPage = resetPage ? 1 : page;
    if (resetPage) setPage(1);
    setLoading(true);
    try {
      const params: any = { page: currentPage, limit, all: true, sortBy, sortOrder };
      if (search) params.search = search;
      if (filterStatus !== "all") params.status = filterStatus;
      if (filterCaseType !== "all") params.caseType = filterCaseType;
      if (filterCourt) params.court = filterCourt;
      if (filterDateFrom) params.dateFrom = filterDateFrom;
      if (filterDateTo) params.dateTo = filterDateTo;
      if (filterMonth) { params.month = filterMonth; delete params.all; }

      const res = await api.get("/cases", { params });
      setCases(res.data.cases || []);
      setTotal(res.data.total || 0);

      if (justAddedCaseId) {
        setTimeout(() => {
          const newRow = document.querySelector(`[data-case-id="${justAddedCaseId}"]`);
          if (newRow) newRow.scrollIntoView({ behavior: "smooth", block: "center" });
          setJustAddedCaseId(null);
        }, 500);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to fetch cases");
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjourn = async () => {
    if (!adjournCaseId || !adjournDate) { toast.error("Select a new date"); return; }
    setAdjournLoading(true);
    try {
      await api.put(`/cases/${adjournCaseId}/adjourn`, { newDate: adjournDate, reason: adjournReason });
      toast.success("Hearing adjourned successfully");
      setAdjournCaseId(null); setAdjournDate(""); setAdjournReason("");
      fetchCases();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to adjourn");
    } finally { setAdjournLoading(false); }
  };

  const handleAddProceeding = async () => {
    if (!addProceedingCaseId || !proceedingText.trim()) { toast.error("Enter proceedings notes"); return; }
    setProceedingLoading(true);
    try {
      await api.post(`/cases/${addProceedingCaseId}/proceedings`, { date: proceedingDate, notes: proceedingText.trim() });
      toast.success("Proceedings saved");
      setProceedingText(""); setAddProceedingCaseId(null);
      fetchCases();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save proceedings");
    } finally { setProceedingLoading(false); }
  };

  const clearFilters = () => {
    setSearch(""); setFilterStatus("all"); setFilterCaseType("all");
    setFilterCourt(""); setFilterDateFrom(""); setFilterDateTo("");
    setFilterMonth(""); setSortBy("createdAt"); setSortOrder("desc"); setPage(1);
  };

  useEffect(() => { fetchLawyerData(); }, []);
  useEffect(() => { if (lawyerId) fetchCases(); }, [lawyerId, page]);
  useEffect(() => { if (lawyerId) fetchCases(true); }, [filterStatus, filterCaseType, filterCourt, filterDateFrom, filterDateTo, filterMonth, sortBy, sortOrder]);

  const getStatusColor = (status: string) => {
    if (status === "In Progress") return "bg-green-100 text-green-800";
    if (status === "Pending") return "bg-yellow-100 text-yellow-800";
    if (status === "Closed") return "bg-gray-100 text-gray-800";
    if (status === "Transferred") return "bg-indigo-100 text-indigo-800";
    return "bg-blue-100 text-blue-800";
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this case?")) return;
    try {
      await api.delete(`/cases/${id}`);
      fetchCases(true); // Refresh with page reset
      toast.success("Case deleted successfully");
    } catch (err: any) {
      console.error("Error deleting case:", err.response?.data || err.message);
      toast.error(err.response?.data?.error || "Error deleting case");
    }
  };

  const handleEdit = (case_: Case) => {
    setCaseToEdit(case_);
    setIsAddCaseOpen(true);
  };

  const handleSave = (savedCase?: Case, isNew = false) => {
    setIsAddCaseOpen(false);
    setCaseToEdit(null);
    if (savedCase?._id) {
      setJustAddedCaseId(savedCase._id); // For auto-scroll
      // New: Clear filters to ensure the new case is visible
      setSearch("");
      setFilterStatus("all");
      setFilterCaseType("all");
      setFilterCourt("");
      setFilterDateFrom("");
      setFilterDateTo("");
      setFilterMonth("");
      setSortBy("createdAt");
      setSortOrder("desc");
    }
    fetchCases(true); // Refreshes list after clearing filters
    const msg = isNew
      ? `Case added successfully: ${savedCase?.title}`
      : `Case updated successfully: ${savedCase?.title}`;
    toast.success(msg);
    // Optional: Clear filters/search for fresh view
    // setFilterDate(""); setFilterMonth(""); setSearchTerm("");
  };

  const handlePrintTodaysCases = async () => {
    try {
      const res = await api.get(`/cases/today/print`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `todays_cases_${format(new Date(), "yyyy-MM-dd")}.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Downloaded today's cases!");
    } catch (err: any) {
      toast.error("Failed to generate printable document");
    }
  };

  const renderTable = () => (
    <div className="overflow-x-auto">
      <Table ref={tableRef}>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-10">#</TableHead>
            <TableHead>Case Title</TableHead>
            <TableHead>Court / Type</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Opponent</TableHead>
            <TableHead>Next Hearing</TableHead>
            <TableHead>Fees</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases.map((case_, index) => (
            <TableRow key={case_._id} data-case-id={case_._id} className="hover:bg-gray-50">
              <TableCell className="text-gray-400 text-xs">{(page - 1) * limit + index + 1}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-sm">{case_.title}</p>
                  <p className="text-xs text-gray-400">#{case_.caseNumber}</p>
                </div>
              </TableCell>
              <TableCell>
                <p className="text-sm">{case_.court || "—"}</p>
                {case_.caseType && <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{case_.caseType}</span>}
              </TableCell>
              <TableCell><p className="text-sm">{case_.client.name}</p>
                {case_.client.phone && <p className="text-xs text-gray-400">{case_.client.phone}</p>}
              </TableCell>
              <TableCell><p className="text-sm">{case_.opponentName || "—"}</p></TableCell>
              <TableCell>
                <p className="text-sm font-medium text-blue-700">{case_.nextHearing || "—"}</p>
                {case_.previousHearings && case_.previousHearings.length > 0 && (
                  <p className="text-[10px] text-gray-400 italic">History: {case_.previousHearings.length} dates</p>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 font-semibold text-sm text-gray-700">
                  {isFeeUnlocked
                    ? (case_.fees !== undefined ? `Rs ${case_.fees.toLocaleString()}` : "Rs 0")
                    : "••••••"
                  }
                </div>
              </TableCell>
              <TableCell>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(case_.status)}`}>{case_.status}</span>
              </TableCell>
              <TableCell>
                <div className="flex gap-1 justify-end flex-wrap">
                  <Button size="sm" variant="outline" className="text-xs h-7 text-blue-700 border-blue-200 hover:bg-blue-50" onClick={() => setViewDetailsCase(case_)}>
                    <Eye className="w-3 h-3 mr-1" />View
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleEdit(case_)}>Edit</Button>
                  <Button size="sm" variant="outline" className="text-xs h-7 text-yellow-700 border-yellow-200 hover:bg-yellow-50"
                    onClick={() => { setAdjournCaseId(case_._id!); setAdjournDate(""); setAdjournReason(""); }}>
                    <Clock className="w-3 h-3 mr-1" />Adjourn
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-7 text-green-700 border-green-200 hover:bg-green-50"
                    onClick={() => { setAddProceedingCaseId(case_._id!); setProceedingText(""); }}>
                    <FileText className="w-3 h-3 mr-1" />Proceedings
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-7 text-purple-700 border-purple-200 hover:bg-purple-50"
                    onClick={() => setViewProceedingsCase(case_)}>
                    <BookOpen className="w-3 h-3 mr-1" />History
                  </Button>
                  <Button size="sm" variant="destructive" className="text-xs h-7" onClick={() => handleDelete(case_._id!)}>Delete</Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {Math.ceil(total / limit) > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1}>Previous</Button>
          <span className="text-sm text-gray-600">Page {page} of {Math.ceil(total / limit)} ({total} cases)</span>
          <Button size="sm" variant="outline" onClick={() => setPage((p) => p + 1)} disabled={page * limit >= total}>Next</Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Case Management</h1>
          <p className="text-gray-500 text-sm">Total: {total} cases</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddCaseOpen} onOpenChange={(open) => { setIsAddCaseOpen(open); if (!open) setCaseToEdit(null); }}>
            <DialogTrigger asChild>
              <Button className="text-sm">+ Add Case</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{caseToEdit ? "Edit Case" : "Add New Case"}</DialogTitle>
                <DialogDescription>{caseToEdit ? "Update case details." : "Fill in the details for the new case."}</DialogDescription>
              </DialogHeader>
              <CaseForm caseToEdit={caseToEdit} onSave={handleSave} onCancel={() => setIsAddCaseOpen(false)} lawyerId={lawyerId} isFeeUnlocked={isFeeUnlocked} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search + Filter Toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <Input placeholder="Search by title, case #, client, opponent..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchCases(true)}
            className="pl-9" />
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1.5">
          <Filter className="w-4 h-4" /> Filters {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </Button>
        <Button variant="outline" onClick={() => fetchCases(true)}><Search className="w-4 h-4" /></Button>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 border rounded-xl p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
                <SelectItem value="Transferred">Transferred</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Case Type</label>
            <Select value={filterCaseType} onValueChange={setFilterCaseType}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {["Civil", "Criminal", "Family", "Labour", "Commercial", "Constitutional", "Tax", "Other"].map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Court Name</label>
            <Input placeholder="e.g. High Court" value={filterCourt} onChange={(e) => setFilterCourt(e.target.value)} className="h-8 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Month</label>
            <Input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="h-8 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Hearing From</label>
            <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="h-8 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Hearing To</label>
            <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="h-8 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Sort By</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date Added</SelectItem>
                <SelectItem value="nextHearing">Next Hearing</SelectItem>
                <SelectItem value="caseNumber">Case Number</SelectItem>
                <SelectItem value="client">Client Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Order</label>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 md:col-span-3 lg:col-span-4 flex justify-end gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={clearFilters}><RotateCcw className="w-3 h-3 mr-1" />Clear Filters</Button>
            <Button size="sm" onClick={() => fetchCases(true)}>Apply Filters</Button>
          </div>
        </div>
      )}

      {/* Adjourn Dialog */}
      {adjournCaseId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h3 className="font-medium text-yellow-800 mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> Adjourn Hearing</h3>
          <div className="flex flex-wrap gap-2">
            <div>
              <label className="text-xs text-gray-600">New Hearing Date *</label>
              <Input type="date" value={adjournDate} min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} onChange={(e) => setAdjournDate(e.target.value)} className="mt-1 h-8" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-gray-600">Reason (optional)</label>
              <Input placeholder="Reason for adjournment" value={adjournReason} onChange={(e) => setAdjournReason(e.target.value)} className="mt-1 h-8" />
            </div>
            <div className="flex items-end gap-2">
              <Button size="sm" onClick={handleAdjourn} disabled={adjournLoading || !adjournDate} className="bg-yellow-600 hover:bg-yellow-700 text-white">{adjournLoading ? "Saving..." : "Confirm Adjourn"}</Button>
              <Button size="sm" variant="outline" onClick={() => setAdjournCaseId(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Proceedings Dialog */}
      {addProceedingCaseId && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <h3 className="font-medium text-green-800 mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> Add Proceedings</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input type="date" value={proceedingDate} onChange={(e) => setProceedingDate(e.target.value)} className="h-8 w-40" />
            <Input placeholder="What happened at this hearing?" value={proceedingText} onChange={(e) => setProceedingText(e.target.value)} className="flex-1 h-8" />
            <Button size="sm" onClick={handleAddProceeding} disabled={proceedingLoading || !proceedingText.trim()} className="bg-green-600 hover:bg-green-700 text-white">{proceedingLoading ? "Saving..." : "Save"}</Button>
            <Button size="sm" variant="outline" onClick={() => setAddProceedingCaseId(null)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* View Details Case Modal */}
      {viewDetailsCase && (
        <Dialog open={!!viewDetailsCase} onOpenChange={() => setViewDetailsCase(null)}>
          <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Eye className="w-5 h-5 text-blue-600" /> Case Details</DialogTitle>
              <DialogDescription>Full overview of case record</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2 bg-white rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Title</p>
                  <p className="font-medium text-gray-800">{viewDetailsCase.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Case Number</p>
                  <p className="font-medium text-gray-800">#{viewDetailsCase.caseNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Client Name</p>
                  <p className="font-medium text-gray-800">{viewDetailsCase.client?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Opponent</p>
                  <p className="font-medium text-gray-800">{viewDetailsCase.opponentName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Court / Jurisdiction</p>
                  <p className="font-medium text-gray-800">{viewDetailsCase.court || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Next Hearing</p>
                  <p className="font-medium text-blue-700">{viewDetailsCase.nextHearing || "No active date"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <p className="mt-1"><span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(viewDetailsCase.status)}`}>{viewDetailsCase.status}</span></p>
                </div>
              </div>

              {(viewDetailsCase.status === "Closed" || viewDetailsCase.status === "Transferred") && viewDetailsCase.statusNotes && (
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                  <p className="text-sm text-orange-800 font-medium">Reason for {viewDetailsCase.status}:</p>
                  <p className="text-sm text-gray-700 mt-1">{viewDetailsCase.statusNotes}</p>
                </div>
              )}

              {viewDetailsCase.notes && (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-sm text-gray-500 font-medium mb-1">General Notes:</p>
                  <p className="text-sm text-gray-700">{viewDetailsCase.notes}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Proceedings History Modal */}
      {viewProceedingsCase && (
        <Dialog open={!!viewProceedingsCase} onOpenChange={() => setViewProceedingsCase(null)}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-purple-600" /> Proceedings History</DialogTitle>
              <DialogDescription>{viewProceedingsCase.title} — #{viewProceedingsCase.caseNumber}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              {(!viewProceedingsCase.proceedingsHistory || viewProceedingsCase.proceedingsHistory.length === 0) ? (
                <p className="text-gray-400 text-sm italic text-center py-6">No proceedings recorded yet.</p>
              ) : (
                (viewProceedingsCase.proceedingsHistory as any[]).map((p: any, i: number) => (
                  <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-24 text-xs text-gray-400 flex-shrink-0 pt-0.5">{p.date}</div>
                    <div className="text-sm text-gray-800">{p.notes}</div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-12"><p className="text-gray-500">Loading cases...</p></div>
      ) : cases.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No cases found</p>
          <p className="text-gray-400 text-sm mt-1">{search || filterStatus !== "all" ? "Try adjusting your filters" : "Add your first case to get started"}</p>
        </div>
      ) : renderTable()}
    </div>
  );
};

// CaseForm remains the same as in your code (no changes needed)
interface CaseFormProps {
  caseToEdit?: Case | null;
  onSave: (savedCase?: Case, isNew?: boolean) => void;
  onCancel: () => void;
  lawyerId: string | undefined;
  isFeeUnlocked: boolean;
}

const CaseForm: React.FC<CaseFormProps> = ({
  caseToEdit,
  onSave,
  onCancel,
  lawyerId,
  isFeeUnlocked,
}) => {
  const [formData, setFormData] = useState<any>({
    _id: caseToEdit?._id,
    lawyerId: lawyerId ?? "",
    title: caseToEdit?.title || "",
    caseNumber: caseToEdit?.caseNumber || "",
    caseType: (caseToEdit as any)?.caseType || "Other",
    client: {
      name: caseToEdit?.client.name || "",
      phone: caseToEdit?.client.phone || "",
      email: caseToEdit?.client.email || "",
    },
    opponentName: caseToEdit?.opponentName || "",
    court: caseToEdit?.court || "",
    status: caseToEdit?.status || "Pending",
    statusNotes: caseToEdit?.statusNotes || "",
    nextHearing: caseToEdit?.nextHearing || "",
    previousHearings: caseToEdit?.previousHearings || [],
    proceedings: caseToEdit?.proceedings || "",
    fees: caseToEdit?.fees || 0,
    documents: caseToEdit?.documents || [],
    notes: caseToEdit?.notes || "",
  });
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [dateError, setDateError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (caseToEdit) {
      setFormData({ ...caseToEdit, lawyerId: lawyerId ?? caseToEdit.lawyerId });
    } else if (lawyerId) {
      setFormData((prev) => ({ ...prev, lawyerId }));
    }
  }, [caseToEdit, lawyerId]);

  useEffect(() => {
    const fetchCalendarData = async () => {
      if (!lawyerId) return;
      setIsLoading(true);
      try {
        const [holidaysRes, eventsRes] = await Promise.all([
          api.get("/calendar/holidays", { timeout: 5000 }),
          api.get("/calendar/events", { timeout: 5000 }),
        ]);
        setHolidays(
          Array.isArray(holidaysRes.data)
            ? holidaysRes.data.filter((h: Holiday) => isValid(parseISO(h.date)))
            : []
        );
        setEvents(
          Array.isArray(eventsRes.data)
            ? eventsRes.data.filter((e: CalendarEvent) => isValid(parseISO(e.date)))
            : []
        );
      } catch (err: any) {
        console.error("Error fetching calendar data:", err.message);
        toast.error("Failed to fetch calendar data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCalendarData();
  }, [lawyerId]);

  const validateHearingDate = (date: string): string | null => {
    if (!date || !isValid(parseISO(date))) {
      return null;
    }
    const selectedDate = parseISO(date);
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    if (isSunday(selectedDate)) {
      return "Cannot schedule on a Sunday (Court Holiday)";
    }
    if (holidays.some((h) => h.date === dateStr)) {
      const h = holidays.find(h => h.date === dateStr);
      return `Holiday: ${h?.name || "Official Holiday"}`;
    }

    // STRICT BLOCK: No cases on date with existing hearing/event
    const existingEntry = events.find((e) => e.date === dateStr);
    if (existingEntry) {
      return `Conflict: Already a ${existingEntry.eventType || 'hearing'} on this date.`;
    }

    return null;
  };

  const suggestNextDate = (currentDate: string) => {
    let checkDate = parseISO(currentDate);
    for (let i = 1; i <= 30; i++) {
      const nextDate = addDays(checkDate, 1);
      const nextDateStr = format(nextDate, "yyyy-MM-dd");
      if (!validateHearingDate(nextDateStr) && !events.some(e => e.date === nextDateStr)) {
        toast.info(`Next Free Date: ${format(nextDate, "EEEE, MMM d")}`, {
          description: "Click to set this date",
          action: {
            label: "Set Date",
            onClick: () => {
              setFormData(prev => ({ ...prev, nextHearing: nextDateStr }));
              setDateError(null);
            }
          }
        });
        break;
      }
    }
  };

  const checkConflicts = async (date: string) => {
    if (!date || date.length < 10) return;
    try {
      const res = await api.get(`/calendar/conflicts?date=${date}`);
      if (res.data.hasConflict) {
        toast.warning(
          `Conflict Check: You already have ${res.data.count} hearing(s) on ${date}!`,
          { duration: 5000 }
        );
      }
    } catch (err) {
      console.error("Conflict check failed");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "nextHearing") {
      const err = validateHearingDate(value);
      setDateError(err);
      if (err) suggestNextDate(value);
      checkConflicts(value);
    } else if (name === "fees") {
      // Allow number entry if unlocked OR if we are adding a NEW case
      if (isFeeUnlocked || !caseToEdit) {
        setFormData({ ...formData, [name]: parseFloat(value) || 0 });
      }
      return;
    }
    if (name.includes("client.")) {
      const field = name.split(".")[1] as keyof Case["client"];
      setFormData({
        ...formData,
        client: { ...formData.client, [field]: value },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleStatusChange = (value: Case["status"]) => {
    setFormData({ ...formData, status: value });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setSelectedFiles(files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lawyerId) {
      toast.error("Lawyer ID is required. Please refresh the page.");
      return;
    }
    if (formData.nextHearing && dateError) {
      toast.error(dateError);
      return;
    }
    try {
      setIsLoading(true);
      const dataToSend = {
        ...formData,
        client: {
          name: formData.client.name,
          phone: formData.client.phone || "",
          email: formData.client.email || "",
        },
      };

      let savedCase: Case;
      let caseId: string;
      if (caseToEdit?._id) {
        const response = await api.put(`/cases/${caseToEdit._id}`, dataToSend);
        savedCase = response.data;
        caseId = caseToEdit._id;
      } else {
        const response = await api.post(`/cases`, dataToSend);
        savedCase = response.data;
        caseId = response.data._id;
      }
      console.log("Save response:", savedCase); // Debug

      // Upload files if any
      if (selectedFiles && selectedFiles.length > 0) {
        const formDataToSend = new FormData();
        Array.from(selectedFiles).forEach((file) =>
          formDataToSend.append("documents", file)
        );
        await api.post(
          `/cases/${caseId}/documents`,
          formDataToSend,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        console.log("Documents uploaded successfully"); // Debug
      }

      onSave(savedCase, !caseToEdit?._id); // Pass savedCase and isNew flag
    } catch (error: any) {
      console.error("Error saving case:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      const errorMsg = error.response?.data?.error || error.response?.data?.details || "Error saving case";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="mt-1"
          disabled={isLoading}
        />
      </div>
      <div>
        <Label htmlFor="caseNumber">Case Number</Label>
        <Input
          id="caseNumber"
          name="caseNumber"
          value={formData.caseNumber}
          onChange={handleChange}
          required
          className="mt-1"
          disabled={isLoading}
        />
      </div>
      <div>
        <Label htmlFor="caseType">Case Type</Label>
        <Select
          name="caseType"
          value={formData.caseType}
          onValueChange={(val) => setFormData({ ...formData, caseType: val })}
          disabled={isLoading}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Civil">Civil</SelectItem>
            <SelectItem value="Criminal">Criminal</SelectItem>
            <SelectItem value="Family">Family</SelectItem>
            <SelectItem value="Labour">Labour</SelectItem>
            <SelectItem value="Commercial">Commercial</SelectItem>
            <SelectItem value="Constitutional">Constitutional</SelectItem>
            <SelectItem value="Tax">Tax</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="client.name">Client Name</Label>
        <Input
          id="client.name"
          name="client.name"
          value={formData.client.name}
          onChange={handleChange}
          required
          className="mt-1"
          disabled={isLoading}
        />
      </div>
      <div>
        <Label htmlFor="opponentName">Opponent Name</Label>
        <Input
          id="opponentName"
          name="opponentName"
          value={formData.opponentName || ""}
          onChange={handleChange}
          className="mt-1"
          disabled={isLoading}
        />
      </div>
      <div>
        <Label htmlFor="client.phone">Client Phone</Label>
        <Input
          id="client.phone"
          name="client.phone"
          value={formData.client.phone || ""}
          onChange={handleChange}
          className="mt-1"
          disabled={isLoading}
        />
      </div>
      <div>
        <Label htmlFor="client.email">Client Email</Label>
        <Input
          id="client.email"
          name="client.email"
          value={formData.client.email || ""}
          onChange={handleChange}
          className="mt-1"
          disabled={isLoading}
        />
      </div>
      <div>
        <Label htmlFor="court">Court</Label>
        <Input
          id="court"
          name="court"
          value={formData.court || ""}
          onChange={handleChange}
          className="mt-1"
          disabled={isLoading}
        />
      </div>
      <div>
        <Label htmlFor="status">Case Status</Label>
        <Select name="status" value={formData.status} onValueChange={handleStatusChange} disabled={isLoading}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
            <SelectItem value="Transferred">Transferred</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(formData.status === "Closed" || formData.status === "Transferred") && (
        <div className="md:col-span-2 bg-orange-50 border border-orange-200 p-3 rounded-xl mb-2">
          <Label htmlFor="statusNotes" className="text-orange-900">Reason for {formData.status}</Label>
          <Textarea
            id="statusNotes"
            name="statusNotes"
            value={formData.statusNotes || ""}
            onChange={handleChange}
            placeholder={`Why is this case ${formData.status.toLowerCase()}? Briefly exaplin here...`}
            className="mt-1 border-orange-200 bg-white"
            disabled={isLoading}
          />
        </div>
      )}

      <div>
        <Label htmlFor="nextHearing">Next Hearing</Label>
        <Input
          id="nextHearing"
          name="nextHearing"
          type="date"
          value={formData.nextHearing || ""}
          onChange={handleChange}
          className={`mt-1 ${dateError ? "border-red-500" : ""}`}
          disabled={isLoading}
        />
        {dateError && <p className="text-red-500 text-xs mt-1">{dateError}</p>}
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="proceedings">Proceedings</Label>
        <Textarea
          id="proceedings"
          name="proceedings"
          value={formData.proceedings || ""}
          onChange={handleChange}
          className="mt-1"
          disabled={isLoading}
        />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="fees">Fees</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">Rs</span>
          <Input
            id="fees"
            name="fees"
            type={(isFeeUnlocked || !caseToEdit) ? "number" : "text"}
            value={(isFeeUnlocked || !caseToEdit) ? (formData.fees || 0) : "••••••"}
            onChange={handleChange}
            className="mt-1 pl-9"
            disabled={isLoading || (!isFeeUnlocked && !!caseToEdit)}
          />
        </div>
        {!isFeeUnlocked && !!caseToEdit && <p className="text-[10px] text-amber-600 mt-1">Unlock vault to edit fees</p>}
        {!isFeeUnlocked && !caseToEdit && <p className="text-[10px] text-blue-600 mt-1">New case: Fees can be entered without PIN</p>}
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes || ""}
          onChange={handleChange}
          className="mt-1"
          disabled={isLoading}
        />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="documents">Upload Documents (Optional)</Label>
        <Input
          id="documents"
          type="file"
          multiple
          onChange={handleFileUpload}
          className="mt-1"
          disabled={isLoading}
        />
      </div>
      <div className="flex justify-end gap-2 md:col-span-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !!dateError || !formData.title || !formData.caseNumber}>
          {isLoading ? "Saving..." : (caseToEdit ? "Update Case" : "Add Case")}
        </Button>
      </div>
    </form>
  );
};