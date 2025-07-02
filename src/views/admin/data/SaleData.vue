<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTransition } from '@vueuse/core'
import {ChatLineRound, Upload, User} from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const allUsers = ref(268500)
const activeUsers = ref(0)
const newUsers = ref(138)
const outputValue = useTransition(activeUsers, { duration: 1500 })
const feedBacks = ref(562)
const chartRef = ref<HTMLDivElement | null>(null)

// 初始化 ECharts
const initChart = () => {
  if (!chartRef.value) return

  // 销毁旧图表（避免重复初始化）
  const existingChart = echarts.getInstanceByDom(chartRef.value)
  if (existingChart) {
    existingChart.dispose()
  }

  // 初始化新图表
  const myChart = echarts.init(chartRef.value)
  const option = {
    title: { text: 'ECharts示例' },
    tooltip: {},
    legend: { data: ['销量'] },
    xAxis: { data: ["衬衫", "羊毛衫", "雪纺衫", "裤子", "高跟鞋", "袜子"] },
    yAxis: {},
    series: [{ name: '销量', type: 'bar', data: [5, 20, 36, 10, 10, 20] }],
  }
  myChart.setOption(option)

  // 响应式调整大小
  const resizeHandler = () => myChart.resize()
  window.addEventListener('resize', resizeHandler)

  // 返回清理函数
  return () => {
    window.removeEventListener('resize', resizeHandler)
    myChart.dispose()
  }
}

// 监听 chartRef 的变化（确保 DOM 已渲染）
const cleanup = ref<(() => void) | null>(null)
watch(chartRef, (newVal) => {
  if (newVal) {
    cleanup.value = initChart()
  } else if (cleanup.value) {
    cleanup.value() // 清理旧图表
  }
}, { immediate: true })

// 触发过渡动画
activeUsers.value = 172000
</script>

<template>
  <div>
    <div class="header">
      <el-card style="margin-bottom: 10px">
        <el-row gutter="950">
          <el-col span="18"><div><span>销售数据</span></div></el-col>
        </el-row>
      </el-card>
    </div>
    <el-card style="margin-bottom: 10px">
      <el-row>
        <el-col :span="6">
          <el-statistic title="Total users" :value="allUsers" class="bold-statistic"/>
        </el-col>
        <el-col :span="6">
          <el-statistic :value="newUsers" class="bold-statistic">
            <template #title>
              <el-badge value="new" class="item">
                <div style="display: inline-flex; align-items: center">
                  Today's new users
                </div>
              </el-badge>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="Daily active users" :value="outputValue" :transition="true" class="bold-statistic"/>
        </el-col>
        <el-col :span="6">
          <el-statistic title="Feedback number" :value="feedBacks" class="bold-statistic">
            <template #suffix>
              <el-icon style="vertical-align: -0.125em">
                <ChatLineRound />
              </el-icon>
            </template>
          </el-statistic>
        </el-col>
      </el-row>
    </el-card>

    <!-- 确保容器有明确尺寸 -->
    <el-card style="margin-bottom: 10px">
      <div class="echarts-wrapper">
        <div ref="chartRef" style="width: 100%; height: 400px;"></div>
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.header{
  width: 100%;
}

.el-col {
  text-align: center;
}

.echarts-wrapper {
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
}

.bold-statistic {
  :deep(.el-statistic__head),
  :deep(.el-statistic__content) {
    font-weight: bold;
  }
}
</style>