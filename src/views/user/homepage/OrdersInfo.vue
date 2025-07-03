<script setup>
import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
import { ElMessage, ElTag, ElImage, ElButton, ElEmpty, ElMessageBox } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { getSessionById, cancelOrder } from '@/api/user'
import { useUserInfoStore } from '@/stores/userInfo'

// 路由与状态管理
const route = useRoute()
const router = useRouter()
const isLoading = ref(true)
const orderDetail = ref(null) // 订单详情数据
const sessionInfo = ref({}) // 场次信息
const username = useUserInfoStore().userInfo?.username
const isPaying = ref(false)
const pollTimer = ref(null)  // 支付状态轮询定时器
const pollTimeout = 15 * 60 * 1000  // 15分钟支付轮询超时
const pollInterval = 3000  // 3秒轮询间隔

// 倒计时相关变量
const countdown = ref({ hours: 0, minutes: 0, seconds: 0 })
const countdownTimer = ref(null) // 倒计时定时器
const isCounting = ref(false) // 是否正在倒计时

// 初始化数据
onMounted(() => {
  const orderNo = route.query.orderNo
  if (orderNo) {
    fetchOrderDetail(orderNo).then(() => {
      // 待支付订单启动24小时倒计时
      if (orderDetail.value?.orderStatus === 0) {
        startCountdown()
      }
    })
  } else {
    isLoading.value = false
    ElMessage.error('缺少订单号参数')
  }
})

// 获取订单详情
const fetchOrderDetail = async (orderNo) => {
  try {
    const response = await fetch(`/api/orders/detail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderNo })
    })

    const data = await response.json()
    if (data?.status && data.data) {
      orderDetail.value = data.data
      if (orderDetail.value.sessionId) {
        fetchSessionInfo(orderDetail.value.sessionId)
      }
    } else {
      ElMessage.error('获取订单失败：' + (data?.message || '未知错误'))
    }
  } catch (error) {
    console.error('获取订单详情失败:', error)
    ElMessage.error('网络错误，无法加载订单信息')
  } finally {
    isLoading.value = false
  }
}

// 获取场次信息
const fetchSessionInfo = async (sessionId) => {
  try {
    const response = await getSessionById(sessionId)
    if (response.status) {
      sessionInfo.value = response.data
    }
  } catch (error) {
    console.error('获取场次信息失败:', error)
  }
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

// 订单状态映射
const statusMap = {
  0: { text: '待支付', type: 'warning' },
  1: { text: '已支付', type: 'success' },
  2: { text: '已取消', type: 'info' }
}
const statusText = computed(() => statusMap[orderDetail.value?.orderStatus]?.text || '未知状态')
const statusType = computed(() => statusMap[orderDetail.value?.orderStatus]?.type || 'default')

// 支付方式映射
const paymentMethodText = computed(() => {
  const method = orderDetail.value?.paymentMethod || ''
  const methodMap = { 'alipay': '支付宝', '': '未选择' }
  return methodMap[method]
})

// 启动24小时倒计时
const startCountdown = () => {
  if (countdownTimer.value) clearInterval(countdownTimer.value)

  // 计算截止时间（订单创建时间 + 24小时）
  const createTime = new Date(orderDetail.value.createTime)
  const deadline = new Date(createTime.getTime() + 24 * 60 * 60 * 1000)
  isCounting.value = true

  // 更新倒计时
  const update = () => {
    const now = new Date()
    const diff = deadline - now

    if (diff <= 0) {
      clearInterval(countdownTimer.value)
      isCounting.value = false
      autoCancelOrder() // 超时自动取消
      return
    }

    countdown.value = {
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000)
    }
  }

  update() // 立即执行一次
  countdownTimer.value = setInterval(update, 1000)
}

// 取消订单
const handleCancelOrder = () => {
  ElMessageBox.confirm('确定要取消该订单吗？取消后座位将被释放', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      clearInterval(countdownTimer.value) // 停止倒计时
      isCounting.value = false

      const response = await cancelOrder(orderDetail.value.orderNo)
      if (response.status) {
        ElMessage.success('订单已取消')
        orderDetail.value.orderStatus = 2
        router.push({ path: '/user/orders' })
      } else {
        ElMessage.error(response.message || '取消订单失败')
      }
    } catch (error) {
      console.error('取消订单失败:', error)
      ElMessage.error('取消订单时发生错误')
    }
  }).catch(() => {})
}

// 支付功能（点击停止倒计时）
const handlePayment = async () => {
  if (orderDetail.value.orderStatus !== 0) {
    ElMessage.warning('只有待支付订单可以支付')
    return
  }

  try {
    isPaying.value = true
    clearInterval(countdownTimer.value) // 停止倒计时
    isCounting.value = false

    // 打开支付页面
    const payUrl = `http://127.0.0.1:8080/alipay/pay?traceNo=${orderDetail.value.orderNo}&totalAmount=${orderDetail.value.totalAmount}&subject=电影票-${sessionInfo.value.title || '未知电影'}`
    window.open(payUrl, '_blank')

    startPollingOrderStatus()
  } catch (error) {
    console.error('支付请求失败:', error)
    ElMessage.error('支付请求失败，请重试')
    isPaying.value = false
    // 支付失败重启倒计时
    if (orderDetail.value?.orderStatus === 0) startCountdown()
  }
}

// 支付状态轮询
const startPollingOrderStatus = () => {
  if (pollTimer.value) clearInterval(pollTimer.value)
  const startTime = Date.now()
  const userId = useUserInfoStore().userInfo?.id

  pollTimer.value = setInterval(async () => {
    if (Date.now() - startTime > pollTimeout) {
      clearInterval(pollTimer.value)
      ElMessage.warning('支付超时，自动取消订单')
      isPaying.value = false
      await autoCancelOrder() // 15分钟未支付超时取消
      return
    }

    await fetchOrderDetail(orderDetail.value.orderNo)
    if (orderDetail.value?.orderStatus === 1) {
      clearInterval(pollTimer.value)
      isPaying.value = false
      ElMessage.success('支付成功！')
      // 更新用户活动记录
      if (userId && orderDetail.value.totalAmount) {
        try {
          await fetch('/api/userActivity/update-purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              userId: userId.toString(),
              amount: orderDetail.value.totalAmount.toString()
            })
          })
        } catch (error) {
          console.error('更新活动记录失败:', error)
        }
      }
    }
  }, pollInterval)
}

// 自动取消订单（超时触发）
const autoCancelOrder = async () => {
  if (orderDetail.value?.orderStatus !== 0) return

  try {
    const response = await cancelOrder(orderDetail.value.orderNo)
    if (response.status) {
      ElMessage.success('订单已因超时自动取消')
      orderDetail.value.orderStatus = 2
      router.push({ path: '/user/orders' })
    } else {
      ElMessage.error('超时取消失败：' + response.message)
    }
  } catch (error) {
    console.error('自动取消失败:', error)
    ElMessage.error('超时取消时发生错误')
  }
}

// 监听订单状态变化
watch(() => orderDetail.value?.orderStatus, (newStatus) => {
  if (newStatus !== 0) {
    clearInterval(countdownTimer.value)
    isCounting.value = false
  }
})

// 组件卸载清理定时器
onUnmounted(() => {
  if (countdownTimer.value) clearInterval(countdownTimer.value)
  if (pollTimer.value) clearInterval(pollTimer.value)
})
</script>

<template>
  <div class="order-detail-page">
    <div class="page-title">订单详情</div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <el-loading-spinner />
      <p>加载订单信息中...</p>
    </div>

    <!-- 订单不存在 -->
    <div v-else-if="!orderDetail" class="empty-state">
      <el-empty description="未找到对应的订单信息"></el-empty>
      <el-button type="primary" @click="router.back()">返回上一页</el-button>
    </div>

    <!-- 订单详情卡片 -->
    <div v-else class="order-card">
      <!-- 订单状态 -->
      <div class="order-status">
        <el-tag :type="statusType" size="large">{{ statusText }}</el-tag>
      </div>

      <!-- 基本信息 -->
      <div class="order-base-info">
        <div class="order-no">
          <span class="label">订单编号：</span>
          <span class="value">{{ orderDetail.orderNo }}</span>
        </div>
        <div class="order-time">
          <span class="label">创建时间：</span>
          <span class="value">{{ formatDateTime(orderDetail.createTime) }}</span>
        </div>
      </div>

      <!-- 电影信息 -->
      <div class="info-section">
        <h3 class="section-title">电影信息</h3>
        <div class="movie-info">
          <el-image
              :src="sessionInfo.posterUrl || 'https://picsum.photos/200/300'"
              class="movie-poster"
              fit="cover"
              alt="电影海报"
          ></el-image>
          <div class="movie-details">
            <p class="movie-title">{{ sessionInfo.title || '未知电影' }}</p>
            <p>场次时间：{{ formatDateTime(sessionInfo.time) }}</p>
            <p>影厅信息：{{ sessionInfo.tingnum || '未知' }}号厅</p>
            <p>座位信息：{{ orderDetail.code.split(',').join('、') }}</p>
          </div>
        </div>
      </div>

      <!-- 联系人信息 -->
      <div class="info-section">
        <h3 class="section-title">联系人信息</h3>
        <div class="contact-info">
          <p>
            <span class="label">用户名：</span>
            <span class="value">{{ username || '未填写' }}</span>
          </p>
          <p>
            <span class="label">联系电话：</span>
            <span class="value">{{ orderDetail.contactPhone || '未填写' }}</span>
          </p>
        </div>
      </div>

      <!-- 支付信息 -->
      <div class="info-section">
        <h3 class="section-title">支付信息</h3>
        <div class="payment-info">
          <p>
            <span class="label">支付方式：</span>
            <span class="value">{{ paymentMethodText }}</span>
          </p>
          <p>
            <span class="label">订单金额：</span>
            <span class="value price">¥{{ orderDetail.totalAmount.toFixed(2) }}</span>
          </p>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="order-actions">
        <el-button
            v-if="orderDetail.orderStatus === 0"
            type="primary"
            @click="handlePayment"
            :loading="isPaying"
        >
          <i class="el-icon-credit-card" v-if="!isPaying"></i>
          立即支付
          <!-- 倒计时显示 -->
          <span v-if="isCounting" class="countdown-text">
            ({{ countdown.hours.toString().padStart(2, '0') }}:{{ countdown.minutes.toString().padStart(2, '0') }}:{{ countdown.seconds.toString().padStart(2, '0') }})
          </span>
        </el-button>
        <el-button
            v-if="orderDetail.orderStatus === 0"
            type="warning"
            @click="handleCancelOrder"
        >
          取消订单
        </el-button>
        <el-button type="info" @click="router.back()">返回</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.order-detail-page {
  max-width: 800px;
  margin: 20px auto;
  padding: 0 20px;
}

.page-title {
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.loading-container {
  text-align: center;
  padding: 80px 0;
  .el-loading-spinner {
    margin: 0 auto 20px;
  }
}

.empty-state {
  text-align: center;
  padding: 60px 0;
  .el-button {
    margin-top: 20px;
  }
}

.order-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  padding: 20px;
}

.order-status {
  text-align: right;
  margin-bottom: 20px;
}

.order-base-info {
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px dashed #f0f0f0;
  .order-no, .order-time {
    margin-bottom: 10px;
    .label {
      color: #666;
      display: inline-block;
      width: 80px;
    }
    .value {
      color: #333;
    }
  }
}

.info-section {
  margin-bottom: 25px;
  .section-title {
    font-size: 16px;
    color: #333;
    margin-bottom: 15px;
    padding-left: 5px;
    border-left: 3px solid #409eff;
  }
}

.movie-info {
  display: flex;
  gap: 20px;
  .movie-poster {
    width: 120px;
    height: 160px;
    border-radius: 4px;
  }
  .movie-details {
    flex: 1;
    padding: 5px 0;
    .movie-title {
      font-size: 18px;
      font-weight: bold;
      margin: 0 0 10px 0;
      color: #333;
    }
    p {
      margin: 5px 0;
      color: #666;
    }
  }
}

.contact-info, .payment-info {
  padding: 15px;
  background: #f9f9f9;
  border-radius: 6px;
  p {
    margin: 10px 0;
    .label {
      display: inline-block;
      width: 80px;
      color: #666;
    }
    .value {
      color: #333;
    }
    .price {
      color: #f56c6c;
      font-weight: bold;
      font-size: 16px;
    }
  }
}

.order-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
}

/* 倒计时样式 */
.countdown-text {
  margin-left: 8px;
  font-size: 14px;
  color: #fff;
  font-weight: normal;
  /* 剩余1小时内闪烁提醒 */
  animation: blink 1s infinite alternate linear;
}

@keyframes blink {
  from { opacity: 1; }
  to { opacity: 0.7; }
}
</style>