<script setup>
import {ref} from "vue";
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
import { ElMessage, ElMessageBox } from "element-plus";
import { useUserInfoStore } from "@/stores/userInfo";
import axios from 'axios';
const userInfoStore = useUserInfoStore();
const uid = userInfoStore.userInfo?.id;

// 订单列表（保持不变）
const notpayedlist = ref([]);
const payedlist = ref([]);
const refundlist = ref([]);
const cantuikuan = ref([]);
const quxiao = ref([]);
const orders = ref([]);

// 修复：判断是否在开场前30分钟以上（可退款）
const isAfter30Minutes = (inputTime) => {
  const targetTime = new Date(inputTime);
  const currentTime = new Date();
  const timeDiff = targetTime.getTime() - currentTime.getTime();
  const thirtyMinutesInMs = 30 * 60 * 1000; // 修复：30分钟（毫秒）
  return timeDiff > thirtyMinutesInMs; // 剩余时间>30分钟 → 可退款
};

// 订单分类（异步处理，确保所有数据加载完成后再渲染）
const showOrders = async () => {
  // 1. 清空现有列表（避免旧数据残留）
  notpayedlist.value = [];
  payedlist.value = [];
  refundlist.value = [];
  cantuikuan.value = [];
  quxiao.value = [];
  orders.value = [];

  try {
    // 2. 等待订单数据获取（关键：使用await确保拿到最新数据）
    const res = await fetchOrders();
    orders.value = res.data.filter(order => order.userId === uid);

    // 3. 遍历订单，使用for...of配合await确保每个订单的异步操作完成
    for (const order of orders.value) {
      // 复制订单数据（避免响应式对象引用问题）
      const orderWithDetails = { ...order };

      // 等待场次信息加载
      const sessionRes = await getSessionsByid({ sessionId: order.sessionId });
      orderWithDetails.time = sessionRes.data.time;
      orderWithDetails.movieId = sessionRes.data.movieId;

      // 等待电影名称加载
      const movieRes = await getMoviesid({ id: sessionRes.data.movieId });
      orderWithDetails.title = movieRes.data.title;

      // 4. 按状态分类（与原逻辑一致）
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

    console.log("订单列表已完全刷新");
  } catch (error) {
    console.error("刷新订单列表失败:", error);
    ElMessage.error("刷新订单失败，请重试");
  }
};

// 初始化订单列表（保持不变）
showOrders();

// 支付功能（保持不变）
const payout = (row) => {
  // 接支付接口
};

// 修复：退单功能（完整实现退款流程）
const outOrder = async (row) => {
  const userInfoStore = useUserInfoStore(); // 获取用户信息
  const userId = userInfoStore.userInfo?.id; // 用户ID
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
    // 1. 用户确认退单（新增确认步骤）
    await ElMessageBox.confirm(
        `确定要退掉《${row.title}》的订单吗？`,
        '退单确认',
        {
          confirmButtonText: '确认退单',
          cancelButtonText: '取消',
          type: 'warning'
        }
    );

    // 调用正确的退款接口（POST /api/orders/refund）
    const refundParams = {
      orderNo: row.orderNo,        // 传递订单号（正确参数）
      refundAmount: row.totalAmount.toString(),
      refundReason: '用户主动退单'
    };
    // 关键：调用的是 refundOrder 函数（对应后端 /refund 接口）
    const refundRes = await refundOrder(refundParams);

    // 4. 处理退款结果（修复：匹配后端JsonResponse格式）
    if (refundRes.status) { // 假设后端用"success"表示成功
      ElMessage.success('退款成功，资金将在1-3个工作日内退回原支付账户');
      await showOrders(); // 刷新订单列表
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
          // 不影响主流程，仅打印错误
        }
      }
    } else {
      ElMessage.error(`退款失败：${refundRes.message || '未知错误'}`);
    }
  } catch (error) {
  // 排除用户主动取消的情况
  if (error !== 'cancel') {
    console.error('退单失败:', error);
    ElMessage.error(`退单失败：${error.message || '系统错误'}`);
  }
}
};

const repay=(row)=>{
  router.push('/film/ticket?fid=' + row.movieId)
}

// 订单状态映射
const statusMap = {
  0: { text: '待支付', type: 'warning' },
  1: { text: '已支付', type: 'success' },
  2: { text: '已取消', type: 'info' },
  3: { text: '已退款', type: 'danger' }
}

// 格式化日期时间
const formatDateTime = (datetime) => {
  if (!datetime) return '未知时间'
  const date = new Date(datetime)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <el-card>
    <h1>订单</h1>

  </el-card>
<div class="box">
  <div>
    <p>用户待支付订单</p>
    <el-table :data="notpayedlist" border style="width: 100%">
      <!-- 数据列 -->
      <el-table-column prop="orderNo" label="订单编号" width="180" />
      <el-table-column prop="code" label="座位号" width="180" />
      <el-table-column prop="time" label="开场时间" width="180" />
      <el-table-column prop="title" label="电影名称" width="180"/>
      <el-table-column prop="paymentTransactionId" label="支付方式" width="180"/>
      <el-table-column prop="totalAmount" label="总金额" width="180"/>
      <el-table-column prop="paymentTime" label="支付时间" width="180"/>
      <!-- 操作列（正确插槽用法） -->
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button @click="payout(row)">支付</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>

  <div>
    <p>用户待使用订单</p>
    <el-table :data="cantuikuan" border style="width: 100%">
      <!-- 数据列 -->
      <el-table-column prop="orderNo" label="订单编号" width="180" />
      <el-table-column prop="code" label="座位号" width="180" />
      <el-table-column prop="time" label="开场时间" width="180" />
      <el-table-column prop="title" label="电影名称" width="180"/>
      <el-table-column prop="paymentTransactionId" label="支付方式" width="180"/>
      <el-table-column prop="totalAmount" label="总金额" width="180"/>
      <el-table-column prop="paymentTime" label="支付时间" width="180"/>
      <!-- 操作列（正确插槽用法） -->
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button @click="outOrder(row)">退单</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>



  <div>
    <p>用户已取消订单</p>
    <el-table :data="quxiao" border style="width: 100%"  >
      <!-- 数据列 -->
      <el-table-column prop="orderNo"  label="订单编号" width="180" />
      <el-table-column prop="code" label="座位号" width="180" />
      <el-table-column prop="time" label="开场时间" width="180" />
      <el-table-column prop="title" label="电影名称" width="180"/>
      <el-table-column prop="paymentTransactionId" label="支付方式" width="180"/>
      <el-table-column prop="totalAmount" label="总金额" width="180"/>
      <el-table-column prop="paymentTime" label="支付时间" width="180"/>
      <!-- 操作列（正确插槽用法） -->
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button @click="repay(row)">重新购买</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>


  <div>
    <p>用户已完成订单</p>
    <el-table :data="payedlist" border style="width: 100%">
      <!-- 数据列 -->
      <el-table-column prop="orderNo" label="订单编号" width="180" />
      <el-table-column prop="code" label="座位号" width="180" />
      <el-table-column prop="time" label="开场时间" width="180" />
      <el-table-column prop="title" label="电影名称" width="180"/>
      <el-table-column prop="paymentTransactionId" label="支付方式" width="180"/>
      <el-table-column prop="totalAmount" label="总金额" width="180"/>
      <el-table-column prop="paymentTime" label="支付时间" width="180"/>
      <!-- 操作列（正确插槽用法） -->
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
        </template>
      </el-table-column>
    </el-table>
  </div>


  <div>
    <p>用户退单订单</p>
    <el-table :data="refundlist" border style="width: 100%">
      <!-- 数据列 -->
      <el-table-column prop="orderNo" label="订单编号" width="180" />
      <el-table-column prop="code" label="座位号" width="180" />
      <el-table-column prop="time" label="开场时间" width="180" />
      <el-table-column prop="title" label="电影名称" width="180"/>
      <el-table-column prop="paymentTransactionId" label="支付方式" width="180"/>
      <el-table-column prop="totalAmount" label="总金额" width="180"/>
      <el-table-column prop="paymentTime" label="支付时间" width="180"/>
      <!-- 操作列（正确插槽用法） -->
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
        </template>
      </el-table-column>
    </el-table>
  </div>
</div>
</template>

<style scoped lang="scss">
.orders-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 25px;
  color: #333;
  text-align: center;
}

.section-title {
  font-size: 18px;
  color: #333;
  margin: 20px 0 15px;
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
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
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
    padding: 8px 12px;
    font-size: 12px;
  }
}

.empty-state {
  margin: 40px 0;
  text-align: center;
}
</style>