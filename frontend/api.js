// API Configuration
// Auto-detect API URL based on environment
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : '/api'; // Use relative path in production (Vercel)

// API Helper Functions
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    try {
        const response = await fetch(url, config);
        
        if (response.status === 204) {
            return null; // No content
        }

        const data = await response.json();
        
        if (!response.ok) {
            // Handle validation errors (422)
            if (response.status === 422 && data.detail) {
                const errorMessages = Array.isArray(data.detail) 
                    ? data.detail.map(err => `${err.loc?.join('.')}: ${err.msg}`).join(', ')
                    : data.detail;
                throw new Error(errorMessages || `Validation error: ${JSON.stringify(data.detail)}`);
            }
            throw new Error(data.detail || data.message || `HTTP error! status: ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error('API request failed:', error);
        if (error.message) {
            throw error;
        }
        throw new Error(error.toString());
    }
}

// Teams API
const teamsAPI = {
    getAll: () => apiRequest('/teams/'),
    getById: (id) => apiRequest(`/teams/${id}`),
    create: (team) => apiRequest('/teams/', {
        method: 'POST',
        body: team,
    }),
    update: (id, team) => apiRequest(`/teams/${id}`, {
        method: 'PUT',
        body: team,
    }),
    delete: (id) => apiRequest(`/teams/${id}`, {
        method: 'DELETE',
    }),
};

// Players API
const playersAPI = {
    getAll: (teamId = null) => {
        const endpoint = teamId ? `/players/?team_id=${teamId}` : '/players/';
        return apiRequest(endpoint);
    },
    getById: (id) => apiRequest(`/players/${id}`),
    create: (player) => apiRequest('/players/', {
        method: 'POST',
        body: player,
    }),
    update: (id, player) => apiRequest(`/players/${id}`, {
        method: 'PUT',
        body: player,
    }),
    delete: (id) => apiRequest(`/players/${id}`, {
        method: 'DELETE',
    }),
};

// Upload API
const uploadAPI = {
    uploadPlayerImage: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${API_BASE_URL}/uploads/player-image`, {
            method: 'POST',
            body: formData,
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || `HTTP error! status: ${response.status}`);
        }
        
        return response.json();
    },
};

// Opponents API
const opponentsAPI = {
    getAll: () => apiRequest('/opponents/'),
    getById: (id) => apiRequest(`/opponents/${id}`),
    create: (opponent) => apiRequest('/opponents/', {
        method: 'POST',
        body: opponent,
    }),
    update: (id, opponent) => apiRequest(`/opponents/${id}`, {
        method: 'PUT',
        body: opponent,
    }),
    delete: (id) => apiRequest(`/opponents/${id}`, {
        method: 'DELETE',
    }),
};

// Matches API
const matchesAPI = {
    getAll: (opponentId = null) => {
        const endpoint = opponentId ? `/matches/?opponent_id=${opponentId}` : '/matches/';
        return apiRequest(endpoint);
    },
    getById: (id) => apiRequest(`/matches/${id}`),
    create: (match) => apiRequest('/matches/', {
        method: 'POST',
        body: match,
    }),
    update: (id, match) => apiRequest(`/matches/${id}`, {
        method: 'PUT',
        body: match,
    }),
    updateResult: (id, result) => apiRequest(`/matches/${id}/result`, {
        method: 'PUT',
        body: result,
    }),
    delete: (id) => apiRequest(`/matches/${id}`, {
        method: 'DELETE',
    }),
    getStatistics: () => apiRequest('/matches/statistics/summary'),
    getOpponentStatistics: () => apiRequest('/matches/statistics/opponents'),
};

