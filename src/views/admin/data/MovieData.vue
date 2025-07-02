<script setup lang="ts">
import {ref, watch, onMounted, onBeforeUnmount} from 'vue'
import { useTransition } from '@vueuse/core'
import {ChatLineRound, VideoCameraFilled} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { ListAllFilm } from '@/api/homepage'

const movies = ref([])
const allMovies = ref(0)
const totalHeat = ref(0)
const newMovies = ref(0)
const outputValue = useTransition(totalHeat, { duration: 1500 })
const feedBacks = ref(562)
const chartRef1 = ref<HTMLDivElement | null>(null) // 电影类型分布（饼图）
const chartRef2 = ref<HTMLDivElement | null>(null) // 电影语言分布（玫瑰图）
const chartRef3 = ref<HTMLDivElement | null>(null) // 电影热度排行（柱状图）
const chartRef4 = ref<HTMLDivElement | null>(null) // 导演电影数量统计（柱状图）

// 格式化日期为 YYYY-MM-DD
const formatDate = (date: string | Date) => {
  const d = new Date(date)
  if (isNaN(d.getTime())) {
    console.error("Invalid date:", date)
    return "1970-01-01"
  }
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 获取电影数据
const getMovies = async () => {
  try {
    const res = await ListAllFilm()
    movies.value = res.data
    allMovies.value = movies.value.length
    newMovies.value = movies.value.filter(movie =>
        formatDate(movie.releaseDate) === formatDate(new Date())
    ).length
    totalHeat.value = movies.value.reduce((sum, movie) => sum + (movie.count || 0), 0)

    // 数据加载完成后初始化图表
    initGenreChart()
    initLanguageChart()
    initHeatChart()
    initDirectorChart()
  } catch (err) {
    console.error("Failed to fetch movies:", err)
  }
}

// 1. 电影类型分布（饼图）
const initGenreChart = () => {
  if (!chartRef1.value) return
  const chart = echarts.init(chartRef1.value)

  // 统计每个类型的电影数量
  const genreMap = new Map<string, number>()
  movies.value.forEach(movie => {
    const genres = movie.genre.split(/[\/,]/) // 分割类型
    genres.forEach(genre => {
      const trimmedGenre = genre.trim() // 去除前后空格
      genreMap.set(trimmedGenre, (genreMap.get(trimmedGenre) || 0) + 1)
    })
  })

  const option = {
    title: { text: '电影类型分布', left: 'center' },
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '电影类型',
        type: 'pie',
        radius: '50%',
        data: Array.from(genreMap.entries()).map(([name, value]) => ({ name, value })),
        emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
      }
    ]
  }

  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

// 新增：2. 电影语言分布（玫瑰图）
const initLanguageChart = () => {
  if (!chartRef2.value) return
  const chart = echarts.init(chartRef2.value)

  const languageMap = new Map<string, number>()
  movies.value.forEach(movie => {
    const languages = movie.language.split(/[\/,]/) // 分割语言
    languages.forEach(language => {
      const trimmedLanguage = language.trim() // 去除前后空格
      if (trimmedLanguage) { // 确保不是空字符串
        languageMap.set(trimmedLanguage, (languageMap.get(trimmedLanguage) || 0) + 1)
      }
    })
  })

  const option = {
    title: { text: '电影语言分布', left: 'center' },
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '电影语言',
        type: 'pie',
        radius: ['30%', '70%'],
        center: ['50%', '50%'],
        roseType: 'radius',
        itemStyle: {
          borderRadius: 5
        },
        label: {
          show: true,
          formatter: '{d}%'
        },
        emphasis: {
          label: {
            show: true
          }
        },
        data: Array.from(languageMap.entries()).map(([name, value]) => ({ name, value })),
      }
    ]
  }

  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

// 3. 电影热度排行（柱状图）
const initHeatChart = () => {
  if (!chartRef3.value) return
  const chart = echarts.init(chartRef3.value)

  // 按热度排序的电影 Top 10（从高到低）
  const topMovies = [...movies.value]
      .sort((a, b) => (b.count || 0) - (a.count || 0)) // 降序排序
      .slice(0, 10)

  const option = {
    title: { text: '电影热度排行 (Top 10)', left: 'center' },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: '{b}<br/>热度: {c}'
    },
    grid: {
      left: '3%',      // 调整左边距
      right: '4%',     // 调整右边距
      bottom: '3%',    // 调整下边距
      containLabel: true // 确保标签显示完整
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}'
      }
    },
    yAxis: {
      type: 'category',
      data: topMovies.map(movie => movie.title),
      axisLabel: {
        interval: 0,    // 强制显示所有标签
        rotate: 0,      // 不旋转
        width: 150,     // 增加标签宽度
        overflow: 'truncate', // 超出部分截断
        ellipsis: '...' // 超出显示省略号
      },
      inverse: true     // 热度最高的在最上面
    },
    series: [
      {
        name: '热度',
        type: 'bar',
        data: topMovies.map(movie => movie.count || 0),
        itemStyle: {
          color: '#409EFF',
          borderRadius: [0, 4, 4, 0] // 圆角效果
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{c}' // 在柱子右侧显示具体数值
        }
      }
    ]
  }

  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

// 4. 导演电影数量统计（柱状图）
const initDirectorChart = () => {
  if (!chartRef4.value) return
  const chart = echarts.init(chartRef4.value)

  // 统计每个导演的电影数量（取前 10）
  const directorMap = new Map<string, number>()
  movies.value.forEach(movie => {
    const director = movie.director.trim()
    directorMap.set(director, (directorMap.get(director) || 0) + 1)
  })

  const topDirectors = Array.from(directorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

  const option = {
    title: { text: '导演电影数量 (Top 10)', left: 'center' },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: { type: 'value' },
    yAxis: {
      type: 'category',
      data: topDirectors.map(([name]) => name),
      axisLabel: { interval: 0, rotate: 0 }
    },
    series: [
      {
        name: '电影数量',
        type: 'bar',
        data: topDirectors.map(([, value]) => value),
        itemStyle: { color: '#67C23A' }
      }
    ]
  }

  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

// 事件监听处理
const handleResize = () => {
  [chartRef1, chartRef2, chartRef3, chartRef4].forEach(chartRef => {
    if (chartRef.value) {
      const chart = echarts.getInstanceByDom(chartRef.value)
      if (chart) chart.resize()
    }
  })
}

// 清理图表
const cleanupCharts = () => {
  const charts = [chartRef1, chartRef2, chartRef3, chartRef4]
  charts.forEach(chartRef => {
    if (chartRef.value) {
      const chart = echarts.getInstanceByDom(chartRef.value)
      if (chart) chart.dispose()
    }
  })
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  getMovies() // 在这里调用获取数据
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  cleanupCharts()
})
</script>

<template>
  <div>
    <div class="header">
      <el-card style="margin-bottom: 10px">
        <el-row gutter="950">
          <el-col span="18"><div><span>电影数据</span></div></el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 统计卡片 -->
    <el-card style="margin-bottom: 10px">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-statistic :value="allMovies" class="bold-statistic">
            <template #title>
              Total movies <el-icon><VideoCameraFilled /></el-icon>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic :value="newMovies" class="bold-statistic">
            <template #title>
              <el-badge value="new" class="item">
                <div style="display: inline-flex; align-items: center">
                  Today's new movies
                </div>
              </el-badge>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-badge value="hot" class="item">
            <el-statistic title="Sum of movie heat" :value="outputValue" :transition="true" class="bold-statistic"/>
          </el-badge>
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

    <!-- 图表区域 -->
    <el-row :gutter="10" style="margin-bottom: 10px">
      <el-col :span="12">
        <el-card>
          <div ref="chartRef1" style="width: 100%; height: 400px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <div ref="chartRef2" style="width: 100%; height: 400px;"></div>
        </el-card>
      </el-col>
    </el-row>
    <el-row :gutter="10" style="margin-bottom: 10px">
      <el-col :span="12">
        <el-card>
          <div ref="chartRef3" style="width: 100%; height: 400px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <div ref="chartRef4" style="width: 100%; height: 400px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.header {
  width: 100%;
}

.el-col {
  text-align: center;
}
.bold-statistic {
  :deep(.el-statistic__head),
  :deep(.el-statistic__content) {
    font-weight: bold;
  }
}
</style>