<template>
  <div class="delivery">
    <h1>История заказов</h1>
    <div v-if="isLoading" class="loading">Загрузка...</div>
    <div v-else-if="orders.length === 0" class="empty-delivery">
      <p>У вас пока нет заказов.</p>
    </div>
    <div v-else class="orders">
      <div v-for="order in orders" :key="order._id" class="order-item">
        <div class="order-header">
          <h3>Заказ от {{ formatDate(order.date) }}</h3>
          <span>Сумма: ${{ order.amount }}</span>
        </div>
        <div class="order-details">
          <p>Способ оплаты: {{ order.paymentMethod }}</p>
          <p>Дата доставки: {{ formatDate(order.deliveryDate) }}</p>
          <p v-if="order.cardLastDigits">Последние цифры карты: {{ order.cardLastDigits }}</p>
        </div>
        <ul class="order-items">
          <li v-for="item in order.items" :key="`${item.id}-${item.selectedColor}-${item.selectedVolume}`" class="order-item">
            <img :src="item.image" alt="Product Image" class="order-item-image" @error="setFallbackImage(item)" />
            <div class="order-item-details">
              <span>{{ item.title }}</span>
              <span>Количество: {{ item.quantity }} шт.</span>
              <span>Цвет: {{ item.selectedColor }}</span>
              <span>Объём: {{ item.selectedVolume }}</span>
              <span>Цена: ${{ item.price * item.quantity }}</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      orders: [],
      fallbackImageUrl: 'https://via.placeholder.com/150',
      isLoading: false,
      currentUser: {},
    };
  },
  computed: {
    userId() {
      return this.currentUser._id;
    },
  },
  methods: {
    async fetchUser() {
      this.isLoading = true;
      try {
        const response = await axios.get('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        this.currentUser = response.data;
      } catch (error) {
        this.$swal('Ошибка', error.response?.data?.message || 'Ошибка загрузки профиля', 'error');
        if (error.response?.status === 401) {
          this.logout();
        }
      } finally {
        this.isLoading = false;
      }
    },
    async loadOrders() {
      if (!this.userId) return;
      this.isLoading = true;
      try {
        const response = await axios.get(`http://localhost:5000/api/orders/${this.userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        this.orders = response.data;
      } catch (error) {
        this.$swal('Ошибка', error.response?.data?.message || 'Ошибка загрузки заказов', 'error');
        if (error.response?.status === 401) {
          this.logout();
        }
      } finally {
        this.isLoading = false;
      }
    },
    formatDate(date) {
      if (!date) return '';
      const d = new Date(date);
      return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
    },
    setFallbackImage(item) {
      item.image = this.fallbackImageUrl;
    },
    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('isAdmin');
      this.$router.push('/reg');
    },
  },
  async mounted() {
    await this.fetchUser();
    await this.loadOrders();
  },
};
</script>
<style scoped>
.delivery {
  width: 80%;
  margin: 30px auto;
  display: flex;
  flex-direction: column;
  gap: 30px;
  height: 700px;
}

.purchase-history {
  padding: 25px;
  background: #fff;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
}

.purchase-history h1 {
  font-size: 32px;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}

.orders-container {
  display: flex;
  gap: 25px;
}

.orders-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order-item {
  padding: 20px;
  background: #f9f9f9;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, background 0.3s ease;
  cursor: pointer;
}

.order-item:hover {
  transform: translateY(-5px);
  background: #f0f0f0;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.order-date,
.order-delivery,
.order-amount,
.order-payment {
  font-size: 16px;
  color: #555;
  margin: 8px 0;
}

.order-status {
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 14px;
  font-weight: 500;
}

.status-pending {
  background: #ffe082;
  color: #ff8f00;
}

.status-delivered {
  background: #a5d6a7;
  color: #2e7d32;
}

.timer {
  color: #007bff;
  font-weight: 500;
}

.order-items-panel {
  width: 45%;
  padding: 25px;
  background: #ffffff;
  border-radius: 15px;
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #007bff;
}

.order-items-panel h2 {
  font-size: 26px;
  color: #333;
  margin-bottom: 20px;
  font-weight: 500;
}

.items-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 10px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.item:hover {
  transform: translateX(5px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.item-image {
  height: 150px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid #eee;
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.item-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.item-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-quantity {
  font-size: 15px;
  color: #666;
}

.item-price {
  font-size: 16px;
  font-weight: 500;
  color: #007bff;
}

.items-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #e6f0f5;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-top: 10px;
}

.no-orders {
  text-align: center;
  padding: 20px;
  color: #555;
  font-size: 18px;
}
</style>