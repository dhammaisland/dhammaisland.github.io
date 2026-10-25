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
                            <div style="width: 32px; height: 32px; border-radius: 16px; background: var(--color-primary, #8d5a2a); display: flex; align-items: center; justify-content: center; color: var(--home-on-primary, white); font-weight: 600; font-size: 0.9rem;">
                                ${msg.username.charAt(0).toUpperCase()}
                            </div>
                            <span style="font-weight: 500; color: var(--color-text-emphasized, #8d5a2a);">${escapeHtml(msg.username)}</span>
                        </div>
                        <span style="font-size: 0.75rem; color: var(--color-text-secondary, #9ca3af);">
                            <i class="bi bi-clock"></i> ${formattedDate}
                        </span>
                    </div>
                    <p style="color: var(--color-text, #4b5563); line-height: 1.6; white-space: pre-wrap;">${escapeHtml(msg.content)}</p>
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
        toast.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--color-primary, #8d5a2a); color: var(--home-on-primary, white); padding: 12px 24px; border-radius: 28px; font-size: 14px; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: fadeInOut 2s ease-in-out;';
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
        document.getElementById('dhamma-display').innerHTML = `
            <div class="zen-empty-slips">
                <i class="bi bi-search"></i>
                <p>未找到契合该关键词的法语，请尝试其他法义词汇</p>
            </div>
        `;
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
        // 使用独立呼吸的「法语笺」展示每则法语
        display.innerHTML = items.map((item, idx) => {
            const text = item.text || item.sentence || item;
            const url = item.url || '';
            const highlightedText = isSearching ? highlightKeyword(text, searchKeyword) : text;
            const actualIdx = item.index !== undefined ? item.index : currentPage * ITEMS_PER_PAGE + idx;
            
            // 转义特殊字符以便在单引号包裹的 JavaScript 字符串中使用
            const escapedText = text
                .replace(/\\/g, '\\\\')
                .replace(/'/g, "\\'")
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r')
                .replace(/"/g, '\\"');
            
            return `
                <article class="dhamma-slip">
                    <div class="dhamma-slip__header">
                        <span class="dhamma-slip__index">第 ${actualIdx + 1} 则</span>
                        <div class="dhamma-slip__actions">
                            <button type="button" class="dhamma-slip__btn" onclick="copyDhamma('${escapedText}')" title="复制法语">
                                <i class="bi bi-clipboard"></i>
                                <span>复制</span>
                            </button>
                            ${url && url !== '' ? `
                                <a href="${url}" class="dhamma-slip__btn dhamma-slip__btn--source" target="_blank" rel="noopener noreferrer" title="阅读原典出处">
                                    <span>阅读更多</span>
                                    <i class="bi bi-arrow-up-right"></i>
                                </a>
                            ` : ''}
                        </div>
                    </div>
                    <div class="dhamma-slip__body">${highlightedText}</div>
                </article>
            `;
        }).join('');
        
        display.style.opacity = '1';
    }, 150);
    
    // 更新页码信息
    const totalPages = Math.ceil(dataSource.length / ITEMS_PER_PAGE);
    document.getElementById('page-info').textContent = `第 ${currentPage + 1} 页`;
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
        toast.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--color-primary, #8d5a2a); color: var(--home-on-primary, white); padding: 12px 24px; border-radius: 28px; font-size: 14px; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: fadeInOut 2s ease-in-out;';
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

// 提取纯净域名用于名录展示
function extractCleanDomain(url) {
    if (!url) return '';
    try {
        const parsed = new URL(url);
        return parsed.hostname.replace(/^www\./i, '');
    } catch {
        return url.replace(/^https?:\/\/(www\.)?/i, '').split('/')[0];
    }
}

// 初始化类型过滤器
function initTypeFilters() {
    const filtersContainer = document.getElementById('type-filters');
    if (!filtersContainer) return;

    const types = [...new Set(linksData.map(link => link.type))].filter(t => t !== null).sort();
    const typeNames = {
        1: { icon: 'bi-book', label: '经典文献' },
        2: { icon: 'bi-mic', label: '开示讲座' },
        3: { icon: 'bi-globe2', label: '综合资源' }
    };

    const allCount = linksData.length;
    let html = `
        <button class="type-filter ${currentFilter === 'all' ? 'active' : ''}" data-type="all" onclick="filterByType('all')">
            <span>全部法源</span>
            <span class="zen-filter-count">${allCount}</span>
        </button>
    `;

    types.forEach(type => {
        const count = linksData.filter(link => link.type == type).length;
        const meta = typeNames[type] || { icon: 'bi-collection', label: `类型 ${type}` };
        const isActive = currentFilter == type ? 'active' : '';
        html += `
            <button class="type-filter ${isActive}" data-type="${type}" onclick="filterByType(${type})">
                <i class="bi ${meta.icon}"></i>
                <span>${meta.label}</span>
                <span class="zen-filter-count">${count}</span>
            </button>
        `;
    });

    filtersContainer.innerHTML = html;
}

function filterByType(type) {
    currentFilter = type;
    
    // 更新按钮状态
    document.querySelectorAll('.type-filter').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type == type || (type === 'all' && btn.dataset.type === 'all'));
    });
    
    displayLinks();
}

// 显示书籍（藏经阁实体书脊装帧质感）
function displayBooks() {
    const grid = document.getElementById('books-grid');
    if (!grid) return;
    
    if (typeof BOOKS_DATA === 'undefined' || !BOOKS_DATA || BOOKS_DATA.length === 0) {
        grid.innerHTML = '<div class="text-center text-gray-400 col-span-full py-8">暂无书籍</div>';
        return;
    }
    
    grid.innerHTML = BOOKS_DATA.map((book, idx) => {
        const isCanon = /长部|中部|相应部|增支部|大念住经/.test(book.title + (book.description || ''));
        const categoryLabel = isCanon ? '巴利圣典译注' : '禅林实修法谈';
        const volumeNum = String(idx + 1).padStart(2, '0');

        return `
            <article class="book-card tactile-book">
                <!-- 左侧实体书脊与线装压痕 -->
                <div class="tactile-book__spine" aria-hidden="true">
                    <span class="tactile-book__stitch"></span>
                    <span class="tactile-book__stitch"></span>
                    <span class="tactile-book__stitch"></span>
                    <span class="tactile-book__stitch"></span>
                </div>

                <!-- 典籍封面主体 -->
                <div class="tactile-book__cover">
                    <div class="tactile-book__top">
                        <span class="tactile-book__category">${categoryLabel}</span>
                        <span class="tactile-book__vol">藏 · ${volumeNum}</span>
                    </div>

                    <div class="tactile-book__main">
                        <h3 class="tactile-book__title">${book.title}</h3>
                        ${book.author ? `
                            <p class="tactile-book__author">
                                <i class="bi bi-feather"></i>
                                <span>${book.author} 著/译</span>
                            </p>
                        ` : ''}
                        ${book.description ? `
                            <p class="tactile-book__desc">${book.description}</p>
                        ` : ''}
                    </div>

                    <!-- 底部书签式操作区 -->
                    <div class="book-actions tactile-book__actions">
                        ${book.download ? `
                            <a href="${book.download}" class="tactile-book__btn tactile-book__btn--primary" download>
                                <i class="bi bi-download"></i>
                                <span>PDF 下载</span>
                            </a>
                        ` : ''}
                        ${book.online ? `
                            <a href="${book.online}" target="_blank" rel="noopener noreferrer" class="tactile-book__btn tactile-book__btn--secondary">
                                <i class="bi bi-book-half"></i>
                                <span>在线捧读</span>
                            </a>
                        ` : ''}
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

// 显示链接（高密度法源名录）
function displayLinks() {
    const grid = document.getElementById('links-grid');
    if (!grid) return;
    
    const filteredLinks = currentFilter === 'all' 
        ? linksData 
        : linksData.filter(link => link.type == currentFilter);
    
    if (filteredLinks.length === 0) {
        grid.innerHTML = '<div class="text-center text-gray-400 col-span-full py-8">暂无资源</div>';
        return;
    }
    
    grid.innerHTML = filteredLinks.map(link => {
        const typeConfig = {
            1: { name: '经典', icon: 'book', modifier: 'canon' },
            2: { name: '开示', icon: 'mic', modifier: 'talk' },
            3: { name: '资源', icon: 'globe2', modifier: 'portal' }
        };
        
        const config = typeConfig[link.type] || { name: '其他', icon: 'link-45deg', modifier: 'other' };
        const cleanDomain = extractCleanDomain(link.url);
        
        return `
            <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="link-card directory-item directory-item--${config.modifier} group" title="${link.name} (${link.url})">
                <div class="directory-item__icon">
                    <i class="bi bi-${config.icon}"></i>
                </div>
                <div class="directory-item__body">
                    <div class="directory-item__title-row">
                        <h3 class="directory-item__title">${link.name || '未命名'}</h3>
                        ${link.type ? `<span class="type-badge directory-item__badge">${config.name}</span>` : ''}
                    </div>
                    <div class="url-display directory-item__domain">
                        <span>${cleanDomain}</span>
                    </div>
                </div>
                <div class="directory-item__arrow" aria-hidden="true">
                    <i class="bi bi-arrow-up-right"></i>
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
    if (window.DharmaTheme) {
        window.DharmaTheme.toggle();
        return;
    }
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
    if (window.DharmaTheme) {
        window.DharmaTheme.restore();
        return;
    }
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
        document.getElementById('dhamma-display').innerHTML = '<div style="text-align:center;color:var(--color-text-secondary, #999);">数据加载失败，请刷新页面重试</div>';
    }
    
    updateVisitCount(); // 更新访问计数
});
