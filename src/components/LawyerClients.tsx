
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  DollarSign,
  FileText,
  Plus,
  Eye
} from 'lucide-react';

export const LawyerClients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);

  const clients = [
    {
      id: 1,
      name: 'Ahmed Ali',
      email: 'ahmed.ali@email.com',
      phone: '+92 300 1234567',
      address: 'House 123, Sector F-8, Islamabad',
      caseType: 'Property Dispute',
      status: 'Active',
      joinDate: '2024-01-15',
      totalCases: 2,
      pendingPayment: 25000,
      lastContact: '2024-07-05',
      nextHearing: '2024-07-08'
    },
    {
      id: 2,
      name: 'Fatima Khan',
      email: 'fatima.khan@email.com',
      phone: '+92 301 2345678',
      address: 'Flat 45, Gulberg, Lahore',
      caseType: 'Family Law',
      status: 'Active',
      joinDate: '2024-02-20',
      totalCases: 1,
      pendingPayment: 0,
      lastContact: '2024-07-03',
      nextHearing: '2024-07-12'
    },
    {
      id: 3,
      name: 'Imran Shah',
      email: 'imran.shah@email.com',
      phone: '+92 302 3456789',
      address: 'House 67, Model Town, Karachi',
      caseType: 'Criminal Defense',
      status: 'Active',
      joinDate: '2024-03-10',
      totalCases: 1,
      pendingPayment: 15000,
      lastContact: '2024-07-04',
      nextHearing: '2024-07-10'
    },
    {
      id: 4,
      name: 'Sara Ahmed',
      email: 'sara.ahmed@email.com',
      phone: '+92 303 4567890',
      address: 'Apartment 12, DHA, Rawalpindi',
      caseType: 'Corporate Law',
      status: 'Completed',
      joinDate: '2023-11-05',
      totalCases: 3,
      pendingPayment: 0,
      lastContact: '2024-06-15',
      nextHearing: null
    }
  ];

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.caseType.toLowerCase().includes(searchTerm.toLowerCase())
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

      {/* Search and Actions */}
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
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Clients List */}
      <Card className="p-6">
        <div className="space-y-4">
          {filteredClients.map((client) => (
            <div key={client.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
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
