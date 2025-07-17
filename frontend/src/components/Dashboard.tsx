import React, { useState } from 'react';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  FolderOpen, 
  Calendar, 
  DollarSign, 
  Users, 
  Clock,
  TrendingUp,
  AlertCircle,
  Grid3X3,
  List
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Toggle } from '../components/ui/toggle';

export const Dashboard = () => {
  const [recentCasesView, setRecentCasesView] = useState<'cards' | 'table'>('cards');
  const [upcomingTasksView, setUpcomingTasksView] = useState<'cards' | 'table'>('cards');

  const stats = [
    {
      title: 'Total Cases',
      value: '24',
      icon: FolderOpen,
      color: 'bg-blue-500',
      change: '+3 this month'
    },
    {
      title: 'Upcoming Hearings',
      value: '8',
      icon: Calendar,
      color: 'bg-green-500',
      change: 'Next: Tomorrow'
    },
    {
      title: 'Total Revenue',
      value: 'Rs 450,000',
      icon: DollarSign,
      color: 'bg-yellow-500',
      change: '+15% this month'
    },
    {
      title: 'Active Clients',
      value: '18',
      icon: Users,
      color: 'bg-purple-500',
      change: '2 new this week'
    }
  ];

  const recentCases = [
    {
      id: 1,
      title: 'Property Dispute - Ahmed vs Khan',
      client: 'Ahmed Ali',
      court: 'District Court',
      status: 'In Progress',
      nextHearing: '2024-07-08'
    },
    {
      id: 2,
      title: 'Criminal Defense - State vs Shah',
      client: 'Imran Shah',
      court: 'Sessions Court',
      status: 'Pending',
      nextHearing: '2024-07-10'
    },
    {
      id: 3,
      title: 'Contract Dispute - Business Case',
      client: 'XYZ Corp',
      court: 'High Court',
      status: 'Closed',
      nextHearing: null
    }
  ];

  const upcomingTasks = [
    { task: 'Prepare arguments for Ahmed case', due: 'Today', priority: 'High' },
    { task: 'File appeal documents', due: 'Tomorrow', priority: 'Medium' },
    { task: 'Client meeting - Shah case', due: 'July 9', priority: 'High' },
    { task: 'Court fee payment', due: 'July 12', priority: 'Low' }
  ];

  const renderRecentCasesCards = () => (
    <div className="space-y-3 md:space-y-4">
      {recentCases.map((caseItem) => (
        <div key={caseItem.id} className="border-l-4 border-blue-500 pl-3 md:pl-4 py-2">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 text-sm md:text-base break-words">{caseItem.title}</h4>
              <p className="text-xs md:text-sm text-gray-600 truncate">Client: {caseItem.client}</p>
              <p className="text-xs md:text-sm text-gray-600 truncate">Court: {caseItem.court}</p>
            </div>
            <Badge 
              variant={caseItem.status === 'Closed' ? 'secondary' : 'default'}
              className={`text-xs self-start sm:self-auto flex-shrink-0 ${
                caseItem.status === 'In Progress' ? 'bg-green-100 text-green-800' :
                caseItem.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : ''
              }`}
            >
              {caseItem.status}
            </Badge>
          </div>
          {caseItem.nextHearing && (
            <div className="flex items-center gap-1 mt-2 text-xs md:text-sm text-gray-500">
              <Clock className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              <span className="truncate">Next hearing: {caseItem.nextHearing}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderRecentCasesTable = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Case Title</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Court</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Next Hearing</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recentCases.map((caseItem) => (
            <TableRow key={caseItem.id}>
              <TableCell className="font-medium text-sm break-words">{caseItem.title}</TableCell>
              <TableCell className="text-sm">{caseItem.client}</TableCell>
              <TableCell className="text-sm">{caseItem.court}</TableCell>
              <TableCell>
                <Badge 
                  variant={caseItem.status === 'Closed' ? 'secondary' : 'default'}
                  className={`text-xs ${
                    caseItem.status === 'In Progress' ? 'bg-green-100 text-green-800' :
                    caseItem.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : ''
                  }`}
                >
                  {caseItem.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">
                {caseItem.nextHearing ? (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    {caseItem.nextHearing}
                  </div>
                ) : (
                  '-'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const renderUpcomingTasksCards = () => (
    <div className="space-y-2 md:space-y-3">
      {upcomingTasks.map((task, index) => (
        <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gray-50 rounded-lg">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 text-sm md:text-base break-words">{task.task}</p>
            <p className="text-xs md:text-sm text-gray-600">Due: {task.due}</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge 
              variant={task.priority === 'High' ? 'destructive' : 
                      task.priority === 'Medium' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {task.priority}
            </Badge>
            {task.priority === 'High' && <AlertCircle className="w-3 h-3 md:w-4 md:h-4 text-red-500 flex-shrink-0" />}
          </div>
        </div>
      ))}
    </div>
  );

  const renderUpcomingTasksTable = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Priority</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {upcomingTasks.map((task, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium text-sm break-words">{task.task}</TableCell>
              <TableCell className="text-sm">{task.due}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={task.priority === 'High' ? 'destructive' : 
                            task.priority === 'Medium' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {task.priority}
                  </Badge>
                  {task.priority === 'High' && <AlertCircle className="w-3 h-3 text-red-500" />}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto">
      <div className="text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 text-sm md:text-base">Welcome back! Here's your practice overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-medium text-gray-600 truncate">{stat.title}</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 truncate">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1 truncate">{stat.change}</p>
              </div>
              <div className={`p-2 md:p-3 rounded-full ${stat.color} text-white flex-shrink-0 ml-2`}>
                <stat.icon className="w-4 h-4 md:w-6 md:h-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Cases */}
        <Card className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Recent Cases</h3>
              <Badge variant="secondary" className="self-start sm:self-auto">3 Active</Badge>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <Toggle
                pressed={recentCasesView === 'cards'}
                onPressedChange={() => setRecentCasesView('cards')}
                size="sm"
              >
                <Grid3X3 className="w-3 h-3" />
              </Toggle>
              <Toggle
                pressed={recentCasesView === 'table'}
                onPressedChange={() => setRecentCasesView('table')}
                size="sm"
              >
                <List className="w-3 h-3" />
              </Toggle>
            </div>
          </div>
          {recentCasesView === 'cards' ? renderRecentCasesCards() : renderRecentCasesTable()}
        </Card>

        {/* Upcoming Tasks */}
        <Card className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Upcoming Tasks</h3>
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0" />
            </div>
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <Toggle
                pressed={upcomingTasksView === 'cards'}
                onPressedChange={() => setUpcomingTasksView('cards')}
                size="sm"
              >
                <Grid3X3 className="w-3 h-3" />
              </Toggle>
              <Toggle
                pressed={upcomingTasksView === 'table'}
                onPressedChange={() => setUpcomingTasksView('table')}
                size="sm"
              >
                <List className="w-3 h-3" />
              </Toggle>
            </div>
          </div>
          {upcomingTasksView === 'cards' ? renderUpcomingTasksCards() : renderUpcomingTasksTable()}
        </Card>
      </div>
    </div>
  );
};
