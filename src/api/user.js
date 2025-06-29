import request from "@/utils/request";

export const userInfoService = () => request.get('/api/auth/getInfo')

export const login = (user) => request.post('/api/user/login', user)
