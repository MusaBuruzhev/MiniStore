<template>
  <div class="top-buyers">
    <h1>Топ покупателей</h1>
    <div v-if="isLoading" class="loading">Загрузка...</div>
    <div v-else>
      <div v-if="isAdmin" class="discount-text-editor">
        <h3>Редактировать текст скидки</h3>
        <textarea v-model="discountText" rows="4" placeholder="Введите текст о скидке"></textarea>
        <button @click="saveDiscountText" :disabled="isLoading">Сохранить</button>
      </div>
      <div class="discount-text">
        <p>{{ discountText || 'Здесь будет отображаться текст о скидке' }}</p>
      </div>
      <div v-if="topBuyers.length === 0" class="empty-buyers">
        <p>Покупатели пока отсутствуют.</p>
      </div>
      <div v-else class="buyers-list">
        <div v-for="buyer in topBuyers" :key="buyer._id" class="buyer-card">
          <img :src="buyer.avatar || '/src/assets/default-avatar.png'" alt="Avatar" class="buyer-avatar" />
          <div class="buyer-info">
            <span>{{ buyer.name }}</span>
            <span>Email: {{ buyer.email }}</span>
            <span>Потрачено: ${{ buyer.totalSpent }}</span>
            <div v-if="isAdmin" class="discount-control">
              <label>Скидка (%):</label>
              <input
                type="number"
                v-model.number="buyer.discount"
                min="0"
                max="100"
                @blur="updateDiscount(buyer)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      topBuyers: [],
      discountText: '',
      isLoading: false,
      currentUser: {},
    };
  },
  computed: {
    isAdmin() {
      return this.currentUser.isAdmin;
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
    async loadTopBuyers() {
      this.isLoading = true;
      try {
        const response = await axios.get('http://localhost:5000/api/users/top-buyers', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        this.topBuyers = response.data;
      } catch (error) {
        this.$swal('Ошибка', error.response?.data?.message || 'Ошибка загрузки топ покупателей', 'error');
        if (error.response?.status === 401) {
          this.logout();
        }
      } finally {
        this.isLoading = false;
      }
    },
    async loadDiscountText() {
      this.isLoading = true;
      try {
        const response = await axios.get('http://localhost:5000/api/discount-text', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        this.discountText = response.data.text;
      } catch (error) {
        this.$swal('Ошибка', error.response?.data?.message || 'Ошибка загрузки текста скидки', 'error');
        if (error.response?.status === 401) {
          this.logout();
        }
      } finally {
        this.isLoading = false;
      }
    },
    async saveDiscountText() {
      if (!this.isAdmin) return;
      this.isLoading = true;
      try {
        await axios.put(
          'http://localhost:5000/api/discount-text',
          { text: this.discountText },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }
        );
        this.$swal('Успех', 'Текст скидки сохранён', 'success');
      } catch (error) {
        this.$swal('Ошибка', error.response?.data?.message || 'Ошибка сохранения текста скидки', 'error');
        if (error.response?.status === 401) {
          this.logout();
        }
      } finally {
        this.isLoading = false;
      }
    },
    async updateDiscount(buyer) {
      if (!this.isAdmin) return;
      if (buyer.discount < 0 || buyer.discount > 100) {
        this.$swal('Ошибка', 'Скидка должна быть от 0 до 100%', 'error');
        buyer.discount = 0; // Сбрасываем значение
        return;
      }
      this.isLoading = true;
      try {
        await axios.put(
          `http://localhost:5000/api/users/${buyer._id}/discount`,
          { discount: buyer.discount },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }
        );
        this.$swal('Успех', 'Скидка обновлена', 'success');
      } catch (error) {
        this.$swal('Ошибка', error.response?.data?.message || 'Ошибка обновления скидки', 'error');
        if (error.response?.status === 401) {
          this.logout();
        }
      } finally {
        this.isLoading = false;
      }
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
    await this.loadTopBuyers();
    await this.loadDiscountText();
  },
};
</script>
  <style scoped>
  .top-buyers {
    width: 85%;
    margin: 60px auto;
    padding: 40px;
    background: #fff;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
    font-family: 'Montserrat', 'Roboto', sans-serif;
    position: relative;
    overflow: hidden;
  }
  
  .top-buyers::before {
    content: '';
    position: absolute;
    top: -30px;
    left: -30px;
    width: 120px;
    height: 120px;
    background: radial-gradient(circle, rgba(0, 0, 0, 0.05), transparent);
    border-radius: 50%;
    z-index: 0;
  }
  
  .top-buyers::after {
    content: '';
    position: absolute;
    bottom: -30px;
    right: -30px;
    width: 120px;
    height: 120px;
    background: radial-gradient(circle, rgba(0, 0, 0, 0.05), transparent);
    border-radius: 50%;
    z-index: 0;
  }
  
  h1 {
    font-size: 40px;
    color: #333;
    font-weight: 700;
    text-align: center;
    margin-bottom: 40px;
    letter-spacing: 0.8px;
    position: relative;
    z-index: 1;
  }
  
  h1::after {
    content: '';
    display: block;
    width: 100px;
    height: 3px;
    background: #ddd;
    margin: 15px auto 0;
    border-radius: 2px;
  }
  
  .discount-section {
    padding: 30px;
    border-radius: 15px;
    margin-bottom: 50px;
    text-align: center;
    position: relative;
    z-index: 1;
    border: 1px solid #eee;
    background: #fafafa;
  }
  
  .discount-heading {
    font-size: 26px;
    margin-bottom: 15px;
    font-weight: 600;
    color: #333;
  }
  
  .top-numbers {
    font-weight: 700;
    font-size: 28px;
    position: relative;
    display: inline-block;
    padding: 0 5px;
    border-bottom: 2px solid #ccc;
  }
  
  .discount-description {
    font-size: 18px;
    color: #555;
    font-weight: 400;
    line-height: 1.6;
    margin-bottom: 10px;
  }
  
  .highlight {
    font-weight: 600;
    padding: 0 4px;
    border-bottom: 1px dashed #999;
  }
  
  .additional-text {
    display: block;
    margin-top: 15px;
    font-size: 16px;
    color: #777;
    font-style: italic;
    line-height: 1.5;
    padding: 10px 20px;
    background: #fff;
    border-radius: 8px;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.03);
  }
  
  .edit-discount {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .edit-discount textarea {
    width: 100%;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 10px;
    font-size: 16px;
    resize: none;
    height: 120px;
    background: #fff;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
    font-family: 'Roboto', sans-serif;
  }
  
  .edit-discount textarea:focus {
    border-color: #aaa;
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
  }
  
  .discount-buttons {
    display: flex;
    justify-content: center;
    gap: 20px;
  }
  
  .edit-button,
  .save-button,
  .cancel-button,
  .toggle-button {
    padding: 12px 25px;
    border: 1px solid #ddd;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    background: #fff;
    color: #333;
  }
  
  .edit-button:hover,
  .save-button:hover,
  .cancel-button:hover,
  .toggle-button:hover {
    background: #f5f5f5;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .no-buyers {
    text-align: center;
    padding: 25px;
  }
  
  .no-buyers p {
    font-size: 20px;
    color: #777;
    font-weight: 400;
  }
  
  .buyers-list {
    list-style: none;
    padding: 0;
  }
  
  .buyer-item {
    display: flex;
    align-items: center;
    padding: 20px 25px;
    margin: 15px 0;
    background: #fff;
    border-radius: 15px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    border: 1px solid #eee;
    position: relative;
  }
  
  .buyer-item:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  }
  
  .buyer-item.top-tier {
    border: 2px solid #ccc;
    position: relative;
  }
  
  .buyer-item.top-tier::before {
    content: '★';
    position: absolute;
    top: -10px;
    left: 10px;
    font-size: 20px;
    color: #999;
    background: #fff;
    padding: 0 5px;
  }
  
  .rank {
    font-size: 26px;
    font-weight: 700;
    color: #333;
    margin-right: 25px;
    min-width: 30px;
    position: relative;
  }
  
  .rank::after {
    content: '.';
    position: absolute;
    right: -5px;
    top: 0;
    font-size: 26px;
  }
  
  .avatar-container {
    width: 50px;
    height: 50px;
    margin-right: 25px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  
  .avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid #ddd;
  }
  
  .no-avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: #eee;
    color: #555;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    font-weight: 600;
  }
  
  .name {
    font-size: 20px;
    color: #333;
    flex: 1;
    font-weight: 500;
  }
  
  .total {
    font-size: 20px;
    font-weight: 600;
    color: #555;
    min-width: 150px;
    text-align: right;
    margin-right: 20px;
  }
  
  .discount-input {
    width: 60px;
    margin-left: 20px;
  }
  
  .discount-input input {
    width: 100%;
    padding: 5px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 16px;
    text-align: center;
    background: #fff;
    transition: border-color 0.3s ease;
  }
  
  .discount-input input:focus {
    border-color: #aaa;
    outline: none;
  }
  
  .discount-display {
    font-size: 18px;
    font-weight: 600;
    color: #f39c12; /* Orange */
    margin-left: 20px;
    padding: 5px 10px;
    background: #fff;
    border-radius: 5px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .edit-discounts-toggle {
    text-align: center;
    margin-top: 30px;
  }
  </style>