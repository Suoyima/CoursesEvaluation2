// API请求封装
const API_BASE_URL = '/api';

/**
 * 获取最新课程评价列表
 * @param {number} limit - 返回的评价数量
 * @param {number} offset - 分页偏移量
 * @returns {Promise} 包含评价列表的Promise
 */
export const getLatestReviews = async (limit = 10, offset = 0) => {
    try {
        const response = await fetch(`${API_BASE_URL}/reviews/latest?limit=${limit}&offset=${offset}`);
        if (!response.ok) {
            throw new Error('获取评价列表失败');
        }
        return await response.json();
    } catch (error) {
        console.error('获取最新评价列表出错:', error);
        throw error;
    }
};

/**
 * 获取筛选条件
 * @returns {Promise} 包含筛选条件的Promise
 */
export const getFilterOptions = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/filters`);
        if (!response.ok) {
            throw new Error('获取筛选条件失败');
        }
        return await response.json();
    } catch (error) {
        console.error('获取筛选条件出错:', error);
        throw error;
    }
};

/**
 * 搜索课程
 * @param {Object} params - 搜索参数
 * @returns {Promise} 包含搜索结果Promise
 */
export const searchCourses = async (params = {}) => {
    try {
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`${API_BASE_URL}/courses/search?${queryString}`);
        if (!response.ok) {
            throw new Error('搜索课程失败');
        }
        return await response.json();
    } catch (error) {
        console.error('搜索课程出错:', error);
        throw error;
    }
};

/**
 * 获取课程详情
 * @param {number} id - 课程ID
 * @returns {Promise} 包含课程详情的Promise
 */
export const getCourseDetail = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/courses/${id}`);
        if (!response.ok) {
            throw new Error('获取课程详情失败');
        }
        return await response.json();
    } catch (error) {
        console.error('获取课程详情出错:', error);
        throw error;
    }
};

/**
 * 获取课程评价列表
 * @param {number} id - 课程ID
 * @param {number} limit - 每页数量
 * @param {number} offset - 偏移量
 * @returns {Promise} 包含评价列表的Promise
 */
export const getCourseReviews = async (id, limit = 10, offset = 0) => {
    try {
        const response = await fetch(`${API_BASE_URL}/courses/${id}/reviews?limit=${limit}&offset=${offset}`);
        if (!response.ok) {
            throw new Error('获取课程评价失败');
        }
        return await response.json();
    } catch (error) {
        console.error('获取课程评价出错:', error);
        throw error;
    }
};

/**
 * 获取当前用户信息
 * @returns {Promise} 包含用户信息的Promise
 */
export const getUserInfo = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/user/info`);
        if (!response.ok) {
            throw new Error('获取用户信息失败');
        }
        return await response.json();
    } catch (error) {
        console.error('获取用户信息出错:', error);
        throw error;
    }
};