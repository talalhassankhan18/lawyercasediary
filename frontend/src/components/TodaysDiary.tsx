import React, { useState, useEffect, useCallback } from "react";
import api from "../lib/api";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import {
    Calendar, Printer, FileText, Clock, User, Scale, RefreshCw,
    ChevronDown, ChevronUp, Plus, Check, Eye
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";

interface Case {
    _id: string;
    title: string;
    caseNumber: string;
    caseType?: string;
    client: { name: string; phone?: string; email?: string };
    opponentName?: string;
    court?: string;
    status: string;
    proceedings?: string;
    proceedingsHistory?: { _id: string; date: string; notes: string; addedAt: string }[];
    notes?: string;
    statusNotes?: string;
}

export const TodaysDiary = () => {
    const [cases, setCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);
    const [today, setToday] = useState("");
    const [lawyerName, setLawyerName] = useState("");
    const [firmName, setFirmName] = useState("");
    const [expandedCase, setExpandedCase] = useState<string | null>(null);
    const [addingProceeding, setAddingProceeding] = useState<string | null>(null);
    const [proceedingText, setProceedingText] = useState("");
    const [adjournCaseId, setAdjournCaseId] = useState<string | null>(null);
    const [adjournDate, setAdjournDate] = useState("");
    const [adjournReason, setAdjournReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [viewDetailsCase, setViewDetailsCase] = useState<Case | null>(null);

    const fetchToday = useCallback(async () => {
        setLoading(true);
        try {
            const localToday = format(new Date(), "yyyy-MM-dd");
            const res = await api.get(`/cases/today?date=${localToday}`);
            setCases(res.data.cases || []);
            setToday(res.data.today || format(new Date(), "yyyy-MM-dd"));
            if (res.data.lawyer) {
                setLawyerName(`${res.data.lawyer.firstName} ${res.data.lawyer.lastName}`);
                setFirmName(res.data.lawyer.firmName || "");
            }
        } catch (err: any) {
            toast.error("Failed to load today's diary");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchToday(); }, [fetchToday]);

    const handlePrint = () => {
        const win = window.open("", "_blank");
        if (!win) return;

        const dateStr = format(parseISO(today), "EEEE, dd MMMM yyyy");

        let rowsHtml = "";
        cases.forEach((c, idx) => {
            rowsHtml += `
                <tr>
                    <td class="text-center">${idx + 1}</td>
                    <td>
                        <div class="font-bold">${c.title}</div>
                        <div class="text-xs text-muted">#${c.caseNumber}</div>
                    </td>
                    <td>
                        <div class="font-medium">C: ${c.client.name}</div>
                        <div class="text-xs text-muted">O: ${c.opponentName || "N/A"}</div>
                    </td>
                    <td>
                        <div>${c.court || "N/A"}</div>
                        <div class="text-xs text-muted">${c.caseType || "General"}</div>
                    </td>
                    <td class="text-center">
                        <span class="status-tag">${c.status}</span>
                    </td>
                    <td class="notes-cell">
                        <div>${c.proceedings || ""}</div>
                        ${c.notes ? `<div class="internal-note">Note: ${c.notes}</div>` : ""}
                    </td>
                </tr>
            `;
        });

        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Daily Cause List - ${today}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                    
                    body { 
                        font-family: 'Inter', sans-serif; 
                        margin: 0; 
                        padding: 30px; 
                        color: #1a1a1a;
                        background: #fff;
                        font-size: 13px;
                    }

                    .print-header {
                        text-align: center;
                        border-bottom: 2px solid #000;
                        padding-bottom: 15px;
                        margin-bottom: 20px;
                    }

                    .firm-name {
                        font-size: 24px;
                        font-weight: 800;
                        text-transform: uppercase;
                        margin: 0;
                    }

                    .advocate-name {
                        font-size: 14px;
                        color: #4b5563;
                        font-weight: 500;
                        margin-top: 4px;
                    }

                    .diary-title {
                        margin-top: 10px;
                        font-size: 12px;
                        font-weight: 700;
                        color: #ef4444;
                        text-transform: uppercase;
                        letter-spacing: 0.1em;
                    }

                    .date-text {
                        font-weight: 600;
                        margin-top: 5px;
                        font-size: 14px;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 10px;
                    }

                    th {
                        background: #f3f4f6;
                        color: #374151;
                        text-transform: uppercase;
                        font-size: 10px;
                        letter-spacing: 0.05em;
                        font-weight: 700;
                        padding: 10px;
                        border: 1px solid #d1d5db;
                        text-align: left;
                    }

                    td {
                        padding: 10px;
                        border: 1px solid #e5e7eb;
                        vertical-align: top;
                        line-height: 1.4;
                    }

                    .text-center { text-align: center; }
                    .font-bold { font-weight: 700; }
                    .font-medium { font-weight: 500; }
                    .text-xs { font-size: 11px; }
                    .text-muted { color: #6b7280; }

                    .status-tag {
                        font-size: 10px;
                        font-weight: 700;
                        background: #f3f4f6;
                        padding: 2px 6px;
                        border-radius: 4px;
                        border: 1px solid #d1d5db;
                    }

                    .internal-note {
                        background: #fffbeb;
                        padding: 4px 8px;
                        border-radius: 4px;
                        margin-top: 5px;
                        font-style: italic;
                        color: #92400e;
                        font-size: 11px;
                    }

                    .notes-cell {
                        max-width: 250px;
                    }

                    .footer {
                        margin-top: 30px;
                        text-align: center;
                        font-size: 11px;
                        color: #9ca3af;
                        border-top: 1px solid #eee;
                        padding-top: 15px;
                    }

                    @media print {
                        body { padding: 0; }
                        th { background: #eee !important; color: #000 !important; }
                        td { border: 1px solid #999 !important; }
                    }
                </style>
            </head>
            <body>
                <div class="print-header">
                    <div class="firm-name">${firmName || "LAW CHAMBERS"}</div>
                    <div class="advocate-name">Advocate ${lawyerName}</div>
                    <div class="diary-title">Daily Cause List</div>
                    <div class="date-text">${dateStr}</div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 40px;">Sr.</th>
                            <th style="width: 200px;">Case Title / Number</th>
                            <th style="width: 180px;">Parties (Client/Opp)</th>
                            <th style="width: 150px;">Court / Type</th>
                            <th style="width: 90px;">Status</th>
                            <th>Proceedings / Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml || '<tr><td colspan="6" class="text-center" style="padding: 50px; color: #999;">No hearings scheduled for today.</td></tr>'}
                    </tbody>
                </table>

                <div class="footer">
                    Generated by Lawyer's Case Diary | Total Hearings: ${cases.length}
                </div>
            </body>
            </html>
        `);
        win.document.close();
        setTimeout(() => { win.print(); }, 500);
    };

    const handleAddProceeding = async (caseId: string) => {
        if (!proceedingText.trim()) { toast.error("Please enter proceedings notes"); return; }
        setSubmitting(true);
        try {
            await api.post(`/cases/${caseId}/proceedings`, {
                date: today,
                notes: proceedingText.trim(),
            });
            toast.success("Proceedings added");
            setProceedingText("");
            setAddingProceeding(null);
            fetchToday();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to add proceedings");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAdjourn = async (caseId: string) => {
        if (!adjournDate) { toast.error("Please select a new hearing date"); return; }
        setSubmitting(true);
        try {
            await api.put(`/cases/${caseId}/adjourn`, { newDate: adjournDate, reason: adjournReason });
            toast.success("Hearing adjourned successfully");
            setAdjournCaseId(null);
            setAdjournDate("");
            setAdjournReason("");
            fetchToday();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to adjourn hearing");
        } finally {
            setSubmitting(false);
        }
    };

    const statusColor = (status: string) => {
        if (status === "In Progress") return "bg-green-100 text-green-800";
        if (status === "Pending") return "bg-yellow-100 text-yellow-800";
        if (status === "Transferred") return "bg-indigo-100 text-indigo-800";
        if (status === "Closed") return "bg-gray-100 text-gray-700";
        return "bg-gray-100 text-gray-400";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                    <p className="text-gray-500">Loading today's diary...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-7 h-7 text-blue-600" />
                        Today's Diary
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        {format(parseISO(today), "EEEE, dd MMMM yyyy")} — {cases.length} hearing{cases.length !== 1 ? "s" : ""} scheduled
                    </p>
                </div>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium self-start sm:self-auto"
                >
                    <Printer className="w-4 h-4" /> Print Diary
                </button>
            </div>

            {/* Empty State */}
            {cases.length === 0 && (
                <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-600">No hearings today</h3>
                    <p className="text-gray-400 text-sm mt-1">Enjoy your free day or add new cases!</p>
                </div>
            )}

            {/* Printable Diary Area */}
            <div id="diary-print-area">
                <div style={{ display: "none" }} className="print-header">
                    <h1>{firmName}</h1>
                    <h2>{lawyerName} — Diary for {today}</h2>
                </div>

                {/* Case Cards */}
                <div className="space-y-4">
                    {cases.map((c, idx) => (
                        <div key={c._id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                            {/* Case Header */}
                            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                                        {idx + 1}
                                    </span>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-base">{c.title}</h3>
                                        <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <FileText className="w-3 h-3" /> {c.caseNumber}
                                            </span>
                                            {c.court && (
                                                <span className="flex items-center gap-1">
                                                    <Scale className="w-3 h-3" /> {c.court}
                                                </span>
                                            )}
                                            {c.caseType && (
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{c.caseType}</span>
                                            )}
                                            <span className={`px-2 py-0.5 rounded-full ${statusColor(c.status)}`}>{c.status}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                    <button
                                        onClick={() => setViewDetailsCase(c)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition font-medium"
                                    >
                                        <Eye className="w-3 h-3" /> View
                                    </button>
                                    <button
                                        onClick={() => { setAdjournCaseId(c._id); setAddingProceeding(null); setExpandedCase(null); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition font-medium"
                                    >
                                        <Clock className="w-3 h-3" /> Adjourn
                                    </button>
                                    <button
                                        onClick={() => { setAddingProceeding(c._id); setAdjournCaseId(null); setExpandedCase(null); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition font-medium"
                                    >
                                        <Plus className="w-3 h-3" /> Proceedings
                                    </button>
                                    <button
                                        onClick={() => { setExpandedCase(expandedCase === c._id ? null : c._id); setAdjournCaseId(null); setAddingProceeding(null); }}
                                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
                                    >
                                        {expandedCase === c._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Client & Opponent */}
                            <div className="px-4 pb-3 grid grid-cols-2 gap-3 text-sm border-t border-gray-100 pt-3">
                                <div className="flex items-center gap-2 text-gray-700">
                                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span><span className="text-gray-400 text-xs">Client: </span>{c.client.name}</span>
                                </div>
                                {c.opponentName && (
                                    <div className="text-gray-700">
                                        <span className="text-gray-400 text-xs">Opponent: </span>{c.opponentName}
                                    </div>
                                )}
                            </div>

                            {/* Adjourn Form */}
                            {adjournCaseId === c._id && (
                                <div className="px-4 pb-4 pt-2 border-t border-yellow-100 bg-yellow-50">
                                    <p className="text-sm font-medium text-yellow-800 mb-3 flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" /> Adjourn Hearing
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input
                                            type="date"
                                            value={adjournDate}
                                            min={format(new Date(Date.now() + 86400000), "yyyy-MM-dd")}
                                            onChange={(e) => setAdjournDate(e.target.value)}
                                            className="flex-1 border border-yellow-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        />
                                        <input
                                            type="text"
                                            value={adjournReason}
                                            onChange={(e) => setAdjournReason(e.target.value)}
                                            placeholder="Reason (optional)"
                                            className="flex-1 border border-yellow-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        />
                                        <button
                                            onClick={() => handleAdjourn(c._id)}
                                            disabled={submitting || !adjournDate}
                                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 disabled:opacity-50 transition flex items-center gap-1"
                                        >
                                            <Check className="w-4 h-4" /> {submitting ? "Saving..." : "Confirm"}
                                        </button>
                                        <button onClick={() => setAdjournCaseId(null)} className="px-3 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition">Cancel</button>
                                    </div>
                                </div>
                            )}

                            {/* Add Proceedings Form */}
                            {addingProceeding === c._id && (
                                <div className="px-4 pb-4 pt-2 border-t border-green-100 bg-green-50">
                                    <p className="text-sm font-medium text-green-800 mb-3 flex items-center gap-1.5">
                                        <FileText className="w-4 h-4" /> Today's Proceedings
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <textarea
                                            value={proceedingText}
                                            onChange={(e) => setProceedingText(e.target.value)}
                                            placeholder="What happened at today's hearing? e.g. Arguments heard, next date fixed..."
                                            rows={3}
                                            className="flex-1 border border-green-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                                        />
                                        <div className="flex sm:flex-col gap-2">
                                            <button
                                                onClick={() => handleAddProceeding(c._id)}
                                                disabled={submitting || !proceedingText.trim()}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition flex items-center gap-1"
                                            >
                                                <Check className="w-4 h-4" /> {submitting ? "Saving..." : "Save"}
                                            </button>
                                            <button onClick={() => { setAddingProceeding(null); setProceedingText(""); }} className="px-3 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition">Cancel</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Expanded: Proceedings History */}
                            {expandedCase === c._id && (
                                <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50">
                                    <p className="text-sm font-medium text-gray-700 mb-3">Proceedings History</p>
                                    {(!c.proceedingsHistory || c.proceedingsHistory.length === 0) ? (
                                        <p className="text-sm text-gray-400 italic">No proceedings recorded yet.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {c.proceedingsHistory.map((p) => (
                                                <div key={p._id} className="flex gap-3 text-sm">
                                                    <span className="text-gray-400 whitespace-nowrap">{p.date}</span>
                                                    <span className="text-gray-700">{p.notes}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {c.notes && (
                                        <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600">
                                            <span className="font-medium">Notes: </span>{c.notes}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* View Details Case Modal */}
            {viewDetailsCase && (
                <Dialog open={!!viewDetailsCase} onOpenChange={() => setViewDetailsCase(null)}>
                    <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-blue-700"><Eye className="w-5 h-5" /> Case Context</DialogTitle>
                            <DialogDescription>Review full case details for today's hearing</DialogDescription>
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
                                    <p className="text-sm text-gray-400">Status</p>
                                    <p className="mt-1"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(viewDetailsCase.status)}`}>{viewDetailsCase.status}</span></p>
                                </div>
                            </div>

                            {(viewDetailsCase.status === "Closed" || viewDetailsCase.status === "Transferred") && viewDetailsCase.statusNotes && (
                                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                                    <p className="text-sm text-orange-800 font-medium">Why is this case {viewDetailsCase.status}?</p>
                                    <p className="text-sm text-gray-700 mt-1">{viewDetailsCase.statusNotes}</p>
                                </div>
                            )}

                            {viewDetailsCase.notes && (
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <p className="text-sm text-gray-500 font-medium mb-1">Internal Notes:</p>
                                    <p className="text-sm text-gray-700">{viewDetailsCase.notes}</p>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};
