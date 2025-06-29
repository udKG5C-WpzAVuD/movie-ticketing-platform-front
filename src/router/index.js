import {createRouter, createWebHistory} from "vue-router";
import Login from "@/views/Login.vue";
import Register from "@/views/Register.vue";
import ForgotPassword from "@/views/ForgotPassword.vue";
import UserLayout from "@/views/user/layout/UserLayout.vue";
import Settings from "@/views/user/Settings.vue";
import ResetPassword from "@/views/user/ResetPassword.vue";
import Homepage from "@/views/user/homepage/Homepage.vue";
import MovieInfo from "@/views/user/homepage/MovieInfo.vue";
import AdminLayout from "@/views/admin/AdminLayout.vue";
import MovieList from "@/views/user/homepage/MovieList.vue";
import Order from "@/views/user/homepage/Order.vue";
import UserComment from "@/views/user/homepage/UserComment.vue";




// 定义路由关系
const routes = [
  {path: '/login', component: Login},  // 一级路由
  {
    path: '/',
    redirect: '/login',  // 重定向
    component: UserLayout,
    // 子路由
    children: [
      {path: '/user/resetPassword', component: ResetPassword},
      {path: '/user/homepage', component: Homepage},
      {path: '/user/movieInfo', component: MovieInfo},
      {path: '/user/movieList', component: MovieList},
      {path: '/user/orders', component: Order},
      {path: '/user/userComments', component: UserComment},
      {path: '/user/settings', component: Settings},
      {path: '/user/resetPassword', component: ResetPassword}
    ]
  },
  {
    path: '/register',
    name: 'Register',
    component: Register, // 注册组件
  },
  {
    path: '/forgotPassword',
    name: 'ForgotPassword',
    component: ForgotPassword, // 注册组件
  },
  {
    path: '/',
    redirect: '/login',  // 重定向
    component: AdminLayout,
    children: [
      // 其他admin相关路由
    ]
  }
]

// 创建路由器
const router = createRouter({
  history: createWebHistory(), // 路由模式
  routes: routes
})

//导出暴露
export default router
