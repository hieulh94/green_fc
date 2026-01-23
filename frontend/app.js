// Global state
let teams = [];
let players = [];
let opponents = [];
let matches = [];
let editingTeamId = null;
let editingPlayerId = null;
let editingOpponentId = null;
let editingMatchId = null;
let editingMatchResultId = null;
let statsChart = null;
let goalsBubbleChart = null; // Bubble chart for goal statistics
let openOpponentModalCallback = null; // Callback khi thêm opponent từ match modal
let isLoggedIn = false; // Login state

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Check login status
    checkLoginStatus();
    
    setupTabs();
    loadTeams();
    loadPlayers();
    // Load opponents and matches, then render opponents after both are loaded
    Promise.all([
        loadOpponents(),
        loadMatches()
    ]).then(() => {
        // Re-render opponents after matches are loaded to show head-to-head records
        if (opponents.length > 0) renderOpponents();
        showUpcomingMatchModal(); // Show upcoming match modal after matches are loaded
    });
    setupTabChangeListeners();
    
    // Add click listener to header title
    const headerTitle = document.querySelector('.header-title');
    if (headerTitle) {
        headerTitle.addEventListener('click', () => {
            showUpcomingMatchModal();
        });
    }
});

// Tab navigation
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Update buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update content
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
}

// Loading indicator
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// Teams functions
async function loadTeams() {
    showLoading();
    try {
        teams = await teamsAPI.getAll();
        renderTeamProfileDisplay();
        updateTeamSelects();
    } catch (error) {
        alert('Error loading teams: ' + error.message);
    } finally {
        hideLoading();
    }
}

function renderTeamProfileDisplay() {
    const container = document.getElementById('team-profile-display');
    if (!container) return;
    
    if (teams.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>No team found</h3></div>';
        return;
    }
    
    const team = teams[0]; // Only one team
    container.innerHTML = `
        <div class="team-profile-card">
            <h3>${escapeHtml(team.name)}</h3>
            <div class="profile-info">
                <p><strong>Country:</strong> ${escapeHtml(team.country)}</p>
                ${team.founded_year ? `<p><strong>Founded:</strong> ${team.founded_year}</p>` : ''}
                <p><strong>ID:</strong> ${team.id}</p>
            </div>
        </div>
    `;
}

function updateTeamSelects() {
    const teamFilter = document.getElementById('team-filter');
    const playerTeamSelect = document.getElementById('player-team-id');
    
    const options = '<option value="">Select Team</option>' + 
        teams.map(team => `<option value="${team.id}">${escapeHtml(team.name)}</option>`).join('');
    
    if (teamFilter) {
        const currentFilter = teamFilter.value;
        teamFilter.innerHTML = '<option value="">All Teams</option>' + 
            teams.map(team => `<option value="${team.id}">${escapeHtml(team.name)}</option>`).join('');
        if (currentFilter) teamFilter.value = currentFilter;
    }
    
    if (playerTeamSelect) {
        const currentTeam = playerTeamSelect.value;
        playerTeamSelect.innerHTML = options;
        if (currentTeam) playerTeamSelect.value = currentTeam;
    }
}

function openTeamProfile(teamId) {
    const sidebar = document.getElementById('team-profile-sidebar');
    const content = document.getElementById('team-profile-content');
    
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    
    content.innerHTML = `
        <form id="team-profile-form" onsubmit="saveTeamProfile(event, ${team.id})">
            <div class="form-group">
                <label>Team Name *</label>
                <input type="text" id="team-profile-name" value="${escapeHtml(team.name)}" required>
            </div>
            <div class="form-group">
                <label>Country *</label>
                <input type="text" id="team-profile-country" value="${escapeHtml(team.country)}" required>
            </div>
            <div class="form-group">
                <label>Founded Year</label>
                <input type="number" id="team-profile-founded" value="${team.founded_year || ''}">
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Save</button>
            </div>
        </form>
    `;
    
    sidebar.classList.add('active');
}

function closeTeamProfile() {
    document.getElementById('team-profile-sidebar').classList.remove('active');
}

async function saveTeamProfile(event, teamId) {
    event.preventDefault();
    showLoading();
    
    const formData = {
        name: document.getElementById('team-profile-name').value,
        country: document.getElementById('team-profile-country').value,
        founded_year: document.getElementById('team-profile-founded').value 
            ? parseInt(document.getElementById('team-profile-founded').value) 
            : null,
    };
    
    try {
        await teamsAPI.update(teamId, formData);
        await loadTeams();
        closeTeamProfile();
    } catch (error) {
        alert('Error saving team: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Players functions
async function loadPlayers() {
    showLoading();
    try {
        players = await playersAPI.getAll();
        renderPlayers();
    } catch (error) {
        alert('Error loading players: ' + error.message);
    } finally {
        hideLoading();
    }
}

function renderPlayers() {
    const container = document.getElementById('players-list');
    
    if (players.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>No players found</h3><p>Click "Add Player" to create your first player</p></div>';
        return;
    }
    
    container.innerHTML = players.map(player => {
        const positions = Array.isArray(player.position) ? player.position : [player.position];
        const positionsText = positions.join(', ');
        let imageUrl = '';
        if (player.profile_image) {
            if (player.profile_image.startsWith('http')) {
                imageUrl = player.profile_image;
            } else if (player.profile_image.startsWith('/')) {
                // Absolute path - use current origin
                imageUrl = `${window.location.origin}${player.profile_image}`;
            } else {
                // Relative path - use API base URL
                imageUrl = API_BASE_URL.startsWith('http') 
                    ? `${API_BASE_URL}${player.profile_image}`
                    : `${window.location.origin}${API_BASE_URL}${player.profile_image}`;
            }
        }
        
        const hasImage = !!imageUrl;
        const cardClass = hasImage ? 'card card-with-image' : 'card';
        
        const role = player.role || 'Cầu thủ';
        const totalGoals = player.total_goals !== undefined ? player.total_goals : 0;
        
        return `
            <div class="${cardClass}">
                ${hasImage ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(player.name)}" class="card-profile-image" onerror="this.style.display='none'">` : ''}
                <div class="card-info">
                    <h3>${escapeHtml(player.name)} <span style="font-size: 0.8em; color: #667eea; font-weight: normal;">(${escapeHtml(role)})</span></h3>
                    <p><strong>Position(s):</strong> ${escapeHtml(positionsText)}</p>
                    ${player.jersey_number ? `<p><strong>Jersey #:</strong> ${player.jersey_number}</p>` : ''}
                    <p><strong>Tổng số bàn thắng:</strong> <span style="color: #28a745; font-weight: bold;">${totalGoals}</span></p>
                    <div class="card-actions" ${!isLoggedIn ? 'style="display: none;"' : ''}>
                        <button class="btn btn-primary btn-small" onclick="editPlayer('${String(player.id || '').replace(/'/g, "\\'")}')">Edit</button>
                        <button class="btn btn-danger btn-small" onclick="deletePlayer('${String(player.id || '').replace(/'/g, "\\'")}')">Delete</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateTeamSelects() {
    const teamFilter = document.getElementById('team-filter');
    const playerTeamSelect = document.getElementById('player-team-id');
    
    const options = '<option value="">Select Team</option>' + 
        teams.map(team => `<option value="${team.id}">${escapeHtml(team.name)}</option>`).join('');
    
    if (teamFilter) {
        const currentFilter = teamFilter.value;
        teamFilter.innerHTML = '<option value="">All Teams</option>' + 
            teams.map(team => `<option value="${team.id}">${escapeHtml(team.name)}</option>`).join('');
        if (currentFilter) teamFilter.value = currentFilter;
    }
    
    if (playerTeamSelect) {
        const currentTeam = playerTeamSelect.value;
        playerTeamSelect.innerHTML = options;
        if (currentTeam) playerTeamSelect.value = currentTeam;
    }
}

function renderPositionCheckboxes(selectedPositions = []) {
    const container = document.getElementById('player-positions-container');
    if (!container) return;
    
    const positions = [
        'GK', 'CB', 'LB', 'RB', 'CM', 'LM', 'RM', 'CAM', 'CDM', 'LW', 'RW', 'CF', 'ST'
    ];
    
    container.innerHTML = positions.map(position => {
        const isChecked = selectedPositions.includes(position);
        return `
            <label class="position-checkbox">
                <input type="checkbox" value="${position}" ${isChecked ? 'checked' : ''}>
                <span>${position}</span>
            </label>
        `;
    }).join('');
}

function getSelectedPositions() {
    const checkboxes = document.querySelectorAll('#player-positions-container input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

function switchImageTab(tab) {
    const urlTab = document.getElementById('image-url-tab');
    const uploadTab = document.getElementById('image-upload-tab');
    const urlBtn = document.querySelector('.tab-upload-btn[data-tab="url"]');
    const uploadBtn = document.querySelector('.tab-upload-btn[data-tab="upload"]');
    
    if (tab === 'url') {
        urlTab.classList.add('active');
        uploadTab.classList.remove('active');
        urlBtn.classList.add('active');
        uploadBtn.classList.remove('active');
    } else {
        urlTab.classList.remove('active');
        uploadTab.classList.add('active');
        urlBtn.classList.remove('active');
        uploadBtn.classList.add('active');
    }
}

async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const progressDiv = document.getElementById('upload-progress');
    progressDiv.style.display = 'block';
    
    try {
        const result = await uploadAPI.uploadPlayerImage(file);
        document.getElementById('player-profile-image').value = result.url;
        updateImagePreview(result.url);
        progressDiv.style.display = 'none';
        
        // Switch to URL tab to show the uploaded image URL
        switchImageTab('url');
    } catch (error) {
        alert('Error uploading image: ' + error.message);
        progressDiv.style.display = 'none';
    }
}

function updateImagePreview(imageUrl) {
    const preview = document.getElementById('player-image-preview');
    if (!preview) return;
    
    if (imageUrl) {
        const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`;
        preview.src = fullUrl;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }
}

function openPlayerModal(playerId = null) {
    editingPlayerId = playerId;
    const modal = document.getElementById('player-modal');
    const form = document.getElementById('player-form');
    const title = document.getElementById('player-modal-title');
    
    if (playerId) {
        title.textContent = 'Edit Player';
        const player = players.find(p => p.id === playerId);
        document.getElementById('player-id').value = player.id;
        document.getElementById('player-name').value = player.name;
        document.getElementById('player-profile-image').value = player.profile_image || '';
        document.getElementById('player-jersey-number').value = player.jersey_number || '';
        document.getElementById('player-role').value = player.role || 'Cầu thủ';
        
        // Set positions
        const positions = Array.isArray(player.position) ? player.position : [player.position];
        renderPositionCheckboxes(positions);
        
        // Update image preview
        updateImagePreview(player.profile_image);
    } else {
        title.textContent = 'Add Player';
        form.reset();
        document.getElementById('player-id').value = '';
        document.getElementById('player-role').value = 'Cầu thủ'; // Default role
        renderPositionCheckboxes([]);
        updateImagePreview('');
    }
    
    modal.classList.add('active');
}

function closePlayerModal() {
    document.getElementById('player-modal').classList.remove('active');
    document.getElementById('player-form').reset();
    editingPlayerId = null;
}

async function savePlayer(event) {
    event.preventDefault();
    showLoading();
    
    const selectedPositions = getSelectedPositions();
    if (selectedPositions.length === 0) {
        alert('Please select at least one position');
        hideLoading();
        return;
    }
    
    // Get first team ID if available (optional)
    const teamId = teams.length > 0 ? teams[0].id : null;
    
    const formData = {
        name: document.getElementById('player-name').value,
        position: selectedPositions,
        jersey_number: document.getElementById('player-jersey-number').value 
            ? parseInt(document.getElementById('player-jersey-number').value) 
            : null,
        profile_image: document.getElementById('player-profile-image').value || null,
        role: document.getElementById('player-role').value || 'Cầu thủ',
    };
    
    // Only include team_id if a team exists
    if (teamId) {
        formData.team_id = teamId;
    }
    
    try {
        if (editingPlayerId) {
            await playersAPI.update(editingPlayerId, formData);
        } else {
            await playersAPI.create(formData);
        }
        closePlayerModal();
        await loadPlayers();
    } catch (error) {
        alert('Error saving player: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function editPlayer(id) {
    openPlayerModal(id);
}

async function deletePlayer(id) {
    if (!confirm('Are you sure you want to delete this player?')) {
        return;
    }
    
    showLoading();
    try {
        await playersAPI.delete(id);
        await loadPlayers();
    } catch (error) {
        alert('Error deleting player: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Tab change listeners
function setupTabChangeListeners() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            if (tabName === 'statistics') {
                loadStatistics();
            }
        });
    });
}

// Opponents functions
async function loadOpponents() {
    showLoading();
    try {
        opponents = await opponentsAPI.getAll();
        // Don't render here - wait for matches to load first
        // renderOpponents() will be called after both opponents and matches are loaded
        updateOpponentSelects();
    } catch (error) {
        alert('Error loading opponents: ' + error.message);
    } finally {
        hideLoading();
    }
}

function getOpponentHeadToHead(opponentId) {
    // Get completed matches for this opponent, sorted by date
    const opponentMatches = matches
        .filter(match => match.opponent_id === opponentId && match.is_completed === true)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (opponentMatches.length === 0) {
        return null;
    }
    
    // Map result to Vietnamese with colors
    const resultMap = {
        'win': { text: 'Thắng', color: '#28a745' }, // Green
        'lose': { text: 'Thua', color: '#dc3545' }, // Red
        'draw': { text: 'Hòa', color: '#ffc107' }   // Yellow
    };
    
    // Create head-to-head HTML with colors: "Thắng - Thua - Thắng ..."
    const headToHead = opponentMatches
        .map(match => {
            const result = resultMap[match.result] || { text: match.result, color: '#666' };
            return `<span style="color: ${result.color}; font-weight: bold;">${result.text}</span>`;
        })
        .join(' - ');
    
    return headToHead;
}

function renderOpponents() {
    const container = document.getElementById('opponents-list');
    
    if (opponents.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>No opponents found</h3><p>Click "Thêm đối thủ" to create your first opponent</p></div>';
        return;
    }
    
    container.innerHTML = opponents.map(opponent => {
        const rating = opponent.rating || 0;
        const review = opponent.review || '';
        
        // Generate star display
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                starsHtml += '<span style="color: #ffc107; font-size: 1.2em;">★</span>';
            } else {
                starsHtml += '<span style="color: #ddd; font-size: 1.2em;">★</span>';
            }
        }
        
        // Get head-to-head record (returns HTML with colors)
        const headToHead = getOpponentHeadToHead(opponent.id);
        
        return `
        <div class="card">
            <h3>${escapeHtml(opponent.name)}</h3>
            ${opponent.phone ? `<p><strong>Số điện thoại:</strong> ${escapeHtml(opponent.phone)}</p>` : ''}
            <div style="margin: 10px 0;">
                <strong>Đánh giá:</strong>
                <div style="margin-top: 5px;">${starsHtml}</div>
            </div>
            ${review ? `<div style="margin: 10px 0;"><strong>Nhận xét:</strong><p style="margin-top: 5px; color: #666; font-style: italic;">${escapeHtml(review)}</p></div>` : ''}
            ${headToHead ? `<div style="margin: 10px 0;"><strong>Thành tích đối đầu:</strong><p style="margin-top: 5px;">${headToHead}</p></div>` : ''}
            <div class="card-actions" ${!isLoggedIn ? 'style="display: none;"' : ''}>
                <button class="btn btn-primary btn-small" onclick="editOpponent('${String(opponent.id || '').replace(/'/g, "\\'")}')">Sửa</button>
                <button class="btn btn-danger btn-small" onclick="deleteOpponent('${String(opponent.id || '').replace(/'/g, "\\'")}')">Xóa</button>
            </div>
        </div>
    `;
    }).join('');
}

function openOpponentModal(opponentId = null) {
    editingOpponentId = opponentId;
    const modal = document.getElementById('opponent-modal');
    const form = document.getElementById('opponent-form');
    const title = document.getElementById('opponent-modal-title');
    
    if (opponentId) {
        title.textContent = 'Sửa đối thủ';
        const opponent = opponents.find(o => o.id === opponentId);
        document.getElementById('opponent-id').value = opponent.id;
        document.getElementById('opponent-name').value = opponent.name;
        document.getElementById('opponent-phone').value = opponent.phone || '';
        document.getElementById('opponent-rating').value = opponent.rating || 0;
        document.getElementById('opponent-review').value = opponent.review || '';
        updateStarDisplay(opponent.rating || 0);
    } else {
        title.textContent = 'Thêm đối thủ';
        form.reset();
        document.getElementById('opponent-id').value = '';
        document.getElementById('opponent-rating').value = 0;
        updateStarDisplay(0);
    }
    
    modal.classList.add('active');
}

function closeOpponentModal() {
    document.getElementById('opponent-modal').classList.remove('active');
    document.getElementById('opponent-form').reset();
    editingOpponentId = null;
    openOpponentModalCallback = null;
    updateStarDisplay(0);
}

function setRating(rating) {
    document.getElementById('opponent-rating').value = rating;
    updateStarDisplay(rating);
}

function updateStarDisplay(rating) {
    const stars = document.querySelectorAll('.star-rating .star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.style.color = '#ffc107';
        } else {
            star.style.color = '#ddd';
        }
    });
}

async function saveOpponent(event) {
    event.preventDefault();
    showLoading();
    
    const formData = {
        name: document.getElementById('opponent-name').value,
        phone: document.getElementById('opponent-phone').value || null,
        rating: parseInt(document.getElementById('opponent-rating').value) || 0,
        review: document.getElementById('opponent-review').value || null,
    };
    
    try {
        let savedOpponent;
        if (editingOpponentId) {
            savedOpponent = await opponentsAPI.update(editingOpponentId, formData);
        } else {
            savedOpponent = await opponentsAPI.create(formData);
        }
        closeOpponentModal();
        await loadOpponents();
        
        // Nếu có callback (được gọi từ match modal), cập nhật select và gọi callback
        if (openOpponentModalCallback && savedOpponent) {
            updateOpponentSelects();
            if (typeof openOpponentModalCallback === 'function') {
                openOpponentModalCallback(savedOpponent.id);
            }
        }
    } catch (error) {
        alert('Error saving opponent: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function editOpponent(id) {
    openOpponentModal(id);
}

async function deleteOpponent(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa đối thủ này?')) {
        return;
    }
    
    showLoading();
    try {
        await opponentsAPI.delete(id);
        await loadOpponents();
    } catch (error) {
        alert('Error deleting opponent: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Statistics functions
async function loadStatistics() {
    showLoading();
    try {
        // Ensure players are loaded
        if (players.length === 0) {
            await loadPlayers();
        }
        
        // Load all completed matches with goals
        const allMatches = await matchesAPI.getAll();
        const completedMatches = allMatches.filter(m => m.is_completed === true || m.is_completed === 1);
        renderGoalStatistics(completedMatches);
        renderParticipationStatistics(completedMatches);
    } catch (error) {
        console.error('Error loading goal statistics:', error);
        alert('Error loading goal statistics: ' + error.message);
    } finally {
        hideLoading();
    }
}

function renderGoalStatistics(completedMatches) {
    // Filter by month or quarter if selected
    let filteredMatches = completedMatches;
    if (selectedGoalsMonthFilter) {
        filteredMatches = completedMatches.filter(match => {
            if (!match.date) return false;
            const matchMonth = match.date.substring(0, 7); // Get YYYY-MM
            return matchMonth === selectedGoalsMonthFilter;
        });
    } else if (selectedGoalsQuarterFilter) {
        filteredMatches = completedMatches.filter(match => {
            if (!match.date) return false;
            const [year, month] = match.date.substring(0, 7).split('-');
            const monthNum = parseInt(month);
            let quarter;
            if (monthNum >= 1 && monthNum <= 3) quarter = 'Q1';
            else if (monthNum >= 4 && monthNum <= 6) quarter = 'Q2';
            else if (monthNum >= 7 && monthNum <= 9) quarter = 'Q3';
            else quarter = 'Q4';
            const matchQuarter = `${year}-${quarter}`;
            return matchQuarter === selectedGoalsQuarterFilter;
        });
    }
    
    // Populate month and quarter filter dropdowns
    populateGoalsMonthFilter(completedMatches);
    populateGoalsQuarterFilter(completedMatches);
    
    // Calculate player goals data
    const playerGoalsMap = {}; // { playerId: { name, totalGoals, matches: [{date, goals}] } }
    
    // Initialize all players with 0 goals
    players.forEach(player => {
        playerGoalsMap[player.id] = {
            name: player.name,
            totalGoals: 0,
            matches: []
        };
    });
    
    // Process all completed matches (use filtered matches)
    filteredMatches.forEach(match => {
        if (match.goals && match.goals.length > 0) {
            match.goals.forEach(goal => {
                const playerId = goal.player_id;
                const playerName = getPlayerName(playerId);
                const goalsInMatch = goal.goals || 0;
                
                if (!playerGoalsMap[playerId]) {
                    playerGoalsMap[playerId] = {
                        name: playerName,
                        totalGoals: 0,
                        matches: []
                    };
                }
                
                playerGoalsMap[playerId].totalGoals += goalsInMatch;
                playerGoalsMap[playerId].matches.push({
                    date: match.date,
                    goals: goalsInMatch
                });
            });
        }
    });
    
    // Get all unique match dates (sorted) - use filtered matches for table columns
    const allMatchDates = [...new Set(filteredMatches.map(m => m.date))].sort();
    
    // Get all players (including those who didn't score)
    const allPlayers = players.map(p => ({
        id: p.id,
        name: p.name
    }));
    
    // Filter Top 3 by month or quarter if selected
    let top3PlayerGoalsMap = playerGoalsMap;
    if (selectedTop3MonthFilter || selectedTop3QuarterFilter) {
        // Recalculate playerGoalsMap for Top 3 only
        top3PlayerGoalsMap = {};
        players.forEach(player => {
            top3PlayerGoalsMap[player.id] = {
                name: player.name,
                totalGoals: 0,
                matches: []
            };
        });
        
        let top3FilteredMatches = completedMatches;
        if (selectedTop3MonthFilter) {
            top3FilteredMatches = completedMatches.filter(match => {
                if (!match.date) return false;
                const matchMonth = match.date.substring(0, 7);
                return matchMonth === selectedTop3MonthFilter;
            });
        } else if (selectedTop3QuarterFilter) {
            top3FilteredMatches = completedMatches.filter(match => {
                if (!match.date) return false;
                const [year, month] = match.date.substring(0, 7).split('-');
                const monthNum = parseInt(month);
                let quarter;
                if (monthNum >= 1 && monthNum <= 3) quarter = 'Q1';
                else if (monthNum >= 4 && monthNum <= 6) quarter = 'Q2';
                else if (monthNum >= 7 && monthNum <= 9) quarter = 'Q3';
                else quarter = 'Q4';
                const matchQuarter = `${year}-${quarter}`;
                return matchQuarter === selectedTop3QuarterFilter;
            });
        }
        
        top3FilteredMatches.forEach(match => {
            if (match.goals && match.goals.length > 0) {
                match.goals.forEach(goal => {
                    const playerId = goal.player_id;
                    const playerName = getPlayerName(playerId);
                    const goalsInMatch = goal.goals || 0;
                    
                    if (!top3PlayerGoalsMap[playerId]) {
                        top3PlayerGoalsMap[playerId] = {
                            name: playerName,
                            totalGoals: 0,
                            matches: []
                        };
                    }
                    
                    top3PlayerGoalsMap[playerId].totalGoals += goalsInMatch;
                    top3PlayerGoalsMap[playerId].matches.push({
                        date: match.date,
                        goals: goalsInMatch
                    });
                });
            }
        });
    }
    
    // Populate Top 3 month and quarter filter dropdowns
    populateTop3MonthFilter(completedMatches);
    populateTop3QuarterFilter(completedMatches);
    
    // Render top 3 goalscorers
    renderTopGoalscorers(top3PlayerGoalsMap);
    
    // Render bubble chart
    renderBubbleChart(playerGoalsMap);
    
    // Render goals table
    renderGoalsTable(playerGoalsMap, allPlayers, allMatchDates);
}

function renderTopGoalscorers(playerGoalsMap) {
    const container = document.getElementById('top-goalscorers-circles');
    if (!container) return;
    
    // Get top 3 players
    const topPlayers = Object.values(playerGoalsMap)
        .sort((a, b) => b.totalGoals - a.totalGoals)
        .slice(0, 3);
    
    if (topPlayers.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Chưa có dữ liệu ghi bàn</p></div>';
        return;
    }
    
    // Pad to 3 if less than 3
    while (topPlayers.length < 3) {
        topPlayers.push({ name: '-', totalGoals: 0 });
    }
    
    container.innerHTML = topPlayers.map((player, index) => {
        const medalClasses = ['medal-gold', 'medal-silver', 'medal-bronze'];
        const podiumHeights = ['podium-first', 'podium-second', 'podium-third'];
        const medalIcons = ['🥇', '🥈', '🥉'];
        return `
            <div class="goalscorer-card ${podiumHeights[index]}">
                <div class="goalscorer-circle ${medalClasses[index]}">
                    <div class="medal-icon">${medalIcons[index]}</div>
                    <div class="goalscorer-goals">
                        <span class="goals-number">${player.totalGoals}</span>
                        <span class="goals-label">bàn</span>
                    </div>
                </div>
                <div class="podium-base"></div>
                <div class="goalscorer-name">${escapeHtml(player.name)}</div>
            </div>
        `;
    }).join('');
}

function renderBubbleChart(playerGoalsMap) {
    const container = document.getElementById('goals-bubbles-container');
    if (!container) return;
    
    const players = Object.values(playerGoalsMap);
    
    if (players.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Chưa có dữ liệu ghi bàn</p></div>';
        return;
    }
    
    // Sort by total goals (descending)
    const sortedPlayers = [...players].sort((a, b) => b.totalGoals - a.totalGoals);
    
    // Find max goals for scaling
    const maxGoals = Math.max(...sortedPlayers.map(p => p.totalGoals), 1);
    
    // Wait for container to have dimensions
    setTimeout(() => {
        const containerWidth = container.offsetWidth || 800;
        const containerHeight = container.offsetHeight || 500;
        
        // Generate bubbles with random positions (avoiding overlaps)
        const bubbles = [];
        
        sortedPlayers.forEach((player, index) => {
            // Calculate bubble size based on goals
            // For 0 goals: minimum size 50px
            // For max goals: maximum size 180px
            let size;
            if (player.totalGoals === 0) {
                size = 50; // Minimum size for 0 goals
            } else {
                size = Math.max(60, Math.min(180, 60 + (player.totalGoals / maxGoals) * 120));
            }
            const radius = size / 2;
            
            // Try to find a position that doesn't overlap
            let attempts = 0;
            let x, y;
            let validPosition = false;
            
            while (!validPosition && attempts < 100) {
                x = radius + Math.random() * (containerWidth - size);
                y = radius + Math.random() * (containerHeight - size);
                
                // Check collision with existing bubbles
                validPosition = true;
                for (const existing of bubbles) {
                    const dx = x - existing.x;
                    const dy = y - existing.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < radius + existing.radius + 15) {
                        validPosition = false;
                        break;
                    }
                }
                attempts++;
            }
            
            // If no valid position found, use random anyway
            if (!validPosition) {
                x = radius + Math.random() * (containerWidth - size);
                y = radius + Math.random() * (containerHeight - size);
            }
            
            bubbles.push({
                name: player.name,
                goals: player.totalGoals,
                matches: player.matches.length,
                x: x,
                y: y,
                radius: radius,
                size: size
            });
        });
        
        // Render bubbles
        container.innerHTML = bubbles.map(bubble => {
            // Color based on goals
            // For 0 goals: lighter gray/green
            // For goals > 0: green gradient
            let backgroundColor, borderColor;
            if (bubble.goals === 0) {
                backgroundColor = `rgba(108, 117, 125, 0.5)`; // Gray for 0 goals
                borderColor = `rgba(108, 117, 125, 0.8)`;
            } else {
                const opacity = 0.6 + (bubble.goals / maxGoals) * 0.4;
                backgroundColor = `rgba(40, 167, 69, ${opacity})`;
                borderColor = `rgba(40, 167, 69, 1)`;
            }
            
            // Calculate font size based on bubble size
            const nameFontSize = Math.max(0.6, Math.min(1.1, bubble.size / 100));
            const goalsFontSize = Math.max(0.5, Math.min(0.9, bubble.size / 120));
            
            return `
                <div class="goal-bubble" 
                     style="
                         left: ${bubble.x - bubble.radius}px;
                         top: ${bubble.y - bubble.radius}px;
                         width: ${bubble.size}px;
                         height: ${bubble.size}px;
                         background: ${backgroundColor};
                         border: 3px solid ${borderColor};
                     "
                     title="${escapeHtml(bubble.name)}: ${bubble.goals} bàn trong ${bubble.matches} trận">
                    <div class="bubble-name" style="font-size: ${nameFontSize}em;">${escapeHtml(bubble.name)}</div>
                    <div class="bubble-goals" style="font-size: ${goalsFontSize}em;">${bubble.goals} bàn</div>
                </div>
            `;
        }).join('');
    }, 100);
}

// Global variable to track goals table sort state
let goalsTableSortState = { column: 'total', direction: 'desc' }; // 'asc' or 'desc'
let participationTableSortState = { column: 'rate', direction: 'desc' }; // 'asc' or 'desc'

function renderGoalsTable(playerGoalsMap, allPlayers, allMatchDates) {
    const container = document.getElementById('goals-table-wrapper');
    if (!container) return;
    
    if (allPlayers.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Chưa có dữ liệu</p></div>';
        return;
    }
    
    // Prepare player data with total goals for sorting
    const playersWithGoals = allPlayers.map(player => {
        const playerData = playerGoalsMap[player.id];
        const totalGoals = playerData ? playerData.totalGoals : 0;
        return {
            player: player,
            playerData: playerData,
            totalGoals: totalGoals
        };
    });
    
    // Sort players by total goals
    if (goalsTableSortState.column === 'total') {
        playersWithGoals.sort((a, b) => {
            if (goalsTableSortState.direction === 'desc') {
                return b.totalGoals - a.totalGoals; // High to low
            } else {
                return a.totalGoals - b.totalGoals; // Low to high
            }
        });
    }
    
    // Build table rows
    let tableRows = '';
    
    playersWithGoals.forEach(({ player, playerData, totalGoals }) => {
        let rowCells = `<td><strong>${escapeHtml(player.name)}</strong></td>`;
        
        // If no match dates, just show total
        if (allMatchDates.length === 0) {
            rowCells += `<td class="goals-total"><strong>${totalGoals}</strong></td>`;
        } else {
            // Show goals for each match date
            allMatchDates.forEach(date => {
                let goalsInMatch = 0;
                
                if (playerData) {
                    const matchData = playerData.matches.find(m => m.date === date);
                    if (matchData) {
                        goalsInMatch = matchData.goals;
                    }
                }
                
                rowCells += `<td>${goalsInMatch}</td>`;
            });
            
            // Add total column
            rowCells += `<td class="goals-total"><strong>${totalGoals}</strong></td>`;
        }
        
        tableRows += `<tr>${rowCells}</tr>`;
    });
    
    // Build date headers
    let dateHeaders = '';
    if (allMatchDates.length > 0) {
        dateHeaders = allMatchDates.map(date => {
            const dateObj = new Date(date + 'T00:00:00');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            return `<th>${day}/${month}</th>`;
        }).join('');
    }
    
    // Sort indicator for total goals column
    const sortIcon = goalsTableSortState.direction === 'desc' ? '▼' : '▲';
    const sortStyle = 'cursor: pointer; user-select: none;';
    
    container.innerHTML = `
        <div class="goals-table-scroll">
            <table class="goals-table">
                <thead>
                    <tr>
                        <th>Tên cầu thủ</th>
                        ${dateHeaders}
                        <th id="goals-total-header" class="goals-total-header" style="${sortStyle}" onclick="sortGoalsTable('total')">
                            Tổng số bàn ${sortIcon}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;
}

function sortGoalsTable(column) {
    if (goalsTableSortState.column === column) {
        // Toggle direction
        goalsTableSortState.direction = goalsTableSortState.direction === 'desc' ? 'asc' : 'desc';
    } else {
        // New column, default to desc
        goalsTableSortState.column = column;
        goalsTableSortState.direction = 'desc';
    }
    
    // Re-render the goals table
    const allMatches = matches.filter(m => m.is_completed === true || m.is_completed === 1);
    renderGoalStatistics(allMatches);
}

// Matches/Schedule functions
let currentScheduleSubTab = 'upcoming';
let selectedMonthFilter = ''; // Format: 'YYYY-MM' or '' for all months
let selectedGoalsMonthFilter = ''; // Format: 'YYYY-MM' or '' for all months (for goals statistics)
let selectedGoalsQuarterFilter = ''; // Format: 'YYYY-Q' or '' for all quarters (for goals statistics), e.g., '2026-Q1'
let selectedTop3MonthFilter = ''; // Format: 'YYYY-MM' or '' for all months (for top 3 goalscorers)
let selectedTop3QuarterFilter = ''; // Format: 'YYYY-Q' or '' for all quarters (for top 3 goalscorers), e.g., '2026-Q1'
let selectedParticipationMonthFilter = ''; // Format: 'YYYY-MM' or '' for all months (for participation statistics)
let selectedParticipationQuarterFilter = ''; // Format: 'YYYY-Q' or '' for all quarters (for participation statistics), e.g., '2026-Q1'
let selectedCompletedQuarterFilter = ''; // Format: 'YYYY-Q' or '' for all quarters (for completed matches), e.g., '2026-Q1'

async function loadMatches() {
    showLoading();
    try {
        // Ensure players are loaded before rendering matches
        // because matches need player names for goals display
        if (players.length === 0) {
            await loadPlayers();
        }
        
        matches = await matchesAPI.getAll();
        renderUpcomingMatches();
        renderCompletedMatches();
        // Re-render opponents to update head-to-head records
        if (opponents.length > 0) renderOpponents();
    } catch (error) {
        alert('Error loading matches: ' + error.message);
    } finally {
        hideLoading();
    }
}

function switchScheduleSubTab(tab) {
    currentScheduleSubTab = tab;
    const buttons = document.querySelectorAll('.sub-tab-btn');
    const contents = document.querySelectorAll('.subtab-content');
    
    buttons.forEach(btn => {
        if (btn.getAttribute('data-subtab') === tab) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    contents.forEach(content => {
        if (content.id === `${tab}-matches-list`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

function getPlayerName(playerId) {
    if (!playerId) return 'Unknown';
    const player = players.find(p => p.id === playerId);
    if (player) {
        return player.name;
    }
    // If player not found, try to load players again (in case they weren't loaded yet)
    // But don't show "Player ID: X" - just show a placeholder
    console.warn(`Player with ID ${playerId} not found in players list`);
    return 'Cầu thủ đã xóa';
}

function renderMatchesList(matchesList, showResult = false) {
    if (!matchesList || matchesList.length === 0) {
        return '<div class="empty-state"><h3>Chưa có trận đấu</h3></div>';
    }
    
    // Filter out invalid matches (missing date)
    const validMatches = matchesList.filter(match => match && match.date);
    if (validMatches.length === 0) {
        return '<div class="empty-state"><h3>Chưa có trận đấu</h3></div>';
    }
    
    // Sort matches by date descending (newest first) for both completed and upcoming matches
    const sortedMatches = [...validMatches].sort((a, b) => {
        try {
            // Parse dates (YYYY-MM-DD format) - compare dates only
            const dateAParts = a.date.split('-');
            const dateBParts = b.date.split('-');
            if (dateAParts.length !== 3 || dateBParts.length !== 3) return 0;
            const dateA = new Date(parseInt(dateAParts[0]), parseInt(dateAParts[1]) - 1, parseInt(dateAParts[2])).getTime();
            const dateB = new Date(parseInt(dateBParts[0]), parseInt(dateBParts[1]) - 1, parseInt(dateBParts[2])).getTime();
            // Sort descending (newest first) for both completed and upcoming matches
            return dateB - dateA;
        } catch (e) {
            return 0;
        }
    });
    
    // Group matches by date
    const matchesByDate = {};
    sortedMatches.forEach(match => {
        const dateKey = match.date; // YYYY-MM-DD
        if (!matchesByDate[dateKey]) {
            matchesByDate[dateKey] = [];
        }
        matchesByDate[dateKey].push(match);
    });
    
    // Render timeline
    return Object.keys(matchesByDate).map(dateKey => {
        const dateMatches = matchesByDate[dateKey];
        const matchDate = new Date(dateKey + 'T00:00:00');
        const day = String(matchDate.getDate()).padStart(2, '0');
        const month = String(matchDate.getMonth() + 1).padStart(2, '0');
        const year = matchDate.getFullYear();
        
        // Determine timeline-items background color based on match results (if showResult = true)
        let timelineItemsStyle = '';
        let matchTimeColor = '#333'; // Default color
        if (showResult && dateMatches.length > 0) {
            // Get the result of the first match in the group
            const firstMatch = dateMatches[0];
            if (firstMatch.result === 'win') {
                timelineItemsStyle = 'background: #28a745;'; // Green
                matchTimeColor = '#fff'; // White text on green background
            } else if (firstMatch.result === 'lose') {
                timelineItemsStyle = 'background: #dc3545;'; // Red
                matchTimeColor = '#fff'; // White text on red background
            } else if (firstMatch.result === 'draw') {
                timelineItemsStyle = 'background: #ffc107;'; // Yellow
                matchTimeColor = '#333'; // Dark text on yellow background
            }
        }
        
        return `
            <div class="timeline-date-group">
                ${!showResult ? `<div class="timeline-date-header">
                    <h3>LỊCH THI ĐẤU NGÀY ${day}-${month}</h3>
                </div>` : ''}
                <div class="timeline-items" style="${timelineItemsStyle}">
                    ${dateMatches.map(match => {
                        // Use default time 19:00 since model doesn't have time field
                        const timeStr = '19H00';
                        const dateDisplay = `${timeStr} NGÀY ${day}/${month}/${year}`;
                        const opponentName = match.opponent ? match.opponent.name : `Opponent ID: ${match.opponent_id}`;
                        
                        // Map result to Vietnamese for display
                        const resultText = showResult && match.result ? {
                            'win': 'Thắng',
                            'lose': 'Thua',
                            'draw': 'Hòa'
                        }[match.result] : null;
                        
                        // Determine score display for left and right
                        const leftScore = showResult && match.our_score !== undefined ? match.our_score : '';
                        const rightScore = showResult && match.opponent_score !== undefined ? match.opponent_score : '';
                        
                        // Determine result badge color
                        let resultBadgeClass = 'match-vs'; // Default to VS style
                        let resultBadgeText = 'VS';
                        let resultBadgeStyle = '';
                        
                        if (resultText) {
                            resultBadgeText = resultText;
                            // Set background color based on result
                            if (match.result === 'win') {
                                resultBadgeStyle = 'background: #28a745; color: white;'; // Green
                            } else if (match.result === 'lose') {
                                resultBadgeStyle = 'background: #dc3545; color: white;'; // Red
                            } else if (match.result === 'draw') {
                                resultBadgeStyle = 'background: #ffc107; color: #333;'; // Yellow
                            }
                        }
                        
                        // Build goals list if completed
                        let goalsList = '';
                        if (showResult && match.goals && match.goals.length > 0) {
                            goalsList = '<div class="match-goals-list" style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #e9ecef; width: 100%; min-width: 0; box-sizing: border-box;">';
                            match.goals.forEach(goal => {
                                const playerName = getPlayerName(goal.player_id);
                                goalsList += `<div style="margin: 5px 0; color: #333; font-weight: 500; word-wrap: break-word; overflow-wrap: break-word; max-width: 100%;">- <span style="color: #667eea; font-weight: 600; word-wrap: break-word; overflow-wrap: break-word;">${escapeHtml(playerName)}</span> : <span style="color: #28a745; font-weight: 700; font-size: 1.1em;">${goal.goals}</span> bàn</div>`;
                            });
                            goalsList += '</div>';
                        }
                        
                        return `
                            <div class="timeline-match">
                                <div class="match-time" style="text-align: center; color: ${matchTimeColor}; word-wrap: break-word; overflow-wrap: break-word; max-width: 100%;">${dateDisplay}</div>
                                <div class="match-card">
                                    <div style="display: flex; flex-direction: column; width: 100%; min-width: 0; box-sizing: border-box;">
                                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 15px; flex-wrap: wrap; width: 100%;" class="match-main-content">
                                            <div class="match-team-left" style="min-width: 0; flex: 1 1 auto; display: flex; align-items: center; gap: 10px; justify-content: flex-start;">
                                                <span class="team-name" style="display: block; word-wrap: break-word; overflow-wrap: break-word; max-width: 100%; flex: 1; text-align: left;">FC GREEN</span>
                                                ${leftScore !== '' ? `<div class="match-score-left" style="flex-shrink: 0;">${leftScore}</div>` : ''}
                                            </div>
                                            <div class="match-vs" style="${resultBadgeStyle} flex-shrink: 0;">${resultBadgeText}</div>
                                            <div class="match-team-right" style="min-width: 0; flex: 1 1 auto; display: flex; align-items: center; gap: 10px; justify-content: flex-end;">
                                                ${rightScore !== '' ? `<div class="match-score-right" style="flex-shrink: 0;">${rightScore}</div>` : ''}
                                                <span class="team-name" style="display: block; word-wrap: break-word; overflow-wrap: break-word; max-width: 100%; flex: 1; text-align: right;">${escapeHtml(opponentName)}</span>
                                            </div>
                                            <div class="match-actions" ${!isLoggedIn ? 'style="display: none; flex-basis: 100%;"' : 'style="flex-basis: 100%;"'}">
                                                ${showResult 
                                                    ? `<button class="btn btn-primary btn-small" onclick="editMatchResult('${String(match.id || '').replace(/'/g, "\\'")}')">Sửa kết quả</button>`
                                                    : `<button class="btn btn-primary btn-small" onclick="editMatch('${String(match.id || '').replace(/'/g, "\\'")}')">Sửa</button>`
                                                }
                                                <button class="btn btn-danger btn-small" onclick="deleteMatch('${String(match.id || '').replace(/'/g, "\\'")}')">Xóa</button>
                                            </div>
                                        </div>
                                        ${goalsList}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function renderUpcomingMatches() {
    const container = document.getElementById('upcoming-matches-list');
    if (!container) return;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Today at 00:00:00
    
    const upcomingMatches = matches.filter(match => {
        // Check if match is marked as completed (handle undefined/null as false)
        const isCompleted = match.is_completed === true || match.is_completed === 1;
        if (isCompleted) return false;
        
        // Filter by date only (not time) since model doesn't have time field
        // Handle case where date might be invalid
        if (!match.date) return false;
        try {
            // Parse match date (YYYY-MM-DD format)
            const matchDateParts = match.date.split('-');
            if (matchDateParts.length !== 3) return false;
            const matchDate = new Date(
                parseInt(matchDateParts[0]), 
                parseInt(matchDateParts[1]) - 1, 
                parseInt(matchDateParts[2])
            );
            // Compare dates only (ignore time)
            return matchDate >= today;
        } catch (e) {
            console.error("Error parsing match date:", match.date, e);
            return false;
        }
    });
    
    container.innerHTML = renderMatchesList(upcomingMatches, false);
}

function renderCompletedMatches() {
    const container = document.getElementById('completed-matches-list');
    if (!container) return;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Today at 00:00:00
    
    // Get all completed matches (before filtering by month)
    const allCompletedMatches = matches.filter(match => {
        // Check if match is marked as completed (handle undefined/null as false)
        const isCompleted = match.is_completed === true || match.is_completed === 1;
        if (isCompleted) return true;
        
        // Also include matches with date < today (compare dates only, not time)
        // Handle case where date might be invalid
        if (!match.date) return false;
        try {
            // Parse match date (YYYY-MM-DD format)
            const matchDateParts = match.date.split('-');
            if (matchDateParts.length !== 3) return false;
            const matchDate = new Date(
                parseInt(matchDateParts[0]), 
                parseInt(matchDateParts[1]) - 1, 
                parseInt(matchDateParts[2])
            );
            // Compare dates only (ignore time)
            return matchDate < today;
        } catch (e) {
            console.error("Error parsing match date:", match.date, e);
            return false;
        }
    });
    
    // Filter by month or quarter if selected
    let completedMatches = allCompletedMatches;
    if (selectedMonthFilter) {
        completedMatches = completedMatches.filter(match => {
            if (!match.date) return false;
            const matchMonth = match.date.substring(0, 7); // Get YYYY-MM
            return matchMonth === selectedMonthFilter;
        });
    } else if (selectedCompletedQuarterFilter) {
        completedMatches = completedMatches.filter(match => {
            if (!match.date) return false;
            const [year, month] = match.date.substring(0, 7).split('-');
            const monthNum = parseInt(month);
            let quarter;
            if (monthNum >= 1 && monthNum <= 3) quarter = 'Q1';
            else if (monthNum >= 4 && monthNum <= 6) quarter = 'Q2';
            else if (monthNum >= 7 && monthNum <= 9) quarter = 'Q3';
            else quarter = 'Q4';
            const matchQuarter = `${year}-${quarter}`;
            return matchQuarter === selectedCompletedQuarterFilter;
        });
    }
    
    // Sort by date descending (newest first)
    completedMatches.sort((a, b) => {
        try {
            const dateAParts = a.date.split('-');
            const dateBParts = b.date.split('-');
            if (dateAParts.length !== 3 || dateBParts.length !== 3) return 0;
            const dateA = new Date(parseInt(dateAParts[0]), parseInt(dateAParts[1]) - 1, parseInt(dateAParts[2])).getTime();
            const dateB = new Date(parseInt(dateBParts[0]), parseInt(dateBParts[1]) - 1, parseInt(dateBParts[2])).getTime();
            return dateB - dateA; // Descending order (newest first)
        } catch (e) {
            return 0;
        }
    });
    
    // Populate month and quarter filter dropdowns with all completed matches
    // This must be done BEFORE getting filterHTML to ensure selected values are set
    populateMonthFilter(allCompletedMatches);
    populateCompletedQuarterFilter(allCompletedMatches);
    
    // Get filter HTML (first child is the filter div) - after populate to get correct selected values
    const filterHTML = container.firstElementChild ? container.firstElementChild.outerHTML : '';
    
    // Render matches
    const matchesHTML = renderMatchesList(completedMatches, true);
    
    container.innerHTML = filterHTML + matchesHTML;
    
    // Re-set selected values after innerHTML is set (because innerHTML resets form values)
    const monthFilterAfter = document.getElementById('month-filter');
    const quarterFilterAfter = document.getElementById('completed-quarter-filter');
    if (monthFilterAfter) monthFilterAfter.value = selectedMonthFilter;
    if (quarterFilterAfter) quarterFilterAfter.value = selectedCompletedQuarterFilter;
}

function populateMonthFilter(completedMatches) {
    const monthFilter = document.getElementById('month-filter');
    if (!monthFilter) return;
    
    // Get all unique months from completed matches
    const monthSet = new Set();
    completedMatches.forEach(match => {
        if (match.date) {
            const month = match.date.substring(0, 7); // YYYY-MM
            monthSet.add(month);
        }
    });
    
    // Convert to array and sort descending (newest first)
    const months = Array.from(monthSet).sort((a, b) => {
        return b.localeCompare(a); // Descending order
    });
    
    // Clear existing options except "Tất cả các tháng"
    monthFilter.innerHTML = '<option value="">Tất cả các tháng</option>';
    
    // Add month options
    months.forEach(month => {
        const [year, monthNum] = month.split('-');
        const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                          'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
        const monthName = monthNames[parseInt(monthNum) - 1];
        const option = document.createElement('option');
        option.value = month;
        option.textContent = `${monthName}/${year}`;
        monthFilter.appendChild(option);
    });
    
    // Set selected value
    monthFilter.value = selectedMonthFilter;
}

function filterCompletedMatchesByMonth() {
    const monthFilter = document.getElementById('month-filter');
    const quarterFilter = document.getElementById('completed-quarter-filter');
    if (!monthFilter || !quarterFilter) return;
    
    selectedMonthFilter = monthFilter.value;
    
    // If month is selected, reset quarter to "all"
    if (selectedMonthFilter) {
        selectedCompletedQuarterFilter = '';
        quarterFilter.value = '';
    }
    
    renderCompletedMatches();
}

function populateCompletedQuarterFilter(completedMatches) {
    const quarterFilter = document.getElementById('completed-quarter-filter');
    if (!quarterFilter) return;
    
    // Get all unique quarters from completed matches
    const quarterSet = new Set();
    completedMatches.forEach(match => {
        if (match.date) {
            const [year, month] = match.date.substring(0, 7).split('-');
            const monthNum = parseInt(month);
            let quarter;
            if (monthNum >= 1 && monthNum <= 3) quarter = 'Q1';
            else if (monthNum >= 4 && monthNum <= 6) quarter = 'Q2';
            else if (monthNum >= 7 && monthNum <= 9) quarter = 'Q3';
            else quarter = 'Q4';
            const quarterKey = `${year}-${quarter}`;
            quarterSet.add(quarterKey);
        }
    });
    
    // Convert to array and sort descending (newest first)
    const quarters = Array.from(quarterSet).sort((a, b) => {
        return b.localeCompare(a); // Descending order
    });
    
    // Clear existing options except "Tất cả các quý"
    quarterFilter.innerHTML = '<option value="">Tất cả các quý</option>';
    
    // Add quarter options
    quarters.forEach(quarterKey => {
        const [year, quarter] = quarterKey.split('-');
        const quarterNames = { 'Q1': 'Quý 1', 'Q2': 'Quý 2', 'Q3': 'Quý 3', 'Q4': 'Quý 4' };
        const quarterName = quarterNames[quarter];
        const option = document.createElement('option');
        option.value = quarterKey;
        option.textContent = `${quarterName}/${year}`;
        quarterFilter.appendChild(option);
    });
    
    // Set selected value
    quarterFilter.value = selectedCompletedQuarterFilter;
}

function filterCompletedMatchesByQuarter() {
    const monthFilter = document.getElementById('month-filter');
    const quarterFilter = document.getElementById('completed-quarter-filter');
    if (!monthFilter || !quarterFilter) return;
    
    selectedCompletedQuarterFilter = quarterFilter.value;
    
    // If quarter is selected, reset month to "all"
    if (selectedCompletedQuarterFilter) {
        selectedMonthFilter = '';
        monthFilter.value = '';
    }
    
    renderCompletedMatches();
}

function populateGoalsMonthFilter(completedMatches) {
    const monthFilter = document.getElementById('goals-month-filter');
    if (!monthFilter) return;
    
    // Get all unique months from completed matches
    const monthSet = new Set();
    completedMatches.forEach(match => {
        if (match.date) {
            const month = match.date.substring(0, 7); // YYYY-MM
            monthSet.add(month);
        }
    });
    
    // Convert to array and sort descending (newest first)
    const months = Array.from(monthSet).sort((a, b) => {
        return b.localeCompare(a); // Descending order
    });
    
    // Clear existing options except "Tất cả các tháng"
    monthFilter.innerHTML = '<option value="">Tất cả các tháng</option>';
    
    // Add month options
    months.forEach(month => {
        const [year, monthNum] = month.split('-');
        const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                          'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
        const monthName = monthNames[parseInt(monthNum) - 1];
        const option = document.createElement('option');
        option.value = month;
        option.textContent = `${monthName}/${year}`;
        monthFilter.appendChild(option);
    });
    
    // Set selected value
    monthFilter.value = selectedGoalsMonthFilter;
}

function filterGoalsByMonth() {
    const monthFilter = document.getElementById('goals-month-filter');
    const quarterFilter = document.getElementById('goals-quarter-filter');
    if (!monthFilter || !quarterFilter) return;
    
    selectedGoalsMonthFilter = monthFilter.value;
    
    // If month is selected, reset quarter to "all"
    if (selectedGoalsMonthFilter) {
        selectedGoalsQuarterFilter = '';
        quarterFilter.value = '';
    }
    
    // Reload statistics to apply filter
    loadStatistics();
}

function populateGoalsQuarterFilter(completedMatches) {
    const quarterFilter = document.getElementById('goals-quarter-filter');
    if (!quarterFilter) return;
    
    // Get all unique quarters from completed matches
    const quarterSet = new Set();
    completedMatches.forEach(match => {
        if (match.date) {
            const [year, month] = match.date.substring(0, 7).split('-');
            const monthNum = parseInt(month);
            let quarter;
            if (monthNum >= 1 && monthNum <= 3) quarter = 'Q1';
            else if (monthNum >= 4 && monthNum <= 6) quarter = 'Q2';
            else if (monthNum >= 7 && monthNum <= 9) quarter = 'Q3';
            else quarter = 'Q4';
            const quarterKey = `${year}-${quarter}`;
            quarterSet.add(quarterKey);
        }
    });
    
    // Convert to array and sort descending (newest first)
    const quarters = Array.from(quarterSet).sort((a, b) => {
        return b.localeCompare(a); // Descending order
    });
    
    // Clear existing options except "Tất cả các quý"
    quarterFilter.innerHTML = '<option value="">Tất cả các quý</option>';
    
    // Add quarter options
    quarters.forEach(quarterKey => {
        const [year, quarter] = quarterKey.split('-');
        const quarterNames = { 'Q1': 'Quý 1', 'Q2': 'Quý 2', 'Q3': 'Quý 3', 'Q4': 'Quý 4' };
        const quarterName = quarterNames[quarter];
        const option = document.createElement('option');
        option.value = quarterKey;
        option.textContent = `${quarterName}/${year}`;
        quarterFilter.appendChild(option);
    });
    
    // Set selected value
    quarterFilter.value = selectedGoalsQuarterFilter;
}

function filterGoalsByQuarter() {
    const monthFilter = document.getElementById('goals-month-filter');
    const quarterFilter = document.getElementById('goals-quarter-filter');
    if (!monthFilter || !quarterFilter) return;
    
    selectedGoalsQuarterFilter = quarterFilter.value;
    
    // If quarter is selected, reset month to "all"
    if (selectedGoalsQuarterFilter) {
        selectedGoalsMonthFilter = '';
        monthFilter.value = '';
    }
    
    // Reload statistics to apply filter
    loadStatistics();
}

function populateParticipationMonthFilter(completedMatches) {
    const monthFilter = document.getElementById('participation-month-filter');
    if (!monthFilter) return;
    
    // Get all unique months from completed matches
    const monthSet = new Set();
    completedMatches.forEach(match => {
        if (match.date) {
            const month = match.date.substring(0, 7); // YYYY-MM
            monthSet.add(month);
        }
    });
    
    // Convert to array and sort descending (newest first)
    const months = Array.from(monthSet).sort((a, b) => {
        return b.localeCompare(a); // Descending order
    });
    
    // Clear existing options except "Tất cả các tháng"
    monthFilter.innerHTML = '<option value="">Tất cả các tháng</option>';
    
    // Add month options
    months.forEach(month => {
        const [year, monthNum] = month.split('-');
        const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                          'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
        const monthName = monthNames[parseInt(monthNum) - 1];
        const option = document.createElement('option');
        option.value = month;
        option.textContent = `${monthName}/${year}`;
        monthFilter.appendChild(option);
    });
    
    // Set selected value
    monthFilter.value = selectedParticipationMonthFilter;
}

function filterParticipationByMonth() {
    const monthFilter = document.getElementById('participation-month-filter');
    const quarterFilter = document.getElementById('participation-quarter-filter');
    if (!monthFilter || !quarterFilter) return;
    
    selectedParticipationMonthFilter = monthFilter.value;
    
    // If month is selected, reset quarter to "all"
    if (selectedParticipationMonthFilter) {
        selectedParticipationQuarterFilter = '';
        quarterFilter.value = '';
    }
    
    // Reload statistics to apply filter
    loadStatistics();
}

function populateParticipationQuarterFilter(completedMatches) {
    const quarterFilter = document.getElementById('participation-quarter-filter');
    if (!quarterFilter) return;
    
    // Get all unique quarters from completed matches
    const quarterSet = new Set();
    completedMatches.forEach(match => {
        if (match.date) {
            const [year, month] = match.date.substring(0, 7).split('-');
            const monthNum = parseInt(month);
            let quarter;
            if (monthNum >= 1 && monthNum <= 3) quarter = 'Q1';
            else if (monthNum >= 4 && monthNum <= 6) quarter = 'Q2';
            else if (monthNum >= 7 && monthNum <= 9) quarter = 'Q3';
            else quarter = 'Q4';
            const quarterKey = `${year}-${quarter}`;
            quarterSet.add(quarterKey);
        }
    });
    
    // Convert to array and sort descending (newest first)
    const quarters = Array.from(quarterSet).sort((a, b) => {
        return b.localeCompare(a); // Descending order
    });
    
    // Clear existing options except "Tất cả các quý"
    quarterFilter.innerHTML = '<option value="">Tất cả các quý</option>';
    
    // Add quarter options
    quarters.forEach(quarterKey => {
        const [year, quarter] = quarterKey.split('-');
        const quarterNames = { 'Q1': 'Quý 1', 'Q2': 'Quý 2', 'Q3': 'Quý 3', 'Q4': 'Quý 4' };
        const quarterName = quarterNames[quarter];
        const option = document.createElement('option');
        option.value = quarterKey;
        option.textContent = `${quarterName}/${year}`;
        quarterFilter.appendChild(option);
    });
    
    // Set selected value
    quarterFilter.value = selectedParticipationQuarterFilter;
}

function filterParticipationByQuarter() {
    const monthFilter = document.getElementById('participation-month-filter');
    const quarterFilter = document.getElementById('participation-quarter-filter');
    if (!monthFilter || !quarterFilter) return;
    
    selectedParticipationQuarterFilter = quarterFilter.value;
    
    // If quarter is selected, reset month to "all"
    if (selectedParticipationQuarterFilter) {
        selectedParticipationMonthFilter = '';
        monthFilter.value = '';
    }
    
    // Reload statistics to apply filter
    loadStatistics();
}

function populateTop3MonthFilter(completedMatches) {
    const monthFilter = document.getElementById('top3-month-filter');
    if (!monthFilter) return;
    
    // Get all unique months from completed matches
    const monthSet = new Set();
    completedMatches.forEach(match => {
        if (match.date) {
            const month = match.date.substring(0, 7); // YYYY-MM
            monthSet.add(month);
        }
    });
    
    // Convert to array and sort descending (newest first)
    const months = Array.from(monthSet).sort((a, b) => {
        return b.localeCompare(a); // Descending order
    });
    
    // Clear existing options except "Tất cả các tháng"
    monthFilter.innerHTML = '<option value="">Tất cả các tháng</option>';
    
    // Add month options
    months.forEach(month => {
        const [year, monthNum] = month.split('-');
        const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                          'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
        const monthName = monthNames[parseInt(monthNum) - 1];
        const option = document.createElement('option');
        option.value = month;
        option.textContent = `${monthName}/${year}`;
        monthFilter.appendChild(option);
    });
    
    // Set selected value
    monthFilter.value = selectedTop3MonthFilter;
}

function filterTop3ByMonth() {
    const monthFilter = document.getElementById('top3-month-filter');
    const quarterFilter = document.getElementById('top3-quarter-filter');
    if (!monthFilter || !quarterFilter) return;
    
    selectedTop3MonthFilter = monthFilter.value;
    
    // If month is selected, reset quarter to "all"
    if (selectedTop3MonthFilter) {
        selectedTop3QuarterFilter = '';
        quarterFilter.value = '';
    }
    
    // Reload statistics to apply filter
    loadStatistics();
}

function populateTop3QuarterFilter(completedMatches) {
    const quarterFilter = document.getElementById('top3-quarter-filter');
    if (!quarterFilter) return;
    
    // Get all unique quarters from completed matches
    const quarterSet = new Set();
    completedMatches.forEach(match => {
        if (match.date) {
            const [year, month] = match.date.substring(0, 7).split('-');
            const monthNum = parseInt(month);
            let quarter;
            if (monthNum >= 1 && monthNum <= 3) quarter = 'Q1';
            else if (monthNum >= 4 && monthNum <= 6) quarter = 'Q2';
            else if (monthNum >= 7 && monthNum <= 9) quarter = 'Q3';
            else quarter = 'Q4';
            const quarterKey = `${year}-${quarter}`;
            quarterSet.add(quarterKey);
        }
    });
    
    // Convert to array and sort descending (newest first)
    const quarters = Array.from(quarterSet).sort((a, b) => {
        return b.localeCompare(a); // Descending order
    });
    
    // Clear existing options except "Tất cả các quý"
    quarterFilter.innerHTML = '<option value="">Tất cả các quý</option>';
    
    // Add quarter options
    quarters.forEach(quarterKey => {
        const [year, quarter] = quarterKey.split('-');
        const quarterNames = { 'Q1': 'Quý 1', 'Q2': 'Quý 2', 'Q3': 'Quý 3', 'Q4': 'Quý 4' };
        const quarterName = quarterNames[quarter];
        const option = document.createElement('option');
        option.value = quarterKey;
        option.textContent = `${quarterName}/${year}`;
        quarterFilter.appendChild(option);
    });
    
    // Set selected value
    quarterFilter.value = selectedTop3QuarterFilter;
}

function filterTop3ByQuarter() {
    const monthFilter = document.getElementById('top3-month-filter');
    const quarterFilter = document.getElementById('top3-quarter-filter');
    if (!monthFilter || !quarterFilter) return;
    
    selectedTop3QuarterFilter = quarterFilter.value;
    
    // If quarter is selected, reset month to "all"
    if (selectedTop3QuarterFilter) {
        selectedTop3MonthFilter = '';
        monthFilter.value = '';
    }
    
    // Reload statistics to apply filter
    loadStatistics();
}

function renderMatches() {
    const container = document.getElementById('matches-list');
    if (!container) return;
    
    if (matches.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>Chưa có lịch thi đấu</h3><p>Click "Thêm lịch thi đấu" để thêm trận đấu mới</p></div>';
        return;
    }
    
    // Sort matches by date (oldest first for timeline)
    const sortedMatches = [...matches].sort((a, b) => {
        const dateA = new Date(a.date + 'T00:00:00').getTime();
        const dateB = new Date(b.date + 'T00:00:00').getTime();
        return dateA - dateB;
    });
    
    // Group matches by date
    const matchesByDate = {};
    sortedMatches.forEach(match => {
        const dateKey = match.date; // YYYY-MM-DD
        if (!matchesByDate[dateKey]) {
            matchesByDate[dateKey] = [];
        }
        matchesByDate[dateKey].push(match);
    });
    
    // Render timeline
    container.innerHTML = Object.keys(matchesByDate).map(dateKey => {
        const dateMatches = matchesByDate[dateKey];
        const matchDate = new Date(dateKey + 'T00:00:00');
        const dateStr = matchDate.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });
        const day = String(matchDate.getDate()).padStart(2, '0');
        const month = String(matchDate.getMonth() + 1).padStart(2, '0');
        const year = matchDate.getFullYear();
        
        return `
            <div class="timeline-date-group">
                <div class="timeline-date-header">
                    <h3>LỊCH THI ĐẤU NGÀY ${day}-${month}</h3>
                </div>
                <div class="timeline-items">
                    ${dateMatches.map(match => {
                        // Parse datetime from match.date (YYYY-MM-DD) and use stored time or default 19:00
                        const matchDateObj = new Date(match.date + 'T00:00:00');
                        const hours = matchDateObj.getHours() || 19;
                        const minutes = matchDateObj.getMinutes() || 0;
                        const timeStr = `${String(hours).padStart(2, '0')}H${String(minutes).padStart(2, '0')}`;
                        const dateDisplay = `${timeStr} NGÀY ${day}/${month}/${year}`;
                        const opponentName = match.opponent ? match.opponent.name : `Opponent ID: ${match.opponent_id}`;
                        
                        return `
                            <div class="timeline-match">
                                <div class="match-time">${dateDisplay}</div>
                                <div class="match-card">
                                    <div class="match-team-left">
                                        <span class="team-name">FC GREEN</span>
                                    </div>
                                    <div class="match-vs">VS</div>
                                    <div class="match-team-right">
                                        <span class="team-name">${escapeHtml(opponentName)}</span>
                                    </div>
                                    <div class="match-actions" ${!isLoggedIn ? 'style="display: none;"' : ''}>
                                        <button class="btn btn-primary btn-small" onclick="editMatch('${String(match.id || '').replace(/'/g, "\\'")}')">Sửa</button>
                                        <button class="btn btn-danger btn-small" onclick="deleteMatch('${String(match.id || '').replace(/'/g, "\\'")}')">Xóa</button>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function updateOpponentSelects() {
    const matchOpponentSelect = document.getElementById('match-opponent-id');
    if (matchOpponentSelect) {
        const currentValue = matchOpponentSelect.value;
        matchOpponentSelect.innerHTML = '<option value="">Chọn đối thủ</option>' + 
            opponents.map(opponent => `<option value="${opponent.id}">${escapeHtml(opponent.name)}</option>`).join('');
        if (currentValue) matchOpponentSelect.value = currentValue;
    }
}

function openOpponentModalFromMatch() {
    // Lưu callback để cập nhật select sau khi thêm opponent
    openOpponentModalCallback = (opponentId) => {
        if (opponentId) {
            document.getElementById('match-opponent-id').value = opponentId;
        }
    };
    openOpponentModal();
}

function openMatchModal(matchId = null) {
    editingMatchId = matchId;
    const modal = document.getElementById('match-modal');
    const form = document.getElementById('match-form');
    const title = document.getElementById('match-modal-title');
    
    updateOpponentSelects();
    
    if (matchId) {
        title.textContent = 'Sửa lịch thi đấu';
        const match = matches.find(m => m.id === matchId);
        if (match) {
            document.getElementById('match-id').value = match.id;
            document.getElementById('match-opponent-id').value = match.opponent_id;
            
            // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
            // Set checkbox based on is_completed field (handle undefined/null as false)
            const isCompletedCheckbox = document.getElementById('match-is-completed');
            if (isCompletedCheckbox) {
                isCompletedCheckbox.checked = match.is_completed === true || match.is_completed === 1;
            }
            const matchDate = new Date(match.date + 'T00:00:00');
            const year = matchDate.getFullYear();
            const month = String(matchDate.getMonth() + 1).padStart(2, '0');
            const day = String(matchDate.getDate()).padStart(2, '0');
            document.getElementById('match-date').value = `${year}-${month}-${day}T19:00`;
        }
    } else {
        title.textContent = 'Thêm lịch thi đấu';
        form.reset();
        document.getElementById('match-id').value = '';
        
        // Set default time to 19:00 today
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        document.getElementById('match-date').value = `${year}-${month}-${day}T19:00`;
        document.getElementById('match-is-completed').checked = false;
    }
    
    modal.classList.add('active');
}

function closeMatchModal() {
    document.getElementById('match-modal').classList.remove('active');
    document.getElementById('match-form').reset();
    editingMatchId = null;
}

async function saveMatch(event) {
    event.preventDefault();
    showLoading();
    
    const dateTimeStr = document.getElementById('match-date').value;
    if (!dateTimeStr) {
        alert('Vui lòng chọn thời gian thi đấu');
        hideLoading();
        return;
    }
    
    // Convert datetime-local value to ISO date string (YYYY-MM-DD)
    const dateTime = new Date(dateTimeStr);
    const year = dateTime.getFullYear();
    const month = String(dateTime.getMonth() + 1).padStart(2, '0');
    const day = String(dateTime.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // Get is_completed checkbox value
    const isCompletedCheckbox = document.getElementById('match-is-completed');
    const isCompleted = isCompletedCheckbox ? isCompletedCheckbox.checked : false;
    
    try {
        if (editingMatchId) {
            // Update: send fields that can be changed (date, opponent_id, is_completed)
            // Don't send result, scores as they should be updated separately after the match
            const formData = {
                opponent_id: document.getElementById('match-opponent-id').value,
                date: dateStr,
                is_completed: isCompleted,
            };
            await matchesAPI.update(editingMatchId, formData);
        } else {
            // Create: use default values
            const formData = {
                opponent_id: document.getElementById('match-opponent-id').value,
                date: dateStr,
                result: 'draw', // Default value (sẽ được cập nhật sau khi thi đấu)
                our_score: 0,
                opponent_score: 0,
                is_completed: isCompleted,
            };
            await matchesAPI.create(formData);
        }
        closeMatchModal();
        await loadMatches();
        // Update opponents to refresh head-to-head records
        if (opponents.length > 0) renderOpponents();
    } catch (error) {
        alert('Error saving match: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function editMatch(id) {
    openMatchModal(id);
}

async function deleteMatch(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa lịch thi đấu này?')) {
        return;
    }
    
    showLoading();
    try {
        await matchesAPI.delete(id);
        await loadMatches();
        // Update opponents to refresh head-to-head records
        if (opponents.length > 0) renderOpponents();
    } catch (error) {
        alert('Error deleting match: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Utility function
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Upcoming Match Modal functions
function getUpcomingMatch() {
    if (matches.length === 0) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filter matches with date >= today and sort by date ascending
    const upcomingMatches = matches
        .filter(match => {
            const matchDate = new Date(match.date + 'T00:00:00');
            matchDate.setHours(0, 0, 0, 0);
            return matchDate >= today;
        })
        .sort((a, b) => {
            const dateA = new Date(a.date + 'T00:00:00');
            const dateB = new Date(b.date + 'T00:00:00');
            return dateA - dateB;
        });
    
    return upcomingMatches.length > 0 ? upcomingMatches[0] : null;
}

function renderUpcomingMatchModal() {
    const content = document.getElementById('upcoming-match-content');
    if (!content) return;
    
    const upcomingMatch = getUpcomingMatch();
    
    if (!upcomingMatch) {
        content.innerHTML = `
            <div class="circle-match-content">
                <div class="circle-match-icon">⚽</div>
                <h2>Chưa có lịch thi đấu</h2>
                <p>Chưa có trận đấu nào sắp tới</p>
            </div>
        `;
        return;
    }
    
    const matchDate = new Date(upcomingMatch.date + 'T00:00:00');
    const day = String(matchDate.getDate()).padStart(2, '0');
    const month = String(matchDate.getMonth() + 1).padStart(2, '0');
    const year = matchDate.getFullYear();
    const timeStr = '19H00'; // Default time
    const opponentName = upcomingMatch.opponent ? upcomingMatch.opponent.name : `Opponent ID: ${upcomingMatch.opponent_id}`;
    
    content.innerHTML = `
        <div class="circle-match-content">
            <div class="circle-match-header">
                <h2>TRẬN ĐẤU TIẾP THEO</h2>
            </div>
            <div class="circle-match-date">
                <div class="circle-match-time">${timeStr}</div>
                <div class="circle-match-date-text">NGÀY ${day}/${month}/${year}</div>
            </div>
            <div class="circle-match-teams">
                <div class="circle-match-team">
                    <div class="circle-match-team-name">FC GREEN</div>
                </div>
                <div class="circle-match-vs">VS</div>
                <div class="circle-match-team">
                    <div class="circle-match-team-name">${escapeHtml(opponentName)}</div>
                </div>
            </div>
        </div>
    `;
}

function showUpcomingMatchModal() {
    renderUpcomingMatchModal();
    const modal = document.getElementById('upcoming-match-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeUpcomingMatchModal() {
    const modal = document.getElementById('upcoming-match-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Match Result Modal functions
function openMatchResultModal(matchId) {
    editingMatchResultId = matchId;
    const modal = document.getElementById('match-result-modal');
    const form = document.getElementById('match-result-form');
    const match = matches.find(m => m.id === matchId);
    
    if (!match) {
        alert('Match not found');
        return;
    }
    
    // Populate form with existing data
    const resultRadio = document.querySelector(`input[name="match-result"][value="${match.result || 'draw'}"]`);
    if (resultRadio) resultRadio.checked = true;
    
    document.getElementById('match-our-score').value = match.our_score || 0;
    document.getElementById('match-opponent-score').value = match.opponent_score || 0;
    document.getElementById('match-result-opponent-label').textContent = match.opponent ? match.opponent.name : 'Đối thủ';
    
    // Load participants
    renderMatchParticipants(match.participant_ids || []);
    
    // Load goals
    const goalsContainer = document.getElementById('match-goals-container');
    goalsContainer.innerHTML = '';
    
    if (match.goals && match.goals.length > 0) {
        match.goals.forEach(goal => {
            addGoalEntryRow(goal.player_id, goal.goals);
        });
    }
    
    modal.classList.add('active');
}

function renderMatchParticipants(selectedPlayerIds = []) {
    const container = document.getElementById('match-participants-container');
    if (!container) return;
    
    if (players.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Chưa có cầu thủ nào. Vui lòng thêm cầu thủ trước.</p></div>';
        return;
    }
    
    // Normalize selectedPlayerIds to strings for comparison
    const normalizedSelectedIds = selectedPlayerIds.map(id => String(id));
    
    container.innerHTML = players.map(player => {
        const playerIdStr = String(player.id);
        const isChecked = normalizedSelectedIds.includes(playerIdStr);
        return `
            <label class="position-checkbox" style="display: flex; align-items: center; padding: 8px 12px; border: 2px solid #e9ecef; border-radius: 6px; cursor: pointer; transition: all 0.2s; background: white; margin-bottom: 8px;">
                <input type="checkbox" value="${playerIdStr}" ${isChecked ? 'checked' : ''} style="margin-right: 8px; cursor: pointer; width: 18px; height: 18px;">
                <span style="flex: 1; color: #333; font-size: 0.95em;">${escapeHtml(player.name)}${player.jersey_number ? ` (#${player.jersey_number})` : ''}</span>
            </label>
        `;
    }).join('');
}

function closeMatchResultModal() {
    document.getElementById('match-result-modal').classList.remove('active');
    document.getElementById('match-result-form').reset();
    document.getElementById('match-goals-container').innerHTML = '';
    document.getElementById('match-participants-container').innerHTML = '';
    editingMatchResultId = null;
}

function addGoalEntry() {
    addGoalEntryRow(null, 1);
}

function addGoalEntryRow(playerId = null, goals = 1) {
    const container = document.getElementById('match-goals-container');
    const goalRow = document.createElement('div');
    goalRow.className = 'goal-entry-row';
    goalRow.style.cssText = 'display: flex; gap: 10px; align-items: center; margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 6px;';
    
    const playerSelect = document.createElement('select');
    playerSelect.required = true;
    playerSelect.style.cssText = 'flex: 1; padding: 8px; border: 2px solid #e9ecef; border-radius: 6px;';
    playerSelect.innerHTML = '<option value="">Chọn cầu thủ</option>' + 
        players.map(p => `<option value="${p.id}" ${playerId === p.id ? 'selected' : ''}>${escapeHtml(p.name)}${p.jersey_number ? ` (#${p.jersey_number})` : ''}</option>`).join('');
    
    const goalsInput = document.createElement('input');
    goalsInput.type = 'number';
    goalsInput.min = '1';
    goalsInput.value = goals;
    goalsInput.required = true;
    goalsInput.placeholder = 'Số bàn';
    goalsInput.style.cssText = 'width: 100px; padding: 8px; border: 2px solid #e9ecef; border-radius: 6px;';
    
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '×';
    removeBtn.className = 'btn btn-danger btn-small';
    removeBtn.style.cssText = 'padding: 8px 12px;';
    removeBtn.onclick = () => goalRow.remove();
    
    goalRow.appendChild(playerSelect);
    goalRow.appendChild(goalsInput);
    goalRow.appendChild(removeBtn);
    container.appendChild(goalRow);
}

async function saveMatchResult(event) {
    event.preventDefault();
    showLoading();
    
    try {
        const result = document.querySelector('input[name="match-result"]:checked').value;
        const ourScore = parseInt(document.getElementById('match-our-score').value);
        const opponentScore = parseInt(document.getElementById('match-opponent-score').value);
        
        // Get selected participants (keep as strings since Firestore uses string IDs)
        const participantCheckboxes = document.querySelectorAll('#match-participants-container input[type="checkbox"]:checked');
        const participantIds = Array.from(participantCheckboxes).map(cb => cb.value);
        
        if (participantIds.length === 0) {
            alert('Vui lòng chọn ít nhất 1 cầu thủ tham gia trận đấu');
            hideLoading();
            return;
        }
        
        const goalRows = document.querySelectorAll('.goal-entry-row');
        const goals = [];
        goalRows.forEach(row => {
            const playerId = row.querySelector('select').value;
            const goalsCount = parseInt(row.querySelector('input[type="number"]').value);
            if (playerId && goalsCount > 0) {
                goals.push({ player_id: playerId, goals: goalsCount });
            }
        });
        
        const resultData = {
            result: result,
            our_score: ourScore,
            opponent_score: opponentScore,
            goals: goals,
            participant_ids: participantIds
        };
        
        await matchesAPI.updateResult(editingMatchResultId, resultData);
        closeMatchResultModal();
        await loadMatches();
        // Update opponents to refresh head-to-head records
        if (opponents.length > 0) renderOpponents();
    } catch (error) {
        alert('Error saving match result: ' + error.message);
    } finally {
        hideLoading();
    }
}

function editMatchResult(id) {
    openMatchResultModal(id);
}

// Participation Statistics functions
function renderParticipationStatistics(completedMatches) {
    const container = document.getElementById('participation-table-wrapper');
    if (!container) return;
    
    // Filter by month or quarter if selected
    let filteredMatches = completedMatches;
    if (selectedParticipationMonthFilter) {
        filteredMatches = completedMatches.filter(match => {
            if (!match.date) return false;
            const matchMonth = match.date.substring(0, 7); // Get YYYY-MM
            return matchMonth === selectedParticipationMonthFilter;
        });
    } else if (selectedParticipationQuarterFilter) {
        filteredMatches = completedMatches.filter(match => {
            if (!match.date) return false;
            const [year, month] = match.date.substring(0, 7).split('-');
            const monthNum = parseInt(month);
            let quarter;
            if (monthNum >= 1 && monthNum <= 3) quarter = 'Q1';
            else if (monthNum >= 4 && monthNum <= 6) quarter = 'Q2';
            else if (monthNum >= 7 && monthNum <= 9) quarter = 'Q3';
            else quarter = 'Q4';
            const matchQuarter = `${year}-${quarter}`;
            return matchQuarter === selectedParticipationQuarterFilter;
        });
    }
    
    // Populate month and quarter filter dropdowns
    populateParticipationMonthFilter(completedMatches);
    populateParticipationQuarterFilter(completedMatches);
    
    if (filteredMatches.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Chưa có dữ liệu tham gia trận đấu</p></div>';
        return;
    }
    
    // Get all unique match dates (sorted) - use filtered matches
    const allMatchDates = [...new Set(filteredMatches.map(m => m.date))].sort();
    
    // Build participation data: { playerId: { name, matches: { date: 1/0 }, totalParticipated, totalNotParticipated } }
    const participationData = {};
    
    // Initialize all players
    players.forEach(player => {
        participationData[player.id] = {
            name: player.name,
            matches: {},
            totalParticipated: 0,
            totalNotParticipated: 0
        };
    });
    
    // Process each match (use filtered matches)
    filteredMatches.forEach(match => {
        const matchDate = match.date;
        const participantIds = match.participant_ids || [];
        
        // For each player, mark if they participated
        players.forEach(player => {
            if (!participationData[player.id]) {
                participationData[player.id] = {
                    name: player.name,
                    matches: {},
                    totalParticipated: 0,
                    totalNotParticipated: 0
                };
            }
            
            const participated = participantIds.includes(player.id) ? 1 : 0;
            participationData[player.id].matches[matchDate] = participated;
            
            if (participated === 1) {
                participationData[player.id].totalParticipated++;
            } else {
                participationData[player.id].totalNotParticipated++;
            }
        });
    });
    
    // Convert to array and calculate participation rate for sorting
    const participationArray = Object.values(participationData).map(playerData => {
        const totalMatches = playerData.totalParticipated + playerData.totalNotParticipated;
        const participationRate = totalMatches > 0 
            ? parseFloat(((playerData.totalParticipated / totalMatches) * 100).toFixed(1))
            : 0.0;
        return {
            ...playerData,
            participationRate: participationRate
        };
    });
    
    // Sort by participation rate if needed
    if (participationTableSortState.column === 'rate') {
        participationArray.sort((a, b) => {
            if (participationTableSortState.direction === 'desc') {
                return b.participationRate - a.participationRate; // High to low
            } else {
                return a.participationRate - b.participationRate; // Low to high
            }
        });
    }
    
    // Build table rows
    let tableRows = '';
    participationArray.forEach(playerData => {
        let rowCells = `<td><strong>${escapeHtml(playerData.name)}</strong></td>`;
        
        // Add participation status for each match date
        allMatchDates.forEach(date => {
            const status = playerData.matches[date] !== undefined ? playerData.matches[date] : 0;
            const statusClass = status === 1 ? 'participation-yes' : 'participation-no';
            rowCells += `<td class="${statusClass}">${status}</td>`;
        });
        
        // Format participation rate
        const participationRateText = playerData.participationRate.toFixed(1);
        
        // Color: red if < 50%, blue otherwise
        const rateColor = playerData.participationRate < 50 ? '#dc3545' : '#667eea';
        
        // Add totals with classes for sticky positioning (order: Tổng tham gia, Tổng không tham gia, Tỉ lệ tham gia)
        rowCells += `<td class="participation-total-participated"><strong style="color: #28a745;">${playerData.totalParticipated}</strong></td>`;
        rowCells += `<td class="participation-total-not-participated"><strong style="color: #dc3545;">${playerData.totalNotParticipated}</strong></td>`;
        rowCells += `<td class="participation-rate"><strong style="color: ${rateColor};">${participationRateText}%</strong></td>`;
        
        tableRows += `<tr>${rowCells}</tr>`;
    });
    
    // Build date headers
    let dateHeaders = '';
    if (allMatchDates.length > 0) {
        dateHeaders = allMatchDates.map(date => {
            const dateObj = new Date(date + 'T00:00:00');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            return `<th>${day}/${month}</th>`;
        }).join('');
    }
    
    // Sort indicator for participation rate column
    const sortIcon = participationTableSortState.direction === 'desc' ? '▼' : '▲';
    const sortStyle = 'cursor: pointer; user-select: none;';
    
    container.innerHTML = `
        <div class="participation-table-scroll">
            <table class="participation-table">
                <thead>
                    <tr>
                        <th class="participation-player-name">Tên cầu thủ</th>
                        ${dateHeaders}
                        <th class="participation-total-participated-header" style="background: #28a745; color: white;">V</th>
                        <th class="participation-total-not-participated-header" style="background: #dc3545; color: white;">X</th>
                        <th id="participation-rate-header" class="participation-rate-header" style="background: #667eea; color: white; ${sortStyle}" onclick="sortParticipationTable('rate')">
                            % ${sortIcon}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;
}

function sortParticipationTable(column) {
    if (participationTableSortState.column === column) {
        // Toggle direction
        participationTableSortState.direction = participationTableSortState.direction === 'desc' ? 'asc' : 'desc';
    } else {
        // New column, default to desc
        participationTableSortState.column = column;
        participationTableSortState.direction = 'desc';
    }
    
    // Re-render the participation table
    const allMatches = matches.filter(m => m.is_completed === true || m.is_completed === 1);
    renderParticipationStatistics(allMatches);
}


// Login functions
function checkLoginStatus() {
    const savedLogin = localStorage.getItem('fcgreen_logged_in');
    if (savedLogin === 'true') {
        isLoggedIn = true;
        updateUIForLogin();
    } else {
        isLoggedIn = false;
        updateUIForLogout();
    }
}

function openLoginModal() {
    document.getElementById('login-modal').classList.add('active');
    document.getElementById('login-username').focus();
}

function closeLoginModal() {
    document.getElementById('login-modal').classList.remove('active');
    document.getElementById('login-form').reset();
    document.getElementById('login-error').style.display = 'none';
}

function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    
    if (username === 'fcgreen' && password === '123') {
        isLoggedIn = true;
        localStorage.setItem('fcgreen_logged_in', 'true');
        closeLoginModal();
        updateUIForLogin();
    } else {
        errorDiv.textContent = 'Username hoặc password không đúng!';
        errorDiv.style.display = 'block';
    }
}

function logout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        isLoggedIn = false;
        localStorage.removeItem('fcgreen_logged_in');
        updateUIForLogout();
    }
}

function updateUIForLogin() {
    // Show logout button, hide login button
    document.getElementById('login-btn').style.display = 'none';
    document.getElementById('logout-btn').style.display = 'block';
    
    // Show all header action buttons
    document.querySelectorAll('.section-header .btn-primary').forEach(btn => {
        btn.style.display = '';
    });
    
    // Re-render to show action buttons in cards
    if (players.length > 0) renderPlayers();
    if (opponents.length > 0) renderOpponents();
    if (matches.length > 0) {
        renderUpcomingMatches();
        renderCompletedMatches();
    }
}

function updateUIForLogout() {
    // Show login button, hide logout button
    document.getElementById('login-btn').style.display = 'block';
    document.getElementById('logout-btn').style.display = 'none';
    
    // Hide all header action buttons
    document.querySelectorAll('.section-header .btn-primary').forEach(btn => {
        btn.style.display = 'none';
    });
    
    // Re-render to hide action buttons in cards
    if (players.length > 0) renderPlayers();
    if (opponents.length > 0) renderOpponents();
    if (matches.length > 0) {
        renderUpcomingMatches();
        renderCompletedMatches();
    }
}
