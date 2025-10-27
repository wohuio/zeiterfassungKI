<template>
  <div class="time-tracker" :style="cssVars">
    <!-- Error/Success Messages -->
    <div v-if="message.text" :class="['message', message.type]">
      {{ message.text }}
      <button @click="message.text = ''" class="message-close">×</button>
    </div>

    <!-- Timer Control Section -->
    <div class="timer-control">
      <!-- No Active Timer -->
      <div v-if="!isTimerRunning" class="timer-start-section">
        <div class="status-badge inactive">Kein aktiver Timer</div>

        <input
          v-model="newTimerDescription"
          type="text"
          class="description-input"
          placeholder="Was arbeitest du gerade?"
          @keyup.enter="startTimer"
        />

        <button @click="startTimer" class="btn btn-start">
          <span class="btn-icon">▶</span>
          Timer starten
        </button>
      </div>

      <!-- Active Timer -->
      <div v-else class="timer-running-section">
        <div class="status-badge active">Timer läuft</div>

        <div class="live-timer">{{ formattedCurrentDuration }}</div>

        <div class="timer-details">
          <div class="timer-description">
            {{ currentTimer.description || 'Keine Beschreibung' }}
          </div>
          <div class="timer-start-time">
            Gestartet: {{ formatDateTime(currentTimer.start_time) }}
          </div>
        </div>

        <button @click="stopTimer" class="btn btn-stop">
          <span class="btn-icon">⏹</span>
          Timer stoppen
        </button>
      </div>
    </div>

    <!-- History Section -->
    <div class="history-section">
      <div class="history-header">
        <h2>Timer-Historie</h2>

        <div class="history-controls">
          <select v-model="historyStatus" @change="onFilterChange" class="filter-select">
            <option value="all">Alle Timer</option>
            <option value="running">Laufende Timer</option>
            <option value="stopped">Gestoppte Timer</option>
          </select>

          <select v-model.number="historyPerPage" @change="onPerPageChange" class="filter-select">
            <option :value="10">10 pro Seite</option>
            <option :value="25">25 pro Seite</option>
            <option :value="50">50 pro Seite</option>
            <option :value="100">100 pro Seite</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoadingHistory" class="loading">
        <div class="spinner"></div>
        Lade Historie...
      </div>

      <!-- History Table -->
      <div v-else-if="timerHistory.length > 0" class="history-table">
        <div class="history-item" v-for="item in timerHistory" :key="item.id">
          <div class="history-item-header">
            <div class="history-description">
              {{ item.description || 'Keine Beschreibung' }}
            </div>
            <div :class="['history-status', item.end_time ? 'stopped' : 'running']">
              {{ item.end_time ? 'Gestoppt' : 'Läuft' }}
            </div>
          </div>

          <div class="history-item-details">
            <div class="history-detail">
              <span class="detail-label">Start:</span>
              {{ formatDateTime(item.start_time) }}
            </div>
            <div class="history-detail">
              <span class="detail-label">Ende:</span>
              {{ item.end_time ? formatDateTime(item.end_time) : 'Läuft noch...' }}
            </div>
            <div class="history-detail">
              <span class="detail-label">Dauer:</span>
              {{ formatDuration(item.duration_seconds) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon">⏱️</div>
        <p>Keine Timer-Einträge gefunden</p>
        <p class="empty-hint">Starte deinen ersten Timer oben!</p>
      </div>

      <!-- Pagination -->
      <div v-if="historyPagination.pageTotal > 1" class="pagination">
        <button
          @click="goToPreviousPage"
          :disabled="!historyPagination.prevPage"
          class="btn btn-pagination"
        >
          ← Zurück
        </button>

        <span class="pagination-info">
          Seite {{ historyPagination.curPage }} von {{ historyPagination.pageTotal }}
          ({{ historyPagination.itemsTotal }} Einträge gesamt)
        </span>

        <button
          @click="goToNextPage"
          :disabled="!historyPagination.nextPage"
          class="btn btn-pagination"
        >
          Vor →
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    content: {
      type: Object,
      required: true
    },
  },

  data() {
    return {
      // Timer State
      currentTimer: null,
      isTimerRunning: false,
      currentDuration: 0,
      newTimerDescription: '',

      // History State
      timerHistory: [],
      historyPage: 1,
      historyPerPage: 10,
      historyStatus: 'all',
      historyPagination: {
        curPage: 1,
        pageTotal: 1,
        itemsTotal: 0,
        prevPage: null,
        nextPage: null,
      },
      isLoadingHistory: false,

      // UI State
      message: {
        text: '',
        type: '', // 'success' or 'error'
      },

      // Intervals
      timerInterval: null,
    };
  },

  computed: {
    apiBaseUrl() {
      return this.content.apiBaseUrl || 'https://xv05-su7k-rvc8.f2.xano.io/api:qM5iOIQs';
    },

    autoRefreshInterval() {
      return (this.content.autoRefreshInterval || 1) * 1000; // Convert to milliseconds
    },

    cssVars() {
      return {
        '--primary-color': this.content.primaryColor || '#3B82F6',
        '--success-color': this.content.successColor || '#10B981',
        '--danger-color': this.content.dangerColor || '#EF4444',
      };
    },

    formattedCurrentDuration() {
      return this.formatDuration(this.currentDuration);
    },
  },

  methods: {
    // API Methods
    async startTimer() {
      console.log('🚀 Starting timer...');
      console.log('API URL:', `${this.apiBaseUrl}/start`);

      try {
        const response = await fetch(`${this.apiBaseUrl}/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: this.newTimerDescription || '',
          }),
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (!response.ok) {
          throw new Error(data.message || 'Fehler beim Starten des Timers');
        }

        this.currentTimer = data;
        this.isTimerRunning = true;
        this.newTimerDescription = '';
        this.currentDuration = 0;

        this.showMessage('Timer erfolgreich gestartet!', 'success');
        this.startTimerUpdates();
        this.loadHistory();

      } catch (error) {
        console.error('❌ Error starting timer:', error);

        // Check if it's a CORS error
        if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
          this.showMessage('CORS-Fehler: Bitte CORS in Xano konfigurieren (siehe Browser-Console für Details)', 'error');
          console.error('⚠️ CORS-PROBLEM ERKANNT!');
          console.error('Lösung: Gehe zu Xano Dashboard → API Settings → CORS');
          console.error('Füge hinzu: https://localhost:8080 oder *');
        } else {
          this.showMessage(error.message, 'error');
        }
      }
    },

    async stopTimer() {
      console.log('🛑 Stopping timer...');

      try {
        const response = await fetch(`${this.apiBaseUrl}/stop`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        console.log('Stop response:', data);

        if (!response.ok) {
          throw new Error(data.message || 'Fehler beim Stoppen des Timers');
        }

        this.isTimerRunning = false;
        this.currentTimer = null;
        this.currentDuration = 0;

        this.showMessage('Timer erfolgreich gestoppt!', 'success');
        this.stopTimerUpdates();
        this.loadHistory();

      } catch (error) {
        console.error('❌ Error stopping timer:', error);

        if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
          this.showMessage('CORS-Fehler: Bitte CORS in Xano konfigurieren', 'error');
        } else {
          this.showMessage(error.message, 'error');
        }
      }
    },

    async getCurrentTimer() {
      try {
        const response = await fetch(`${this.apiBaseUrl}/current`);
        const data = await response.json();

        if (data.status === 'running') {
          this.currentTimer = data;
          this.isTimerRunning = true;
          this.currentDuration = data.current_duration_seconds || 0;
          this.startTimerUpdates();
        } else {
          this.isTimerRunning = false;
          this.currentTimer = null;
          this.currentDuration = 0;
        }

      } catch (error) {
        console.error('Error getting current timer:', error);
      }
    },

    async updateCurrentTimer() {
      if (!this.isTimerRunning) return;

      try {
        const response = await fetch(`${this.apiBaseUrl}/current`);
        const data = await response.json();

        if (data.status === 'running') {
          this.currentTimer = data;
          this.currentDuration = data.current_duration_seconds || 0;
        } else {
          // Timer was stopped externally
          this.isTimerRunning = false;
          this.currentTimer = null;
          this.currentDuration = 0;
          this.stopTimerUpdates();
          this.loadHistory();
        }

      } catch (error) {
        console.error('Error updating current timer:', error);
      }
    },

    async loadHistory() {
      this.isLoadingHistory = true;
      console.log('📜 Loading history...');

      try {
        const params = new URLSearchParams({
          page: this.historyPage,
          per_page: this.historyPerPage,
          status: this.historyStatus,
        });

        const url = `${this.apiBaseUrl}/history?${params}`;
        console.log('History URL:', url);

        const response = await fetch(url);
        const data = await response.json();

        console.log('History loaded:', data.itemsTotal, 'total items');

        if (response.ok) {
          this.timerHistory = data.items || [];
          this.historyPagination = {
            curPage: data.curPage,
            pageTotal: data.pageTotal,
            itemsTotal: data.itemsTotal,
            prevPage: data.prevPage,
            nextPage: data.nextPage,
          };
        }

      } catch (error) {
        console.error('❌ Error loading history:', error);

        if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
          this.showMessage('CORS-Fehler beim Laden der Historie', 'error');
          console.error('⚠️ CORS-Problem: Konfiguriere CORS in Xano');
        } else {
          this.showMessage('Fehler beim Laden der Historie', 'error');
        }
      } finally {
        this.isLoadingHistory = false;
      }
    },

    // Timer Updates
    startTimerUpdates() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }

      this.timerInterval = setInterval(() => {
        this.updateCurrentTimer();
      }, this.autoRefreshInterval);
    },

    stopTimerUpdates() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    },

    // Pagination
    goToNextPage() {
      if (this.historyPagination.nextPage) {
        this.historyPage = this.historyPagination.nextPage;
        this.loadHistory();
      }
    },

    goToPreviousPage() {
      if (this.historyPagination.prevPage) {
        this.historyPage = this.historyPagination.prevPage;
        this.loadHistory();
      }
    },

    onFilterChange() {
      this.historyPage = 1;
      this.loadHistory();
    },

    onPerPageChange() {
      this.historyPage = 1;
      this.loadHistory();
    },

    // Formatting
    formatDateTime(timestamp) {
      if (!timestamp) return '';

      const date = new Date(timestamp);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      return `${day}.${month}.${year}, ${hours}:${minutes}`;
    },

    formatDuration(seconds) {
      if (!seconds && seconds !== 0) return '-';

      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);

      if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      } else {
        return `${minutes}:${String(secs).padStart(2, '0')}`;
      }
    },

    // UI Methods
    showMessage(text, type) {
      this.message = { text, type };
      setTimeout(() => {
        this.message.text = '';
      }, 5000);
    },
  },

  // Lifecycle Hooks
  mounted() {
    // Initialize: Get current timer and load history
    this.getCurrentTimer();
    this.loadHistory();

    // Set items per page from props if available
    if (this.content.itemsPerPage) {
      this.historyPerPage = this.content.itemsPerPage;
    }
  },

  beforeDestroy() {
    // Clean up interval
    this.stopTimerUpdates();
  },
};
</script>

<style lang="scss" scoped>
/* Orbity Design System */
.time-tracker {
  /* CSS Variables - Orbity Colors */
  --primary-green: #A4FF6B;
  --primary-dark: #0A1612;
  --accent-green: #00FF85;
  --bg-dark: #0A1612;
  --bg-white: #FFFFFF;
  --bg-light-gray: #F5F5F5;
  --bg-card: #FFFFFF;
  --text-primary: #0A1612;
  --text-secondary: #6B7280;
  --text-light: #9CA3AF;
  --text-white: #FFFFFF;
  --border-light: #E5E7EB;
  --border-dark: #1F2937;

  /* Spacing */
  --spacing-xs: 8px;
  --spacing-sm: 12px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;

  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 2px 8px rgba(0,0,0,0.04);
  --shadow-lg: 0 4px 16px rgba(0,0,0,0.06);
  --shadow-glow: 0 0 40px rgba(164,255,107,0.3);

  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--spacing-lg);
  color: var(--text-primary);
}

/* Messages */
.message {
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 500;

  &.success {
    background-color: rgba(164, 255, 107, 0.15);
    color: var(--primary-dark);
    border: 1px solid var(--primary-green);
  }

  &.error {
    background-color: #FEE2E2;
    color: #991B1B;
    border: 1px solid #EF4444;
  }
}

.message-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
  color: inherit;

  &:hover {
    opacity: 1;
  }
}

/* Timer Control */
.timer-control {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
  border: 1px solid var(--border-light);
}

.status-badge {
  display: inline-block;
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-bottom: var(--spacing-lg);

  &.inactive {
    background-color: var(--bg-light-gray);
    color: var(--text-secondary);
  }

  &.active {
    background-color: var(--primary-green);
    color: var(--primary-dark);
  }
}

/* Timer Start Section */
.timer-start-section {
  text-align: center;
}

.description-input {
  width: 100%;
  padding: var(--spacing-md);
  font-size: 16px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-md);
  transition: all 0.2s;
  background: var(--bg-white);
  color: var(--text-primary);

  &:focus {
    outline: none;
    border-color: var(--primary-green);
    box-shadow: 0 0 0 3px rgba(164, 255, 107, 0.1);
  }

  &::placeholder {
    color: var(--text-light);
  }
}

/* Timer Running Section */
.timer-running-section {
  text-align: center;
}

.live-timer {
  font-size: 72px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  color: var(--primary-dark);
  margin: var(--spacing-lg) 0;
  letter-spacing: 0.05em;
  background: linear-gradient(135deg, var(--primary-green) 0%, var(--accent-green) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.timer-details {
  margin: var(--spacing-lg) 0;
}

.timer-description {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
  color: var(--text-primary);
}

.timer-start-time {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 400;
}

/* Buttons - Orbity Style */
.btn {
  padding: 14px 28px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  letter-spacing: 0.01em;

  &:hover:not(:disabled) {
    transform: scale(1.02);
  }

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
}

.btn-start {
  background-color: var(--primary-green);
  color: var(--primary-dark);
  box-shadow: var(--shadow-sm);

  &:hover:not(:disabled) {
    background-color: #8FFF4D;
    box-shadow: var(--shadow-glow);
  }
}

.btn-stop {
  background-color: var(--primary-dark);
  color: var(--text-white);
  box-shadow: var(--shadow-sm);

  &:hover:not(:disabled) {
    background-color: #1a2b26;
    box-shadow: var(--shadow-md);
  }
}

.btn-icon {
  font-size: 18px;
}

/* History Section */
.history-section {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-xl);
  border: 1px solid var(--border-light);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
  gap: var(--spacing-md);

  h2 {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.history-controls {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.filter-select {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--bg-white);
  color: var(--text-primary);

  &:focus {
    outline: none;
    border-color: var(--primary-green);
    box-shadow: 0 0 0 3px rgba(164, 255, 107, 0.1);
  }

  &:hover {
    border-color: var(--primary-green);
  }
}

/* Loading */
.loading {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--text-secondary);
}

.spinner {
  border: 4px solid var(--bg-light-gray);
  border-top: 4px solid var(--primary-green);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--spacing-md);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* History Table */
.history-table {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.history-item {
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  transition: all 0.2s;
  background: var(--bg-white);

  &:hover {
    border-color: var(--primary-green);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }
}

.history-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  gap: var(--spacing-sm);
}

.history-description {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
}

.history-status {
  padding: 4px var(--spacing-sm);
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &.running {
    background-color: var(--primary-green);
    color: var(--primary-dark);
  }

  &.stopped {
    background-color: var(--bg-light-gray);
    color: var(--text-secondary);
  }
}

.history-item-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-sm);
}

.history-detail {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 400;
}

.detail-label {
  font-weight: 600;
  color: var(--text-primary);
  margin-right: 4px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--spacing-2xl) var(--spacing-lg);
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.empty-hint {
  font-size: 14px;
  margin-top: var(--spacing-sm);
  color: var(--text-light);
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-light);
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.btn-pagination {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 14px;
  font-weight: 500;
  background-color: var(--bg-white);
  color: var(--text-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);

  &:hover:not(:disabled) {
    background-color: var(--primary-green);
    color: var(--primary-dark);
    border-color: var(--primary-green);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.pagination-info {
  font-size: 14px;
  color: var(--text-secondary);
  text-align: center;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .time-tracker {
    padding: var(--spacing-md);
  }

  .timer-control,
  .history-section {
    padding: var(--spacing-lg);
  }

  .live-timer {
    font-size: 48px;
  }

  .timer-description {
    font-size: 20px;
  }

  .history-header {
    flex-direction: column;
    align-items: flex-start;

    h2 {
      font-size: 24px;
    }
  }

  .history-controls {
    width: 100%;
  }

  .filter-select {
    flex: 1;
  }

  .pagination {
    flex-direction: column;
    text-align: center;
  }

  .btn-pagination {
    width: 100%;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
