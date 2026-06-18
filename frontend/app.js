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
let goalsBubbleChart = null;
let statsCharts = {
    goalsByPlayer: null,
    goalsPerMonth: null,
    participation: null,
    topScorersTrend: null
};
let statsTimelineView = 'month';
let openOpponentModalCallback = null; // Callback khi thêm opponent từ match modal
let isLoggedIn = false; // Login state
const CACHE_STORAGE_PREFIX = 'fcgreen_cache_';
const dataCache = {};
let playersLoadPromise = null;
let playerSearchQuery = '';
let playerPositionFilter = '';
let playerSortBy = 'participation';
let opponentSearchQuery = '';
let opponentSortBy = 'strength';

function getCachedData(cacheKey) {
    if (dataCache[cacheKey]?.data != null) {
        return dataCache[cacheKey].data;
    }
    try {
        const raw = localStorage.getItem(CACHE_STORAGE_PREFIX + cacheKey);
        if (raw) {
            const parsed = JSON.parse(raw);
            dataCache[cacheKey] = { data: parsed, fetchedAt: Date.now() };
            return parsed;
        }
    } catch (e) {
        console.warn('Cache read failed:', cacheKey, e);
    }
    return null;
}

function setCachedData(cacheKey, data) {
    dataCache[cacheKey] = { data, fetchedAt: Date.now() };
    try {
        localStorage.setItem(CACHE_STORAGE_PREFIX + cacheKey, JSON.stringify(data));
    } catch (e) {
        console.warn('Cache write failed:', cacheKey, e);
    }
}

function invalidateCache(cacheKey) {
    delete dataCache[cacheKey];
    try {
        localStorage.removeItem(CACHE_STORAGE_PREFIX + cacheKey);
    } catch (e) {
        console.warn('Cache invalidate failed:', cacheKey, e);
    }
}

function invalidateMatchesCache() {
    invalidateCache('matches');
}

function dataEquals(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}

/** Stale-while-revalidate: fill UI from cache/memory first, fetch API, re-render only if data changed */
async function refreshResource(cacheKey, fetchFn, applyFn, { forceRefresh = false, staleData = null } = {}) {
    const cached = !forceRefresh ? (getCachedData(cacheKey) ?? staleData) : null;
    let showedLoading = false;

    if (cached != null) {
        applyFn(cached);
    } else {
        showLoading();
        showedLoading = true;
    }

    try {
        const fresh = await fetchFn();
        const changed = cached == null || !dataEquals(cached, fresh);
        if (changed) {
            setCachedData(cacheKey, fresh);
            applyFn(fresh);
        }
        return fresh;
    } catch (error) {
        if (cached != null) {
            console.warn(`Using cached "${cacheKey}" after fetch error`, error);
            return cached;
        }
        throw error;
    } finally {
        if (showedLoading) {
            hideLoading();
        }
    }
}

async function ensurePlayersLoaded({ forceRefresh = false, skipRender = false } = {}) {
    if (players.length > 0 && !forceRefresh) {
        return players;
    }
    if (playersLoadPromise) {
        return playersLoadPromise;
    }

    playersLoadPromise = refreshResource(
        'players',
        () => playersAPI.getAll(),
        (data) => {
            players = data;
            if (!skipRender) {
                renderPlayers();
            }
            updateHeaderStats();
        },
        { forceRefresh }
    ).finally(() => {
        playersLoadPromise = null;
    });

    return playersLoadPromise;
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Check login status
    checkLoginStatus();
    
    setupTabs();
    setupPlayerFilters();
    setupOpponentFilters();
    setupProfileDropdown();
    loadTeams();
    // Load opponents and matches, then render opponents after both are loaded
    Promise.all([
        ensurePlayersLoaded(),
        loadOpponents(),
        loadMatches()
    ]).then(() => {
        // Re-render opponents after matches are loaded to show head-to-head records
        if (opponents.length > 0) renderOpponents();
        showUpcomingMatchModal(); // Show upcoming match modal after matches are loaded
    }).catch((error) => {
        console.error('Initial data load failed:', error);
        resetLoading();
    });

    // Safety net: never leave the loading overlay stuck if an API hangs
    setTimeout(resetLoading, 20000);
    setupTabChangeListeners();
    
    // Add click listener to header brand
    const headerBrand = document.querySelector('.header-brand');
    if (headerBrand) {
        headerBrand.addEventListener('click', () => {
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
            
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            });
            button.classList.add('active');
            button.setAttribute('aria-selected', 'true');
            
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
}

function setupPlayerFilters() {
    const searchInput = document.getElementById('player-search');
    const positionFilter = document.getElementById('player-position-filter');
    const sortSelect = document.getElementById('player-sort');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            playerSearchQuery = e.target.value.toLowerCase().trim();
            renderPlayers();
        });
    }
    if (positionFilter) {
        positionFilter.addEventListener('change', (e) => {
            playerPositionFilter = e.target.value;
            renderPlayers();
        });
    }
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            playerSortBy = e.target.value;
            renderPlayers();
        });
    }
}

function setupProfileDropdown() {
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('profile-dropdown');
        const menuBtn = document.getElementById('profile-menu-btn');
        if (dropdown && !dropdown.contains(e.target) && !menuBtn?.contains(e.target)) {
            closeProfileDropdown();
        }
        if (!e.target.closest('.player-card-menu') && !e.target.closest('.opponent-card-menu')) {
            closeAllPlayerMenus();
            closeAllOpponentMenus();
        }
    });
}

function toggleProfileDropdown(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('profile-dropdown');
    const btn = document.getElementById('profile-menu-btn');
    if (!dropdown) return;
    const isOpen = dropdown.classList.toggle('open');
    btn?.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

function closeProfileDropdown() {
    const dropdown = document.getElementById('profile-dropdown');
    const btn = document.getElementById('profile-menu-btn');
    dropdown?.classList.remove('open');
    btn?.setAttribute('aria-expanded', 'false');
}

function togglePlayerMenu(playerId, event) {
    event.stopPropagation();
    const menu = document.getElementById(`player-menu-${playerId}`);
    if (!menu) return;
    const isOpen = menu.classList.contains('open');
    closeAllPlayerMenus();
    if (!isOpen) menu.classList.add('open');
}

function closeAllPlayerMenus() {
    document.querySelectorAll('.menu-dropdown.open').forEach(menu => menu.classList.remove('open'));
}

function updateHeaderStats() {
    const statPlayers = document.getElementById('stat-players');
    const statGoals = document.getElementById('stat-goals');
    const statMatches = document.getElementById('stat-matches');
    const statRanking = document.getElementById('stat-ranking');
    const teamCountry = document.getElementById('header-team-country');

    if (statPlayers) statPlayers.textContent = players.length;
    if (statGoals) statGoals.textContent = players.reduce((sum, p) => sum + (p.total_goals || 0), 0);

    const completedMatches = matches.filter(m => m.is_completed === true || m.is_completed === 1);
    if (statMatches) statMatches.textContent = completedMatches.length;

    let wins = 0, draws = 0;
    completedMatches.forEach(m => {
        if (m.result === 'win') wins++;
        else if (m.result === 'draw') draws++;
    });
    const points = wins * 3 + draws;
    if (statRanking) statRanking.textContent = completedMatches.length > 0 ? points : '—';

    if (teamCountry && teams.length > 0) {
        teamCountry.textContent = teams[0].country || 'Football Club';
    }
}

function getFilteredSortedPlayers() {
    let filtered = [...players];

    if (playerSearchQuery) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(playerSearchQuery));
    }
    if (playerPositionFilter) {
        filtered = filtered.filter(p => {
            const positions = Array.isArray(p.position) ? p.position : [p.position];
            return positions.filter(Boolean).includes(playerPositionFilter);
        });
    }

    filtered.sort((a, b) => {
        if (playerSortBy === 'participation') {
            const diff = getPlayerMatchCount(b.id) - getPlayerMatchCount(a.id);
            return diff !== 0 ? diff : a.name.localeCompare(b.name, 'vi');
        }
        if (playerSortBy === 'goals') return (b.total_goals || 0) - (a.total_goals || 0);
        if (playerSortBy === 'jersey') return (a.jersey_number || 999) - (b.jersey_number || 999);
        return a.name.localeCompare(b.name, 'vi');
    });

    return filtered;
}

function getPlayerMatchCount(playerId) {
    return matches.filter(m =>
        (m.is_completed === true || m.is_completed === 1) &&
        (m.participant_ids || []).includes(playerId)
    ).length;
}

function getPlayerInitials(name) {
    return name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function getRoleBadgeClass(role) {
    if (role === 'Đội trưởng') return 'role-captain';
    if (role === 'Đội phó') return 'role-vice';
    return 'role-player';
}

function getRoleLabel(role) {
    if (role === 'Đội trưởng') return 'Captain';
    if (role === 'Đội phó') return 'Vice Captain';
    return 'Player';
}

function getRoleBadgeIcon(role) {
    if (role === 'Đội trưởng') return '⭐';
    if (role === 'Đội phó') return '🛡';
    return '';
}

function getPositionColorClass(position) {
    const gk = ['GK'];
    const cb = ['CB'];
    const fb = ['LB', 'RB', 'FB'];
    const mid = ['CM', 'CAM', 'CDM', 'LM', 'RM', 'LW', 'RW', 'DM', 'AM', 'W'];
    const st = ['ST', 'CF', 'SS'];
    if (gk.includes(position)) return 'pos-gk';
    if (cb.includes(position)) return 'pos-cb';
    if (fb.includes(position)) return 'pos-fb';
    if (mid.includes(position)) return 'pos-mid';
    if (st.includes(position)) return 'pos-st';
    return 'pos-default';
}

function getTopScorerIds() {
    if (players.length === 0) return new Set();
    const maxGoals = Math.max(...players.map(p => p.total_goals || 0));
    if (maxGoals <= 0) return new Set();
    return new Set(
        players.filter(p => (p.total_goals || 0) === maxGoals).map(p => p.id)
    );
}

function updatePlayerResultCount(count) {
    const el = document.getElementById('players-result-count');
    if (!el) return;
    const total = players.length;
    if (total === 0) {
        el.textContent = '';
        return;
    }
    if (count === total && !playerSearchQuery && !playerPositionFilter) {
        el.innerHTML = `<strong>${count}</strong> cầu thủ`;
    } else {
        el.innerHTML = `Tìm thấy <strong>${count}</strong> / ${total} cầu thủ`;
    }
}

function viewPlayerProfile(playerId) {
    editPlayer(playerId);
}

function viewPlayerStatistics() {
    const statsTab = document.querySelector('.tab-btn[data-tab="statistics"]');
    if (statsTab) statsTab.click();
    closeAllPlayerMenus();
}

function getPlayerImageUrl(player) {
    if (!player.profile_image) return '';
    if (player.profile_image.startsWith('http')) return player.profile_image;
    if (player.profile_image.startsWith('/')) return `${window.location.origin}${player.profile_image}`;
    return API_BASE_URL.startsWith('http')
        ? `${API_BASE_URL}${player.profile_image}`
        : `${window.location.origin}${API_BASE_URL}${player.profile_image}`;
}

// Loading indicator (refcount avoids stuck overlay when multiple requests overlap)
let loadingCount = 0;

function showLoading() {
    loadingCount += 1;
    document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
    if (loadingCount > 0) {
        loadingCount -= 1;
    }
    if (loadingCount === 0) {
        document.getElementById('loading').style.display = 'none';
    }
}

function resetLoading() {
    loadingCount = 0;
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.style.display = 'none';
}

/** String id an toàn cho onclick="fn('…')" (ID Firestore là chuỗi, không được dùng như tên biến). */
function escapeForOnclickArg(value) {
    return String(value ?? '')
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'");
}

// Teams functions
async function loadTeams() {
    showLoading();
    try {
        teams = await teamsAPI.getAll();
        renderTeamProfileDisplay();
        updateTeamSelects();
        updateHeaderStats();
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
        <form id="team-profile-form" onsubmit="saveTeamProfile(event, '${escapeForOnclickArg(team.id)}')">
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
    const backdrop = document.getElementById('sidebar-backdrop');
    if (backdrop) backdrop.classList.add('active');
}

function closeTeamProfile() {
    document.getElementById('team-profile-sidebar').classList.remove('active');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (backdrop) backdrop.classList.remove('active');
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
async function loadPlayers(forceRefresh = false) {
    try {
        await refreshResource(
            'players',
            () => playersAPI.getAll(),
            (data) => {
                players = data;
                renderPlayers();
                updateHeaderStats();
            },
            { forceRefresh }
        );
    } catch (error) {
        alert('Error loading players: ' + error.message);
    }
}

function renderPlayers() {
    const container = document.getElementById('players-list');
    if (!container) return;

    updateHeaderStats();
    const filteredPlayers = getFilteredSortedPlayers();
    const topScorerIds = getTopScorerIds();

    if (players.length === 0) {
        updatePlayerResultCount(0);
        container.innerHTML = `
            <div class="empty-state">
                <h3>Chưa có cầu thủ</h3>
                <p>Thêm cầu thủ đầu tiên cho đội bóng của bạn</p>
            </div>`;
        return;
    }

    if (filteredPlayers.length === 0) {
        updatePlayerResultCount(0);
        container.innerHTML = `
            <div class="empty-state">
                <h3>Không tìm thấy cầu thủ</h3>
                <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>`;
        return;
    }

    updatePlayerResultCount(filteredPlayers.length);

    container.innerHTML = filteredPlayers.map(player => {
        const positions = Array.isArray(player.position) ? player.position : [player.position];
        const positionsFiltered = positions.filter(Boolean);
        const imageUrl = getPlayerImageUrl(player);
        const role = player.role || 'Cầu thủ';
        const totalGoals = player.total_goals !== undefined ? player.total_goals : 0;
        const matchCount = getPlayerMatchCount(player.id);
        const roleClass = getRoleBadgeClass(role);
        const roleLabel = getRoleLabel(role);
        const roleIcon = getRoleBadgeIcon(role);
        const initials = getPlayerInitials(player.name);
        const safeId = escapeForOnclickArg(player.id);
        const isTopScorer = topScorerIds.has(player.id);
        const cardClasses = ['player-card', isTopScorer ? 'player-card-top-scorer' : ''].filter(Boolean).join(' ');

        const avatarHtml = imageUrl
            ? `<div class="player-avatar-wrap">
                <div class="player-avatar-placeholder" style="display:none">${initials}</div>
                <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(player.name)}" class="player-avatar" onerror="this.style.display='none';this.previousElementSibling.style.display='flex'">
               </div>`
            : `<div class="player-avatar-placeholder">${initials}</div>`;

        const highlightBadges = [];
        if (isTopScorer) highlightBadges.push('<span class="highlight-badge highlight-badge-top-scorer">🏆 Top Scorer</span>');

        const roleBadgeHtml = role !== 'Cầu thủ'
            ? `<span class="role-badge ${roleClass}">${roleIcon ? roleIcon + ' ' : ''}${escapeHtml(roleLabel)}</span>`
            : `<span class="role-badge ${roleClass}">${escapeHtml(roleLabel)}</span>`;

        const menuHtml = `
            <div class="player-card-menu">
                <button type="button" class="menu-trigger" onclick="togglePlayerMenu('${safeId}', event)" aria-label="Tùy chọn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
                </button>
                <div class="menu-dropdown" id="player-menu-${player.id}">
                    <button type="button" class="menu-dropdown-item" onclick="viewPlayerProfile('${safeId}'); closeAllPlayerMenus();">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        Xem hồ sơ
                    </button>
                    ${isLoggedIn ? `
                    <button type="button" class="menu-dropdown-item" onclick="editPlayer('${safeId}'); closeAllPlayerMenus();">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Chỉnh sửa
                    </button>` : ''}
                    <button type="button" class="menu-dropdown-item" onclick="viewPlayerStatistics(); closeAllPlayerMenus();">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                        Thống kê
                    </button>
                    ${isLoggedIn ? `
                    <div class="menu-dropdown-divider"></div>
                    <button type="button" class="menu-dropdown-item menu-dropdown-item-danger" onclick="deletePlayer('${safeId}'); closeAllPlayerMenus();">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        Xóa
                    </button>` : ''}
                </div>
            </div>`;

        return `
            <div class="${cardClasses}">
                <div class="player-card-header">
                    ${avatarHtml}
                    <div class="player-card-header-info">
                        <div class="player-name-row">
                            <span class="player-name" title="${escapeHtml(player.name)}">${escapeHtml(player.name)}</span>
                            ${player.jersey_number ? `<span class="jersey-badge">${player.jersey_number}</span>` : ''}
                        </div>
                        <div class="player-badges-row">
                            ${roleBadgeHtml}
                            ${highlightBadges.join('')}
                        </div>
                    </div>
                    ${menuHtml}
                </div>
                <div class="goals-highlight" aria-label="${totalGoals} bàn thắng">
                    <span class="goals-icon" aria-hidden="true">⚽</span>
                    <span class="goals-value">${totalGoals}</span>
                    <span class="goals-label">Goals</span>
                </div>
                ${positionsFiltered.length > 0 ? `
                    <div class="position-tags">
                        ${positionsFiltered.map(pos => `<span class="position-tag ${getPositionColorClass(pos)}">${escapeHtml(pos)}</span>`).join('')}
                    </div>` : ''}
                <div class="player-card-footer">
                    <span class="footer-stat">
                        <span class="footer-stat-icon" aria-hidden="true">🎮</span>
                        <span class="footer-stat-value">${matchCount}</span> Matches
                    </span>
                    <span class="footer-stat">
                        <span class="footer-stat-icon" aria-hidden="true">📍</span>
                        <span class="footer-stat-value">${positionsFiltered.length || 0}</span> Positions
                    </span>
                    ${player.jersey_number ? `
                    <span class="footer-stat">
                        <span class="footer-stat-icon" aria-hidden="true">👕</span>
                        #<span class="footer-stat-value">${player.jersey_number}</span>
                    </span>` : ''}
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
        invalidateCache('players');
        await loadPlayers(true);
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
        invalidateCache('players');
        await loadPlayers(true);
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
const OPPONENT_AVATAR_COLORS = [
    { bg: '#EEF2FF', text: '#4F46E5', border: '#C7D2FE' },
    { bg: '#DBEAFE', text: '#2563EB', border: '#93C5FD' },
    { bg: '#CFFAFE', text: '#0891B2', border: '#67E8F9' },
    { bg: '#D1FAE5', text: '#059669', border: '#6EE7B7' },
    { bg: '#FFEDD5', text: '#EA580C', border: '#FDBA74' },
    { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5' },
    { bg: '#F3E8FF', text: '#7C3AED', border: '#C4B5FD' },
    { bg: '#FCE7F3', text: '#DB2777', border: '#F9A8D4' },
];

function setupOpponentFilters() {
    const searchInput = document.getElementById('opponent-search');
    const sortSelect = document.getElementById('opponent-sort');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            opponentSearchQuery = e.target.value.toLowerCase().trim();
            renderOpponents();
        });
    }
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            opponentSortBy = e.target.value;
            renderOpponents();
        });
    }
}

function ratingToStrength(rating) {
    return Math.min(100, Math.max(0, (rating || 0) * 20));
}

function strengthToRating(strength) {
    return Math.min(5, Math.max(0, Math.round(Number(strength) / 20)));
}

function getOpponentAvatarColors(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return OPPONENT_AVATAR_COLORS[Math.abs(hash) % OPPONENT_AVATAR_COLORS.length];
}

function getStrengthTier(strength) {
    if (strength >= 80) return 'high';
    if (strength >= 60) return 'mid';
    if (strength >= 40) return 'low';
    return 'minimal';
}

function getOpponentMatchStats(opponentId) {
    const opponentMatches = matches
        .filter(m => m.opponent_id === opponentId && (m.is_completed === true || m.is_completed === 1))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    let wins = 0;
    let draws = 0;
    let losses = 0;
    opponentMatches.forEach(m => {
        if (m.result === 'win') wins++;
        else if (m.result === 'draw') draws++;
        else if (m.result === 'lose') losses++;
    });

    return {
        total: opponentMatches.length,
        wins,
        draws,
        losses,
        winRate: opponentMatches.length > 0 ? Math.round((wins / opponentMatches.length) * 100) : null,
        recentResults: opponentMatches.slice(0, 8).reverse(),
        neverDefeated: opponentMatches.length > 0 && wins === 0,
        lastMatch: opponentMatches[0] || null,
    };
}

function getRivalOpponentIds() {
    const counts = opponents
        .map(o => ({ id: o.id, count: getOpponentMatchStats(o.id).total }))
        .filter(x => x.count >= 3)
        .sort((a, b) => b.count - a.count);
    return new Set(counts.slice(0, 3).map(x => x.id));
}

function getOpponentsSummary() {
    const completedVsOpponents = matches.filter(
        m => (m.is_completed === true || m.is_completed === 1) && m.opponent_id
    );
    const totalWins = completedVsOpponents.filter(m => m.result === 'win').length;
    const winRate = completedVsOpponents.length > 0
        ? Math.round((totalWins / completedVsOpponents.length) * 100)
        : null;

    let strongestOpponent = null;
    let maxStrength = -1;
    opponents.forEach(o => {
        const strength = ratingToStrength(o.rating);
        if (strength > maxStrength) {
            maxStrength = strength;
            strongestOpponent = o;
        }
    });

    return {
        totalOpponents: opponents.length,
        winRate,
        strongestOpponent,
        notPlayedCount: opponents.filter(o => getOpponentMatchStats(o.id).total === 0).length,
    };
}

function getFilteredSortedOpponents() {
    let filtered = [...opponents];

    if (opponentSearchQuery) {
        filtered = filtered.filter(o =>
            o.name.toLowerCase().includes(opponentSearchQuery) ||
            (o.review && o.review.toLowerCase().includes(opponentSearchQuery))
        );
    }

    filtered.sort((a, b) => {
        const statsA = getOpponentMatchStats(a.id);
        const statsB = getOpponentMatchStats(b.id);

        if (opponentSortBy === 'name') {
            return a.name.localeCompare(b.name, 'vi');
        }
        if (opponentSortBy === 'played') {
            const diff = statsB.total - statsA.total;
            return diff !== 0 ? diff : a.name.localeCompare(b.name, 'vi');
        }
        if (opponentSortBy === 'winrate') {
            const rateA = statsA.winRate ?? -1;
            const rateB = statsB.winRate ?? -1;
            const diff = rateB - rateA;
            return diff !== 0 ? diff : a.name.localeCompare(b.name, 'vi');
        }
        if (opponentSortBy === 'recent') {
            const dateA = statsA.lastMatch ? new Date(statsA.lastMatch.date).getTime() : 0;
            const dateB = statsB.lastMatch ? new Date(statsB.lastMatch.date).getTime() : 0;
            const diff = dateB - dateA;
            return diff !== 0 ? diff : a.name.localeCompare(b.name, 'vi');
        }
        const strengthDiff = ratingToStrength(b.rating) - ratingToStrength(a.rating);
        return strengthDiff !== 0 ? strengthDiff : a.name.localeCompare(b.name, 'vi');
    });

    return filtered;
}

function updateOpponentResultCount(count) {
    const el = document.getElementById('opponents-result-count');
    if (!el) return;
    if (opponents.length === 0) {
        el.textContent = '';
        return;
    }
    el.innerHTML = `Hiển thị <strong>${count}</strong> / ${opponents.length} đối thủ`;
}

function renderOpponentsSummary() {
    const container = document.getElementById('opponents-summary');
    if (!container) return;

    const summary = getOpponentsSummary();
    const strongestName = summary.strongestOpponent
        ? escapeHtml(summary.strongestOpponent.name)
        : '—';
    const strongestStrength = summary.strongestOpponent
        ? ratingToStrength(summary.strongestOpponent.rating)
        : null;

    container.innerHTML = `
        <div class="opponents-summary-card">
            <span class="opponents-summary-icon" aria-hidden="true">🛡</span>
            <div class="opponents-summary-body">
                <span class="opponents-summary-value">${summary.totalOpponents}</span>
                <span class="opponents-summary-label">Tổng đối thủ</span>
            </div>
        </div>
        <div class="opponents-summary-card">
            <span class="opponents-summary-icon" aria-hidden="true">📈</span>
            <div class="opponents-summary-body">
                <span class="opponents-summary-value ${summary.winRate !== null && summary.winRate >= 50 ? 'summary-success' : ''}">${summary.winRate !== null ? summary.winRate + '%' : '—'}</span>
                <span class="opponents-summary-label">Tỷ lệ thắng</span>
            </div>
        </div>
        <div class="opponents-summary-card opponents-summary-card-highlight">
            <span class="opponents-summary-icon" aria-hidden="true">⚡</span>
            <div class="opponents-summary-body">
                <span class="opponents-summary-value summary-danger">${strongestName}</span>
                <span class="opponents-summary-label">Đối thủ mạnh nhất${strongestStrength !== null ? ` · STR ${strongestStrength}` : ''}</span>
            </div>
        </div>
        <div class="opponents-summary-card">
            <span class="opponents-summary-icon" aria-hidden="true">🆕</span>
            <div class="opponents-summary-body">
                <span class="opponents-summary-value">${summary.notPlayedCount}</span>
                <span class="opponents-summary-label">Chưa từng đấu</span>
            </div>
        </div>`;
}

function renderFormChips(recentResults) {
    if (!recentResults.length) {
        return '<span class="form-chips-empty">Chưa đấu</span>';
    }
    return `<div class="form-chips" aria-label="Phong độ đối đầu gần đây">${recentResults.map(m => {
        const cls = m.result === 'win' ? 'form-chip-win' : m.result === 'draw' ? 'form-chip-draw' : 'form-chip-loss';
        const letter = m.result === 'win' ? 'W' : m.result === 'draw' ? 'D' : 'L';
        const score = `${m.our_score ?? 0}-${m.opponent_score ?? 0}`;
        const date = m.date ? new Date(m.date).toLocaleDateString('vi-VN') : '';
        return `<span class="form-chip ${cls}" title="${date}: ${score}">${letter}</span>`;
    }).join('')}</div>`;
}

function getOpponentBadges(opponent, stats, rivalIds) {
    const badges = [];
    const strength = ratingToStrength(opponent.rating);
    if (strength >= 80) {
        badges.push({ label: 'Strong Opponent', class: 'opponent-badge-strong' });
    }
    if (rivalIds.has(opponent.id)) {
        badges.push({ label: 'Rival', class: 'opponent-badge-rival' });
    }
    if (stats.neverDefeated) {
        badges.push({ label: 'Never Defeated', class: 'opponent-badge-undefeated' });
    }
    return badges;
}

function toggleOpponentMenu(opponentId, event) {
    event.stopPropagation();
    const menu = document.getElementById(`opponent-menu-${opponentId}`);
    if (!menu) return;
    const isOpen = menu.classList.contains('open');
    closeAllOpponentMenus();
    closeAllPlayerMenus();
    if (!isOpen) menu.classList.add('open');
}

function closeAllOpponentMenus() {
    document.querySelectorAll('.opponent-card-menu .menu-dropdown.open').forEach(menu => menu.classList.remove('open'));
}

async function loadOpponents(forceRefresh = false) {
    try {
        await refreshResource(
            'opponents',
            () => opponentsAPI.getAll(),
            (data) => {
                opponents = data;
                // renderOpponents() runs after matches load (head-to-head needs matches)
                updateOpponentSelects();
            },
            { forceRefresh }
        );
    } catch (error) {
        alert('Error loading opponents: ' + error.message);
    }
}

function renderOpponents() {
    const container = document.getElementById('opponents-list');
    if (!container) return;

    renderOpponentsSummary();

    if (opponents.length === 0) {
        updateOpponentResultCount(0);
        container.innerHTML = `
            <div class="empty-state opponents-empty-state">
                <div class="empty-state-icon" aria-hidden="true">🛡</div>
                <h3>Chưa có đối thủ</h3>
                <p>Thêm đối thủ đầu tiên để theo dõi phân tích đối đầu</p>
            </div>`;
        return;
    }

    const filteredOpponents = getFilteredSortedOpponents();
    const rivalIds = getRivalOpponentIds();

    if (filteredOpponents.length === 0) {
        updateOpponentResultCount(0);
        container.innerHTML = `
            <div class="empty-state opponents-empty-state">
                <h3>Không tìm thấy đối thủ</h3>
                <p>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc sắp xếp</p>
            </div>`;
        return;
    }

    updateOpponentResultCount(filteredOpponents.length);

    container.innerHTML = filteredOpponents.map(opponent => {
        const strength = ratingToStrength(opponent.rating);
        const strengthTier = getStrengthTier(strength);
        const stats = getOpponentMatchStats(opponent.id);
        const badges = getOpponentBadges(opponent, stats, rivalIds);
        const avatarColors = getOpponentAvatarColors(opponent.name);
        const initials = getPlayerInitials(opponent.name);
        const safeId = escapeForOnclickArg(opponent.id);
        const review = opponent.review || '';

        const cardClasses = ['opponent-card'];
        if (badges.some(b => b.class === 'opponent-badge-strong' || b.class === 'opponent-badge-undefeated')) {
            cardClasses.push('opponent-card-danger');
        }
        if (badges.some(b => b.class === 'opponent-badge-rival')) {
            cardClasses.push('opponent-card-rival');
        }
        if (stats.total === 0) {
            cardClasses.push('opponent-card-unplayed');
        }

        const recordHtml = stats.total > 0
            ? `<span class="opponent-record-stat record-win">${stats.wins}W</span>
               <span class="opponent-record-stat record-draw">${stats.draws}D</span>
               <span class="opponent-record-stat record-loss">${stats.losses}L</span>
               ${stats.winRate !== null ? `<span class="opponent-record-rate">${stats.winRate}% win</span>` : ''}`
            : '<span class="opponent-record-none">Chưa có trận đấu</span>';

        const lastScoreHtml = stats.lastMatch
            ? `<span class="opponent-last-score">${stats.lastMatch.our_score ?? 0}–${stats.lastMatch.opponent_score ?? 0}</span>`
            : '';

        const menuHtml = isLoggedIn ? `
            <div class="opponent-card-menu player-card-menu">
                <button type="button" class="menu-trigger" onclick="toggleOpponentMenu('${safeId}', event)" aria-label="Tùy chọn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
                </button>
                <div class="menu-dropdown" id="opponent-menu-${opponent.id}">
                    <button type="button" class="menu-dropdown-item" onclick="editOpponent('${safeId}'); closeAllOpponentMenus();">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Chỉnh sửa
                    </button>
                    <div class="menu-dropdown-divider"></div>
                    <button type="button" class="menu-dropdown-item menu-dropdown-item-danger" onclick="deleteOpponent('${safeId}'); closeAllOpponentMenus();">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        Xóa
                    </button>
                </div>
            </div>` : '';

        return `
            <article class="${cardClasses.join(' ')}">
                <div class="opponent-card-top">
                    <div class="opponent-avatar" style="background:${avatarColors.bg};color:${avatarColors.text};border-color:${avatarColors.border}" aria-hidden="true">${initials}</div>
                    <div class="opponent-card-header-info">
                        <div class="opponent-name-row">
                            <h3 class="opponent-name" title="${escapeHtml(opponent.name)}">${escapeHtml(opponent.name)}</h3>
                            ${menuHtml}
                        </div>
                        ${badges.length ? `<div class="opponent-badges-row">${badges.map(b => `<span class="opponent-badge ${b.class}">${b.label}</span>`).join('')}</div>` : ''}
                        ${opponent.phone ? `<span class="opponent-phone">${escapeHtml(opponent.phone)}</span>` : ''}
                    </div>
                    <div class="opponent-strength opponent-strength-${strengthTier}" aria-label="Sức mạnh ${strength}">
                        <span class="opponent-strength-value">${strength}</span>
                        <span class="opponent-strength-label">STR</span>
                    </div>
                </div>
                <div class="opponent-card-body">
                    <div class="opponent-record-row">
                        <span class="opponent-record-label">Đối đầu</span>
                        <div class="opponent-record-stats">${recordHtml}</div>
                    </div>
                    <div class="opponent-form-row">
                        <span class="opponent-form-label">Phong độ</span>
                        <div class="opponent-form-chips">${renderFormChips(stats.recentResults)}</div>
                        ${lastScoreHtml}
                    </div>
                    ${review ? `<p class="opponent-review" title="${escapeHtml(review)}">${escapeHtml(review)}</p>` : ''}
                </div>
            </article>`;
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
        const strength = ratingToStrength(opponent.rating || 0);
        document.getElementById('opponent-strength').value = strength;
        document.getElementById('opponent-rating').value = opponent.rating || 0;
        document.getElementById('opponent-review').value = opponent.review || '';
        updateStrengthDisplay(strength);
    } else {
        title.textContent = 'Thêm đối thủ';
        form.reset();
        document.getElementById('opponent-id').value = '';
        document.getElementById('opponent-strength').value = 0;
        document.getElementById('opponent-rating').value = 0;
        updateStrengthDisplay(0);
    }
    
    modal.classList.add('active');
}

function closeOpponentModal() {
    document.getElementById('opponent-modal').classList.remove('active');
    document.getElementById('opponent-form').reset();
    editingOpponentId = null;
    openOpponentModalCallback = null;
    updateStrengthDisplay(0);
}

function updateStrengthDisplay(strength) {
    const value = Math.min(100, Math.max(0, Number(strength) || 0));
    const display = document.getElementById('opponent-strength-display');
    const ratingInput = document.getElementById('opponent-rating');
    const slider = document.getElementById('opponent-strength');
    if (display) display.textContent = value;
    if (ratingInput) ratingInput.value = strengthToRating(value);
    if (slider && Number(slider.value) !== value) slider.value = value;

    const preview = display?.closest('.strength-preview');
    if (preview) {
        preview.classList.remove('strength-tier-high', 'strength-tier-mid', 'strength-tier-low', 'strength-tier-minimal');
        preview.classList.add(`strength-tier-${getStrengthTier(value)}`);
    }
}

async function saveOpponent(event) {
    event.preventDefault();
    showLoading();
    
    const formData = {
        name: document.getElementById('opponent-name').value,
        phone: document.getElementById('opponent-phone').value || null,
        rating: parseInt(document.getElementById('opponent-rating').value, 10) || 0,
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
        invalidateCache('opponents');
        await loadOpponents(true);
        
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
        invalidateCache('opponents');
        await loadOpponents(true);
    } catch (error) {
        alert('Error deleting opponent: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Statistics functions
function applyStatisticsFromMatches(allMatches) {
    matches = allMatches;
    const completedMatches = allMatches.filter(
        m => m.is_completed === true || m.is_completed === 1
    );
    renderStatisticsDashboard(completedMatches);
}

async function loadStatistics(forceRefresh = false) {
    try {
        if (players.length === 0) {
            await ensurePlayersLoaded({ skipRender: true });
        }

        const snapshot = !forceRefresh
            ? (getCachedData('matches') ?? (matches.length > 0 ? matches : null))
            : null;

        if (snapshot != null) {
            applyStatisticsFromMatches(snapshot);
            try {
                const fresh = await matchesAPI.getAll();
                if (!dataEquals(snapshot, fresh)) {
                    setCachedData('matches', fresh);
                    applyStatisticsFromMatches(fresh);
                }
            } catch (error) {
                console.warn('Background statistics refresh failed, keeping current data', error);
            }
            return;
        }

        await refreshResource(
            'matches',
            () => matchesAPI.getAll(),
            applyStatisticsFromMatches,
            { forceRefresh }
        );
    } catch (error) {
        console.error('Error loading goal statistics:', error);
        alert('Error loading goal statistics: ' + error.message);
    }
}

function renderStatisticsDashboard(completedMatches) {
    destroyStatsCharts();

    const goalsFiltered = filterMatchesByPeriod(
        completedMatches, selectedGoalsMonthFilter, selectedGoalsQuarterFilter
    );
    const participationFiltered = filterMatchesByPeriod(
        completedMatches, selectedParticipationMonthFilter, selectedParticipationQuarterFilter
    );

    populateGoalsMonthFilter(completedMatches);
    populateGoalsQuarterFilter(completedMatches);
    populateTop3MonthFilter(completedMatches);
    populateTop3QuarterFilter(completedMatches);
    populateParticipationMonthFilter(completedMatches);
    populateParticipationQuarterFilter(completedMatches);

    const playerGoalsMap = computePlayerGoalsMap(goalsFiltered);
    const participationArray = computeParticipationMap(participationFiltered);
    const participationById = {};
    participationArray.forEach(p => { participationById[String(p.id)] = p; });

    const top3Filtered = filterMatchesByPeriod(
        completedMatches, selectedTop3MonthFilter, selectedTop3QuarterFilter
    );
    const top3GoalsMap = computePlayerGoalsMap(top3Filtered);
    const top3Participation = computeParticipationMap(top3Filtered);
    const top3ParticipationById = {};
    top3Participation.forEach(p => { top3ParticipationById[String(p.id)] = p; });

    const allPlayers = players.map(p => ({ id: p.id, name: p.name }));
    const allMatchDates = [...new Set(goalsFiltered.map(m => m.date))].sort();

    renderKpiCards(completedMatches, playerGoalsMap, participationArray);
    renderTopScorersPodium(top3GoalsMap, top3ParticipationById, top3Filtered);
    renderGoalsRanking(playerGoalsMap);
    renderGoalsCharts(playerGoalsMap, completedMatches);
    renderMatchTimeline(completedMatches);
    renderParticipationCards(participationArray);
    renderParticipationChart(participationArray);
    renderAdvancedInsights(completedMatches, playerGoalsMap, participationArray);
    renderTopScorersTrendChart(completedMatches);
    renderGoalsTable(playerGoalsMap, allPlayers, allMatchDates);
    renderParticipationTable(completedMatches, participationArray, participationFiltered);
}

function renderKpiCards(completedMatches, playerGoalsMap, participationArray) {
    const container = document.getElementById('stats-kpi-grid');
    if (!container) return;

    const totalGoals = Object.values(playerGoalsMap).reduce((s, p) => s + p.totalGoals, 0);
    const matchesPlayed = completedMatches.length;
    const goalsPerMatch = matchesPlayed > 0 ? (totalGoals / matchesPlayed).toFixed(1) : '0';
    const playerCount = players.length;
    const avgParticipation = participationArray.length > 0
        ? (participationArray.reduce((s, p) => s + p.participationRate, 0) / participationArray.length).toFixed(0)
        : '0';

    const sorted = Object.values(playerGoalsMap).sort((a, b) => b.totalGoals - a.totalGoals);
    const topScorer = sorted[0];

    const cards = [
        { icon: '⚽', label: 'Tổng bàn thắng', value: totalGoals, accent: 'purple' },
        { icon: '👥', label: 'Cầu thủ', value: playerCount, accent: 'blue' },
        { icon: '🎮', label: 'Trận đã đấu', value: matchesPlayed, accent: 'green' },
        { icon: '📈', label: 'Bàn / trận', value: goalsPerMatch, accent: 'orange' },
        { icon: '🏆', label: 'Vua phá lưới', value: topScorer ? topScorer.name : '—', accent: 'gold', small: true },
        { icon: '📊', label: 'Tỉ lệ tham gia TB', value: `${avgParticipation}%`, accent: 'purple' }
    ];

    container.innerHTML = cards.map(c => `
        <article class="stats-kpi-card stats-kpi-card--${c.accent}">
            <span class="stats-kpi-icon" aria-hidden="true">${c.icon}</span>
            <div class="stats-kpi-body">
                <span class="stats-kpi-value${c.small ? ' stats-kpi-value--sm' : ''}">${escapeHtml(String(c.value))}</span>
                <span class="stats-kpi-label">${c.label}</span>
            </div>
        </article>
    `).join('');
}

function renderTopScorersPodium(playerGoalsMap, participationById, completedMatches) {
    const container = document.getElementById('top-goalscorers-podium');
    if (!container) return;

    const topPlayers = Object.values(playerGoalsMap)
        .filter(p => p.totalGoals > 0)
        .sort((a, b) => b.totalGoals - a.totalGoals)
        .slice(0, 3);

    while (topPlayers.length < 3) {
        topPlayers.push({ name: '—', totalGoals: 0, id: null });
    }

    if (topPlayers.every(p => p.totalGoals === 0)) {
        container.innerHTML = '<div class="empty-state"><p>Chưa có dữ liệu ghi bàn</p></div>';
        return;
    }

    const medals = ['gold', 'silver', 'bronze'];
    const medalIcons = ['🥇', '🥈', '🥉'];

    const cards = topPlayers.map((player, rankIdx) => {
        const part = player.id ? participationById[player.id] : null;
        const partRate = part ? part.participationRate.toFixed(0) : '—';
        const trend = player.id ? getPlayerGoalTrend(player, completedMatches) : { dir: 'flat', label: '—' };
        const trendIcon = trend.dir === 'up' ? '↑' : trend.dir === 'down' ? '↓' : '→';
        const trendClass = `stats-trend--${trend.dir}`;

        return `
            <article class="stats-podium-card stats-podium-card--${medals[rankIdx]}">
                <div class="stats-podium-top">
                    <div class="stats-podium-avatar-wrap">
                        ${player.id ? renderStatsPlayerAvatar(player.id, 'md') : '<div class="stats-avatar stats-avatar--md"><div class="stats-avatar-placeholder">—</div></div>'}
                    </div>
                    <span class="stats-podium-medal" aria-label="Hạng ${rankIdx + 1}">${medalIcons[rankIdx]}</span>
                </div>
                <h4 class="stats-podium-name">${escapeHtml(player.name)}</h4>
                <div class="stats-podium-goals">
                    <span class="stats-podium-goals-num">${player.totalGoals}</span>
                    <span class="stats-podium-goals-label">bàn</span>
                </div>
                <div class="stats-podium-meta">
                    <span class="stats-podium-part">${partRate}% tham gia</span>
                    <span class="stats-trend ${trendClass}" title="Xu hướng ghi bàn">${trendIcon} ${trend.label}</span>
                </div>
            </article>
        `;
    });

    container.innerHTML = cards.join('');
}

function renderGoalsRanking(playerGoalsMap) {
    const container = document.getElementById('goals-ranking-list');
    if (!container) return;

    const ranked = Object.values(playerGoalsMap)
        .filter(p => p.totalGoals > 0)
        .sort((a, b) => b.totalGoals - a.totalGoals);

    if (ranked.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Chưa có dữ liệu</p></div>';
        return;
    }

    const maxGoals = ranked[0].totalGoals || 1;

    container.innerHTML = ranked.map((p, i) => `
        <div class="stats-rank-row">
            <span class="stats-rank-pos">${i + 1}</span>
            ${renderStatsPlayerAvatar(p.id, 'sm')}
            <div class="stats-rank-info">
                <span class="stats-rank-name">${escapeHtml(p.name)}</span>
                <div class="stats-rank-bar-track">
                    <div class="stats-rank-bar-fill" style="width:${(p.totalGoals / maxGoals) * 100}%"></div>
                </div>
            </div>
            <span class="stats-rank-value">${p.totalGoals}</span>
        </div>
    `).join('');
}

function renderGoalsCharts(playerGoalsMap, completedMatches) {
    const ranked = Object.values(playerGoalsMap)
        .filter(p => p.totalGoals > 0)
        .sort((a, b) => b.totalGoals - a.totalGoals)
        .slice(0, 10);

    const playerCanvas = document.getElementById('goals-by-player-chart');
    if (playerCanvas && typeof Chart !== 'undefined') {
        statsCharts.goalsByPlayer = new Chart(playerCanvas, {
            type: 'bar',
            data: {
                labels: ranked.map(p => p.name),
                datasets: [{
                    label: 'Bàn thắng',
                    data: ranked.map(p => p.totalGoals),
                    backgroundColor: 'rgba(79, 70, 229, 0.75)',
                    borderColor: 'rgba(79, 70, 229, 1)',
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } },
                    y: { grid: { display: false } }
                }
            }
        });
    }

    const monthBuckets = {};
    completedMatches.forEach(m => {
        if (!m.date) return;
        const key = m.date.substring(0, 7);
        const goals = (m.goals || []).reduce((s, g) => s + (g.goals || 0), 0);
        monthBuckets[key] = (monthBuckets[key] || 0) + goals;
    });
    const monthKeys = Object.keys(monthBuckets).sort();

    const monthCanvas = document.getElementById('goals-per-month-chart');
    if (monthCanvas && typeof Chart !== 'undefined') {
        statsCharts.goalsPerMonth = new Chart(monthCanvas, {
            type: 'bar',
            data: {
                labels: monthKeys.map(formatStatsMonthLabel),
                datasets: [{
                    label: 'Bàn thắng',
                    data: monthKeys.map(k => monthBuckets[k]),
                    backgroundColor: 'rgba(99, 102, 241, 0.7)',
                    borderColor: 'rgba(79, 70, 229, 1)',
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }
}

function aggregateTimelineGoals(matches, viewMode) {
    const buckets = {};
    matches.forEach(match => {
        if (!match.date) return;
        let key, label;
        if (viewMode === 'month') {
            key = match.date.substring(0, 7);
            label = formatStatsMonthLabel(key);
        } else if (viewMode === 'quarter') {
            key = getMatchQuarterKey(match.date);
            label = key.replace('-', ' ');
        } else {
            key = match.date.substring(0, 4);
            label = `Mùa ${key}`;
        }
        const goals = (match.goals || []).reduce((s, g) => s + (g.goals || 0), 0);
        if (!buckets[key]) buckets[key] = { label, goals: 0 };
        buckets[key].goals += goals;
    });
    return Object.entries(buckets)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, v]) => v);
}

function renderMatchTimeline(completedMatches) {
    const container = document.getElementById('match-timeline');
    if (!container) return;

    const periods = aggregateTimelineGoals(completedMatches, statsTimelineView);
    if (periods.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Chưa có dữ liệu</p></div>';
        return;
    }

    const maxGoals = Math.max(...periods.map(p => p.goals), 1);
    container.innerHTML = periods.map(p => `
        <div class="stats-timeline-row">
            <span class="stats-timeline-label">${escapeHtml(p.label)}</span>
            <div class="stats-timeline-track" role="presentation">
                <div class="stats-timeline-fill" style="width:${(p.goals / maxGoals) * 100}%"></div>
            </div>
            <span class="stats-timeline-value">${p.goals}</span>
        </div>
    `).join('');
}

function renderParticipationCards(participationArray) {
    const container = document.getElementById('participation-cards-grid');
    if (!container) return;

    if (participationArray.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Chưa có dữ liệu tham gia</p></div>';
        return;
    }

    const sorted = [...participationArray].sort((a, b) => b.participationRate - a.participationRate);
    container.innerHTML = sorted.map(p => {
        const rateColor = p.participationRate >= 80 ? 'var(--color-success)'
            : p.participationRate >= 50 ? 'var(--color-primary)' : 'var(--color-danger)';
        return `
            <article class="stats-participation-card">
                <div class="stats-participation-header">
                    ${renderStatsPlayerAvatar(p.id, 'sm')}
                    <div class="stats-participation-info">
                        <h4 class="stats-participation-name">${escapeHtml(p.name)}</h4>
                        <span class="stats-participation-matches">${p.totalParticipated} trận · ${p.totalNotParticipated} vắng</span>
                    </div>
                    <span class="stats-participation-rate" style="color:${rateColor}">${p.participationRate.toFixed(0)}%</span>
                </div>
                <div class="stats-participation-bar" role="presentation">
                    <div class="stats-participation-bar-fill" style="width:${p.participationRate}%;background:${rateColor}"></div>
                </div>
            </article>
        `;
    }).join('');
}

function renderParticipationChart(participationArray) {
    const canvas = document.getElementById('participation-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    const sorted = [...participationArray].sort((a, b) => b.participationRate - a.participationRate);
    statsCharts.participation = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: sorted.map(p => p.name),
            datasets: [{
                label: 'Tỉ lệ tham gia %',
                data: sorted.map(p => p.participationRate),
                backgroundColor: sorted.map(p =>
                    p.participationRate >= 80 ? 'rgba(16, 185, 129, 0.75)'
                    : p.participationRate >= 50 ? 'rgba(79, 70, 229, 0.75)'
                    : 'rgba(239, 68, 68, 0.75)'
                ),
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { beginAtZero: true, max: 100, grid: { color: 'rgba(0,0,0,0.04)' } },
                y: { grid: { display: false } }
            }
        }
    });
}

function renderAdvancedInsights(completedMatches, playerGoalsMap, participationArray) {
    const container = document.getElementById('stats-insights-grid');
    if (!container) return;

    const sortedGoals = Object.values(playerGoalsMap).sort((a, b) => b.totalGoals - a.totalGoals);
    const topScorer = sortedGoals[0];

    const mostConsistent = [...participationArray]
        .filter(p => p.totalParticipated >= 3)
        .sort((a, b) => b.participationRate - a.participationRate || b.totalParticipated - a.totalParticipated)[0];

    const bestAttendance = [...participationArray].sort((a, b) =>
        b.participationRate - a.participationRate || b.totalParticipated - a.totalParticipated
    )[0];

    const goalsPerMatch = Object.values(playerGoalsMap)
        .map(p => {
            const matchCount = p.matches.length || 1;
            return { ...p, gpg: p.totalGoals / matchCount, matchCount };
        })
        .filter(p => p.totalGoals > 0 && p.matchCount >= 2)
        .sort((a, b) => b.gpg - a.gpg)[0];

    let mostImproved = null;
    let bestImprovement = -Infinity;
    Object.values(playerGoalsMap).forEach(p => {
        const trend = getPlayerGoalTrend(p, completedMatches);
        const diff = parseInt(trend.label, 10) || 0;
        if (diff > bestImprovement) {
            bestImprovement = diff;
            mostImproved = p;
        }
    });

    const topScorerTrend = topScorer ? getPlayerGoalTrend(topScorer, completedMatches) : null;
    const trendText = topScorerTrend
        ? (topScorerTrend.dir === 'up' ? `Tăng ${topScorerTrend.label} bàn` : topScorerTrend.dir === 'down' ? `Giảm ${Math.abs(parseInt(topScorerTrend.label, 10) || 0)} bàn` : 'Ổn định')
        : '—';

    const insights = [
        { icon: '🎯', title: 'Ổn định nhất', player: mostConsistent, detail: mostConsistent ? `${mostConsistent.participationRate}% · ${mostConsistent.totalParticipated} trận` : '—' },
        { icon: '⚡', title: 'Bàn / trận cao nhất', player: goalsPerMatch, detail: goalsPerMatch ? `${goalsPerMatch.gpg.toFixed(2)} bàn/trận` : '—' },
        { icon: '✅', title: 'Chuyên cần nhất', player: bestAttendance, detail: bestAttendance ? `${bestAttendance.participationRate}% tham gia` : '—' },
        { icon: '📈', title: 'Tiến bộ nhất', player: mostImproved, detail: mostImproved && bestImprovement > 0 ? `+${bestImprovement} bàn` : '—' },
        { icon: '👑', title: 'Xu hướng VPPL', player: topScorer, detail: trendText }
    ];

    container.innerHTML = insights.map(ins => `
        <article class="stats-insight-card">
            <span class="stats-insight-icon" aria-hidden="true">${ins.icon}</span>
            <div class="stats-insight-body">
                <span class="stats-insight-title">${ins.title}</span>
                <span class="stats-insight-player">${ins.player ? escapeHtml(ins.player.name) : '—'}</span>
                <span class="stats-insight-detail">${ins.detail}</span>
            </div>
        </article>
    `).join('');
}

function renderTopScorersTrendChart(completedMatches) {
    const canvas = document.getElementById('top-scorers-trend-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    const allGoals = computePlayerGoalsMap(completedMatches);
    const top3 = Object.values(allGoals)
        .filter(p => p.totalGoals > 0)
        .sort((a, b) => b.totalGoals - a.totalGoals)
        .slice(0, 3);

    if (top3.length === 0) return;

    const monthKeys = [...new Set(completedMatches.map(m => m.date?.substring(0, 7)).filter(Boolean))].sort();
    const colors = ['#4F46E5', '#10B981', '#F59E0B'];

    const datasets = top3.map((player, i) => {
        let cumulative = 0;
        const data = monthKeys.map(month => {
            const monthGoals = player.matches
                .filter(m => m.date && m.date.startsWith(month))
                .reduce((s, m) => s + m.goals, 0);
            cumulative += monthGoals;
            return cumulative;
        });
        return {
            label: player.name,
            data,
            borderColor: colors[i],
            backgroundColor: colors[i] + '22',
            fill: true,
            tension: 0.35,
            pointRadius: 3
        };
    });

    statsCharts.topScorersTrend = new Chart(canvas, {
        type: 'line',
        data: { labels: monthKeys.map(formatStatsMonthLabel), datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } },
                x: { grid: { display: false } }
            }
        }
    });
}

function renderGoalStatistics(completedMatches) {
    renderStatisticsDashboard(completedMatches);
}

function renderTopGoalscorers(playerGoalsMap) {
    renderTopScorersPodium(playerGoalsMap, {}, matches);
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

    // Build mobile card layout for very small screens
    const goalsCards = playersWithGoals.map(({ player, playerData, totalGoals }) => {
        let detailsHtml = '';
        if (allMatchDates.length > 0) {
            detailsHtml = allMatchDates.map(date => {
                const dateObj = new Date(date + 'T00:00:00');
                const day = String(dateObj.getDate()).padStart(2, '0');
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                let goalsInMatch = 0;
                if (playerData) {
                    const matchData = playerData.matches.find(m => m.date === date);
                    if (matchData) goalsInMatch = matchData.goals;
                }
                return `
                    <div class="stats-mobile-row">
                        <span>${day}/${month}</span>
                        <strong>${goalsInMatch}</strong>
                    </div>
                `;
            }).join('');
        }

        return `
            <article class="stats-mobile-card">
                <div class="stats-mobile-card-header">
                    <h4>${escapeHtml(player.name)}</h4>
                    <span class="stats-mobile-total">${totalGoals} bàn</span>
                </div>
                ${detailsHtml ? `<div class="stats-mobile-card-body">${detailsHtml}</div>` : ''}
            </article>
        `;
    }).join('');
    
    // Sort indicator for total goals column
    const sortIcon = goalsTableSortState.direction === 'desc' ? '▼' : '▲';
    const sortStyle = 'cursor: pointer; user-select: none;';
    
    container.innerHTML = `
        <div class="goals-table-scroll stats-table-scroll">
            <table class="goals-table stats-analytics-table">
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
        <div class="stats-mobile-cards goals-mobile-cards">
            ${goalsCards}
        </div>
    `;
}

function sortGoalsTable(column) {
    if (goalsTableSortState.column === column) {
        goalsTableSortState.direction = goalsTableSortState.direction === 'desc' ? 'asc' : 'desc';
    } else {
        goalsTableSortState.column = column;
        goalsTableSortState.direction = 'desc';
    }
    const allMatches = matches.filter(m => m.is_completed === true || m.is_completed === 1);
    renderStatisticsDashboard(allMatches);
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
let selectedOpponentSearch = '';

const MATCH_GOAL_MINUTES = [12, 25, 38, 45, 52, 63, 70, 78, 85];

function formatMatchDateDisplay(dateKey, timeStr = '19:00') {
    const d = new Date(dateKey + 'T00:00:00');
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleDateString('en-GB', { month: 'short' });
    const year = d.getFullYear();
    return `${day} ${month} ${year} • ${timeStr}`;
}

function formatMonthGroupTitle(monthKey) {
    const [year, monthNum] = monthKey.split('-');
    const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    return `${monthNames[parseInt(monthNum, 10) - 1]} ${year}`;
}

function getMatchResultInfo(result) {
    const map = {
        win: { text: 'WIN', label: 'Thắng', class: 'win' },
        lose: { text: 'LOSS', label: 'Thua', class: 'loss' },
        draw: { text: 'DRAW', label: 'Hòa', class: 'draw' }
    };
    return map[result] || null;
}

function renderFcGreenLogo() {
    return `<div class="mc-team-logo mc-team-logo--home" aria-hidden="true"><span class="mc-team-logo-icon">⚽</span></div>`;
}

function renderOpponentTeamLogo(name) {
    const colors = getOpponentAvatarColors(name);
    const initials = getPlayerInitials(name);
    return `<div class="mc-team-logo mc-team-logo--away" style="background:${colors.bg};color:${colors.text};border-color:${colors.border}" aria-hidden="true">${initials}</div>`;
}

function buildGoalscorersTimeline(match) {
    if (!match.goals || match.goals.length === 0) return '';
    let minuteIndex = 0;
    const rows = [];
    match.goals.forEach(goal => {
        const playerName = getPlayerName(goal.player_id);
        const count = goal.goals || 1;
        for (let i = 0; i < count; i++) {
            const minute = MATCH_GOAL_MINUTES[minuteIndex % MATCH_GOAL_MINUTES.length];
            minuteIndex++;
            rows.push(`<div class="mc-scorer-row"><span class="mc-scorer-icon" aria-hidden="true">⚽</span><span class="mc-scorer-name">${escapeHtml(playerName)}</span><span class="mc-scorer-minute">(${minute}')</span></div>`);
        }
    });
    return `<div class="mc-scorers"><h4 class="mc-scorers-title">Ghi bàn</h4><div class="mc-scorers-list">${rows.join('')}</div></div>`;
}

function buildMatchStatChips(match, showResult) {
    const chips = [];
    if (showResult && match.our_score !== undefined) {
        chips.push(`<span class="mc-chip">⚽ ${match.our_score} bàn</span>`);
        const scorersCount = (match.goals || []).reduce((s, g) => s + (g.goals || 0), 0);
        if (scorersCount > 0) chips.push(`<span class="mc-chip">👥 ${scorersCount} bàn ghi</span>`);
        const resultInfo = getMatchResultInfo(match.result);
        if (resultInfo) chips.push(`<span class="mc-chip mc-chip--${resultInfo.class}">🏆 ${resultInfo.label}</span>`);
        const participants = (match.participant_ids || []).length;
        if (participants > 0) chips.push(`<span class="mc-chip">📋 ${participants} cầu thủ</span>`);
    } else {
        chips.push(`<span class="mc-chip mc-chip--upcoming">📅 Sắp diễn ra</span>`);
    }
    return chips.join('');
}

function renderMatchCard(match, showResult, isLastInGroup = false) {
    const safeId = String(match.id || '').replace(/'/g, "\\'");
    const opponentName = match.opponent ? match.opponent.name : `Đối thủ #${match.opponent_id}`;
    const dateDisplay = formatMatchDateDisplay(match.date);
    const resultInfo = showResult ? getMatchResultInfo(match.result) : null;
    const hasScore = showResult && match.our_score !== undefined && match.opponent_score !== undefined;
    const scoreDisplay = hasScore ? `${match.our_score} - ${match.opponent_score}` : 'VS';
    const goalscorersHtml = showResult ? buildGoalscorersTimeline(match) : '';
    const statChips = buildMatchStatChips(match, showResult);
    const hasDetails = !!(goalscorersHtml || isLoggedIn);
    const resultBadge = resultInfo
        ? `<span class="mc-result-badge mc-result-badge--${resultInfo.class}">${resultInfo.text}</span>`
        : `<span class="mc-result-badge mc-result-badge--upcoming">SẮP ĐÁ</span>`;
    const expandedClass = hasDetails ? '' : ' mc-match-card--no-details';
    const timelineClass = isLastInGroup ? ' mc-timeline-item--last' : '';

    const actionsHtml = isLoggedIn ? `
        <div class="mc-match-actions" onclick="event.stopPropagation()">
            ${showResult
                ? `<button type="button" class="btn btn-primary btn-small" onclick="editMatchResult('${safeId}')">Sửa kết quả</button>`
                : `<button type="button" class="btn btn-primary btn-small" onclick="editMatch('${safeId}')">Sửa</button>`
            }
            <button type="button" class="btn btn-danger btn-small" onclick="deleteMatch('${safeId}')">Xóa</button>
        </div>` : '';

    const detailsHint = hasDetails
        ? `<span class="mc-expand-hint" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></span>`
        : '';

    return `
        <article class="mc-timeline-item${timelineClass}" role="listitem">
            <div class="mc-timeline-node" aria-hidden="true"></div>
            <div class="mc-match-card${expandedClass}${resultInfo ? ` mc-match-card--${resultInfo.class}` : ' mc-match-card--upcoming'}" data-match-id="${escapeHtml(String(match.id || ''))}" onclick="toggleMatchCardExpand('${safeId}', event)" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleMatchCardExpand('${safeId}', event)}">
                <div class="mc-match-compact">
                    <time class="mc-match-date" datetime="${match.date}">${dateDisplay}</time>
                    <div class="mc-match-scoreboard">
                        <div class="mc-team mc-team--home">
                            ${renderFcGreenLogo()}
                            <span class="mc-team-name">FC Green</span>
                        </div>
                        <div class="mc-score${hasScore ? '' : ' mc-score--vs'}">${scoreDisplay}</div>
                        <div class="mc-team mc-team--away">
                            ${renderOpponentTeamLogo(opponentName)}
                            <span class="mc-team-name">${escapeHtml(opponentName)}</span>
                        </div>
                    </div>
                    <div class="mc-match-meta">
                        ${resultBadge}
                        <div class="mc-stat-chips">${statChips}</div>
                        ${detailsHint}
                    </div>
                </div>
                <div class="mc-match-details">
                    ${goalscorersHtml}
                    ${actionsHtml}
                </div>
            </div>
        </article>`;
}

function toggleMatchCardExpand(matchId, event) {
    if (event && (event.target.closest('.mc-match-actions') || event.target.closest('button'))) return;
    const card = document.querySelector(`.mc-match-card[data-match-id="${matchId}"]`);
    if (card && !card.classList.contains('mc-match-card--no-details')) {
        card.classList.toggle('mc-match-card--expanded');
    }
}

function filterCompletedMatchesByOpponent() {
    const input = document.getElementById('match-opponent-search');
    if (!input) return;
    selectedOpponentSearch = input.value.trim().toLowerCase();
    renderCompletedMatches();
}

async function loadMatches(forceRefresh = false) {
    try {
        await ensurePlayersLoaded({ skipRender: true });

        await refreshResource(
            'matches',
            () => matchesAPI.getAll(),
            (data) => {
                matches = data;
                renderUpcomingMatches();
                renderCompletedMatches();
                if (opponents.length > 0) {
                    renderOpponents();
                }
                updateHeaderStats();
                if (players.length > 0) renderPlayers();
            },
            { forceRefresh, staleData: matches.length > 0 ? matches : null }
        );
    } catch (error) {
        alert('Error loading matches: ' + error.message);
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

function getPlayerById(playerId) {
    return players.find(p => p.id === playerId) || null;
}

function renderStatsPlayerAvatar(playerOrId, sizeClass = '') {
    const player = typeof playerOrId === 'object' ? playerOrId : getPlayerById(playerOrId);
    const name = player ? player.name : (typeof playerOrId === 'string' ? getPlayerName(playerOrId) : '?');
    const initials = getPlayerInitials(name);
    const sizeAttr = sizeClass ? ` stats-avatar--${sizeClass}` : '';
    if (player) {
        const imageUrl = getPlayerImageUrl(player);
        if (imageUrl) {
            return `<div class="stats-avatar${sizeAttr}">
                <div class="stats-avatar-placeholder" style="display:none">${initials}</div>
                <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(name)}" class="stats-avatar-img"
                     onerror="this.style.display='none';this.previousElementSibling.style.display='flex'">
            </div>`;
        }
    }
    return `<div class="stats-avatar${sizeAttr}"><div class="stats-avatar-placeholder">${initials}</div></div>`;
}

function destroyStatsCharts() {
    Object.keys(statsCharts).forEach(key => {
        if (statsCharts[key]) {
            statsCharts[key].destroy();
            statsCharts[key] = null;
        }
    });
}

function getMatchQuarterKey(dateStr) {
    if (!dateStr) return '';
    const [year, month] = dateStr.substring(0, 7).split('-');
    const monthNum = parseInt(month, 10);
    let quarter;
    if (monthNum >= 1 && monthNum <= 3) quarter = 'Q1';
    else if (monthNum >= 4 && monthNum <= 6) quarter = 'Q2';
    else if (monthNum >= 7 && monthNum <= 9) quarter = 'Q3';
    else quarter = 'Q4';
    return `${year}-${quarter}`;
}

function filterMatchesByPeriod(matches, monthFilter, quarterFilter) {
    if (monthFilter) {
        return matches.filter(m => m.date && m.date.substring(0, 7) === monthFilter);
    }
    if (quarterFilter) {
        return matches.filter(m => m.date && getMatchQuarterKey(m.date) === quarterFilter);
    }
    return matches;
}

function computePlayerGoalsMap(matchList) {
    const playerGoalsMap = {};
    players.forEach(player => {
        playerGoalsMap[String(player.id)] = { id: player.id, name: player.name, totalGoals: 0, matches: [] };
    });
    matchList.forEach(match => {
        (match.goals || []).forEach(goal => {
            const playerId = String(goal.player_id);
            const goalsInMatch = goal.goals || 0;
            if (!playerGoalsMap[playerId]) {
                playerGoalsMap[playerId] = {
                    id: goal.player_id,
                    name: getPlayerName(goal.player_id),
                    totalGoals: 0,
                    matches: []
                };
            }
            playerGoalsMap[playerId].totalGoals += goalsInMatch;
            playerGoalsMap[playerId].matches.push({ date: match.date, goals: goalsInMatch });
        });
    });
    return playerGoalsMap;
}

function computeParticipationMap(matchList) {
    const participationData = {};
    players.forEach(player => {
        participationData[String(player.id)] = {
            id: player.id,
            name: player.name,
            matches: {},
            totalParticipated: 0,
            totalNotParticipated: 0
        };
    });
    matchList.forEach(match => {
        const participantIds = (match.participant_ids || []).map(id => String(id));
        players.forEach(player => {
            const key = String(player.id);
            const participated = participantIds.includes(key) ? 1 : 0;
            participationData[key].matches[match.date] = participated;
            if (participated === 1) {
                participationData[key].totalParticipated++;
            } else {
                participationData[key].totalNotParticipated++;
            }
        });
    });
    return Object.values(participationData).map(pd => {
        const total = pd.totalParticipated + pd.totalNotParticipated;
        return {
            ...pd,
            participationRate: total > 0 ? parseFloat(((pd.totalParticipated / total) * 100).toFixed(1)) : 0
        };
    });
}

function getPlayerGoalTrend(playerData, allMatches) {
    if (!playerData || allMatches.length < 2) return { dir: 'flat', label: '—' };
    const sorted = [...allMatches].filter(m => m.date).sort((a, b) => a.date.localeCompare(b.date));
    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, mid);
    const secondHalf = sorted.slice(mid);
    const sumGoals = (list) => list.reduce((sum, m) => {
        const g = (m.goals || []).find(x => String(x.player_id) === String(playerData.id));
        return sum + (g ? (g.goals || 0) : 0);
    }, 0);
    const first = sumGoals(firstHalf);
    const second = sumGoals(secondHalf);
    if (second > first) return { dir: 'up', label: `+${second - first}` };
    if (second < first) return { dir: 'down', label: `${second - first}` };
    return { dir: 'flat', label: '0' };
}

function formatStatsMonthLabel(ym) {
    const [year, month] = ym.split('-');
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    return `${months[parseInt(month, 10) - 1]}/${year.slice(2)}`;
}

function setStatsTimelineView(view) {
    statsTimelineView = view;
    document.querySelectorAll('[data-timeline-view]').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-timeline-view') === view);
    });
    const completed = matches.filter(m => m.is_completed === true || m.is_completed === 1);
    renderMatchTimeline(completed);
}

function renderMatchesList(matchesList, showResult = false) {
    if (!matchesList || matchesList.length === 0) {
        return '<div class="empty-state"><h3>Chưa có trận đấu</h3></div>';
    }

    const validMatches = matchesList.filter(match => match && match.date);
    if (validMatches.length === 0) {
        return '<div class="empty-state"><h3>Chưa có trận đấu</h3></div>';
    }

    const sortedMatches = [...validMatches].sort((a, b) => {
        try {
            const dateAParts = a.date.split('-');
            const dateBParts = b.date.split('-');
            if (dateAParts.length !== 3 || dateBParts.length !== 3) return 0;
            const dateA = new Date(parseInt(dateAParts[0]), parseInt(dateAParts[1]) - 1, parseInt(dateAParts[2])).getTime();
            const dateB = new Date(parseInt(dateBParts[0]), parseInt(dateBParts[1]) - 1, parseInt(dateBParts[2])).getTime();
            return dateB - dateA;
        } catch (e) {
            return 0;
        }
    });

    const matchesByMonth = {};
    sortedMatches.forEach(match => {
        const monthKey = match.date.substring(0, 7);
        if (!matchesByMonth[monthKey]) matchesByMonth[monthKey] = [];
        matchesByMonth[monthKey].push(match);
    });

    const monthKeys = Object.keys(matchesByMonth).sort((a, b) => b.localeCompare(a));

    return `<div class="mc-matches-list" role="list">${monthKeys.map(monthKey => {
        const monthMatches = matchesByMonth[monthKey];
        const monthTitle = formatMonthGroupTitle(monthKey);
        return `
            <section class="mc-month-group">
                <header class="mc-month-header">
                    <h3 class="mc-month-title">${monthTitle}</h3>
                    <span class="mc-month-count">${monthMatches.length} trận</span>
                </header>
                <div class="mc-month-timeline" role="list">
                    ${monthMatches.map((match, idx) => renderMatchCard(match, showResult, idx === monthMatches.length - 1)).join('')}
                </div>
            </section>`;
    }).join('')}</div>`;
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

    if (selectedOpponentSearch) {
        completedMatches = completedMatches.filter(match => {
            const name = (match.opponent?.name || '').toLowerCase();
            return name.includes(selectedOpponentSearch);
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
    const opponentSearchAfter = document.getElementById('match-opponent-search');
    if (monthFilterAfter) monthFilterAfter.value = selectedMonthFilter;
    if (quarterFilterAfter) quarterFilterAfter.value = selectedCompletedQuarterFilter;
    if (opponentSearchAfter) opponentSearchAfter.value = selectedOpponentSearch;
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
    
    // Clear existing options except "Tất cả"
    monthFilter.innerHTML = '<option value="">Tất cả</option>';
    
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
    
    // Clear existing options except "Tất cả"
    quarterFilter.innerHTML = '<option value="">Tất cả</option>';
    
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
    container.innerHTML = renderMatchesList(matches, false);
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
        invalidateMatchesCache();
        closeMatchModal();
        await loadMatches(true);
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
        invalidateMatchesCache();
        await loadMatches(true);
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
function getMatchResultFromScores(ourScore, opponentScore) {
    if (ourScore > opponentScore) return 'win';
    if (ourScore < opponentScore) return 'lose';
    return 'draw';
}

function updateMatchResultPreview() {
    const ourScore = parseInt(document.getElementById('match-our-score')?.value, 10) || 0;
    const opponentScore = parseInt(document.getElementById('match-opponent-score')?.value, 10) || 0;
    const result = getMatchResultFromScores(ourScore, opponentScore);
    const badge = document.getElementById('match-result-badge');
    if (!badge) return;

    const info = getMatchResultInfo(result);
    badge.textContent = info ? info.label : 'Hòa';
    badge.className = `mrm-result-badge mrm-result-badge--${result}`;
}

function openMatchResultModal(matchId) {
    editingMatchResultId = matchId;
    const modal = document.getElementById('match-result-modal');
    const form = document.getElementById('match-result-form');
    const match = matches.find(m => m.id === matchId);
    
    if (!match) {
        alert('Match not found');
        return;
    }
    
    document.getElementById('match-our-score').value = match.our_score || 0;
    document.getElementById('match-opponent-score').value = match.opponent_score || 0;
    updateMatchResultPreview();
    const opponentName = match.opponent ? match.opponent.name : 'Đối thủ';
    document.getElementById('match-result-opponent-label').textContent = opponentName;
    
    const opponentLogoEl = document.getElementById('match-result-opponent-logo');
    if (opponentLogoEl) {
        if (match.opponent) {
            const colors = getOpponentAvatarColors(match.opponent.name);
            opponentLogoEl.textContent = getPlayerInitials(match.opponent.name);
            opponentLogoEl.style.background = colors.bg;
            opponentLogoEl.style.color = colors.text;
            opponentLogoEl.style.borderColor = colors.border;
        } else {
            opponentLogoEl.textContent = '?';
            opponentLogoEl.style.background = '#F3F4F6';
            opponentLogoEl.style.color = '#6B7280';
            opponentLogoEl.style.borderColor = '#E5E7EB';
        }
    }
    
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

function renderMrmPlayerAvatar(player) {
    const initials = getPlayerInitials(player.name);
    const imageUrl = getPlayerImageUrl(player);
    if (imageUrl) {
        return `<div class="mrm-player-avatar">
            <div class="mrm-player-avatar-placeholder" style="display:none">${initials}</div>
            <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(player.name)}" class="mrm-player-avatar-img"
                 onerror="this.style.display='none';this.previousElementSibling.style.display='flex'">
        </div>`;
    }
    return `<div class="mrm-player-avatar"><div class="mrm-player-avatar-placeholder">${initials}</div></div>`;
}

function renderMatchParticipants(selectedPlayerIds = []) {
    const container = document.getElementById('match-participants-container');
    if (!container) return;
    
    if (players.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Chưa có cầu thủ nào. Vui lòng thêm cầu thủ trước.</p></div>';
        return;
    }
    
    const normalizedSelectedIds = selectedPlayerIds.map(id => String(id));
    
    container.innerHTML = players.map(player => {
        const playerIdStr = String(player.id);
        const isChecked = normalizedSelectedIds.includes(playerIdStr);
        const jerseyBadge = player.jersey_number
            ? `<span class="mrm-jersey-badge">#${player.jersey_number}</span>`
            : '';
        return `
            <label class="mrm-player-card position-checkbox">
                <input type="checkbox" value="${playerIdStr}" ${isChecked ? 'checked' : ''}>
                <div class="mrm-player-card-inner">
                    <span class="mrm-player-check" aria-hidden="true">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                    ${renderMrmPlayerAvatar(player)}
                    <span class="mrm-player-name">${escapeHtml(player.name)}</span>
                    ${jerseyBadge}
                </div>
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

function removeGoalEntryRow(goalRow) {
    goalRow.classList.add('mrm-row-exit');
    goalRow.addEventListener('animationend', () => goalRow.remove(), { once: true });
}

function addGoalEntryRow(playerId = null, goals = 1) {
    const container = document.getElementById('match-goals-container');
    const goalRow = document.createElement('div');
    goalRow.className = 'goal-entry-row mrm-goal-row';
    
    const playerSelect = document.createElement('select');
    playerSelect.required = true;
    playerSelect.setAttribute('aria-label', 'Chọn cầu thủ ghi bàn');
    playerSelect.innerHTML = '<option value="">Chọn cầu thủ</option>' + 
        players.map(p => `<option value="${p.id}" ${playerId === p.id ? 'selected' : ''}>${escapeHtml(p.name)}${p.jersey_number ? ` (#${p.jersey_number})` : ''}</option>`).join('');
    
    const goalsInput = document.createElement('input');
    goalsInput.type = 'number';
    goalsInput.min = '1';
    goalsInput.value = goals;
    goalsInput.required = true;
    goalsInput.placeholder = 'Số bàn';
    goalsInput.className = 'mrm-goal-count';
    goalsInput.setAttribute('aria-label', 'Số bàn thắng');
    
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'mrm-goal-remove';
    removeBtn.setAttribute('aria-label', 'Xóa cầu thủ ghi bàn');
    removeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    removeBtn.onclick = () => removeGoalEntryRow(goalRow);
    
    goalRow.appendChild(playerSelect);
    goalRow.appendChild(goalsInput);
    goalRow.appendChild(removeBtn);
    container.appendChild(goalRow);
}

async function saveMatchResult(event) {
    event.preventDefault();
    showLoading();
    
    try {
        const ourScore = parseInt(document.getElementById('match-our-score').value);
        const opponentScore = parseInt(document.getElementById('match-opponent-score').value);
        const result = getMatchResultFromScores(ourScore, opponentScore);
        
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
        invalidateMatchesCache();
        closeMatchResultModal();
        await loadMatches(true);
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
function renderParticipationTable(completedMatches, participationArray, filteredMatches) {
    const container = document.getElementById('participation-table-wrapper');
    if (!container) return;

    if (!filteredMatches || filteredMatches.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Chưa có dữ liệu tham gia trận đấu</p></div>';
        return;
    }

    const allMatchDates = [...new Set(filteredMatches.map(m => m.date))].sort();

    if (participationTableSortState.column === 'rate') {
        participationArray.sort((a, b) => {
            if (participationTableSortState.direction === 'desc') {
                return b.participationRate - a.participationRate;
            }
            return a.participationRate - b.participationRate;
        });
    }

    let tableRows = '';
    participationArray.forEach(playerData => {
        let rowCells = `<td><strong>${escapeHtml(playerData.name)}</strong></td>`;

        allMatchDates.forEach(date => {
            const status = playerData.matches[date] !== undefined ? playerData.matches[date] : 0;
            const statusClass = status === 1 ? 'participation-yes' : 'participation-no';
            rowCells += `<td class="${statusClass}">${status}</td>`;
        });

        const participationRateText = playerData.participationRate.toFixed(1);
        const rateColor = playerData.participationRate < 50 ? '#dc3545' : '#4F46E5';

        rowCells += `<td class="participation-total-participated"><strong style="color: #28a745;">${playerData.totalParticipated}</strong></td>`;
        rowCells += `<td class="participation-total-not-participated"><strong style="color: #dc3545;">${playerData.totalNotParticipated}</strong></td>`;
        rowCells += `<td class="participation-rate"><strong style="color: ${rateColor};">${participationRateText}%</strong></td>`;

        tableRows += `<tr>${rowCells}</tr>`;
    });

    let dateHeaders = '';
    if (allMatchDates.length > 0) {
        dateHeaders = allMatchDates.map(date => {
            const dateObj = new Date(date + 'T00:00:00');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            return `<th>${day}/${month}</th>`;
        }).join('');
    }

    const sortIcon = participationTableSortState.direction === 'desc' ? '▼' : '▲';
    const sortStyle = 'cursor: pointer; user-select: none;';

    const participationCards = participationArray.map(playerData => {
        const rateColor = playerData.participationRate < 50 ? '#dc3545' : '#4F46E5';
        const detailRows = allMatchDates.map(date => {
            const status = playerData.matches[date] !== undefined ? playerData.matches[date] : 0;
            const dateObj = new Date(date + 'T00:00:00');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const label = status === 1 ? 'Có mặt' : 'Vắng';
            return `
                <div class="stats-mobile-row">
                    <span>${day}/${month}</span>
                    <strong>${label}</strong>
                </div>
            `;
        }).join('');

        return `
            <article class="stats-mobile-card">
                <div class="stats-mobile-card-header">
                    <h4>${escapeHtml(playerData.name)}</h4>
                    <span class="stats-mobile-total" style="color: ${rateColor};">${playerData.participationRate.toFixed(1)}%</span>
                </div>
                <div class="stats-mobile-summary">
                    <span>V: <strong style="color:#28a745;">${playerData.totalParticipated}</strong></span>
                    <span>X: <strong style="color:#dc3545;">${playerData.totalNotParticipated}</strong></span>
                </div>
                <div class="stats-mobile-card-body">
                    ${detailRows}
                </div>
            </article>
        `;
    }).join('');

    container.innerHTML = `
        <div class="participation-table-scroll stats-table-scroll">
            <table class="participation-table stats-analytics-table">
                <thead>
                    <tr>
                        <th class="participation-player-name">Tên cầu thủ</th>
                        ${dateHeaders}
                        <th class="participation-total-participated-header">V</th>
                        <th class="participation-total-not-participated-header">X</th>
                        <th id="participation-rate-header" class="participation-rate-header" style="${sortStyle}" onclick="sortParticipationTable('rate')">
                            % ${sortIcon}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
        <div class="stats-mobile-cards participation-mobile-cards">
            ${participationCards}
        </div>
    `;
}

function renderParticipationStatistics(completedMatches) {
    const filteredMatches = filterMatchesByPeriod(
        completedMatches, selectedParticipationMonthFilter, selectedParticipationQuarterFilter
    );
    const participationArray = computeParticipationMap(filteredMatches);
    renderParticipationTable(completedMatches, participationArray, filteredMatches);
}

function sortParticipationTable(column) {
    if (participationTableSortState.column === column) {
        participationTableSortState.direction = participationTableSortState.direction === 'desc' ? 'asc' : 'desc';
    } else {
        participationTableSortState.column = column;
        participationTableSortState.direction = 'desc';
    }
    const allMatches = matches.filter(m => m.is_completed === true || m.is_completed === 1);
    renderStatisticsDashboard(allMatches);
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
    document.getElementById('login-btn').style.display = 'none';
    document.getElementById('logout-btn').style.display = 'flex';
    const authStatus = document.getElementById('profile-auth-status');
    if (authStatus) authStatus.textContent = 'Quản trị viên';

    document.querySelectorAll('.section-header .btn-primary').forEach(btn => {
        btn.style.display = '';
    });

    const fab = document.getElementById('fab-add-player');
    if (fab) fab.style.display = 'flex';

    if (players.length > 0) renderPlayers();
    if (opponents.length > 0) renderOpponents();
    if (matches.length > 0) {
        renderUpcomingMatches();
        renderCompletedMatches();
    }
}

function updateUIForLogout() {
    document.getElementById('login-btn').style.display = 'flex';
    document.getElementById('logout-btn').style.display = 'none';
    const authStatus = document.getElementById('profile-auth-status');
    if (authStatus) authStatus.textContent = 'Khách';

    document.querySelectorAll('.section-header .btn-primary').forEach(btn => {
        btn.style.display = 'none';
    });

    const fab = document.getElementById('fab-add-player');
    if (fab) fab.style.display = 'none';

    if (players.length > 0) renderPlayers();
    if (opponents.length > 0) renderOpponents();
    if (matches.length > 0) {
        renderUpcomingMatches();
        renderCompletedMatches();
    }
}
