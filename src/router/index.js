import {createRouter, createWebHistory} from "vue-router";
import Login from "@/views/Login.vue";
import Layout from "@/views/Layout.vue";
import UserInfo from "@/views/user/UserInfo.vue";
import UserList from "@/views/user/UserList.vue";
import RestPassword from "@/views/user/RestPassword.vue";
import UserLayout from "@/views/UserLayout.vue";
import UserInfo from "@/views/admin/UserInfo.vue";
import UserList from "@/views/admin/UserList.vue";
import RestPassword from "@/views/admin/RestPassword.vue";
import Moviecommand  from "@/views/admin/Moviecommand.vue";
import AdminLayout from "@/views/AdminLayout.vue";
import Homepage from "@/views/user/Homepage.vue";
import MovieInfo from "@/views/user/MovieInfo.vue";
import MoviesScreening from "@/views/admin/MoviesScreening.vue";



// 定义路由关系
const routes = [
  {path: '/login', component: Login},  // 一级路由
  {
      path: '/uer',
      redirect: '/user/layout',  // 重定向
      component: UserLayout,
    // 子路由
    children: [
      {path: '/user/resetPassword', component: RestPassword},
        {path: '/user/list', component: UserList},
        {path: '/user/info', component: UserInfo},
        {path: '/user/resetPassword', component: RestPassword},
    ]
  },
    {
        path: '/admin',
        redirect: '/admin/layout',  // 重定向
        component: AdminLayout,
        children: [
            {path: '/admin/list', component: UserList},
            // 其他admin相关路由
            {path:'/admin/movie',component:Moviecommand },
            {path:'/admin/screening',component: MoviesScreening}
        ]
    },
    {
        path: '/',
        redirect: '/login'
    }
]
const router = createRouter({
    history: createWebHistory(), // 路由模式
    routes: routes
})

//导出暴露
export default router
