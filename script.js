// Состояние приложения
let games = JSON.parse(localStorage.getItem('games')) || [];
let currentFilter = 'all';
let editingId = null;

// Ключ API RAWG получаем из LocalStorage
let RAWG_API_KEY = localStorage.getItem('rawg_api_key') || '';

// Элементы DOM
const gamesGrid = document.getElementById('games-grid');
const addGameBtn = document.getElementById('add-game-btn');
const modalOverlay = document.getElementById('modal-overlay');
const closeModalBtn = document.getElementById('close-modal');
const gameForm = document.getElementById('game-form');
const filterBtns = document.querySelectorAll('.filter-btn');
const sizeBtns = document.querySelectorAll('.size-btn');
const viewBtns = document.querySelectorAll('.view-btn');
const modalTitle = document.querySelector('.modal-header h2');
const submitBtn = document.querySelector('.btn-submit');
const gameSearchInput = document.getElementById('game-search');
const searchResults = document.getElementById('search-results');

// Инициализация
function init() {
    renderGames();
    setupEventListeners();
}

// Поиск игр через RAWG API
async function searchGames(query) {
    if (!RAWG_API_KEY) {
        searchResults.innerHTML = `
            <div style="padding: 1rem; font-size: 0.8rem; color: var(--text-muted); text-align: center;">
                Для работы поиска нужен API ключ RAWG.<br>
                <a href="https://rawg.io/apidocs" target="_blank" style="color: var(--primary);">Получить ключ</a> и вставить в script.js
            </div>
        `;
        searchResults.classList.add('active');
        return;
    }
    if (query.length < 3) {
        searchResults.classList.remove('active');
        return;
    }

    try {
        const response = await fetch(`https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${query}&page_size=5`);
        const data = await response.json();
        displaySearchResults(data.results);
    } catch (error) {
        console.error('Ошибка при поиске игр:', error);
    }
}

function displaySearchResults(results) {
    searchResults.innerHTML = '';
    if (results.length === 0) {
        searchResults.classList.remove('active');
        return;
    }

    results.forEach(game => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML = `
            <img src="${game.background_image || 'https://via.placeholder.com/40x50'}" class="search-result-img">
            <div class="search-result-info">
                <span class="search-result-title">${game.name}</span>
                <span class="search-result-year">${game.released ? game.released.split('-')[0] : 'N/A'}</span>
            </div>
        `;
        item.addEventListener('click', () => selectGameFromSearch(game));
        searchResults.appendChild(item);
    });
    searchResults.classList.add('active');
}

function selectGameFromSearch(game) {
    document.getElementById('game-title').value = game.name;
    document.getElementById('game-image').value = game.background_image;
    searchResults.classList.remove('active');
    gameSearchInput.value = '';
}

// Рендеринг игр
function renderGames() {
    gamesGrid.innerHTML = '';
    
    const filteredGames = currentFilter === 'all' 
        ? games 
        : games.filter(game => game.status === currentFilter);

    if (filteredGames.length === 0) {
        gamesGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-muted);">
                <i data-lucide="ghost" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>Тут пока пусто... Добавьте свою первую игру!</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    filteredGames.forEach((game, index) => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.style.animationDelay = `${index * 0.1}s`;

        const statusLabels = {
            'completed': 'Пройдено',
            'playing': 'Играю',
            'backlog': 'В планах'
        };

        card.innerHTML = `
            <div class="card-actions">
                <button class="action-btn edit-btn" onclick="openEditModal('${game.id}')">
                    <i data-lucide="edit-3"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteGame('${game.id}')">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
            <div class="game-image-wrapper">
                <img src="${game.image}" alt="${game.title}" class="game-image" onerror="this.src='https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop'">
            </div>
            <div class="game-info">
                <span class="game-title">${game.title}</span>
                <span class="game-status-tag status-${game.status}">${statusLabels[game.status]}</span>
            </div>
        `;
        gamesGrid.appendChild(card);
    });

    lucide.createIcons();
}

// Обработка отправки формы (создание или редактирование)
function handleFormSubmit(e) {
    e.preventDefault();

    const gameData = {
        title: document.getElementById('game-title').value,
        image: document.getElementById('game-image').value,
        status: document.getElementById('game-status').value
    };

    if (editingId) {
        // Редактирование
        games = games.map(game => 
            game.id === editingId ? { ...game, ...gameData } : game
        );
        editingId = null;
    } else {
        // Создание новой
        const newGame = {
            id: Date.now().toString(),
            ...gameData
        };
        games.unshift(newGame);
    }

    saveGames();
    renderGames();
    closeModal();
    gameForm.reset();
}

// Открытие модалки для редактирования
window.openEditModal = function(id) {
    const game = games.find(g => g.id === id);
    if (!game) return;

    editingId = id;
    document.getElementById('game-title').value = game.title;
    document.getElementById('game-image').value = game.image;
    document.getElementById('game-status').value = game.status;
    
    modalTitle.textContent = 'Редактировать игру';
    submitBtn.textContent = 'Обновить данные';
    openModal();
};

// Удаление игры
window.deleteGame = function(id) {
    if (confirm('Удалить эту игру из списка?')) {
        games = games.filter(game => game.id !== id);
        saveGames();
        renderGames();
    }
};

// Сохранение в LocalStorage
function saveGames() {
    localStorage.setItem('games', JSON.stringify(games));
}

// Управление модальным окном
function openModal() {
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
    editingId = null;
    gameForm.reset();
    modalTitle.textContent = 'Добавить новую игру';
    submitBtn.textContent = 'Сохранить игру';
}

// Слушатели событий
function setupEventListeners() {
    addGameBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    
    // Элементы настроек
    const settingsBtn = document.getElementById('settings-btn');
    const settingsOverlay = document.getElementById('settings-overlay');
    const closeSettingsBtn = document.getElementById('close-settings');
    const saveSettingsBtn = document.getElementById('save-settings');
    const apiKeyInput = document.getElementById('api-key-input');

    settingsBtn.addEventListener('click', () => {
        apiKeyInput.value = RAWG_API_KEY;
        settingsOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    closeSettingsBtn.addEventListener('click', () => {
        settingsOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    saveSettingsBtn.addEventListener('click', () => {
        RAWG_API_KEY = apiKeyInput.value.trim();
        localStorage.setItem('rawg_api_key', RAWG_API_KEY);
        settingsOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
        alert('Настройки сохранены! Поиск теперь будет использовать новый ключ.');
    });

    settingsOverlay.addEventListener('click', (e) => {
        if (e.target === settingsOverlay) {
            settingsOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    gameForm.addEventListener('submit', handleFormSubmit);

    // Слушатель для поиска игр (с debounce)
    let timeout = null;
    gameSearchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => searchGames(e.target.value), 500);
    });

    // Закрытие выпадающего списка при клике вне его
    document.addEventListener('click', (e) => {
        if (!gameSearchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.status;
            renderGames();
        });
    });

    // Управление размером сетки
    sizeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            sizeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const size = btn.dataset.size;
            let width;
            if (size === 'small') width = '180px';
            else if (size === 'medium') width = '280px';
            else width = '400px';
            
            document.documentElement.style.setProperty('--grid-size', width);
        });
    });

    // Переключение вида (Сетка/Список)
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const view = btn.dataset.view;
            if (view === 'list') {
                gamesGrid.classList.add('view-list');
                document.querySelector('.grid-size-control').style.opacity = '0.3';
                document.querySelector('.grid-size-control').style.pointerEvents = 'none';
            } else {
                gamesGrid.classList.remove('view-list');
                document.querySelector('.grid-size-control').style.opacity = '1';
                document.querySelector('.grid-size-control').style.pointerEvents = 'all';
            }
        });
    });
}

// Запуск
document.addEventListener('DOMContentLoaded', init);


