import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
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
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Toggle } from '../components/ui/toggle';
import axios from 'axios';
import { Case } from '../../../types/case'; // Adjust path if types/ is elsewhere
import { toast } from 'sonner';

export const CaseManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [cases, setCases] = useState<Case[]>([]);
  const [isAddCaseOpen, setIsAddCaseOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [caseToEdit, setCaseToEdit] = useState<Case | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/cases');
      setCases(res.data);
    } catch (err) {
      toast.error('Error fetching cases');
      console.error('Error fetching cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

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
    const files = event.target.files;
    console.log('Selected files:', files); // Debug log
    setSelectedFiles(files);
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:5000/api/cases/${id}`);
      setCases(cases.filter(case_ => case_._id !== id));
      toast.success('Case deleted');
    } catch (err) {
      toast.error('Error deleting case');
      console.error('Error deleting case:', err);
    }
  };

  const handleEdit = (case_: Case) => {
    setCaseToEdit(case_);
    setIsAddCaseOpen(true);
  };

  const handleSave = () => {
    setIsAddCaseOpen(false);
    setCaseToEdit(null);
    setSelectedFiles(null);
    fetchCases();
  };

  const renderCards = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
      {filteredCases.map((case_) => (
        <Card key={case_._id} className="p-4 md:p-6 hover:shadow-lg transition-shadow">
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
            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
              <MapPin className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              <span className="break-words">{case_.court || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
              <Calendar className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              <span>{case_.nextHearing || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
              <DollarSign className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              <span>Total: ${case_.fee.total} | Paid: ${case_.fee.paid} | Pending: ${case_.fee.pending}</span>
              <Badge className={`${getFeeStatusColor(case_.fee.status)} text-xs ml-2`}>
                {case_.fee.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
              <Phone className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              <span>{case_.client.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
              <Mail className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              <span>{case_.client.email || 'N/A'}</span>
            </div>
            <div className="text-xs md:text-sm text-gray-600 break-words">
              <Paperclip className="w-3 h-3 md:w-4 md:h-4 inline-block mr-1" />
              <span>Notes: {case_.notes || 'No notes'}</span>
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                <FileText className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                <span>{case_.documents?.length || 0} documents</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs" onClick={() => {
                  setCaseToEdit(case_);
                  setIsAddCaseOpen(true);
                }}>
                  <Upload className="w-3 h-3 mr-1" />
                  Upload
                </Button>
                <Button size="sm" className="text-xs" onClick={() => handleEdit(case_)}>
                  Edit
                </Button>
                <Button variant="destructive" size="sm" className="text-xs" onClick={() => handleDelete(case_._id!)}>
                  Delete
                </Button>
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
            <TableHead className="min-w-[80px]">Serial Number</TableHead>
            <TableHead className="min-w-[200px]">Case Title</TableHead>
            <TableHead className="min-w-[150px]">Court</TableHead>
            <TableHead className="min-w-[200px]">Proceeding</TableHead>
            <TableHead className="min-w-[120px]">Next Hearing</TableHead>
            <TableHead className="min-w-[100px]">Other</TableHead>
            <TableHead className="min-w-[150px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCases.map((case_, index) => (
            <TableRow key={case_._id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-sm break-words">{case_.title}</p>
                  <p className="text-xs text-gray-600">#{case_.caseNumber}</p>
                </div>
              </TableCell>
              <TableCell>
                <p className="text-sm break-words">{case_.court}</p>
              </TableCell>
              <TableCell>
                <p className="text-sm truncate max-w-[200px]">{case_.notes || 'No notes'}</p>
              </TableCell>
              <TableCell>
                <p className="text-sm">{case_.nextHearing || 'N/A'}</p>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span>{case_.documents?.length || 0} documents</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => {
                    setCaseToEdit(case_);
                    setIsAddCaseOpen(true);
                  }}>
                    <Upload className="w-3 h-3 mr-1" />
                    Upload
                  </Button>
                  <Button size="sm" className="text-xs" onClick={() => handleEdit(case_)}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" className="text-xs" onClick={() => handleDelete(case_._id!)}>
                    Delete
                  </Button>
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
        <Dialog open={isAddCaseOpen} onOpenChange={(open) => {
          setIsAddCaseOpen(open);
          if (!open) setCaseToEdit(null);
          console.log('Dialog open state:', open); // Debug log
        }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {caseToEdit ? 'Edit Case' : 'Add New Case'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{caseToEdit ? 'Edit Case' : 'Add New Case'}</DialogTitle>
            </DialogHeader>
            <CaseForm caseToEdit={caseToEdit} onSave={handleSave} onCancel={() => setIsAddCaseOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

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

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading cases...</p>
        </div>
      ) : viewMode === 'cards' ? renderCards() : renderTable()}

      {filteredCases.length === 0 && !loading && (
        <div className="text-center py-12">
          <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No cases found matching your criteria</p>
        </div>
      )}
    </div>
  );
};

interface CaseFormProps {
  caseToEdit?: Case | null;
  onSave: () => void;
  onCancel: () => void; // Added to close the dialog
}

const CaseForm: React.FC<CaseFormProps> = ({ caseToEdit, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Case>({
    title: '',
    caseNumber: '',
    client: { name: '', phone: '', email: '' },
    court: '',
    fee: { total: 0, paid: 0, pending: 0, status: 'Pending' },
    status: 'Pending',
    nextHearing: '',
    documents: [],
    notes: '',
  });
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  useEffect(() => {
    if (caseToEdit) {
      setFormData(caseToEdit);
    }
  }, [caseToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.includes('client.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        client: { ...formData.client, [field]: value },
      });
    } else if (name.includes('fee.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        fee: { ...formData.fee, [field]: field === 'status' ? value : Number(value) },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    console.log('Selected files:', files); // Debug log
    setSelectedFiles(files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting form data:', formData); // Debug log
    try {
      const data = { ...formData };
      let caseId: string;
      if (caseToEdit?._id) {
        await axios.put(`http://localhost:5000/api/cases/${caseToEdit._id}`, data);
        caseId = caseToEdit._id;
      } else {
        const response = await axios.post('http://localhost:5000/api/cases', data);
        caseId = response.data._id;
      }
      if (selectedFiles && selectedFiles.length > 0) {
        const formDataToSend = new FormData();
        Array.from(selectedFiles).forEach(file => formDataToSend.append('documents', file));
        console.log('Uploading files:', Array.from(selectedFiles).map(f => f.name)); // Debug log
        await axios.post(`http://localhost:5000/api/cases/${caseId}/documents`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      onSave();
      toast.success(caseToEdit ? 'Case updated' : 'Case added');
    } catch (error) {
      console.error('Error saving case:', error.response?.data || error.message); // Detailed error log
      toast.error('Error saving case: ' + (error.response?.data?.error || error.message));
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
        />
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
        />
      </div>
      <div>
        <Label htmlFor="client.phone">Client Phone</Label>
        <Input
          id="client.phone"
          name="client.phone"
          value={formData.client.phone || ''}
          onChange={handleChange}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="client.email">Client Email</Label>
        <Input
          id="client.email"
          name="client.email"
          value={formData.client.email || ''}
          onChange={handleChange}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="court">Court</Label>
        <Input
          id="court"
          name="court"
          value={formData.court || ''}
          onChange={handleChange}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="fee.total">Fee Total</Label>
        <Input
          id="fee.total"
          name="fee.total"
          type="number"
          value={formData.fee.total}
          onChange={handleChange}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="fee.paid">Fee Paid</Label>
        <Input
          id="fee.paid"
          name="fee.paid"
          type="number"
          value={formData.fee.paid}
          onChange={handleChange}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="fee.status">Fee Status</Label>
        <Select name="fee.status" value={formData.fee.status} onValueChange={(value) => handleChange({ target: { name: 'fee.status', value } } as any)}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Partial">Partial</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="status">Case Status</Label>
        <Select name="status" value={formData.status} onValueChange={(value) => handleChange({ target: { name: 'status', value } } as any)}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="nextHearing">Next Hearing</Label>
        <Input
          id="nextHearing"
          name="nextHearing"
          type="date"
          value={formData.nextHearing || ''}
          onChange={handleChange}
          className="mt-1"
        />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          className="mt-1"
        />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="documents">Upload Documents</Label>
        <Input
          id="documents"
          type="file"
          multiple
          onChange={handleFileUpload}
          className="mt-1"
        />
      </div>
      <div className="flex justify-end gap-2 md:col-span-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {caseToEdit ? 'Update Case' : 'Add Case'}
        </Button>
      </div>
    </form>
  );
};