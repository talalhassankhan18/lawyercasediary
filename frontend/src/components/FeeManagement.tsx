import React, { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Plus,
  Printer,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  Lock,
  ShieldAlert,
  Eye
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import api from "../lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { PinModal } from "./PinModal";

interface Installment {
  _id?: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  method?: string;
  transactionId?: string;
  status: "Paid" | "Pending" | "Overdue";
  notes?: string;
}

interface Fee {
  _id: string;
  invoiceNumber: string;
  caseId: { _id: string; title: string; caseNumber: string; client: { name: string } };
  totalFee: number;
  paidAmount: number;
  pendingAmount: number;
  status: string;
  notes?: string;
  installments: Installment[];
  createdAt: string;
}

export const FeeManagement = () => {
  const [fees, setFees] = useState<Fee[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ stats: {}, upcomingInstallments: [] });
  const [loading, setLoading] = useState(false);
  const [lawyer, setLawyer] = useState<any>(null);

  // Modals state
  const [isAddFeeOpen, setIsAddFeeOpen] = useState(false);
  const [viewFee, setViewFee] = useState<Fee | null>(null);

  // New Fee Setup Form State
  const [newFeeCaseId, setNewFeeCaseId] = useState("");
  const [newFeeTotal, setNewFeeTotal] = useState("");
  const [newFeeInstallments, setNewFeeInstallments] = useState<any[]>([]);
  const [newFeeNotes, setNewFeeNotes] = useState("");
  const [submittingFee, setSubmittingFee] = useState(false);

  // Pay Installment Form State
  const [payInstallmentId, setPayInstallmentId] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState("Cash");
  const [payTxId, setPayTxId] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [paying, setPaying] = useState(false);
  const [receivingAll, setReceivingAll] = useState(false);

  const fetchFees = async () => {
    setLoading(true);
    try {
      const [feesRes, summaryRes, casesRes, lawyerRes] = await Promise.all([
        api.get("/fees"),
        api.get("/fees/summary"),
        api.get("/cases/all?limit=100"),
        api.get("/lawyers/me")
      ]);
      setFees(feesRes.data);
      setSummary(summaryRes.data);
      setCases(casesRes.data.cases);
      setLawyer(lawyerRes.data.user || lawyerRes.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to fetch fee data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  const isUnlocked = sessionStorage.getItem("feeUnlocked") === "true";
  const [showPinModal, setShowPinModal] = useState(false);

  const handlePinSuccess = async (pin: string) => {
    try {
      const response = await api.post("/lawyers/verify-fee-key", { pin });
      if (response.data.success) {
        sessionStorage.setItem("feeUnlocked", "true");
        toast.success("Vault Unlocked");
        window.location.reload(); // Quick way to refresh state across components
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error("Invalid PIN");
      return false;
    }
  };

  if (!isUnlocked) {
    return (
      <div className="h-[80vh] flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center space-y-6 shadow-2xl border-t-4 border-amber-500">
          <div className="mx-auto w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
            <Lock className="w-10 h-10 text-amber-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Financial Vault Locked</h2>
            <p className="text-gray-500">Sensitive fee data is restricted to the account owner. Please enter your security PIN to continue.</p>
          </div>
          <Button
            onClick={() => setShowPinModal(true)}
            className="w-full h-12 text-lg bg-amber-600 hover:bg-amber-700"
          >
            <Eye className="w-5 h-5 mr-2" /> Unlock Financial Records
          </Button>
          <div className="flex items-center gap-2 justify-center text-xs text-gray-400">
            <ShieldAlert className="w-4 h-4" />
            <span>Secure Session Encryption Active</span>
          </div>
          <PinModal
            isOpen={showPinModal}
            onClose={() => setShowPinModal(false)}
            onSuccess={handlePinSuccess}
          />
        </Card>
      </div>
    );
  }

  const handleAddInstallmentRow = () => {
    setNewFeeInstallments([...newFeeInstallments, { amount: "", dueDate: format(new Date(), "yyyy-MM-dd"), status: "Pending" }]);
  };

  const updateInstallmentRow = (index: number, field: string, value: any) => {
    const updated = [...newFeeInstallments];
    updated[index][field] = value;
    setNewFeeInstallments(updated);
  };

  const removeInstallmentRow = (index: number) => {
    setNewFeeInstallments(newFeeInstallments.filter((_, i) => i !== index));
  };

  const handleSaveNewFee = async () => {
    if (!newFeeCaseId || !newFeeTotal) {
      toast.error("Case and Total Fee are required");
      return;
    }

    // Validate installments sum
    const sum = newFeeInstallments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    if (newFeeInstallments.length > 0 && Math.abs(sum - Number(newFeeTotal)) > 1) {
      toast.error(`Installments sum (${sum}) must equal Total Fee (${newFeeTotal})`);
      return;
    }

    setSubmittingFee(true);
    try {
      await api.post("/fees", {
        caseId: newFeeCaseId,
        totalFee: Number(newFeeTotal),
        installments: newFeeInstallments.map(i => ({ md: i.method, ...i, amount: Number(i.amount) })),
        notes: newFeeNotes
      });
      toast.success("Fee setup created successfully");
      setIsAddFeeOpen(false);
      resetNewFeeForm();
      fetchFees();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create fee");
    } finally {
      setSubmittingFee(false);
    }
  };

  const resetNewFeeForm = () => {
    setNewFeeCaseId("");
    setNewFeeTotal("");
    setNewFeeInstallments([]);
    setNewFeeNotes("");
  };

  const handlePayInstallment = async (feeId: string, instId: string) => {
    setPaying(true);
    try {
      await api.post(`/fees/${feeId}/installments/${instId}/pay`, {
        method: payMethod,
        transactionId: payTxId,
        notes: payNotes
      });
      toast.success("Payment recorded successfully");
      setPayInstallmentId(null);
      // Update local viewFee to reflect the change
      const res = await api.get(`/fees/${feeId}`);
      setViewFee(res.data);
      fetchFees(); // refresh dashboard in background
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to record payment");
    } finally {
      setPaying(false);
    }
  };

  const handleReceiveAllPayments = async (fee: Fee) => {
    if (!window.confirm(`Mark entire invoice ${fee.invoiceNumber} as fully paid?`)) return;
    setReceivingAll(true);
    try {
      await api.post(`/fees/${fee._id}/receive-all`, { method: "Cash" });
      toast.success("Entire fee status set to Received");
      const res = await api.get(`/fees/${fee._id}`);
      setViewFee(res.data);
      fetchFees();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to finalize payment");
    } finally {
      setReceivingAll(false);
    }
  };

  const handlePrintInvoice = (fee: Fee) => {
    const win = window.open("", "_blank");
    if (!win) return;
    const today = format(new Date(), "PP");
    win.document.write(`
      <html><head><title>Invoice ${fee.invoiceNumber}</title>
      <style>
        body { font-family: Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
        .firm-header { text-align: center; margin-bottom: 30px; border-bottom: 3px double #eee; padding-bottom: 20px; }
        .firm-name { font-size: 32px; font-weight: bold; color: #1e3a8a; text-transform: uppercase; margin: 0; }
        .lawyer-name { font-size: 16px; color: #666; margin-top: 5px; }
        .header { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
        .invoice-title { font-size: 24px; color: #1e3a8a; font-weight: bold; margin:0; }
        .text-right { text-align: right; }
        .text-sm { font-size: 14px; color: #666; }
        .info-grid { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .box { background: #f8fafc; padding: 15px; border-radius: 8px; width: 45%; }
        h3 { margin-top:0; font-size: 16px; color: #1e3a8a; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background: #f1f5f9; padding: 10px; text-align: left; font-size: 14px; color: #475569; border-bottom: 1px solid #cbd5e1; }
        td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
        .totals { float: right; width: 300px; }
        .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size:15px; }
        .total-final { font-weight: bold; font-size: 18px; color: #0f172a; border-top: 2px solid #cbd5e1; padding-top: 12px; margin-top: 8px; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; }
        .bg-green { background: #dcfce7; color: #166534; }
        .bg-yellow { background: #fef08a; color: #854d0e; }
        .bg-gray { background: #f1f5f9; color: #475569; }
        .footer { clear:both; margin-top: 80px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
      </style></head><body>
      
      <div class="firm-header">
        <h1 class="firm-name">${lawyer?.firmName || "LAW FIRM"}</h1>
        <p class="lawyer-name">Advocate ${lawyer?.firstName || ""} ${lawyer?.lastName || ""}</p>
      </div>

      <div class="header">
        <div>
          <p class="invoice-title">INVOICE</p>
          <p class="text-sm" style="margin-top:8px">Date: ${today}</p>
        </div>
        <div class="text-right">
          <p style="font-size:20px; font-weight:bold; margin:0; color:#0f172a">${fee.invoiceNumber}</p>
          <p class="text-sm">Status: <strong>${fee.status === 'Completed' ? 'RECEIVED' : fee.status.toUpperCase()}</strong></p>
        </div>
      </div>

      <div class="info-grid">
        <div class="box">
          <h3>Bill To</h3>
          <p><strong>${fee.caseId.client?.name || "Client"}</strong></p>
          <p class="text-sm">Case: ${fee.caseId.title}</p>
          <p class="text-sm">Case No: ${fee.caseId.caseNumber}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Installment Date</th>
            <th>Description</th>
            <th>Amount</th>
            <th style="text-align:right">Status</th>
          </tr>
        </thead>
        <tbody>
          ${fee.installments && fee.installments.length > 0 ? fee.installments.map((inst, i) => `
            <tr>
              <td>${format(new Date(inst.dueDate), "PP")}</td>
              <td>Installment #${i + 1}${inst.paidDate ? ` (Paid on: ${format(new Date(inst.paidDate), "PP")})` : ''}</td>
              <td>Rs ${inst.amount.toLocaleString()}</td>
              <td style="text-align:right"><span class="badge ${inst.status === 'Paid' ? 'bg-green' : inst.status === 'Overdue' ? 'bg-yellow' : 'bg-gray'}">${inst.status}</span></td>
            </tr>
          `).join('') : `
            <tr>
              <td>${format(new Date(), "PP")}</td>
              <td>Professional Legal Fees</td>
              <td>Rs ${fee.totalFee.toLocaleString()}</td>
              <td style="text-align:right"><span class="badge ${fee.status === 'Completed' ? 'bg-green' : 'bg-yellow'}">${fee.status}</span></td>
            </tr>
          `}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row"><span>Total Billed:</span> <span>Rs ${fee.totalFee.toLocaleString()}</span></div>
        <div class="total-row" style="color:#16a34a"><span>Amount Paid:</span> <span>-Rs ${fee.paidAmount.toLocaleString()}</span></div>
        <div class="total-row total-final" style="color:${fee.pendingAmount > 0 ? '#dc2626' : '#0f172a'}"><span>Balance Due:</span> <span>Rs ${fee.pendingAmount.toLocaleString()}</span></div>
      </div>

      <div class="footer">
        <p>Thank you for your business. Please remit payment by the due dates indicated above.</p>
        <p>Generated by Lawyer's Case Diary</p>
      </div>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const stats = summary.stats || {};
  const upcomings = summary.upcomingInstallments || [];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 border-l-4 border-blue-600 pl-3">Fee & Billing</h1>
          <p className="text-gray-500 text-sm mt-1">Manage finances, structured installments, and invoices.</p>
        </div>
        <Button onClick={() => setIsAddFeeOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> New Fee / Invoice
        </Button>
      </div>

      {/* Dashboard Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-l-4 border-green-500 bg-white shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 text-green-700 rounded-full font-bold text-lg">Rs</div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Billed</p>
              <h3 className="text-2xl font-bold text-gray-900">Rs {(stats.totalBilled || 0).toLocaleString()}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-5 border-l-4 border-blue-500 bg-white shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-full"><TrendingUp className="w-5 h-5" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Amount Received</p>
              <h3 className="text-2xl font-bold text-gray-900">Rs {(stats.totalReceived || 0).toLocaleString()}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-5 border-l-4 border-orange-500 bg-white shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 text-orange-700 rounded-full"><CreditCard className="w-5 h-5" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Balance</p>
              <h3 className="text-2xl font-bold text-gray-900">Rs {(stats.totalPending || 0).toLocaleString()}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-5 border border-gray-200 bg-gray-50 flex flex-col justify-center shadow-inner">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-medium text-gray-700">
              <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> Closed Fees</span>
              <span>{stats.completedCases || 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-medium text-gray-700">
              <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-yellow-500" /> Partial Payments</span>
              <span>{stats.partialCases || 0}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Col: Case Fees List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400" /> All Case Invoices
          </h2>
          {loading ? (
            <p className="text-gray-500 py-10 text-center animate-pulse">Loading fees data...</p>
          ) : fees.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
              <p className="text-gray-500 font-medium">No fees recorded yet</p>
              <p className="text-gray-400 text-sm mt-1">Click "New Fee / Invoice" to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {fees.map((f) => (
                <div key={f._id} onClick={() => setViewFee(f)} className="bg-white p-4 border rounded-xl shadow-sm hover:shadow-md transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{f.caseId?.title || "Unknown Case"}</h3>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${f.status === 'Completed' ? 'bg-green-100 text-green-700' : f.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {f.status === 'Completed' ? 'RECEIVED' : f.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">Inv: {f.invoiceNumber} • Client: {f.caseId?.client?.name || "N/A"}</p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Billed</p>
                      <p className="font-semibold text-gray-900">Rs {f.totalFee.toLocaleString()}</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>
                    <div>
                      <p className="text-xs text-green-600 font-medium">Received</p>
                      <p className="font-semibold text-green-700">Rs {f.paidAmount.toLocaleString()}</p>
                    </div>
                    {f.pendingAmount > 0 && (
                      <>
                        <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>
                        <div>
                          <p className="text-xs text-red-500 font-medium">Pending</p>
                          <p className="font-semibold text-red-600">Rs {f.pendingAmount.toLocaleString()}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Upcoming / Overdue Installments */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" /> Pending Installments
          </h2>
          <div className="bg-white border rounded-xl shadow-sm p-1">
            {upcomings.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No pending installments ahead.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {upcomings.map((u: any, i: number) => {
                  const isOverdue = new Date(u.installments.dueDate) < new Date();
                  return (
                    <div key={i} onClick={() => {
                      const feeObj = fees.find(f => f._id === u._id);
                      if (feeObj) setViewFee(feeObj);
                    }} className="p-3 hover:bg-gray-50 transition cursor-pointer">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm text-gray-900">Rs {u.installments.amount.toLocaleString()}</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                          {isOverdue ? 'OVERDUE' : 'UPCOMING'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 truncate">{u.caseDetails?.title}</p>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Due: {format(new Date(u.installments.dueDate), "MMM dd, yyyy")}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Fee Setup Modal */}
      <Dialog open={isAddFeeOpen} onOpenChange={(o) => { setIsAddFeeOpen(o); if (!o) resetNewFeeForm(); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Fee / Invoice Setup</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
              <Label>Select Case *</Label>
              <Select value={newFeeCaseId} onValueChange={(val) => {
                setNewFeeCaseId(val);
                const selected = cases.find(c => c._id === val);
                if (selected && selected.fees) {
                  setNewFeeTotal(selected.fees.toString());
                }
              }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Search case..." /></SelectTrigger>
                <SelectContent>
                  {cases.map(c => <SelectItem key={c._id} value={c._id}>{c.title} ({c.caseNumber})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Total Professional Fee ($) *</Label>
              <Input type="number" value={newFeeTotal} onChange={(e) => setNewFeeTotal(e.target.value)} className="mt-1" placeholder="Enter amount" />
              {newFeeCaseId && cases.find(c => c._id === newFeeCaseId)?.fees > 0 && (
                <p className="text-[10px] text-blue-600 mt-1">Auto-loaded from Case Record: ${cases.find(c => c._id === newFeeCaseId).fees}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <Label>Notes (Optional)</Label>
              <Input value={newFeeNotes} onChange={(e) => setNewFeeNotes(e.target.value)} className="mt-1" placeholder="Detailed terms or specifics..." />
            </div>
          </div>

          <div className="mt-6 border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <Label className="text-base font-semibold">Payment Installments Track</Label>
              <Button size="sm" variant="outline" onClick={handleAddInstallmentRow}><Plus className="w-3 h-3 mr-1" /> Add Installment</Button>
            </div>

            {newFeeInstallments.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No installments. The fee will be considered a single pending lump sum.</p>
            ) : (
              <div className="space-y-3">
                {newFeeInstallments.map((inst, index) => (
                  <div key={index} className="flex gap-2 items-end bg-gray-50 p-3 rounded-lg border">
                    <div className="flex-1">
                      <Label className="text-xs text-gray-500">Amount ($)</Label>
                      <Input type="number" value={inst.amount} onChange={(e) => updateInstallmentRow(index, "amount", e.target.value)} className="h-8" />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-gray-500">Due Date</Label>
                      <Input type="date" value={inst.dueDate} onChange={(e) => updateInstallmentRow(index, "dueDate", e.target.value)} className="h-8" />
                    </div>
                    <div className="w-32">
                      <Label className="text-xs text-gray-500">Status</Label>
                      <Select value={inst.status} onValueChange={(val) => updateInstallmentRow(index, "status", val)}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Paid">Pre-Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="destructive" size="sm" className="h-8 px-2" onClick={() => removeInstallmentRow(index)}>X</Button>
                  </div>
                ))}
              </div>
            )}

            {newFeeInstallments.length > 0 && (
              <div className="flex justify-end mt-2 text-sm text-gray-600 font-medium">
                Sum: ${newFeeInstallments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0)} / ${newFeeTotal || 0}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsAddFeeOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveNewFee} disabled={submittingFee || !newFeeCaseId || !newFeeTotal}>
              {submittingFee ? "Saving..." : "Save Fee Setup"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Fee / Invoice Details Modal */}
      {viewFee && (
        <Dialog open={!!viewFee} onOpenChange={() => { setViewFee(null); setPayInstallmentId(null); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex justify-between items-start">
                <div>
                  <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                    Invoice {viewFee.invoiceNumber}
                    <Badge variant="outline" className={viewFee.status === 'Completed' ? 'bg-green-100 text-green-700' : viewFee.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}>
                      {viewFee.status === 'Completed' ? 'FULLY RECEIVED' : viewFee.status}
                    </Badge>
                  </DialogTitle>
                  <p className="text-gray-500 text-sm mt-1">Case: {viewFee.caseId?.title} (#{viewFee.caseId?.caseNumber})</p>
                </div>
                <div className="flex gap-2">
                  {viewFee.status !== "Completed" && (
                    <Button size="sm" onClick={() => handleReceiveAllPayments(viewFee)} disabled={receivingAll} className="bg-green-600 hover:bg-green-700">
                      {receivingAll ? "Finalizing..." : "Mark All Paid"}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handlePrintInvoice(viewFee)}>
                    <Printer className="w-4 h-4 mr-2" /> Print Invoice
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center my-2 border">
              <div className="text-center">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Total Billed</p>
                <p className="text-xl font-bold text-gray-900">${viewFee.totalFee.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Paid Amount</p>
                <p className="text-xl font-bold text-green-600">${viewFee.paidAmount.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Balance Due</p>
                <p className="text-xl font-bold text-red-600">${viewFee.pendingAmount.toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold text-gray-800 mb-3 border-b pb-2">Tracking / Installments</h4>
              {viewFee.installments && viewFee.installments.length > 0 ? (
                <div className="space-y-3">
                  {viewFee.installments.map((inst, idx) => (
                    <div key={inst._id || idx} className={`p-4 rounded-xl border ${inst.status === 'Paid' ? 'bg-green-50 border-green-100' : 'bg-white shadow-sm'}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-gray-900">${inst.amount.toLocaleString()}</p>
                          <p className="text-xs text-gray-500 mt-1">Due: {format(new Date(inst.dueDate), "MMM dd, yyyy")}</p>
                          {inst.status === "Paid" && <p className="text-xs text-green-600 mt-0.5">Paid on: {inst.paidDate} {inst.method ? `via ${inst.method}` : ''}</p>}
                        </div>
                        <div>
                          {inst.status === "Paid" ? (
                            <span className="flex items-center text-green-600 font-semibold text-sm">
                              <CheckCircle className="w-4 h-4 mr-1" /> Paid
                            </span>
                          ) : (
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setPayInstallmentId(inst._id!)}>
                              Receive Payment
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Receive Payment Inline Form */}
                      {payInstallmentId === inst._id && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm font-semibold mb-2">Record Payment for ${inst.amount}</p>
                          <div className="flex gap-2 flex-wrap">
                            <Select value={payMethod} onValueChange={setPayMethod}>
                              <SelectTrigger className="w-[120px] h-9"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="Bank Transfer">Bank</SelectItem>
                                <SelectItem value="Cheque">Cheque</SelectItem>
                                <SelectItem value="Online">Online</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input placeholder="Tx ID / Cheque No" value={payTxId} onChange={(e) => setPayTxId(e.target.value)} className="w-[150px] h-9" />
                            <Input placeholder="Notes..." value={payNotes} onChange={(e) => setPayNotes(e.target.value)} className="flex-1 min-w-[120px] h-9" />
                          </div>
                          <div className="flex justify-end gap-2 mt-2">
                            <Button size="sm" variant="outline" onClick={() => setPayInstallmentId(null)}>Cancel</Button>
                            <Button size="sm" onClick={() => handlePayInstallment(viewFee._id, inst._id!)} disabled={paying}>
                              {paying ? "Processing..." : "Confirm Payment"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No structured installments. The full balance is pending.</p>
              )}
            </div>
            {viewFee.notes && (
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border mt-2"><strong>Notes:</strong> {viewFee.notes}</p>
            )}
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
};