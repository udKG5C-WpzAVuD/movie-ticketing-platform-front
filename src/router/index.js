import {createRouter, createWebHistory} from "vue-router";
import Login from "@/views/Login.vue";
import UserLayout from "@/views/user/layout/UserLayout.vue";
import UserList from "@/views/admin/UserList.vue";
import Moviecommand  from "@/views/admin/Moviecommand.vue";
import MoviesScreening from "@/views/admin/MoviesScreening.vue";
import Register from "@/views/Register.vue";
import ForgotPassword from "@/views/ForgotPassword.vue";
import Settings from "@/views/Settings.vue";
import ResetPassword from "@/views/RestPassword.vue";
import Homepage from "@/views/user/homepage/Homepage.vue";
import MovieInfo from "@/views/user/homepage/MovieInfo.vue";
import AdminLayout from "@/views/admin/AdminLayout.vue";
import MovieList from "@/views/user/homepage/MovieList.vue";
import Order from "@/views/user/homepage/Order.vue";
import UserComment from "@/views/user/homepage/UserComment.vue";
import AdminHomepage from "@/views/admin/AdminHomepage.vue";
import Ordercommand from "@/views/admin/Ordercommand.vue";




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
      {path: '/user/resetPassword', component: ResetPassword},
        {
            path: '/film/ticket',
            name: 'FilmTicket',
            component: () => import('@/views/user/homepage/FilmTicket.vue'), // 动态导入
            props: (route) => ({ fid: route.query.fid }) // 将查询参数转为props
        }
    ]
  },
    {
        path: '/',
        redirect: '/login',  // 重定向
        component: AdminLayout,
        children: [
            {path: '/admin/homepage', component: AdminHomepage},
            {path: '/admin/list', component: UserList},
            // 其他admin相关路由
            {path:'/admin/movie',component:Moviecommand },
            {path:'/admin/screening',component: MoviesScreening},
            {path: '/admin/settings', component: Settings},
            {path: '/admin/resetPassword', component: ResetPassword},
            {path:'/admin/ordercommand',component: Ordercommand}
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

]
const router = createRouter({
    history: createWebHistory(), // 路由模式
    routes: routes
})

//导出暴露
export default router
