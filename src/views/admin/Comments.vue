<script setup lang="ts">
import { onMounted, ref } from "vue";
import avatar from '../../assets/default.png'
import { ElMessage, ElMessageBox } from "element-plus";
import { getAllComments, replyComment, updateCommentStatus } from "@/api/homepage";
import { getUserById } from "@/api/user";

// 类型定义
interface Comment {
  id: number;
  userId: number;
  content: string;
  category: string;
  status: string;
  createTime: string;
  reply: string;
  updateTime: string;
}

interface User {
  id: number;
  username: string;
  avatarUrl: string;
}

// 响应式数据
const comments = ref<Comment[]>([]);
const selectedComments = ref<Comment[]>([]);
const users = ref<Record<number, User>>({});
const loading = ref(false);
const replyDialogVisible = ref(false);
const currentReplyId = ref<number | null>(null);
const replyContent = ref("");
const pagination = ref({
  currentPage: 1,
  pageSize: 5,
  total: 0,
});

interface FilterForm {
  category: { value: string; label: string } | null;
  status: { value: string; label: string } | null;
}

// 筛选条件
const filterForm = ref({
  category: null, // 留言类型（SUGGESTION/COMPLAINT/CONSULT/OTHER）
  status: null, // 留言状态（PENDING/SOLVED）
});

// 默认留言分类
const categories = ref([
  { value: "SUGGESTION", label: "建议" },
  { value: "COMPLAINT", label: "投诉" },
  { value: "CONSULT", label: "咨询" },
  { value: "OTHER", label: "其他" },
]);

// 留言状态
const statusOptions = ref([
  { value: "UNSOLVED", label: "待处理" },
  { value: "SOLVED", label: "已解决" },
]);

// 获取留言列表及对应用户信息
const fetchComments = async () => {
  try {
    loading.value = true;
    const params = {
      pageNo: pagination.value.currentPage,
      pageSize: pagination.value.pageSize,
      category: filterForm.value.category?.value || undefined,
      status: filterForm.value.status?.value || undefined,
    };
    const res = await getAllComments(params);
    comments.value = res.data?.records || [];
    selectedComments.value = res.data?.records || [];
    pagination.value.total = res.data?.total || 0;

    // 预加载所有用户信息
    const userIds = [...new Set(comments.value.map((comment) => comment.userId))];
    await Promise.all(
        userIds.map((id) => {
          if (!users.value[id]) {
            return getUserById(id).then((res) => {
              users.value[id] = res.data;
            });
          }
          return Promise.resolve();
        }),
    );
  } catch (error) {
    ElMessage.error("获取留言列表失败");
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 清除筛选方法
const clearFilters = () => {
  filterForm.value = {
    category: null,
    status: null,
  };
  pagination.value.currentPage = 1;
  fetchComments();
};

// 分页变化
const handlePageChange = (page: number) => {
  pagination.value.currentPage = page;
  fetchComments();
};

const handleFilterChange = () => {
  pagination.value.currentPage = 1; // 重置到第一页
  fetchComments();
};

// 获取分类标签类型（用于不同分类显示不同颜色）
const getCategoryTagType = (category: string) => {
  const map = {
    SUGGESTION: "",
    COMPLAINT: "danger",
    CONSULT: "info",
    OTHER: "warning",
  };
  return map[category] || "";
};

// 获取分类显示文本
const getCategoryLabel = (category: string) => {
  const map = {
    SUGGESTION: "建议",
    COMPLAINT: "投诉",
    CONSULT: "咨询",
    OTHER: "其他",
  };
  return map[category] || "其他";
};

// 处理留言（切换状态）
const handleSolveComment = async (commentId: number) => {
  try {
    await ElMessageBox.confirm(
        `确定要将留言状态改为 "已处理" 吗？`,
        "提示",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        },
    );
    const id = commentId
    await updateCommentStatus(id);
    ElMessage.success("操作成功");
    fetchComments(); // 刷新列表
  } catch (error) {
    console.error(error);
  }
};

// 打开回复对话框
const openReplyDialog = (commentId: number) => {
  currentReplyId.value = commentId;
  replyContent.value = "";
  replyDialogVisible.value = true;
};

// 提交回复
const submitReply = async () => {
  if (!currentReplyId.value || !replyContent.value.trim()) {
    ElMessage.warning("回复内容不能为空");
    return;
  }
  try {
    const id = currentReplyId.value
    const reply = replyContent.value
    await replyComment(id, reply);
    ElMessage.success("回复成功");
    replyDialogVisible.value = false;
    fetchComments(); // 刷新列表
  } catch (error) {
    ElMessage.error("回复失败");
    console.error(error);
  }
};

// 初始化加载数据
onMounted(() => {
  fetchComments();
});
</script>

<template>
  <div>
    <el-card>
      <!-- 筛选区域 -->
      <div class="filter-container">
        <el-form :inline="true" :model="filterForm" class="filter-form">
          <el-form-item label="留言类型" class="filter-item">
            <el-select
                v-model="filterForm.category"
                placeholder="全部"
                clearable
                @change="handleFilterChange"
                style="width: 180px"
            >
              <el-option
                  v-for="item in categories"
                  :key="item.value"
                  :label="item.label"
                  :value="item"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="处理状态" class="filter-item">
            <el-select
                v-model="filterForm.status"
                placeholder="全部"
                clearable
                @change="handleFilterChange"
                style="width: 180px"
            >
              <el-option
                  v-for="item in statusOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item"
              />
            </el-select>
          </el-form-item>
          <el-form-item class="filter-actions">
            <el-button @click="clearFilters" :disabled="!filterForm.category && !filterForm.status">
              清除筛选
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 留言列表 -->
      <div class="comment-list">
        <el-divider content-position="left">留言列表</el-divider>

        <el-skeleton :loading="loading" animated :count="3">
          <template #default>
            <div v-if="selectedComments.length === 0" class="empty-tip">
              <el-empty description="暂无留言，请鼓励用户多发留言吧~" />
            </div>

            <div v-for="comment in selectedComments" :key="comment.id" class="comment-item">
              <div class="comment-content">
                <div class="user-info">
                  <el-avatar :src="users[comment.userId]?.avatarUrl ? users[comment.userId]?.avatarUrl : avatar" :size="32" class="avatar"/>
                  <span class="username">
                    用户 {{ users[comment.userId]?.username || "加载中..." }}
                  </span>
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
                    {{ comment.status === "SOLVED" ? "已处理" : "待处理" }}
                  </el-tag>
                </div>
                <div class="content-text">{{ comment.content }}</div>
                <div class="comment-time">
                  {{ new Date(comment.createTime).toLocaleString() }}
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="comment-actions">
                <el-button
                    type="primary"
                    size="small"
                    @click="openReplyDialog(comment.id)"
                    :disabled="!!comment.reply">
                  回复
                </el-button>
                <el-button
                    type="success"
                    size="small"
                    @click="handleSolveComment(comment.id)"
                    :disabled="comment.status === 'SOLVED'">
                  {{ comment.status === "SOLVED" ? "已处理" : "处理" }}
                </el-button>
              </div>

              <!-- 回复内容 -->
              <div v-if="comment.reply" class="comment-reply">
                <el-divider border-style="dashed" />
                <div class="reply-content">
                  <el-avatar :size="24" icon="ChatLineRound" class="reply-avatar" />
                  <div class="reply-text">
                    <div class="reply-header">
                      <span class="reply-user">平台回复</span>
                      <span class="reply-time">
                        {{ new Date(comment.updateTime || "").toLocaleString() }}
                      </span>
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

    <!-- 回复对话框 -->
    <el-dialog
        v-model="replyDialogVisible"
        title="回复留言"
        width="50%"
        :close-on-click-modal="false"
    >
      <el-input
          v-model="replyContent"
          type="textarea"
          :rows="5"
          placeholder="请输入回复内容"
      />
      <template #footer>
        <el-button @click="replyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReply">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.filter-container {
  margin-bottom: 20px;
  .filter-form {
    display: flex;
    align-items: center;
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
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>