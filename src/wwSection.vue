<template>
  <div class="simple-timer" :style="containerStyles">
    <div class="timer-display">
      <div :class="['timer', { running: isRunning }]">
        {{ formattedTime }}
      </div>
    </div>

    <div class="controls">
      <button
        v-if="!isRunning"
        @click="startTimer"
        class="btn btn-start"
      >
        Start
      </button>
      <button
        v-if="isRunning"
        @click="stopTimer"
        class="btn btn-stop"
      >
        Stop
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SimpleTimer',
  emits: ['trigger-event'],
  props: {
    content: {
      type: Object,
      default: () => ({
        use_api: false,
        endpoint_start: 'https://xv05-su7k-rvc8.f2.xano.io/api:08j3AE3p/time',
        endpoint_stop: 'https://xv05-su7k-rvc8.f2.xano.io/api:08j3AE3p/time',
        background_color: '#FFFFFF',
        text_color: '#1F2937',
        timer_color: '#6366f1',
        start_button_color: '#10b981',
        stop_button_color: '#ef4444',
        border_radius: '12px',
        timer_size: '4em'
      })
    }
  },
  data() {
    return {
      timerInterval: null,
      currentSeconds: 0,
      isRunning: false,
      startTime: null,
      timeEntryId: null
    };
  },
  computed: {
    containerStyles() {
      return {
        '--background-color': this.content.background_color || '#FFFFFF',
        '--text-color': this.content.text_color || '#1F2937',
        '--timer-color': this.content.timer_color || '#6366f1',
        '--start-color': this.content.start_button_color || '#10b981',
        '--stop-color': this.content.stop_button_color || '#ef4444',
        '--border-radius': this.content.border_radius || '12px',
        '--timer-size': this.content.timer_size || '4em'
      };
    },
    formattedTime() {
      return this.formatDuration(this.currentSeconds);
    }
  },
  beforeUnmount() {
    this.stopInterval();
  },
  methods: {
    async startTimer() {
      this.currentSeconds = 0;
      this.isRunning = true;
      this.startTime = Date.now();
      this.startInterval();

      const startTimestamp = new Date().toISOString();

      // Call API if enabled
      if (this.content.use_api && this.content.endpoint_start) {
        try {
          const response = await this.callAPI(this.content.endpoint_start, {
            start: startTimestamp
          });
          // Store the ID from response if available
          if (response && response.id) {
            this.timeEntryId = response.id;
          }
        } catch (error) {
          console.error('Failed to call start API:', error);
          // Continue with local timer even if API fails
        }
      }

      this.$emit('trigger-event', {
        name: 'timer_started',
        event: {
          startTime: this.startTime,
          timestamp: startTimestamp,
          timeEntryId: this.timeEntryId
        }
      });
    },

    async stopTimer() {
      const endTime = Date.now();
      const duration = this.currentSeconds;
      const stopTimestamp = new Date().toISOString();

      this.stopInterval();
      this.isRunning = false;

      // Call API if enabled
      if (this.content.use_api && this.content.endpoint_stop) {
        try {
          const payload = {
            stop: stopTimestamp
          };

          // Include ID if we have one from the start call
          if (this.timeEntryId) {
            payload.id = this.timeEntryId;
          }

          await this.callAPI(this.content.endpoint_stop, payload);
        } catch (error) {
          console.error('Failed to call stop API:', error);
        }
      }

      this.$emit('trigger-event', {
        name: 'timer_stopped',
        event: {
          startTime: this.startTime,
          endTime: endTime,
          duration: duration,
          formattedDuration: this.formattedTime,
          timestamp: stopTimestamp,
          timeEntryId: this.timeEntryId
        }
      });

      this.currentSeconds = 0;
      this.startTime = null;
      this.timeEntryId = null;
    },

    startInterval() {
      this.timerInterval = setInterval(() => {
        this.currentSeconds++;

        // Emit tick event every second
        this.$emit('trigger-event', {
          name: 'timer_tick',
          event: {
            currentSeconds: this.currentSeconds,
            formattedTime: this.formattedTime
          }
        });
      }, 1000);
    },

    stopInterval() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    },

    formatDuration(seconds) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    },

    async callAPI(endpoint, data) {
      if (!endpoint) return;

      // Determine if endpoint is a full URL or WeWeb endpoint ID
      const url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
        ? endpoint
        : `/_ww/endpoints/${endpoint}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    }
  }
};
</script>

<style scoped>
.simple-timer {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: var(--background-color, #FFFFFF);
  color: var(--text-color, #1F2937);
  padding: 40px;
  border-radius: var(--border-radius, 12px);
  text-align: center;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 30px;
}

.timer-display {
  width: 100%;
}

.timer {
  font-size: var(--timer-size, 4em);
  font-weight: 800;
  font-family: 'Courier New', monospace;
  color: var(--text-color, #1F2937);
  letter-spacing: 0.05em;
  transition: all 0.3s;
}

.timer.running {
  color: var(--timer-color, #6366f1);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.02);
  }
}

.controls {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.btn {
  padding: 16px 48px;
  font-size: 20px;
  font-weight: 700;
  border: none;
  border-radius: var(--border-radius, 12px);
  cursor: pointer;
  transition: all 0.3s;
  color: white;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.btn:active {
  transform: translateY(-1px);
}

.btn-start {
  background: var(--start-color, #10b981);
}

.btn-start:hover {
  filter: brightness(1.1);
}

.btn-stop {
  background: var(--stop-color, #ef4444);
}

.btn-stop:hover {
  filter: brightness(1.1);
}

/* Responsive */
@media (max-width: 768px) {
  .simple-timer {
    padding: 30px 20px;
    min-height: 250px;
  }

  .timer {
    font-size: calc(var(--timer-size, 4em) * 0.7);
  }

  .controls {
    flex-direction: column;
    width: 100%;
  }

  .btn {
    width: 100%;
    padding: 14px 32px;
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .timer {
    font-size: calc(var(--timer-size, 4em) * 0.5);
  }

  .btn {
    font-size: 16px;
  }
}
</style>
