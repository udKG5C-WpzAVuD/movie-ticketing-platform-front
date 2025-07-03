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
import axios from 'axios';
import {ElMessage} from "element-plus";
import {useUserInfoStore} from "@/stores/userInfo";
const userInfoStore = useUserInfoStore();
const uid = userInfoStore.userInfo?.id;

const notpayedlist=ref([])
const payedlist=ref([])
const refundlist=ref([])
const cantuikuan=ref([])
const quxiao=ref([])
const orders=ref([])

const isAfter30Minutes = (inputTime) => {
  const targetTime = new Date(inputTime);
  const currentTime = new Date();
  const timeDiff = targetTime.getTime() - currentTime.getTime();
  const thirtyMinutesInMs = 0;
  return timeDiff > thirtyMinutesInMs;
};

const showOrders=()=>{
  fetchOrders().then(res=>{
    orders.value = res.data.filter(order => order.userId===uid);
    orders.value.forEach(order=>{
      const xuqouorder=ref({
        orderNo:"",
        contactPhone:"",
        paymentTransactionId:"",
        totalAmount:"",
        paymentTime:"",
        orderStatus:"",
        code:"",
        title:"",
        time:"",
        movieId:"",
        userId:"",
      })

      getSessionsByid({sessionId:order.sessionId}).then(res=>{
        xuqouorder.value=order
        xuqouorder.value.time=res.data.time
        xuqouorder.value.movieId=res.data.movieId
        getMoviesid({id:res.data.movieId}).then(res=>{
          xuqouorder.value.title=res.data.title
          if(xuqouorder.value.orderStatus==0){
            if(!isAfter30Minutes(xuqouorder.value.time)){
              refundlist.value.push(xuqouorder.value)
            }else{
              notpayedlist.value.push(xuqouorder.value)
            }
          }else if(xuqouorder.value.orderStatus==1){
            if(!isAfter30Minutes(xuqouorder.value.time)){
              payedlist.value.push(xuqouorder.value)
            }else{
              cantuikuan.value.push(xuqouorder.value)
            }
          }else if(xuqouorder.value.orderStatus==2){
            quxiao.value.push(xuqouorder.value)
          }else{
            refundlist.value.push(xuqouorder.value)
          }
        })
      })
    })
  })
}
showOrders()

const payout=(row)=>{
  router.push({
    path: '/user/OrdersInfo',
    query: { orderNo: row.orderNo }
  });
}

const outOrder=(row)=>{
  getSeats(row.sessionId).then(res=>{
    const seats=row.code
    const selectedCodes = row.code.split(',');
    for (const code of selectedCodes) {
      const seatssession=ref({
        sessionId:"",
        code:""
      })
      seatssession.value.sessionId=row.sessionId
      seatssession.value.code=code
      const shuju={...seatssession.value}
      deleteSeats(shuju).then(res=>{
        refundOrder({id:row.id}).then(res=>{
          ElMessage({
            message:'退单成功',
            type:'success'
          })
          showOrders()
        })
      })
    }
  })
}

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
  <div class="orders-container">
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
            </div>

            <div class="order-amount">
              <span class="price">¥{{ order.totalAmount.toFixed(2) }}</span>
            </div>
          </div>

          <div class="order-actions">
            <el-button type="primary" size="small" @click="payout(order)">支付</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 可退款订单 -->
    <div v-if="cantuikuan.length > 0" class="order-section">
      <h2 class="section-title">可退款订单</h2>
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
            </div>

            <div class="order-amount">
              <span class="price">¥{{ order.totalAmount.toFixed(2) }}</span>
            </div>
          </div>

          <div class="order-actions">
            <el-button type="danger" size="small" @click="outOrder(order)">退单</el-button>
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
            <el-button type="default" size="small" @click="repay(order)">重新购买</el-button>
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