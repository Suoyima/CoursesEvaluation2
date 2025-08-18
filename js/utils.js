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
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '';
    for (let i = 0; i < fullStars; i++) {
        stars += '★';
    }
    if (hasHalfStar) {
        stars += '☆';
    }
    for (let i = 0; i < emptyStars; i++) {
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
    return error.message || '请求失败，请稍后重试';
};