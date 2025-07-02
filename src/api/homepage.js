import request from "@/utils/request";

export const ListAllFilm = () => request.get('/api/homepage/filmList')

export const ListHots = () => request.get('/api/homepage/hotList')

export const UpdateLikes = (id, isStarClicked) =>
    request.patch('/api/homepage/updateLikes', { id, isStarClicked }, {
        headers: {
            'Content-Type': 'application/json' // 明确指定 JSON 格式
        }
    });

export const AddLike = (uid, mid) => request.post('/api/likes/addLike', { uid, mid })

export const DeleteLike = (uid, mid) => request.delete('/api/likes/deleteLike', { params: { uid, mid } })

export const Getlike = (uid, mid) => request.get('/api/likes/getLike', { params: { uid, mid } })

export const getComments = (params) => request.get('/api/comment/getComments', {params: params})

export const addComment = (uid, content, category) => request.post('/api/comment/addComment', { uid, content, category })

export const getUnsolvedComments = () => request.get('/api/comment/getUnsolvedComments')

export const getAllComments = (params) => request.get('/api/comment/getAllComments', {params: params})

export const replyComment = (id, reply) => request.post('/api/comment/updateReply', {id, reply})

export const updateCommentStatus = (id) => request.post('/api/comment/updateStatus', { id });
