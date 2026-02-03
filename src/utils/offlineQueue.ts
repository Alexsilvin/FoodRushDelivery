import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

interface QueuedRequest {
  id: string;
  type: 'location_update' | 'delivery_status' | 'general';
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
  timestamp: number;
  retries: number;
}

const QUEUE_STORAGE_KEY = '@offline_queue';
const MAX_RETRIES = 3;
const MAX_QUEUE_SIZE = 100;

class OfflineQueue {
  private queue: QueuedRequest[] = [];
  private isProcessing = false;
  private isOnline = true;

  constructor() {
    this.initializeQueue();
    this.setupNetworkListener();
  }

  private async initializeQueue() {
    try {
      const storedQueue = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (storedQueue) {
        this.queue = JSON.parse(storedQueue);
        console.log(`📦 Loaded ${this.queue.length} requests from offline queue`);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  private setupNetworkListener() {
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (wasOffline && this.isOnline) {
        console.log('📶 Network restored, processing offline queue...');
        this.processQueue();
      }
    });
  }

  private async saveQueue() {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Add a request to the offline queue
   */
  async addToQueue(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retries'>) {
    // Limit queue size to prevent memory issues
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      console.warn('⚠️ Offline queue is full, removing oldest request');
      this.queue.shift();
    }

    const queuedRequest: QueuedRequest = {
      ...request,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(queuedRequest);
    await this.saveQueue();

    console.log(`📥 Added request to offline queue (${this.queue.length} total)`, {
      type: request.type,
      endpoint: request.endpoint,
    });

    // Try to process immediately if online
    if (this.isOnline) {
      this.processQueue();
    }
  }

  /**
   * Process the offline queue
   */
  async processQueue() {
    if (this.isProcessing || !this.isOnline || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`🔄 Processing offline queue (${this.queue.length} requests)...`);

    const failedRequests: QueuedRequest[] = [];

    for (const request of this.queue) {
      try {
        // Execute the request (you would call your API client here)
        console.log(`📤 Processing queued request: ${request.type} - ${request.endpoint}`);
        
        // Placeholder for actual API call
        // await apiClient[request.method.toLowerCase()](request.endpoint, request.data);
        
        console.log(`✅ Successfully processed queued request: ${request.id}`);
      } catch (error) {
        console.error(`❌ Failed to process queued request: ${request.id}`, error);
        
        request.retries++;
        if (request.retries < MAX_RETRIES) {
          failedRequests.push(request);
        } else {
          console.warn(`⚠️ Discarding request after ${MAX_RETRIES} retries:`, request.id);
        }
      }
    }

    this.queue = failedRequests;
    await this.saveQueue();

    this.isProcessing = false;

    if (this.queue.length > 0) {
      console.log(`🔄 ${this.queue.length} requests remaining in queue`);
    } else {
      console.log('✅ Offline queue processed successfully');
    }
  }

  /**
   * Get current queue status
   */
  getQueueStatus() {
    return {
      queueSize: this.queue.length,
      isOnline: this.isOnline,
      isProcessing: this.isProcessing,
    };
  }

  /**
   * Clear the entire queue
   */
  async clearQueue() {
    this.queue = [];
    await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
    console.log('🗑️ Offline queue cleared');
  }
}

// Singleton instance
export const offlineQueue = new OfflineQueue();

/**
 * Hook for using offline queue in components
 */
export const useOfflineQueue = () => {
  return {
    addToQueue: offlineQueue.addToQueue.bind(offlineQueue),
    processQueue: offlineQueue.processQueue.bind(offlineQueue),
    getQueueStatus: offlineQueue.getQueueStatus.bind(offlineQueue),
    clearQueue: offlineQueue.clearQueue.bind(offlineQueue),
  };
};
