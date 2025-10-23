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
      return this.content.apiBaseUrl || 'https://xv05-su7k-rvc8.f2.xano.io/api:yiQZgKMy';
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

        const data = await response.json();

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
        this.showMessage(error.message, 'error');
      }
    },

    async stopTimer() {
      try {
        const response = await fetch(`${this.apiBaseUrl}/stop`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

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
        this.showMessage(error.message, 'error');
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

      try {
        const params = new URLSearchParams({
          page: this.historyPage,
          per_page: this.historyPerPage,
          status: this.historyStatus,
        });

        const response = await fetch(`${this.apiBaseUrl}/history?${params}`);
        const data = await response.json();

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
        console.error('Error loading history:', error);
        this.showMessage('Fehler beim Laden der Historie', 'error');
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
.time-tracker {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  color: #1f2937;
}

/* Messages */
.message {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;

  &.success {
    background-color: #d1fae5;
    color: #065f46;
    border: 1px solid #10b981;
  }

  &.error {
    background-color: #fee2e2;
    color: #991b1b;
    border: 1px solid #ef4444;
  }
}

.message-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
}

/* Timer Control */
.timer-control {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 32px;
  margin-bottom: 32px;
}

.status-badge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 20px;

  &.inactive {
    background-color: #f3f4f6;
    color: #6b7280;
  }

  &.active {
    background-color: #d1fae5;
    color: #065f46;
  }
}

/* Timer Start Section */
.timer-start-section {
  text-align: center;
}

.description-input {
  width: 100%;
  padding: 16px;
  font-size: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 16px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }

  &::placeholder {
    color: #9ca3af;
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
  color: var(--primary-color);
  margin: 20px 0;
  letter-spacing: 0.05em;
}

.timer-details {
  margin: 24px 0;
}

.timer-description {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #374151;
}

.timer-start-time {
  font-size: 14px;
  color: #6b7280;
}

/* Buttons */
.btn {
  padding: 16px 32px;
  font-size: 18px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
}

.btn-start {
  background-color: var(--success-color);
  color: white;

  &:hover:not(:disabled) {
    background-color: #059669;
  }
}

.btn-stop {
  background-color: var(--danger-color);
  color: white;

  &:hover:not(:disabled) {
    background-color: #dc2626;
  }
}

.btn-icon {
  font-size: 20px;
}

/* History Section */
.history-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 32px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;

  h2 {
    margin: 0;
    font-size: 24px;
    color: #111827;
  }
}

.history-controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-select {
  padding: 8px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
}

/* Loading */
.loading {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.spinner {
  border: 4px solid #f3f4f6;
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* History Table */
.history-table {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-item {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;

  &:hover {
    border-color: var(--primary-color);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
}

.history-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.history-description {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  flex: 1;
}

.history-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;

  &.running {
    background-color: #d1fae5;
    color: #065f46;
  }

  &.stopped {
    background-color: #f3f4f6;
    color: #6b7280;
  }
}

.history-item-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.history-detail {
  font-size: 14px;
  color: #6b7280;
}

.detail-label {
  font-weight: 600;
  color: #374151;
  margin-right: 4px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-hint {
  font-size: 14px;
  margin-top: 8px;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 2px solid #e5e7eb;
  gap: 16px;
  flex-wrap: wrap;
}

.btn-pagination {
  padding: 8px 16px;
  font-size: 14px;
  background-color: var(--primary-color);
  color: white;

  &:hover:not(:disabled) {
    background-color: #2563eb;
  }
}

.pagination-info {
  font-size: 14px;
  color: #6b7280;
  text-align: center;
}

/* Responsive */
@media (max-width: 768px) {
  .time-tracker {
    padding: 12px;
  }

  .timer-control,
  .history-section {
    padding: 20px;
  }

  .live-timer {
    font-size: 48px;
  }

  .history-header {
    flex-direction: column;
    align-items: flex-start;
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
}
</style>
