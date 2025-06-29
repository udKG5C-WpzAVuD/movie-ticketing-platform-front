<script setup lang="ts">
import { ref } from 'vue'
import {Star} from "@element-plus/icons-vue";
import {UpdateLikes, AddLike, DeleteLike, Getlike} from "../../../api/homepage";
import {useUserInfoStore} from "../../../stores/userInfo";

const film = JSON.parse(sessionStorage.getItem('selectedMovie'));
const userInfoStore = useUserInfoStore();
const uid = userInfoStore.userInfo?.id;
// // 评分星级相关，暂时没实现，后续有机会再写
// const value = ref(3.5)
// const form = ref({
//   fid: '',
//   uid: '',
//   star: 5,
//   comment: ''
// })
// const dialogVisible = ref(false)
const isStarClicked = ref(false)
function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始，+1
  const day = String(date.getDate()).padStart(2, '0'); // 日期不足两位前面补0
  return `${year}-${month}-${day}`;
}

const getLikeInfo = () =>{
  Getlike(uid, film.id).then(res =>{
    if(res.status){
      isStarClicked.value = true
    }else{
      isStarClicked.value = false
    }
  })
}
getLikeInfo()

const toggleStar = () =>{
  isStarClicked.value = !isStarClicked.value;
  UpdateLikes(film.id, isStarClicked.value);
  if(isStarClicked.value === true){
    AddLike(uid, film.id);
  }else{
    DeleteLike(uid, film.id);
  }
}

</script>

<template>
  <div class="film">
    <div class="film-header"></div>

    <div class="film-card">
      <img alt="" style="width: 100%;height: 100%" :src="film.posterUrl">
    </div>

    <div class="film-des">
      <div class="p1">{{ film.title }}
<!--        // 评分星级相关，暂时没实现，后续有机会再写-->
<!--        <el-rate style="float: right;padding-left: 50px"-->
<!--                 v-model="value"-->
<!--                 disabled-->
<!--                 show-score-->
<!--                 text-color="#ff9900"-->
<!--                 score-template="{value}">-->
<!--        </el-rate>-->
      </div>
      <div class="p2">导演 : {{ film.director }}</div>
      <div class="p2">主演 : {{ film.actors }}</div>
      <div class="p2">语言 : {{ film.language }}</div>
      <div class="p2">电影类型 : {{ film.genre }}</div>
      <div class="p2">电影时长 : {{ film.duration }}分钟</div>
      <div class="p2">上映日期 : {{ formatDate(film.releaseDate) }}</div>
      <div class="p2">剧情简介 : {{ film.description }} </div>
      <div style="padding-top: 30px">
        <div style="display: flex; align-items: center;">
          <router-link style="margin-right: 20px" :to="'/film/ticket?fid=' + film.id">
            <el-button type="danger" style="width: 130px; letter-spacing: 2px;">
              <i style="padding-right: 5px; font-size: 15px" class="el-icon-s-finance"></i>特惠购票
            </el-button>
          </router-link>

          <el-button
              :type="isStarClicked ? 'warning' : 'info'"
              :icon="Star"
              circle
              :class="{'is-yellow': isStarClicked}"
              @click="toggleStar"
              style="cursor: pointer; font-size: 24px; line-height: 1;" />
        </div>
      </div>

    </div>

    <div class="film-content">
      <router-view />
    </div>


  </div>
</template>

<style scoped>
.film-header {
  position: relative;
  width: 100%;
  height: 600px;
  background: #5a84fd;
  margin-top: 12px;
}

.film-content {
  padding: 80px 200px;
  letter-spacing: 2px;
}

.p1 {
  font-weight: bolder;
  letter-spacing: 3px;
  color: #FFFFFF;
  font-size: 30px;
  padding-top: 20px;
  padding-bottom: 10px;
}

.p2 {
  font-size: 14px;
  padding-top: 20px;
  letter-spacing: 2px;
  color: #FFFFFF;
}

.film-card {
  width: 380px;
  height: 520px;
  background: #FFFFFF;
  margin-right: 100px;
  margin-left: 70px;
  position: absolute;
  overflow: hidden;
  top: 200px;
  z-index: 999;
}

.film-des {
  margin-left: 500px;
  position: absolute;
  overflow: hidden;
  top: 150px;
  z-index: 999;
}

>>> .el-rate__icon {
  font-size: 25px;
}

>>> .el-rate__text {
  padding-left: 8px;
  font-size: 30px;
}

.is-yellow {
  color: gold;
}

.is-yellow path {  /* 选中后修改Star图标的填充颜色 */
  fill: gold !important;
}

</style>
