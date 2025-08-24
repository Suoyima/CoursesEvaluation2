/**
 * 格式化日期
 * @param {string} dateString - ISO日期字符串
 * @returns {string} 格式化后的日期
 */
export const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minute = 60 * 1000;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;
    
    if (diff < minute) {
        return '刚刚';
    } else if (diff < hour) {
        return `${Math.floor(diff / minute)}分钟前`;
    } else if (diff < day) {
        return `${Math.floor(diff / hour)}小时前`;
    } else if (diff < week) {
        return `${Math.floor(diff / day)}天前`;
    } else {
        return date.toLocaleDateString();
    }
};

/**
 * 生成评分星星
 * @param {number} rating - 评分(0-5)
 * @returns {string} 星星HTML
 */
export const generateRatingStars = (rating) => {
    const fullStars = Math.floor(rating);
    let stars = '';
    
    // 添加实心星
    for (let i = 0; i < fullStars; i++) {
        stars += '★';
    }
    
    // 添加空心星
    for (let i = fullStars; i < 5; i++) {
        stars += '☆';
    }
    
    return stars;
};

/**
 * 处理API错误
 * @param {Error} error - 错误对象
 * @returns {string} 错误消息
 */
export const handleApiError = (error) => {
    console.error('API请求出错:', error);
    
    if (error.message.includes('Failed to fetch')) {
        return '网络连接失败，请检查网络设置';
    } else if (error.message.includes('401')) {
        return '登录已过期，请重新登录';
    } else {
        return error.message || '请求失败，请稍后重试';
    }
};