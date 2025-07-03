<template>
  <div style="height: 100%; box-shadow: var(--el-border-color-light) 0px 0px 10px">
    <div class="header">
      <span>数据导出与运营报告</span>
    </div>
    <hr />
    <el-splitter layout="vertical">
      <el-splitter-panel>
        <!-- 数据导出部分，保持不变 -->
        <div class="demo-panel">
          <p>温馨提示：请选择下方的导出类型和格式进行数据导出操作。</p>
          <p>大型数据导出可能需要一些时间，请耐心等待。</p>
          <div class="export-filters">
            <el-form :inline="true">
              <el-form-item label="导出数据类型">
                <el-select
                    v-model="exportType"
                    placeholder="请选择数据类型"
                    style="width: 240px"
                    clearable
                >
                  <el-option
                      v-for="item in exportTypeOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="导出格式">
                <el-select
                    v-model="exportFormat"
                    placeholder="请选择导出格式"
                    style="width: 240px"
                    clearable
                >
                  <el-option
                      v-for="item in exportFormatOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                  />
                </el-select>
              </el-form-item>

              <el-form-item>
                <el-button
                    type="primary"
                    @click="handleExport"
                    :disabled="!exportType || !exportFormat"
                >
                  导出数据
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </el-splitter-panel>
      <el-splitter-panel>
        <!-- 运营报告部分 -->
        <div class="demo-panel">
          <p>运营报告</p>
          <el-form :inline="true">
            <el-form-item label="报告类型">
              <el-select v-model="reportType" placeholder="选择报告类型" @change="handleReportTypeChange" style="width: 150px;">
                <el-option label="日报" value="daily" />
                <el-option label="周报" value="weekly" />
                <el-option label="月报" value="monthly" />
              </el-select>
            </el-form-item>

            <el-form-item label="选择时间">
              <el-date-picker
                  v-model="reportDate"
                  type="date"
                  placeholder="选择日期"
                  :disabled="reportType !== 'daily' && reportType !== 'weekly' && reportType !== 'monthly'"
                  value-format="YYYY-MM-DD"
                  @change="handleDateChange"
              />
            </el-form-item>
          </el-form>

          <div v-if="reportData">
            <h3>{{ reportTitle }}</h3>
            <p>时间范围：{{ reportTimeRange }}</p>
            <p>报告类型：{{ reportTypeLabel }}</p>

            <h4>核心数据</h4>
            <ul>
              <li>新注册用户：{{ reportData.newUserCount }}</li>
              <li>订单总量：{{ reportData.orderCount }}</li>
              <li>总票房：{{ reportData.totalRevenue *100}}</li>
              <li>上架电影总数：{{ reportData.movieCount }}</li>
            </ul>

            <div v-if="reportType !== 'daily' && reportOptions">
              <h4>可视化视图</h4>
              <div id="reportChart" style="width: 100%; height: 400px;"></div>
            </div>

            <el-button type="success" @click="downloadReport" :loading="downloading">下载PDF报告</el-button>
          </div>
        </div>
      </el-splitter-panel>
    </el-splitter>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';
import * as echarts from 'echarts';
import moment from 'moment'; // 引入 Moment.js

// 导出数据类型选项
const exportTypeOptions = [
  { value: 'user', label: '用户信息' },
  { value: 'order', label: '订单详情' },
  { value: 'movie', label: '电影信息' }
]
// 导出格式选项
const exportFormatOptions = [
  { value: 'excel', label: 'Excel' },
  { value: 'csv', label: 'CSV' }
]
// 选中的值
const exportType = ref('')
const exportFormat = ref('')

// 后端 API 基础 URL
const BASE_URL = 'http://localhost:8080' // 替换为你的后端地址和端口

// 处理导出
const handleExport = async () => {
  if (!exportType.value || !exportFormat.value) {
    ElMessage.warning('请选择数据类型和导出格式')
    return
  }

  ElMessage.info(`正在导出 ${getTypeLabel(exportType.value)}，格式为 ${getFormatLabel(exportFormat.value)}...`)

  try {
    const response = await axios({
      method: 'get',
      url: `${BASE_URL}/export`,
      params: {
        exportType: exportType.value,
        exportFormat: exportFormat.value
      },
      responseType: 'blob' // 关键：将响应类型设置为 blob，表示文件下载
    })

    if (response.data.size === 0) {
      ElMessage.warning('没有数据可供导出！')
      return;
    }

    const disposition = response.headers['content-disposition'];
    let fileName = 'download';
    if (disposition && disposition.indexOf('attachment') !== -1) {
      const filenameRegex = /filename[^;=\n]*=((utf-8)['"]*[^;\n]*['"]*|[^;\n]*)/;
      const matches = filenameRegex.exec(disposition);
      if (matches != null && matches[1]) {
        fileName = decodeURIComponent(matches[1].replace(/['"]/g, ''));
      }
    }


    // 创建一个 Blob 对象，表示文件数据
    const blob = new Blob([response.data], { type: response.headers['content-type'] })

    // 创建一个<a>标签用于下载
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = fileName // 设置下载文件的名称
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href) // 释放 URL 对象

    ElMessage.success('数据导出成功！')

  } catch (error) {
    console.error('导出失败:', error)
    if (error.response && error.response.data) {
      // 如果后端返回了错误信息，尝试解析并显示
      try {
        const errorBlob = new Blob([error.response.data], { type: 'application/json' });
        const reader = new FileReader();
        reader.onload = function() {
          const errorJson = JSON.parse(reader.result);
          ElMessage.error(`导出失败: ${errorJson.message || error.response.statusText}`);
        };
        reader.readAsText(errorBlob);
      } catch (parseError) {
        ElMessage.error(`导出失败: ${error.response.statusText || error.message}`);
      }
    } else {
      ElMessage.error('数据导出失败，请检查网络或联系管理员。');
    }
  }
}

// 获取数据类型标签
const getTypeLabel = (value) => {
  const item = exportTypeOptions.find(item => item.value === value)
  return item ? item.label : ''
}
// 获取格式标签
const getFormatLabel = (value) => {
  const item = exportFormatOptions.find(item => item.value === value)
  return item ? item.label : ''
}


// -------------------- 运营报告相关 --------------------
const reportType = ref('');
const reportDate = ref('');
const reportData = ref(null);
const reportOptions = ref(null);
const downloading = ref(false);

const reportTitle = ref('');
const reportTimeRange = ref('');
const reportTypeLabel = ref('');

// 报告类型改变时
const handleReportTypeChange = () => {
  reportDate.value = ''; // 清空日期
  reportData.value = null;
  reportOptions.value = null;
  reportTitle.value = '';
  reportTimeRange.value = '';
  reportTypeLabel.value = '';
};

// 日期选择更改时
const handleDateChange = (date) => {
  reportData.value = null;
  reportOptions.value = null;
  const selectedDate = moment(date); // 使用 moment 处理日期
  let startDate = date;
  let endDate = date;

  if (reportType.value === 'weekly') {
    startDate = selectedDate.startOf('isoWeek').format('YYYY-MM-DD'); // 获取 ISO 周的开始日期
    endDate = selectedDate.endOf('isoWeek').format('YYYY-MM-DD');  // 获取 ISO 周的结束日期
    reportTitle.value = `${startDate}至${endDate}运营周报`;
    reportTimeRange.value =  `${startDate}——${endDate}`;
    reportTypeLabel.value =  "周报";

  } else if (reportType.value === 'monthly') {
    startDate = selectedDate.startOf('month').format('YYYY-MM-DD');
    endDate = selectedDate.endOf('month').format('YYYY-MM-DD');
    reportTitle.value =  `${selectedDate.format('YYYY年MM月')}运营月报`;
    reportTimeRange.value =  `${startDate}——${endDate}`;
    reportTypeLabel.value =  "月报";

  } else {
    reportTitle.value =  `${selectedDate.format('YYYY-MM-DD')}运营日报`;
    reportTimeRange.value =  `${selectedDate.format('YYYY-MM-DD')}`;
    reportTypeLabel.value =  "日报";
  }
  generateReport(startDate, endDate);
};



// 生成报告
const generateReport = async (startDate, endDate) => {
  if (!reportType.value) {
    ElMessage.warning('请选择报告类型');
    return;
  }
  if (!startDate || !endDate) {
    ElMessage.warning('请选择日期');
    return;
  }
  try {
    const response = await axios.get(`${BASE_URL}/report`, {
      params: {
        reportType: reportType.value,
        startDate: startDate,
        endDate: endDate
      }
    });
    reportData.value = response.data.data;

    if (reportType.value !== 'daily' && response.data.chartData) {
      reportOptions.value = response.data.chartData;
      nextTick(() => {
        renderChart()
      })
    } else {
      reportOptions.value = null;
    }

  } catch (error) {
    console.error('生成报告失败:', error);
    ElMessage.error('生成报告失败，请检查网络或联系管理员。');
  }
};

// 渲染图表
const renderChart = () => {
  const chartDom = document.getElementById('reportChart');
  if (!chartDom) return;

  // 先清除现有图表
  let myChart = echarts.getInstanceByDom(chartDom);
  if (myChart) {
    myChart.dispose();
  }

  myChart = echarts.init(chartDom);

  // 确保有数据且格式正确
  if (reportOptions.value && reportOptions.value.series) {
    console.log('Chart options:', reportOptions.value);

    // 确保每个系列都有正确的类型和名称
    const options = {
      ...reportOptions.value,
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        }
      },
      legend: {
        data: reportOptions.value.legend.data || []
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: reportOptions.value.xAxis.data || []
      },
      yAxis: {
        type: 'value'
      },
      series: reportOptions.value.series.map(series => ({
        ...series,
        type: 'line',
        showSymbol: true,
        smooth: true
      }))
    };

    myChart.setOption(options);

    // 窗口大小变化时自适应
    window.addEventListener('resize', function() {
      myChart.resize();
    });
  } else {
    console.warn('No valid chart data available');
  }
};


// 下载报告（修改参数传递）
// 在 downloadReport 方法中添加获取图表图片的步骤
const downloadReport = async () => {
  downloading.value = true;
  let startDate = reportDate.value;
  let endDate = reportDate.value;
  const selectedDate = moment(reportDate.value);

  if (reportType.value === 'weekly') {
    startDate = selectedDate.startOf('isoWeek').format('YYYY-MM-DD');
    endDate = selectedDate.endOf('isoWeek').format('YYYY-MM-DD');
  } else if (reportType.value === 'monthly') {
    startDate = selectedDate.startOf('month').format('YYYY-MM-DD');
    endDate = selectedDate.endOf('month').format('YYYY-MM-DD');
  }

  try {
    // 获取图表图片
    let chartImage = '';
    if (reportType.value !== 'daily' && reportOptions.value) {
      const chartDom = document.getElementById('reportChart');
      if (chartDom) {
        const myChart = echarts.getInstanceByDom(chartDom);
        if (myChart) {
          chartImage = myChart.getDataURL({
            type: 'png',
            pixelRatio: 2, // 提高图片质量
            backgroundColor: '#fff'
          });
        }
      }
    }

    const response = await axios({
      url: `${BASE_URL}/report/download`,
      method: 'post', // 改为 POST 以便发送图片数据
      params: {
        reportType: reportType.value,
        startDate: startDate,
        endDate: endDate
      },
      data: {
        chartImage: chartImage
      },
      responseType: 'blob'
    });

    // 处理文件名和下载...
    const disposition = response.headers['content-disposition'];
    let fileName = 'report.pdf';
    if (disposition && disposition.indexOf('attachment') !== -1) {
      const filenameRegex = /filename[^;=\n]*=((utf-8)['"]*[^;\n]*['"]*|[^;\n]*)/;
      const matches = filenameRegex.exec(disposition);
      if (matches != null && matches[1]) {
        fileName = decodeURIComponent(matches[1].replace(/['"]/g, ''));
      }
    }

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    ElMessage.success('报告下载成功！');
  } catch (error) {
    console.error('下载报告失败:', error);
    ElMessage.error('下载报告失败，请检查网络或联系管理员。');
  } finally {
    downloading.value = false;
  }
};

onMounted(() => {
  if (reportType.value !== 'daily' && reportOptions.value) {
    renderChart();
  }
});
</script>

<style scoped>
.header {
  padding: 10px 20px;
  font-size: 1.2em;
  font-weight: bold;
  color: #333;
}
hr {
  border: none;
  border-top: 1px solid var(--el-border-color-light);
  margin: 0;
}
.export-filters {
  padding: 20px;
}
.demo-panel {
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
}
</style>
