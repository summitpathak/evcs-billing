import { getToken } from './auth';

const API_BASE_URL = 'http://localhost:5001/api';

const getHeaders = () => {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

export async function loginUser(credentials: any) {
    const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });
    return response.json();
}

export async function startSession(data: any) {
    const response = await fetch(`${API_BASE_URL}/sessions/start`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    return response.json();
}

export async function endSession(data: any) {
    const response = await fetch(`${API_BASE_URL}/sessions/end`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    return response.json();
}

export async function getVehicleHistory(vehicleNo: string) {
    const response = await fetch(`${API_BASE_URL}/vehicles/${vehicleNo}/history`, {
        headers: getHeaders()
    });
    return response.json();
}

export async function getAggregates() {
    const response = await fetch(`${API_BASE_URL}/reports/aggregates`, {
        headers: getHeaders()
    });
    return response.json();
}

export async function getVehicle(vehicleNo: string) {
    const response = await fetch(`${API_BASE_URL}/vehicles/${vehicleNo}`, {
        headers: getHeaders()
    });
    if (response.status === 404) return null;
    return response.json();
}

export async function getSessions(params: any) {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/sessions?${query}`, {
        headers: getHeaders()
    });
    return response.json();
}

export async function searchVehicles(query: string) {
    const response = await fetch(`${API_BASE_URL}/vehicles/search?query=${query}`, {
        headers: getHeaders()
    });
    return response.json();
}

export async function getStationStats(stationName: string, period: string = 'all') {
    const response = await fetch(`${API_BASE_URL}/stats/station/${stationName}?period=${period}`, {
        headers: getHeaders()
    });
    return response.json();
}

export async function getFilteredSessions(filters: any) {
    const query = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE_URL}/sessions/filtered?${query}`, {
        headers: getHeaders()
    });
    return response.json();
}
