import React, { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
  Plus,
  Download,
  Search,
  Filter,
  Grid3X3,
  List,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
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
import { Toggle } from "../components/ui/toggle";
import axios from "axios";
import { Case } from "../../../types/case";
import { Fee } from "../../../types/fee";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Updated API_URL definition for Vite
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Define CaseDetails type for better type safety
interface CaseDetails {
  _id: string;
  title?: string;
  caseNumber?: string;
  client?: { name?: string; phone?: string; email?: string };
  opponentName?: string;
}

export const FeeManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [fees, setFees] = useState<Fee[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [feeToEdit, setFeeToEdit] = useState<Fee | null>(null);
  const [loading, setLoading] = useState(false);
  const [lawyerId, setLawyerId] = useState<string | undefined>(undefined);
  const navigate = useNavigate();

  const fetchLawyerData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found");
      }
      const res = await axios.get(`${API_URL}/lawyers/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLawyerId(res.data.user.id);
    } catch (err: any) {
      console.error(
        "Error fetching lawyer data:",
        err.response?.data || err.message
      );
      if (err.response?.status === 401) {
        toast.error("Session expired. Please sign in again.");
        localStorage.removeItem("authToken");
        navigate("/login");
      } else {
        toast.error(err.response?.data?.error || "Failed to fetch lawyer data");
      }
    }
  };

  const fetchCases = async () => {
    if (!lawyerId) return;
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.get(`${API_URL}/api/cases`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCases(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.error("Error fetching cases:", err.response?.data || err.message);
      toast.error(err.response?.data?.error || "Failed to fetch cases");
    }
  };

  const fetchFees = async () => {
    if (!lawyerId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.get(`${API_URL}/api/fees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFees(
        Array.isArray(res.data)
          ? res.data.map((fee: Fee) => ({
              ...fee,
              caseId:
                typeof fee.caseId === "string"
                  ? fee.caseId
                  : fee.caseId?._id || "",
            }))
          : []
      );
    } catch (err: any) {
      console.error("Error fetching fees:", err.response?.data || err.message);
      let errorMsg = "Error fetching fees";
      if (err.response?.status === 401) {
        errorMsg = "Session expired. Please sign in again.";
        localStorage.removeItem("authToken");
        navigate("/login");
      } else {
        errorMsg = err.response?.data?.error || "Failed to fetch fees";
      }
      toast.error(errorMsg);
      setFees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLawyerData();
  }, []);

  useEffect(() => {
    if (lawyerId) {
      fetchCases();
      fetchFees();
    }
  }, [lawyerId]);

  const feeStats = {
    totalRevenue: fees.reduce((sum, fee) => sum + (fee.totalFee || 0), 0),
    totalReceived: fees.reduce((sum, fee) => sum + (fee.paidAmount || 0), 0),
    totalPending: fees.reduce((sum, fee) => sum + (fee.pendingAmount || 0), 0),
    casesWithFees: fees.length,
  };

  const filteredFees = fees.filter((fee) => {
    const caseIdStr =
      typeof fee.caseId === "string" ? fee.caseId : fee.caseId?._id || "";
    const caseDetails = cases.find((c) => c._id === caseIdStr) as
      | CaseDetails
      | undefined;
    return (
      caseDetails?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseDetails?.client?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      caseDetails?.opponentName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      false
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Partial":
        return "bg-yellow-100 text-yellow-800";
      case "Pending":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("authToken");
      await axios.delete(`${API_URL}/api/fees/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFees(fees.filter((fee) => fee._id !== id));
      toast.success("Fee record deleted");
    } catch (err: any) {
      console.error("Error deleting fee:", err.response?.data || err.message);
      toast.error(err.response?.data?.error || "Error deleting fee");
    }
  };

  const handleEdit = (fee: Fee) => {
    setFeeToEdit(fee);
    setIsAddPaymentOpen(true);
  };

  const handleSave = () => {
    setIsAddPaymentOpen(false);
    setFeeToEdit(null);
    fetchFees();
  };

  const renderCards = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
      {filteredFees.map((fee) => {
        const caseIdStr =
          typeof fee.caseId === "string" ? fee.caseId : fee.caseId?._id || "";
        const caseDetails = cases.find((c) => c._id === caseIdStr) as
          | CaseDetails
          | undefined;
        return (
          <Card
            key={fee._id}
            className="p-4 md:p-6 hover:shadow-lg transition-shadow"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm md:text-lg font-semibold text-gray-900 break-words">
                    {caseDetails?.title || "N/A"}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600">
                    Case #{caseDetails?.caseNumber || "N/A"}
                  </p>
                </div>
                <Badge
                  className={`${getStatusColor(
                    fee.status
                  )} text-xs flex-shrink-0 ml-2`}
                >
                  {fee.status}
                </Badge>
              </div>
              <div className="text-xs md:text-sm text-gray-600">
                Client: {caseDetails?.client?.name || "N/A"}
              </div>
              <div className="text-xs md:text-sm text-gray-600">
                Opponent: {caseDetails?.opponentName || "N/A"}
              </div>
              <div className="text-xs md:text-sm text-gray-600">
                Total Fee: Rs {fee.totalFee.toLocaleString()}
              </div>
              <div className="text-xs md:text-sm text-green-600">
                Paid: Rs {fee.paidAmount.toLocaleString()}
              </div>
              <div className="text-xs md:text-sm text-red-600">
                Pending: Rs {fee.pendingAmount.toLocaleString()}
              </div>
              <div className="text-xs md:text-sm text-gray-600">
                Payment Method: {fee.paymentMethod || "N/A"}
                {fee.transactionId && ` - ${fee.transactionId}`}
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                  <DollarSign className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                  <span>Last Payment: {fee.lastPayment || "N/A"}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="text-xs"
                    onClick={() => handleEdit(fee)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleDelete(fee._id!)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );

  const renderTable = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[80px]">Serial Number</TableHead>
            <TableHead className="min-w-[200px]">Case Title</TableHead>
            <TableHead className="min-w-[150px]">Client</TableHead>
            <TableHead className="min-w-[150px]">Opponent</TableHead>
            <TableHead className="min-w-[150px]">Fee Breakdown</TableHead>
            <TableHead className="min-w-[100px]">Status</TableHead>
            <TableHead className="min-w-[150px]">Last Payment</TableHead>
            <TableHead className="min-w-[150px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredFees.map((fee, index) => {
            const caseIdStr =
              typeof fee.caseId === "string"
                ? fee.caseId
                : fee.caseId?._id || "";
            const caseDetails = cases.find((c) => c._id === caseIdStr) as
              | CaseDetails
              | undefined;
            return (
              <TableRow key={fee._id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm break-words">
                      {caseDetails?.title || "N/A"}
                    </p>
                    <p className="text-xs text-gray-600">
                      #{caseDetails?.caseNumber || "N/A"}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm break-words">
                    {caseDetails?.client?.name || "N/A"}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="text-sm break-words">
                    {caseDetails?.opponentName || "N/A"}
                  </p>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>Total: Rs {fee.totalFee.toLocaleString()}</p>
                    <p className="text-green-600">
                      Paid: Rs {fee.paidAmount.toLocaleString()}
                    </p>
                    <p className="text-red-600">
                      Pending: Rs {fee.pendingAmount.toLocaleString()}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(fee.status)}>
                    {fee.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <p className="text-sm">{fee.lastPayment || "N/A"}</p>
                  <p className="text-xs text-gray-600">
                    {fee.paymentMethod || "N/A"}
                    {fee.transactionId && ` - ${fee.transactionId}`}
                  </p>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="text-xs"
                      onClick={() => handleEdit(fee)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleDelete(fee._id!)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Fee Management
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Track payments and manage case fees
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
          <Dialog
            open={isAddPaymentOpen}
            onOpenChange={(open) => {
              setIsAddPaymentOpen(open);
              if (!open) setFeeToEdit(null);
            }}
          >
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                {feeToEdit ? "Edit Payment" : "Add Payment"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {feeToEdit ? "Edit Payment Record" : "Add Payment Record"}
                </DialogTitle>
              </DialogHeader>
              <FeeForm
                feeToEdit={feeToEdit}
                cases={cases}
                onSave={handleSave}
                onCancel={() => setIsAddPaymentOpen(false)}
                lawyerId={lawyerId}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Fee Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                Rs {feeStats.totalRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-green-600 mt-1">Active fee tracking</p>
            </div>
            <div className="p-3 rounded-full bg-green-500 text-white">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Amount Received
              </p>
              <p className="text-2xl font-bold text-gray-900">
                Rs {feeStats.totalReceived.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {feeStats.totalRevenue
                  ? (
                      (feeStats.totalReceived / feeStats.totalRevenue) *
                      100
                    ).toFixed(1)
                  : 0}
                % of total
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-500 text-white">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Pending Amount
              </p>
              <p className="text-2xl font-bold text-gray-900">
                Rs {feeStats.totalPending.toLocaleString()}
              </p>
              <p className="text-xs text-red-600 mt-1">
                {feeStats.totalRevenue
                  ? (
                      (feeStats.totalPending / feeStats.totalRevenue) *
                      100
                    ).toFixed(1)
                  : 0}
                % pending
              </p>
            </div>
            <div className="p-3 rounded-full bg-red-500 text-white">
              <Banknote className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Cases with Fees
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {feeStats.casesWithFees}
              </p>
              <p className="text-xs text-gray-500 mt-1">Active fee tracking</p>
            </div>
            <div className="p-3 rounded-full bg-purple-500 text-white">
              <Filter className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by case title, client, or opponent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <Toggle
            pressed={viewMode === "cards"}
            onPressedChange={() => setViewMode("cards")}
            size="sm"
          >
            <Grid3X3 className="w-4 h-4" />
          </Toggle>
          <Toggle
            pressed={viewMode === "table"}
            onPressedChange={() => setViewMode("table")}
            size="sm"
          >
            <List className="w-4 h-4" />
          </Toggle>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading fees...</p>
        </div>
      ) : viewMode === "cards" ? (
        renderCards()
      ) : (
        renderTable()
      )}

      {filteredFees.length === 0 && !loading && (
        <div className="text-center py-12">
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No payment records found</p>
        </div>
      )}
    </div>
  );
};

interface FeeFormProps {
  feeToEdit?: Fee | null;
  cases: Case[];
  onSave: () => void;
  onCancel: () => void;
  lawyerId: string | undefined;
}

const FeeForm: React.FC<FeeFormProps> = ({
  feeToEdit,
  cases,
  onSave,
  onCancel,
  lawyerId,
}) => {
  const [caseId, setCaseId] = useState<string>(""); // Separate state for caseId as string
  const [formData, setFormData] = useState<Fee>({
    caseId: "",
    totalFee: 0,
    paidAmount: 0,
    pendingAmount: 0,
    status: "Pending",
    paymentMethod: "",
    transactionId: "",
    lastPayment: "",
    lawyerId: lawyerId ?? "",
  });

  useEffect(() => {
    if (feeToEdit) {
      const caseIdValue =
        typeof feeToEdit.caseId === "string"
          ? feeToEdit.caseId
          : feeToEdit.caseId?._id || "";
      setCaseId(caseIdValue);
      setFormData({
        ...feeToEdit,
        caseId: caseIdValue,
        lawyerId: lawyerId ?? feeToEdit.lawyerId,
      });
    } else if (lawyerId) {
      setFormData((prev) => ({ ...prev, lawyerId }));
      setCaseId("");
    }
  }, [feeToEdit, lawyerId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (name === "totalFee" || name === "paidAmount") {
        const total =
          name === "totalFee"
            ? parseFloat(value) || 0
            : parseFloat(prev.totalFee.toString()) || 0;
        const paid =
          name === "paidAmount"
            ? parseFloat(value) || 0
            : parseFloat(prev.paidAmount.toString()) || 0;
        newData.pendingAmount = Math.max(0, total - paid);
        newData.status =
          paid >= total ? "Completed" : paid > 0 ? "Partial" : "Pending";
        newData.lastPayment =
          paid > (prev.paidAmount || 0)
            ? new Date().toISOString().split("T")[0]
            : prev.lastPayment;
      }
      return newData;
    });
  };

  const handleCaseChange = (value: string) => {
    setCaseId(value);
    setFormData((prev) => ({
      ...prev,
      caseId: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lawyerId || !caseId) {
      toast.error("Lawyer ID and Case are required");
      return;
    }
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found");
      }
      const data = {
        ...formData,
        caseId: caseId,
        lastPayment:
          formData.paidAmount > 0
            ? new Date().toISOString().split("T")[0]
            : formData.lastPayment,
      };
      if (feeToEdit?._id) {
        await axios.put(`${API_URL}/api/fees/${feeToEdit._id}`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_URL}/api/fees`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      onSave();
      toast.success(feeToEdit ? "Fee updated" : "Fee added");
    } catch (error: any) {
      console.error("Error saving fee:", error.response?.data || error.message);
      toast.error(error.response?.data?.error || "Error saving fee");
    }
  };

  const selectedCase = cases.find((c) => c._id === caseId);

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4"
    >
      <div>
        <Label htmlFor="caseId">Select Case</Label>
        <Select
          name="caseId"
          value={caseId}
          onValueChange={handleCaseChange}
          required
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Choose a case" />
          </SelectTrigger>
          <SelectContent>
            {cases.map((case_) => (
              <SelectItem key={case_._id} value={case_._id!}>
                {case_.title} (#{case_.caseNumber})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="clientName">Client Name</Label>
        <Input
          id="clientName"
          value={selectedCase?.client.name || ""}
          disabled
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="opponentName">Opponent Name</Label>
        <Input
          id="opponentName"
          value={selectedCase?.opponentName || ""}
          disabled
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="totalFee">Total Fee (Rs)</Label>
        <Input
          id="totalFee"
          name="totalFee"
          type="number"
          value={formData.totalFee}
          onChange={handleChange}
          required
          className="mt-1"
          min="0"
        />
      </div>
      <div>
        <Label htmlFor="paidAmount">Fee Paid (Rs)</Label>
        <Input
          id="paidAmount"
          name="paidAmount"
          type="number"
          value={formData.paidAmount}
          onChange={handleChange}
          required
          className="mt-1"
          min="0"
        />
      </div>
      <div>
        <Label htmlFor="pendingAmount">Fee Pending (Rs)</Label>
        <Input
          id="pendingAmount"
          value={formData.pendingAmount}
          disabled
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="paymentMethod">Payment Method</Label>
        <Select
          name="paymentMethod"
          value={formData.paymentMethod || ""}
          onValueChange={(value) =>
            setFormData({ ...formData, paymentMethod: value })
          }
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select payment method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Cash">Cash</SelectItem>
            <SelectItem value="Online">Online (PayFast)</SelectItem>
            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
            <SelectItem value="Cheque">Cheque</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
        <Input
          id="transactionId"
          name="transactionId"
          value={formData.transactionId || ""}
          onChange={handleChange}
          className="mt-1"
        />
      </div>
      <div className="flex justify-end gap-2 md:col-span-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{feeToEdit ? "Update Fee" : "Add Fee"}</Button>
      </div>
    </form>
  );
};
