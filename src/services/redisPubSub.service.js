const { createClient } = require('redis');

class RedisPubSubService {
    constructor() {
        // Khởi tạo publisher và subscriber với cấu hình rõ ràng
        this.publisher = createClient({
            url: 'redis://127.0.0.1:6379' // Host và port mặc định của Redis
        });
        this.subscriber = createClient({
            url: 'redis://127.0.0.1:6379'
        });

        // Lắng nghe sự kiện lỗi từ Redis client
        this.publisher.on('error', (err) => {
            console.error('Publisher Redis Error:', err.message);
        });
        this.subscriber.on('error', (err) => {
            console.error('Subscriber Redis Error:', err.message);
        });

        // Log khi kết nối thành công (tùy chọn)
        this.publisher.on('connect', () => {
            console.log('Publisher connected to Redis');
        });
        this.subscriber.on('connect', () => {
            console.log('Subscriber connected to Redis');
        });
    }

    // Đảm bảo kết nối trước khi thực hiện hành động
    async ensureConnected() {
        try {
            if (!this.publisher.isOpen) {
                await this.publisher.connect();
            }
            if (!this.subscriber.isOpen) {
                await this.subscriber.connect();
            }
        } catch (error) {
            console.error('Failed to connect to Redis:', error.message);
            throw error; // Ném lỗi để xử lý ở nơi gọi nếu cần
        }
    }

    // Publish một tin nhắn tới channel
    async publish(channel, message) {
        try {
            await this.ensureConnected();
            const result = await this.publisher.publish(channel, message);
            console.log(`Published message to channel ${channel}: ${message}`);
            return result;
        } catch (error) {
            console.error('Error publishing message:', error.message);
            throw error;
        }
    }

    // Subscribe vào một channel và xử lý tin nhắn nhận được
    async subscribe(channel, callback) {
        try {
            await this.ensureConnected();
            await this.subscriber.subscribe(channel, (message) => {
                console.log(`Received message from channel ${channel}: ${message}`);
                callback(message);
            });
            console.log(`Subscribed to channel: ${channel}`);
        } catch (error) {
            console.error('Error subscribing to channel:', error.message);
            throw error;
        }
    }
}

// Xuất instance duy nhất của service
module.exports = new RedisPubSubService();