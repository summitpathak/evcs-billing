'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStationStats, getFilteredSessions, getVehicleHistory } from '@/lib/api';
import { getUser, logout } from '@/lib/auth';

export default function Dashboard() {
    const router = useRouter();
    const [user, setUserState] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Statistics
    const [nagdhungaStats, setNagdhungaStats] = useState<any>({});
    const [jamuneStats, setJamuneStats] = useState<any>({});
    const [period, setPeriod] = useState('all');

    // Filters
    const [selectedStation, setSelectedStation] = useState('all');
    const [vehicleFilter, setVehicleFilter] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('all');

    // Sessions
    const [filteredSessions, setFilteredSessions] = useState<any[]>([]);
    const [sessionsSummary, setSessionsSummary] = useState<any>({});

    // Vehicle Search
    const [searchVehicle, setSearchVehicle] = useState('');
    const [vehicleHistory, setVehicleHistory] = useState<any[]>([]);

    useEffect(() => {
        const currentUser = getUser();
        if (!currentUser) {
            router.push('/login');
            return;
        }
        if (currentUser.role !== 'Manager') {
            router.push('/');
            return;
        }
        setUserState(currentUser);
        loadData('all');
    }, [router]);

    const loadData = async (timePeriod: string) => {
        try {
            setLoading(true);
            // Load stats for both stations
            const nagStats = await getStationStats('Nagdhunga', timePeriod);
            const jamStats = await getStationStats('Jamune', timePeriod);
            setNagdhungaStats(nagStats);
            setJamuneStats(jamStats);

            // Load filtered sessions
            await loadFilteredSessions(timePeriod);
        } catch (error) {
            console.error("Error loading data", error);
        } finally {
            setLoading(false);
        }
    };

    const loadFilteredSessions = async (timePeriod: string) => {
        try {
            const filters: any = { period: timePeriod };
            if (selectedStation !== 'all') filters.station_name = selectedStation;
            if (vehicleFilter) filters.vehicle_no = vehicleFilter;
            if (paymentFilter !== 'all') filters.payment_method = paymentFilter;

            const data = await getFilteredSessions(filters);
            setFilteredSessions(data.sessions || []);
            setSessionsSummary(data.summary || {});
        } catch (error) {
            console.error("Error loading filtered sessions", error);
        }
    };

    const handlePeriodChange = (newPeriod: string) => {
        setPeriod(newPeriod);
        loadData(newPeriod);
    };

    const handleFilterChange = () => {
        loadFilteredSessions(period);
    };

    const handleVehicleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchVehicle) return;
        try {
            const data = await getVehicleHistory(searchVehicle);
            setVehicleHistory(data);
        } catch (error) {
            console.error("Error searching vehicle", error);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-xl text-gray-600">Loading...</div>
        </div>
    );

    const totalStats = {
        total_sessions: (nagdhungaStats.total_sessions || 0) + (jamuneStats.total_sessions || 0),
        total_earnings: (nagdhungaStats.total_earnings || 0) + (jamuneStats.total_earnings || 0),
        total_energy_kwh: (nagdhungaStats.total_energy_kwh || 0) + (jamuneStats.total_energy_kwh || 0),
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
                            <p className="text-sm text-gray-600">All Stations • {user?.username}</p>
                        </div>
                        <button onClick={logout} className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition">
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Period Selector */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">Time Period:</span>
                        {['day', 'week', 'month', 'year', 'all'].map(p => (
                            <button
                                key={p}
                                onClick={() => handlePeriodChange(p)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition ${period === p ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {p === 'day' ? 'Today' : p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : p === 'year' ? 'This Year' : 'All Time'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Overall Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{totalStats.total_sessions}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-full">
                                <span className="text-2xl">⚡</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                                <p className="text-3xl font-bold text-green-600 mt-2">Rs. {totalStats.total_earnings.toFixed(2)}</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-full">
                                <span className="text-2xl">💰</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Energy</p>
                                <p className="text-3xl font-bold text-indigo-600 mt-2">{totalStats.total_energy_kwh.toFixed(2)} kWh</p>
                            </div>
                            <div className="bg-indigo-100 p-3 rounded-full">
                                <span className="text-2xl">🔋</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Station Comparison */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Station Comparison</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nagdhunga */}
                        <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
                            <h4 className="text-xl font-bold text-blue-900 mb-4">📍 Nagdhunga Station</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700">Sessions:</span>
                                    <span className="font-bold text-gray-900">{nagdhungaStats.total_sessions || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700">Earnings:</span>
                                    <span className="font-bold text-green-600">Rs. {(nagdhungaStats.total_earnings || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700">Energy:</span>
                                    <span className="font-bold text-indigo-600">{(nagdhungaStats.total_energy_kwh || 0).toFixed(2)} kWh</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700">Avg Duration:</span>
                                    <span className="font-bold text-purple-600">{Math.round(nagdhungaStats.avg_session_duration_minutes || 0)} min</span>
                                </div>
                            </div>
                        </div>

                        {/* Jamune */}
                        <div className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
                            <h4 className="text-xl font-bold text-green-900 mb-4">📍 Jamune Station</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700">Sessions:</span>
                                    <span className="font-bold text-gray-900">{jamuneStats.total_sessions || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700">Earnings:</span>
                                    <span className="font-bold text-green-600">Rs. {(jamuneStats.total_earnings || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700">Energy:</span>
                                    <span className="font-bold text-indigo-600">{(jamuneStats.total_energy_kwh || 0).toFixed(2)} kWh</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700">Avg Duration:</span>
                                    <span className="font-bold text-purple-600">{Math.round(jamuneStats.avg_session_duration_minutes || 0)} min</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Sessions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Station</label>
                            <select
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                value={selectedStation}
                                onChange={(e) => setSelectedStation(e.target.value)}
                            >
                                <option value="all">All Stations</option>
                                <option value="Nagdhunga">Nagdhunga</option>
                                <option value="Jamune">Jamune</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Number</label>
                            <input
                                type="text"
                                placeholder="Search by vehicle..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                value={vehicleFilter}
                                onChange={(e) => setVehicleFilter(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                            <select
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                value={paymentFilter}
                                onChange={(e) => setPaymentFilter(e.target.value)}
                            >
                                <option value="all">All Methods</option>
                                <option value="Cash">Cash</option>
                                <option value="QR">QR</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={handleFilterChange}
                                className="w-full px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sessions Table */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">All Charging Records</h3>
                        <div className="text-sm text-gray-600">
                            {sessionsSummary.total_sessions || 0} sessions • Rs. {(sessionsSummary.total_earnings || 0).toFixed(2)} • {(sessionsSummary.total_energy_kwh || 0).toFixed(2)} kWh
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Station</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Energy</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredSessions.map(session => (
                                    <tr key={session.session_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{session.session_id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.station_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.vehicle_no}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(session.end_time).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.unit_kwh} kWh</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${session.payment_method === 'Cash' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {session.payment_method}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">Rs. {session.price_paid}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredSessions.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                No sessions found for the selected filters.
                            </div>
                        )}
                    </div>
                </div>

                {/* Vehicle Track Record */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Track Record</h3>
                    <form onSubmit={handleVehicleSearch} className="flex gap-4 mb-6">
                        <input
                            type="text"
                            placeholder="Enter Vehicle No"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            value={searchVehicle}
                            onChange={e => setSearchVehicle(e.target.value)}
                        />
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium">
                            Search
                        </button>
                    </form>

                    {vehicleHistory.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Station</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Units (kWh)</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost (Rs)</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {vehicleHistory.map((session) => (
                                        <tr key={session.session_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(session.start_time).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.station_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.unit_kwh}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">Rs. {session.calculated_cost_rs}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${session.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {session.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
