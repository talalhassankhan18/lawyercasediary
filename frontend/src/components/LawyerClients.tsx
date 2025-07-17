import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  DollarSign,
  FileText,
  Eye
} from 'lucide-react';
import axios from 'axios';
import { Client } from '../../../types/client';
import { Case } from '../../../types/case';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Use VITE_API_URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const LawyerClients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [lawyerId, setLawyerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch lawyer ID
  useEffect(() => {
    const fetchLawyerData = async () => {
      const token = localStorage.getItem("authToken");
      console.log('Auth Token from localStorage:', token); // Debug log
      if (!token) {
        console.log('No auth token found, redirecting to login');
        navigate("/login");
        return;
      }
      try {
        const response = await axios.get(`${API_URL}/lawyers/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Full lawyer data response:', response.data); // Debug full response
        const data = response.data;
        let id: string | undefined;
        if (data.user && data.user.id) {
          id = data.user.id;
        } else if (data._id) {
          id = data._id;
        } else if (data.id) {
          id = data.id;
        } else {
          throw new Error("Lawyer ID not found in response");
        }
        if (id) {
          setLawyerId(id);
        } else {
          throw new Error("Lawyer ID not found in response");
        }
      } catch (error: any) {
        console.error("Failed to fetch lawyer data:", error.response?.data || error.message);
        toast.error("Failed to authenticate. Please log in again.");
        navigate("/login");
      }
    };
    fetchLawyerData();
  }, [navigate]);

  // Fetch cases and aggregate clients
  useEffect(() => {
    const fetchClients = async () => {
      if (!lawyerId) return;
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/api/cases?lawyerId=${lawyerId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken") || ""}` },
        });
        const cases: Case[] = response.data;
        const clientMap = new Map<string, Client>();
        cases.forEach(c => {
          const existingClient = clientMap.get(c.client.name) || {
            name: c.client.name,
            email: c.client.email || 'N/A',
            phone: c.client.phone || 'N/A',
            address: c.court || 'N/A',
            caseType: c.title,
            status: 'Completed',
            joinDate: undefined,
            totalCases: 0,
            pendingPayment: 0,
            lastContact: undefined,
            nextHearing: undefined,
            cases: [],
          };

          if (['In Progress', 'Pending'].includes(c.status)) {
            existingClient.status = 'Active';
          }

          if (!existingClient.joinDate || (c.caseNumber && c.caseNumber < (existingClient.joinDate || ''))) {
            existingClient.joinDate = c.caseNumber;
          }

          existingClient.totalCases = cases.filter(cc => cc.client.name === c.client.name).length;
          existingClient.pendingPayment += c.fee.pending || 0;

          if (c.nextHearing && (!existingClient.lastContact || c.nextHearing > existingClient.lastContact)) {
            existingClient.lastContact = c.nextHearing;
          }

          if (c.nextHearing && (!existingClient.nextHearing || c.nextHearing < existingClient.nextHearing)) {
            existingClient.nextHearing = c.nextHearing;
          }

          existingClient.cases.push(c);
          clientMap.set(c.client.name, existingClient);
        });

        setClients(Array.from(clientMap.values()));
      } catch (err) {
        console.error('Error fetching clients:', err);
        toast.error('Failed to load clients');
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, [lawyerId]);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.caseType || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
        <p className="text-gray-600">Manage your client relationships and cases</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading clients...</p>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
          </div>

          {/* Clients List */}
          <Card className="p-6">
            <div className="space-y-4">
              {filteredClients.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No clients found matching your criteria</p>
                </div>
              ) : (
                filteredClients.map((client) => (
                  <div key={client.name} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-blue-500 text-white">
                            {client.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-gray-900">{client.name}</h3>
                          <p className="text-sm text-gray-600">{client.caseType}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {client.phone}
                            </div>
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {client.email}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Badge 
                            variant={client.status === 'Active' ? 'default' : 'secondary'}
                            className="mb-1"
                          >
                            {client.status}
                          </Badge>
                          <p className="text-xs text-gray-500">
                            {client.totalCases} case{client.totalCases !== 1 ? 's' : ''}
                          </p>
                          {client.pendingPayment > 0 && (
                            <p className="text-xs text-red-600">
                              Pending: Rs {client.pendingPayment.toLocaleString()}
                            </p>
                          )}
                          {client.nextHearing && (
                            <p className="text-xs text-blue-600">
                              Next: {client.nextHearing}
                            </p>
                          )}
                        </div>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedClient(client)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Client Details</DialogTitle>
                            </DialogHeader>
                            {selectedClient && (
                              <div className="space-y-6">
                                <div className="flex items-center space-x-4">
                                  <Avatar className="h-16 w-16">
                                    <AvatarFallback className="bg-blue-500 text-white text-lg">
                                      {selectedClient.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h2 className="text-xl font-semibold">{selectedClient.name}</h2>
                                    <p className="text-gray-600">{selectedClient.caseType}</p>
                                    <Badge variant={selectedClient.status === 'Active' ? 'default' : 'secondary'}>
                                      {selectedClient.status}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-6">
                                  <div>
                                    <h3 className="font-semibold mb-3">Contact Information</h3>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        {selectedClient.phone}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        {selectedClient.email}
                                      </div>
                                      <div className="flex items-start gap-2">
                                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                        {selectedClient.address}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h3 className="font-semibold mb-3">Case Information</h3>
                                    <div className="space-y-2 text-sm">
                                      <div>
                                        <span className="text-gray-600">Join Date:</span> {selectedClient.joinDate || 'N/A'}
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Total Cases:</span> {selectedClient.totalCases}
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Last Contact:</span> {selectedClient.lastContact || 'N/A'}
                                      </div>
                                      {selectedClient.nextHearing && (
                                        <div>
                                          <span className="text-gray-600">Next Hearing:</span> {selectedClient.nextHearing}
                                        </div>
                                      )}
                                      {selectedClient.pendingPayment > 0 && (
                                        <div className="text-red-600">
                                          <span className="text-gray-600">Pending Payment:</span> Rs {selectedClient.pendingPayment.toLocaleString()}
                                        </div>
                                      )}
                                      <h4 className="font-semibold mt-3">Cases</h4>
                                      {selectedClient.cases.map((case_, index) => (
                                        <div key={index} className="text-sm">
                                          <p><span className="text-gray-600">Title:</span> {case_.title}</p>
                                          <p><span className="text-gray-600">Case Number:</span> {case_.caseNumber}</p>
                                          <p><span className="text-gray-600">Status:</span> {case_.status}</p>
                                          {case_.nextHearing && <p><span className="text-gray-600">Next Hearing:</span> {case_.nextHearing}</p>}
                                          <p><span className="text-gray-600">Pending Fee:</span> Rs {case_.fee.pending.toLocaleString()}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};