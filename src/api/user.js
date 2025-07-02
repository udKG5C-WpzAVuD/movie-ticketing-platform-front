import request from "@/utils/request";

export const userInfoService = () => request.get('/api/auth/getInfo')

export const login = (user) => request.post('/api/user/login', user)

//分页列表查询user
export const userPageList = (query) => request.get('/api/user/pageList', {params: query})

// 根据ID获取用户详情
export const getUserById = (id) => request.get(`/api/user/${id}`)

// 更新用户信息
export const updateUser = (data) => request.post('/api/user/update', data)
export const addMovie =(movie)=>request.post('/api/movies/savemovie',movie)
export const moviePageList=(query)=>request.get('/api/movies/moviePageList', {params:query})
export const updateMovie=(movie)=>request.put('/api/movies/updateMovie',movie)

export const addsessions = (data) => {
    return fetch('/api/sessions/addsessions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(res => res.json())
}
export const getSessions=()=>request.get('/api/sessions/getSessions')
export const deletescreen=(screen)=>request.put('/api/sessions/deletescreen',screen)
export const addLogs=(movie_logs)=>request.post('/api/adminMovieOperationLogs/addLogs',movie_logs)
export const getSeats=(sessionId)=>request.get('/api/seats/getseats',{params:{sessionId}})
// 新增：根据ID获取场次详情
export const getSessionById = (id) => request.get(`/api/sessions/${id}`)

// 新增：取消订单
export const cancelOrder = (orderNo) => request.post('/api/orders/cancel', { orderNo })

// 获取用户数据
export const getUsers = () => request.get('/api/user/getUsers')
// 获取用户活跃度数据
export const getUserActivity = () => request.get('/api/userActivity/getUserActivity')
export const updateSeats=(seats)=>request.post('/api/seats/updateSeats',seats)
export const getOrders=(query)=>request.get('/api/orders/getOrders',{params:query})
export const searchOrders=(params)=>request.get('/api/orders/searchOrders',{params})
export const fetchOrders=()=>request.get('/api/orders/fetchOrders')
export const getSessionsByid=(params)=>request.get('/api/sessions/getSessionsByid',{params})
export const getMoviesid=(params)=>request.get('/api/movies/getMoviesid',{params})
export const deleteSeats=(seatssession)=>request.put('/api/seats/deleteSeats',seatssession)
export const refundOrder = (params) => request.put(`/api/orders/refundOrder?id=${params.id}`);
export const addorderoperation=(operation)=>request.post('/api/orderOperation/addorderoperation',operation)