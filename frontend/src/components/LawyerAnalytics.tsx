import React, { useState, useEffect } from "react";
import api from "../lib/api";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";
import {
    Download,
    TrendingUp,
    FolderOpen,
    AlertCircle,
    CheckCircle,
    RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Standard Recharts colors
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

interface AnalyticsData {
    overview: {
        totalCases: number;
        totalRevenue: number;
        pending: number;
        inProgress: number;
        closed: number;
        transferred: number;
    };
    byCourt: Array<{ name: string; value: number }>;
    byType: Array<{ name: string; value: number }>;
}

export const LawyerAnalytics = () => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const response = await api.get("/analytics/summary");
            setData(response.data);
        } catch (error: any) {
            if (error.response?.status === 401) {
                toast.error("Session expired.");
                navigate("/login");
            } else {
                toast.error("Failed to load analytics data.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [navigate]);

    const handleExportCSV = async () => {
        try {
            toast.info("Generating CSV file...");
            const res = await api.get("/analytics/export-csv", { responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "cases_export.csv");
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            toast.success("Cases exported successfully!");
        } catch (err) {
            toast.error("Failed to export case data.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] text-gray-500 flex-col gap-4">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                <p>Crunching your case data...</p>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 border-l-4 border-indigo-600 pl-3">
                        Reports & Analytics
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm font-medium">
                        High-level overview of your practice's performance and case distribution.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={fetchAnalytics} variant="outline" className="bg-white">
                        <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                    </Button>
                    <Button onClick={handleExportCSV} className="bg-green-600 hover:bg-green-700 text-white">
                        <Download className="w-4 h-4 mr-2" /> Export All (CSV)
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="p-5 flex items-center gap-4 bg-white hover:shadow-md transition">
                    <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                        <FolderOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Total Cases</p>
                        <p className="text-2xl font-bold text-gray-900">{data.overview.totalCases}</p>
                    </div>
                </Card>

                <Card className="p-5 flex items-center gap-4 bg-white hover:shadow-md transition">
                    <div className="bg-green-100 p-3 rounded-full text-green-600">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">In Progress</p>
                        <p className="text-2xl font-bold text-gray-900">{data.overview.inProgress}</p>
                    </div>
                </Card>

                <Card className="p-5 flex items-center gap-4 bg-white hover:shadow-md transition">
                    <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
                        <TrendingUp className="w-6 h-6 rotate-90" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Transferred</p>
                        <p className="text-2xl font-bold text-gray-900">{data.overview.transferred}</p>
                    </div>
                </Card>

                <Card className="p-5 flex items-center gap-4 bg-white hover:shadow-md transition">
                    <div className="bg-yellow-100 p-3 rounded-full text-yellow-600">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Pending Tasks</p>
                        <p className="text-2xl font-bold text-gray-900">{data.overview.pending}</p>
                    </div>
                </Card>

                <Card className="p-5 flex items-center gap-4 bg-white hover:shadow-md transition">
                    <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Closed</p>
                        <p className="text-2xl font-bold text-gray-900">{data.overview.closed}</p>
                    </div>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

                {/* Court Distribution */}
                <Card className="p-5 min-h-[400px] flex flex-col">
                    <h3 className="font-bold text-gray-800 text-lg mb-4">Court-wise Summary</h3>
                    <div className="flex-1 min-h-[300px] w-full">
                        {data.byCourt.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">No data available</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.byCourt} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" />
                                    <YAxis allowDecimals={false} />
                                    <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                                        {data.byCourt.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>

                {/* Case Type (Win/Loss/Topic Analytics) */}
                <Card className="p-5 min-h-[400px] flex flex-col">
                    <h3 className="font-bold text-gray-800 text-lg mb-4">Case Analytics Breakdown</h3>
                    <div className="flex-1 min-h-[300px] w-full">
                        {data.byType.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">No data available</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.byType}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {data.byType.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>
            </div>

        </div>
    );
};
