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
import { Client, Case } from '../../../types/client'; // Adjust path as needed

export const LawyerClients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/cases');
        const cases: Case[] = res.data;
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

          // Update status
          if (['In Progress', 'Pending'].includes(c.status)) {
            existingClient.status = 'Active';
          }

          // Update joinDate (earliest createdAt)
          if (!existingClient.joinDate || (c.createdAt && c.createdAt < existingClient.joinDate)) {
            existingClient.joinDate = c.createdAt || 'N/A';
          }

          // Update totalCases
          existingClient.totalCases = cases.filter(cc => cc.client.name === c.client.name).length;

          // Update pendingPayment
          existingClient.pendingPayment += c.fee.pending || 0;

          // Update lastContact (latest updatedAt or createdAt)
          const lastContact = c.updatedAt || c.createdAt;
          if (!existingClient.lastContact || (lastContact && lastContact > existingClient.lastContact)) {
            existingClient.lastContact = lastContact || 'N/A';
          }

          // Update nextHearing (earliest among active cases)
          if (c.nextHearing && (!existingClient.nextHearing || c.nextHearing < existingClient.nextHearing)) {
            existingClient.nextHearing = c.nextHearing;
          }

          // Add case to cases array
          existingClient.cases.push(c);

          clientMap.set(c.client.name, existingClient);
        });

        const uniqueClients: Client[] = Array.from(clientMap.values());
        setClients(uniqueClients);
      } catch (err) {
        console.error('Error fetching clients:', err);
        alert('Failed to load clients. Check console for details.');
      }
    };
    fetchClients();
  }, []);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.caseType || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeClients = clients.filter(c => c.status === 'Active').length;
  const totalRevenue = clients.reduce((sum, c) => sum + (c.totalCases * 50000), 0);
  const pendingPayments = clients.reduce((sum, c) => sum + c.pendingPayment, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
        <p className="text-gray-600">Manage your client relationships and cases</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-500 text-white">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Clients</p>
              <p className="text-2xl font-bold text-gray-900">{activeClients}</p>
            </div>
            <div className="p-3 rounded-full bg-green-500 text-white">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">Rs {totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-full bg-yellow-500 text-white">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-900">Rs {pendingPayments.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-full bg-red-500 text-white">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

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
          {filteredClients.map((client) => (
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
                                  <span className="text-gray-600">Join Date:</span> {selectedClient.joinDate}
                                </div>
                                <div>
                                  <span className="text-gray-600">Total Cases:</span> {selectedClient.totalCases}
                                </div>
                                <div>
                                  <span className="text-gray-600">Last Contact:</span> {selectedClient.lastContact}
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
          ))}
        </div>
      </Card>
    </div>
  );
};