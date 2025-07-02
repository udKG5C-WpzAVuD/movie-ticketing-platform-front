<script setup>
import {useUserInfoStore} from "@/stores/userInfo";
import {getSeats, getSessions} from "@/api/user";
import {computed, ref} from "vue";
import { defineStore } from 'pinia'
import router from "@/router";
import axios from 'axios';
import {ElMessage,ElForm,ElFormItem,ElInput,ElRadioGroup, ElRadio, ElButton} from "element-plus";
import {CreditCard} from "@element-plus/icons-vue";
import { User, Phone, ChatDotRound } from "@element-plus/icons-vue";

const film = JSON.parse(sessionStorage.getItem('selectedMovie'));
const userInfoStore = useUserInfoStore();
const sessions = ref([])
const filmsessions = ref([])
const seatsfilm = ref([])
const selectedSeats = ref([])
const showSeatMap = ref(false)
const currentSession = ref(null) // 当前选中的场次
const totalprice = computed(() => {
  if (!film.price || !selectedSeats.value.length) return 0;
  return film.price * selectedSeats.value.length;
});
const dialogOrderVisible = ref(false);
const formLabelWidth = '100px';
// 当前日期（用于比较）
const currentDate = new Date()
currentDate.setHours(0, 0, 0, 0)

// 格式化时间显示
const formatTime = (datetime) => {
  const date = new Date(datetime)
  return date.toLocaleString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

// 订单表单数据
const orderForm = ref({
  // 收货信息
  receiver: userInfoStore.userInfo?.username || '',// 从用户信息获取默认值
  phone: userInfoStore.userInfo?.contactPhone || '',
  // 支付方式
  paymentMethod: 'alipay',
});
const orderFormRef = ref(null);
const rules = {
  receiver: [
    { required: true, message: '请输入名字', trigger: 'blur' },
    { min: 2, message: '姓名长度不能少于2个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码', trigger: 'blur' }
  ],
};


// 过滤场次
const filterSessions = () => {
  if (!film || !sessions.value) {
    filmsessions.value = []
    return
  }

  filmsessions.value = sessions.value.filter(session => {
    const isTitleMatch = session.title === film.title
    const sessionDate = new Date(session.time)
    sessionDate.setHours(0, 0, 0, 0)
    const isDateValid = sessionDate >= currentDate
    return isTitleMatch && isDateValid
  })
}

// 获取场次数据
getSessions().then(res => {
  sessions.value = res.data
  filterSessions()
})

// 显示座位图
const showseats = (session) => {
  currentSession.value = session // 保存当前场次
  getSeats(session.sid).then(res => {
    seatsfilm.value = res.data
    showSeatMap.value = true
    selectedSeats.value = [] // 重置已选座位
  })
}
const printSeats = () => {
  console.log("seatsfilm 数据：", seatsfilm.value);
  console.log("seatRows（已分组）数据：", seatRows.value);
  console.log("已选座位：", selectedSeats.value);
  console.log("需要的座位",selectedSeatObjects.value)
  console.log("总价钱",totalprice.value)
};
const seatRows = computed(() => {
  const rows = Array.from(new Set(seatsfilm.value.map(seat => seat.code[0])));
  return rows.map(row => {
    const cols = [];
    for (let col = 1; col <= 10; col++) {
      const code = `${row}${col}`;
      const seat = seatsfilm.value.find(s => s.code === code);
      cols.push(seat || null);
    }
    return { row, cols };
  });
});
const selectedSeatObjects = computed(() =>
    seatsfilm.value.filter(seat => selectedSeats.value.includes(seat.code))
);

const confirmSelection=()=>{
//   这里就是订单生成的接口
  if (selectedSeats.value.length === 0) {
    ElMessage.warning('请至少选择一个座位');
    return;
  }
  if (!currentSession.value) {
    ElMessage.warning('请选择场次');
    return;
  }
  dialogOrderVisible.value = true;
}
// 提交订单
const submitOrder = async () => {
  // 修复表单验证逻辑（原代码中orderFormRef定义在函数内，无法获取到表单实例）
  if (!orderFormRef.value) {
    ElMessage.error('表单初始化失败');
    return;
  }

  // 表单验证
  try {
    await orderFormRef.value.validate();
  } catch (err) {
    ElMessage.error('请完善订单信息');
    return;
  }

  try {
    // 构建订单数据
    const orderData = {
      userId: userInfoStore.userInfo?.id, // 用户ID是Long类型，直接传递
      sessionId: currentSession.value?.sid, // 确保sid是数字或字符串（非对象）
      totalAmount: totalprice.value.toString(),
      contactPhone: orderForm.value.phone,
      paymentMethod: orderForm.value.paymentMethod,
      receiver: orderForm.value.receiver,
      code: selectedSeats.value.join(','), // 座位号拼接为字符串（如"A1,A2"）
      orderStatus: 0
    };

    // 使用Axios直接发送POST请求（替换原createOrder接口调用）
    const response = await axios.post('/api/orders/create', orderData, {
      headers: {
        'Content-Type': 'application/json' // 明确指定请求类型
      }
    });

    // 根据后端返回的JsonResponse结构处理响应
    if (response.data?.status) { // 后端用status字段表示成功（true/false）
      ElMessage.success('订单创建成功！');
      dialogOrderVisible.value = false;
      // 携带订单号跳转到订单详情页
      const orderNo = response.data?.data?.orderNo; // 从后端获取订单号（键是 orderNo）
      router.push({
        path: '/user/OrdersInfo',
        query: {
          orderNo: orderNo // 键名改为 orderNo，与后端返回一致
        }
      });
      console.log(orderNo);
    } else {
      // 后端返回失败信息
      ElMessage.error(response.data?.message || '订单创建失败');
    }
  } catch (error) {
    // 捕获网络错误或服务器异常
    console.error('订单提交失败:', error);
    // 区分网络错误和服务器错误
    if (error.response) {
      // 服务器返回错误状态码（如400/500）
      ElMessage.error(error.response.data?.message || '服务器处理失败');
    } else if (error.request) {
      // 无响应（网络问题）
      ElMessage.error('网络连接失败，请检查网络');
    } else {
      // 其他错误
      ElMessage.error('提交订单时发生错误');
    }
  }
};
</script>

<template>
  <div class="seat-selection-container">
    <!-- 电影信息 -->
    <div class="movie-info-container">
      <el-image :src="film.posterUrl" class="movie-poster" fit="cover"></el-image>
      <div class="movie-details">
        <h2>{{ film.title }}</h2>
        <div class="movie-meta">
          <span>{{ film.duration }}分钟</span>
          <span>{{ film.genre }}</span>
          <span>{{ film.language }}</span>
        </div>
        <div class="movie-price">票价：¥{{ film.price }}</div>
      </div>
    </div>

    <!-- 场次选择 -->
    <div class="session-selection">
      <h3 class="section-title">选择场次</h3>
      <div class="session-buttons">
        <div
            v-for="session in filmsessions"
            :key="session.sid"
            class="session-button"
            :class="{ 'active': currentSession?.sid === session.sid }"
            @click="showseats(session)"
        >
          <div class="session-time">{{ formatTime(session.time) }}</div>
          <div class="session-hall">{{ session.tingnum }}号厅</div>
          <div class="session-price">¥{{ film.price }}</div>
        </div>
      </div>
    </div>

    <!-- 座位图 -->
    <div class="seat-map-container" v-if="showSeatMap && currentSession">
      <div class="screen">银幕</div>

      <div class="seat-map">
        <div v-for="row in ['a', 'b', 'c']" :key="row" class="seat-row">
          <div class="row-label">{{ row.toUpperCase() }}</div>
          <div
              v-for="col in 10"
              :key="`${row}${col}`"
              class="seat"
              :class="{
        'occupied': seatsfilm.find(seat => seat.code === `${row}${col}`)?.isOccupied,
        'selected': selectedSeats.includes(`${row}${col}`)
      }" @click="(() => { const seat = seatsfilm.find(s => s.code === `${row}${col}`);
          if (!seat || seat.isOccupied) return;
          const idx = selectedSeats.indexOf(seat.code);

          if (idx > -1) {
            selectedSeats.splice(idx, 1);
          } else {
            selectedSeats.push(seat.code);
          }
        })()">{{ col }}</div>
        </div>
      </div>
      <button @click="printSeats">打印座位数据</button>
      <!-- 座位图例 -->
      <div class="seat-legend">
        <div class="legend-item">
          <div class="legend-seat available"></div>
          <span>可选</span>
        </div>
        <div class="legend-item">
          <div class="legend-seat selected"></div>
          <span>已选</span>
        </div>
        <div class="legend-item">
          <div class="legend-seat occupied"></div>
          <span>已售</span>
        </div>
      </div>
    </div>

    <!-- 选座信息 -->
    <div class="selection-summary" v-if="selectedSeats.length > 0">
      <div class="selected-seats-info">
        <span>已选座位：</span>
        <span >
          {{selectedSeats}}
        </span>
      </div>
      <div class="totalprice.value">
        总计：<span class="price">¥{{ totalprice}}</span>
      </div>
      <el-button type="primary" class="confirm-button" @click="confirmSelection">确认选座</el-button>
    </div>
  </div>
  <!--订单表单-->
  <el-dialog  v-model="dialogOrderVisible" title="填写订单信息" width="600px" :close-on-click-modal="false">
    <el-form ref="orderFormRef" :model="orderForm" :rules="rules" :label-width="formLabelWidth" class="order-form">
      <el-form-item label="订单预览" class="order-preview">
        <div class="preview-list">
          <div class="preview-item">
            <span class="preview-label">电影：</span>
            <span class="preview-value">{{ film.title }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">场次：</span>
            <span class="preview-value">
        {{ currentSession ? `${formatTime(currentSession.time)} ${currentSession.tingnum}号厅` : '' }}
      </span>
          </div>
          <div class="preview-item">
            <span class="preview-label">座位：</span>
            <span class="preview-value">{{ selectedSeats.join('、') }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">总价：</span>
            <span class="preview-value price">¥{{ totalprice }}</span>
          </div>
        </div>
      </el-form-item>
      <el-form-item label="联系电话" prop="phone">
        <el-input v-model="orderForm.phone" placeholder="请输入手机号码" :prefix-icon="Phone" maxlength="11"/>
      </el-form-item>
      <!-- 支付方式 -->
      <el-form-item label="支付方式">
        <el-radio-group v-model="orderForm.paymentMethod" class="payment-methods">
          <!-- 支付宝 -->
          <el-radio label="alipay" class="payment-option">
            <!-- 支付宝图标 + 文字 -->
            <div class="option-wrap">
              <CreditCard class="icon" />
              <span class="option-text">支付宝</span>
            </div>
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogOrderVisible = false">取消</el-button>
      <el-button type="primary" @click="submitOrder">提交订单</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.seat-selection-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

/* 电影信息 */
.movie-info-container {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
}

.movie-poster {
  width: 120px;
  height: 160px;
  border-radius: 4px;
}

.movie-details {
  flex: 1;

  h2 {
    margin: 0 0 10px;
    font-size: 22px;
  }
}

.movie-meta {
  color: #666;
  margin-bottom: 10px;

  span {
    margin-right: 10px;
  }
}

.movie-price {
  color: #f56c6c;
  font-weight: bold;
  font-size: 16px;
}

/* 场次选择 */
.session-selection {
  margin: 30px 0;
}

.section-title {
  font-size: 18px;
  margin-bottom: 15px;
  color: #333;
}

.session-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.session-button {
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;
  text-align: center;

  &:hover {
    border-color: #409eff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &.active {
    border-color: #409eff;
    background-color: #ecf5ff;
  }
}

.session-time {
  font-weight: bold;
  margin-bottom: 4px;
}

.session-hall {
  color: #666;
  font-size: 13px;
  margin-bottom: 4px;
}

.session-price {
  color: #f56c6c;
  font-weight: bold;
}

/* 座位图 */
.seat-map-container {
  margin: 30px auto;
  max-width: 600px;
}

.screen {
  text-align: center;
  padding: 10px;
  background: #333;
  color: white;
  font-weight: bold;
  border-radius: 4px;
  margin-bottom: 30px;
}

.seat-map {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.seat-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.row-label {
  width: 24px;
  text-align: center;
  font-weight: bold;
}

.aisle {
  width: 40px;
}

.seat {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #4CAF50;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  font-weight: bold;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  }

  &.occupied {
    background: #f44336;
    cursor: not-allowed;
  }

  &.selected {
    background: #2196F3;
  }
}

/* 座位图例 */
.seat-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.legend-seat {
  width: 20px;
  height: 20px;
  border-radius: 3px;

  &.available {
    background: #4CAF50;
  }

  &.selected {
    background: #2196F3;
  }

  &.occupied {
    background: #f44336;
  }
}

/* 选座信息 */
.selection-summary {
  margin-top: 30px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selected-seats-info {
  flex: 1;
}

.seat-tag {
  display: inline-block;
  padding: 4px 8px;
  background: #2196F3;
  color: white;
  border-radius: 4px;
  margin-right: 8px;
}

.total-price {
  font-size: 18px;
  margin: 0 20px;

  .price {
    color: #f56c6c;
    font-weight: bold;
  }
}

.confirm-button {
  width: 150px;
  height: 40px;
}
/* 支付方式容器：让选项横向排列 */
.payment-methods {
  display: flex;
  align-items: flex-start; /* 避免图标基线对齐的干扰 */
  gap: 40px; /* 选项之间的间距 */
}

/* 单个支付选项：强制垂直居中容器 */
.payment-option {
  display: inline-flex;
  flex-direction: column;
  align-items: center; /* 水平居中，让文字在图标正下方 */
  cursor: pointer;
  /* 隐藏原生单选框（如果需要彻底自定义） */
  .el-radio__input {
    display: none;
  }
}

/* 图标+文字的容器：确保宽高一致，文字严格居中 */
.option-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

/* 统一图标大小 */
.icon {
  font-size: 48px !important; /* 强制图标尺寸一致 */
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px; /* 图标与文字的间距 */
}

/* 文字样式：强制在图标正下方 */
.option-text {
  font-size: 14px;
  line-height: 1; /* 消除行高干扰 */
  margin: 0; /* 清除默认边距 */
}
.order-preview {
  /* 去除默认表单项的内边距限制 */
  margin-bottom: 15px;

  .preview-list {
    /* 增加容器内边距，让整体更舒展 */
    padding: 10px 0;
  }

  .preview-item {
    /* 强制每项单独占一行 */
    display: block;
    /* 增加项与项之间的垂直间距 */
    margin-bottom: 12px;
    /* 避免内容换行时拥挤 */
    line-height: 1.6;

    &:last-child {
      margin-bottom: 0; /* 最后一项去除底部间距 */
    }
  }

  .preview-label {
    /* 标签固定宽度，让内容对齐更整齐 */
    display: inline-block;
    width: 60px;
    color: #606266; /* 标签颜色稍浅，突出内容 */
  }

  .preview-value {
    color: #303133; /* 内容颜色深一点，更清晰 */
  }

  .price {
    color: #f56c6c;
    font-weight: bold;
  }
}
</style>
<!--座位表   每排一次场就生成座位表的所有座位？-->
<!--哪里存所有厅的座位呢-->