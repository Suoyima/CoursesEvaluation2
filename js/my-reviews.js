import { getUserInfo, authAPI } from './api.js';
import { formatDate, generateRatingStars, handleApiError } from './utils.js';

// DOM元素
const reviewsList = document.getElementById('reviewsList');
const userAvatar = document.getElementById('userAvatar');

// 初始化页面
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 检查登录状态
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = '/index.html';
            return;
        }
        
        // 加载用户评价
        await loadUserReviews();
        
    } catch (error) {
        showError(error);
    }
});

// 加载用户评价
async function loadUserReviews() {
    try {
        reviewsList.innerHTML = '<div class="loading">加载中...</div>';
        
        const userInfo = await getUserInfo();
        const response = await fetch('http://localhost:5000/api/user/reviews', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('获取评价列表失败');
        }
        
        const data = await response.json();
        
        if (data.reviews.length === 0) {
            reviewsList.innerHTML = `
                <div class="no-reviews">
                    <p>您还没有发布过任何评价</p>
                    <a href="/review.html" class="btn-primary" style="display: inline-block; margin-top: 20px;">
                        去发布评价
                    </a>
                </div>
            `;
            return;
        }
        
        renderReviews(data.reviews);
    } catch (error) {
        console.error('加载评价失败:', error);
        showError(new Error('加载评价失败: ' + error.message));
    }
}

// 渲染评价列表
function renderReviews(reviews) {
    reviewsList.innerHTML = '';
    
    reviews.forEach(review => {
        const reviewItem = document.createElement('div');
        reviewItem.className = 'review-item';
        reviewItem.dataset.id = review.id;
        
        reviewItem.innerHTML = `
            <div class="review-header">
                <span class="review-course">${review.course_name} (${review.department_name})</span>
                <div class="rating">${generateRatingStars(review.rating)}</div>
            </div>
            <div class="review-meta">
                难度: ${review.difficulty} | 给分: ${review.grading} | 收获: ${review.harvest}
            </div>
            <div class="review-content">
                ${review.content}
            </div>
            <div class="review-footer">
                <span class="date">发布于 ${formatDate(review.created_at)}</span>
                <button class="delete-btn">删除</button>
            </div>
        `;
        
        reviewsList.appendChild(reviewItem);
    });
    
    // 添加删除事件监听
    document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
        const reviewId = e.target.closest('.review-item').dataset.id;
        if (confirm('确定要删除这条评价吗？')) {
            try {
                const response = await fetch(`http://localhost:5000/api/reviews/${reviewId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || '删除失败');
                }
                
                // 重新加载列表
                await loadUserReviews();
                alert('评价删除成功！');
            } catch (error) {
                console.error('删除评价失败:', error);
                alert('删除评价失败: ' + error.message);
            }
        }
    });
});
}

// 显示错误
function showError(error) {
    reviewsList.innerHTML = `
        <div class="error-message">
            ${handleApiError(error)}
            <br>
            <button onclick="location.reload()" style="margin-top: 10px; padding: 5px 10px;">
                重新加载
            </button>
        </div>
    `;
}