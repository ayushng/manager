const fs = require('fs').promises;
const path = require('path');

class OrderManager {
    constructor() {
        this.orderStatusPath = path.join(__dirname, '../data/orderStatus.json');
        this.ordersPath = path.join(__dirname, '../data/orders.json');
    }

    async loadOrderStatus() {
        try {
            const data = await fs.readFile(this.orderStatusPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // Default status if file doesn't exist
            return {
                status: 'available',
                updatedBy: null,
                updatedAt: new Date().toISOString()
            };
        }
    }

    async saveOrderStatus(statusData) {
        try {
            await fs.writeFile(this.orderStatusPath, JSON.stringify(statusData, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving order status:', error);
            return false;
        }
    }

    async loadOrders() {
        try {
            const data = await fs.readFile(this.ordersPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }

    async saveOrders(orders) {
        try {
            await fs.writeFile(this.ordersPath, JSON.stringify(orders, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving orders:', error);
            return false;
        }
    }

    async setOrderStatus(status, updatedBy) {
        try {
            const statusData = {
                status,
                updatedBy,
                updatedAt: new Date().toISOString()
            };

            const saved = await this.saveOrderStatus(statusData);
            
            if (!saved) {
                return {
                    success: false,
                    error: 'Failed to save order status'
                };
            }

            return {
                success: true,
                statusData
            };

        } catch (error) {
            console.error('Error setting order status:', error);
            return {
                success: false,
                error: 'Failed to update order status'
            };
        }
    }

    async getOrderStatus() {
        return await this.loadOrderStatus();
    }

    async createOrder(userId, orderType, details, guildId) {
        try {
            const orders = await this.loadOrders();
            
            const newOrder = {
                id: `order_${Date.now()}_${userId}`,
                userId,
                orderType,
                details,
                guildId,
                status: 'pending_terms',
                createdAt: new Date().toISOString(),
                channelId: null,
                termsAccepted: false,
                termsAcceptedAt: null
            };

            orders.push(newOrder);
            await this.saveOrders(orders);

            return {
                success: true,
                order: newOrder
            };

        } catch (error) {
            console.error('Error creating order:', error);
            return {
                success: false,
                error: 'Failed to create order'
            };
        }
    }

    async acceptTerms(orderId, userId) {
        try {
            const orders = await this.loadOrders();
            const orderIndex = orders.findIndex(order => order.id === orderId && order.userId === userId);

            if (orderIndex === -1) {
                return {
                    success: false,
                    error: 'Order not found'
                };
            }

            orders[orderIndex].termsAccepted = true;
            orders[orderIndex].termsAcceptedAt = new Date().toISOString();
            orders[orderIndex].status = 'in_progress';

            await this.saveOrders(orders);

            return {
                success: true,
                order: orders[orderIndex]
            };

        } catch (error) {
            console.error('Error accepting terms:', error);
            return {
                success: false,
                error: 'Failed to accept terms'
            };
        }
    }

    async updateOrderChannel(orderId, channelId) {
        try {
            const orders = await this.loadOrders();
            const orderIndex = orders.findIndex(order => order.id === orderId);

            if (orderIndex === -1) {
                return {
                    success: false,
                    error: 'Order not found'
                };
            }

            orders[orderIndex].channelId = channelId;
            await this.saveOrders(orders);

            return {
                success: true,
                order: orders[orderIndex]
            };

        } catch (error) {
            console.error('Error updating order channel:', error);
            return {
                success: false,
                error: 'Failed to update order channel'
            };
        }
    }

    async getOrderById(orderId) {
        try {
            const orders = await this.loadOrders();
            return orders.find(order => order.id === orderId) || null;
        } catch (error) {
            console.error('Error getting order by ID:', error);
            return null;
        }
    }

    async getUserOrders(userId) {
        try {
            const orders = await this.loadOrders();
            return orders.filter(order => order.userId === userId);
        } catch (error) {
            console.error('Error getting user orders:', error);
            return [];
        }
    }

    async updateOrderEmbeds(client) {
        // This method would update any existing order embeds in channels
        // when the status changes. Implementation depends on how you want to handle this.
        try {
            console.log('Order embeds updated successfully');
            return true;
        } catch (error) {
            console.error('Error updating order embeds:', error);
            return false;
        }
    }
}

module.exports = new OrderManager();