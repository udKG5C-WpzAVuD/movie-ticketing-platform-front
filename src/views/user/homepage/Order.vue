<script setup>
import { ref } from "vue";
import {
  deleteSeats,
  fetchOrders,
  getMoviesid,
  getOrders,
  getSeats,
  getSessionsByid,
  refundOrder,
  searchOrders
} from "@/api/user";
import router from "@/router";
import { ElMessage, ElMessageBox, ElTag, ElButton } from "element-plus";
import { useUserInfoStore } from "@/stores/userInfo";
import axios from 'axios';

const userInfoStore = useUserInfoStore();
const uid = userInfoStore.userInfo?.id;

// 订单列表数据
const notpayedlist = ref([]);
const payedlist = ref([]);
const refundlist = ref([]);
const cantuikuan = ref([]);
const quxiao = ref([]);
const orders = ref([]);

// 判断是否在开场前30分钟以上（可退款）
const isAfter30Minutes = (inputTime) => {
  const targetTime = new Date(inputTime);
  const currentTime = new Date();
  const timeDiff = targetTime.getTime() - currentTime.getTime();
  const thirtyMinutesInMs = 30 * 60 * 1000;
  return timeDiff > thirtyMinutesInMs;
};

// 加载订单列表
const showOrders = async () => {
  notpayedlist.value = [];
  payedlist.value = [];
  refundlist.value = [];
  cantuikuan.value = [];
  quxiao.value = [];
  orders.value = [];

  try {
    const res = await fetchOrders();
    orders.value = res.data.filter(order => order.userId === uid);

    for (const order of orders.value) {
      const orderWithDetails = { ...order };

      const sessionRes = await getSessionsByid({ sessionId: order.sessionId });
      orderWithDetails.time = sessionRes.data.time;
      orderWithDetails.movieId = sessionRes.data.movieId;

      const movieRes = await getMoviesid({ id: sessionRes.data.movieId });
      orderWithDetails.title = movieRes.data.title;

      // 订单分类
      if (orderWithDetails.orderStatus === 0) {
        if (!isAfter30Minutes(orderWithDetails.time)) {
          refundlist.value.push(orderWithDetails);
        } else {
          notpayedlist.value.push(orderWithDetails);
        }
      } else if (orderWithDetails.orderStatus === 1) {
        if (!isAfter30Minutes(orderWithDetails.time)) {
          payedlist.value.push(orderWithDetails);
        } else {
          cantuikuan.value.push(orderWithDetails);
        }
      } else if (orderWithDetails.orderStatus === 2) {
        quxiao.value.push(orderWithDetails);
      } else {
        refundlist.value.push(orderWithDetails);
      }
    }
  } catch (error) {
    console.error("刷新订单列表失败:", error);
    ElMessage.error("刷新订单失败，请重试");
  }
};

// 初始化订单列表
showOrders();

// 支付按钮 - 跳转至订单详情页
const payout = (row) => {
  router.push({
    path: '/user/OrdersInfo',
    query: {
      orderNo: row.orderNo // 键名改为 orderNo，与后端返回一致
    }
  });
}

// 退单功能
const outOrder = async (row) => {
  const userInfoStore = useUserInfoStore();
  const userId = userInfoStore.userInfo?.id;
  if (!row) {
    ElMessage.error('订单数据不存在');
    return;
  }
  if (!row.orderNo) {
    ElMessage.error('订单编号缺失');
    return;
  }
  if (!row.totalAmount) {
    ElMessage.error('退款金额缺失');
    return;
  }

  try {
    await ElMessageBox.confirm(
        `确定要退掉《${row.title}》的订单吗？`,
        '退单确认',
        {
          confirmButtonText: '确认退单',
          cancelButtonText: '取消',
          type: 'warning'
        }
    );

    const refundParams = {
      orderNo: row.orderNo,
      refundAmount: row.totalAmount.toString(),
      refundReason: '用户主动退单'
    };
    const refundRes = await refundOrder(refundParams);

    if (refundRes.status) {
      ElMessage.success('退款成功，资金将在1-3个工作日内退回原支付账户');
      await showOrders();
      if (userId && row.totalAmount) {
        try {
          await fetch('/api/userActivity/update-refund', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              userId: userId.toString(),
              amount: row.totalAmount.toString()
            })
          });
          console.log('用户活动记录更新成功');
        } catch (error) {
          console.error('更新用户活动失败:', error);
        }
      }
    } else {
      ElMessage.error(`退款失败：${refundRes.message || '未知错误'}`);
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('退单失败:', error);
      ElMessage.error(`退单失败：${error.message || '系统错误'}`);
    }
  }
};

// 重新购买
const repay = (row) => {
  router.push('/film/ticket?fid=' + row.movieId);
};

// 订单状态映射
const statusMap = {
  0: { text: '待支付', type: 'warning' },
  1: { text: '已支付', type: 'success' },
  2: { text: '已取消', type: 'info' },
  3: { text: '已退款', type: 'danger' }
};

// 格式化日期时间
const formatDateTime = (datetime) => {
  if (!datetime) return '未知时间';
  const date = new Date(datetime);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<template>
  <el-card class="orders-container">
    <h1 class="page-title">我的订单</h1>

    <!-- 待支付订单 -->
    <div v-if="notpayedlist.length > 0" class="order-section">
      <h2 class="section-title">待支付订单</h2>
      <div class="order-list">
        <div v-for="(order, index) in notpayedlist" :key="index" class="order-card">
          <div class="order-header">
            <span class="order-no">订单号: {{ order.orderNo }}</span>
            <el-tag :type="statusMap[0].type" size="small">
              {{ statusMap[0].text }}
            </el-tag>
          </div>

          <div class="order-body">
            <div class="movie-info">
              <h3>{{ order.title }}</h3>
              <p>时间: {{ formatDateTime(order.time) }}</p>
              <p>座位: {{ order.code.split(',').join('、') }}</p>
              <p>支付方式: {{ order.paymentTransactionId || '未选择' }}</p>
            </div>

            <div class="order-amount">
              <span class="price">¥{{ order.totalAmount.toFixed(2) }}</span>
            </div>
          </div>

          <div class="order-actions">
            <el-button type="primary" size="small" @click="payout(order)">
              立即支付
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 可退款订单 -->
    <div v-if="cantuikuan.length > 0" class="order-section">
      <h2 class="section-title">待使用订单（可退款）</h2>
      <div class="order-list">
        <div v-for="(order, index) in cantuikuan" :key="index" class="order-card">
          <div class="order-header">
            <span class="order-no">订单号: {{ order.orderNo }}</span>
            <el-tag :type="statusMap[1].type" size="small">
              {{ statusMap[1].text }}
            </el-tag>
          </div>

          <div class="order-body">
            <div class="movie-info">
              <h3>{{ order.title }}</h3>
              <p>时间: {{ formatDateTime(order.time) }}</p>
              <p>座位: {{ order.code.split(',').join('、') }}</p>
              <p>支付方式: {{ order.paymentTransactionId || '未知' }}</p>
            </div>

            <div class="order-amount">
              <span class="price">¥{{ order.totalAmount.toFixed(2) }}</span>
            </div>
          </div>

          <div class="order-actions">
            <el-button type="danger" size="small" @click="outOrder(order)">
              退单
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 已完成订单 -->
    <div v-if="payedlist.length > 0" class="order-section">
      <h2 class="section-title">已完成订单</h2>
      <div class="order-list">
        <div v-for="(order, index) in payedlist" :key="index" class="order-card">
          <div class="order-header">
            <span class="order-no">订单号: {{ order.orderNo }}</span>
            <el-tag :type="statusMap[1].type" size="small">
              {{ statusMap[1].text }}
            </el-tag>
          </div>

          <div class="order-body">
            <div class="movie-info">
              <h3>{{ order.title }}</h3>
              <p>时间: {{ formatDateTime(order.time) }}</p>
              <p>座位: {{ order.code.split(',').join('、') }}</p>
              <p>支付方式: {{ order.paymentTransactionId || '未知' }}</p>
              <p>支付时间: {{ formatDateTime(order.paymentTime) || '未知' }}</p>
            </div>

            <div class="order-amount">
              <span class="price">¥{{ order.totalAmount.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 已取消订单 -->
    <div v-if="quxiao.length > 0" class="order-section">
      <h2 class="section-title">已取消订单</h2>
      <div class="order-list">
        <div v-for="(order, index) in quxiao" :key="index" class="order-card">
          <div class="order-header">
            <span class="order-no">订单号: {{ order.orderNo }}</span>
            <el-tag :type="statusMap[2].type" size="small">
              {{ statusMap[2].text }}
            </el-tag>
          </div>

          <div class="order-body">
            <div class="movie-info">
              <h3>{{ order.title }}</h3>
              <p>时间: {{ formatDateTime(order.time) }}</p>
              <p>座位: {{ order.code.split(',').join('、') }}</p>
            </div>

            <div class="order-amount">
              <span class="price">¥{{ order.totalAmount.toFixed(2) }}</span>
            </div>
          </div>

          <div class="order-actions">
            <el-button type="default" size="small" @click="repay(order)">
              重新购买
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 已退款订单 -->
    <div v-if="refundlist.length > 0" class="order-section">
      <h2 class="section-title">已退款订单</h2>
      <div class="order-list">
        <div v-for="(order, index) in refundlist" :key="index" class="order-card">
          <div class="order-header">
            <span class="order-no">订单号: {{ order.orderNo }}</span>
            <el-tag :type="statusMap[3].type" size="small">
              {{ statusMap[3].text }}
            </el-tag>
          </div>

          <div class="order-body">
            <div class="movie-info">
              <h3>{{ order.title }}</h3>
              <p>时间: {{ formatDateTime(order.time) }}</p>
              <p>座位: {{ order.code.split(',').join('、') }}</p>
            </div>

            <div class="order-amount">
              <span class="price">¥{{ order.totalAmount.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="orders.length === 0" class="empty-state">
      <el-empty description="暂无订单数据"></el-empty>
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.orders-container {
  max-width: 1000px;
  margin: 20px auto;
  padding: 20px;
  border-radius: 8px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 25px;
  color: #333;
  text-align: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.section-title {
  font-size: 18px;
  color: #333;
  margin: 30px 0 15px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.order-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.order-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 15px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  .order-no {
    font-size: 14px;
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.order-body {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;

  .movie-info {
    flex: 1;

    h3 {
      font-size: 16px;
      margin: 0 0 8px 0;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    p {
      font-size: 13px;
      color: #666;
      margin: 4px 0;
      line-height: 1.5;
    }
  }

  .order-amount {
    width: 80px;
    text-align: right;

    .price {
      font-size: 16px;
      font-weight: bold;
      color: #f56c6c;
    }
  }
}

.order-actions {
  display: flex;
  justify-content: flex-end;

  .el-button {
    padding: 6px 12px;
    font-size: 12px;
  }
}

.empty-state {
  margin: 60px 0;
  text-align: center;
}
</style>