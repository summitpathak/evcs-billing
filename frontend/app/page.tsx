'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { startSession, endSession, getSessions, searchVehicles, getStationStats, getFilteredSessions } from '@/lib/api';
import { getUser, logout } from '@/lib/auth';

export default function Home() {
  const [activeView, setActiveView] = useState('sessions'); // sessions, analytics
  const [message, setMessage] = useState('');
  const router = useRouter();
  const [user, setUserState] = useState<any>(null);
  const [station, setStation] = useState('');

  // Statistics
  const [stats, setStats] = useState<any>({});
  const [period, setPeriod] = useState('all');

  // Filters
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Sessions
  const [filteredSessions, setFilteredSessions] = useState<any[]>([]);
  const [sessionsSummary, setSessionsSummary] = useState<any>({});
  const [ongoingSessions, setOngoingSessions] = useState<any[]>([]);

  // Forms
  const [startForm, setStartForm] = useState({
    vehicle_no: '',
    station_name: '',
    soc_start: '',
    vehicle_name: '',
    phone_no: '',
    battery_capacity: ''
  });

  const [endForm, setEndForm] = useState({
    session_id: '',
    soc_end: '',
    unit_kwh: '',
    price_paid: '',
    payment_method: 'Cash'
  });

  // Autocomplete for vehicle number
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Autocomplete for vehicle name/model
  const [modelSuggestions, setModelSuggestions] = useState<any[]>([]);
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);

  // Quick end session
  const [quickEndSessionId, setQuickEndSessionId] = useState('');

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (currentUser.role === 'Manager') {
      router.push('/dashboard');
      return;
    }
    setUserState(currentUser);

    const assignedStation = currentUser.role.startsWith('Operator-')
      ? currentUser.role.split('-')[1]
      : 'Nagdhunga';

    setStation(assignedStation);
    setStartForm(prev => ({ ...prev, station_name: assignedStation }));
    loadData(assignedStation, 'all');

    // Auto-refresh ongoing sessions every 10 seconds
    const interval = setInterval(() => loadOngoingSessions(assignedStation), 10000);
    return () => clearInterval(interval);
  }, [router]);

  const loadData = async (stationName: string, timePeriod: string) => {
    try {
      const statsData = await getStationStats(stationName, timePeriod);
      setStats(statsData);
      await loadOngoingSessions(stationName);
      await loadFilteredSessions(stationName, timePeriod);
    } catch (error) {
      console.error("Error loading data", error);
    }
  };

  const loadOngoingSessions = async (stationName: string) => {
    try {
      const ongoing = await getSessions({ station_name: stationName, status: 'IN PROGRESS' });
      setOngoingSessions(Array.isArray(ongoing) ? ongoing : []);
    } catch (error) {
      console.error("Error loading ongoing sessions", error);
      setOngoingSessions([]);
    }
  };

  const loadFilteredSessions = async (stationName: string, timePeriod: string) => {
    try {
      const filters: any = { station_name: stationName, period: timePeriod };
      if (vehicleFilter) filters.vehicle_no = vehicleFilter;
      if (paymentFilter !== 'all') filters.payment_method = paymentFilter;

      const data = await getFilteredSessions(filters);
      setFilteredSessions(Array.isArray(data.sessions) ? data.sessions : []);
      setSessionsSummary(data.summary || {});
    } catch (error) {
      console.error("Error loading filtered sessions", error);
      setFilteredSessions([]);
      setSessionsSummary({});
    }
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    loadData(station, newPeriod);
  };

  const handleFilterChange = () => {
    loadFilteredSessions(station, period);
  };

  const handleVehicleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStartForm({ ...startForm, vehicle_no: value });

    if (value.length > 1) {
      try {
        const results = await searchVehicles(value);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error searching vehicles", error);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectVehicle = (vehicle: any) => {
    setStartForm(prev => ({
      ...prev,
      vehicle_no: vehicle.vehicle_no,
      vehicle_name: vehicle.vehicle_name || '',
      phone_no: vehicle.phone_no || '',
      battery_capacity: vehicle.battery_capacity || ''
    }));
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleModelChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStartForm({ ...startForm, vehicle_name: value });

    if (value.length > 1) {
      try {
        console.log('Searching for:', value);
        const results = await searchVehicles(value);
        console.log('Search results:', results);
        setModelSuggestions(results);
        setShowModelSuggestions(true);
      } catch (error) {
        console.error("Error searching models", error);
      }
    } else {
      setModelSuggestions([]);
      setShowModelSuggestions(false);
    }
  };

  const selectModel = (vehicle: any) => {
    setStartForm(prev => ({
      ...prev,
      vehicle_name: vehicle.vehicle_name || '',
      battery_capacity: vehicle.battery_capacity || ''
    }));
    setModelSuggestions([]);
    setShowModelSuggestions(false);
  };

  const handleStartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await startSession(startForm);
      if (res.session_id) {
        setMessage(`✅ Session Started! ID: ${res.session_id}`);
        setStartForm({ vehicle_no: '', station_name: station, soc_start: '', vehicle_name: '', phone_no: '', battery_capacity: '' });
        loadData(station, period);
        setTimeout(() => setMessage(''), 5000);
      } else {
        setMessage(`❌ ${res.error || 'Error starting session'}`);
      }
    } catch (error) {
      setMessage('❌ Error starting session');
    }
  };

  const handleEndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await endSession(endForm);
      if (res.message === 'Session ended') {
        setMessage(`✅ Session Ended! Cost: Rs.${res.session.calculated_cost_rs}`);
        setEndForm({ session_id: '', soc_end: '', unit_kwh: '', price_paid: '', payment_method: 'Cash' });
        setQuickEndSessionId('');
        loadData(station, period);
        setTimeout(() => setMessage(''), 5000);
      } else {
        setMessage(`❌ ${res.error || 'Error ending session'}`);
      }
    } catch (error) {
      setMessage('❌ Error ending session');
    }
  };

  const quickEndSession = (sessionId: number) => {
    setQuickEndSessionId(sessionId.toString());
    setEndForm(prev => ({ ...prev, session_id: sessionId.toString() }));
    // Scroll to end form
    document.getElementById('end-session-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b-2 border-indigo-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-indigo-900">⚡ {station} Charging Station</h1>
              <p className="text-sm text-gray-600">Operator: {user.username}</p>
            </div>
            <button onClick={logout} className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition font-medium">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* View Toggle */}
        <div className="flex space-x-2 mb-6">
          <button
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition ${activeView === 'sessions' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            onClick={() => setActiveView('sessions')}
          >
            ⚡ Active Sessions
          </button>
          <button
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition ${activeView === 'analytics' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            onClick={() => setActiveView('analytics')}
          >
            📊 Analytics
          </button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg border-2 font-medium ${message.includes('✅') ? 'bg-green-50 border-green-500 text-green-800' : 'bg-red-50 border-red-500 text-red-800'
            }`}>
            {message}
          </div>
        )}

        {/* Sessions View */}
        {activeView === 'sessions' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Start Session */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border-2 border-green-500">
                <h2 className="text-2xl font-bold text-green-900 mb-4 flex items-center">
                  <span className="text-3xl mr-2">▶️</span> Start Charging Session
                </h2>
                <form onSubmit={handleStartSubmit} className="space-y-4">
                  <div className="relative">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Vehicle Number *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 text-lg font-semibold"
                      value={startForm.vehicle_no}
                      onChange={handleVehicleChange}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      placeholder="e.g., BA 1 PA 1234"
                      autoComplete="off"
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <ul className="absolute z-50 w-full bg-white border-2 border-green-300 rounded-lg shadow-xl mt-1 max-h-60 overflow-auto">
                        {suggestions.map(v => (
                          <li
                            key={v.vehicle_no}
                            className="px-4 py-3 hover:bg-green-50 cursor-pointer border-b last:border-b-0"
                            onMouseDown={(e) => { e.preventDefault(); selectVehicle(v); }}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-bold text-gray-900">{v.vehicle_no}</div>
                                <div className="text-sm text-gray-600">{v.vehicle_name}</div>
                                {v.phone_no && <div className="text-xs text-gray-500">📞 {v.phone_no}</div>}
                              </div>
                              {v.battery_capacity && (
                                <div className="text-sm font-semibold text-green-600">
                                  {v.battery_capacity} kWh
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Brand/Model</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                      value={startForm.vehicle_name}
                      onChange={handleModelChange}
                      onBlur={() => setTimeout(() => setShowModelSuggestions(false), 200)}
                      placeholder="e.g., MG ZS EV, Tesla Model 3"
                      autoComplete="off"
                    />
                    {showModelSuggestions && modelSuggestions.length > 0 && (
                      <ul className="absolute z-50 w-full bg-white border-2 border-green-300 rounded-lg shadow-xl mt-1 max-h-60 overflow-auto">
                        {modelSuggestions.map((v, idx) => (
                          <li
                            key={`${v.vehicle_no}-${idx}`}
                            className="px-4 py-3 hover:bg-green-50 cursor-pointer border-b last:border-b-0"
                            onMouseDown={(e) => { e.preventDefault(); selectModel(v); }}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-bold text-gray-900">{v.vehicle_name}</div>
                              </div>
                              {v.battery_capacity && (
                                <div className="text-sm font-semibold text-green-600 ml-2">
                                  {v.battery_capacity} kWh
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Battery (kWh)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                        value={startForm.battery_capacity}
                        onChange={e => setStartForm({ ...startForm, battery_capacity: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Start SOC (%) *</label>
                      <input
                        type="number"
                        required
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                        value={startForm.soc_start}
                        onChange={e => setStartForm({ ...startForm, soc_start: e.target.value })}
                        placeholder="e.g., 20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                      value={startForm.phone_no}
                      onChange={e => setStartForm({ ...startForm, phone_no: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>

                  <button type="submit" className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition font-bold text-lg shadow-lg">
                    ▶️ START CHARGING
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Active Sessions & End Session */}
            <div className="space-y-6">
              {/* Active Sessions */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-lg p-6 border-2 border-yellow-500">
                <h2 className="text-2xl font-bold text-yellow-900 mb-4 flex items-center justify-between">
                  <span className="flex items-center">
                    <span className="text-3xl mr-2">⚡</span> Active Sessions
                  </span>
                  <span className="text-lg bg-yellow-500 text-white px-3 py-1 rounded-full">{ongoingSessions.length}</span>
                </h2>

                {ongoingSessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-lg">No active charging sessions</p>
                    <p className="text-sm">Start a new session to begin</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {ongoingSessions.map(session => (
                      <div
                        key={session.session_id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition ${quickEndSessionId === session.session_id.toString()
                          ? 'bg-orange-100 border-orange-500 shadow-lg'
                          : 'bg-white border-yellow-300 hover:border-yellow-500 hover:shadow-md'
                          }`}
                        onClick={() => quickEndSession(session.session_id)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="text-xs font-semibold text-gray-500">SESSION ID</div>
                            <div className="text-2xl font-bold text-yellow-900">#{session.session_id}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-semibold text-gray-500">VEHICLE</div>
                            <div className="text-xl font-bold text-gray-900">{session.vehicle_no}</div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Started: {new Date(session.start_time).toLocaleTimeString()}</span>
                          <span className="px-3 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full animate-pulse">
                            CHARGING
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* End Session Form */}
              <div id="end-session-form" className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl shadow-lg p-6 border-2 border-red-500">
                <h2 className="text-2xl font-bold text-red-900 mb-4 flex items-center">
                  <span className="text-3xl mr-2">⏹️</span> End Charging Session
                </h2>
                <form onSubmit={handleEndSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Session ID *</label>
                    <input
                      type="number"
                      required
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-lg font-semibold"
                      value={endForm.session_id}
                      onChange={e => setEndForm({ ...endForm, session_id: e.target.value })}
                      placeholder="Click active session above"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">End SOC (%) *</label>
                      <input
                        type="number"
                        required
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                        value={endForm.soc_end}
                        onChange={e => setEndForm({ ...endForm, soc_end: e.target.value })}
                        placeholder="e.g., 80"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Energy (kWh) *</label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                        value={endForm.unit_kwh}
                        onChange={e => setEndForm({ ...endForm, unit_kwh: e.target.value })}
                        placeholder="e.g., 25.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Amount (Rs) *</label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                        value={endForm.price_paid}
                        onChange={e => setEndForm({ ...endForm, price_paid: e.target.value })}
                        placeholder="e.g., 500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Payment *</label>
                      <select
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                        value={endForm.payment_method}
                        onChange={e => setEndForm({ ...endForm, payment_method: e.target.value })}
                      >
                        <option value="Cash">💵 Cash</option>
                        <option value="QR">📱 QR</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" className="w-full py-4 px-6 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition font-bold text-lg shadow-lg">
                    ⏹️ END SESSION
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Analytics View */}
        {activeView === 'analytics' && (
          <div className="space-y-6">
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

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_sessions || 0}</p>
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
                    <p className="text-3xl font-bold text-green-600 mt-2">Rs. {stats.total_earnings || 0}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <span className="text-2xl">💰</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Energy Delivered</p>
                    <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.total_energy_kwh || 0} kWh</p>
                  </div>
                  <div className="bg-indigo-100 p-3 rounded-full">
                    <span className="text-2xl">🔋</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">{Math.round(stats.avg_session_duration_minutes || 0)} min</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <span className="text-2xl">⏱️</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Sessions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <h3 className="text-lg font-semibold text-gray-900">Charging Records</h3>
                <div className="text-sm text-gray-600">
                  {sessionsSummary.total_sessions || 0} sessions • Rs. {sessionsSummary.total_earnings || 0} • {sessionsSummary.total_energy_kwh || 0} kWh
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
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
          </div>
        )}
      </div>
    </div>
  );
}
