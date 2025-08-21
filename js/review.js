import { request } from './api.js';
import { showError } from './utils.js';

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

// 课程搜索功能
courseSearch.addEventListener('input', () => {
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
            showError(courseSearch, '搜索课程失败: ' + error.message);
        }
    }, 300);
});

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

// 星级评分
starRating.addEventListener('click', (e) => {
    if (e.target.tagName === 'SPAN') {
        const value = parseInt(e.target.getAttribute('data-value'));
        ratingValue.value = value;
        
        // 更新星星显示
        const stars = starRating.querySelectorAll('span');
        stars.forEach((star, index) => {
            star.textContent = index < value ? '★' : '☆';
            star.classList.toggle('active', index < value);
        });
    }
});

// 提交评价表单
reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!selectedCourseId) {
        showError(reviewForm, '请先选择课程');
        return;
    }
    
    const formData = {
        course_id: selectedCourseId,
        rating: parseFloat(ratingValue.value),
        difficulty: parseInt(document.getElementById('difficulty').value),
        grading: parseInt(document.getElementById('grading').value),
        harvest: parseInt(document.getElementById('harvest').value),
        content: document.getElementById('reviewContent').value.trim()
    };
    
    try {
        // 调用提交评价API
        const response = await request('/reviews', 'POST', {
            body: formData
        });
        
        // 提交成功后跳转
        window.location.href = `/course.html?id=${selectedCourseId}`;
    } catch (error) {
        showError(reviewForm, '提交评价失败: ' + error.message);
    }
});

/**
 * 在表单中显示错误消息
 * @param {HTMLElement} form - 表单元素
 * @param {string} message - 错误消息
 */
function showError(form, message) {
    // 移除旧的错误消息
    const oldError = form.querySelector('.error-message');
    if (oldError) oldError.remove();
    
    // 创建新的错误消息元素
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    // 插入到表单底部
    form.appendChild(errorElement);
}