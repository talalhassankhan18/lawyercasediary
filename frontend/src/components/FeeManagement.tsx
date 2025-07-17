
import React, { useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Banknote,
  Plus,
  Download,
  Search,
  Filter
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

export const FeeManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);

  const feeStats = {
    totalRevenue: 450000,
    totalPending: 125000,
    totalReceived: 325000,
    monthlyGrowth: 15
  };

  const payments = [
    {
      id: 1,
      caseTitle: 'Property Dispute - Ahmed vs Khan',
      clientName: 'Ahmed Ali',
      caseNumber: 'CIV/2024/001',
      totalFee: 50000,
      paidAmount: 30000,
      pendingAmount: 20000,
      status: 'Partial',
      lastPayment: '2024-06-15',
      paymentMethod: 'Online',
      transactionId: 'TXN001234'
    },
    {
      id: 2,
      caseTitle: 'Criminal Defense - State vs Shah',
      clientName: 'Imran Shah',
      caseNumber: 'CRIM/2024/002',
      totalFee: 75000,
      paidAmount: 75000,
      pendingAmount: 0,
      status: 'Completed',
      lastPayment: '2024-06-20',
      paymentMethod: 'Cash',
      transactionId: null
    },
    {
      id: 3,
      caseTitle: 'Contract Dispute - Business Case',
      clientName: 'XYZ Corp',
      caseNumber: 'COM/2024/003',
      totalFee: 100000,
      paidAmount: 0,
      pendingAmount: 100000,
      status: 'Pending',
      lastPayment: null,
      paymentMethod: null,
      transactionId: null
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Partial': return 'bg-yellow-100 text-yellow-800';
      case 'Pending': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPayments = payments.filter(payment =>
    payment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.caseTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fee Management</h1>
          <p className="text-gray-600">Track payments and manage case fees</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
          <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Payment Record</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="case">Select Case</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a case" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="case1">Property Dispute - Ahmed vs Khan</SelectItem>
                      <SelectItem value="case2">Criminal Defense - State vs Shah</SelectItem>
                      <SelectItem value="case3">Contract Dispute - Business Case</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Payment Amount (Rs)</Label>
                  <Input id="amount" type="number" placeholder="Enter amount" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="method">Payment Method</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="online">Online (PayFast)</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="txnId">Transaction ID (Optional)</Label>
                  <Input id="txnId" placeholder="Enter transaction ID" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddPaymentOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddPaymentOpen(false)}>
                  Add Payment
                </Button>
              </div>
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
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +{feeStats.monthlyGrowth}% this month
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-500 text-white">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Amount Received</p>
              <p className="text-2xl font-bold text-gray-900">
                Rs {feeStats.totalReceived.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {((feeStats.totalReceived / feeStats.totalRevenue) * 100).toFixed(1)}% of total
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
              <p className="text-sm font-medium text-gray-600">Pending Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                Rs {feeStats.totalPending.toLocaleString()}
              </p>
              <p className="text-xs text-red-600 mt-1">
                {((feeStats.totalPending / feeStats.totalRevenue) * 100).toFixed(1)}% pending
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
              <p className="text-sm font-medium text-gray-600">Cases with Fees</p>
              <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
              <p className="text-xs text-gray-500 mt-1">Active fee tracking</p>
            </div>
            <div className="p-3 rounded-full bg-purple-500 text-white">
              <Filter className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search by client name, case number, or case title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Payments Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Case Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fee Breakdown
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {payment.caseTitle}
                      </div>
                      <div className="text-sm text-gray-500">
                        Case #{payment.caseNumber}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {payment.clientName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>Total: Rs {payment.totalFee.toLocaleString()}</div>
                      <div className="text-green-600">Paid: Rs {payment.paidAmount.toLocaleString()}</div>
                      <div className="text-red-600">Pending: Rs {payment.pendingAmount.toLocaleString()}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {payment.lastPayment ? (
                      <div className="text-sm text-gray-900">
                        <div>{payment.lastPayment}</div>
                        <div className="text-gray-500">
                          {payment.paymentMethod}
                          {payment.transactionId && ` - ${payment.transactionId}`}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No payments yet</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      {payment.pendingAmount > 0 && (
                        <Button size="sm">
                          Add Payment
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredPayments.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No payment records found</p>
        </div>
      )}
    </div>
  );
};
