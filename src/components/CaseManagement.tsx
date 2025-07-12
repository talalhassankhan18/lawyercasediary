import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  FileText,
  Phone,
  Mail,
  MapPin,
  FolderOpen,
  Grid3X3,
  List,
  Upload,
  Paperclip
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Toggle } from '@/components/ui/toggle';

export const CaseManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  
  const cases = [
    {
      id: 1,
      title: 'Property Dispute - Ahmed vs Khan',
      caseNumber: 'CIV/2024/001',
      client: {
        name: 'Ahmed Ali',
        phone: '+92-300-1234567',
        email: 'ahmed.ali@email.com'
      },
      court: 'District Court Lahore',
      fee: {
        total: 50000,
        paid: 30000,
        pending: 20000,
        status: 'Partial'
      },
      status: 'In Progress',
      nextHearing: '2024-07-08',
      createdAt: '2024-06-01',
      documents: ['petition.pdf', 'evidence.jpg']
    },
    {
      id: 2,
      title: 'Criminal Defense - State vs Shah',
      caseNumber: 'CRIM/2024/002',
      client: {
        name: 'Imran Shah',
        phone: '+92-301-7654321',
        email: 'imran.shah@email.com'
      },
      court: 'Sessions Court Karachi',
      fee: {
        total: 75000,
        paid: 75000,
        pending: 0,
        status: 'Completed'
      },
      status: 'Pending',
      nextHearing: '2024-07-10',
      createdAt: '2024-05-15',
      documents: ['charge_sheet.pdf']
    }
  ];

  const [isAddCaseOpen, setIsAddCaseOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const filteredCases = cases.filter(case_ => {
    const matchesSearch = case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         case_.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         case_.caseNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || case_.status.toLowerCase() === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getFeeStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Partial': return 'bg-yellow-100 text-yellow-800';
      case 'Pending': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const renderCards = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
      {filteredCases.map((case_) => (
        <Card key={case_.id} className="p-4 md:p-6 hover:shadow-lg transition-shadow">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-lg font-semibold text-gray-900 break-words">{case_.title}</h3>
                <p className="text-xs md:text-sm text-gray-600">Case #{case_.caseNumber}</p>
              </div>
              <Badge className={`${getStatusColor(case_.status)} text-xs flex-shrink-0 ml-2`}>
                {case_.status}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs md:text-sm">
                <MapPin className="w-3 h-3 md:w-4 md:h-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">{case_.court}</span>
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm">
                <Calendar className="w-3 h-3 md:w-4 md:h-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">Next hearing: {case_.nextHearing}</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-2 text-sm md:text-base">Client Information</h4>
              <div className="space-y-1 text-xs md:text-sm">
                <p className="font-medium break-words">{case_.client.name}</p>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{case_.client.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{case_.client.email}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 text-sm md:text-base">Fee Information</h4>
                <Badge className={`${getFeeStatusColor(case_.fee.status)} text-xs`}>
                  {case_.fee.status}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs md:text-sm">
                <div>
                  <p className="text-gray-600">Total</p>
                  <p className="font-medium">Rs {case_.fee.total.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Paid</p>
                  <p className="font-medium text-green-600">Rs {case_.fee.paid.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Pending</p>
                  <p className="font-medium text-red-600">Rs {case_.fee.pending.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                <FileText className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                <span>{case_.documents.length} documents</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs">
                  <Upload className="w-3 h-3 mr-1" />
                  Upload
                </Button>
                <Button size="sm" className="text-xs">Edit</Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  const renderTable = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[200px]">Case Details</TableHead>
            <TableHead className="min-w-[150px]">Client</TableHead>
            <TableHead className="min-w-[120px]">Court</TableHead>
            <TableHead className="min-w-[100px]">Status</TableHead>
            <TableHead className="min-w-[120px]">Fee Status</TableHead>
            <TableHead className="min-w-[120px]">Next Hearing</TableHead>
            <TableHead className="min-w-[100px]">Documents</TableHead>
            <TableHead className="min-w-[150px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCases.map((case_) => (
            <TableRow key={case_.id}>
              <TableCell>
                <div>
                  <p className="font-medium text-sm break-words">{case_.title}</p>
                  <p className="text-xs text-gray-600">#{case_.caseNumber}</p>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <p className="font-medium text-sm break-words">{case_.client.name}</p>
                  <p className="text-xs text-gray-600 truncate">{case_.client.phone}</p>
                  <p className="text-xs text-gray-600 truncate">{case_.client.email}</p>
                </div>
              </TableCell>
              <TableCell>
                <p className="text-sm break-words">{case_.court}</p>
              </TableCell>
              <TableCell>
                <Badge className={`${getStatusColor(case_.status)} text-xs`}>
                  {case_.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Badge className={`${getFeeStatusColor(case_.fee.status)} text-xs`}>
                    {case_.fee.status}
                  </Badge>
                  <p className="text-xs text-gray-600">Rs {case_.fee.paid.toLocaleString()}/{case_.fee.total.toLocaleString()}</p>
                </div>
              </TableCell>
              <TableCell>
                <p className="text-sm">{case_.nextHearing}</p>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span>{case_.documents.length}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-xs">
                    <Upload className="w-3 h-3 mr-1" />
                    Upload
                  </Button>
                  <Button size="sm" className="text-xs">Edit</Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Case Management</h1>
          <p className="text-gray-600 text-sm md:text-base">Manage your legal cases and client information</p>
        </div>
        
        <Dialog open={isAddCaseOpen} onOpenChange={setIsAddCaseOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add New Case
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Case</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              
              <div className="space-y-2">
                <Label htmlFor="title">Case Title</Label>
                <Input id="title" placeholder="Enter case title" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="caseNumber">Case Number</Label>
                <Input id="caseNumber" placeholder="Enter case number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name</Label>
                <Input id="clientName" placeholder="Enter client name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientPhone">Client Phone</Label>
                <Input id="clientPhone" placeholder="+92-300-1234567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientEmail">Client Email</Label>
                <Input id="clientEmail" type="email" placeholder="client@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="court">Court</Label>
                <Input id="court" placeholder="Court name and location" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee">Total Fee (Rs)</Label>
                <Input id="fee" type="number" placeholder="50000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="documents">Case Documents</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="documents"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="flex-1"
                  />
                  <Paperclip className="w-4 h-4 text-gray-400" />
                </div>
                {selectedFiles && (
                  <p className="text-xs text-gray-600">
                    {selectedFiles.length} file(s) selected
                  </p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Case Notes</Label>
                <Textarea id="notes" placeholder="Enter case details and notes..." />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddCaseOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsAddCaseOpen(false)}>
                Add Case
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search, Filters and View Toggle */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search cases, clients, or case numbers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-4">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in progress">In Progress</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <Toggle
              pressed={viewMode === 'cards'}
              onPressedChange={() => setViewMode('cards')}
              size="sm"
            >
              <Grid3X3 className="w-4 h-4" />
            </Toggle>
            <Toggle
              pressed={viewMode === 'table'}
              onPressedChange={() => setViewMode('table')}
              size="sm"
            >
              <List className="w-4 h-4" />
            </Toggle>
          </div>
        </div>
      </div>

      {/* Cases Display */}
      {viewMode === 'cards' ? renderCards() : renderTable()}

      {filteredCases.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No cases found matching your criteria</p>
        </div>
      )}
    </div>
  );
};
