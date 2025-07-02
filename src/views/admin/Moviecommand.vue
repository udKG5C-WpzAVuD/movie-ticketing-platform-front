<!--只有上架的时候才能选择价格   暂时不支持修改价格-->
<!--添加价格字段  integar  -->
<!--添加厅字段  -->
<script setup >
import {addLogs, addMovie, addsessions, getSessions, moviePageList, updateMovie} from "@/api/user";
import {computed, onMounted, ref} from "vue";
import {Delete, Edit, Plus, Search, Share, Upload} from '@element-plus/icons-vue'
import {ElMessage} from "element-plus";
import {useUserInfoStore} from "@/stores/userInfo";
const dialogVisible =ref(false)//添加弹窗
const deleteVisible=ref(false)//删除弹窗
const timeVisible=ref(false)//上架选择时间弹窗
const editVisible=ref(false)//编辑弹窗
// 展示数据
const userInfoStore = useUserInfoStore();
const uid = userInfoStore.userInfo?.id;
const movie_logs=ref({
  title:"",
  operationType:"",
  operationTargetId:"",//设定为1  以后会改
  operationTargetType:"电影"
})
const timeOptions = ref([])
const sessionhalls=ref({
  time:'',
  title:'',
  tingnum:'',
  sid:''
})
const screenVisible=ref(false)
const putmovievictim=()=>{
  movie.value={ title:'',
    director:'',
    actors:'',
    genre:'',
    duration:'',
    releaseDate:'',
    language:'',
    description:'',
    count:'',
    posterUrl:'',
    isDeleted:'',
    isPutaway:'',
  price:'',
  }//置空
  sessionhalls.value={
    title:'',
    time:'',
    tingnum:'',
    sid:''
  }
  imageUrl:''
}
const query=ref({
  pageNum:1,
  pageSize:10,
  title:'',
  genre:'',
   total:0
})
const changedialogVisible=()=>{
  putmovievictim()
  dialogVisible.value=true
}
const movies=ref([])//movies必须为一个数组形式
const movie=ref({
  title:'',
  director:'',
  actors:'',
  genre:'',
  duration:'',
  releaseDate:'',
  language:'',
  description:'',
  count:'',
  posterUrl:'',
  isDeleted:'',
  isPutaway:'',
  price:''
})
const movieForm=ref({
  title:'',
  director:'',
  actors:'',
  genre:'',
  duration:'',
  releaseDate:'',
  language:'',
  description:'',
  count:'',
  posterUrl:'',
  isDeleted:'',
  isPutaway:'',
  price:''
})
// 电影海报上传代码
const imageUrl = ref('')

const handleAvatarSuccess= (response, uploadFile) => {
  imageUrl.value = URL.createObjectURL(uploadFile.raw)
  movie.value.posterUrl=response.data.url
  console.log(movie.value.posterUrl)
}

const beforeAvatarUpload = (rawFile) => {
  if (rawFile.type !== 'image/jpeg' && rawFile.type !=='image/png') {
    ElMessage.error('Avatar picture must be JPG format!')
    return false
  } else if (rawFile.size / 1024 / 1024 > 2) {
    ElMessage.error('Avatar picture size can not exceed 2MB!')
    return false
  }
  return true
}
// 列表浏览功能

// 电影添加功能
const submitMovie=()=>{
  movieForm.value.validate(valid=>{
    if(valid){
      saveMovie()
    }else {
      ElMessage({
        message: '保持字段完整',
        type: 'warning',
      })
    }
  })

}
const saveMovie=()=>{
// 将数组转为逗号分隔的字符串
  const submitData = {
    ...movie.value,
    // 将数组转为逗号分隔的字符串
    genre: Array.isArray(movie.value.genre) ? movie.value.genre.join(',') : movie.value.genre,
    language: Array.isArray(movie.value.language) ? movie.value.language.join(',') : movie.value.language
  }

  addMovie(submitData).then(res=>{
    if(res.data){
      ElMessage({
        message: '电影添加成功',
        type: 'success',
      })

      console.log(res.data)
      dialogVisible.value=false
      putmovievictim()
      movie_logs.value.title=submitData.title
      movie_logs.value.operationType="添加电影"
      movie_logs.value.operationTargetId=uid
      console.log("日志输出",movie_logs.value)
      // 以后写一个关于操作员id
      addLogs(movie_logs.value).then(res=>{
        putmovievictim()
      })
      getMovieList()
    }else{
      ElMessage({
        message:'重复电影不能添加',
        type:'error'
      })
      dialogVisible.value=false

      getMovieList()
      putmovievictim()
    }
  }).catch(err=>{
    ElMessage({
      message:'异常信息',
      type:'error'
    })

  })
}
//电影播放列表相关代码
const getMovieList=()=>{
    moviePageList(query.value).then(res=>{
      console.log('返回数据', res.data.records)
      console.log('返回页数',query.value)
    movies.value=res.data.records
    query.value.total=res.data.total
      console.log('返回数据', movies.value)
      console.log('返回页数',query.value)
  }).catch(err=>{
console.log("错误数据",err)
        }
    )
}

const pageNoChange =(value)=>{
  query.value.pageNum=value
  getMovieList()
}
const pageSizeChange=(value)=>{
  query.value.pageSize=value
  getMovieList()
}
getMovieList()
// 此处是对于四个按钮的方法声明
// 电影编辑
const editdialogVisible=()=>{
  editVisible.value=false
}
const editMovie=(row)=>{
  editVisible.value=true
  movie.value=row
  console.log("修改的数据看这儿",movie.value)
}
const editMovies=()=>{
  const submitData = {
    ...movie.value,
    // 将数组转为逗号分隔的字符串
    genre: Array.isArray(movie.value.genre) ? movie.value.genre.join(',') : movie.value.genre,
    language: Array.isArray(movie.value.language) ? movie.value.language.join(',') : movie.value.language
  }
  updateMovie(submitData).then(res=>{
    ElMessage({
      message:'电影信息修改成功',
      type:'success'
    })
    getMovieList()
    putmovievictim()
    editdialogVisible()
    movie_logs.value.title=submitData.title
    movie_logs.value.operationType="修改电影"
    movie_logs.value.operationTargetId=uid
    // 以后写一个关于操作员id
    console.log("日志输出",movie_logs.value)
    addLogs(movie_logs.value).then(res=>{

    })
  })

}
const deleteMovie=(row)=>{
// 展示弹窗
  deleteVisible.value=true
  movie.value = JSON.parse(JSON.stringify(row))
  movie.value.isDeleted=true//全局变量先换
  getMovieList()
  console.log(movie.value)
}
const deleteMovies=()=>{
  console.log(movie.value)
  if(movie.value.isPutaway){
    ElMessage({
      message:'电影需下架后才能删除',
      type:'warning'
    })
    deleteVisible.value=false

    putmovievictim()
  }else {
    movie_logs.value.title=movie.value.title
    updateMovie(movie.value).then(res=>{
      ElMessage({
        message:'电影删除成功，以后不会有此电影',
        type:'success'
      })
      deleteVisible.value=false

      putmovievictim()
      console.log("看这儿")
      getMovieList()

      movie_logs.value.operationType="删除电影"
      movie_logs.value.operationTargetId=uid
      console.log("日志输出",movie_logs.value)
      // 以后写一个关于操作员id
      addLogs(movie_logs.value).then(res=>{

      })
    })
  }

}
const updatedeleteVisible=()=>{
  deleteVisible.value=false
  putmovievictim()
  getMovieList()
}
// 上架逻辑   但是需要选择相应的时间   那么电影上映时间应得到改变
const isPriceValid = computed(() => {
  return movie.value.price !== '' && !isNaN(movie.value.price) && Number(movie.value.price) > 0;
});
const updatetimeVisible=()=>{
  timeVisible.value=false
  getMovieList()
  putmovievictim()
}
const putawayMovie=(row)=>{
  timeVisible.value=true//显示弹窗，选择时间
  movie.value=row
  movie.value.isPutaway=true
}
const putawayMovies=()=>{
  console.log("看这儿",movie.value)
  if(isPriceValid.value){
    movie_logs.value.title=movie.value.title
    updateMovie(movie.value).then(res=>{
      ElMessage({
        message:'电影上架成功，注意相应时间排场',
        type:'success'
      })
      getMovieList()

      updatetimeVisible()

      movie_logs.value.operationType="电影上架"
      movie_logs.value.operationTargetId=uid
      console.log("日志输出",movie_logs.value)
      putmovievictim()
      // 以后写一个关于操作员id
      addLogs(movie_logs.value).then(res=>{

      })
    })
  }else{
    ElMessage({
      message:'请输入票价',
      type:'warning'
    })

  }
}

const getSessionClass = (option) => {
  const session = sessions.value.find(
      s => s.tingnum === sessionhalls.value.tingnum && s.time === option.value
  );
  if (!session) return '';
  if (session.title === sessionhalls.value.title) return 'option-mine';
  return 'option-other';
};
// 电影排期

const getscreeningMovie=(row)=>{
if(row.isPutaway){
sessionhalls.value.title=row.title
//拿到电影名字
  screenVisible.value=true//展示弹窗
// 在获取数据后添加数据格式化
  getSessions().then(res => {
    sessions.value = res.data.map(item => ({
      ...item,
      time: item.time.replace('T', ' ') // 简单替换
    }));
    console.log("处理后的sessions数据:", sessions.value);
  });
// 时间格式化函数
  const formatTime = (timeStr) => {
    return timeStr.substring(0, 5); // 取HH:mm部分
  };
}else{
  ElMessage({
    message:'请电影先进行上架',
    type:'error'
  })
}

  getMovieList()
}

const getscreeningMovies=()=>{
  console.log("厅号内容看这儿",sessionhalls.value)

  if(sessionhalls.value.time&&sessionhalls.value.tingnum){
    movie_logs.value.title=sessionhalls.value.title
    addsessions(sessionhalls.value).then(res=>{
      // 此处写相应内容
      console.log("打印输出",res.data)
      ElMessage({
        message:'电影排期成功',
        type:'success'
      })
      putmovievictim()
      getMovieList()
      screenVisible.value=false

      movie_logs.value.operationType="电影排期"
      movie_logs.value.operationTargetId=uid
      console.log("日志输出",movie_logs.value)
      // 以后写一个关于操作员id
      addLogs(movie_logs.value).then(res=>{

      })
      sessionhalls.value={
        tingnum: "",
        time:"",
        sid:"",
        title: ""
      }
    })
  }else{
    ElMessage({
      message:'重新输入数据',
      type:'warning'
    })
  }

}
const aaaaa=ref(false)
const truedelete=(s)=>{
  console.log(s)

  const hasSameMovie = sessions.value.some(session =>
        session.title === s.title
  )
  console.log(hasSameMovie)
  if(!hasSameMovie){
    aaaaa.value=true;
  }else{
    const now = new Date();
    const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const hasUpcoming = sessions.value.some(session => {
      const sessionTime = new Date(session.time);
      return sessionTime > now && sessionTime <= threeHoursLater;
    });
     if (hasUpcoming){
       aaaaa.value=false
     }else {
       aaaaa.value=true
     }
  }
}
// 下架电影
const putoutMovie=(row)=>{
  getSessions().then(res=>{
    sessions.value=res.data
    truedelete(row)
    console.log(aaaaa.value)
     if(aaaaa.value){
       row.isPutaway=false
       movie_logs.value.title=row.title
       updateMovie(row).then(res=>{
         ElMessage({
           message:'电影下架成功',
           type:'success'
         })
         getMovieList()

         movie_logs.value.operationType="下架电影"
         // 以后写一个关于操作员id
         movie_logs.value.operationTargetId=uid
         addLogs(movie_logs.value).then(res=>{

         })
       })
     }
     else {
       ElMessage({
         message:'电影还有拍片，请勿下架',
         type:'warning'
       })
     }
  })



}
//对于上架后页面显示切换
// 上架时间代码相应调节：
const disablePastDates = (time) => {
  // 获取当前日期的00:00:00
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 比较选择的日期是否在今天之前
  return time.getTime() <= today.getTime()
}


// 多选框选项
const genreOptions = ref([
  { value: '剧情', label: '剧情' },
  { value: '科幻', label: '科幻' },
  { value: '爱情', label: '爱情' },
  { value: '动作', label: '动作' },
  { value: '喜剧', label: '喜剧' },
  { value: '恐怖', label: '恐怖' },
  { value: '悬疑', label: '悬疑' },
  { value: '犯罪', label: '犯罪' },
  { value: '冒险', label: '冒险' },
  { value: '战争', label: '战争' },
  { value: '历史', label: '历史' },
  { value: '武侠', label: '武侠' },
  { value: '传记', label: '传记' },
  { value: '古装', label: '古装' },
  { value: '同性', label: '同性' },
  { value: '灾难', label: '灾难' },
  { value: '动画', label: '动画' },
  { value: '奇幻', label: '奇幻' },
  { value: '音乐', label: '音乐' },
  { value: '其他', label: '其他' }
]);

const languageOptions = ref([
  { value: '中文普通话', label: '中文普通话' },
  { value: '粤语', label: '粤语' },
  { value: '英语', label: '英语' },
  { value: '日语', label: '日语' },
  { value: '意大利语', label: '意大利语' },
  { value: '德语', label: '德语' },
  { value: '法语', label: '法语' },
  { value: '西班牙语', label: '西班牙语' },
  { value: '俄语', label: '俄语' },
  { value: '印度语', label: '印度语' },
  { value: '马来语', label: '马来语' },
  { value: '其他', label: '其他' }
]);


const rules = {
  title: [
    { required: true, message: '请输入电影名称', trigger: 'blur' },
    { min: 1, max: 50, message: '长度在1到50个字符', trigger: 'blur' }
  ],
  director: [
    { required: true, message: '请输入导演姓名', trigger: 'blur' }
  ],
  genre: [
    { type: 'array', required: true, message: '请至少选择一个类型', trigger: 'change' }
  ],
  language: [
    { type: 'array', required: true, message: '请至少选择一种语言', trigger: 'change' }
  ],
  actors: [
    { required: true, message: '请输入主要演员', trigger: 'blur' }
  ],
  duration: [
    { required: true, message: '请输入时长', trigger: 'blur' },
    { type: 'number', min: 1, message: '时长必须大于0', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入剧情简介', trigger: 'blur' }
  ],
  releaseDate: [
    { required: true, message: '请选择上映日期', trigger: 'change' }
  ],
  posterUrl: [
    { required: true, message: '请上传电影海报', trigger: 'change' }
  ]
}
// 获取明日及之后三天的日期对象数组
function getNextThreeDays() {
  const days = []
  const today = new Date()
  for (let i = 1; i <= 3; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    days.push(d)
  }
  return days
}

function getTimeSegments() {
  const segments = []
  for (let i = 0; i < 24; i += 3) {
    const start = i.toString().padStart(2, '0') + ':00:00'
    const end = ((i + 3) % 24).toString().padStart(2, '0') + ':00:00'
    segments.push({ start, end })
  }
  return segments
}
const sessions=ref([])
//数组
function generateTimeOptions() {
  const days = getNextThreeDays()
  const segments = getTimeSegments()
  const options = []
  days.forEach((date) => {
    const dateStr = date.toISOString().slice(0, 10)
    const labelDate = `${date.getMonth() + 1}月${date.getDate()}日`
    segments.forEach(({ start, end }) => {
      // 只传开始时间
      const value = `${dateStr} ${start}` // 例如 "2025-06-29 09:00:00"
      const label = `${labelDate} ${start.slice(0,5)}~${end.slice(0,5)}`
      options.push({
        label,
        value
      })
    })
  })
  timeOptions.value = options
}

onMounted(() => {
  generateTimeOptions()
})

</script>

<template>
  <el-card>
    <template #header>
      <div class="header">
<!--        电影管理标题及添加按钮-->
       <el-row gutter="950">
         <el-col span="18"><div><span>电影管理</span></div></el-col>
         <el-col span="6"><el-button type="primary"  @click="changedialogVisible">
           电影添加<el-icon class="el-icon--right"><Upload /></el-icon>
         </el-button></el-col>
       </el-row>
      </div>

<!--选择框-->

    </template>

  </el-card>
<br>
  <el-table :data="movies" style="width: 100%">
    <el-table-column prop="title" label="电影名称" width="180" />
    <el-table-column prop="genre" label="类型" width="180" />
    <el-table-column prop="duration" label="电影时长" width="180"/>
    <el-table-column prop="count" label="收藏量" width="180"/>
    <el-table-column prop="releaseDate" label="上映时间" width="180"/>
    <el-table-column label="操作" width="400">
      <template #default="scope">
        <el-button type="primary" size="small" @click="editMovie(scope.row)"  >编辑</el-button>
        <el-button type="danger" size="small" @click="deleteMovie(scope.row)" >删除</el-button>

        <el-button type="info" size="small"  v-if="scope.row.isPutaway"  @click="putoutMovie(scope.row)">下架</el-button>
        <el-button type="primary" size="small"  @click="putawayMovie(scope.row)" v-if="!scope.row.isPutaway" >上架</el-button>
        <el-button type="primary" size="small" @click="getscreeningMovie(scope.row)" >排期</el-button>
      </template>
    </el-table-column>
  </el-table>
  <el-pagination
      :current-page="query.pageNum"
     :page-size="query.pageSize"
      :page-sizes="[10,20,30,40]"
      :background="true"
      layout="total, sizes, prev, pager, next, jumper"
      :total="query.total"
      @size-change="pageSizeChange"
      @current-change="pageNoChange"
  />
  <!--    添加弹框-->
  <el-dialog
      v-model="dialogVisible"
      title="添加电影"
      width="500"
      :before-close="handleClose"
  >
    <el-form
        ref="movieForm"
        :model="movie"
        :rules="rules"
        label-width="auto"
        style="max-width: 600px"
    >
      <el-form-item label="电影名称" prop="title">
        <el-input v-model="movie.title" placeholder="请输入电影名称"/>
      </el-form-item>

      <el-form-item label="导演" prop="director">
        <el-input v-model="movie.director" placeholder="请输入导演姓名"/>
      </el-form-item>

      <el-form-item label="类型" prop="genre">
        <el-select
            v-model="movie.genre"
            multiple
            placeholder="请选择类型"
            style="width: 100%"
        >
          <el-option
              v-for="item in genreOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="语言" prop="language">
        <el-select
            v-model="movie.language"
            multiple
            placeholder="请选择语言"
            style="width: 100%"
        >
          <el-option
              v-for="item in languageOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="演员" prop="actors">
        <el-input v-model="movie.actors" placeholder="请输入主要演员，用逗号分隔"/>
      </el-form-item>

      <el-form-item label="电影时长(分钟)" prop="duration">
        <el-input-number
            v-model="movie.duration"
            :min="1"
            :step="1"
            controls-position="right"
            placeholder="请输入大于0的整数"
        />
      </el-form-item>

      <el-form-item label="剧情简介" prop="description">
        <el-input
            v-model="movie.description"
            type="textarea"
            :rows="3"
            placeholder="请输入剧情简介"
        />
      </el-form-item>

      <el-form-item label="上映时间" prop="releaseDate">
        <el-date-picker
            v-model="movie.releaseDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :disabled-date="disablePastDates"
            style="width: 100%;"
        />
      </el-form-item>

      <el-form-item label="电影海报" prop="posterUrl">
        <el-upload
            class="avatar-uploader"
            action="/api/file/upload"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
        >
          <img
              v-if="imageUrl"
              :src="imageUrl"
              class="avatar"
              style="max-width: 200px; max-height: 200px; object-fit: contain;"
          />
          <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
        </el-upload>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitMovie">
          添加此电影
        </el-button>
      </div>
    </template>
  </el-dialog>
  <el-dialog   v-model="deleteVisible" title="Tips" width="500">
    <div><p>是否确定要删除（删除操作不可逆）</p></div>
    <el-button @click="updatedeleteVisible">取消</el-button>
    <el-button @click="deleteMovies">确定</el-button>
  </el-dialog>

  <el-dialog   v-model="timeVisible" title="Tips" width="500">
    <div><p>请选择电影上映时间</p></div>
    <el-date-picker
        v-model="movie.releaseDate"
        type="date"
        placeholder="选择日期"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        :disabled-date="disablePastDates"
        style="width: 100%;"
    />
    <div>
      <p>请输入票价（元）</p>
      <el-input
          v-model="movie.price"
          type="number"
          placeholder="请输入票价"
          :min="0"
          :step="1"

      >
        <template #append>元</template>
      </el-input>
    </div>
    <el-button @click="updatetimeVisible">取消</el-button>
    <el-button @click="putawayMovies">确定</el-button>
  </el-dialog>
<!--  编辑修改弹窗-->
  <el-dialog
      v-model="editVisible"
      title="编辑电影信息"
      width="700px"
      :before-close="handleClose"
  >
    <el-form
        :model="movie"
        :rules="rules"
        ref="movieForm"
        label-width="100px"
        style="max-width: 600px; margin: 0 auto;"
    >
      <el-form-item label="电影名称" prop="title">
        <el-input v-model="movie.title" placeholder="请输入电影名称"/>
      </el-form-item>

      <el-form-item label="导演" prop="director">
        <el-input v-model="movie.director" placeholder="请输入导演姓名"/>
      </el-form-item>

      <el-form-item label="类型" prop="genre">
        <el-select
            v-model="movie.genre"
            multiple
            placeholder="请选择类型"
            style="width: 100%"
        >
          <el-option
              v-for="item in genreOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="语言" prop="language">
        <el-select
            v-model="movie.language"
            multiple
            placeholder="请选择语言"
            style="width: 100%"
        >
          <el-option
              v-for="item in languageOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="演员" prop="actors">
        <el-input v-model="movie.actors" placeholder="请输入主要演员，多个演员用逗号分隔"/>
      </el-form-item>

      <el-form-item label="电影时长" prop="duration">
        <el-input-number
            v-model="movie.duration"
            :min="1"
            :max="300"
            placeholder="请输入时长(分钟)"
        />
      </el-form-item>

      <el-form-item label="剧情简介" prop="description">
        <el-input
            v-model="movie.description"
            type="textarea"
            :rows="3"
            placeholder="请输入剧情简介"
        />
      </el-form-item>

      <el-form-item label="上映时间" prop="releaseDate">
        <el-date-picker
            v-model="movie.releaseDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :disabled-date="disablePastDates"
            style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="电影海报" prop="posterUrl">
        <el-upload
            class="avatar-uploader"
            action="/api/file/upload"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
        >
          <img
              v-if="movie.posterUrl"
              :src="movie.posterUrl"
              class="avatar"
              style="max-width: 200px; max-height: 200px; object-fit: contain;"
          />
          <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          <template #tip>
            <div class="el-upload__tip" style="color: #f56c6c" v-if="!movie.posterUrl">
              请上传电影海报
            </div>
          </template>
        </el-upload>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="editMovies">
          确认修改
        </el-button>
      </div>
    </template>
  </el-dialog>



<!--  展示排期的弹窗-->
 <el-dialog
 v-model="screenVisible"
 title="电影排期"
 width="700px">

  <el-form model="sessionhalls">
    <el-form-item prop="title" label="电影名称">
      <input v-model="sessionhalls.title" readonly></input>
    </el-form-item>
    <el-form-item prop="tingnum" label="厅号">
      <el-select v-model="sessionhalls.tingnum" placeholder="请选择厅号">
        <el-option
            v-for="hall in [1, 2, 3]"
            :key="hall"
            :label="`${hall}号厅`"
            :value="hall"
        />
      </el-select>
    </el-form-item>
    <el-form-item prop="time" label="时间段">
      <el-form-item prop="time" label="时间段">
        <el-select v-model="sessionhalls.time" placeholder="请选择时间段">

          <el-option
              v-for="option in timeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
              :disabled="sessions.some(s => s.tingnum === sessionhalls.tingnum && s.time === option.value)"
              :class="{

    'conflict-movie': sessions.some(s =>
      s.tingnum === sessionhalls.tingnum &&
      s.time === option.value &&
      s.title !== sessionhalls.title
    ),
     'current-movie': sessions.some(s =>
      s.tingnum === sessionhalls.tingnum &&
      s.time === option.value &&
      s.title === sessionhalls.title
    )
  }"
          />
        </el-select>
      </el-form-item>
    </el-form-item>
  </el-form>

   <div class="dialog-footer">
     <el-button @click="screenVisible = false">取消</el-button>
     <el-button type="primary" @click="getscreeningMovies">
       确认排期
     </el-button>
   </div>
 </el-dialog>
</template>

<style scoped lang="scss">
.header{
  width: 100%;
}

//上传框相关代码
.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

/* 在全局或组件样式中添加 */
.current-movie {
  color: white !important;
  background-color: black !important;
}

.conflict-movie {
  color: white !important;
  background-color: #f56c6c !important;
}

/* 覆盖Element默认禁用样式 */
.el-select-dropdown__item.is-disabled {
  opacity: 1 !important;
}

.option-mine {
  color: #fff !important;
  background: #000 !important;
}
.option-other {
  color: red !important;
}

</style>