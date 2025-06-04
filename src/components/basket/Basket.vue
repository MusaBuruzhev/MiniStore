<template>
  <div>
    <transition name="fade">
      <div v-if="showAchievementNotification" class="achievement-notification">
        <img src="/src/components/Achievement/achievement.jpg" alt="Достижение" class="achievement-notif-img" />
        <span>Поздравляем с первой покупкой!</span>
      </div>
    </transition>
    <div class="basket">
      <div class="header">
        <h1>Корзина</h1>
        <div class="checkout-container">
          <span v-if="selectedTotal > 0" class="total-amount">
            {{ discountedTotal ? `${discountedTotal} $ (со скидкой ${currentUser.discount}%)` : `${selectedTotal} $` }}
          </span>
          <button @click="checkout" :disabled="!hasSelectedItems || isLoading" class="checkout-button">
            Оформить
          </button>
        </div>
      </div>
      <div v-if="cartItems.length === 0" class="empty-cart">
        <p>Ваша корзина пуста.</p>
      </div>
      <div v-else class="cart-content">
        <ul>
          <li v-for="item in cartItems" :key="`${item.id}-${item.selectedColor}-${item.selectedVolume}`" class="cart-item">
            <input
              type="checkbox"
              v-model="item.selected"
              @change="updateSelectedItems"
              class="cart-checkbox"
            />
            <img
              :src="item.image"
              alt="Product Image"
              class="cart-item-image"
              @error="setFallbackImage(item)"
            />
            <div class="cart-item-details">
              <span class="item-title">{{ item.title }}</span>
              <span class="item-options">Цвет: {{ item.selectedColor }}, Объём: {{ item.selectedVolume }}</span>
              <div class="quantity-controls">
                <button
                  @click="decreaseItemQuantity(item)"
                  :disabled="item.quantity <= 1 || isLoading"
                  class="quantity-button decrease"
                >
                  −
                </button>
                <span>{{ item.quantity }} шт.</span>
                <button
                  @click="increaseItemQuantity(item)"
                  :disabled="isLoading"
                  class="quantity-button increase"
                >
                  +
                </button>
              </div>
              <span class="item-price">{{ item.price * item.quantity }} $</span>
            </div>
          </li>
        </ul>
      </div>
      <button v-if="hasSelectedItems" @click="removeSelectedItems" class="remove-selected-button">
        Удалить выбранные
      </button>
    </div>
    <div class="subscribe-us">
      <div class="subscribe-text">
        <h3 class="subscribe-title">Subscribe Us now</h3>
        <p class="subscribe-subtitle">Get latest news, updates and deals directly mailed to your inbox.</p>
      </div>
      <div class="subscribe-form">
        <input type="email" v-model="email" placeholder="Your email" class="subscribe-input" />
        <button class="subscribe-button" @click="subscribe">Subscribe</button>
      </div>
    </div>
    <div class="mini-slider">
      <div class="slider-track">
        <div class="slider-card"><img src="@/assets/play.png" alt="Slide 1" class="slider-image" /></div>
        <div class="slider-card"><img src="@/assets/nau4.png" alt="Slide 2" class="slider-image" /></div>
        <div class="slider-card"><img src="@/assets/nau3.png" alt="Slide 3" class="slider-image" /></div>
        <div class="slider-card"><img src="@/assets/nau2.png" alt="Slide 4" class="slider-image" /></div>
        <div class="slider-card"><img src="@/assets/nau.png" alt="Slide 5" class="slider-image" /></div>
        <div class="slider-card"><img src="@/assets/camera.png" alt="Slide 6" class="slider-image" /></div>
        <div class="slider-card"><img src="@/assets/nau5.png" alt="Slide 7" class="slider-image" /></div>
        <div class="slider-card"><img src="@/assets/play.png" alt="Slide 1" class="slider-image" /></div>
        <div class="slider-card"><img src="@/assets/nau4.png" alt="Slide 2" class="slider-image" /></div>
        <div class="slider-card"><img src="@/assets/nau3.png" alt="Slide 3" class="slider-image" /></div>
        <div class="slider-card"><img src="@/assets/nau2.png" alt="Slide 4" class="slider-image" /></div>
        <div class="slider-card"><img src="@/assets/nau.png" alt="Slide 5" class="slider-image" /></div>
        <div class="slider-card"><img src="@/assets/camera.png" alt="Slide 6" class="slider-image" /></div>
        <div class="slider-card"><img src="@/assets/nau5.png" alt="Slide 7" class="slider-image" /></div>
      </div>
    </div>
    <div>
      <button @click="testAddToCart">Тест: Добавить товар</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      cartItems: [],
      fallbackImageUrl: 'https://via.placeholder.com/150',
      selectedTotal: 0,
      hasSelectedItems: false,
      email: '',
      showAchievementNotification: false,
      isLoading: false,
      currentUser: {},
    };
  },
  computed: {
    userId() {
      return this.currentUser._id;
    },
    discountedTotal() {
      if (!this.currentUser || !this.currentUser.discount || this.currentUser.discount <= 0) {
        return null;
      }
      const discount = this.currentUser.discount / 100;
      return Math.round(this.selectedTotal * (1 - discount));
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
        console.error('Ошибка загрузки пользователя:', error.response?.data || error.message);
        this.$swal('Ошибка', error.response?.data?.message || 'Ошибка загрузки профиля', 'error');
        if (error.response?.status === 401) {
          this.logout();
        }
      } finally {
        this.isLoading = false;
      }
    },
    async loadCart() {
      if (!this.userId) {
        console.warn('Попытка загрузки корзины без userId');
        return;
      }
      this.isLoading = true;
      try {
        const response = await axios.get(`http://localhost:5000/api/cart/${this.userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        console.log('Загруженная корзина:', response.data); // Отладка
        this.cartItems = response.data.items || [];
        this.updateSelectedItems();
      } catch (error) {
        console.error('Ошибка загрузки корзины:', error.response?.data || error.message);
        this.$swal('Ошибка', error.response?.data?.message || 'Ошибка загрузки корзины', 'error');
      } finally {
        this.isLoading = false;
      }
    },
    async updateCart() {
      if (!this.userId) {
        console.warn('Попытка обновления корзины без userId');
        return;
      }
      this.isLoading = true;
      try {
        const response = await axios.put(
          `http://localhost:5000/api/cart/${this.userId}`,
          { items: this.cartItems },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }
        );
        console.log('Обновлённая корзина:', response.data); // Отладка
        this.cartItems = response.data.items;
        this.updateSelectedItems();
      } catch (error) {
        console.error('Ошибка обновления корзины:', error.response?.data || error.message);
        this.$swal('Ошибка', error.response?.data?.message || 'Ошибка обновления корзины', 'error');
      } finally {
        this.isLoading = false;
      }
    },
    async addToCart(item) {
      if (!this.userId) {
        console.warn('Попытка добавления товара без userId');
        this.$swal('Ошибка', 'Войдите в аккаунт, чтобы добавить товар в корзину', 'error');
        this.logout();
        return;
      }
      if (!item || !item.id || !item.title || !item.price || !item.image || !item.selectedColor || !item.selectedVolume) {
        console.error('Некорректный объект товара:', item);
        this.$swal('Ошибка', 'Неверные данные товара', 'error');
        return;
      }
      console.log('Отправка товара на сервер:', item); // Отладка
      this.isLoading = true;
      try {
        const response = await axios.post(
          `http://localhost:5000/api/cart/${this.userId}`,
          {
            id: item.id,
            title: item.title,
            price: item.price,
            image: item.image,
            selectedColor: item.selectedColor,
            selectedVolume: item.selectedVolume,
            quantity: item.quantity || 1,
            selected: true,
          },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }
        );
        console.log('Ответ сервера при добавлении:', response.data); // Отладка
        await this.loadCart();
        this.$swal('Успех', 'Товар добавлен в корзину', 'success');
      } catch (error) {
        console.error('Ошибка добавления товара:', error.response?.data || error.message);
        this.$swal('Ошибка', error.response?.data?.message || 'Ошибка добавления в корзину', 'error');
      } finally {
        this.isLoading = false;
      }
    },
    updateSelectedItems() {
      this.hasSelectedItems = this.cartItems.some((item) => item.selected);
      this.selectedTotal = this.cartItems
        .filter((item) => item.selected)
        .reduce((sum, item) => sum + item.price * item.quantity, 0);
    },
    async increaseItemQuantity(item) {
      item.quantity += 1;
      await this.updateCart();
    },
    async decreaseItemQuantity(item) {
      if (item.quantity > 1) {
        item.quantity -= 1;
        await this.updateCart();
      }
    },
    async removeSelectedItems() {
      this.isLoading = true;
      try {
        this.cartItems = this.cartItems.filter((item) => !item.selected);
        await this.updateCart();
        this.$swal('Успех', 'Выбранные товары удалены', 'success');
      } catch (error) {
        console.error('Ошибка удаления товаров:', error.response?.data || error.message);
        this.$swal('Ошибка', error.response?.data?.message || 'Ошибка удаления товаров', 'error');
      } finally {
        this.isLoading = false;
      }
    },
    async checkout() {
      if (!this.userId) {
        console.warn('Попытка оформления заказа без userId');
        this.$swal('Ошибка', 'Войдите в аккаунт, чтобы оформить заказ', 'error');
        this.logout();
        return;
      }
      const selectedItems = this.cartItems.filter((item) => item.selected);
      if (selectedItems.length === 0) {
        this.$swal('Ошибка', 'Выберите хотя бы один товар для оформления заказа', 'error');
        return;
      }
      this.isLoading = true;
      try {
        console.log('Отправка заказа:', { items: selectedItems });
        const response = await axios.post(
          `http://localhost:5000/api/cart/${this.userId}/checkout`,
          {
            items: selectedItems,
            // В будущем: deliveryDate: new Date('2025-06-10'),
            // paymentMethod: 'card',
          },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }
        );
        console.log('Ответ сервера при оформлении:', response.data);
        await this.loadCart();
        await this.checkFirstPurchase();
        this.$swal('Успех', 'Заказ успешно оформлен!', 'success');
        this.$router.push('/delivery');
      } catch (error) {
        console.error('Ошибка оформления заказа:', error.response?.data || error.message);
        this.$swal('Ошибка', error.response?.data?.message || 'Ошибка оформления заказа', 'error');
      } finally {
        this.isLoading = false;
      }
    },
    async checkFirstPurchase() {
      try {
        const response = await axios.get(`http://localhost:5000/api/orders/${this.userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const userOrders = response.data;
        if (userOrders.length === 1 && !this.currentUser.hasFirstPurchase) {
          this.showAchievementNotification = true;
          setTimeout(() => {
            this.showAchievementNotification = false;
          }, 5000);
          this.currentUser.hasFirstPurchase = true;
        }
      } catch (error) {
        console.error('Ошибка проверки заказов:', error.response?.data || error.message);
      }
    },
    setFallbackImage(item) {
      item.image = this.fallbackImageUrl;
    },
    subscribe() {
      if (!this.email) {
        this.$swal('Ошибка', 'Введите email для подписки', 'error');
        return;
      }
      this.$swal('Успех', 'Вы подписались на рассылку!', 'success');
      this.email = '';
    },
    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('isAdmin');
      this.$router.push('/reg');
    },
    testAddToCart() {
      const testItem = {
        id: '123',
        title: 'Тестовый товар',
        price: 100,
        image: 'https://via.placeholder.com/150',
        selectedColor: 'Чёрный',
        selectedVolume: '128GB',
        quantity: 1,
      };
      this.addToCart(testItem);
    },
  },
  async mounted() {
    await this.fetchUser();
    await this.loadCart();
  },
};
</script>
<style scoped>
.basket {
  width: 80%;
  margin: 30px auto;
  padding: 30px;
  background: #fff;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}
.basket:hover {
  transform: translateY(-5px);
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}
h1 {
  font-size: 32px;
  color: #333;
  font-weight: 700;
}
.checkout-container {
  display: flex;
  align-items: center;
  gap: 15px;
}
.total-amount {
  font-size: 24px;
  font-weight: 600;
  color: #72AEC8;
}
.checkout-button {
  padding: 12px 30px;
  background: linear-gradient(135deg, #72AEC8, #5a96b0);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
}
.checkout-button:hover {
  background: linear-gradient(135deg, #5a96b0, #4a7c8f);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(114, 174, 200, 0.4);
}
.checkout-button:disabled {
  background: #cccccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
.empty-cart {
  text-align: center;
  padding: 20px;
}
.empty-cart p {
  font-size: 18px;
  color: #555;
}
.cart-content ul {
  list-style: none;
  padding: 0;
}
.cart-item {
  display: flex;
  align-items: center;
  padding: 20px;
  margin: 15px 0;
  background: #f9f9f9;
  border-radius: 12px;
  box-shadow: 0 4px 15px #0000000d;
  transition: transform .3s ease, box-shadow .3s ease;
  justify-content: space-around;
}
.cart-checkbox {
  width: 20px;
  height: 20px;
  margin-right: 20px;
  accent-color: #4f5455;
  cursor: pointer;
}
.cart-item-image {
  height: 150px;
  object-fit: cover;
  border-radius: 10px;
  margin-right: 20px;
  transition: transform 0.3s ease;
}
.cart-item:hover .cart-item-image {
  transform: scale(1.05);
}
.cart-item-details {
  display: flex;
  align-items: center;
  width: 86%;
  justify-content: space-around;
}
.item-title {
  font-size: 22px;
  color: #333;
  font-weight: 600;
  width: 50%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.quantity-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}
.quantity-button {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0px;
  gap: 10px;
  width: 44px;
  height: 44px;
  background: #FFFFFF;
  border: 1px solid #EEEEEE;
  box-shadow: 0px 0px 44px rgba(0, 0, 0, 0.08);
  flex: none;
  order: 0;
  flex-grow: 0;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.3s ease, transform 0.2s ease;
}
.quantity-button:hover {
  background: #f0f0f0;
  transform: scale(1.1);
}
.quantity-button:disabled {
  background: #e0e0e0;
  cursor: not-allowed;
  transform: none;
}
.quantity-controls span {
  font-size: 18px;
  color: #555;
  min-width: 60px;
  text-align: center;
}
.item-price {
  font-size: 20px;
  font-weight: 600;
  color: #72AEC8;
  width: 150px;
  text-align: right;
  white-space: nowrap;
}
.remove-selected-button {
  display: block;
  margin: 25px auto 0;
  padding: 12px 30px;
  background: linear-gradient(135deg, #dc3545, #ff6666);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
}
.remove-selected-button:hover {
  background: linear-gradient(135deg, #c82333, #ff4d4d);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(220, 53, 69, 0.4);
}
.mini-slider {
  max-width: 100%;
  margin: 40px auto 20px;
  padding: 0 2rem;
  overflow: hidden;
  height: 240px;
}
.slider-track {
  display: flex;
  width: calc(200px * 14);
  animation: scroll 20s linear infinite;
}
.slider-card {
  flex: 0 0 auto;
  width: 200px;
  height: 200px;
  margin-right: 30px;
}
.slider-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}
@keyframes scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(calc(-200px * 7 - 30px * 7)); }
}
.subscribe-us {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 124px;
  width: 100%;
  height: 226px;
  background: #272727;
  flex: none;
  order: 7;
  flex-grow: 0;
  margin: 0 auto;
}
.subscribe-text {
  display: flex;
  margin-left: 135px;
  flex-direction: column;
  gap: 10px;
}
.subscribe-title {
  width: 303px;
  height: 34px;
  font-family: 'Jost';
  font-style: normal;
  font-weight: 400;
  font-size: 30px;
  line-height: 114%;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #ffffff;
  flex: none;
  order: 0;
  flex-grow: 0;
}
.subscribe-subtitle {
  width: 462px;
  height: 22px;
  font-family: 'Lato';
  font-style: normal;
  font-weight: 300;
  font-size: 16px;
  line-height: 138%;
  letter-spacing: 0.03em;
  color: #ffffff;
  flex: none;
  order: 1;
  flex-grow: 0;
}
.subscribe-form {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
}
.subscribe-input {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0px 10px 30px;
  gap: 10px;
  width: 494px;
  height: 53px;
  background: #ffffff;
  border: 1px solid #eeeeee;
  box-shadow: 0px 0px 44px rgba(0, 0, 0, 0.08);
  flex: none;
  order: 1;
  flex-grow: 0;
}
.subscribe-button {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 16px 40px;
  gap: 10px;
  width: 166px;
  height: 53px;
  background: #72aec8;
  border: none;
  color: #ffffff;
  font-family: 'Lato';
  font-style: normal;
  font-weight: 500;
  font-size: 16px;
  line-height: 138%;
  text-transform: uppercase;
  cursor: pointer;
  flex: none;
  order: 1;
  flex-grow: 0;
}
.subscribe-button:hover {
  background: #5a96b0;
}
.achievement-notification {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #2ecc71;
  color: white;
  padding: 20px 30px;
  border-radius: 10px;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
  animation: slideDown 0.5s ease-out;
  display: flex;
  align-items: center;
  gap: 15px;
  z-index: 1000;
}
.achievement-notif-img {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  object-fit: cover;
}
@keyframes slideDown {
  from { transform: translate(-50%, -100%); }
  to { transform: translate(-50%, 0); }
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.5s; }
.fade-enter, .fade-leave-to { opacity: 0; }
@media (max-width: 1024px) {
  .subscribe-us {
    flex-direction: column;
    padding: 40px 50px;
    height: auto;
    gap: 40px;
  }
  .subscribe-text {
    margin-left: 0;
    align-items: center;
  }
  .subscribe-title,
  .subscribe-subtitle {
    width: 100%;
    text-align: center;
  }
  .subscribe-form {
    flex-direction: column;
    width: 100%;
  }
  .subscribe-input {
    width: 100%;
  }
  .mini-slider {
    height: 200px;
  }
  .slider-card {
    width: 160px;
    height: 160px;
    margin-right: 20px;
  }
  .slider-track {
    width: calc(160px * 14);
  }
  @keyframes scroll {
    100% { transform: translateX(calc(-160px * 7 - 20px * 7)); }
  }
}
@media (max-width: 768px) {
  .basket { padding: 20px; }
  .cart-item-details {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .item-title,
  .item-price {
    width: 100%;
    text-align: left;
  }
  .mini-slider { height: 180px; }
  .slider-card {
    width: 140px;
    height: 140px;
    margin-right: 15px;
  }
  .slider-track { width: calc(140px * 14); }
  @keyframes scroll {
    100% { transform: translateX(calc(-140px * 7 - 15px * 7)); }
  }
}
</style>