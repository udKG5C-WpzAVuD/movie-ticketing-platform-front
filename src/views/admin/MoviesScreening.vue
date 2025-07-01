<template>
  <div class="schedule-container">
    <div class="controls">
      <el-select v-model="selectedHall" placeholder="选择影厅" @change="fetchSessions">
        <el-option
            v-for="hall in [1, 2, 3]"
            :key="hall"
            :label="`${hall}号厅`"
            :value="hall"
        />
      </el-select>

      <el-date-picker
          v-model="selectedDate"
          type="date"
          placeholder="选择日期"
          :disabled-date="disabledDate"
          @change="fetchSessions"
          value-format="YYYY-MM-DD"
      />
    </div>

    <div class="schedule-display">
      <h3>{{ scheduleTitle }}</h3>

      <div v-if="filteredSessions.length > 0" class="time-slots">
        <div
            v-for="session in filteredSessions"
            :key="`${session.tingnum}-${session.time}`"
            class="time-slot"
        >
          <div class="slot-content">
            <div class="time">{{ formatTime(session.time) }}</div>
            <div class="movie-title">{{ session.title }}</div>
          </div>
          <el-button
              type="danger"
              size="small"
              @click="handleDelete(session)"
              class="delete-btn"
          >
            删除
          </el-button>
        </div>
      </div>

      <div v-else class="empty-tip">
        该影厅当日没有排片
      </div>
    </div>
  </div>

  <el-dialog   v-model="deleteVisible" title="Tips" width="500">
    <div><p>是否确定要删除（删除操作不可逆）</p></div>
    <el-button @click="updatedeleteVisible">取消</el-button>
    <el-button @click="deleteMovies">确定</el-button>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import {addLogs, deletescreen, getSessions} from "@/api/user";
import {ElMessage, ElMessageBox} from 'element-plus'
import {useUserInfoStore} from "@/stores/userInfo";
const movie_logs=ref({
  title:"",
  operationType:"",
  operationTargetId:1,//设定为1  以后会改
  operationTargetType:"电影"
})
const userInfoStore = useUserInfoStore();
const uid = userInfoStore.userInfo?.id;
const deleteVisible=ref(false)
const sessionscreen=ref({
  time:'',
  title:'',
  tingnum:'',
  id:''
})
const handleDelete=(session)=>{
  console.log(session)
  deleteVisible.value=true
  sessionscreen.value=session
}
const updatedeleteVisible=()=>{
  deleteVisible.value=false
}
const deleteMovies=()=>{
  movie_logs.value.title=sessionscreen.value.title
  deletescreen(sessionscreen.value).then(res=>{
    console.log("需要删除的数据",sessionscreen.value)
    ElMessage({
      message: '删除成功',
      type: 'success',
    })

    movie_logs.value.operationType="删除此电影排期"
    movie_logs.value.operationTargetId=uid
    console.log("日志输出",movie_logs.value)
    // 以后写一个关于操作员id
    addLogs(movie_logs.value).then(res=>{

    })
    fetchSessions()
  })
  updatedeleteVisible()

}
// 选择器数据
const selectedHall = ref(1)
const selectedDate = ref(dayjs().format('YYYY-MM-DD'))
const allSessions = ref([])

// 禁用过去的日期
const disabledDate = (date) => {
  return date < new Date(new Date().setHours(0, 0, 0, 0))
}

// 获取排片数据
const fetchSessions = () => {
  getSessions()
      .then(response => {
        allSessions.value = response.data?.map(item => ({
          ...item,
          time: item.time.replace('T', ' ') // 统一时间格式
        })) || []
      })
      .catch(error => {
        console.error('获取排片失败:', error)
        allSessions.value = []
      })
}

// 根据选择的厅号和日期筛选排片
const filteredSessions = computed(() => {
  if (!selectedDate.value || !selectedHall.value) return []

  return allSessions.value
      .filter(session => {
        const sessionDate = dayjs(session.time).format('YYYY-MM-DD')
        return (
            sessionDate === selectedDate.value &&
            session.tingnum === selectedHall.value
        )
      })
      .sort((a, b) => new Date(a.time) - new Date(b.time))
})

// 格式化时间显示
const formatTime = (timeStr) => {
  return dayjs(timeStr).format('HH:mm')
}

// 排期标题
const scheduleTitle = computed(() => {
  const dateStr = dayjs(selectedDate.value).format('YYYY年MM月DD日')
  return `${dateStr} ${selectedHall.value}号厅排片表`
})



onMounted(() => {
  fetchSessions()
})
</script>

<style scoped>
.schedule-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.controls {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.schedule-display {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.schedule-display h3 {
  margin-top: 0;
  color: #333;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.time-slots {
  display: grid;
  gap: 12px;
}

.time-slot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 6px;
  background: #f8f9fa;
}

.slot-content {
  flex: 1;
  display: flex;
  align-items: center;
}

.time-slot .time {
  font-weight: bold;
  width: 80px;
  color: #409eff;
}

.time-slot .movie-title {
  flex: 1;
}

.delete-btn {
  margin-left: 10px;
}

.empty-tip {
  color: #999;
  text-align: center;
  padding: 20px;
}
</style>