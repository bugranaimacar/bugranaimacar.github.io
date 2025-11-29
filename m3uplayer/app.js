// State
let allChannels = [];
let groups = {};
let currentGroup = 'All';
let hls = null;
let favorites = JSON.parse(localStorage.getItem('streamflow_favorites') || '[]');
let history = JSON.parse(localStorage.getItem('streamflow_history') || '[]');
let autoReconnect = JSON.parse(localStorage.getItem('streamflow_autoreconnect') || 'false');
let activeTab = 'channels'; // 'channels', 'favorites', 'history'

// DOM Elements
const uploadOverlay = document.getElementById('upload-overlay');
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const appContainer = document.getElementById('app-container');
const groupsListEl = document.getElementById('groups-list');
const channelsListEl = document.getElementById('channels');
const searchInput = document.getElementById('search-input');
const video = document.getElementById('video');
const videoContainer = document.getElementById('video-container');
const currentGroupTitle = document.getElementById('current-group-title');

// Settings Elements
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings');
const autoReconnectCheckbox = document.getElementById('auto-reconnect');

// Event Listeners
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#fff';
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--accent-color)';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--accent-color)';
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
});

searchInput.addEventListener('input', (e) => {
    renderChannels(e.target.value);
});

// Mobile Menu Toggle
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const sidebar = document.getElementById('sidebar');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 &&
        sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        e.target !== mobileMenuToggle) {
        sidebar.classList.remove('open');
    }
});

// Settings Event Listeners
if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('visible');
        if (autoReconnectCheckbox) autoReconnectCheckbox.checked = autoReconnect;
    });
}

if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('visible');
    });
}

if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('visible');
        }
    });
}

if (autoReconnectCheckbox) {
    autoReconnectCheckbox.addEventListener('change', (e) => {
        autoReconnect = e.target.checked;
        localStorage.setItem('streamflow_autoreconnect', JSON.stringify(autoReconnect));
    });
}

// File Processing
function processFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        parseM3U(e.target.result);
        uploadOverlay.classList.add('hidden');
        appContainer.classList.add('visible');
    };
    reader.readAsText(file);
}

// M3U Parser
function parseM3U(content) {
    const lines = content.split('\n');
    allChannels = [];
    groups = { 'All': [] };

    let currentChannel = {};

    for (let line of lines) {
        line = line.trim();
        if (line.startsWith('#EXTINF:')) {
            // Parse metadata
            const info = line.substring(8);
            const parts = info.split(',');
            const name = parts[parts.length - 1].trim();

            // Extract attributes
            const logoMatch = info.match(/tvg-logo="([^"]*)"/);
            const groupMatch = info.match(/group-title="([^"]*)"/);

            currentChannel = {
                id: Date.now() + Math.random().toString(36).substr(2, 9), // Unique ID for internal use
                name: name,
                logo: logoMatch ? logoMatch[1] : null,
                group: groupMatch ? groupMatch[1] : 'Uncategorized',
                url: ''
            };
        } else if (line.startsWith('http')) {
            let url = line;

            // Auto-convert Xtream Codes to HLS
            // Live: http://domain:port/user/pass/id -> http://domain:port/live/user/pass/id.m3u8
            // VODs (Movies/Series) are usually MP4/MKV and should NOT be converted to .m3u8

            const xcLiveRegex = /^(http:\/\/[^/]+)\/([^/]+)\/([^/]+)\/([0-9]+)$/;
            const liveMatch = url.match(xcLiveRegex);

            if (liveMatch) {
                url = `${liveMatch[1]}/live/${liveMatch[2]}/${liveMatch[3]}/${liveMatch[4]}.m3u8`;
            }
            // We do NOT convert VODs (containing /movie/ or /series/)

            currentChannel.url = url;
            if (currentChannel.name) {
                allChannels.push(currentChannel);

                // Add to All group
                groups['All'].push(currentChannel);

                // Add to specific group
                if (!groups[currentChannel.group]) {
                    groups[currentChannel.group] = [];
                }
                groups[currentChannel.group].push(currentChannel);

                currentChannel = {}; // Reset
            }
        }
    }

    // Add virtual groups
    updateVirtualGroups();

    renderGroups();
    renderChannels();
}

function updateVirtualGroups() {
    groups['Favorites'] = allChannels.filter(ch => favorites.includes(ch.name)); // Match by name for persistence
    groups['History'] = history.map(hName => allChannels.find(ch => ch.name === hName)).filter(Boolean);
}

// Rendering
function renderGroups() {
    groupsListEl.innerHTML = '';

    // Special Groups
    const specialGroups = ['Favorites', 'History', 'All'];
    specialGroups.forEach(name => createGroupItem(name, true));

    const separator = document.createElement('div');
    separator.style.borderBottom = '1px solid var(--border-color)';
    separator.style.margin = '0.5rem 0';
    groupsListEl.appendChild(separator);

    // Regular Groups
    const sortedGroups = Object.keys(groups)
        .filter(g => !specialGroups.includes(g))
        .sort((a, b) => a.localeCompare(b));

    sortedGroups.forEach(groupName => createGroupItem(groupName));
}

function createGroupItem(groupName, isSpecial = false) {
    const div = document.createElement('div');
    div.className = `group-item ${groupName === currentGroup ? 'active' : ''}`;
    if (isSpecial) div.style.fontWeight = '600';

    let icon = '';
    if (groupName === 'Favorites') icon = '⭐ ';
    if (groupName === 'History') icon = '🕒 ';
    if (groupName === 'All') icon = '📺 ';

    div.innerHTML = `
        <span>${icon}${groupName}</span>
        <span class="group-count">${groups[groupName] ? groups[groupName].length : 0}</span>
    `;
    div.onclick = () => {
        currentGroup = groupName;
        updateVirtualGroups(); // Refresh in case of changes
        document.querySelectorAll('.group-item').forEach(el => el.classList.remove('active'));
        div.classList.add('active');
        currentGroupTitle.textContent = groupName;
        searchInput.value = '';
        renderChannels();
    };
    groupsListEl.appendChild(div);
}

function renderChannels(searchQuery = '') {
    channelsListEl.innerHTML = '';
    let channels = groups[currentGroup] || [];

    if (searchQuery) {
        // Global search if query exists
        channels = allChannels.filter(ch =>
            ch.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    const limit = 100;
    const displayChannels = channels.slice(0, limit);

    displayChannels.forEach(channel => {
        const div = document.createElement('div');
        div.className = 'channel-item';
        const isFav = favorites.includes(channel.name);

        const logoHtml = channel.logo
            ? `<img src="${channel.logo}" class="channel-logo" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNjY2IiBzdHJva2Utd2lkdGg9IjIiPjxyZWN0IHg9IjIiIHk9IjciIHdpZHRoPSIyMCIgaGVpZ2h0PSIxNSIgcng9IjIiIHJ5PSIyIi8+PHBhdGggZD0iTTE3IDJsLTUgNSA1IDVNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIiBzdHJva2U9Im5vbmUiLz48L3N2Zz4='">`
            : `<div class="channel-logo" style="display:flex;align-items:center;justify-content:center;color:#666">📺</div>`;

        div.innerHTML = `
            ${logoHtml}
            <div class="channel-info">
                <div class="channel-name">${channel.name}</div>
            </div>
            <button class="fav-btn" onclick="toggleFavorite(event, '${channel.name.replace(/'/g, "\\'")}')">
                ${isFav ? '⭐' : '☆'}
            </button>
        `;

        div.onclick = (e) => {
            if (!e.target.classList.contains('fav-btn')) {
                playChannel(channel, div);
            }
        };
        channelsListEl.appendChild(div);
    });

    if (channels.length > limit) {
        const more = document.createElement('div');
        more.style.padding = '1rem';
        more.style.textAlign = 'center';
        more.style.color = 'var(--text-secondary)';
        more.textContent = `...and ${channels.length - limit} more channels`;
        channelsListEl.appendChild(more);
    }
}

function toggleFavorite(e, channelName) {
    e.stopPropagation();
    const index = favorites.indexOf(channelName);
    if (index === -1) {
        favorites.push(channelName);
    } else {
        favorites.splice(index, 1);
    }
    localStorage.setItem('streamflow_favorites', JSON.stringify(favorites));
    updateVirtualGroups();

    // Re-render only if we are in Favorites view or to update the icon
    if (currentGroup === 'Favorites') {
        renderChannels();
        renderGroups(); // Update count
    } else {
        // Just update the button in the current view
        const btn = e.target;
        btn.textContent = favorites.includes(channelName) ? '⭐' : '☆';
        renderGroups(); // Update count
    }
}

function addToHistory(channelName) {
    history = history.filter(h => h !== channelName); // Remove if exists
    history.unshift(channelName); // Add to top
    if (history.length > 50) history.pop(); // Limit
    localStorage.setItem('streamflow_history', JSON.stringify(history));
    updateVirtualGroups();
}

// Playback
function playChannel(channel, element) {
    addToHistory(channel.name);

    document.querySelectorAll('.channel-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');

    const placeholder = document.querySelector('.player-placeholder');
    if (placeholder) placeholder.style.display = 'none';
    video.style.display = 'block';

    // Determine if we should use HLS or direct playback
    const isHls = channel.url.includes('.m3u8');

    if (isHls && Hls.isSupported()) {
        if (hls) {
            hls.destroy();
        }
        hls = new Hls();
        hls.loadSource(channel.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
            video.play().catch(e => console.log("Auto-play prevented:", e));
        });
        hls.on(Hls.Events.ERROR, function (event, data) {
            if (data.fatal) {
                switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        console.log("fatal network error encountered, try to recover");
                        if (autoReconnect) {
                            console.log("Auto-reconnecting in 2s...");
                            setTimeout(() => hls.startLoad(), 2000);
                        } else {
                            hls.startLoad();
                        }
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        console.log("fatal media error encountered, try to recover");
                        hls.recoverMediaError();
                        break;
                    default:
                        console.log("fatal error, cannot recover");
                        if (autoReconnect) {
                            console.log("Auto-reconnecting (reloading source) in 2s...");
                            setTimeout(() => {
                                hls.destroy();
                                playChannel(channel, element); // Recursive retry
                            }, 2000);
                        } else {
                            hls.destroy();
                        }
                        break;
                }
            }
        });
    } else {
        // Direct playback (MP4, etc.)
        if (hls) {
            hls.destroy();
            hls = null;
        }
        video.src = channel.url;
        video.play().catch(e => console.log("Auto-play prevented (Direct):", e));

        // Basic auto-reconnect for direct playback
        video.onerror = () => {
            if (autoReconnect) {
                console.log("Direct playback error. Retrying in 2s...");
                setTimeout(() => {
                    video.src = channel.url;
                    video.play();
                }, 2000);
            }
        };
    }
}
