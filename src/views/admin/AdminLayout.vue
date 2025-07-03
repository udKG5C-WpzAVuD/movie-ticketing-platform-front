<script setup>

import {
  CaretBottom,
  EditPen, GoodsFilled, Histogram,
  Message, Notification,
  Promotion, SwitchButton,
  User, UserFilled
} from '@element-plus/icons-vue'
import avatar from '@/assets/default.png'
import {userInfoService} from "@/api/user";
import {useUserInfoStore} from "@/stores/userInfo";
import {useRouter} from "vue-router";
import {ElMessage, ElMessageBox} from "element-plus";
import {ref} from "vue";
import {getUnsolvedComments} from "@/api/homepage";

const toBeSolved = ref(true);

// 获取用户信息
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

// 获取未处理留言信息
const fetchUnsolvedComments = () =>{
  getUnsolvedComments().then(res =>{
    const comments = res.data
    if(comments.length === 0){
      toBeSolved.value = false
    }else{
      toBeSolved.value = true
    }
  })
}
fetchUnsolvedComments()

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
    router.push('/admin/' + command)
  }
}
</script>

<template>
  <el-container class="layout-container">
    <!-- 左侧菜单 -->
    <el-aside width="200px">
      <div class="el-aside__logo"></div>
      <el-menu active-text-color="#ffd04b" background-color="#232323" text-color="#fff"
               router>
        <el-menu-item index="/admin/list">
          <el-icon>
            <Promotion/>
          </el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <!--        添加电影管理界面-->
        <el-menu-item index="/admin/movie">
          <el-icon>
            <Promotion/>
          </el-icon>
          <span>电影管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/screening">
          <el-icon>
            <Promotion/>
          </el-icon>
          <span>电影排片管理</span>
        </el-menu-item>
        <el-sub-menu>
          <template #title>
            <el-icon>
              <Histogram/>
            </el-icon>
            <span>数据统计</span>
          </template>
          <el-menu-item index="/admin/userData">
            <el-icon>
              <UserFilled/>
            </el-icon>
            <span>用户数据</span>
          </el-menu-item>
          <el-menu-item index="/admin/movieData">
            <el-icon>
              <Notification/>
            </el-icon>
            <span>电影数据</span>
          </el-menu-item>
          <el-menu-item index="/admin/saleData">
            <el-icon>
              <GoodsFilled/>
            </el-icon>
            <span>销售数据</span>
          </el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/admin/ordercommand">
          <el-icon>
            <Promotion/>
          </el-icon>
          <span>订单管理</span>
        </el-menu-item>
        <!--        结束-->
        <!-- 添加文件导出与定期报告 -->
        <el-menu-item index="/admin/exportData">
          <el-icon>
            <Promotion/>
          </el-icon>
          <span>数据导出</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <!-- 右侧主区域 -->
    <el-container>
      <!-- 头部区域 -->
      <el-header style="display: flex; justify-content: space-between; align-items: center;">
        <!-- 左侧欢迎语 -->
        <div>欢迎：<strong>{{ userInfoStore.userInfo.username }}</strong>！今天也要努力工作哦！</div>

        <!-- 右侧留言按钮 + 头像下拉菜单 -->
        <div style="display: flex; align-items: center; gap: 50px;">
          <a href="/admin/comments" style="text-decoration: none;">
            <div style="display: inline-block;">
              <el-badge v-if="toBeSolved" is-dot class="item">
                <el-button class="message-button" :icon="Message" type="primary" />
              </el-badge>
              <el-button
                  v-else
                  class="message-button"
                  :icon="Message"
                  type="primary"
              />
            </div>
          </a>

          <el-dropdown placement="bottom-end" @command="handleCommand">
      <span class="el-dropdown__box" style="display: flex; align-items: center; cursor: pointer;">
        <el-avatar :src="userInfoStore.userInfo.avatarUrl ? userInfoStore.userInfo.avatarUrl : avatar" />
        <el-icon><CaretBottom /></el-icon>
      </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="settings" :icon="User">基本资料</el-dropdown-item>
                <el-dropdown-item command="resetPassword" :icon="EditPen">重置密码</el-dropdown-item>
                <el-dropdown-item command="logout" :icon="SwitchButton">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <!-- 中间区域 -->
      <el-main>
        <router-view/>
      </el-main>
      <!-- 底部区域 -->
      <el-footer>电影购票平台后台管理 ©2025 </el-footer>
    </el-container>
  </el-container>
</template>

<style lang="scss" scoped>
.layout-container {
  height: 100vh;

  .el-aside {
    background-color: #232323;

    &__logo {
      height: 120px;
      background: url('@/assets/login_title.png') no-repeat center / 120px auto;
    }

    .el-menu {
      border-right: none;
    }
  }

  .el-header {
    background-color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .el-dropdown__box {
      display: flex;
      align-items: center;

      .el-icon {
        color: #999;
        margin-left: 10px;
      }

      &:active,
      &:focus {
        outline: none;
      }
    }
  }

  .el-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: #666;
  }
}
</style>
