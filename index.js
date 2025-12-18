// 初始化 Supabase
const SUPABASE_URL = 'https://hjrfufuyivgddqpzdrzp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqcmZ1ZnV5aXZnZGRxcHpkcnpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MDU3NTAsImV4cCI6MjA3OTk4MTc1MH0.EyFBzpiBuOy9Cm9nwNB-_c7j77Ny8E1F13ltB3BXojs';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 更新访问计数
async function updateVisitCount() {
    try {
        const { error } = await supabaseClient.rpc('increment_visit_count');
        if (error) {
            console.error('更新访问计数失败:', error);
        }
    } catch (err) {
        console.error('访问计数异常:', err);
    }
}

let currentTab = 'view';

// 打开留言板
function openMessageBoard() {
    document.getElementById('messageModal').classList.add('active');
    if (currentTab === 'view') {
        loadMessages();
    }
}

// 关闭留言板
function closeMessageBoard(event) {
    if (!event || event.target.id === 'messageModal') {
        document.getElementById('messageModal').classList.remove('active');
    }
}

// 切换标签
function switchTab(tab) {
    currentTab = tab;
    
    // 更新标签按钮状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.tab-btn').classList.add('active');
    
    // 切换显示内容
    const messageList = document.getElementById('messageList');
    const messageForm = document.getElementById('messageForm');
    
    if (tab === 'view') {
        messageList.style.display = 'block';
        messageForm.style.display = 'none';
        loadMessages();
    } else {
        messageList.style.display = 'none';
        messageForm.style.display = 'block';
    }
}

// 加载留言
async function loadMessages() {
    const messageList = document.getElementById('messageList');
    messageList.innerHTML = `
        <div class="empty-state">
            <i class="bi bi-hourglass-split"></i>
            <p>加载中...</p>
        </div>
    `;
    
    try {
        const { data, error } = await supabaseClient
            .from('messages')
            .select('*')
            .eq('is_approved', true)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            messageList.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-chat-dots"></i>
                    <p>暂无留言，来写第一条吧！</p>
                </div>
            `;
            return;
        }
        
        messageList.innerHTML = data.map(msg => {
            const date = new Date(msg.created_at);
            const formattedDate = date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            return `
                <div class="message-item">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="width: 32px; height: 32px; border-radius: 16px; background: linear-gradient(135deg, #8d5a2a 0%, #a67c52 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 0.9rem;">
                                ${msg.username.charAt(0).toUpperCase()}
                            </div>
                            <span style="font-weight: 500; color: #8d5a2a;">${escapeHtml(msg.username)}</span>
                        </div>
                        <span style="font-size: 0.75rem; color: #9ca3af;">
                            <i class="bi bi-clock"></i> ${formattedDate}
                        </span>
                    </div>
                    <p style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(msg.content)}</p>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('加载留言失败:', error);
        messageList.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-exclamation-triangle"></i>
                <p>加载失败，请稍后重试</p>
            </div>
        `;
    }
}

// 提交留言
async function submitMessage() {
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const content = document.getElementById('content').value.trim();
    
    if (!username || !content) {
        alert('请填写昵称和留言内容');
        return;
    }
    
    // 验证邮箱格式（如果填写了）
    if (email && !isValidEmail(email)) {
        alert('请输入有效的邮箱地址');
        return;
    }
    
    const submitBtn = event.target;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> 提交中...';
    
    try {
        const { data, error } = await supabaseClient
            .from('messages')
            .insert([
                {
                    username: username,
                    email: email || null,
                    content: content,
                    is_approved: false
                }
            ]);
        
        if (error) throw error;
        
        // 清空表单
        document.getElementById('username').value = '';
        document.getElementById('email').value = '';
        document.getElementById('content').value = '';
        
        // 显示成功消息
        showToast('✓ 留言提交成功，等待审核后显示');
        
        // 切换到查看标签
        setTimeout(() => {
            document.querySelectorAll('.tab-btn')[0].click();
        }, 1500);
        
    } catch (error) {
        console.error('提交留言失败:', error);
        showToast('✗ 提交失败，请稍后重试', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-send"></i> <span>提交留言</span>';
    }
}

// HTML 转义函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 验证邮箱
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 显示提示消息
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.textContent = message;
    const bgColor = type === 'success' ? '#8d5a2a' : '#dc2626';
    toast.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: ${bgColor}; color: white; padding: 16px 32px; border-radius: 28px; font-size: 15px; z-index: 9999; box-shadow: 0 8px 24px rgba(0,0,0,0.2); animation: fadeInOut 3s ease-in-out;`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

let dhammaData = [];
let linksData = LINKS_DATA;
let currentPage = 0;
let currentFilter = 'all';
const ITEMS_PER_PAGE = 5;

// 搜索相关变量
let searchKeyword = '';
let filteredDhammaData = [];
let isSearching = false;

// 随机显示相关变量
let randomIndices = [];

// 生成随机索引数组
function generateRandomIndices(dataLength) {
    const indices = Array.from({ length: dataLength }, (_, i) => i);
    // Fisher-Yates 洗牌算法
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
}

// 页面加载后初始化
function initPage() {
    // 显示最新法语
    displayLatestDhamma();
    
    // 生成随机索引(仅在非搜索模式下)
    if (!isSearching) {
        randomIndices = generateRandomIndices(dhammaData.length);
    }
    
    // 初始化法语显示
    displayDhamma();
    
    // 显示书籍
    displayBooks();
    
    // 初始化分类过滤器
    initTypeFilters();
    
    // 显示链接
    displayLinks();
}

// 显示最新法语
function displayLatestDhamma(data = null) {
    // 如果提供了 data 参数，使用它；否则使用 dhammaData
    const sourceData = data || dhammaData;
    if (!sourceData || sourceData.length === 0) return;
    
    const latestIndex = sourceData.length - 1;
    const latestItem = sourceData[latestIndex];
    const text = latestItem.sentence || '';
    const url = latestItem.url || '';
    
    // 更新法语编号 (如果使用 daily_dhamma，显示 "今日")
    const numberEl = document.getElementById('latest-number');
    if (data) {
        numberEl.textContent = '今日';
    } else {
        numberEl.textContent = latestIndex + 1;
    }
    
    // 更新法语内容 (支持HTML标签)
    document.getElementById('latest-dhamma-text').innerHTML = text;
    
    // 存储纯文本用于复制
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    window.latestDhammaText = tempDiv.textContent || tempDiv.innerText || text;
    
    // 如果有链接，显示"阅读更多"按钮
    const readMoreBtn = document.getElementById('latest-read-more');
    if (url && url !== '') {
        readMoreBtn.href = url;
        readMoreBtn.style.display = 'inline-flex';
    } else {
        readMoreBtn.style.display = 'none';
    }
}

// 复制最新法语
function copyLatestDhamma() {
    const text = window.latestDhammaText || '';
    
    navigator.clipboard.writeText(text).then(() => {
        // 显示复制成功提示
        const toast = document.createElement('div');
        toast.textContent = '✓ 已复制最新法语';
        toast.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #8d5a2a; color: white; padding: 12px 24px; border-radius: 28px; font-size: 14px; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: fadeInOut 2s ease-in-out;';
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 2000);
    }).catch(err => {
        alert('复制失败，请手动复制');
        console.error('复制失败:', err);
    });
}

// 显示当前页法语
function displayDhamma() {
    const dataSource = isSearching ? filteredDhammaData : dhammaData;
    if (dataSource.length === 0) {
        document.getElementById('dhamma-display').innerHTML = '<div style="text-align:center;color:#999;">未找到匹配的法语</div>';
        document.getElementById('page-info').textContent = '无结果';
        document.getElementById('prev-btn').disabled = true;
        document.getElementById('next-btn').disabled = true;
        return;
    }
    
    const display = document.getElementById('dhamma-display');
    let items;
    
    if (isSearching) {
        // 搜索模式:按顺序显示搜索结果
        const startIdx = currentPage * ITEMS_PER_PAGE;
        const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, dataSource.length);
        items = dataSource.slice(startIdx, endIdx);
    } else {
        // 非搜索模式:使用随机索引
        const startIdx = currentPage * ITEMS_PER_PAGE;
        const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, randomIndices.length);
        items = randomIndices.slice(startIdx, endIdx).map(idx => ({
            text: dhammaData[idx].sentence,
            url: dhammaData[idx].url,
            index: idx
        }));
    }
    
    display.style.opacity = '0';
    setTimeout(() => {
        // 使用编号列表显示多条法语,带关键词高亮
        display.innerHTML = items.map((item, idx) => {
            const text = item.text || item.sentence || item;
            const url = item.url || '';
            const highlightedText = isSearching ? highlightKeyword(text, searchKeyword) : text;
            const actualIdx = item.index !== undefined ? item.index : currentPage * ITEMS_PER_PAGE + idx;
            
            // 转义特殊字符以便在单引号包裹的 JavaScript 字符串中使用
            const escapedText = text
                .replace(/\\/g, '\\\\')  // 先转义反斜杠
                .replace(/'/g, "\\'")    // 转义单引号
                .replace(/\n/g, '\\n')   // 转义换行符
                .replace(/\r/g, '\\r')   // 转义回车符
                .replace(/"/g, '\\"');   // 转义双引号（以防万一）
            
            let content = `<div style="margin-bottom: 1.5rem; padding-bottom: 1.5rem; ${idx < items.length - 1 ? 'border-bottom: 1px solid #e0e0e0;' : ''}">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <div style="color: #a67c52; font-size: 0.85rem;">第 ${actualIdx + 1} 条</div>
                    <button onclick="copyDhamma('${escapedText}')" style="color: #8d5a2a; background: transparent; border: 1px solid #e0e0e0; border-radius: 8px; padding: 0.25rem 0.5rem; font-size: 0.8rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.25rem; transition: all 0.2s;" onmouseover="this.style.backgroundColor='#fdfbf7'; this.style.borderColor='#8d5a2a'" onmouseout="this.style.backgroundColor='transparent'; this.style.borderColor='#e0e0e0'" title="复制法语">
                        <i class="bi bi-clipboard"></i>
                        <span>复制</span>
                    </button>
                </div>
                <div>${highlightedText}</div>`;
            
            if (url && url !== '') {
                content += `<div style="margin-top: 0.75rem; text-align: right;"><a href="${url}" style="color: #8d5a2a; text-decoration: none; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.25rem 0.5rem; border-radius: 0.375rem; transition: all 0.3s; background-color: #fdfbf7;" target="_blank" onmouseover="this.style.backgroundColor='#f5ebe0'" onmouseout="this.style.backgroundColor='#fdfbf7'"><i class="bi bi-arrow-right-circle"></i> 阅读更多</a></div>`;
            }
            
            content += `</div>`;
            return content;
        }).join('');
        
        display.style.opacity = '1';
    }, 150);
    
    // 更新页码信息
    const totalPages = Math.ceil(dataSource.length / ITEMS_PER_PAGE);
    document.getElementById('page-info').textContent = `第 ${currentPage + 1} 页 / 共 ${totalPages} 页`;
    document.getElementById('total-pages').textContent = totalPages;
    
    // 更新按钮状态
    document.getElementById('prev-btn').disabled = currentPage === 0;
    document.getElementById('next-btn').disabled = (currentPage + 1) * ITEMS_PER_PAGE >= dataSource.length;
}

function prevPage() {
    if (currentPage > 0) {
        currentPage--;
        displayDhamma();
        scrollToTop();
    }
}

function nextPage() {
    const dataSource = isSearching ? filteredDhammaData : dhammaData;
    const totalPages = Math.ceil(dataSource.length / ITEMS_PER_PAGE);
    if (currentPage < totalPages - 1) {
        currentPage++;
        displayDhamma();
        scrollToTop();
    }
}

function scrollToTop() {
    const displayElement = document.getElementById('dhamma-display');
    if (displayElement) {
        // 检测是否为移动设备（屏幕宽度小于768px）
        const isMobile = window.innerWidth < 768;
        // 移动端滚动到顶部，桌面端滚动到中间
        displayElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: isMobile ? 'start' : 'center' 
        });
    }
}

// 复制法语文本
function copyDhamma(text) {
    // 移除HTML标签，只保留纯文本
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    
    navigator.clipboard.writeText(plainText).then(() => {
        // 显示复制成功提示
        const toast = document.createElement('div');
        toast.textContent = '✓ 已复制';
        toast.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #8d5a2a; color: white; padding: 12px 24px; border-radius: 28px; font-size: 14px; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: fadeInOut 2s ease-in-out;';
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 2000);
    }).catch(err => {
        alert('复制失败，请手动复制');
        console.error('复制失败:', err);
    });
}

function randomQuote() {
    if (isSearching) {
        // 搜索模式:随机跳转到某页
        const totalPages = Math.ceil(filteredDhammaData.length / ITEMS_PER_PAGE);
        currentPage = Math.floor(Math.random() * totalPages);
    } else {
        // 非搜索模式:重新生成随机索引并跳转到随机页
        randomIndices = generateRandomIndices(dhammaData.length);
        const totalPages = Math.ceil(dhammaData.length / ITEMS_PER_PAGE);
        currentPage = Math.floor(Math.random() * totalPages);
    }
    displayDhamma();
    scrollToTop();
}

// 搜索功能
function searchDhamma() {
    const searchInput = document.getElementById('search-input');
    const keyword = searchInput.value.trim();
    
    if (!keyword) {
        clearSearch();
        return;
    }
    
    searchKeyword = keyword;
    isSearching = true;
    
    // 过滤包含关键词的法语,保留原始索引
    filteredDhammaData = dhammaData
        .map((item, index) => ({ text: item.sentence, url: item.url, index }))
        .filter(item => item.text.toLowerCase().includes(keyword.toLowerCase()));
    
    // 重置到第一页
    currentPage = 0;
    
    // 显示搜索结果信息
    const searchInfo = document.getElementById('search-info');
    searchInfo.textContent = `找到 ${filteredDhammaData.length} 条包含"${keyword}"的法语`;
    searchInfo.style.display = 'block';
    
    // 显示清除按钮
    document.getElementById('clear-btn').style.display = 'inline-block';
    
    // 更新显示
    displayDhamma();
}

// 清除搜索
function clearSearch() {
    searchKeyword = '';
    isSearching = false;
    filteredDhammaData = [];
    currentPage = 0;
    
    // 重新生成随机索引
    randomIndices = generateRandomIndices(dhammaData.length);
    
    // 隐藏搜索信息
    document.getElementById('search-info').style.display = 'none';
    document.getElementById('clear-btn').style.display = 'none';
    
    // 清空输入框
    document.getElementById('search-input').value = '';
    
    // 更新显示
    displayDhamma();
}

// 高亮关键词
function highlightKeyword(text, keyword) {
    if (!keyword) return text;
    
    const regex = new RegExp(`(${keyword})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

// 跳转到指定页
function jumpToPage() {
    const input = document.getElementById('page-jump');
    const pageNum = parseInt(input.value);
    
    if (!pageNum || pageNum < 1) {
        alert('请输入有效的页码');
        return;
    }
    
    const dataSource = isSearching ? filteredDhammaData : dhammaData;
    const totalPages = Math.ceil(dataSource.length / ITEMS_PER_PAGE);
    
    if (pageNum > totalPages) {
        alert(`页码超出范围，当前共 ${totalPages} 页`);
        return;
    }
    
    currentPage = pageNum - 1;
    displayDhamma();
    scrollToTop();
    
    // 清空输入框
    input.value = '';
}

// 初始化类型过滤器
function initTypeFilters() {
    const types = [...new Set(linksData.map(link => link.type))].filter(t => t !== null).sort();
    const typeNames = {
        1: '<i class="bi bi-book"></i> 经典文献',
        2: '<i class="bi bi-mic"></i> 开示讲座',
        3: '<i class="bi bi-globe"></i> 综合资源'
    };
    
    const filtersContainer = document.getElementById('type-filters');
    
    types.forEach(type => {
        const btn = document.createElement('button');
        btn.className = 'type-filter px-6 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-full hover:border-dharma-light transition-all duration-300 cursor-pointer flex items-center gap-1';
        btn.dataset.type = type;
        btn.innerHTML = typeNames[type] || `类型 ${type}`;
        btn.onclick = () => filterByType(type);
        filtersContainer.appendChild(btn);
    });
}

function filterByType(type) {
    currentFilter = type;
    
    // 更新按钮状态
    document.querySelectorAll('.type-filter').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type == type || (type === 'all' && btn.dataset.type === 'all'));
    });
    
    displayLinks();
}

// 显示书籍
function displayBooks() {
    const grid = document.getElementById('books-grid');
    
    if (typeof BOOKS_DATA === 'undefined' || !BOOKS_DATA || BOOKS_DATA.length === 0) {
        grid.innerHTML = '<div class="text-center text-gray-400 col-span-full py-8">暂无书籍</div>';
        return;
    }
    
    grid.innerHTML = BOOKS_DATA.map(book => {
        return `
            <div class="book-card bg-white rounded-3xl transition-all duration-300 p-6 border border-gray-100 hover:border-dharma-brown hover:shadow-lg overflow-hidden">
                <!-- 顶部书名区域 -->
                <div class="mb-4 flex items-start gap-3">
                    <div class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-dharma-brown bg-dharma-brown bg-opacity-10">
                        <i class="bi bi-journal-text text-xl"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h3 class="text-lg font-medium text-gray-900 mb-2 line-clamp-2 leading-snug">${book.title}</h3>
                        ${book.author ? `<p class="text-sm text-gray-500 flex items-center gap-1.5">
                            <i class="bi bi-person text-dharma-brown"></i>
                            <span>${book.author}</span>
                        </p>` : ''}
                    </div>
                </div>
                
                <!-- 描述区域 -->
                ${book.description ? `<p class="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">${book.description}</p>` : ''}
                
                <!-- 底部操作按钮区域 -->
                <div class="book-actions flex gap-2 pt-4 border-t border-gray-100">
                    ${book.download ? `<a href="${book.download}" class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-dharma-brown text-sm font-medium rounded-xl hover:bg-dharma-brown hover:text-white transition-all duration-200 border-2 border-dharma-brown" download>
                        <i class="bi bi-download text-base"></i>
                        <span>下载</span>
                    </a>` : ''}
                    ${book.online ? `<a href="${book.online}" target="_blank" class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-all duration-200 border-2 border-gray-300 hover:border-gray-400">
                        <i class="bi bi-eye text-base"></i>
                        <span>阅读</span>
                    </a>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// 显示链接
function displayLinks() {
    const grid = document.getElementById('links-grid');
    
    const filteredLinks = currentFilter === 'all' 
        ? linksData 
        : linksData.filter(link => link.type == currentFilter);
    
    if (filteredLinks.length === 0) {
        grid.innerHTML = '<div class="text-center text-gray-400 col-span-full py-8">暂无资源</div>';
        return;
    }
    
    grid.innerHTML = filteredLinks.map(link => {
        const typeConfig = {
            1: { name: '经典', icon: 'book', color: '#059669', bgColor: 'rgba(5, 150, 105, 0.1)' },
            2: { name: '开示', icon: 'mic', color: '#dc2626', bgColor: 'rgba(220, 38, 38, 0.1)' },
            3: { name: '资源', icon: 'globe2', color: '#2563eb', bgColor: 'rgba(37, 99, 235, 0.1)' }
        };
        
        const config = typeConfig[link.type] || { name: '其他', icon: 'link-45deg', color: '#8d5a2a', bgColor: 'rgba(141, 90, 42, 0.1)' };
        
        return `
            <a href="${link.url}" target="_blank" class="link-card block bg-white rounded-3xl transition-all duration-300 p-6 border border-gray-100 hover:border-dharma-brown hover:shadow-lg group">
                <!-- 顶部标题和图标 -->
                <div class="flex items-start justify-between gap-3 mb-3">
                    <h3 class="text-lg font-medium text-gray-900 line-clamp-2 leading-snug flex-1">${link.name || '未命名'}</h3>
                    <div class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style="background-color: ${config.bgColor}; color: ${config.color};">
                        <i class="bi bi-${config.icon} text-lg"></i>
                    </div>
                </div>
                
                <!-- 类型标签 -->
                ${link.type ? `<div class="mb-3">
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style="background-color: ${config.bgColor}; color: ${config.color};">
                        <i class="bi bi-tag"></i>
                        <span>${config.name}</span>
                    </span>
                </div>` : ''}
                
                <!-- URL 显示 -->
                <div class="url-display flex items-center gap-2 pt-3 border-t border-gray-100">
                    <i class="bi bi-link-45deg text-gray-400 flex-shrink-0"></i>
                    <span class="text-xs text-gray-500 truncate">${link.url}</span>
                    <i class="bi bi-box-arrow-up-right text-gray-400 flex-shrink-0 text-xs ml-auto opacity-0 group-hover:opacity-100 transition-opacity"></i>
                </div>
            </a>
        `;
    }).join('');
}

// 视图模式切换功能
function toggleViewMode() {
    const body = document.body;
    const viewIcon = document.getElementById('view-icon');
    const isCompact = body.classList.toggle('compact-mode');
    
    // 更新图标
    if (isCompact) {
        viewIcon.className = 'bi bi-grid-fill';
        localStorage.setItem('viewMode', 'compact');
    } else {
        viewIcon.className = 'bi bi-grid-3x3-gap-fill';
        localStorage.setItem('viewMode', 'normal');
    }
}

// 页面加载时恢复视图模式设置
function loadViewMode() {
    const savedViewMode = localStorage.getItem('viewMode');
    const viewIcon = document.getElementById('view-icon');
    
    if (savedViewMode === 'compact') {
        document.body.classList.add('compact-mode');
        viewIcon.className = 'bi bi-grid-fill';
    }
}

// 主题切换功能
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    const isDark = body.classList.toggle('dark-theme');
    
    // 更新图标
    if (isDark) {
        themeIcon.className = 'bi bi-sun-fill';
        localStorage.setItem('theme', 'dark');
    } else {
        themeIcon.className = 'bi bi-moon-stars-fill';
        localStorage.setItem('theme', 'light');
    }
}

// 页面加载时恢复主题设置
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeIcon = document.getElementById('theme-icon');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeIcon.className = 'bi bi-sun-fill';
    }
}

// 加载每日法语 (小文件，快速加载)
async function loadDailyDhamma() {
    try {
        const response = await fetch('daily_dhamma.json');
        if (!response.ok) throw new Error('Fetch failed');
        return await response.json();
    } catch (e) {
        console.log('加载每日法语失败，将使用完整数据');
        return null;
    }
}

// 加载法语数据
async function loadDhammaData() {
    try {
        // 尝试使用 fetch 加载 JSON (服务器环境更快)
        const response = await fetch('dhamma.json');
        if (!response.ok) throw new Error('Fetch failed');
        return await response.json();
    } catch (e) {
        // 回退到传统脚本加载方式 (本地文件系统)
        console.log('使用回退方式加载数据...');
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'dhamma.js';
            script.onload = () => resolve(window.DHAMMA_DATA || []);
            script.onerror = () => reject(new Error('加载失败'));
            document.head.appendChild(script);
        });
    }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', async () => {
    loadTheme();
    loadViewMode();
    
    // 先快速加载每日法语 (优化首屏体验)
    const dailyData = await loadDailyDhamma();
    if (dailyData && dailyData.length > 0) {
        displayLatestDhamma(dailyData);
    }
    
    // 显示书籍和链接 (不依赖法语数据)
    displayBooks();
    initTypeFilters();
    displayLinks();
    
    // 异步加载完整法语数据
    try {
        dhammaData = await loadDhammaData();
        // 生成随机索引
        randomIndices = generateRandomIndices(dhammaData.length);
        // 显示法语列表
        displayDhamma();
    } catch (err) {
        console.error('加载法语数据失败:', err);
        document.getElementById('dhamma-display').innerHTML = '<div style="text-align:center;color:#999;">数据加载失败，请刷新页面重试</div>';
    }
    
    updateVisitCount(); // 更新访问计数
});