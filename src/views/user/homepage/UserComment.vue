<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { addComment, getComments } from '@/api/homepage'
import {useUserInfoStore} from "@/stores/userInfo";
import {Memo} from "@element-plus/icons-vue";

const userInfoStore = useUserInfoStore();
const comments = ref([])
const loading = ref(false)
const newComment = ref('')
const selectedCategory = ref('SUGGESTION')
const categories = ref([])
const pagination = ref({
  currentPage: 1,
  pageSize: 5,
  total: 0
})

// 默认留言分类
categories.value = [
  { value: 'SUGGESTION', label: '建议' },
  { value: 'COMPLAINT', label: '投诉' },
  { value: 'CONSULT', label: '咨询' },
  { value: 'OTHER', label: '其他' }
]

// 获取留言列表
const fetchComments = async () => {
  try {
    loading.value = true
    const params = {
      pageNo: pagination.value.currentPage,
      pageSize: pagination.value.pageSize,
      total: 0,
      id: userInfoStore.userInfo.id
    }
    const res = await getComments(params)
    comments.value = res.data.records || []
    pagination.value.total = res.data.total || 0
  } catch (error) {
    ElMessage.error('获取留言列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 提交新留言
const submitComment = async () => {
  if (!newComment.value.trim()) {
    ElMessage.warning('留言内容不能为空')
    return
  }

  try {
    const uid = userInfoStore.userInfo.id
    const content = newComment.value.trim()
    const category = selectedCategory.value

    await addComment(uid, content, category)
    ElMessage.success('留言提交成功')
    newComment.value = ''
    await fetchComments() // 刷新列表
  } catch (error) {
    ElMessage.error('留言提交失败')
    console.error(error)
  }
}

// 分页变化
const handlePageChange = (page) => {
  pagination.value.currentPage = page
  fetchComments()
}

// 获取分类标签类型（用于不同分类显示不同颜色）
const getCategoryTagType = (category) => {
  const map = {
    SUGGESTION: '',
    COMPLAINT: 'danger',
    CONSULT: 'info',
    OTHER: 'warning'
  }
  return map[category] || ''
}

// 获取分类显示文本
const getCategoryLabel = (category) => {
  const map = {
    SUGGESTION: '建议',
    COMPLAINT: '投诉',
    CONSULT: '咨询',
    OTHER: '其他'
  }
  return map[category] || '其他'
}

// 初始化加载数据
onMounted(() => {
  fetchComments()
})
</script>

<template>
  <el-card class="comment-container" style="margin-top: 20px">
    <template #header>
      <div class="comment-header">
        <h1>留言板 <el-icon><Memo /></el-icon></h1>
        <span class="header-desc">您的反馈对我们很重要</span>
      </div>
    </template>

    <!-- 留言表单 -->
    <div class="comment-form">
      <el-form label-position="top">
        <el-form-item label="留言分类">
          <el-select
              v-model="selectedCategory"
              placeholder="请选择留言分类"
              style="width: 100%"
          >
            <el-option
                v-for="item in categories"
                :key="item.value"
                :label="item.label"
                :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="留言内容">
          <el-input
              v-model="newComment"
              type="textarea"
              :rows="6"
              placeholder="请输入您的留言内容..."
              maxlength="255"
              show-word-limit
              resize="none"
          />
        </el-form-item>
      </el-form>

      <div class="form-actions">
        <el-button
            type="primary"
            @click="submitComment"
            :loading="loading"
            :disabled="!newComment.trim()"
        >
          提交留言
        </el-button>
      </div>
    </div>

    <!-- 留言列表 -->
    <div class="comment-list">
      <el-divider content-position="left">我的留言</el-divider>

      <el-skeleton :loading="loading" animated :count="3">
        <template #default>
          <div v-if="comments.length === 0" class="empty-tip">
            <el-empty description="暂无留言，快来发表第一条吧~" />
          </div>

          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <div class="comment-content">
              <div class="user-info">
                <el-avatar :size="32" icon="User" />
                <span class="username">{{ userInfoStore.userInfo.username }}</span>
                <el-tag
                    :type="getCategoryTagType(comment.category)"
                    size="small"
                    class="category-tag"
                >
                  {{ getCategoryLabel(comment.category) }}
                </el-tag>
                <el-tag
                    :type="comment.status === 'SOLVED' ? 'success' : 'warning'"
                    size="small"
                    class="status-tag"
                >
                  {{ comment.status === 'SOLVED' ? '已处理' : '待处理' }}
                </el-tag>
              </div>
              <div class="content-text">{{ comment.content }}</div>
              <div class="comment-time">
                {{ new Date(comment.createTime).toLocaleString() }}
              </div>
            </div>

            <div v-if="comment.reply" class="comment-reply">
              <el-divider border-style="dashed" />
              <div class="reply-content">
                <el-avatar :size="24" icon="ChatLineRound" class="reply-avatar" />
                <div class="reply-text">
                  <div class="reply-header">
                    <span class="reply-user">平台回复</span>
                    <span class="reply-time">{{ new Date(comment.updateTime).toLocaleString() }}</span>
                  </div>
                  {{ comment.reply }}
                </div>
              </div>
            </div>
          </div>
        </template>
      </el-skeleton>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[5, 10, 20]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchComments"
          @current-change="handlePageChange"
          :disabled="loading"
      />
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.comment-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;

  .comment-header {
    h1 {
      margin-bottom: 8px;
      color: var(--el-text-color-primary);
    }

    .header-desc {
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }

  .comment-form {
    margin-bottom: 30px;

    .form-actions {
      margin-top: 15px;
      text-align: right;
    }
  }

  .comment-list {
    .empty-tip {
      padding: 40px 0;
    }

    .comment-item {
      padding: 15px 0;
      border-bottom: 1px solid var(--el-border-color-light);

      &:last-child {
        border-bottom: none;
      }

      .comment-content {
        .user-info {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          flex-wrap: wrap;

          .username {
            margin-left: 10px;
            margin-right: 10px;
            font-weight: 500;
          }

          .category-tag {
            margin-right: 10px;
          }
        }

        .content-text {
          padding: 8px 0;
          line-height: 1.6;
          color: var(--el-text-color-regular);
        }

        .comment-time {
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }

      .comment-reply {
        margin-top: 15px;
        padding: 10px 15px;
        background-color: var(--el-color-primary-light-9);
        border-radius: 4px;

        .reply-content {
          display: flex;

          .reply-avatar {
            margin-right: 10px;
            margin-top: 5px;
            flex-shrink: 0;
          }

          .reply-text {
            flex: 1;

            .reply-header {
              margin-bottom: 5px;

              .reply-user {
                font-weight: 500;
                color: var(--el-color-primary);
                margin-right: 10px;
              }

              .reply-time {
                font-size: 12px;
                color: var(--el-text-color-secondary);
              }
            }
          }
        }
      }
    }
  }

  .pagination-container {
    margin-top: 30px;
    display: flex;
    justify-content: center;
  }
}
</style>