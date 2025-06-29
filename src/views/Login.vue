<script setup>

import {ref} from "vue";
import {login} from "@/api/user"
import {ElMessage} from "element-plus";
import {useRouter} from "vue-router";

const router = useRouter()
const user = ref({
  username: '',
  password: ''
})

const onSubmit = ()=>{
  const u = user.value
  login(u).then(res=>{
    // 这里的res就是后端返回的json
    // console.info(res.data)
    if(res.data){
      // 跳转
      ElMessage({
        message: '登录成功',
        type: 'success'
      })
      if(res.data.role === 'USER'){
        router.push({path: '/user/homepage'})
      }

    }else{
      ElMessage({
        message: '用户名或者密码错误',
        type: 'warning'
      })
    }
  })
  // axios.post('/api/user/login', u).then(res=>{
  //   // res是axios封装后的结果
  //   // res.data才是后端返回的json
  //   // res.data.data才是数据库查询出来的数据
  //   console.info(res.data.data)
  // })
}
</script>

<template>
  <div>
    用户名 <input type="text" v-model="user.username"> <br>
    密码 <input type="text" v-model="user.password"> <br>
    <el-button type="primary" @click="onSubmit">登录</el-button>
    <el-button type="primary">注册</el-button>
  </div>
</template>

<style lang="scss" scoped>

</style>
