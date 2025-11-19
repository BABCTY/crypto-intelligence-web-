// ===== CRYPTO INTELLIGENCE - PROFESSIONAL JAVASCRIPT =====

// Global Variables
let coins = [];
let filteredCoins = [];
let news = [];
let selectedCoin = null;

// DOM Elements
const coinsGrid = document.getElementById('coinsGrid');
const newsContainer = document.getElementById('newsContainer');
const loading = document.getElementById('loading');
const searchInput = document.getElementById('searchInput');
const resultsCount = document.getElementById('resultsCount');
const coinModal = document.getElementById('coinModal');
const modalContent = document.getElementById('modalContent');

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    showLoading();
    Promise.all([fetchCoins(), fetchNews()])
        .then(() => {
            hideLoading();
            displayCoins();
            displayNews();
            setupEventListeners();
        })
        .catch(error => {
            console.error('Initialization error:', error);
            hideLoading();
            showError('Failed to load data. Please refresh the page.');
        });
}

// ===== DATA FETCHING =====
async function fetchCoins() {
    try {
        showLoading();
        const pages = [1, 2]; // 500 coins total
        const allCoins = [];
        
        for (const page of pages) {
            const response = await fetch(
                `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}`
            );
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            allCoins.push(...data);
        }
        
        coins = allCoins;
        filteredCoins = allCoins;
        updateResultsCount();
        return allCoins;
    } catch (error) {
        console.error('Error fetching coins:', error);
        showError('Failed to fetch cryptocurrency data');
        return [];
    }
}

async function fetchNews() {
    try {
        const response = await fetch(
            'https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=Market,Trading,Blockchain'
        );
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        news = data.Data || [];
        return news;
    } catch (error) {
        console.error('Error fetching news:', error);
        showError('Failed to fetch news data');
        return [];
    }
}

async function fetchCoinDetails(coinId) {
    try {
        showModalLoading();
        const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=false`
        );
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        return formatCoinDetails(data);
    } catch (error) {
        console.error('Error fetching coin details:', error);
        showError('Failed to fetch coin details');
        return null;
    }
}

// ===== DATA FORMATTING =====
function formatCoinDetails(data) {
    return {
        id: data.id,
        name: data.name,
        symbol: data.symbol.toUpperCase(),
        price: data.market_data.current_price.usd,
        market_cap: data.market_data.market_cap.usd,
        market_cap_rank: data.market_data.market_cap_rank,
        total_volume: data.market_data.total_volume.usd,
        high_24h: data.market_data.high_24h?.usd,
        low_24h: data.market_data.low_24h?.usd,
        price_change_percentage_24h: data.market_data.price_change_percentage_24h,
        price_change_percentage_7d: data.market_data.price_change_percentage_7d,
        price_change_percentage_30d: data.market_data.price_change_percentage_30d,
        total_supply: data.market_data.total_supply,
        circulating_supply: data.market_data.circulating_supply,
        max_supply: data.market_data.max_supply,
        launch_date: data.genesis_date || 'Unknown',
        blockchain: data.asset_platform_id || 'Native',
        hashing_algorithm: data.hashing_algorithm || 'N/A',
        categories: data.categories?.join(', ') || 'N/A',
        description: data.description?.en?.substring(0, 500) + '...',
        website: data.links?.homepage?.[0],
        twitter_followers: data.community_data?.twitter_followers,
        image: data.image?.large
    };
}

// ===== UI FUNCTIONS =====
function displayCoins() {
    if (!coinsGrid) return;
    
    if (filteredCoins.length === 0) {
        coinsGrid.innerHTML = '<div class="no-results">No cryptocurrencies found</div>';
        return;
    }
    
    coinsGrid.innerHTML = filteredCoins.map(coin => createCoinCard(coin)).join('');
    addCoinClickListeners();
}

function createCoinCard(coin) {
    const priceChange = coin.price_change_percentage_24h || 0;
    const changeClass = priceChange >= 0 ? 'positive' : 'negative';
    const changeIcon = priceChange >= 0 ? '↗' : '↘';
    
    return `
        <div class="coin-card" data-coin-id="${coin.id}">
            <div class="coin-header">
                <span class="rank">#${coin.market_cap_rank}</span>
                <span class="symbol">${coin.symbol.toUpperCase()}</span>
            </div>
            <h3 class="name">${coin.name}</h3>
            <p class="price">$${coin.current_price?.toLocaleString()}</p>
            <div class="stats-row">
                <span class="market-cap">Cap: $${(coin.market_cap / 1e9).toFixed(1)}B</span>
                <span class="change ${changeClass}">
                    ${changeIcon} ${priceChange.toFixed(2)}%
                </span>
            </div>
        </div>
    `;
}

function displayNews() {
    if (!newsContainer) return;
    
    if (news.length === 0) {
        newsContainer.innerHTML = '<div class="no-results">No news available</div>';
        return;
    }
    
    newsContainer.innerHTML = news.slice(0, 20).map(article => createNewsCard(article)).join('');
}

function createNewsCard(article) {
    return `
        <div class="news-card">
            <h3 class="news-title">${article.title}</h3>
            <p class="news-source">${article.source} • ${new Date(article.published_on * 1000).toLocaleString()}</p>
            <p class="news-preview">${article.body?.substring(0, 200)}...</p>
            <button class="read-more-btn" onclick="openNewsArticle('${article.url}')">
                Read Full Article →
            </button>
        </div>
    `;
}

function displayCoinDetails(coin) {
    if (!modalContent) return;
    
    const priceChange24h = coin.price_change_percentage_24h || 0;
    const priceChange7d = coin.price_change_percentage_7d || 0;
    const priceChange30d = coin.price_change_percentage_30d || 0;
    
    modalContent.innerHTML = `
        <div class="detail-header">
            <h2 class="detail-title">${coin.name}</h2>
            <p class="detail-subtitle">#${coin.market_cap_rank} • ${coin.symbol}</p>
        </div>
        
        <p class="detail-price">$${coin.price?.toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        })}</p>
        
        <div class="changes-container">
            <h3 class="section-title">📈 Price Performance</h3>
            <div class="change-row">
                <span class="change-label">24 Hours:</span>
                <span class="change-value ${priceChange24h >= 0 ? 'positive' : 'negative'}">
                    ${priceChange24h >= 0 ? '+' : ''}${priceChange24h.toFixed(2)}%
                </span>
            </div>
            <div class="change-row">
                <span class="change-label">7 Days:</span>
                <span class="change-value ${priceChange7d >= 0 ? 'positive' : 'negative'}">
                    ${priceChange7d >= 0 ? '+' : ''}${priceChange7d.toFixed(2)}%
                </span>
            </div>
            <div class="change-row">
                <span class="change-label">30 Days:</span>
                <span class="change-value ${priceChange30d >= 0 ? 'positive' : 'negative'}">
                    ${priceChange30d >= 0 ? '+' : ''}${priceChange30d.toFixed(2)}%
                </span>
            </div>
        </div>
        
        <div class="stats-container">
            <h3 class="section-title">💰 Market Statistics</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-label">Market Cap</span>
                    <span class="stat-value">$${(coin.market_cap / 1e9).toFixed(2)}B</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">24h Volume</span>
                    <span class="stat-value">$${(coin.total_volume / 1e9).toFixed(2)}B</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Rank</span>
                    <span class="stat-value">#${coin.market_cap_rank}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">24h High</span>
                    <span class="stat-value">$${coin.high_24h?.toFixed(2)}</span>
                </div>
            </div>
        </div>
        
        <div class="supply-container">
            <h3 class="section-title">🔗 Supply Information</h3>
            <div class="info-grid">
                <div class="info-box">
                    <span class="info-label">Circulating Supply</span>
                    <span class="info-value">${coin.circulating_supply?.toLocaleString()} ${coin.symbol}</span>
                </div>
                <div class="info-box">
                    <span class="info-label">Total Supply</span>
                    <span class="info-value">${coin.total_supply?.toLocaleString() || 'N/A'} ${coin.symbol}</span>
                </div>
                ${coin.max_supply ? `
                <div class="info-box">
                    <span class="info-label">Max Supply</span>
                    <span class="info-value">${coin.max_supply?.toLocaleString()} ${coin.symbol}</span>
                </div>
                ` : ''}
            </div>
        </div>
        
        <div class="tech-container">
            <h3 class="section-title">⚙️ Technical Details</h3>
            <div class="info-grid">
                <div class="info-box">
                    <span class="info-label">Blockchain</span>
                    <span class="info-value">${coin.blockchain}</span>
                </div>
                <div class="info-box">
                    <span class="info-label">Algorithm</span>
                    <span class="info-value">${coin.hashing_algorithm}</span>
                </div>
                <div class="info-box">
                    <span class="info-label">Launch Date</span>
                    <span class="info-value">${coin.launch_date}</span>
                </div>
                <div class="info-box">
                    <span class="info-label">Categories</span>
                    <span class="info-value">${coin.categories}</span>
                </div>
            </div>
        </div>
        
        ${coin.twitter_followers ? `
        <div class="community-container">
            <h3 class="section-title">👥 Community</h3>
            <div class="info-box">
                <span class="info-label">Twitter Followers</span>
                <span class="info-value">${coin.twitter_followers?.toLocaleString()}</span>
            </div>
        </div>
        ` : ''}
        
        <div class="description-container">
            <h3 class="section-title">📖 About ${coin.name}</h3>
            <p class="description">${coin.description}</p>
        </div>
        
        <div class="links-container">
            <h3 class="section-title">🔗 Official Links</h3>
            ${coin.website ? `
                <a href="${coin.website}" target="_blank" class="link-button">
                    🌐 Official Website
                </a>
            ` : ''}
        </div>
    `;
    
    showModal();
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchCoins(e.target.value);
        });
    }
    
    // Modal close on outside click
    if (coinModal) {
        coinModal.addEventListener('click', (e) => {
            if (e.target === coinModal) {
                closeModal();
            }
        });
    }
    
    // ESC key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

function addCoinClickListeners() {
    const coinCards = document.querySelectorAll('.coin-card');
    coinCards.forEach(card => {
        card.addEventListener('click', async () => {
            const coinId = card.dataset.coinId;
            const coin = await fetchCoinDetails(coinId);
            if (coin) {
                displayCoinDetails(coin);
            }
        });
    });
}

// ===== SEARCH FUNCTIONALITY =====
function searchCoins(query) {
    if (!query.trim()) {
        filteredCoins = coins;
    } else {
        filteredCoins = coins.filter(coin => 
            coin.name.toLowerCase().includes(query.toLowerCase()) ||
            coin.symbol.toLowerCase().includes(query.toLowerCase())
        );
    }
    
    displayCoins();
    updateResultsCount();
}

function updateResultsCount() {
    if (resultsCount) {
        resultsCount.textContent = filteredCoins.length;
    }
}

// ===== MODAL FUNCTIONS =====
function showModal() {
    if (coinModal) {
        coinModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    if (coinModal) {
        coinModal.classList.remove('active');
        document.body.style.overflow = '';
        selectedCoin = null;
    }
}

function showModalLoading() {
    if (modalContent) {
        modalContent.innerHTML = `
            <div class="loading-container">
                <div class="spinner"></div>
                <p>Loading detailed information...</p>
            </div>
        `;
    }
}

// ===== NAVIGATION =====
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(`${sectionName}-section`);
    const targetButton = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
    
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    if (targetButton) {
        targetButton.classList.add('active');
    }
}

function openNewsArticle(url) {
    if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
}

// ===== UTILITY FUNCTIONS =====
function showLoading() {
    if (loading) {
        loading.style.display = 'block';
    }
}

function hideLoading() {
    if (loading) {
        loading.style.display = 'none';
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div class="error-content">
            <h3>❌ Error</h3>
            <p>${message}</p>
            <button onclick="location.reload()" class="retry-btn">Retry</button>
        </div>
    `;
    
    document.body.appendChild(errorDiv);
}

// ===== RESPONSIVE FUNCTIONS =====
function handleResize() {
    // Adjust grid columns based on screen size
    const coinsGrid = document.getElementById('coinsGrid');
    if (coinsGrid) {
        const width = window.innerWidth;
        if (width < 768) {
            coinsGrid.style.gridTemplateColumns = '1fr';
        } else if (width < 1200) {
            coinsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        } else {
            coinsGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        }
    }
}

// ===== AUTO REFRESH =====
function setupAutoRefresh() {
    // Refresh data every 5 minutes
    setInterval(() => {
        fetchCoins();
        fetchNews();
    }, 5 * 60 * 1000); // 5 minutes
}

// ===== PERFORMANCE MONITORING =====
function trackPerformance() {
    // Track page load time
    window.addEventListener('load', () => {
        const loadTime = performance.now();
        console.log(`Page loaded in ${loadTime.toFixed(2)}ms`);
    });
    
    // Track API response times
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const start = performance.now();
        return originalFetch.apply(this, args).then(response => {
            const end = performance.now();
            console.log(`API call took ${(end - start).toFixed(2)}ms`);
            return response;
        });
    };
}

// ===== INITIALIZE =====
// Setup everything when page loads
window.addEventListener('load', () => {
    handleResize();
    setupAutoRefresh();
    trackPerformance();
});

window.addEventListener('resize', handleResize);
