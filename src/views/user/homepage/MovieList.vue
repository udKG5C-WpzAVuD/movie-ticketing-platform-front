<script setup>
import { ref } from 'vue';
import { ListAllFilm } from "@/api/homepage";
import { useRouter } from "vue-router";

const movies = ref([]);
const selectedMovies = ref([]);
const typeList = ["全部", "剧情", "科幻", "爱情", "动作", "喜剧", "恐怖", "悬疑", "犯罪", "冒险", "战争",
  "历史", "武侠", "传记", "古装", "同性", "灾难", "动画", "奇幻", "音乐", "其他"];
const languageList = ["全部", "中文普通话", "粤语", "英语", "日语", "意大利语", "德语", "法语", "西班牙语", "俄语", "印度语", "马来语", "其他"];
const selectType = ref("全部");
const selectLanguage = ref("全部");
const state = ref(""); // 存储用户输入的内容
const router = useRouter();

// 获取所有电影
const getFilms = () => {
  ListAllFilm().then(res => {
    movies.value = res.data;
    selectedMovies.value = res.data;
  });
};
getFilms();

// 跳转到电影详情页
const goToMovieInfo = (value) => {
  const selectedMovie = movies.value.find(movie => movie.id === value);
  sessionStorage.setItem('selectedMovie', JSON.stringify(selectedMovie));
  router.push({ path: "/user/movieInfo" });
};

// 类型筛选
const handleTypeSelect = (value) => {
  selectType.value = value;
  updateSelectedMovies(state.value);
};

// 语言筛选
const handleLanguageSelect = (value) => {
  selectLanguage.value = value;
  updateSelectedMovies(state.value);
};

// 统一更新 selectedMovies 的方法（结合类型、语言和搜索关键词）
const updateSelectedMovies = (searchKeyword = "") => {
  selectedMovies.value = movies.value.filter(movie => {
    // 类型筛选逻辑
    const matchesType =
        selectType.value === "全部" ||
        (selectType.value === "其他"
                ? !typeList.slice(1).some(type =>
                    movie.genre.split('/').map(g => g.trim()).includes(type)
                )
                : movie.genre.split('/').map(g => g.trim()).includes(selectType.value)
        );

    // 语言筛选逻辑
    const matchesLanguage =
        selectLanguage.value === "全部" ||
        (selectLanguage.value === "其他"
                ? !languageList.slice(1).includes(movie.language)
                : movie.language === selectLanguage.value
        );

    // 搜索关键词筛选（模糊匹配标题）
    const matchesKeyword =
        !searchKeyword ||
        movie.title.toLowerCase().includes(searchKeyword.toLowerCase());

    return matchesType && matchesLanguage && matchesKeyword;
  });
};

// 自动完成建议（下拉联想）
const querySearchAsync = (queryString, cb) => {
  if (!queryString) return cb([]);

  setTimeout(() => {
    const suggestions = movies.value
        .filter(movie => movie.title.toLowerCase().includes(queryString.toLowerCase()))
        .map(movie => ({ value: movie.title }));

    cb(suggestions);
  }, 500);
};

// 用户选择下拉选项
const handleSelect = (item) => {
  const film = movies.value.find(movie => movie.title === item.value);
  // 跳转到电影详情页
  goToMovieInfo(film.id);
};

// 点击搜索按钮
const handleSearch = () => {
  updateSelectedMovies(state.value); // 按当前输入框的内容搜索
};

// 点击取消按钮
const handleCancel = () => {
  state.value = ""; // 清空输入框
  updateSelectedMovies(); // 重置搜索结果
};

</script>

<template>
  <div class="films">
    <!-- 类型和语言筛选标签 -->
    <div class="tags-panel">
      <ul class="tags-lines">
        <li class="tags-line">
          <div class="tags-title">类型 :</div>
          <ul class="tags">
            <li
                v-for="item in typeList"
                :key="item"
                :class="selectType === item ? 'active' : ''"
                @click="handleTypeSelect(item)"
            >
              {{ item }}
            </li>
          </ul>
        </li>
        <li class="tags-line">
          <div class="tags-title">语言 :</div>
          <ul class="tags">
            <li
                v-for="item in languageList"
                :key="item"
                :class="selectLanguage === item ? 'active' : ''"
                @click="handleLanguageSelect(item)"
            >
              {{ item }}
            </li>
          </ul>
        </li>
      </ul>
    </div>
    <!-- 搜索框 + 搜索/取消按钮 -->
    <div class="header-search" style="padding-top: 30px;">
      <el-row :gutter="10" align="middle">
        <el-col :span="18">
          <el-autocomplete
              style="width: 100%"
              v-model="state"
              :fetch-suggestions="querySearchAsync"
              placeholder="请输入电影名"
              @select="handleSelect"
              clearable
          />
        </el-col>
        <el-col :span="3">
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </el-col>
        <el-col :span="3">
          <el-button @click="handleCancel">取消</el-button>
        </el-col>
      </el-row>
    </div>
    <!-- 电影列表 -->
    <div>
      <el-row :gutter="20" style="padding-top: 40px;">
        <el-col
            style="padding-bottom: 40px; text-align: center;"
            v-for="(item, index) in selectedMovies"
            :key="index"
            :span="4"
        >
          <el-card shadow="hover" style="padding: 0">
            <img
                style="width: 100%; height: 250px; padding-bottom: 10px"
                :src="item.posterUrl"
                alt=""
                @click="goToMovieInfo(item.id)"
            />
            <span class="s" @click="goToMovieInfo(item.id)">{{ item.title }}</span>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style scoped>
@import "@/assets/css/movie-list.css";

.films {
  padding: 20px 220px;
}

.header-search {
  margin-bottom: 20px;
}

>>> .el-card__body {
  padding: 0 0 10px;
}

.s {
  margin-bottom: 10px;
  padding: 0 8px;
  letter-spacing: 1px;
  color: coral;
  text-align: center;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
