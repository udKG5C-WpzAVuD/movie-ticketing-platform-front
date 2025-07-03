<script setup lang="ts">
import {ref, watch, onMounted, onBeforeUnmount} from 'vue'
import { useTransition } from '@vueuse/core'
import {DataAnalysis, VideoCameraFilled} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { ListAllFilm } from '@/api/homepage'
import { getSessions } from '@/api/user'

const movies = ref([])
const allMovies = ref(0)
const totalHeat = ref(0)
const newMovies = ref(0)
const outputValue = useTransition(totalHeat, { duration: 1500 })
const sessions = ref([])
const sessionNo = ref(0)
const chartRef1 = ref<HTMLDivElement | null>(null) // 电影类型分布（饼图）
const chartRef2 = ref<HTMLDivElement | null>(null) // 电影语言分布（玫瑰图）
const chartRef3 = ref<HTMLDivElement | null>(null) // 电影热度排行（柱状图）
const chartRef4 = ref<HTMLDivElement | null>(null) // 电影排片场次统计（雷达图）

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

    const sessionRes = await getSessions()
    sessions.value = sessionRes.data.filter(session => formatDate(session.time) >= formatDate(new Date()))
    sessionNo.value = sessions.value.length

    // 数据加载完成后初始化图表
    initGenreChart()
    initLanguageChart()
    initHeatChart()
    initSessionChart() // 修改为初始化场次统计图表
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

// 2. 电影语言分布（玫瑰图）
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
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
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
        interval: 0,
        rotate: 0,
        width: 150,
        overflow: 'truncate',
        ellipsis: '...'
      },
      inverse: true
    },
    series: [
      {
        name: '热度',
        type: 'bar',
        data: topMovies.map(movie => movie.count || 0),
        itemStyle: {
          color: '#409EFF',
          borderRadius: [0, 4, 4, 0]
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{c}'
        }
      }
    ]
  }

  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

// 4. 电影排片场次统计（雷达图）
const initSessionChart = () => {
  if (!chartRef4.value) return
  const chart = echarts.init(chartRef4.value)

  // 统计每部电影的场次数量
  const sessionMap = new Map<string, number>()
  sessions.value.forEach(session => {
    const title = session.title || '未知电影'
    sessionMap.set(title, (sessionMap.get(title) || 0) + 1)
  })

  // 转换为数组并排序，取前10部场次最多的电影
  const sessionData = Array.from(sessionMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

  // 计算最大值用于雷达图半径
  const maxValue = Math.max(...sessionData.map(([, value]) => value), 5) // 最小半径为5

  const option = {
    title: { text: '电影排片场次统计 (Top 10)', left: 'center' },
    tooltip: {
      trigger: 'item',
      formatter: params => {
        // params 是数组，取第一个元素
        const data = params.data
        let result = params.marker + ' ' + params.name + '<br/>'
        // 遍历每个指标（电影名称）和对应的值
        sessionData.forEach(([name, value], index) => {
          result += `${name}: ${data.value[index]}<br/>`
        })
        return result
      }
    },
    legend: {
      data: ['排片场次'],
      bottom: 10
    },
    radar: {
      indicator: sessionData.map(([name]) => ({ name, max: maxValue })),
      radius: '70%',
      splitNumber: 5,
      axisName: {
        color: '#333',
        fontSize: 12,
        formatter: function (value) {
          // 如果名称太长，截断显示
          return value.length > 8 ? value.substring(0, 8) + '...' : value
        }
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(255, 255, 255, 0.1)']
        }
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(0, 0, 0, 0.2)'
        }
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(0, 0, 0, 0.2)'
        }
      }
    },
    series: [
      {
        name: '排片场次',
        type: 'radar',
        symbolSize: 6,
        data: [
          {
            value: sessionData.map(([, value]) => value),
            name: '排片场次',
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(64, 158, 255, 0.6)' },
                { offset: 1, color: 'rgba(64, 158, 255, 0.2)' }
              ])
            },
            lineStyle: {
              color: '#409EFF',
              width: 2
            },
            itemStyle: {
              color: '#409EFF',
              borderColor: '#FFF',
              borderWidth: 1
            },
            label: {
              show: true,
              formatter: function (params) {
                return params.value
              },
              color: '#333',
              fontSize: 10
            }
          }
        ]
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
  getMovies()
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
          <el-statistic title="Session number" :value="sessionNo" class="bold-statistic">
            <template #suffix>
              <el-icon style="vertical-align: -0.125em">
                <DataAnalysis />
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