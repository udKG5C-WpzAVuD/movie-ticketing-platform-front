<script setup>
import {useUserInfoStore} from "@/stores/userInfo";
import {getSeats, getSessions, updateSeats} from "@/api/user";
import {computed, ref} from "vue";
import { defineStore } from 'pinia'
import router from "@/router";
import {ElMessage} from "element-plus";
const film = JSON.parse(sessionStorage.getItem('selectedMovie'));
const userInfoStore = useUserInfoStore();
const sessions = ref([])
const filmsessions = ref([])
const seatsfilm = ref([])
const selectedSeats = ref([])
const showSeatMap = ref(false)
const currentSession = ref(null) // 当前选中的场次
const totalprice = computed(() =>
    film.price * selectedSeatObjects.value.length
);
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
//写一个完成选购，将座位全部置为那个占用
updateSeats(selectedSeatObjects.value).then(res=>{
  ElMessage({
    message: '下单成功',
    type: 'success',
  })
//   重新渲染列表
  showseats(currentSession.value)
}).catch(error=>{
  ElMessage({
    message: '下单失败',
    type: 'error',
  })
})
}
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
          <div class="session-time">{{session.time}}</div>
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
</style>
<!--座位表   每排一次场就生成座位表的所有座位？-->
<!--哪里存所有厅的座位呢-->