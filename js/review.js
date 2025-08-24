import { request, setAuthToken, authAPI } from './api.js';

// DOM元素
const courseSearch = document.getElementById('courseSearch');
const courseResults = document.getElementById('courseResults');
const selectedCourse = document.getElementById('selectedCourse');
const reviewForm = document.getElementById('reviewForm');
const starRating = document.getElementById('ratingStars');
const ratingValue = document.getElementById('ratingValue');

// 全局状态
let selectedCourseId = null;
let searchTimeout = null;

// 初始化页面
document.addEventListener('DOMContentLoaded', async () => {
    // 检查登录状态
    const token = localStorage.getItem('authToken');
    if (!token) {
        alert('请先登录后再发布评价');
        window.location.href = '/index.html';
        return;
    }
    
    setAuthToken(token);
    
    // 初始化星级评分
    initStarRating();
    
    // 设置课程搜索事件
    courseSearch.addEventListener('input', handleCourseSearch);
    
    // 设置表单提交事件
    reviewForm.addEventListener('submit', handleReviewSubmit);
});

// 初始化星级评分
function initStarRating() {
    const stars = starRating.querySelectorAll('span');
    stars.forEach((star, index) => {
        star.addEventListener('mouseover', () => highlightStars(index));
        star.addEventListener('mouseout', resetStars);
        star.addEventListener('click', () => setRating(index + 1));
    });
    
    // 设置默认值
    setRating(5);
}

// 高亮星星
function highlightStars(index) {
    const stars = starRating.querySelectorAll('span');
    stars.forEach((star, i) => {
        star.textContent = i <= index ? '★' : '☆';
    });
}

// 重置星星显示
function resetStars() {
    const currentRating = parseInt(ratingValue.value);
    const stars = starRating.querySelectorAll('span');
    stars.forEach((star, i) => {
        star.textContent = i < currentRating ? '★' : '☆';
    });
}

// 设置评分
function setRating(value) {
    ratingValue.value = value;
    const stars = starRating.querySelectorAll('span');
    stars.forEach((star, i) => {
        star.textContent = i < value ? '★' : '☆';
    });
}

// 课程搜索功能
function handleCourseSearch() {
    clearTimeout(searchTimeout);
    
    const keyword = courseSearch.value.trim();
    if (keyword.length < 2) {
        courseResults.innerHTML = '';
        courseResults.style.display = 'none';
        return;
    }
    
    searchTimeout = setTimeout(async () => {
        try {
            const response = await request('/courses/selectable', 'GET', {
                query: { keyword }
            });
            
            displayCourseResults(response.courses);
        } catch (error) {
            showError('搜索课程失败: ' + error.message);
        }
    }, 300);
}

// 显示搜索结果
function displayCourseResults(courses) {
    courseResults.innerHTML = '';
    
    if (courses.length === 0) {
        courseResults.innerHTML = '<div class="course-result-item">没有找到相关课程</div>';
        courseResults.style.display = 'block';
        return;
    }
    
    courses.forEach(course => {
        const item = document.createElement('div');
        item.className = 'course-result-item';
        item.textContent = `${course.name} (${course.department})`;
        item.addEventListener('click', () => selectCourse(course));
        courseResults.appendChild(item);
    });
    
    courseResults.style.display = 'block';
}

// 选择课程
function selectCourse(course) {
    selectedCourseId = course.id;
    selectedCourse.innerHTML = `
        <strong>已选课程:</strong> ${course.name} (${course.department})
    `;
    selectedCourse.style.display = 'block';
    courseResults.style.display = 'none';
    courseSearch.value = '';
}

// 处理评价提交
async function handleReviewSubmit(e) {
    e.preventDefault();
    
    if (!selectedCourseId) {
        showError('请先选择课程');
        return;
    }
    
    const formData = {
        course_id: parseInt(selectedCourseId),
        rating: parseInt(ratingValue.value),
        difficulty: parseInt(document.getElementById('difficulty').value),
        grading: parseInt(document.getElementById('grading').value),
        harvest: parseInt(document.getElementById('harvest').value),
        content: document.getElementById('reviewContent').value.trim()
    };
    
    // 验证评分范围
    if (formData.rating < 1 || formData.rating > 5) {
        showError('评分必须在1-5之间');
        return;
    }
    
    // 验证内容长度
    if (formData.content.length < 10) {
        showError('评价内容至少需要10个字符');
        return;
    }
    
    try {
        const submitBtn = reviewForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="loading"></div> 提交中...';
        
        const response = await request('/reviews', 'POST', {
            body: formData
        });
        
        alert('评价提交成功！');
        window.location.href = `/course.html?id=${selectedCourseId}`;
    } catch (error) {
        console.error('提交失败详情:', error);
        
        let errorMessage = '提交评价失败';
        if (error.message.includes('Missing required fields')) {
            errorMessage = '请填写所有必填字段';
        } else if (error.message.includes('already reviewed')) {
            errorMessage = '您已经评价过该课程';
        } else if (error.message.includes('Course not found')) {
            errorMessage = '课程不存在';
        } else if (error.message.includes('评分必须在1-5之间')) {
            errorMessage = '评分必须在1-5之间';
        }
        
        showError(errorMessage);
        
        const submitBtn = reviewForm.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = '发布评价';
    }
}

// 显示错误消息 - 只保留这一个定义
function showError(message) {
    // 移除旧的错误消息
    const oldError = document.querySelector('.error-message');
    if (oldError) oldError.remove();
    
    // 创建新的错误消息元素
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    errorElement.style.color = '#cb2431';
    errorElement.style.padding = '10px';
    errorElement.style.marginBottom = '15px';
    errorElement.style.backgroundColor = '#ffeef0';
    errorElement.style.borderRadius = '6px';
    errorElement.style.border = '1px solid #f97583';
    
    // 插入到表单顶部
    reviewForm.insertBefore(errorElement, reviewForm.firstChild);
    
    // 3秒后自动消失
    setTimeout(() => {
        if (errorElement.parentNode) {
            errorElement.remove();
        }
    }, 3000);
}