<script setup lang="ts">
import { onMounted, ref, nextTick } from 'vue'
import { useTransition } from '@vueuse/core'
import {Failed, Money, WalletFilled} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getOrders, getUserById } from '@/api/user'

// 订单数据
const orders = ref([]) // 包含所有分页的订单数据
const allOrders = ref(0) // 订单总数
const dailyIncome = ref(0) // 今日收入
const newOrders = ref(0) // 今日新增订单数
const cancelledOrders = ref(0) // 今日取消订单数
const outputValue = useTransition(dailyIncome, { duration: 1500 })

// 图表引用
const chartRef1 = ref<HTMLDivElement | null>(null)
const chartRef2 = ref<HTMLDivElement | null>(null)
const chartRef3 = ref<HTMLDivElement | null>(null)
const chartRef4 = ref<HTMLDivElement | null>(null)

// 用户信息缓存
const userCache = ref<Record<number, string>>({})

// 获取所有订单数据（所有分页）
const fetchAllOrders = async () => {
  let currentPage = 1
  let allData = []
  let total = 0

  while (true) {
    const res = await getOrders({
      pageNum: currentPage,
      pageSize: 10,
      orderNo: '',
      total: 0
    })

    if (res.data && res.data.records) {
      allData = allData.concat(res.data.records)
      total = res.data.total

      // 如果已经获取所有数据，则退出循环
      if (allData.length >= total) {
        break
      }
      currentPage++
    } else {
      break
    }
  }

  return { records: allData, total }
}

// 计算今日统计数据（基于所有订单数据）
const calculateDailyStats = (data) => {
  const today = new Date().toISOString().split('T')[0]
  let todayTotal = 0
  let todayCount = 0
  let todayCancelled = 0

  data.forEach(order => {
    // 计算今日收入（所有订单中今天付款的订单总金额）
    if (order.paymentTime) {
      const paymentDate = order.paymentTime.split('T')[0]
      if (paymentDate === today) {
        todayTotal += order.totalAmount
      }
    }

    // 计算今日新增订单数（所有订单中今天创建的订单数）
    if (order.createTime) {
      const createDate = order.createTime.split('T')[0]
      if (createDate === today) {
        todayCount++
        // 计算今日取消订单数（今天创建且状态为2的订单数）
        if (order.orderStatus === 2) {
          todayCancelled++
        }
      }
    }
  })

  return {
    dailyIncome: parseFloat(todayTotal.toFixed(2)),
    newOrders: todayCount,
    cancelledOrders: todayCancelled
  }
}

// 获取近一个月的日期范围
const getLastMonthDateRange = () => {
  const today = new Date()
  const endDate = new Date(today)

  // 计算上个月的同一天，如果上个月没有这一天，则使用最后一天
  const startDate = new Date(today)
  startDate.setMonth(startDate.getMonth() - 1)
  if (startDate.getDate() > today.getDate()) {
    startDate.setDate(0) // 设置为上个月的最后一天
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  }
}

// 获取用户名
const fetchUserName = async (userId: number) => {
  if (userCache.value[userId]) {
    return userCache.value[userId]
  }

  try {
    const res = await getUserById(userId)
    if (res.data && res.data.username) {
      userCache.value[userId] = res.data.username
      return res.data.username
    }
  } catch (error) {
    console.error('Failed to fetch user info:', error)
  }

  return `用户${userId}` // 如果获取失败，使用默认值
}

// 获取订单数据
const fetchOrders = async () => {
  try {
    const result = await fetchAllOrders()
    orders.value = result.records // 所有分页的订单数据
    allOrders.value = result.total // 订单总数

    // 计算今日统计数据（基于所有订单数据）
    const dailyStats = calculateDailyStats(result.records)
    dailyIncome.value = dailyStats.dailyIncome
    newOrders.value = dailyStats.newOrders
    cancelledOrders.value = dailyStats.cancelledOrders

    // 初始化所有图表
    nextTick(() => {
      initOrderStatusChart()
      initOrderTimeDistributionChart()
      initDailyTrendChart()
      initUserOrderTrendChart()
    })
  } catch (error) {
    console.error('Failed to fetch orders:', error)
  }
}

// 初始化订单状态图表（圆环图）
const initOrderStatusChart = () => {
  if (!chartRef1.value) return

  const chart = echarts.init(chartRef1.value)

  // 统计各状态订单数量（所有订单数据）
  const statusCount = orders.value.reduce((acc, order) => {
    acc[order.orderStatus] = (acc[order.orderStatus] || 0) + 1
    return acc
  }, {})

  const statusMap = {
    0: '待支付',
    1: '已支付',
    2: '已取消',
    3: '已退款'
  }

  const option = {
    title: {
      text: '订单状态分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 10,
      data: Object.values(statusMap)
    },
    series: [
      {
        name: '订单状态',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: Object.keys(statusCount).map(key => ({
          value: statusCount[key],
          name: statusMap[key]
        }))
      }
    ]
  }

  chart.setOption(option)

  const resizeHandler = () => chart.resize()
  window.addEventListener('resize', resizeHandler)

  return () => {
    window.removeEventListener('resize', resizeHandler)
    chart.dispose()
  }
}

// 初始化订单状态时间分布图表（柱状图）
const initOrderTimeDistributionChart = () => {
  if (!chartRef2.value) return

  const chart = echarts.init(chartRef2.value)

  // 统计一天中各小时段的订单数量
  const hourMap = {}
  for (let i = 0; i < 24; i++) {
    hourMap[i] = 0
  }

  orders.value.forEach(order => {
    if (order.createTime) {
      const hour = new Date(order.createTime).getHours()
      hourMap[hour]++
    }
  })

  const option = {
    title: {
      text: '订单时间分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 24 }, (_, i) => `${i}:00-${i + 1}:00`),
      axisLabel: {
        interval: 0,
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '订单数量'
    },
    series: [
      {
        name: '订单数量',
        type: 'bar',
        data: Object.values(hourMap),
        itemStyle: {
          color: '#5470C6'
        }
      }
    ]
  }

  chart.setOption(option)

  const resizeHandler = () => chart.resize()
  window.addEventListener('resize', resizeHandler)

  return () => {
    window.removeEventListener('resize', resizeHandler)
    chart.dispose()
  }
}

// 初始化近一个月每日趋势图表（柱状+折线图）
const initDailyTrendChart = () => {
  if (!chartRef3.value) return

  const chart = echarts.init(chartRef3.value)

  // 获取近一个月的日期范围
  const { startDate, endDate } = getLastMonthDateRange()

  // 按日期统计订单数量和金额（只统计近一个月）
  const dateMap = {}
  orders.value.forEach(order => {
    if (order.createTime) {
      const date = order.createTime.split('T')[0]
      // 只统计近一个月的数据
      if (date >= startDate && date <= endDate) {
        if (!dateMap[date]) {
          dateMap[date] = { count: 0, amount: 0 }
        }
        dateMap[date].count++
        if (order.orderStatus === 1 && order.paymentTime) {
          dateMap[date].amount += order.totalAmount
        }
      }
    }
  })

  // 转换为数组并排序
  const dates = Object.keys(dateMap).sort()
  const countData = dates.map(date => dateMap[date].count)
  const amountData = dates.map(date => parseFloat(dateMap[date].amount.toFixed(2)))

  const option = {
    title: {
      text: '近一个月订单趋势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      }
    },
    legend: {
      data: ['订单数量', '订单金额'],
      top: 30
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        start: 0,
        end: 100
      }
    ],
    xAxis: [
      {
        type: 'category',
        data: dates,
        axisPointer: {
          type: 'shadow'
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: '订单数量',
        min: 0,
        axisLabel: {
          formatter: '{value}'
        }
      },
      {
        type: 'value',
        name: '订单金额',
        min: 0,
        axisLabel: {
          formatter: '¥{value}'
        }
      }
    ],
    series: [
      {
        name: '订单数量',
        type: 'bar',
        data: countData,
        itemStyle: {
          color: '#5470C6'
        }
      },
      {
        name: '订单金额',
        type: 'line',
        yAxisIndex: 1,
        data: amountData,
        itemStyle: {
          color: '#91CC75'
        },
        smooth: true
      }
    ]
  }

  chart.setOption(option)

  const resizeHandler = () => chart.resize()
  window.addEventListener('resize', resizeHandler)

  return () => {
    window.removeEventListener('resize', resizeHandler)
    chart.dispose()
  }
}

// 初始化近一个月Top5用户消费趋势图表（堆叠面积图）
const initUserOrderTrendChart = async () => {
  if (!chartRef4.value) return

  const chart = echarts.init(chartRef4.value)

  // 获取近一个月的日期范围
  const { startDate, endDate } = getLastMonthDateRange()

  // 统计每个用户每天的消费金额（只统计近一个月）
  const userDailyData: Record<number, Record<string, number>> = {}
  orders.value.forEach(order => {
    if (order.createTime && order.paymentTime && order.orderStatus === 1) {
      const date = order.createTime.split('T')[0]
      // 只统计近一个月且已支付的订单
      if (date >= startDate && date <= endDate) {
        if (!userDailyData[order.userId]) {
          userDailyData[order.userId] = {}
        }

        if (!userDailyData[order.userId][date]) {
          userDailyData[order.userId][date] = 0
        }
        userDailyData[order.userId][date] += order.totalAmount
      }
    }
  })

  // 计算每个用户的总消费金额并找出Top5用户
  const userTotals = Object.keys(userDailyData).map(userId => {
    const total = Object.values(userDailyData[parseInt(userId)]).reduce((sum, amount) => sum + amount, 0)
    return {
      userId: parseInt(userId),
      total: parseFloat(total.toFixed(2))
    }
  }).sort((a, b) => b.total - a.total).slice(0, 5)

  // 获取Top5用户的用户名
  const usernamePromises = userTotals.map(async user => {
    const username = await fetchUserName(user.userId)
    return {
      ...user,
      username
    }
  })

  const usersWithNames = await Promise.all(usernamePromises)

  // 准备数据
  const series = []
  const legendData = []
  const datesSet = new Set<string>()

  // 使用更专业的配色方案（带透明度以便堆叠显示）
  const colors = ['rgba(84, 112, 198, 0.6)', 'rgba(145, 204, 117, 0.6)', 'rgba(238, 102, 102, 0.6)',
    'rgba(250, 200, 88, 0.6)', 'rgba(115, 192, 222, 0.6)']
  const borderColors = ['#5470C6', '#91CC75', '#EE6666', '#FAC858', '#73C0DE']

  // 先收集所有日期
  usersWithNames.forEach(user => {
    const userId = user.userId
    const dailyData = userDailyData[userId] || {}
    Object.keys(dailyData).forEach(date => {
      if (date >= startDate && date <= endDate) {
        datesSet.add(date)
      }
    })
  })
  const allDates = Array.from(datesSet).sort()

  // 为每个用户准备数据系列
  usersWithNames.forEach((user, index) => {
    const userId = user.userId
    const dailyData = userDailyData[userId] || {}
    const username = user.username
    legendData.push(username)

    // 确保每个日期都有值（没有的日期补0）
    const data = allDates.map(date => {
      return dailyData[date] || 0
    })

    series.push({
      name: username,
      type: 'line',
      stack: 'total',  // 关键设置：使用相同的stack值实现堆叠
      areaStyle: {
        color: colors[index]
      },
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      data: data.map(value => parseFloat(value.toFixed(2))),
      lineStyle: {
        width: 2,
        color: borderColors[index]
      },
      itemStyle: {
        color: borderColors[index],
        borderColor: '#fff',
        borderWidth: 1
      },
      emphasis: {
        focus: 'series',
        lineStyle: {
          width: 3
        }
      },
      label: {
        show: false,
        position: 'top'
      }
    })
  })

  const option = {
    title: {
      text: '近一个月Top5用户消费趋势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      },
      formatter: params => {
        let result = `${params[0].axisValue}<br/>`
        let total = 0
        params.forEach(param => {
          const value = param.value as number
          result += `${param.marker} ${param.seriesName}: ¥${value.toFixed(2)}<br/>`
          total += value
        })
        result += `总计: ¥${total.toFixed(2)}`
        return result
      }
    },
    legend: {
      data: legendData,
      top: 30,
      textStyle: {
        fontSize: 12
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
      top: '15%'
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: allDates,
      axisLabel: {
        formatter: value => {
          const d = new Date(value)
          // 根据数据量调整显示格式
          if (allDates.length > 15) {
            return `${d.getMonth() + 1}/${d.getDate()}`
          }
          return `${d.getMonth() + 1}/${d.getDate()}`
        },
        rotate: allDates.length > 7 ? 45 : 0
      }
    },
    yAxis: {
      type: 'value',
      name: '消费金额(元)',
      axisLabel: {
        formatter: '¥{value}'
      },
      splitLine: {
        lineStyle: {
          type: 'dashed'
        }
      }
    },
    series,
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: allDates.length > 15 ? 30 : 100
      },
      {
        start: 0,
        end: allDates.length > 15 ? 30 : 100
      }
    ]
  }

  chart.setOption(option)

  const resizeHandler = () => chart.resize()
  window.addEventListener('resize', resizeHandler)

  return () => {
    window.removeEventListener('resize', resizeHandler)
    chart.dispose()
  }
}

onMounted(() => {
  fetchOrders()
})
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
      <el-row :gutter="20">
        <el-col :span="6">
          <el-badge value="hot" class="item">
            <el-statistic title="Total orders" :value="allOrders" class="bold-statistic"/>
          </el-badge>
        </el-col>
        <el-col :span="6">
          <el-statistic :value="newOrders" class="bold-statistic">
            <template #title>
              <el-badge value="new" class="item">
                <div style="display: inline-flex; align-items: center">
                  Today's new orders
                </div>
              </el-badge>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic
              :value="outputValue"
              :transition="true"
              class="bold-statistic">
            <template #title>
              <div style="display: inline-flex; align-items: center; gap: 4px">
                <span>Daily income</span>
                <el-icon style="vertical-align: -0.125em">
                  <WalletFilled />
                </el-icon>
              </div>
            </template>
            <template #suffix>
              <el-icon style="vertical-align: -0.125em">
                <Money />
              </el-icon>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="Cancelled orders" :value="cancelledOrders" class="bold-statistic">
            <template #suffix>
              <el-icon style="vertical-align: -0.125em">
                <Failed />
              </el-icon>
            </template>
          </el-statistic>
        </el-col>
      </el-row>
    </el-card>

    <!-- 图表区域 -->
    <el-row :gutter="20" style="margin-bottom: 20px">
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

    <el-row :gutter="20">
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

.echarts-wrapper {
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
}
</style>