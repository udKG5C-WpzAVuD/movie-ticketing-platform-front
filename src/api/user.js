import request from "@/utils/request";

export const userInfoService = () => request.get('/api/auth/userInfo')

//分页列表查询user
export const userPageList = (query) => request.get('/api/user/pageList', {params: query})

// 根据ID获取用户详情
export const getUserById = (id) => request.get(`/api/user/${id}`)

// 更新用户信息
export const updateUser = (data) => request.post('/api/user/update', data)