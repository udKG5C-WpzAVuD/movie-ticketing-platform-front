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
