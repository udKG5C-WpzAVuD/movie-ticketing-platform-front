<script setup>
import {ref} from 'vue';
import {ListAllFilm, ListHots} from "@/api/homepage";
import {useRouter} from "vue-router";  // Importing Vue 3's Composition API

const top1 = ref({});
const top2 = ref({});
const top3 = ref({});
const hotMovies = ref([]);
const movies = ref([]);
const releasedMovies = ref([]);
const newMovies = ref([]);
const onMovies = ref([]);

const getFilms = () => {
  ListAllFilm().then(res => {
    movies.value = res.data;
    const sortedMovies = movies.value.slice().sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
    newMovies.value = sortedMovies.slice(0, 7);
    // 获取当前日期
    const today = new Date().toISOString().split('T')[0]; // 格式化为 'YYYY-MM-DD'
    // 筛选出所有上映时间为今天及今天之前的电影
    releasedMovies.value = movies.value.filter(movie => formatDate(movie.releaseDate) <= today);
    // 筛选出所有上映时间为今天的电影
    onMovies.value = movies.value.filter(movie => formatDate(movie.releaseDate) === today);
  });
  ListHots().then(res => {
    hotMovies.value = res.data;
    top1.value = hotMovies.value[0];
    top2.value = hotMovies.value[1];
    top3.value = hotMovies.value[2];
    hotMovies.value.splice(0, 3)
  });
}
getFilms()

function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始，+1
  const day = String(date.getDate()).padStart(2, '0'); // 日期不足两位前面补0
  return `${year}-${month}-${day}`;
}

const router = useRouter();
const goToMovieInfo = (value) => {
  const selectedMovie = movies.value.find(movie => movie.id === value);
  sessionStorage.setItem('selectedMovie', JSON.stringify(selectedMovie));
  router.push({
    path: "/user/movieInfo"
  });
}

</script>

<template>
  <div class="app">

    <el-carousel :interval="2000" type="card" height="300px" style="width: 70%; margin: 0 auto;">
      <el-carousel-item v-for="(item, index) in newMovies" :key="index" @click="goToMovieInfo(item.id)">
        <img
            class="movie-poster-img"
            alt=""
            :src=item.posterUrl
            style="width: 100%; height: 300px; object-fit: contain; max-width: 100%;">
      </el-carousel-item>
    </el-carousel>

    <div class="as">

      <div style="padding-top: 40px" class="most-expect-wrapper">
        <div class="panel">
          <div class="panel-header">
            <span class="panel-more">
              <span class="panel-arrow panel-arrow-orange"></span>
            </span>
            <span class="panel-title">
              <span class="textcolor_orange">热门榜单Top10</span>
            </span>
          </div>
          <div class="panel-content">
            <ul class="ranking-wrapper ranking-mostExpect">
              <li class="ranking-item ranking-top ranking-index-1" @click="goToMovieInfo(top1.id)">
                <div class="ranking-top-left">
                  <i class="ranking-top-icon"></i>
                  <img class="ranking-img  default-img" :alt="top1.title" :src=top1.posterUrl>
                </div>
                <div class="ranking-top-right">
                  <div class="ranking-top-right-main">
                    <span class="ranking-top-moive-name">{{ top1.title }}</span>

                    <p class="ranking-release-time">上映时间：{{ formatDate(top1.releaseDate) }}</p>

                    <p class="ranking-top-wish">
                      <span class="stonefont">热度值: </span>{{ top1.count }}
                    </p>
                  </div>
                </div>
              </li>

              <li class="ranking-item ranking-index-2" @click="goToMovieInfo(top2.id)">
                <i class="ranking-index">2</i>
                <span class="img-link">
                    <img class="ranking-img default-img" :alt="top2.title" :src=top2.posterUrl
                         style="height: 200px; width: auto;">
                  </span>
                <div class="name-link ranking-movie-name">{{ top2.title }}</div>
                <span class="ranking-num-info"><span class="stonefont">热度值: </span>{{ top2.count }}</span>
              </li>

              <li class="ranking-item ranking-index-3" @click="goToMovieInfo(top3.id)">
                <i class="ranking-index">3</i>
                <span class="img-link">
                    <img class="ranking-img default-img" :alt="top3.title" :src=top3.posterUrl
                         style="height: 200px; width: auto;">
                  </span>
                <div class="name-link ranking-movie-name">{{ top3.title }}</div>
                <span class="ranking-num-info"><span class="stonefont">热度值: </span>{{ top3.count }}</span>
              </li>

              <li v-for="(item, index) in hotMovies" :key="index" class="ranking-item ranking-index-4"
                  @click="goToMovieInfo(item.id)">
                  <span class="normal-link">
                    <i class="ranking-index">{{ index + 4 }}</i>
                    <span class="ranking-movie-name">&nbsp&nbsp{{ item.title }}</span>
                    <span class="ranking-num-info"><span class="stonefont">热度值: </span>{{ item.count }}</span>
                  </span>
              </li>

            </ul>
          </div>
        </div>
      </div>

    </div>

    <div class="main">
      <div class="movie-grid">
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">
              <span class="textcolor_orange">正在热映  ( {{ releasedMovies.length }} )</span>
            </span>
          </div>
          <div class="panel-content">
            <dl class="movie-list">
              <dd v-for="item in releasedMovies" :key="item.id">
                <div class="movie-item" @click="goToMovieInfo(item.id)">
                  <div class="movie-poster">
                    <img class="movie-poster-img" alt="" :src=item.posterUrl>
                    <div class="movie-overlay movie-overlay-bg">
                      <div class="movie-info">
                        <div class="movie-title" title="">{{ item.title }}</div>
                      </div>
                    </div>
                  </div>
                  <div class="movie-detail movie-wish"><span class="stonefont">{{ item.count }}</span>人想看</div>
                  <div class="movie-ver"></div>
                </div>
                <div class="movie-detail movie-rt">{{ formatDate(item.releaseDate) }} 上映</div>
              </dd>
            </dl>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">
              <span class="textcolor_orange">今日上新  ( {{ onMovies.length }} )</span>
            </span>
          </div>
          <div class="panel-content">
            <dl class="movie-list">
              <dd v-for="item in onMovies" :key="item.id">
                <div class="movie-item" @click="goToMovieInfo(item.id)">
                  <div class="movie-poster">
                    <img class="movie-poster-img" alt="" :src=item.posterUrl>
                    <div class="movie-overlay movie-overlay-bg">
                      <div class="movie-info">
                        <div class="movie-title" title="">{{ item.title }}</div>
                      </div>
                    </div>
                  </div>
                  <div class="movie-detail movie-wish"><span class="stonefont">{{ item.count }}</span>人想看</div>
                  <div class="movie-ver"></div>
                </div>
                <div class="movie-detail movie-rt">{{ formatDate(item.releaseDate) }} 上映</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* 将样式排除在作用域内 */
@import "@/assets/css/home.css"; /* 可能是路径问题 */

.app {
  padding: 50px 120px;
}

.as {
  float: right;
}

.main {
  float: left;
  padding-top: 40px;
}

.el-carousel__item h3 {
  color: #475669;
  opacity: 0.75;
  line-height: 200px;
  margin: 0;
  text-align: center;
}

.el-carousel__item:nth-child(2n) {
  background-color: #99a9bf;
}

.el-carousel__item:nth-child(2n + 1) {
  background-color: #d3dce6;
}
</style>
