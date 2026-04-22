import axios from 'axios';

let internalRegistry = {};

/**
 * Connect to Event Bus (Mock)
 */
export const connectEventBus = async (retries = 5) => {
    console.log('✅ Lite HTTP Event Bus Ready');
};

/**
 * Publish an event via direct HTTP calls to subscribers
 */
export const publishEvent = async (routingKey, data) => {
    const subscribers = process.env.INTERNAL_EVENT_SUBSCRIBERS 
        ? process.env.INTERNAL_EVENT_SUBSCRIBERS.split(',') 
        : [];
    
    console.log(`📤 [Event Published] ${routingKey} to ${subscribers.length} services`);
    
    subscribers.forEach(async (url) => {
        try {
            await axios.post(url, { routingKey, data });
        } catch (err) {
            console.warn(`⚠️ Failed to deliver ${routingKey} to ${url}: ${err.message}`);
        }
    });
};

/**
 * Subscribe to an event locally
 */
export const subscribeToEvent = async (queueName, routingKey, callback) => {
    if (!internalRegistry[routingKey]) internalRegistry[routingKey] = [];
    internalRegistry[routingKey].push(callback);
    console.log(`📥 [Subscribed] Local handler for ${routingKey}`);
};

/**
 * Handle incoming internal events (called by Express route)
 */
export const handleInternalEvent = async (payload) => {
    const { routingKey, data } = payload;
    if (internalRegistry[routingKey]) {
        internalRegistry[routingKey].forEach(cb => cb(data));
    }
};

