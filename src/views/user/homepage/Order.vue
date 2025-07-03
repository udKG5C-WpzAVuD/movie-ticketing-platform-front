<script setup>
import { ref, onMounted, onUnmounted } from "vue";
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
let refreshTimer = null;
const isRefreshing = ref(false); // 新增：并发控制标志

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

// 加载订单列表（添加去重和并发控制）
const showOrders = async () => {
  if (isRefreshing.value) return; // 避免并发刷新
  isRefreshing.value = true;

  // 清空列表
  notpayedlist.value = [];
  payedlist.value = [];
  refundlist.value = [];
  cantuikuan.value = [];
  quxiao.value = [];
  orders.value = [];

  try {
    const res = await fetchOrders();

    // 关键：基于orderNo去重（确保唯一）
    const uniqueOrders = Array.from(
        new Map(res.data.map(order => [order.orderNo, order])).values()
    );

    // 过滤当前用户订单
    orders.value = uniqueOrders.filter(order => order.userId === uid);
    console.log('加载订单成功，共', orders.value.length, '条');

    // 遍历处理订单
    for (const order of orders.value) {
      const orderWithDetails = { ...order };

      const sessionRes = await getSessionsByid({ sessionId: order.sessionId });
      orderWithDetails.time = sessionRes.data.time;
      orderWithDetails.movieId = sessionRes.data.movieId;

      const movieRes = await getMoviesid({ id: sessionRes.data.movieId });
      orderWithDetails.title = movieRes.data.title;

      // 订单分类（添加日志便于调试）
      if (orderWithDetails.orderStatus === 0) {
        if (!isAfter30Minutes(orderWithDetails.time)) {
          console.log('添加到refundlist:', orderWithDetails.orderNo);
          refundlist.value.push(orderWithDetails);
        } else {
          console.log('添加到notpayedlist:', orderWithDetails.orderNo);
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
  } finally {
    isRefreshing.value = false;
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

// 检查订单是否超时（用于定时刷新时判断）
const checkOrderTimeout = (order) => {
  if (order.orderStatus !== 0) return false; // 仅检查待支付订单
  const createTime = new Date(order.createTime);
  const timeoutTime = new Date(createTime.getTime() + 24 * 60 * 60 * 1000); // 24小时超时
  return new Date() > timeoutTime; // 当前时间 > 超时时间 → 已超时
};

// 定时刷新列表（调整间隔并添加并发控制）
const startAutoRefresh = () => {
  if (refreshTimer) clearInterval(refreshTimer);

  // 每2分钟检查一次（减少频率）
  refreshTimer = setInterval(async () => {
    if (isRefreshing.value) return; // 避免并发刷新

    const hasTimeoutOrder = orders.value.some(order => checkOrderTimeout(order));
    if (hasTimeoutOrder) {
      console.log('检测到超时订单，触发刷新');
      await showOrders();
    }
  }, 2 * 60 * 1000); // 2分钟 = 120000毫秒
};

// 初始化订单列表并启动定时刷新
onMounted(() => {
  showOrders().then(() => {
    startAutoRefresh();
  });
});

// 组件卸载时清除定时器
onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer);
});
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
              <p>支付方式: {{ '支付宝' }}</p>
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