import { request, authAPI } from './api.js';
import { formatDate, generateRatingStars } from './utils.js';

// 获取URL参数
function getUrlParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

// DOM元素
const courseTitle = document.getElementById('courseTitle');
const courseDepartment = document.getElementById('courseDepartment');
const courseCredit = document.getElementById('courseCredit');
const avgRating = document.getElementById('avgRating');
const reviewCount = document.getElementById('reviewCount');
const avgDifficulty = document.getElementById('avgDifficulty');
const reviewsList = document.getElementById('reviewsList');
const reviewFormContainer = document.getElementById('reviewFormContainer');
const reviewForm = document.getElementById('reviewForm');
const formError = document.getElementById('formError');

// 初始化页面
document.addEventListener('DOMContentLoaded', async () => {
    const courseId = getUrlParam('id');
    if (!courseId) {
        alert('无效的课程ID');
        window.location.href = '/index.html';
        return;
    }
    
    try {
        // 加载课程详情
        await loadCourseDetail(courseId);
        
        // 检查登录状态
        const token = localStorage.getItem('authToken');
        if (token) {
            reviewFormContainer.style.display = 'block';
        }
        
    } catch (error) {
        console.error('初始化失败:', error);
        alert('加载课程详情失败: ' + error.message);
    }
});

// 加载课程详情
async function loadCourseDetail(courseId) {
    try {
        const response = await request(`/courses/${courseId}`, 'GET');
        
        // 更新课程信息
        courseTitle.textContent = response.course.name;
        courseDepartment.textContent = response.course.department_name;
        courseCredit.textContent = response.course.credit;
        avgRating.textContent = response.course.avg_rating.toFixed(1);
        reviewCount.textContent = response.course.review_count;
        avgDifficulty.textContent = response.course.avg_difficulty.toFixed(1);
        
        // 渲染评价列表
        renderReviews(response.reviews);
        
    } catch (error) {
        console.error('加载课程详情失败:', error);
        reviewsList.innerHTML = `
            <div class="error-message">
                加载课程详情失败: ${error.message}
                <button onclick="location.reload()">重试</button>
            </div>
        `;
        throw error;
    }
}

// 渲染评价列表
function renderReviews(reviews) {
    if (reviews.length === 0) {
        reviewsList.innerHTML = '<p>暂无评价</p>';
        return;
    }
    
    reviewsList.innerHTML = '';
    reviews.forEach(review => {
        const reviewItem = document.createElement('div');
        reviewItem.className = 'review-item';
        reviewItem.innerHTML = `
            <div class="review-header">
                <span class="review-user">${review.user_name || '匿名用户'}</span>
                <span class="review-date">${formatDate(review.created_at)}</span>
            </div>
            <div class="review-rating">${generateRatingStars(review.rating)}</div>
            <div class="review-meta">
                难度: ${review.difficulty} | 给分: ${review.grading} | 收获: ${review.harvest}
            </div>
            <div class="review-content">
                ${review.content}
            </div>
        `;
        reviewsList.appendChild(reviewItem);
    });
}

// 提交评价
if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const courseId = getUrlParam('id');
        if (!courseId) {
            alert('无效的课程ID');
            return;
        }
        
        const formData = {
            rating: document.getElementById('rating').value,
            difficulty: document.getElementById('difficulty').value,
            grading: document.getElementById('grading').value,
            harvest: document.getElementById('harvest').value,
            content: document.getElementById('content').value.trim()
        };
        
        // 验证表单
        if (!formData.rating || !formData.difficulty || !formData.grading || !formData.harvest || !formData.content) {
            formError.textContent = '请填写所有必填字段';
            return;
        }
        
        if (formData.content.length < 5) {
            formError.textContent = '评价内容至少需要5个字符';
            return;
        }
        
        try {
            formError.textContent = '';
            const submitBtn = reviewForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = '提交中...';
            
            await request(`/courses/${courseId}/reviews`, 'POST', {
                body: formData
            });
            
            alert('评价提交成功！');
            window.location.reload();
            
        } catch (error) {
            console.error('提交评价失败:', error);
            formError.textContent = '提交评价失败: ' + error.message;
            const submitBtn = reviewForm.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = '提交评价';
        }
    });
}