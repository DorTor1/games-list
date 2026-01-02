// Состояние приложения
let games = JSON.parse(localStorage.getItem('games')) || [];
let currentFilter = 'all';
let editingId = null;

// Элементы DOM
const gamesGrid = document.getElementById('games-grid');
const addGameBtn = document.getElementById('add-game-btn');
const modalOverlay = document.getElementById('modal-overlay');
const closeModalBtn = document.getElementById('close-modal');
const gameForm = document.getElementById('game-form');
const filterBtns = document.querySelectorAll('.filter-btn');
const modalTitle = document.querySelector('.modal-header h2');
const submitBtn = document.querySelector('.btn-submit');

// Инициализация
function init() {
    renderGames();
    setupEventListeners();
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
    
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    gameForm.addEventListener('submit', handleFormSubmit);

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.status;
            renderGames();
        });
    });
}

// Запуск
document.addEventListener('DOMContentLoaded', init);


