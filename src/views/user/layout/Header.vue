<script setup>
import avatar from '../../../assets/default.png'
import {userInfoService} from "@/api/user";
import {useUserInfoStore} from "@/stores/userInfo";
import {useRouter} from "vue-router";
import {ElMessage, ElMessageBox} from "element-plus";
import {CaretBottom, EditPen, SwitchButton, User} from "@element-plus/icons-vue";

const userInfoStore = useUserInfoStore();
const getUserInfo = ()=>{
  userInfoService ().then(res=>{
    if(res.data){
      //登录过
      userInfoStore.setUserInfo(res.data)
    }else{
      ElMessage({
        message: '尚未登录，请先登录',
        type: 'warning'
      })
      router.push({path: "/login"})
    }
  })
}
getUserInfo()

const router = useRouter();
const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm(
        '你确认要退出吗？',
        '温馨提示',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        }
    ).then(
        async () => {
          // clear data in pinia
          userInfoStore.removeUserInfo()
          ElMessage.success("退出成功")
          await router.push('/login')
        }
    )
  } else {
    router.push('/user/' + command)
  }
}
</script>

<template>
  <div class="header">
    <div style="height: 70px;width: 100%">
      <div class="header-logo">
        <img style="width: 50px; height: 50px;float: left" src="/img/logo.png" alt="" />
        <div class="header-logo-text">电影购票平台</div>
      </div>
      <div class="header-links">
        <el-link href="/user/homepage" class="header-link" :underline="false">首页</el-link>
        <el-link href="/user/movieList" class="header-link" :underline="false">电影</el-link>
        <el-link href="/user/orders" class="header-link" :underline="false">订单</el-link>
        <el-link href="/user/userComments" class="header-link" :underline="false">留言</el-link>
      </div>

      <el-dropdown placement="bottom-end" @command="handleCommand" class="custom-dropdown" style="float: right;padding-right: 10px">
        <span class="el-dropdown__box">
          <div class="header-name">{{ userInfoStore.userInfo.username }}</div>
          <el-avatar :src="userInfoStore.userInfo.avatarUrl ? userInfoStore.userInfo.avatarUrl : avatar" class="avatar"/>
          <el-icon>
            <CaretBottom/>
          </el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="settings" :icon="User">个人中心</el-dropdown-item>
            <el-dropdown-item command="resetPassword" :icon="EditPen">重置密码</el-dropdown-item>
            <el-dropdown-item command="logout" :icon="SwitchButton">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<style scoped lang="scss">
.header {
  height: 70px;
  background: #FFFFFF;
  box-shadow: 0 2px 12px 0 rgb(0 0 0/10%);
  border: 1px solid #EBEEF5;
}

.header-logo {
  padding-top: 10px;
  padding-left: 10%;
  float: left;
  letter-spacing: 2px;
}

.header-logo-text {
  font-size: 30px;
  padding-top: 3px;
  font-weight: bolder;
  padding-left: 15px;
  float: left;
}

.header-search {
  float: left;
  width: 300px;
  border-radius: 20px;
  padding-top: 16px;
}

.header-links {
  float: left;
  padding-left: 50px;
  padding-top: 23px;
}

.header-link {
  letter-spacing: 2px;
  font-size: 17px;
  padding-right: 40px;
}

.header-name {
  color: #000000;
  float: right;
  padding-top: 15px;
  padding-left: 15px;
  font-weight: bolder;
  font-size: 15px;
  letter-spacing: 2px;
}

>>>.el-input__inner {
  border-radius: 20px;
  height: 40px;
}

.custom-dropdown .el-dropdown__box {
  display: flex;
  justify-content: space-between; /* 左右对齐 */
  align-items: center;
  width: 100%;
}

.header-name {
  flex: 1;
  text-align: left; /* 保证名字靠左 */
}

.avatar {
  margin-left: 10px; /* 头像与名字之间的间隔 */
}

/* 调整头像位置，让它靠近右边 */
.el-dropdown__box {
  padding-top: 15px; /* 距离页面上边界 */
  padding-right: 15px; /* 距离页面右边界 */
}

.el-dropdown-menu {
  padding-left: 0; /* 去除默认的 padding */
  padding-right: 0;
}
</style>