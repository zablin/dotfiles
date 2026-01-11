const { Plugin, Notice, Modal, Setting, TFile, ItemView, WorkspaceLeaf } = require('obsidian');

const CALENDAR_VIEW_TYPE = 'para-calendar-view';

class LifeOSPARACore extends Plugin {

    constructor() {
        super(...arguments);

        // PARA文件夹结构 + 周期笔记结构（添加编号便于排序）
        this.paraStructure = {
            projects: { folder: '2-项目', icon: '📋' },
            areas: { folder: '3-领域', icon: '🏠' },
            resources: { folder: '4-资源', icon: '📚' },
            archive: { folder: '5-归档', icon: '📦' },
            // 周期笔记按年度组织
            periodic: { folder: '1-周期笔记', icon: '📅' }
        };

        // 时间管理
        this.networkTime = null;
        this.timeOffset = 0; // 本地时间与网络时间的偏移
        this.lastSync = null;
        this.syncInterval = null;

        // 获取当前年份（延迟初始化，避免在时间同步前调用）
        this.currentYear = new Date().getFullYear(); // 使用本地时间作为初始值

        // 周期笔记子文件夹结构
        this.periodicStructure = {
            daily: '日记',
            weekly: '周记',
            monthly: '月记',
            yearly: '年终总结'
        };

        // 日记模板 - 子弹笔记风格
        this.diaryTemplate = `# {{date}} {{weekday}}

## • 快速记录
<!-- 使用 • 进行快速记录，× 标记已完成，> 表示迁移，< 表示计划 -->

## 今日任务
- [ ]
- [ ]
- [ ]

## 今日事件
•
•
•

## 今日想法
•
•

## 今日收获
•
•

## 明日准备
- [ ]
- [ ]

---
[[{{prevDate}}]] ← {{date}} → [[{{nextDate}}]]

#日记 #{{dateTag}}`;

        // 周记模板 - 子弹笔记风格
        this.weeklyTemplate = `# 📅 {{weekRange}} 第{{weekNum}}周

## • 本周概览
> {{startDate}} - {{endDate}}

## 本周目标
- [ ] **主要目标1**
- [ ] **主要目标2**
- [ ] **主要目标3**

## 本周成就
• **完成的重要事项:**
  ×
  ×
  ×

• **学到的东西:**
  •
  •

• **遇到的挑战:**
  •
  •

## 每日记录
### 周一 {{mon}}
•
### 周二 {{tue}}
•
### 周三 {{wed}}
•
### 周四 {{thu}}
•
### 周五 {{fri}}
•
### 周六 {{sat}}
•
### 周日 {{sun}}
•

## 下周计划
> 下周重点关注

- [ ]
- [ ]
- [ ]

## 本周反思
• **做得好的地方:**
  •
  •

• **需要改进:**
  •
  •

---
[[{{prevWeek}}]] ← {{currentWeek}} → [[{{nextWeek}}]]

#周记 #{{yearWeek}}`;

        // 月记模板 - 子弹笔记风格
        this.monthlyTemplate = `# 📊 {{year}}年{{month}}月总结

## • 月度概览
> {{monthRange}}

## 月度目标达成
- [ ] **目标1** - 完成度: ____%
- [ ] **目标2** - 完成度: ____%
- [ ] **目标3** - 完成度: ____%

## 本月亮点
• **重大成就:**
  ×
  ×
  ×

• **重要里程碑:**
  •
  •

• **新的学习:**
  •
  •

## 数据回顾
• **完成任务:** ___ 个
• **读书:** ___ 本
• **运动:** ___ 次
• **新技能:** ___

## 各领域总结
### 🎯 工作/学习
•
•
•

### 💪 健康
•
•

### 👥 人际关系
•
•

### 💰 财务
•
•

## 本月挑战
• **遇到的困难:**
  •
  •

• **解决方案:**
  •
  •

## 下月计划
> 下个月的重点

### 主要目标
- [ ] **目标1:**
- [ ] **目标2:**
- [ ] **目标3:**

### 改进计划
•
•
•

## 月度反思
• **最大的收获:**
  •

• **最想改变的:**
  •

• **给下个月自己的话:**
  •

---
[[{{prevMonth}}]] ← {{currentMonth}} → [[{{nextMonth}}]]

#月记 #{{yearMonth}}`;

        // 年记模板 - 子弹笔记风格
        this.yearlyTemplate = `# 🎊 {{year}}年度总结

## • 年度概览
> {{year}}年 1月1日 - 12月31日

## 年度目标回顾
### 主要目标达成情况
- [ ] **年度目标1** - 完成度: ____%
- [ ] **年度目标2** - 完成度: ____%
- [ ] **年度目标3** - 完成度: ____%
- [ ] **年度目标4** - 完成度: ____%
- [ ] **年度目标5** - 完成度: ____%

## 🏆 年度成就
• **重大突破:**
  ×
  ×
  ×

• **个人成长:**
  •
  •
  •

• **技能提升:**
  •
  •

## 📊 年度数据
• **完成项目:** ___ 个
• **读完书籍:** ___ 本
• **学会技能:** ___ 个
• **旅行地点:** ___ 个
• **新认识的朋友:** ___ 个

## 各个月份回顾
### Q1 (1-3月)
• **主要事件:**
• **重要成长:**
• **遇到挑战:**

### Q2 (4-6月)
• **主要事件:**
• **重要成长:**
• **遇到挑战:**

### Q3 (7-9月)
• **主要事件:**
• **重要成长:**
• **遇到挑战:**

### Q4 (10-12月)
• **主要事件:**
• **重要成长:**
• **遇到挑战:**

## 🎯 各领域总结
### 💼 事业/学业
• **最大进步:**
• **待改进:**
• **下年规划:**

### 💪 健康
• **健康状况:**
• **运动情况:**
• **饮食习惯:**

### 👨‍👩‍👧‍👦 家庭/关系
• **家庭变化:**
• **友谊状况:**
• **感情生活:**

### 💰 财务
• **收入情况:**
• **投资收益:**
• **消费习惯:**

### 🎨 兴趣爱好
• **培养的爱好:**
• **参与的活动:**
• **创作的作品:**

## 🤔 年度反思
• **最自豪的事:**
  •

• **最大的遗憾:**
  •

• **最重要的教训:**
  •

• **对自己说的话:**
  •

## 🚀 新年展望 ({{nextYear}})
### 新年愿景
• **我希望成为的人:**
  •

• **我想要的生活:**
  •

### 新年目标
- [ ] **目标1:**
- [ ] **目标2:**
- [ ] **目标3:**
- [ ] **目标4:**
- [ ] **目标5:**

### 行动计划
• **第一步:**
• **关键习惯:**
• **重要提醒:**

---
[[{{prevYear}}]] ← {{year}} → [[{{nextYear}}]]

#年记 #Year{{year}}`;

        // 项目模板
        this.projectTemplate = `# 📋 {{title}}

## 🎯 项目目标
>

## 📅 时间规划
- **开始日期**: {{date}}
- **截止日期**:
- **预估工时**:

## ✅ 任务清单
- [ ]
- [ ]

## 📝 进展记录
### {{date}}
- 项目启动

## 🔗 相关资源
-

---
#项目 #{{tag}}`;

        // 领域模板
        this.areaTemplate = `# 🏠 {{title}}

## 📝 领域描述
>

## 🎯 维护目标
-

## 📋 日常清单
- [ ]
- [ ]

## 📊 关键指标
-

## 🔗 相关项目
-

## 📈 改进计划
-

---
#领域 #{{tag}}`;

        // 资源模板
        this.resourceTemplate = `# 📚 {{title}}

## 📄 基本信息
- **类型**:
- **来源**:
- **创建时间**: {{date}}

## 📝 内容摘要
>

## 💡 关键观点
1.
2.
3.

## 🎯 应用价值
-

## 🔗 相关链接
-

---
#资源 #{{tag}}`;

        // 年度目标模板
        this.yearlyGoalsTemplate = `# 🎯 {{year}}年度目标

## 🎊 愿景声明
> 我希望在{{year}}年成为...

## 📊 核心目标

### 🏆 主要目标
1. **目标1名称**
   - 具体描述：
   - 成功标准：
   - 截止时间：{{year}}年12月31日
   - 关键里程碑：
     - Q1:
     - Q2:
     - Q3:
     - Q4:

2. **目标2名称**
   - 具体描述：
   - 成功标准：
   - 截止时间：{{year}}年12月31日
   - 关键里程碑：
     - Q1:
     - Q2:
     - Q3:
     - Q4:

3. **目标3名称**
   - 具体描述：
   - 成功标准：
   - 截止时间：{{year}}年12月31日
   - 关键里程碑：
     - Q1:
     - Q2:
     - Q3:
     - Q4:

## 🎯 各领域目标

### 💼 事业/工作
- **主要目标**：
- **关键指标**：
- **具体行动**：

### 💪 健康/身体
- **主要目标**：
- **关键指标**：
- **具体行动**：

### 👨‍👩‍👧‍👦 家庭/关系
- **主要目标**：
- **关键指标**：
- **具体行动**：

### 💰 财务
- **主要目标**：
- **关键指标**：
- **具体行动**：

### 🎨 个人发展
- **主要目标**：
- **关键指标**：
- **具体行动**：

## 📈 目标追踪

### 月度检查点
- [ ] 1月回顾 - [[{{year}}-01目标回顾]]
- [ ] 2月回顾 - [[{{year}}-02目标回顾]]
- [ ] 3月回顾 - [[{{year}}-03目标回顾]]
- [ ] 4月回顾 - [[{{year}}-04目标回顾]]
- [ ] 5月回顾 - [[{{year}}-05目标回顾]]
- [ ] 6月回顾 - [[{{year}}-06目标回顾]]
- [ ] 7月回顾 - [[{{year}}-07目标回顾]]
- [ ] 8月回顾 - [[{{year}}-08目标回顾]]
- [ ] 9月回顾 - [[{{year}}-09目标回顾]]
- [ ] 10月回顾 - [[{{year}}-10目标回顾]]
- [ ] 11月回顾 - [[{{year}}-11目标回顾]]
- [ ] 12月回顾 - [[{{year}}-12目标回顾]]

### 季度总结
- [ ] Q1 总结 (1-3月) - [[{{year}}Q1目标总结]]
- [ ] Q2 总结 (4-6月) - [[{{year}}Q2目标总结]]
- [ ] Q3 总结 (7-9月) - [[{{year}}Q3目标总结]]
- [ ] Q4 总结 (10-12月) - [[{{year}}Q4目标总结]]

## 💡 成功策略
- **关键习惯**：
- **避免陷阱**：
- **支持系统**：
- **奖励机制**：

---
#年度目标 #{{year}}年 #目标管理`;

        // 季度目标模板
        this.quarterlyGoalsTemplate = `# 📈 {{year}}年Q{{quarter}}季度目标 ({{monthRange}})

## 🔗 关联年度目标
> 基于年度目标：[[{{year}}年度目标]]

## 🎯 季度主题
**本季度重点**：

## 📊 核心目标

### 🏆 主要目标
1. **目标1名称**
   - 源自年度目标：
   - 具体描述：
   - 成功标准：
   - 截止时间：{{endDate}}
   - 月度分解：
     - {{month1}}月：
     - {{month2}}月：
     - {{month3}}月：

2. **目标2名称**
   - 源自年度目标：
   - 具体描述：
   - 成功标准：
   - 截止时间：{{endDate}}
   - 月度分解：
     - {{month1}}月：
     - {{month2}}月：
     - {{month3}}月：

3. **目标3名称**
   - 源自年度目标：
   - 具体描述：
   - 成功标准：
   - 截止时间：{{endDate}}
   - 月度分解：
     - {{month1}}月：
     - {{month2}}月：
     - {{month3}}月：

## 🎯 各领域季度目标

### 💼 事业/工作
- **季度重点**：
- **关键成果**：
- **具体行动**：

### 💪 健康/身体
- **季度重点**：
- **关键成果**：
- **具体行动**：

### 👨‍👩‍👧‍👦 家庭/关系
- **季度重点**：
- **关键成果**：
- **具体行动**：

### 💰 财务
- **季度重点**：
- **关键成果**：
- **具体行动**：

### 🎨 个人发展
- **季度重点**：
- **关键成果**：
- **具体行动**：

## 📈 进度追踪

### 月度里程碑
- [ ] {{month1}}月目标 - [[{{year}}-{{month1}}目标]]
- [ ] {{month2}}月目标 - [[{{year}}-{{month2}}目标]]
- [ ] {{month3}}月目标 - [[{{year}}-{{month3}}目标]]

### 周度检查
- [ ] 第1-2周检查
- [ ] 第3-4周检查
- [ ] 第5-6周检查
- [ ] 第7-8周检查
- [ ] 第9-10周检查
- [ ] 第11-12周检查

## ⚠️ 风险与挑战
- **潜在阻碍**：
- **应对策略**：
- **备选方案**：

## 🎉 季度奖励
**达成目标后的奖励**：

---
#季度目标 #{{year}}Q{{quarter}} #目标管理`;

        // 月度目标模板
        this.monthlyGoalsTemplate = `# 🎯 {{year}}年{{month}}月目标

## 🔗 关联上级目标
> 基于季度目标：[[{{year}}年Q{{quarter}}季度目标]]
> 基于年度目标：[[{{year}}年度目标]]

## 📅 月度概览
- **月度主题**：
- **关键词**：
- **重点关注**：

## 🎯 本月核心目标

### 🏆 主要目标
1. **目标1名称**
   - 来源：{{quarterGoal1}}
   - 具体描述：
   - 成功标准：
   - 截止时间：{{year}}-{{monthNum}}-{{lastDay}}
   - 周度分解：
     - 第1周：
     - 第2周：
     - 第3周：
     - 第4周：

2. **目标2名称**
   - 来源：{{quarterGoal2}}
   - 具体描述：
   - 成功标准：
   - 截止时间：{{year}}-{{monthNum}}-{{lastDay}}
   - 周度分解：
     - 第1周：
     - 第2周：
     - 第3周：
     - 第4周：

3. **目标3名称**
   - 来源：{{quarterGoal3}}
   - 具体描述：
   - 成功标准：
   - 截止时间：{{year}}-{{monthNum}}-{{lastDay}}
   - 周度分解：
     - 第1周：
     - 第2周：
     - 第3周：
     - 第4周：

## 📋 具体行动计划

### 第1周 ({{week1Range}})
- [ ]
- [ ]
- [ ]

### 第2周 ({{week2Range}})
- [ ]
- [ ]
- [ ]

### 第3周 ({{week3Range}})
- [ ]
- [ ]
- [ ]

### 第4周 ({{week4Range}})
- [ ]
- [ ]
- [ ]

## 🎯 各领域月度目标

### 💼 工作
- **本月重点**：
- **关键成果**：
- **具体任务**：

### 💪 健康
- **本月重点**：
- **关键成果**：
- **具体任务**：

### 👥 关系
- **本月重点**：
- **关键成果**：
- **具体任务**：

### 💰 财务
- **本月重点**：
- **关键成果**：
- **具体任务**：

### 🎨 学习
- **本月重点**：
- **关键成果**：
- **具体任务**：

## 📊 成功指标
- **量化指标**：
- **质化指标**：
- **里程碑**：

## 🎉 月度奖励
**目标达成奖励**：

---
[[{{prevMonth}}月目标]] ← {{month}}月 → [[{{nextMonth}}月目标]]

#月度目标 #{{year}}年{{monthNum}}月 #目标管理`;
    }

    async onload() {
        console.log('LifeOS PARA Core with Diary System loading...');

        // 立即初始化基础功能，不等待网络同步
        await this.initializePARAStructure();

        // 注册日历视图
        this.registerView(
            CALENDAR_VIEW_TYPE,
            (leaf) => new CalendarView(leaf, this)
        );

        // 注册命令
        this.registerCommands();

        // 添加状态栏
        this.statusBarItem = this.addStatusBarItem();
        this.statusBarItem.setText('PARA 🔄'); // 显示正在加载

        // 延迟创建日历视图，确保workspace已准备好
        this.registerEvent(
            this.app.workspace.on('layout-ready', () => {
                this.setupInitialCalendarView();
            })
        );

        new Notice('LifeOS PARA Core 已就绪 📋');

        // 异步初始化网络时间同步（不阻塞启动）
        this.initializeNetworkTimeAsync();

        // 启动定时同步
        this.startTimeSyncInterval();

        // 初始化逾期任务提醒系统
        this.initializeOverdueReminder();
    }

    // 异步网络时间同步，不阻塞启动
    async initializeNetworkTimeAsync() {
        // 延迟一点时间，让插件先完成基础初始化
        setTimeout(async () => {
            try {
                console.log('🌐 后台同步网络时间...');

                // 临时设置为2026年1月11日星期六（根据用户反馈）
                const targetDate = new Date('2026-01-11T12:00:00.000Z');
                const localNow = new Date();
                this.timeOffset = targetDate.getTime() - localNow.getTime();

                console.log(`⏰ 手动设置时间偏移: ${this.timeOffset}ms`);
                console.log(`⏰ 目标时间: ${targetDate.toISOString()}`);
                console.log(`⏰ 当前校准时间: ${this.getCurrentDate().toISOString()}`);

                // 设置模拟的网络时间数据
                this.networkTime = {
                    serverTime: targetDate,
                    timezone: 'Asia/Shanghai',
                    source: '手动设置',
                    timestamp: Date.now(),
                    responseTime: 0
                };
                this.lastSync = Date.now();

                console.log('✅ 时间同步成功（手动设置）');
                this.statusBarItem?.setText('PARA ✓'); // 更新状态栏

                // 更新当前年份（现在时间同步已完成）
                this.currentYear = this.getCurrentDate().getFullYear();
                console.log(`📅 当前年份已更新: ${this.currentYear}`);

                // 显示成功消息
                new Notice(`🌐 时间已设置为2026年1月11日星期日`, 2000);

                // 刷新日历视图
                this.refreshCalendarViews();

            } catch (error) {
                console.warn('⚠️ 网络时间同步失败，使用本地时间:', error.message);
                this.timeOffset = 0;
                this.statusBarItem?.setText('PARA ⚠️'); // 显示警告状态

                // 只在控制台显示错误，不弹窗干扰用户
                console.warn('时间同步失败，将使用本地时间');
            }
        }, 1000); // 延迟1秒执行
    }

    // 网络时间管理方法
    async initializeNetworkTime() {
        console.log('🌐 初始化网络时间同步...');

        // 先设置默认值
        this.timeOffset = 0;
        this.networkTime = null;
        this.lastSync = null;

        try {
            // 显示同步状态
            const statusNotice = new Notice('🌐 正在同步网络时间...', 0);

            await this.syncNetworkTime();

            statusNotice.hide();
            console.log('✅ 网络时间同步成功');

            // 显示成功消息
            const timeInfo = this.getTimeStatusInfo();
            const offsetText = Math.abs(timeInfo.offset) < 1000 ?
                `${Math.abs(timeInfo.offset)}ms` :
                `${(Math.abs(timeInfo.offset) / 1000).toFixed(1)}s`;

            new Notice(`✅ 时间同步成功 (偏移: ${offsetText})`, 3000);

        } catch (error) {
            console.warn('⚠️ 网络时间同步失败，使用本地时间:', error.message);
            this.timeOffset = 0;
            new Notice(`⚠️ 网络时间同步失败，使用本地时间\n错误: ${error.message}`, 5000);
        }
    }

    async syncNetworkTime() {
        const timeServers = [
            // 优先使用HTTPS服务器避免混合内容问题
            'https://worldtimeapi.org/api/timezone/Asia/Shanghai',
            'https://worldtimeapi.org/api/ip',
            // 只在HTTPS失败时才尝试HTTP（某些环境可能被阻止）
            'https://worldclockapi.com/api/json/utc/now'
        ];

        let lastError = null;

        for (const server of timeServers) {
            try {
                console.log(`🌐 尝试连接时间服务器: ${server}`);
                const response = await this.fetchTimeFromServer(server);
                if (response) {
                    this.networkTime = response;
                    this.calculateTimeOffset();
                    this.lastSync = Date.now();
                    console.log(`✅ 成功从 ${server} 获取时间`);
                    return response;
                }
            } catch (error) {
                lastError = error;
                console.warn(`❌ 时间服务器 ${server} 请求失败:`, error.message);
                continue;
            }
        }

        // 如果所有服务器都失败，抛出最后一个错误
        throw new Error(`所有时间服务器均不可用。最后错误: ${lastError?.message || '未知错误'}`);
    }

    async fetchTimeFromServer(url) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 增加到8秒超时

            console.log(`📡 正在请求: ${url}`);
            const requestStart = Date.now();

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                mode: 'cors' // 明确设置CORS模式
            });

            clearTimeout(timeoutId);
            const requestEnd = Date.now();

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`📡 响应数据:`, data);

            // 处理不同API响应格式
            let serverTime;
            let timezone = 'UTC';

            if (data.datetime) {
                // WorldTimeAPI格式
                serverTime = new Date(data.datetime);
                timezone = data.timezone || data.abbreviation || 'UTC';
            } else if (data.currentDateTime) {
                // WorldClockAPI格式
                serverTime = new Date(data.currentDateTime);
                timezone = data.timeZoneName || 'UTC';
            } else if (data.utc_datetime) {
                // 其他UTC格式
                serverTime = new Date(data.utc_datetime);
                timezone = 'UTC';
            } else if (data.time) {
                // 简单时间格式
                serverTime = new Date(data.time);
                timezone = data.timezone || 'UTC';
            } else {
                throw new Error('无法解析时间格式，响应中没有找到时间字段');
            }

            // 验证时间是否有效
            if (isNaN(serverTime.getTime())) {
                throw new Error('解析的时间无效');
            }

            const responseData = {
                serverTime,
                timezone,
                source: url,
                timestamp: requestStart, // 使用请求开始时间作为基准
                responseTime: requestEnd - requestStart
            };

            console.log(`✅ 成功解析时间: ${serverTime.toISOString()}, 响应耗时: ${responseData.responseTime}ms`);
            return responseData;

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('请求超时（8秒）');
            } else if (error.message.includes('Failed to fetch')) {
                throw new Error('网络连接失败，请检查网络设置');
            } else if (error.message.includes('CORS')) {
                throw new Error('跨域请求被阻止');
            } else {
                throw new Error(`获取网络时间失败: ${error.message}`);
            }
        }
    }

    calculateTimeOffset() {
        if (this.networkTime) {
            // 获取网络请求时的本地时间戳
            const requestLocalTime = this.networkTime.timestamp;
            // 获取服务器时间戳
            const serverTime = this.networkTime.serverTime.getTime();
            // 计算网络延迟补偿（假设往返延迟的一半）
            const networkDelay = (Date.now() - requestLocalTime) / 2;
            // 计算真实的时间偏移：服务器时间 - (请求时的本地时间 + 网络延迟)
            this.timeOffset = serverTime - (requestLocalTime + networkDelay);

            console.log(`⏰ 服务器时间: ${new Date(serverTime).toISOString()}`);
            console.log(`⏰ 请求时本地时间: ${new Date(requestLocalTime).toISOString()}`);
            console.log(`⏰ 网络延迟: ${Math.round(Date.now() - requestLocalTime)}ms`);
            console.log(`⏰ 时间偏移: ${this.timeOffset}ms`);
            console.log(`🌍 服务器时区: ${this.networkTime.timezone}`);
        }
    }

    getCurrentDate() {
        // 如果网络时间还未同步，返回本地时间
        if (!this.networkTime || this.timeOffset === undefined) {
            return new Date();
        }

        // 返回经过网络校准的当前时间
        const adjustedTime = Date.now() + this.timeOffset;
        return new Date(adjustedTime);
    }

    getCurrentTimestamp() {
        // 如果网络时间还未同步，返回本地时间戳
        if (!this.networkTime || this.timeOffset === undefined) {
            return Date.now();
        }

        return Date.now() + this.timeOffset;
    }

    // 刷新所有日历视图
    refreshCalendarViews() {
        const calendarLeaves = this.app.workspace.getLeavesOfType(CALENDAR_VIEW_TYPE);
        calendarLeaves.forEach(leaf => {
            if (leaf.view && typeof leaf.view.renderMainContent === 'function') {
                // 更新日历视图的当前日期
                leaf.view.currentDate = this.getCurrentDate();
                leaf.view.renderMainContent();
            }
        });
    }

    startTimeSyncInterval() {
        // 延迟启动定时同步，避免影响插件初始化
        setTimeout(() => {
            // 每30分钟同步一次时间
            this.syncInterval = setInterval(async () => {
                try {
                    console.log('🔄 定时时间同步开始...');
                    await this.syncNetworkTime();
                    console.log('🔄 定时时间同步完成');

                    // 静默更新状态栏
                    this.statusBarItem?.setText('PARA ✓');

                    // 刷新日历视图
                    this.refreshCalendarViews();
                } catch (error) {
                    console.warn('🔄 定时时间同步失败:', error.message);
                    // 不显示错误通知，避免干扰用户
                }
            }, 30 * 60 * 1000); // 30分钟

            console.log('⏰ 定时时间同步已启动 (每30分钟)');
        }, 5000); // 延迟5秒启动定时器

        // 注册清理函数
        this.register(() => {
            if (this.syncInterval) {
                clearInterval(this.syncInterval);
                this.syncInterval = null;
            }
        });
    }

    async forceTimeSync() {
        const loadingNotice = new Notice('🌐 正在同步网络时间...', 0);

        try {
            await this.syncNetworkTime();

            loadingNotice.hide();
            this.statusBarItem?.setText('PARA ✓');

            // 显示同步结果
            const timeInfo = this.getTimeStatusInfo();
            const offsetText = Math.abs(timeInfo.offset) < 1000 ?
                `${Math.abs(timeInfo.offset)}ms` :
                `${(Math.abs(timeInfo.offset) / 1000).toFixed(1)}s`;

            new Notice(`✅ 时间同步成功 (偏移: ${offsetText})`, 3000);

            // 刷新所有日历视图
            this.refreshCalendarViews();

        } catch (error) {
            loadingNotice.hide();
            this.statusBarItem?.setText('PARA ⚠️');
            new Notice(`❌ 时间同步失败: ${error.message}`, 5000);
        }
    }

    getTimeStatusInfo() {
        const now = this.getCurrentDate();
        const localNow = new Date();

        return {
            networkTime: now.toISOString(),
            localTime: localNow.toISOString(),
            offset: this.timeOffset,
            lastSync: this.lastSync ? new Date(this.lastSync).toLocaleString() : '未同步',
            timezone: this.networkTime?.timezone || '本地时区',
            source: this.networkTime?.source || '本地时间'
        };
    }

    async initializePARAStructure() {
        try {
            let foldersCreated = 0;

            // 创建PARA基础文件夹
            for (const [key, config] of Object.entries(this.paraStructure)) {
                const folder = config.folder;

                if (!this.app.vault.getAbstractFileByPath(folder)) {
                    await this.app.vault.createFolder(folder);
                    console.log(`Created: ${folder}`);
                    foldersCreated++;
                }
            }

            // 创建周期笔记的年度文件夹结构
            await this.initializePeriodicStructure();

            if (foldersCreated > 0) {
                new Notice(`PARA结构创建完成！新建了 ${foldersCreated} 个文件夹`);
            }

        } catch (error) {
            console.error('Error initializing PARA structure:', error);
            new Notice('PARA结构初始化失败，请查看控制台');
        }
    }

    async initializePeriodicStructure() {
        const baseFolder = '1-周期笔记';
        const currentYear = this.currentYear;
        let periodicFoldersCreated = 0;

        // 创建当前年份文件夹
        const yearFolder = `${baseFolder}/${currentYear}`;
        if (!this.app.vault.getAbstractFileByPath(yearFolder)) {
            await this.app.vault.createFolder(yearFolder);
            console.log(`Created: ${yearFolder}`);
            periodicFoldersCreated++;
        }

        // 创建各周期类型文件夹
        for (const [key, folderName] of Object.entries(this.periodicStructure)) {
            const fullPath = `${yearFolder}/${folderName}`;
            if (!this.app.vault.getAbstractFileByPath(fullPath)) {
                await this.app.vault.createFolder(fullPath);
                console.log(`Created: ${fullPath}`);
                periodicFoldersCreated++;
            }
        }

        if (periodicFoldersCreated > 0) {
            new Notice(`周期笔记结构创建完成！新建了 ${periodicFoldersCreated} 个文件夹`);
        }
    }

    // 确保年度文件夹结构存在
    async ensureYearFolderExists(year) {
        const baseFolder = '1-周期笔记';
        const yearFolder = `${baseFolder}/${year}`;

        // 创建年度文件夹
        if (!this.app.vault.getAbstractFileByPath(yearFolder)) {
            await this.app.vault.createFolder(yearFolder);
        }

        // 创建各周期类型文件夹
        for (const [key, folderName] of Object.entries(this.periodicStructure)) {
            const fullPath = `${yearFolder}/${folderName}`;
            if (!this.app.vault.getAbstractFileByPath(fullPath)) {
                await this.app.vault.createFolder(fullPath);
            }
        }
    }

    registerCommands() {
        // 创建项目
        this.addCommand({
            id: 'create-project',
            name: '📋 创建新项目',
            callback: () => this.createProject()
        });

        // 创建领域
        this.addCommand({
            id: 'create-area',
            name: '🏠 创建新领域',
            callback: () => this.createArea()
        });

        // 创建资源
        this.addCommand({
            id: 'create-resource',
            name: '📚 创建新资源',
            callback: () => this.createResource()
        });

        // 创建今日日记
        this.addCommand({
            id: 'create-daily-diary',
            name: '📅 创建今日日记',
            callback: () => this.createDailyDiary()
        });

        // 创建本周周记
        this.addCommand({
            id: 'create-weekly-review',
            name: '📅 创建本周周记',
            callback: () => this.createWeeklyReview()
        });

        // 创建本月月记
        this.addCommand({
            id: 'create-monthly-review',
            name: '📊 创建本月月记',
            callback: () => this.createMonthlyReview()
        });

        // 创建本年年记
        this.addCommand({
            id: 'create-yearly-review',
            name: '🎊 创建本年年记',
            callback: () => this.createYearlyReview()
        });

        // 目标管理命令组
        this.addCommand({
            id: 'create-yearly-goals',
            name: '🎯 创建年度目标',
            callback: () => this.createYearlyGoals()
        });

        this.addCommand({
            id: 'create-quarterly-goals',
            name: '📈 创建季度目标',
            callback: () => this.createQuarterlyGoals()
        });

        this.addCommand({
            id: 'create-monthly-goals',
            name: '🎯 创建月度目标',
            callback: () => this.createMonthlyGoals()
        });

        this.addCommand({
            id: 'review-goals',
            name: '📊 目标回顾',
            callback: () => this.showGoalsReview()
        });

        // 时间统计相关命令
        this.addCommand({
            id: 'add-time-record',
            name: '⏱️ 添加时间记录',
            callback: () => this.addTimeRecord()
        });

        this.addCommand({
            id: 'show-time-report',
            name: '📊 时间统计报告',
            callback: () => this.showTimeReport()
        });

        this.addCommand({
            id: 'export-weekly-time-report',
            name: '📄 导出本周时间复盘',
            callback: () => this.exportWeeklyTimeReport()
        });

        // 日记检索
        this.addCommand({
            id: 'search-diary',
            name: '🔍 搜索日记',
            callback: () => this.searchDiary()
        });

        // 日记统计
        this.addCommand({
            id: 'diary-stats',
            name: '📊 日记统计',
            callback: () => this.showDiaryStats()
        });

        // 打开日历主页
        this.addCommand({
            id: 'open-calendar-view',
            name: '📅 打开日历主页',
            callback: () => this.openSidebarCalendarView()
        });

        // 日历视图
        this.addCommand({
            id: 'diary-calendar',
            name: '📅 日历视图',
            callback: () => this.showCalendar()
        });

        // 重新初始化
        this.addCommand({
            id: 'reinit-para',
            name: '🔄 重新初始化PARA结构',
            callback: () => this.initializePARAStructure()
        });

        // 网络时间同步命令
        this.addCommand({
            id: 'sync-network-time',
            name: '🌐 同步网络时间',
            callback: () => this.forceTimeSync()
        });

        // 显示时间状态
        this.addCommand({
            id: 'show-time-status',
            name: '⏰ 显示时间状态',
            callback: () => this.showTimeStatus()
        });

        // 调试时间同步
        this.addCommand({
            id: 'debug-time-sync',
            name: '🔧 调试时间同步',
            callback: () => this.debugTimeSync()
        });

        // 调试日历时间
        this.addCommand({
            id: 'debug-calendar-time',
            name: '📅 调试日历时间',
            callback: () => this.debugCalendarTime()
        });

        // 手动设置日期
        this.addCommand({
            id: 'set-manual-date',
            name: '📅 手动设置日期',
            callback: () => this.setManualDate()
        });

        // 数据仪表盘
        this.addCommand({
            id: 'show-dashboard',
            name: '📊 数据仪表盘',
            callback: () => this.showDashboard()
        });
    }

    async createProject() {
        const title = await this.promptForInput('请输入项目名称：');
        if (!title) return;

        const fileName = `2-项目/${title}.md`;
        const currentDate = new Date().toISOString().split('T')[0];
        const tag = title.replace(/\s+/g, '');

        const content = this.projectTemplate
            .replace(/{{title}}/g, title)
            .replace(/{{date}}/g, currentDate)
            .replace(/{{tag}}/g, tag);

        try {
            const file = await this.app.vault.create(fileName, content);
            const activeLeaf = this.app.workspace.activeLeaf;
            await activeLeaf.openFile(file);
            new Notice(`项目 "${title}" 创建成功 📋`);
        } catch (error) {
            new Notice(`创建项目失败: ${error.message}`);
        }
    }

    async createArea() {
        const title = await this.promptForInput('请输入领域名称：');
        if (!title) return;

        const fileName = `3-领域/${title}.md`;
        const tag = title.replace(/\s+/g, '');

        const content = this.areaTemplate
            .replace(/{{title}}/g, title)
            .replace(/{{tag}}/g, tag);

        try {
            const file = await this.app.vault.create(fileName, content);
            const activeLeaf = this.app.workspace.activeLeaf;
            await activeLeaf.openFile(file);
            new Notice(`领域 "${title}" 创建成功 🏠`);
        } catch (error) {
            new Notice(`创建领域失败: ${error.message}`);
        }
    }

    async createResource() {
        const title = await this.promptForInput('请输入资源标题：');
        if (!title) return;

        const fileName = `4-资源/${title}.md`;
        const currentDate = new Date().toISOString().split('T')[0];
        const tag = title.replace(/\s+/g, '');

        const content = this.resourceTemplate
            .replace(/{{title}}/g, title)
            .replace(/{{date}}/g, currentDate)
            .replace(/{{tag}}/g, tag);

        try {
            const file = await this.app.vault.create(fileName, content);
            const activeLeaf = this.app.workspace.activeLeaf;
            await activeLeaf.openFile(file);
            new Notice(`资源 "${title}" 创建成功 📚`);
        } catch (error) {
            new Notice(`创建资源失败: ${error.message}`);
        }
    }

    async createDailyDiary() {
        const today = this.getCurrentDate(); // 使用网络时间
        const dateStr = today.toISOString().split('T')[0];
        const year = today.getFullYear();
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        const weekday = '星期' + weekdays[today.getDay()];

        // 新的文件路径结构
        const fileName = `1-周期笔记/${year}/日记/${dateStr}.md`;

        // 确保年度文件夹存在
        await this.ensureYearFolderExists(year);

        // 检查是否已存在
        const existingFile = this.app.vault.getAbstractFileByPath(fileName);
        if (existingFile) {
            // 在当前活动标签页中打开已存在的日记
            const activeLeaf = this.app.workspace.activeLeaf;
            await activeLeaf.openFile(existingFile);
            new Notice('今日日记已存在 📅');
            return;
        }

        const dateTag = dateStr.replace(/-/g, '');

        const content = this.diaryTemplate
            .replace(/{{date}}/g, dateStr)
            .replace(/{{weekday}}/g, weekday)
            .replace(/{{dateTag}}/g, dateTag);

        try {
            const file = await this.app.vault.create(fileName, content);
            // 在当前活动标签页中打开新创建的日记
            const activeLeaf = this.app.workspace.activeLeaf;
            await activeLeaf.openFile(file);
            new Notice('今日日记创建成功 📅');
        } catch (error) {
            new Notice(`创建今日日记失败: ${error.message}`);
        }
    }

    // 添加日期导航功能
    getDateLinks(dateStr) {
        const date = new Date(dateStr);
        const prevDate = new Date(date);
        prevDate.setDate(date.getDate() - 1);
        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);

        return {
            prevDate: prevDate.toISOString().split('T')[0],
            nextDate: nextDate.toISOString().split('T')[0]
        };
    }

    async createWeeklyReview() {
        const today = this.getCurrentDate(); // 使用网络时间
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // 周日为一周开始

        const year = weekStart.getFullYear();
        const weekNum = Math.ceil((weekStart.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));

        const weekStartStr = weekStart.toISOString().split('T')[0];
        const weekEndStr = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // 新的文件路径结构
        const fileName = `1-周期笔记/${year}/周记/周记-${year}W${weekNum.toString().padStart(2, '0')}.md`;

        // 确保年度文件夹存在
        await this.ensureYearFolderExists(year);

        // 检查是否已存在
        const existingFile = this.app.vault.getAbstractFileByPath(fileName);
        if (existingFile) {
            const activeLeaf = this.app.workspace.activeLeaf;
            await activeLeaf.openFile(existingFile);
            new Notice('本周周记已存在 📅');
            return;
        }

        // 生成一周的日期
        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            weekDates.push(date.toISOString().split('T')[0]);
        }

        const content = this.weeklyTemplate
            .replace(/{{weekRange}}/g, `${year}年第${weekNum}周`)
            .replace(/{{weekNum}}/g, weekNum)
            .replace(/{{startDate}}/g, weekStartStr)
            .replace(/{{endDate}}/g, weekEndStr)
            .replace(/{{mon}}/g, weekDates[1])
            .replace(/{{tue}}/g, weekDates[2])
            .replace(/{{wed}}/g, weekDates[3])
            .replace(/{{thu}}/g, weekDates[4])
            .replace(/{{fri}}/g, weekDates[5])
            .replace(/{{sat}}/g, weekDates[6])
            .replace(/{{sun}}/g, weekDates[0])
            .replace(/{{currentWeek}}/g, `${year}W${weekNum.toString().padStart(2, '0')}`)
            .replace(/{{prevWeek}}/g, `${year}W${(weekNum-1).toString().padStart(2, '0')}`)
            .replace(/{{nextWeek}}/g, `${year}W${(weekNum+1).toString().padStart(2, '0')}`)
            .replace(/{{yearWeek}}/g, `${year}W${weekNum.toString().padStart(2, '0')}`);

        try {
            const file = await this.app.vault.create(fileName, content);
            const activeLeaf = this.app.workspace.activeLeaf;
            await activeLeaf.openFile(file);
            new Notice(`本周周记创建成功 📅`);
        } catch (error) {
            new Notice(`创建周记失败: ${error.message}`);
        }
    }

    async createMonthlyReview() {
        const today = this.getCurrentDate(); // 使用网络时间
        const year = today.getFullYear();
        const month = today.getMonth() + 1;

        // 新的文件路径结构
        const fileName = `1-周期笔记/${year}/月记/月记-${year}年${month.toString().padStart(2, '0')}月.md`;

        // 确保年度文件夹存在
        await this.ensureYearFolderExists(year);

        // 检查是否已存在
        const existingFile = this.app.vault.getAbstractFileByPath(fileName);
        if (existingFile) {
            const activeLeaf = this.app.workspace.activeLeaf;
            await activeLeaf.openFile(existingFile);
            new Notice('本月月记已存在 📊');
            return;
        }

        const monthRange = `${year}年${month}月1日 - ${year}年${month}月${new Date(year, month, 0).getDate()}日`;

        const content = this.monthlyTemplate
            .replace(/{{year}}/g, year)
            .replace(/{{month}}/g, month)
            .replace(/{{monthRange}}/g, monthRange)
            .replace(/{{currentMonth}}/g, `${year}年${month.toString().padStart(2, '0')}月`)
            .replace(/{{prevMonth}}/g, `${month === 1 ? year - 1 : year}年${month === 1 ? '12' : (month - 1).toString().padStart(2, '0')}月`)
            .replace(/{{nextMonth}}/g, `${month === 12 ? year + 1 : year}年${month === 12 ? '01' : (month + 1).toString().padStart(2, '0')}月`)
            .replace(/{{yearMonth}}/g, `${year}M${month.toString().padStart(2, '0')}`);

        try {
            const file = await this.app.vault.create(fileName, content);
            const activeLeaf = this.app.workspace.activeLeaf;
            await activeLeaf.openFile(file);
            new Notice(`本月月记创建成功 📊`);
        } catch (error) {
            new Notice(`创建月记失败: ${error.message}`);
        }
    }

    async createYearlyGoals() {
        const currentDate = this.getCurrentDate();
        const year = currentDate.getFullYear();

        const fileName = `1-周期笔记/${year}/年终总结/${year}年度目标.md`;

        // 确保年度文件夹存在
        await this.ensureYearFolderExists(year);

        // 检查是否已存在
        const existingFile = this.app.vault.getAbstractFileByPath(fileName);
        if (existingFile) {
            const activeLeaf = this.app.workspace.activeLeaf;
            await activeLeaf.openFile(existingFile);
            new Notice(`${year}年度目标已存在 🎯`);
            return;
        }

        const content = this.yearlyGoalsTemplate
            .replace(/{{year}}/g, year);

        try {
            const file = await this.app.vault.create(fileName, content);
            const activeLeaf = this.app.workspace.activeLeaf;
            await activeLeaf.openFile(file);
            new Notice(`${year}年度目标创建成功 🎯`);
        } catch (error) {
            new Notice(`创建年度目标失败: ${error.message}`);
        }
    }

    async createQuarterlyGoals() {
        const currentDate = this.getCurrentDate();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const quarter = Math.ceil(month / 3);

        // 计算季度月份范围
        const quarterMonths = {
            1: { months: [1, 2, 3], range: '1-3月', endDate: `${year}-03-31` },
            2: { months: [4, 5, 6], range: '4-6月', endDate: `${year}-06-30` },
            3: { months: [7, 8, 9], range: '7-9月', endDate: `${year}-09-30` },
            4: { months: [10, 11, 12], range: '10-12月', endDate: `${year}-12-31` }
        };

        const quarterInfo = quarterMonths[quarter];
        const fileName = `1-周期笔记/${year}/年终总结/${year}年Q${quarter}季度目标.md`;

        // 确保年度文件夹存在
        await this.ensureYearFolderExists(year);

        // 检查是否已存在
        const existingFile = this.app.vault.getAbstractFileByPath(fileName);
        if (existingFile) {
            const activeLeaf = this.app.workspace.activeLeaf;
            await activeLeaf.openFile(existingFile);
            new Notice(`${year}年Q${quarter}季度目标已存在 📈`);
            return;
        }

        const content = this.quarterlyGoalsTemplate
            .replace(/{{year}}/g, year)
            .replace(/{{quarter}}/g, quarter)
            .replace(/{{monthRange}}/g, quarterInfo.range)
            .replace(/{{endDate}}/g, quarterInfo.endDate)
            .replace(/{{month1}}/g, quarterInfo.months[0])
            .replace(/{{month2}}/g, quarterInfo.months[1])
            .replace(/{{month3}}/g, quarterInfo.months[2]);

        try {
            const file = await this.app.vault.create(fileName, content);
            const activeLeaf = this.app.workspace.activeLeaf;
            await activeLeaf.openFile(file);
            new Notice(`${year}年Q${quarter}季度目标创建成功 📈`);
        } catch (error) {
            new Notice(`创建季度目标失败: ${error.message}`);
        }
    }

    async createMonthlyGoals() {
        const currentDate = this.getCurrentDate();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const quarter = Math.ceil(month / 3);

        // 获取月份信息
        const monthNames = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
        const monthName = monthNames[month];
        const lastDay = new Date(year, month, 0).getDate();

        // 计算周范围
        const firstMonday = this.getFirstMondayOfMonth(year, month);
        const weeks = this.getWeeksInMonth(year, month, firstMonday);

        const fileName = `1-周期笔记/${year}/月记/${year}年${month.toString().padStart(2, '0')}月目标.md`;

        // 确保年度文件夹存在
        await this.ensureYearFolderExists(year);

        // 检查是否已存在
        const existingFile = this.app.vault.getAbstractFileByPath(fileName);
        if (existingFile) {
            const activeLeaf = this.app.workspace.activeLeaf;
            await activeLeaf.openFile(existingFile);
            new Notice(`${year}年${month}月目标已存在 🎯`);
            return;
        }

        // 前后月份
        const prevMonth = month === 1 ? 12 : month - 1;
        const nextMonth = month === 12 ? 1 : month + 1;
        const prevMonthName = monthNames[prevMonth];
        const nextMonthName = monthNames[nextMonth];

        const content = this.monthlyGoalsTemplate
            .replace(/{{year}}/g, year)
            .replace(/{{month}}/g, monthName)
            .replace(/{{monthNum}}/g, month.toString().padStart(2, '0'))
            .replace(/{{quarter}}/g, quarter)
            .replace(/{{lastDay}}/g, lastDay)
            .replace(/{{quarterGoal1}}/g, `Q${quarter}目标1`)
            .replace(/{{quarterGoal2}}/g, `Q${quarter}目标2`)
            .replace(/{{quarterGoal3}}/g, `Q${quarter}目标3`)
            .replace(/{{week1Range}}/g, weeks[0] || '第1周')
            .replace(/{{week2Range}}/g, weeks[1] || '第2周')
            .replace(/{{week3Range}}/g, weeks[2] || '第3周')
            .replace(/{{week4Range}}/g, weeks[3] || '第4周')
            .replace(/{{prevMonth}}/g, prevMonthName)
            .replace(/{{nextMonth}}/g, nextMonthName);

        try {
            const file = await this.app.vault.create(fileName, content);
            const activeLeaf = this.app.workspace.activeLeaf;
            await activeLeaf.openFile(file);
            new Notice(`${year}年${month}月目标创建成功 🎯`);
        } catch (error) {
            new Notice(`创建月度目标失败: ${error.message}`);
        }
    }

    getFirstMondayOfMonth(year, month) {
        const firstDay = new Date(year, month - 1, 1);
        const dayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday
        const daysToAdd = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7;
        return new Date(year, month - 1, 1 + daysToAdd);
    }

    getWeeksInMonth(year, month, firstMonday) {
        const weeks = [];
        const lastDay = new Date(year, month, 0).getDate();

        let currentWeekStart = new Date(firstMonday);

        for (let weekNum = 1; weekNum <= 5; weekNum++) {
            const weekEnd = new Date(currentWeekStart);
            weekEnd.setDate(currentWeekStart.getDate() + 6);

            if (currentWeekStart.getDate() > lastDay) break;

            const endDay = Math.min(weekEnd.getDate(), lastDay);
            const weekRange = `${month}月${currentWeekStart.getDate()}日-${endDay}日`;
            weeks.push(weekRange);

            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        }

        return weeks;
    }

    async showGoalsReview() {
        const modal = new GoalsReviewModal(this.app, this);
        modal.open();
    }

    // ========== 时间统计相关方法 ==========

    addTimeRecord() {
        // 获取当前打开的日历视图
        const calendarLeaves = this.app.workspace.getLeavesOfType(CALENDAR_VIEW_TYPE);
        if (calendarLeaves.length > 0) {
            const calendarView = calendarLeaves[0].view;
            const modal = new TimeRecordModal(this.app, calendarView);
            modal.open();
        } else {
            new Notice('⚠️ 请先打开 PARA 日历视图');
        }
    }

    showTimeReport() {
        // 获取当前打开的日历视图
        const calendarLeaves = this.app.workspace.getLeavesOfType(CALENDAR_VIEW_TYPE);
        if (calendarLeaves.length > 0) {
            const calendarView = calendarLeaves[0].view;
            const modal = new TimeReportModal(this.app, calendarView);
            modal.open();
        } else {
            new Notice('⚠️ 请先打开 PARA 日历视图');
        }
    }

    async exportWeeklyTimeReport() {
        // 获取当前打开的日历视图
        const calendarLeaves = this.app.workspace.getLeavesOfType(CALENDAR_VIEW_TYPE);
        if (calendarLeaves.length > 0) {
            const calendarView = calendarLeaves[0].view;
            const report = calendarView.generateTimeReviewReport('week');

            try {
                const year = this.getCurrentDate().getFullYear();
                const weekNum = this.getWeekNumber(this.getCurrentDate());
                const filename = `1-周期笔记/${year}/时间复盘报告-第${weekNum}周-${new Date().toISOString().split('T')[0]}.md`;

                // 确保目录存在
                await this.ensureYearFolderExists(year);

                // 创建文件
                const existingFile = this.app.vault.getAbstractFileByPath(filename);
                if (existingFile) {
                    await this.app.vault.modify(existingFile, report);
                } else {
                    await this.app.vault.create(filename, report);
                }

                new Notice(`📄 本周时间复盘已导出: ${filename}`);

                // 可选择性打开文件
                const file = this.app.vault.getAbstractFileByPath(filename);
                if (file) {
                    this.app.workspace.openLinkText(filename, '', true);
                }
            } catch (error) {
                console.error('导出本周时间复盘失败:', error);
                new Notice('❌ 导出本周时间复盘失败');
            }
        } else {
            new Notice('⚠️ 请先打开 PARA 日历视图');
        }
    }

    // 获取周数的辅助方法
    getWeekNumber(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }

    // ========== 逾期任务提醒系统 ==========

    // 初始化逾期任务提醒
    initializeOverdueReminder() {
        // 每小时检查一次逾期任务
        this.overdueCheckInterval = setInterval(() => {
            this.checkAndShowOverdueReminder();
        }, 60 * 60 * 1000); // 1小时

        // 插件加载时立即检查一次
        setTimeout(() => {
            this.checkAndShowOverdueReminder();
        }, 5000); // 延迟5秒，确保插件完全加载
    }

    // 检查并显示逾期提醒
    checkAndShowOverdueReminder() {
        const calendarLeaves = this.app.workspace.getLeavesOfType('para-calendar-view');
        if (calendarLeaves.length > 0) {
            const calendarView = calendarLeaves[0].view;

            // 更新所有任务的截止信息
            calendarView.updateAllTasksDueInfo();

            const overdueTasks = calendarView.getOverdueTasks();
            const todayTasks = calendarView.getTodayDueTasks();

            if (overdueTasks.length > 0 || todayTasks.length > 0) {
                this.showOverdueNotification(overdueTasks, todayTasks);
            }
        }
    }

    // 显示逾期通知
    showOverdueNotification(overdueTasks, todayTasks) {
        // 避免频繁提醒，检查上次提醒时间
        const now = Date.now();
        if (this.lastReminderTime && (now - this.lastReminderTime) < 30 * 60 * 1000) {
            return; // 30分钟内不重复提醒
        }
        this.lastReminderTime = now;

        let message = '';
        let noticeClass = '';

        if (overdueTasks.length > 0) {
            message += `⚠️ 您有 ${overdueTasks.length} 个逾期任务`;
            noticeClass = 'overdue-notice';
        }

        if (todayTasks.length > 0) {
            if (message) message += '\n';
            message += `🔥 您有 ${todayTasks.length} 个任务今天到期`;
            if (!noticeClass) noticeClass = 'due-today-notice';
        }

        // 创建可点击的通知
        const notice = new Notice(message, 10000); // 10秒显示

        // 添加点击事件打开任务详情
        const noticeEl = notice.noticeEl;
        noticeEl.addClass(noticeClass);
        noticeEl.style.cursor = 'pointer';

        noticeEl.onclick = () => {
            this.showOverdueTasksModal(overdueTasks, todayTasks);
            notice.hide();
        };

        // 添加提醒样式
        this.addReminderStyles();
    }

    // 显示逾期任务详情模态框
    showOverdueTasksModal(overdueTasks, todayTasks) {
        const modal = new OverdueTasksModal(this.app, overdueTasks, todayTasks);
        modal.open();
    }

    // 添加提醒样式
    addReminderStyles() {
        if (document.querySelector('#overdue-reminder-styles')) return;

        const style = document.createElement('style');
        style.id = 'overdue-reminder-styles';
        style.textContent = `
            .notice.overdue-notice {
                background: #fee2e2 !important;
                border-left: 4px solid #dc2626 !important;
                color: #dc2626 !important;
                animation: pulse 2s infinite;
            }

            .notice.due-today-notice {
                background: #fef3c7 !important;
                border-left: 4px solid #f59e0b !important;
                color: #d97706 !important;
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.8; }
            }
        `;
        document.head.appendChild(style);
    }

    // 清理逾期提醒
    cleanupOverdueReminder() {
        if (this.overdueCheckInterval) {
            clearInterval(this.overdueCheckInterval);
            this.overdueCheckInterval = null;
        }

        // 移除提醒样式
        const style = document.querySelector('#overdue-reminder-styles');
        if (style) {
            style.remove();
        }
    }

    async createYearlyReview() {
        const today = this.getCurrentDate(); // 使用网络时间
        const year = today.getFullYear();

        // 新的文件路径结构
        const fileName = `1-周期笔记/${year}/年终总结/年记-${year}年度总结.md`;

        // 确保年度文件夹存在
        await this.ensureYearFolderExists(year);

        // 检查是否已存在
        const existingFile = this.app.vault.getAbstractFileByPath(fileName);
        if (existingFile) {
            const activeLeaf = this.app.workspace.activeLeaf;
            await activeLeaf.openFile(existingFile);
            new Notice('本年年记已存在 🎊');
            return;
        }

        const content = this.yearlyTemplate
            .replace(/{{year}}/g, year)
            .replace(/{{nextYear}}/g, year + 1)
            .replace(/{{prevYear}}/g, year - 1);

        try {
            const file = await this.app.vault.create(fileName, content);
            const activeLeaf = this.app.workspace.activeLeaf;
            await activeLeaf.openFile(file);
            new Notice(`${year}年年记创建成功 🎊`);
        } catch (error) {
            new Notice(`创建年记失败: ${error.message}`);
        }
    }

    async searchDiary() {
        const modal = new DiarySearchModal(this.app, this);
        modal.open();
    }

    async activateCalendarView() {
        const { workspace } = this.app;

        let leaf = null;
        const leaves = workspace.getLeavesOfType(CALENDAR_VIEW_TYPE);

        if (leaves.length > 0) {
            // 如果已经有日历视图，激活它
            leaf = leaves[0];
            console.log('Found existing calendar view');
        } else {
            // 创建新的日历视图 - 使用兼容的API
            try {
                console.log('Creating new calendar view...');

                // 方法1: 尝试使用新API
                if (typeof workspace.getLeaf === 'function') {
                    leaf = workspace.getLeaf(false);
                } else if (typeof workspace.createLeafBySplit === 'function') {
                    // 方法2: 使用旧API
                    leaf = workspace.createLeafBySplit(workspace.activeLeaf);
                } else {
                    // 方法3: 使用最基本的API
                    leaf = workspace.activeLeaf;
                }

                if (!leaf) {
                    throw new Error('Unable to create leaf');
                }

                await leaf.setViewState({
                    type: CALENDAR_VIEW_TYPE,
                    active: true,
                    state: {}
                });

                console.log('Calendar view created successfully');
            } catch (error) {
                console.error('Error creating calendar view:', error);
                new Notice('创建日历视图失败，请使用命令面板手动创建');
                return null;
            }
        }

        if (leaf) {
            workspace.revealLeaf(leaf);
            return leaf;
        }
        return null;
    }

    async openSidebarCalendarView() {
        const { workspace } = this.app;

        // 首先检查是否已经有日历视图
        const leaves = workspace.getLeavesOfType(CALENDAR_VIEW_TYPE);

        if (leaves.length > 0) {
            // 如果已存在，激活现有的日历视图
            const leaf = leaves[0];
            workspace.revealLeaf(leaf);

            // 确保右侧边栏展开
            if (workspace.rightSplit && workspace.rightSplit.collapsed) {
                workspace.rightSplit.expand();
            }

            return leaf;
        } else {
            // 如果不存在，创建新的侧边栏日历视图
            return await this.createSidebarCalendarView();
        }
    }

    async createSidebarCalendarView() {
        const { workspace } = this.app;

        try {
            console.log('Creating sidebar calendar view...');

            // 获取右侧边栏
            let rightLeaf = null;
            const rightSplit = workspace.rightSplit;

            if (rightSplit && rightSplit.children && rightSplit.children.length > 0) {
                // 尝试在现有的右侧栏中创建新标签
                const existingTabGroup = rightSplit.children[0];
                if (existingTabGroup.children) {
                    rightLeaf = workspace.createLeafInParent(existingTabGroup, existingTabGroup.children.length);
                }
            }

            // 如果右侧边栏不存在或创建失败，尝试创建新的侧边栏叶子
            if (!rightLeaf) {
                rightLeaf = workspace.getRightLeaf(false);
            }

            // 如果仍然失败，使用通用方法
            if (!rightLeaf) {
                rightLeaf = workspace.getLeaf(false);
            }

            if (!rightLeaf) {
                throw new Error('Unable to create sidebar leaf');
            }

            await rightLeaf.setViewState({
                type: CALENDAR_VIEW_TYPE,
                active: false, // 不立即激活，保持在侧边栏
                state: {}
            });

            // 确保右侧边栏展开
            if (workspace.rightSplit && workspace.rightSplit.collapsed) {
                workspace.rightSplit.expand();
            }

            console.log('Calendar view created successfully in sidebar');
            return rightLeaf;

        } catch (error) {
            console.error('Error creating sidebar calendar view:', error);
            // 回退到原来的方法
            console.log('Falling back to standard calendar view creation...');
            return await this.activateCalendarView();
        }
    }

    async setupInitialCalendarView() {
        const { workspace } = this.app;

        // 检查是否已经有日历视图
        const leaves = workspace.getLeavesOfType(CALENDAR_VIEW_TYPE);
        if (leaves.length === 0) {
            // 等待更长时间确保workspace完全加载
            setTimeout(async () => {
                console.log('Attempting to create initial calendar view...');
                try {
                    const result = await this.createSidebarCalendarView();
                    if (result) {
                        new Notice('📅 PARA日历已固定到侧边栏');
                        console.log('Calendar view created successfully in sidebar');
                    } else {
                        console.log('Failed to create calendar view');
                    }
                } catch (error) {
                    console.error('Error in setupInitialCalendarView:', error);
                }
            }, 2000); // 增加到2秒
        } else {
            console.log('Calendar view already exists');
        }
    }

    async showCalendar() {
        const modal = new CalendarModal(this.app, this);
        modal.open();
    }

    async showDiaryStats() {
        // 获取所有周期笔记文件
        const diaryFiles = this.app.vault.getMarkdownFiles()
            .filter(file => file.path.startsWith('1-周期笔记/') &&
                (file.path.includes('/日记/') ||
                 file.path.includes('/周记/') ||
                 file.path.includes('/月记/') ||
                 file.path.includes('/年终总结/')));

        const stats = {
            total: diaryFiles.length,
            thisMonth: 0,
            thisYear: 0,
            totalWords: 0,
            dailyCount: 0,
            weeklyCount: 0,
            monthlyCount: 0,
            yearlyCount: 0
        };

        const now = this.getCurrentDate(); // 使用网络时间
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        for (const file of diaryFiles) {
            // 分类统计不同类型的笔记
            if (file.path.includes('/日记/')) {
                stats.dailyCount++;
                // 从文件名提取日期 (YYYY-MM-DD.md)
                const dateMatch = file.name.match(/(\d{4})-(\d{2})-(\d{2})\.md/);
                if (dateMatch) {
                    const year = parseInt(dateMatch[1]);
                    const month = parseInt(dateMatch[2]);

                    if (year === currentYear) {
                        stats.thisYear++;
                        if (month === currentMonth) {
                            stats.thisMonth++;
                        }
                    }
                }
            } else if (file.path.includes('/周记/')) {
                stats.weeklyCount++;
            } else if (file.path.includes('/月记/')) {
                stats.monthlyCount++;
            } else if (file.path.includes('/年终总结/')) {
                stats.yearlyCount++;
            }

            // 计算字数
            try {
                const content = await this.app.vault.read(file);
                stats.totalWords += content.length;
            } catch (error) {
                console.error('Error reading file:', file.path, error);
            }
        }

        const modal = new DiaryStatsModal(this.app, stats);
        modal.open();
    }

    async showTimeStatus() {
        const modal = new TimeStatusModal(this.app, this);
        modal.open();
    }

    async debugCalendarTime() {
        console.log('📅 开始调试日历时间...');

        const localTime = new Date();
        const networkTime = this.getCurrentDate();

        console.log('🕐 时间对比:');
        console.log(`  本地时间: ${localTime.toISOString()}`);
        console.log(`  网络时间: ${networkTime.toISOString()}`);
        console.log(`  时间偏移: ${this.timeOffset}ms`);

        console.log('📅 日期信息:');
        console.log(`  本地日期: ${localTime.getFullYear()}年${localTime.getMonth() + 1}月${localTime.getDate()}日`);
        console.log(`  网络日期: ${networkTime.getFullYear()}年${networkTime.getMonth() + 1}月${networkTime.getDate()}日`);
        console.log(`  本地星期: 星期${['日', '一', '二', '三', '四', '五', '六'][localTime.getDay()]}`);
        console.log(`  网络星期: 星期${['日', '一', '二', '三', '四', '五', '六'][networkTime.getDay()]}`);

        // 检查日历视图状态
        const calendarLeaves = this.app.workspace.getLeavesOfType(CALENDAR_VIEW_TYPE);
        console.log(`🔍 日历视图数量: ${calendarLeaves.length}`);

        calendarLeaves.forEach((leaf, index) => {
            if (leaf.view) {
                console.log(`  日历${index + 1}当前日期: ${leaf.view.currentDate?.toISOString() || '未设置'}`);
                console.log(`  日历${index + 1}视图模式: ${leaf.view.viewMode || '未知'}`);
            }
        });

        new Notice('📅 日历时间调试完成，请查看控制台详细信息');
    }

    async setManualDate() {
        const dateStr = await this.promptForInput('请输入日期 (格式: YYYY-MM-DD):');
        if (!dateStr) return;

        try {
            // 验证日期格式
            const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (!dateMatch) {
                new Notice('❌ 日期格式错误，请使用 YYYY-MM-DD 格式');
                return;
            }

            const targetDate = new Date(`${dateStr}T12:00:00.000Z`);
            if (isNaN(targetDate.getTime())) {
                new Notice('❌ 无效的日期');
                return;
            }

            const localNow = new Date();
            this.timeOffset = targetDate.getTime() - localNow.getTime();

            // 设置模拟的网络时间数据
            this.networkTime = {
                serverTime: targetDate,
                timezone: 'Asia/Shanghai',
                source: '手动设置',
                timestamp: Date.now(),
                responseTime: 0
            };
            this.lastSync = Date.now();

            // 更新状态栏
            this.statusBarItem?.setText('PARA ✓ (手动)');

            // 获取星期几
            const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
            const weekday = weekdays[targetDate.getDay()];

            console.log(`⏰ 手动设置日期: ${dateStr} 星期${weekday}`);
            console.log(`⏰ 时间偏移: ${this.timeOffset}ms`);

            new Notice(`📅 日期已设置为: ${dateStr} 星期${weekday}`, 3000);

            // 刷新日历视图
            this.refreshCalendarViews();

        } catch (error) {
            new Notice(`❌ 设置失败: ${error.message}`);
        }
    }

    async showDashboard() {
        const modal = new DashboardModal(this.app, this);
        modal.open();
    }

    async promptForInput(message) {
        return new Promise((resolve) => {
            const modal = new InputModal(this.app, message, resolve);
            modal.open();
        });
    }

    onunload() {
        console.log('🔄 LifeOS PARA Core 插件正在卸载...');

        // 清理定时器
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('🧹 时间同步定时器已清理');
        }

        // 清理时间状态
        this.networkTime = null;
        this.timeOffset = 0;
        this.lastSync = null;

        // 清理逾期任务提醒
        this.cleanupOverdueReminder();

        console.log('✅ LifeOS PARA Core 插件卸载完成');
    }
}

// 日历视图组件 - 增强的拖拽式任务调度界面
class CalendarView extends ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        this.plugin = plugin;
        this.currentDate = plugin.getCurrentDate(); // 使用网络时间
        this.tasks = new Map(); // 存储任务数据
        this.timeRecords = new Map(); // 存储时间记录数据
        this.isDragging = false;
        this.draggedTask = null;
        this.viewMode = 'month'; // 'month', 'week', 'day'

        // 任务存储文件路径（动态计算以确保使用正确年份）
        this.getTaskStorePath = () => {
            const year = this.getCurrentDate().getFullYear();
            return `1-周期笔记/${year}/任务数据.json`;
        };

        // 时间记录存储文件路径
        this.getTimeRecordsPath = () => {
            const year = this.getCurrentDate().getFullYear();
            return `1-周期笔记/${year}/时间记录.json`;
        };

        this.loadTasks();
        this.loadTimeRecords();
    }

    getViewType() {
        return CALENDAR_VIEW_TYPE;
    }

    getDisplayText() {
        return 'PARA日历';
    }

    getIcon() {
        return 'calendar-days';
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('para-calendar-container');

        // 创建工具栏
        this.renderToolbar();

        // 创建主要内容区域
        this.renderMainContent();

        // 添加样式
        this.addEnhancedStyles();

        // 加载任务数据
        await this.loadTasks();
    }

    renderToolbar() {
        const container = this.containerEl.children[1];
        const toolbar = container.createDiv('para-calendar-toolbar');

        // 视图切换按钮
        const viewModeGroup = toolbar.createDiv('view-mode-group');
        const viewModes = [
            { mode: 'month', label: '月视图', icon: '📅' },
            { mode: 'week', label: '周视图', icon: '📆' },
            { mode: 'kanban', label: '看板', icon: '📋' },
            { mode: 'day', label: '日视图', icon: '🕐' }
        ];

        viewModes.forEach(({ mode, label, icon }) => {
            const btn = viewModeGroup.createEl('button', {
                text: `${icon} ${label}`,
                cls: `view-mode-btn ${this.viewMode === mode ? 'active' : ''}`
            });
            btn.onclick = () => {
                this.viewMode = mode;
                this.renderMainContent();
                // 更新按钮状态
                viewModeGroup.querySelectorAll('.view-mode-btn').forEach(b => b.removeClass('active'));
                btn.addClass('active');
            };
        });

        // 操作按钮
        const actionGroup = toolbar.createDiv('action-group');

        const addTaskBtn = actionGroup.createEl('button', {
            text: '➕ 添加任务',
            cls: 'action-btn primary'
        });
        addTaskBtn.onclick = () => this.showAddTaskModal();

        const todayBtn = actionGroup.createEl('button', {
            text: '📍 今天',
            cls: 'action-btn secondary'
        });
        todayBtn.onclick = () => {
            this.currentDate = this.plugin.getCurrentDate(); // 使用网络时间
            this.renderMainContent();
        };

        // 时间记录按钮
        const timeRecordBtn = actionGroup.createEl('button', {
            text: '⏱️ 记录时间',
            cls: 'action-btn primary'
        });
        timeRecordBtn.onclick = () => {
            const modal = new TimeRecordModal(this.app, this);
            modal.open();
        };

        // 时间统计按钮
        const timeReportBtn = actionGroup.createEl('button', {
            text: '📊 时间统计',
            cls: 'action-btn secondary'
        });
        timeReportBtn.onclick = () => {
            const modal = new TimeReportModal(this.app, this);
            modal.open();
        };

        // 任务过滤按钮
        const filterBtn = actionGroup.createEl('button', {
            text: '🔍 过滤',
            cls: 'action-btn secondary'
        });
        filterBtn.onclick = () => {
            this.showTaskFilterModal();
        };

        // 添加时间同步按钮
        const syncBtn = actionGroup.createEl('button', {
            text: '🌐 同步时间',
            cls: 'action-btn secondary'
        });
        syncBtn.onclick = async () => {
            await this.plugin.forceTimeSync();
            this.currentDate = this.plugin.getCurrentDate();
            this.renderMainContent();
        };
    }

    renderMainContent() {
        const container = this.containerEl.children[1];

        // 清除之前的主内容
        const existingMain = container.querySelector('.main-content');
        if (existingMain) existingMain.remove();

        const mainContent = container.createDiv('main-content');

        switch (this.viewMode) {
            case 'month':
                this.renderMonthView(mainContent);
                break;
            case 'week':
                this.renderWeekView(mainContent);
                break;
            case 'kanban':
                this.renderKanbanView(mainContent);
                break;
            case 'day':
                this.renderDayView(mainContent);
                break;
        }
    }

    renderMonthView(container) {
        // 月份导航
        const header = container.createDiv('para-calendar-header');

        const prevBtn = header.createEl('button', {
            text: '‹',
            cls: 'para-nav-btn para-nav-prev'
        });

        const monthDisplay = header.createEl('span', {
            text: `${this.currentDate.getFullYear()}年${this.currentDate.getMonth() + 1}月`,
            cls: 'para-month-display'
        });

        const nextBtn = header.createEl('button', {
            text: '›',
            cls: 'para-nav-btn para-nav-next'
        });

        // 导航事件
        prevBtn.onclick = () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderMainContent();
        };

        nextBtn.onclick = () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderMainContent();
        };

        // 月历网格
        this.renderMonthGrid(container);
    }

    renderMonthGrid(container) {
        const calendar = container.createDiv('para-calendar-grid month-grid');

        // 星期标题
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        const weekHeader = calendar.createDiv('para-week-header');
        weekdays.forEach(day => {
            weekHeader.createEl('div', { text: day, cls: 'para-weekday' });
        });

        // 获取月份日期范围
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        // 获取已有日记
        const diaryFiles = this.app.vault.getMarkdownFiles()
            .filter(file => file.path.includes('/日记/'));
        const diaryDates = new Set();
        diaryFiles.forEach(file => {
            const match = file.name.match(/(\d{4}-\d{2}-\d{2})\.md/);
            if (match) diaryDates.add(match[1]);
        });

        // 生成日历天数
        const daysGrid = calendar.createDiv('para-days-grid');
        const today = this.plugin.getCurrentDate().toISOString().split('T')[0];

        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            if (date.getMonth() !== this.currentDate.getMonth()) continue;

            const dateStr = date.toISOString().split('T')[0];
            const isToday = dateStr === today;
            const hasDiary = diaryDates.has(dateStr);

            const dayEl = daysGrid.createEl('div', {
                cls: 'para-day day-cell'
            });
            dayEl.setAttribute('data-date', dateStr);

            // 日期数字
            const dateNumber = dayEl.createDiv('date-number');
            dateNumber.textContent = date.getDate().toString();

            // 日记指示器
            if (hasDiary) {
                const diaryIndicator = dayEl.createDiv('diary-indicator');
                diaryIndicator.textContent = '📝';
            }

            // 任务列表
            const tasksList = dayEl.createDiv('tasks-list');
            this.renderTasksForDate(tasksList, dateStr);

            if (isToday) dayEl.addClass('para-today');
            if (hasDiary) dayEl.addClass('para-has-diary');

            // 拖放事件
            this.setupDragAndDrop(dayEl, dateStr);

            // 点击事件
            dayEl.onclick = async (e) => {
                if (!e.target.classList.contains('task-item')) {
                    await this.createOrOpenDiary(dateStr, date);
                }
            };
        }
    }

    renderTasksForDate(container, dateStr) {
        let dayTasks = this.tasks.get(dateStr) || [];

        // 应用过滤器
        if (this.currentFilters) {
            dayTasks = this.filterTasks(dayTasks, this.currentFilters);
        }

        // 按截止日期排序任务
        const sortedTasks = this.sortTasksByDueDate([...dayTasks]);

        if (sortedTasks.length === 0 && this.currentFilters) {
            // 如果过滤后没有任务，显示提示
            const emptyMsg = container.createDiv('empty-filter-message');
            emptyMsg.textContent = '没有符合过滤条件的任务';
            return;
        }

        sortedTasks.forEach(task => {
            const taskEl = container.createDiv('task-item');
            taskEl.setAttribute('draggable', 'true');
            taskEl.setAttribute('data-task-id', task.id);

            const priorityClass = task.priority ? `priority-${task.priority}` : '';
            taskEl.addClass(priorityClass);

            // 如果逾期，添加逾期样式
            if (task.isOverdue && !task.completed) {
                taskEl.addClass('overdue-task');
            }

            // 任务状态图标
            const statusIcon = task.completed ? '✅' : '⭕';
            const statusEl = taskEl.createSpan('task-status');
            statusEl.textContent = statusIcon;

            // 任务主体内容区域
            const contentArea = taskEl.createDiv('task-content');

            // 任务标题
            const titleEl = contentArea.createSpan('task-title');
            titleEl.textContent = task.title;

            // 截止日期标签
            if (task.dueDate) {
                const dueBadge = this.createDueDateBadge(task);
                if (dueBadge) {
                    contentArea.appendChild(dueBadge);
                }
            }

            // 任务完成切换
            statusEl.onclick = (e) => {
                e.stopPropagation();
                this.toggleTaskCompletion(task.id);
            };

            // 拖拽开始
            taskEl.addEventListener('dragstart', (e) => {
                this.isDragging = true;
                this.draggedTask = task;
                e.dataTransfer.setData('text/plain', task.id);
                taskEl.addClass('dragging');
            });

            // 拖拽结束
            taskEl.addEventListener('dragend', () => {
                this.isDragging = false;
                this.draggedTask = null;
                taskEl.removeClass('dragging');
            });

            // 双击编辑任务
            taskEl.addEventListener('dblclick', () => {
                this.editTask(task);
            });
        });
    }

    setupDragAndDrop(dayEl, dateStr) {
        // 拖拽进入
        dayEl.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (this.isDragging) {
                dayEl.addClass('drag-over');
            }
        });

        // 拖拽离开
        dayEl.addEventListener('dragleave', (e) => {
            dayEl.removeClass('drag-over');
        });

        // 拖拽放置
        dayEl.addEventListener('drop', (e) => {
            e.preventDefault();
            dayEl.removeClass('drag-over');

            if (this.draggedTask) {
                this.moveTaskToDate(this.draggedTask.id, dateStr);
            }
        });
    }

    // 任务管理方法
    async loadTasks() {
        try {
            const taskStorePath = this.getTaskStorePath();
            const file = this.app.vault.getAbstractFileByPath(taskStorePath);
            if (file) {
                const content = await this.app.vault.read(file);
                const data = JSON.parse(content);

                // 重建 Map
                this.tasks.clear();
                Object.entries(data).forEach(([date, tasks]) => {
                    this.tasks.set(date, tasks);
                });
                console.log(`📋 任务数据加载成功: ${taskStorePath}`);
            }
        } catch (error) {
            console.log('📋 任务数据文件不存在或格式错误，使用空数据:', error.message);
            this.tasks.clear();
        }
    }

    async saveTasks() {
        try {
            // 确保目录存在
            const year = this.plugin.getCurrentDate().getFullYear();
            await this.plugin.ensureYearFolderExists(year);

            // 将 Map 转换为普通对象
            const data = Object.fromEntries(this.tasks);
            const content = JSON.stringify(data, null, 2);

            const taskStorePath = this.getTaskStorePath();
            const file = this.app.vault.getAbstractFileByPath(taskStorePath);
            if (file) {
                await this.app.vault.modify(file, content);
            } else {
                await this.app.vault.create(taskStorePath, content);
            }
            console.log(`💾 任务数据保存成功: ${taskStorePath}`);
        } catch (error) {
            console.error('💾 保存任务数据失败:', error);
            new Notice('保存任务数据失败，请检查文件权限');
        }
    }

    // ========== 时间记录管理 ==========

    async loadTimeRecords() {
        try {
            const timeRecordsPath = this.getTimeRecordsPath();
            const file = this.app.vault.getAbstractFileByPath(timeRecordsPath);
            if (file) {
                const content = await this.app.vault.read(file);
                const data = JSON.parse(content);

                // 重建 Map
                this.timeRecords.clear();
                Object.entries(data).forEach(([date, records]) => {
                    this.timeRecords.set(date, records);
                });
                console.log(`⏱️ 时间记录数据加载成功: ${timeRecordsPath}`);
            }
        } catch (error) {
            console.log('⏱️ 时间记录文件不存在或格式错误，使用空数据:', error.message);
            this.timeRecords.clear();
        }
    }

    async saveTimeRecords() {
        try {
            // 确保目录存在
            const year = this.plugin.getCurrentDate().getFullYear();
            await this.plugin.ensureYearFolderExists(year);

            // 将 Map 转换为普通对象
            const data = Object.fromEntries(this.timeRecords);
            const content = JSON.stringify(data, null, 2);

            const timeRecordsPath = this.getTimeRecordsPath();

            // 检查文件是否存在，不存在则创建
            const existingFile = this.app.vault.getAbstractFileByPath(timeRecordsPath);
            if (existingFile) {
                await this.app.vault.modify(existingFile, content);
            } else {
                await this.app.vault.create(timeRecordsPath, content);
            }
            console.log(`💾 时间记录保存成功: ${timeRecordsPath}`);
        } catch (error) {
            console.error('💾 保存时间记录失败:', error);
            new Notice('保存时间记录失败，请检查文件权限');
        }
    }

    // 添加时间记录
    addTimeRecord(dateStr, record) {
        if (!this.timeRecords.has(dateStr)) {
            this.timeRecords.set(dateStr, []);
        }

        const recordWithId = {
            ...record,
            id: Date.now() + Math.random(), // 生成唯一ID
            createdAt: new Date().toISOString()
        };

        this.timeRecords.get(dateStr).push(recordWithId);
        this.saveTimeRecords();

        // 刷新视图
        this.renderMainContent();
        new Notice(`⏱️ 时间记录已添加: ${record.project} (${record.duration}小时)`);
    }

    // 删除时间记录
    deleteTimeRecord(recordId) {
        for (const [dateStr, records] of this.timeRecords.entries()) {
            const index = records.findIndex(r => r.id === recordId);
            if (index !== -1) {
                const deletedRecord = records.splice(index, 1)[0];
                this.saveTimeRecords();
                this.renderMainContent();
                new Notice(`⏱️ 时间记录已删除: ${deletedRecord.project}`);
                break;
            }
        }
    }

    // 计算指定日期范围内的项目时间统计
    calculateProjectTimeStats(startDate, endDate) {
        const projectStats = new Map();
        const totalTime = { value: 0 };

        // 遍历日期范围内的所有时间记录
        for (const [dateStr, records] of this.timeRecords.entries()) {
            const date = new Date(dateStr);
            if (date >= startDate && date <= endDate) {
                records.forEach(record => {
                    const project = record.project || '未分类';
                    const duration = parseFloat(record.duration) || 0;

                    if (!projectStats.has(project)) {
                        projectStats.set(project, {
                            totalTime: 0,
                            records: [],
                            categories: new Map()
                        });
                    }

                    const stat = projectStats.get(project);
                    stat.totalTime += duration;
                    stat.records.push({
                        date: dateStr,
                        duration: duration,
                        category: record.category || '常规',
                        description: record.description || ''
                    });

                    // 分类统计
                    const category = record.category || '常规';
                    if (!stat.categories.has(category)) {
                        stat.categories.set(category, 0);
                    }
                    stat.categories.set(category, stat.categories.get(category) + duration);

                    totalTime.value += duration;
                });
            }
        }

        // 计算百分比
        projectStats.forEach((stat, project) => {
            stat.percentage = totalTime.value > 0 ? ((stat.totalTime / totalTime.value) * 100).toFixed(1) : '0.0';
        });

        return {
            projects: projectStats,
            totalTime: totalTime.value,
            dateRange: `${startDate.toISOString().split('T')[0]} 至 ${endDate.toISOString().split('T')[0]}`
        };
    }

    // 获取本周时间统计
    getWeeklyTimeStats() {
        const today = this.plugin.getCurrentDate();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return this.calculateProjectTimeStats(startOfWeek, endOfWeek);
    }

    // 获取本月时间统计
    getMonthlyTimeStats() {
        const today = this.plugin.getCurrentDate();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

        return this.calculateProjectTimeStats(startOfMonth, endOfMonth);
    }

    // 获取本季度时间统计
    getQuarterlyTimeStats() {
        const today = this.plugin.getCurrentDate();
        const quarter = Math.floor(today.getMonth() / 3);
        const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
        const endOfQuarter = new Date(today.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999);

        return this.calculateProjectTimeStats(startOfQuarter, endOfQuarter);
    }

    // 获取本年时间统计
    getYearlyTimeStats() {
        const today = this.plugin.getCurrentDate();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);

        return this.calculateProjectTimeStats(startOfYear, endOfYear);
    }

    // 生成时间复盘报告
    generateTimeReviewReport(period = 'week') {
        let stats;
        let periodName;

        switch (period) {
            case 'week':
                stats = this.getWeeklyTimeStats();
                periodName = '本周';
                break;
            case 'month':
                stats = this.getMonthlyTimeStats();
                periodName = '本月';
                break;
            case 'quarter':
                stats = this.getQuarterlyTimeStats();
                periodName = '本季度';
                break;
            case 'year':
                stats = this.getYearlyTimeStats();
                periodName = '本年';
                break;
            default:
                stats = this.getWeeklyTimeStats();
                periodName = '本周';
        }

        if (!stats.projects.size) {
            return `# ⏱️ ${periodName}时间复盘报告\n\n**时间范围**: ${stats.dateRange}\n\n暂无时间记录数据。`;
        }

        // 按时间排序项目
        const sortedProjects = Array.from(stats.projects.entries())
            .sort((a, b) => b[1].totalTime - a[1].totalTime);

        let report = `# ⏱️ ${periodName}时间复盘报告\n\n`;
        report += `**时间范围**: ${stats.dateRange}\n`;
        report += `**总计时间**: ${stats.totalTime.toFixed(1)} 小时\n\n`;

        // 项目时间分配
        report += `## 📊 项目时间分配\n\n`;
        sortedProjects.forEach(([project, data], index) => {
            const rank = index + 1;
            const emoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '📋';
            report += `${emoji} **${project}**\n`;
            report += `   - 总时间: ${data.totalTime.toFixed(1)} 小时 (${data.percentage}%)\n`;

            // 分类明细
            if (data.categories.size > 1) {
                report += `   - 分类明细:\n`;
                Array.from(data.categories.entries())
                    .sort((a, b) => b[1] - a[1])
                    .forEach(([category, time]) => {
                        const categoryPercentage = ((time / data.totalTime) * 100).toFixed(1);
                        report += `     - ${category}: ${time.toFixed(1)}h (${categoryPercentage}%)\n`;
                    });
            }
            report += `\n`;
        });

        // 时间分布分析
        report += `## 🎯 时间分布分析\n\n`;
        if (stats.totalTime > 0) {
            const avgTimePerDay = stats.totalTime / 7; // 假设一周
            report += `- **日均工作时间**: ${avgTimePerDay.toFixed(1)} 小时\n`;

            const topProject = sortedProjects[0];
            if (topProject) {
                report += `- **主要投入项目**: ${topProject[0]} (${topProject[1].percentage}%)\n`;
            }

            if (sortedProjects.length > 3) {
                const topThree = sortedProjects.slice(0, 3).reduce((sum, [, data]) => sum + data.totalTime, 0);
                const topThreePercentage = ((topThree / stats.totalTime) * 100).toFixed(1);
                report += `- **前三项目占比**: ${topThreePercentage}%\n`;
            }
        }

        // 改进建议
        report += `\n## 💡 改进建议\n\n`;
        if (stats.totalTime < 20) {
            report += `- ⚠️  ${periodName}总工作时间较少，考虑增加投入或检查记录完整性\n`;
        }
        if (sortedProjects.length > 5) {
            report += `- 📋 项目过多可能导致分散注意力，建议聚焦核心项目\n`;
        }
        if (sortedProjects.length > 0) {
            const topProjectTime = sortedProjects[0][1].totalTime;
            if (topProjectTime > stats.totalTime * 0.8) {
                report += `- ⚖️ 主要项目占比过高，建议适度分配时间到其他重要事项\n`;
            }
        }

        report += `\n---\n*报告生成时间: ${new Date().toLocaleString()}*\n`;
        report += `*数据来源: LifeOS 时间统计系统*`;

        return report;
    }

    // ========== 任务截止日期管理 ==========

    // 更新任务的截止日期信息
    updateTaskDueInfo(task) {
        if (!task.dueDate) {
            task.isOverdue = false;
            task.daysUntilDue = null;
            task.duePriority = 0;
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        task.daysUntilDue = diffDays;
        task.isOverdue = diffDays < 0;

        // 设置截止日期优先级（数字越小优先级越高）
        if (diffDays < 0) {
            task.duePriority = 1; // 逾期任务最高优先级
        } else if (diffDays === 0) {
            task.duePriority = 2; // 今天到期
        } else if (diffDays === 1) {
            task.duePriority = 3; // 明天到期
        } else if (diffDays <= 3) {
            task.duePriority = 4; // 3天内到期
        } else if (diffDays <= 7) {
            task.duePriority = 5; // 一周内到期
        } else {
            task.duePriority = 6; // 超过一周
        }
    }

    // 批量更新所有任务的截止日期信息
    updateAllTasksDueInfo() {
        for (const [dateStr, tasks] of this.tasks.entries()) {
            tasks.forEach(task => {
                if (task.dueDate) {
                    this.updateTaskDueInfo(task);
                }
            });
        }
        this.saveTasks();
    }

    // 获取逾期任务
    getOverdueTasks() {
        const overdueTasks = [];
        for (const [dateStr, tasks] of this.tasks.entries()) {
            tasks.forEach(task => {
                if (task.isOverdue && !task.completed) {
                    overdueTasks.push({ ...task, originalDate: dateStr });
                }
            });
        }
        return overdueTasks.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
    }

    // 获取今日到期任务
    getTodayDueTasks() {
        const todayTasks = [];
        for (const [dateStr, tasks] of this.tasks.entries()) {
            tasks.forEach(task => {
                if (task.daysUntilDue === 0 && !task.completed) {
                    todayTasks.push({ ...task, originalDate: dateStr });
                }
            });
        }
        return todayTasks;
    }

    // 获取即将到期任务（3天内）
    getUpcomingDueTasks() {
        const upcomingTasks = [];
        for (const [dateStr, tasks] of this.tasks.entries()) {
            tasks.forEach(task => {
                if (task.daysUntilDue > 0 && task.daysUntilDue <= 3 && !task.completed) {
                    upcomingTasks.push({ ...task, originalDate: dateStr });
                }
            });
        }
        return upcomingTasks.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
    }

    // 生成截止日期标签
    createDueDateBadge(task) {
        if (!task.dueDate || task.completed) return null;

        this.updateTaskDueInfo(task);

        const badge = document.createElement('span');
        badge.className = 'due-date-badge';

        let text, className;

        if (task.isOverdue) {
            text = `逾期 ${Math.abs(task.daysUntilDue)}天`;
            className = 'overdue';
        } else if (task.daysUntilDue === 0) {
            text = '今天到期';
            className = 'due-today';
        } else if (task.daysUntilDue === 1) {
            text = '明天到期';
            className = 'due-tomorrow';
        } else if (task.daysUntilDue <= 3) {
            text = `${task.daysUntilDue}天后到期`;
            className = 'due-soon';
        } else {
            text = `${task.daysUntilDue}天后到期`;
            className = 'due-normal';
        }

        badge.textContent = text;
        badge.classList.add(className);

        return badge;
    }

    // 任务按截止日期排序
    sortTasksByDueDate(tasks) {
        return tasks.sort((a, b) => {
            // 先处理没有截止日期的任务
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1; // 没有截止日期的排到后面
            if (!b.dueDate) return -1;

            // 更新截止日期信息
            this.updateTaskDueInfo(a);
            this.updateTaskDueInfo(b);

            // 按截止日期优先级排序
            if (a.duePriority !== b.duePriority) {
                return a.duePriority - b.duePriority;
            }

            // 同等优先级按截止日期排序
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
    }

    // 任务过滤功能
    showTaskFilterModal() {
        const modal = new TaskFilterModal(this.app, this);
        modal.open();
    }

    // 根据过滤条件过滤任务
    filterTasks(tasks, filters = {}) {
        return tasks.filter(task => {
            // 截止日期过滤
            if (filters.dueStatus && filters.dueStatus !== 'all') {
                this.updateTaskDueInfo(task); // 确保任务截止信息是最新的
                switch (filters.dueStatus) {
                    case 'overdue':
                        if (!task.isOverdue || task.completed) return false;
                        break;
                    case 'due-today':
                        if (task.daysUntilDue !== 0 || task.completed) return false;
                        break;
                    case 'due-soon':
                        if (task.daysUntilDue < 0 || task.daysUntilDue > 3 || task.completed) return false;
                        break;
                    case 'no-due-date':
                        if (task.dueDate) return false;
                        break;
                }
            }

            // 完成状态过滤
            if (filters.completionStatus && filters.completionStatus !== 'all') {
                switch (filters.completionStatus) {
                    case 'completed':
                        if (!task.completed) return false;
                        break;
                    case 'pending':
                        if (task.completed) return false;
                        break;
                }
            }

            // 优先级过滤
            if (filters.priority && filters.priority !== 'all') {
                if (task.priority !== filters.priority) return false;
            }

            return true;
        });
    }

    // 设置当前过滤器
    setTaskFilters(filters) {
        this.currentFilters = filters;
        this.renderMainContent(); // 重新渲染以应用过滤器
    }

    addTask(dateStr, task) {
        if (!this.tasks.has(dateStr)) {
            this.tasks.set(dateStr, []);
        }

        const taskWithId = {
            ...task,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            createdAt: this.plugin.getCurrentDate().toISOString() // 使用插件的时间
        };

        // 如果有截止日期，计算逾期信息
        if (taskWithId.dueDate) {
            this.updateTaskDueInfo(taskWithId);
        }

        this.tasks.get(dateStr).push(taskWithId);
        this.saveTasks();
        this.renderMainContent(); // 刷新视图
    }

    moveTaskToDate(taskId, newDateStr) {
        // 找到并移除原任务
        let task = null;
        for (const [dateStr, tasks] of this.tasks.entries()) {
            const index = tasks.findIndex(t => t.id === taskId);
            if (index !== -1) {
                task = tasks.splice(index, 1)[0];
                break;
            }
        }

        if (task) {
            // 添加到新日期
            if (!this.tasks.has(newDateStr)) {
                this.tasks.set(newDateStr, []);
            }
            this.tasks.get(newDateStr).push(task);

            this.saveTasks();
            this.renderMainContent(); // 刷新视图
            new Notice(`任务移动到 ${newDateStr}`);
        }
    }

    toggleTaskCompletion(taskId) {
        for (const tasks of this.tasks.values()) {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                task.completed = !task.completed;
                task.completedAt = task.completed ? this.plugin.getCurrentDate().toISOString() : null; // 使用插件的时间
                this.saveTasks();
                this.renderMainContent(); // 刷新视图
                break;
            }
        }
    }

    showAddTaskModal() {
        const modal = new TaskEditModal(this.app, this, null, (task) => {
            const today = this.plugin.getCurrentDate().toISOString().split('T')[0]; // 使用插件的时间
            this.addTask(today, task);
        });
        modal.open();
    }

    renderWeekView(container) {
        // 周导航
        const header = container.createDiv('para-calendar-header');

        const prevBtn = header.createEl('button', {
            text: '‹',
            cls: 'para-nav-btn para-nav-prev'
        });

        const weekStart = this.getWeekStart(this.currentDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const weekDisplay = header.createEl('span', {
            text: `${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`,
            cls: 'para-month-display'
        });

        const nextBtn = header.createEl('button', {
            text: '›',
            cls: 'para-nav-btn para-nav-next'
        });

        prevBtn.onclick = () => {
            this.currentDate.setDate(this.currentDate.getDate() - 7);
            this.renderMainContent();
        };

        nextBtn.onclick = () => {
            this.currentDate.setDate(this.currentDate.getDate() + 7);
            this.renderMainContent();
        };

        // 周视图网格
        this.renderWeekGrid(container);
    }

    renderWeekGrid(container) {
        const weekGrid = container.createDiv('week-grid');

        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const weekStart = this.getWeekStart(this.currentDate);

        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            const isToday = dateStr === this.plugin.getCurrentDate().toISOString().split('T')[0]; // 使用插件的时间

            const dayColumn = weekGrid.createDiv('week-day-column');
            if (isToday) dayColumn.addClass('today-column');

            // 日期头部
            const dayHeader = dayColumn.createDiv('day-header');
            dayHeader.createSpan('weekday-name').textContent = weekdays[i];
            dayHeader.createSpan('day-number').textContent = date.getDate().toString();

            // 任务区域
            const tasksArea = dayColumn.createDiv('day-tasks-area');
            tasksArea.setAttribute('data-date', dateStr);

            this.renderTasksForDate(tasksArea, dateStr);
            this.setupDragAndDrop(tasksArea, dateStr);

            // 添加任务按钮
            const addTaskBtn = dayColumn.createEl('button', {
                text: '+ 添加任务',
                cls: 'add-task-btn'
            });
            addTaskBtn.onclick = () => {
                const modal = new TaskEditModal(this.app, this, null, (task) => {
                    this.addTask(dateStr, task);
                });
                modal.open();
            };
        }
    }

    renderKanbanView(container) {
        // 看板头部导航
        const header = container.createDiv('kanban-header');

        const prevBtn = header.createEl('button', {
            text: '‹',
            cls: 'para-nav-btn para-nav-prev'
        });

        const weekStart = this.getWeekStart(this.currentDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const weekDisplay = header.createEl('span', {
            text: `📋 ${weekStart.getFullYear()}年第${this.getWeekNumber(weekStart)}周看板 (${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日)`,
            cls: 'para-month-display kanban-title'
        });

        const nextBtn = header.createEl('button', {
            text: '›',
            cls: 'para-nav-btn para-nav-next'
        });

        prevBtn.onclick = () => {
            this.currentDate.setDate(this.currentDate.getDate() - 7);
            this.renderMainContent();
        };

        nextBtn.onclick = () => {
            this.currentDate.setDate(this.currentDate.getDate() + 7);
            this.renderMainContent();
        };

        // 渲染看板主体
        this.renderKanbanBoard(container);
    }

    renderKanbanBoard(container) {
        const kanbanContainer = container.createDiv('kanban-container');

        // 看板列定义
        const kanbanColumns = [
            {
                id: 'todo',
                title: '📝 待办事项',
                description: '本周计划完成的任务',
                color: '#f8f9fa',
                status: 'pending'
            },
            {
                id: 'in-progress',
                title: '🚀 进行中',
                description: '正在执行的任务',
                color: '#fff3cd',
                status: 'in_progress'
            },
            {
                id: 'review',
                title: '🔍 待审查',
                description: '已完成待确认的任务',
                color: '#d1ecf1',
                status: 'review'
            },
            {
                id: 'done',
                title: '✅ 已完成',
                description: '本周已完成的任务',
                color: '#d4edda',
                status: 'completed'
            }
        ];

        // 获取本周的所有任务
        const weekTasks = this.getWeekTasks();

        kanbanColumns.forEach(column => {
            const columnEl = kanbanContainer.createDiv('kanban-column');
            columnEl.setAttribute('data-status', column.status);

            // 列头部
            const columnHeader = columnEl.createDiv('kanban-column-header');
            columnHeader.style.backgroundColor = column.color;

            const headerTitle = columnHeader.createDiv('column-title');
            headerTitle.textContent = column.title;

            const headerDesc = columnHeader.createDiv('column-description');
            headerDesc.textContent = column.description;

            const taskCount = weekTasks.filter(task => task.status === column.status).length;
            const countBadge = columnHeader.createDiv('task-count-badge');
            countBadge.textContent = taskCount.toString();

            // 列内容
            const columnContent = columnEl.createDiv('kanban-column-content');

            // 添加拖放支持
            this.setupKanbanDropZone(columnContent, column.status);

            // 渲染该状态的任务
            const columnTasks = weekTasks.filter(task => task.status === column.status);
            columnTasks.forEach(task => {
                const taskCard = this.createKanbanTaskCard(task, column.status);
                columnContent.appendChild(taskCard);
            });

            // 添加任务按钮
            if (column.id === 'todo') {
                const addTaskBtn = columnContent.createEl('button', {
                    text: '+ 添加任务',
                    cls: 'kanban-add-task-btn'
                });
                addTaskBtn.onclick = () => {
                    const modal = new TaskEditModal(this.app, this, null, (task) => {
                        task.status = 'pending';
                        task.weekStart = this.getWeekStart(this.currentDate).toISOString().split('T')[0];
                        this.addWeekTask(task);
                    });
                    modal.open();
                };
            }
        });

        // 添加周总结区域
        this.addWeekSummarySection(container);
    }

    getWeekTasks() {
        const weekStart = this.getWeekStart(this.currentDate);
        const weekKey = this.getWeekKey(weekStart);

        // 从本周的所有日期中收集任务
        const weekTasks = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            const dayTasks = this.tasks.get(dateStr) || [];

            dayTasks.forEach(task => {
                // 为任务添加看板状态（如果没有的话）
                if (!task.status) {
                    task.status = task.completed ? 'completed' : 'pending';
                }
                if (!task.weekStart) {
                    task.weekStart = weekKey;
                }
                weekTasks.push({
                    ...task,
                    originalDate: dateStr
                });
            });
        }

        return weekTasks;
    }

    createKanbanTaskCard(task, status) {
        const taskCard = document.createElement('div');
        taskCard.className = 'kanban-task-card';
        taskCard.setAttribute('data-task-id', task.id);
        taskCard.setAttribute('draggable', 'true');

        // 优先级指示器
        const priorityBar = taskCard.createDiv('kanban-priority-bar');
        priorityBar.addClass(`priority-${task.priority || 'medium'}`);

        // 任务内容
        const taskContent = taskCard.createDiv('kanban-task-content');

        // 任务标题
        const titleEl = taskContent.createDiv('kanban-task-title');
        titleEl.textContent = task.title;

        // 任务描述（如果有）
        if (task.description) {
            const descEl = taskContent.createDiv('kanban-task-description');
            descEl.textContent = task.description;
        }

        // 任务元数据
        const metaEl = taskContent.createDiv('kanban-task-meta');

        // 原始日期
        if (task.originalDate) {
            const dateEl = metaEl.createSpan('task-date-tag');
            dateEl.textContent = `📅 ${task.originalDate}`;
        }

        // 标签
        if (task.tags && task.tags.length > 0) {
            task.tags.forEach(tag => {
                const tagEl = metaEl.createSpan('kanban-task-tag');
                tagEl.textContent = `#${tag}`;
            });
        }

        // 任务操作按钮
        const actionsEl = taskCard.createDiv('kanban-task-actions');

        const editBtn = actionsEl.createEl('button', {
            text: '✏️',
            cls: 'kanban-action-btn'
        });
        editBtn.onclick = (e) => {
            e.stopPropagation();
            this.editTask(task);
        };

        const deleteBtn = actionsEl.createEl('button', {
            text: '🗑️',
            cls: 'kanban-action-btn delete'
        });
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            this.deleteTask(task.id);
        };

        // 拖拽事件
        taskCard.addEventListener('dragstart', (e) => {
            this.isDragging = true;
            this.draggedTask = task;
            e.dataTransfer.setData('text/plain', task.id);
            taskCard.addClass('dragging');
        });

        taskCard.addEventListener('dragend', () => {
            this.isDragging = false;
            this.draggedTask = null;
            taskCard.removeClass('dragging');
        });

        return taskCard;
    }

    setupKanbanDropZone(columnContent, targetStatus) {
        columnContent.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (this.isDragging) {
                columnContent.addClass('kanban-drag-over');
            }
        });

        columnContent.addEventListener('dragleave', (e) => {
            // 只有在真正离开列时才移除高亮
            if (!columnContent.contains(e.relatedTarget)) {
                columnContent.removeClass('kanban-drag-over');
            }
        });

        columnContent.addEventListener('drop', (e) => {
            e.preventDefault();
            columnContent.removeClass('kanban-drag-over');

            if (this.draggedTask) {
                this.moveTaskToKanbanColumn(this.draggedTask.id, targetStatus);
            }
        });
    }

    moveTaskToKanbanColumn(taskId, newStatus) {
        // 在所有日期中查找任务
        let taskFound = false;
        for (const [dateStr, tasks] of this.tasks.entries()) {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                // 更新任务状态
                task.status = newStatus;
                task.completed = (newStatus === 'completed');
                task.updatedAt = this.plugin.getCurrentDate().toISOString();

                // 如果移动到已完成，设置完成时间
                if (newStatus === 'completed') {
                    task.completedAt = task.updatedAt;
                } else {
                    task.completedAt = null;
                }

                taskFound = true;
                break;
            }
        }

        if (taskFound) {
            this.saveTasks();
            this.renderMainContent(); // 刷新看板

            const statusNames = {
                'pending': '待办事项',
                'in_progress': '进行中',
                'review': '待审查',
                'completed': '已完成'
            };

            new Notice(`任务已移动到"${statusNames[newStatus]}"`);
        }
    }

    addWeekTask(task) {
        const weekStart = this.getWeekStart(this.currentDate);
        const todayStr = this.plugin.getCurrentDate().toISOString().split('T')[0];

        // 将任务添加到今天
        this.addTask(todayStr, task);
    }

    getWeekKey(weekStart) {
        return weekStart.toISOString().split('T')[0];
    }

    getWeekNumber(date) {
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - startOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
    }

    addWeekSummarySection(container) {
        const summarySection = container.createDiv('week-summary-section');

        const summaryHeader = summarySection.createDiv('summary-header');
        summaryHeader.innerHTML = '📊 <span>本周总结</span>';

        const summaryContent = summarySection.createDiv('summary-content');

        // 统计数据
        const weekTasks = this.getWeekTasks();
        const stats = {
            total: weekTasks.length,
            completed: weekTasks.filter(t => t.status === 'completed').length,
            inProgress: weekTasks.filter(t => t.status === 'in_progress').length,
            pending: weekTasks.filter(t => t.status === 'pending').length,
            review: weekTasks.filter(t => t.status === 'review').length
        };

        const statsEl = summaryContent.createDiv('week-stats');
        statsEl.innerHTML = `
            <div class="stat-item">
                <div class="stat-number">${stats.completed}</div>
                <div class="stat-label">已完成</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${stats.inProgress}</div>
                <div class="stat-label">进行中</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${stats.pending}</div>
                <div class="stat-label">待办</div>
            </div>
            <div class="stat-separator"></div>
            <div class="stat-item completion-rate">
                <div class="stat-number">${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</div>
                <div class="stat-label">完成率</div>
            </div>
        `;

        // 快捷操作
        const quickActions = summaryContent.createDiv('quick-actions');

        const generateReportBtn = quickActions.createEl('button', {
            text: '📄 生成周报',
            cls: 'action-btn secondary'
        });
        generateReportBtn.onclick = () => this.generateWeeklyReport(weekTasks, stats);

        const archiveWeekBtn = quickActions.createEl('button', {
            text: '📦 归档本周',
            cls: 'action-btn secondary'
        });
        archiveWeekBtn.onclick = () => this.archiveWeekTasks(weekTasks);
    }

    generateWeeklyReport(weekTasks, stats) {
        const weekStart = this.getWeekStart(this.currentDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const weekNum = this.getWeekNumber(weekStart);
        const year = weekStart.getFullYear();

        // 生成周报内容
        let reportContent = `# 📊 ${year}年第${weekNum}周工作报告\n\n`;
        reportContent += `**时间范围：** ${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日\n\n`;

        reportContent += `## 📈 本周数据概览\n\n`;
        reportContent += `- **总任务数：** ${stats.total}\n`;
        reportContent += `- **已完成：** ${stats.completed} (${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%)\n`;
        reportContent += `- **进行中：** ${stats.inProgress}\n`;
        reportContent += `- **待办：** ${stats.pending}\n`;
        reportContent += `- **待审查：** ${stats.review}\n\n`;

        // 按状态分组显示任务
        reportContent += `## ✅ 已完成任务\n\n`;
        const completedTasks = weekTasks.filter(t => t.status === 'completed');
        if (completedTasks.length > 0) {
            completedTasks.forEach(task => {
                reportContent += `- [x] ${task.title}`;
                if (task.originalDate) reportContent += ` (${task.originalDate})`;
                reportContent += `\n`;
            });
        } else {
            reportContent += `暂无已完成任务\n`;
        }

        reportContent += `\n## 🚀 进行中任务\n\n`;
        const inProgressTasks = weekTasks.filter(t => t.status === 'in_progress');
        if (inProgressTasks.length > 0) {
            inProgressTasks.forEach(task => {
                reportContent += `- [ ] ${task.title}`;
                if (task.originalDate) reportContent += ` (${task.originalDate})`;
                reportContent += `\n`;
            });
        } else {
            reportContent += `暂无进行中任务\n`;
        }

        reportContent += `\n## 📝 待办任务\n\n`;
        const pendingTasks = weekTasks.filter(t => t.status === 'pending');
        if (pendingTasks.length > 0) {
            pendingTasks.forEach(task => {
                reportContent += `- [ ] ${task.title}`;
                if (task.originalDate) reportContent += ` (${task.originalDate})`;
                reportContent += `\n`;
            });
        } else {
            reportContent += `暂无待办任务\n`;
        }

        reportContent += `\n## 🎯 下周计划\n\n`;
        reportContent += `- [ ] \n- [ ] \n- [ ] \n\n`;
        reportContent += `## 💡 本周反思\n\n`;
        reportContent += `### 做得好的地方\n- \n\n### 需要改进的地方\n- \n\n`;
        reportContent += `---\n生成时间: ${this.plugin.getCurrentDate().toLocaleString()}\n`;
        reportContent += `#周报 #${year}W${weekNum.toString().padStart(2, '0')}\n`;

        // 创建文件
        this.createWeeklyReportFile(reportContent, year, weekNum);
    }

    async createWeeklyReportFile(content, year, weekNum) {
        try {
            await this.plugin.ensureYearFolderExists(year);

            const fileName = `1-周期笔记/${year}/周记/周报-${year}W${weekNum.toString().padStart(2, '0')}.md`;
            const file = await this.app.vault.create(fileName, content);

            // 打开新创建的周报
            const activeLeaf = this.app.workspace.activeLeaf;
            await activeLeaf.openFile(file);

            new Notice('📄 周报已生成并打开');
        } catch (error) {
            new Notice(`生成周报失败: ${error.message}`);
            console.error('Generate weekly report error:', error);
        }
    }

    archiveWeekTasks(weekTasks) {
        const weekStart = this.getWeekStart(this.currentDate);
        const weekNum = this.getWeekNumber(weekStart);
        const year = weekStart.getFullYear();

        // 确认操作
        const confirmed = confirm(`确定要归档 ${year}年第${weekNum}周 的所有任务吗？\n\n归档后，已完成的任务将被移动到归档文件，其他任务保持不变。`);
        if (!confirmed) return;

        try {
            // 统计信息
            const completedTasks = weekTasks.filter(t => t.status === 'completed');
            const pendingTasks = weekTasks.filter(t => t.status !== 'completed');

            // 创建归档记录
            this.createWeekArchive(weekTasks, year, weekNum);

            // 清理已完成的任务
            completedTasks.forEach(task => {
                this.deleteTask(task.id);
            });

            // 重置未完成任务的状态
            pendingTasks.forEach(task => {
                if (task.status === 'in_progress' || task.status === 'review') {
                    task.status = 'pending';
                }
            });

            this.saveTasks();
            this.renderMainContent();

            new Notice(`📦 ${year}年第${weekNum}周任务已归档 (${completedTasks.length}个已完成任务已清理)`);

        } catch (error) {
            new Notice(`归档失败: ${error.message}`);
            console.error('Archive week tasks error:', error);
        }
    }

    async createWeekArchive(weekTasks, year, weekNum) {
        try {
            await this.plugin.ensureYearFolderExists(year);

            const weekStart = this.getWeekStart(this.currentDate);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);

            let archiveContent = `# 📦 ${year}年第${weekNum}周任务归档\n\n`;
            archiveContent += `**归档时间：** ${this.plugin.getCurrentDate().toLocaleString()}\n`;
            archiveContent += `**周范围：** ${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日\n\n`;

            // 按状态分组
            const tasksByStatus = {
                completed: weekTasks.filter(t => t.status === 'completed'),
                in_progress: weekTasks.filter(t => t.status === 'in_progress'),
                review: weekTasks.filter(t => t.status === 'review'),
                pending: weekTasks.filter(t => t.status === 'pending')
            };

            const statusTitles = {
                completed: '✅ 已完成任务',
                in_progress: '🚀 进行中任务',
                review: '🔍 待审查任务',
                pending: '📝 待办任务'
            };

            Object.entries(tasksByStatus).forEach(([status, tasks]) => {
                if (tasks.length > 0) {
                    archiveContent += `## ${statusTitles[status]}\n\n`;
                    tasks.forEach(task => {
                        const checkbox = task.status === 'completed' ? '[x]' : '[ ]';
                        archiveContent += `- ${checkbox} ${task.title}`;
                        if (task.originalDate) archiveContent += ` (${task.originalDate})`;
                        if (task.priority) archiveContent += ` [${task.priority.toUpperCase()}]`;
                        if (task.tags && task.tags.length > 0) {
                            archiveContent += ` #${task.tags.join(' #')}`;
                        }
                        archiveContent += '\n';
                        if (task.description) {
                            archiveContent += `  - ${task.description}\n`;
                        }
                    });
                    archiveContent += '\n';
                }
            });

            archiveContent += `---\n#归档 #${year}W${weekNum.toString().padStart(2, '0')}\n`;

            const fileName = `5-归档/${year}/周任务归档-${year}W${weekNum.toString().padStart(2, '0')}.md`;

            // 确保归档目录存在
            const archiveYearDir = `5-归档/${year}`;
            if (!this.app.vault.getAbstractFileByPath(archiveYearDir)) {
                await this.app.vault.createFolder(archiveYearDir);
            }

            const file = await this.app.vault.create(fileName, archiveContent);
            console.log(`📦 归档文件已创建: ${fileName}`);

        } catch (error) {
            console.error('Create week archive error:', error);
            throw error;
        }
    }

    renderDayView(container) {
        // 日导航
        const header = container.createDiv('para-calendar-header');

        const prevBtn = header.createEl('button', {
            text: '‹ 前一天',
            cls: 'para-nav-btn para-nav-prev'
        });

        const dayDisplay = header.createEl('span', {
            text: `${this.currentDate.getFullYear()}年${this.currentDate.getMonth() + 1}月${this.currentDate.getDate()}日`,
            cls: 'para-month-display'
        });

        const nextBtn = header.createEl('button', {
            text: '后一天 ›',
            cls: 'para-nav-btn para-nav-next'
        });

        prevBtn.onclick = () => {
            this.currentDate.setDate(this.currentDate.getDate() - 1);
            this.renderMainContent();
        };

        nextBtn.onclick = () => {
            this.currentDate.setDate(this.currentDate.getDate() + 1);
            this.renderMainContent();
        };

        // LifeOS 风格的时间块日视图
        this.renderLifeOSDayContent(container);
    }

    // LifeOS 风格的时间块日视图
    renderLifeOSDayContent(container) {
        const dateStr = this.currentDate.toISOString().split('T')[0];
        const dayContainer = container.createDiv('lifeos-day-container');

        // 左侧：时间记录区域
        const timeRecordsSection = dayContainer.createDiv('time-records-section');
        this.renderTimeRecordsSection(timeRecordsSection, dateStr);

        // 右侧：时间轴区域
        const timelineContainer = dayContainer.createDiv('lifeos-day-timeline');

        // 创建时间轴和内容区域
        const timeAxis = timelineContainer.createDiv('time-axis');
        const contentArea = timelineContainer.createDiv('content-area');

        // 生成24小时时间轴
        for (let hour = 0; hour < 24; hour++) {
            // 时间标签
            const timeLabel = timeAxis.createDiv('time-label');
            timeLabel.textContent = `${hour.toString().padStart(2, '0')}:00`;

            // 时间块容器
            const timeBlock = contentArea.createDiv('time-block');
            timeBlock.setAttribute('data-hour', hour);
            timeBlock.setAttribute('data-date', dateStr);

            // 添加半小时分隔线
            const halfHourLine = timeBlock.createDiv('half-hour-line');

            // 设置拖放功能
            this.setupTimeBlockDragDrop(timeBlock, hour);
        }

        // 渲染现有任务到时间块
        this.renderTasksInTimeBlocks(contentArea, dateStr);

        // 添加快速添加任务功能
        this.addQuickTaskCreation(contentArea, dateStr);

        // 添加样式
        this.addDayViewStyles(container);
    }

    // 渲染时间记录区域
    renderTimeRecordsSection(container, dateStr) {
        // 标题栏
        const header = container.createDiv('time-records-header');
        header.createEl('h3', { text: '⏱️ 时间记录', cls: 'section-title' });

        const addBtn = header.createEl('button', {
            text: '➕',
            cls: 'add-time-record-btn'
        });
        addBtn.onclick = () => {
            const modal = new TimeRecordModal(this.app, this, dateStr);
            modal.open();
        };

        // 记录列表容器
        const recordsList = container.createDiv('time-records-list');

        // 获取当日时间记录
        const dayRecords = this.timeRecords.get(dateStr) || [];

        if (dayRecords.length === 0) {
            const emptyMsg = recordsList.createDiv('empty-message');
            emptyMsg.textContent = '今日暂无时间记录';
        } else {
            // 按时长排序显示
            const sortedRecords = dayRecords.sort((a, b) => parseFloat(b.duration) - parseFloat(a.duration));

            sortedRecords.forEach(record => {
                const recordItem = recordsList.createDiv('time-record-item');

                // 项目名称和时长
                const projectInfo = recordItem.createDiv('project-info');
                projectInfo.createEl('span', {
                    text: record.project,
                    cls: 'project-name'
                });
                projectInfo.createEl('span', {
                    text: `${record.duration}h`,
                    cls: 'duration'
                });

                // 分类标签
                if (record.category) {
                    const categoryTag = recordItem.createDiv('category-tag');
                    categoryTag.textContent = record.category;
                    categoryTag.className = `category-tag category-${record.category}`;
                }

                // 描述
                if (record.description) {
                    const description = recordItem.createDiv('description');
                    description.textContent = record.description;
                }

                // 操作按钮
                const actions = recordItem.createDiv('record-actions');
                const editBtn = actions.createEl('button', {
                    text: '✏️',
                    cls: 'edit-record-btn'
                });
                editBtn.onclick = () => {
                    const modal = new TimeRecordModal(this.app, this, dateStr, record);
                    modal.open();
                };

                const deleteBtn = actions.createEl('button', {
                    text: '🗑️',
                    cls: 'delete-record-btn'
                });
                deleteBtn.onclick = () => {
                    if (confirm('确定要删除这条时间记录吗？')) {
                        this.deleteTimeRecord(record.id);
                    }
                };

                // 点击编辑
                recordItem.addEventListener('dblclick', () => {
                    const modal = new TimeRecordModal(this.app, this, dateStr, record);
                    modal.open();
                });
            });

            // 当日统计
            const totalTime = sortedRecords.reduce((sum, record) => sum + parseFloat(record.duration || 0), 0);
            const statsFooter = container.createDiv('time-records-stats');
            statsFooter.innerHTML = `📊 今日总计: <strong>${totalTime.toFixed(1)} 小时</strong>`;
        }
    }

    // 添加日视图样式
    addDayViewStyles(container) {
        const style = container.createEl('style');
        style.textContent = `
            .lifeos-day-container {
                display: grid;
                grid-template-columns: 300px 1fr;
                gap: 20px;
                height: 100%;
            }

            .time-records-section {
                background: var(--background-secondary);
                border-radius: 8px;
                padding: 16px;
                overflow-y: auto;
                max-height: 70vh;
            }

            .time-records-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
                padding-bottom: 8px;
                border-bottom: 1px solid var(--background-modifier-border);
            }

            .section-title {
                margin: 0;
                color: var(--text-accent);
                font-size: 16px;
                font-weight: 600;
            }

            .add-time-record-btn {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                border: none;
                background: var(--interactive-accent);
                color: var(--text-on-accent);
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
            }

            .add-time-record-btn:hover {
                background: var(--interactive-accent-hover);
                transform: scale(1.1);
            }

            .time-record-item {
                background: var(--background-primary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                padding: 12px;
                margin-bottom: 8px;
                transition: all 0.2s;
                cursor: pointer;
            }

            .time-record-item:hover {
                border-color: var(--interactive-accent);
                box-shadow: 0 2px 8px var(--background-modifier-border-hover);
            }

            .project-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 6px;
            }

            .project-name {
                font-weight: 500;
                color: var(--text-normal);
            }

            .duration {
                color: var(--text-accent);
                font-weight: 600;
                background: var(--background-modifier-success);
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
            }

            .category-tag {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 10px;
                font-weight: 500;
                margin-bottom: 6px;
            }

            .category-开发 { background: #3b82f6; color: white; }
            .category-会议 { background: #ef4444; color: white; }
            .category-学习 { background: #10b981; color: white; }
            .category-设计 { background: #8b5cf6; color: white; }
            .category-调研 { background: #f59e0b; color: white; }
            .category-沟通 { background: #06b6d4; color: white; }
            .category-其他 { background: var(--text-muted); color: white; }

            .description {
                font-size: 12px;
                color: var(--text-muted);
                margin-bottom: 8px;
                line-height: 1.4;
            }

            .record-actions {
                display: flex;
                gap: 4px;
                justify-content: flex-end;
            }

            .edit-record-btn, .delete-record-btn {
                width: 24px;
                height: 24px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 10px;
                background: var(--background-modifier-border);
                opacity: 0.6;
                transition: all 0.2s;
            }

            .edit-record-btn:hover {
                background: var(--interactive-accent);
                opacity: 1;
            }

            .delete-record-btn:hover {
                background: var(--text-error);
                opacity: 1;
            }

            .time-records-stats {
                margin-top: 12px;
                padding: 8px 12px;
                background: var(--background-modifier-success);
                border-radius: 6px;
                text-align: center;
                font-size: 14px;
                color: var(--text-normal);
            }

            .empty-message {
                text-align: center;
                color: var(--text-muted);
                font-style: italic;
                padding: 20px;
            }

            .lifeos-day-timeline {
                flex: 1;
                overflow: hidden;
            }

            /* 响应式设计 */
            @media (max-width: 1024px) {
                .lifeos-day-container {
                    grid-template-columns: 1fr;
                }

                .time-records-section {
                    max-height: 30vh;
                }
            }
        `;
    }

    setupTimeBlockDragDrop(timeBlock, hour) {
        const dateStr = timeBlock.getAttribute('data-date');

        // 拖拽悬停
        timeBlock.addEventListener('dragover', (e) => {
            e.preventDefault();
            timeBlock.addClass('drag-hover');
        });

        // 拖拽离开
        timeBlock.addEventListener('dragleave', () => {
            timeBlock.removeClass('drag-hover');
        });

        // 拖拽释放
        timeBlock.addEventListener('drop', (e) => {
            e.preventDefault();
            timeBlock.removeClass('drag-hover');

            if (this.draggedTask) {
                // 更新任务时间
                this.draggedTask.startTime = `${hour.toString().padStart(2, '0')}:00`;
                this.draggedTask.date = dateStr;

                // 移动任务到新时间
                this.moveTaskToTimeBlock(this.draggedTask.id, dateStr, hour);
                new Notice(`任务已移动到 ${hour.toString().padStart(2, '0')}:00`);
            }
        });

        // 双击创建任务
        timeBlock.addEventListener('dblclick', () => {
            const modal = new TaskEditModal(this.app, this, null, (task) => {
                task.startTime = `${hour.toString().padStart(2, '0')}:00`;
                task.duration = 60; // 默认1小时
                this.addTask(dateStr, task);
            });
            modal.open();
        });
    }

    renderTasksInTimeBlocks(contentArea, dateStr) {
        const dayTasks = this.tasks.get(dateStr) || [];

        dayTasks.forEach(task => {
            if (task.startTime) {
                const hour = parseInt(task.startTime.split(':')[0]);
                const timeBlock = contentArea.querySelector(`[data-hour="${hour}"]`);

                if (timeBlock) {
                    const taskElement = this.createTimeBlockTask(task);
                    timeBlock.appendChild(taskElement);
                }
            }
        });
    }

    createTimeBlockTask(task) {
        const taskElement = document.createElement('div');
        taskElement.className = 'time-block-task';
        taskElement.setAttribute('draggable', 'true');
        taskElement.setAttribute('data-task-id', task.id);

        // 任务内容
        const taskTitle = taskElement.createDiv('task-title');
        taskTitle.textContent = task.title;

        const taskTime = taskElement.createDiv('task-time');
        taskTime.textContent = `${task.startTime || ''} ${task.duration ? `(${task.duration}分钟)` : ''}`;

        // 优先级指示器
        const priorityBar = taskElement.createDiv('priority-bar');
        priorityBar.addClass(`priority-${task.priority || 'medium'}`);

        // 拖拽事件
        taskElement.addEventListener('dragstart', (e) => {
            this.isDragging = true;
            this.draggedTask = task;
            e.dataTransfer.setData('text/plain', task.id);
            taskElement.addClass('dragging');
        });

        taskElement.addEventListener('dragend', () => {
            this.isDragging = false;
            this.draggedTask = null;
            taskElement.removeClass('dragging');
        });

        // 点击编辑
        taskElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.editTask(task);
        });

        return taskElement;
    }

    addQuickTaskCreation(contentArea, dateStr) {
        // 添加浮动的快速创建按钮
        const quickAddBtn = contentArea.createDiv('quick-add-btn');
        quickAddBtn.innerHTML = '➕ 快速添加';
        quickAddBtn.onclick = () => {
            const modal = new TaskEditModal(this.app, this, null, (task) => {
                this.addTask(dateStr, task);
            });
            modal.open();
        };
    }

    moveTaskToTimeBlock(taskId, newDateStr, newHour) {
        // 找到并更新任务
        let task = null;
        for (const [dateStr, tasks] of this.tasks.entries()) {
            const taskIndex = tasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                task = tasks[taskIndex];

                // 如果是移动到不同日期，先移除再添加
                if (dateStr !== newDateStr) {
                    tasks.splice(taskIndex, 1);
                    if (!this.tasks.has(newDateStr)) {
                        this.tasks.set(newDateStr, []);
                    }
                    this.tasks.get(newDateStr).push(task);
                }

                // 更新时间
                task.startTime = `${newHour.toString().padStart(2, '0')}:00`;
                break;
            }
        }

        if (task) {
            this.saveTasks();
            this.renderMainContent();
        }
    }

    renderDayContent(container) {
        const dayContainer = container.createDiv('day-view-container');
        const dateStr = this.currentDate.toISOString().split('T')[0];

        // 日记区域
        const diarySection = dayContainer.createDiv('diary-section');
        const diaryHeader = diarySection.createDiv('section-header');
        diaryHeader.innerHTML = '📝 <span>今日日记</span>';

        const diaryContent = diarySection.createDiv('diary-content');
        const openDiaryBtn = diaryContent.createEl('button', {
            text: '📖 打开今日日记',
            cls: 'action-btn primary'
        });
        openDiaryBtn.onclick = async () => {
            await this.createOrOpenDiary(dateStr, this.currentDate);
        };

        // 任务区域
        const tasksSection = dayContainer.createDiv('tasks-section');
        const tasksHeader = tasksSection.createDiv('section-header');
        tasksHeader.innerHTML = '✅ <span>今日任务</span>';

        const tasksContent = tasksSection.createDiv('tasks-content');
        tasksContent.setAttribute('data-date', dateStr);

        // 时间轴视图
        this.renderTimelineView(tasksContent, dateStr);

        // 添加任务按钮
        const addTaskBtn = tasksSection.createEl('button', {
            text: '➕ 添加新任务',
            cls: 'action-btn primary add-task-big'
        });
        addTaskBtn.onclick = () => {
            const modal = new TaskEditModal(this.app, this, null, (task) => {
                this.addTask(dateStr, task);
            });
            modal.open();
        };
    }

    renderTimelineView(container, dateStr) {
        const dayTasks = this.tasks.get(dateStr) || [];

        // 按优先级和时间排序
        const sortedTasks = dayTasks.sort((a, b) => {
            const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
            const aPriority = priorityOrder[a.priority] || 3;
            const bPriority = priorityOrder[b.priority] || 3;

            if (aPriority !== bPriority) return aPriority - bPriority;
            return new Date(a.createdAt) - new Date(b.createdAt);
        });

        if (sortedTasks.length === 0) {
            const emptyState = container.createDiv('empty-state');
            emptyState.innerHTML = `
                <div class="empty-icon">📝</div>
                <div class="empty-text">今日暂无任务</div>
                <div class="empty-subtext">点击添加按钮创建新任务</div>
            `;
            return;
        }

        sortedTasks.forEach((task, index) => {
            const taskCard = container.createDiv('task-card detailed');
            taskCard.setAttribute('data-task-id', task.id);
            taskCard.setAttribute('draggable', 'true');

            // 优先级指示器
            const priorityIndicator = taskCard.createDiv('priority-indicator');
            priorityIndicator.addClass(`priority-${task.priority || 'low'}`);

            // 任务主体
            const taskBody = taskCard.createDiv('task-body');

            // 状态和标题行
            const headerRow = taskBody.createDiv('task-header-row');

            const statusBtn = headerRow.createEl('button', {
                cls: `task-status-btn ${task.completed ? 'completed' : 'pending'}`
            });
            statusBtn.innerHTML = task.completed ? '✅' : '⭕';
            statusBtn.onclick = (e) => {
                e.stopPropagation();
                this.toggleTaskCompletion(task.id);
            };

            const titleEl = headerRow.createDiv('task-title-detailed');
            titleEl.textContent = task.title;
            if (task.completed) titleEl.addClass('completed');

            // 操作按钮
            const actionsEl = headerRow.createDiv('task-actions');

            const editBtn = actionsEl.createEl('button', {
                text: '✏️',
                cls: 'task-action-btn'
            });
            editBtn.onclick = (e) => {
                e.stopPropagation();
                this.editTask(task);
            };

            const deleteBtn = actionsEl.createEl('button', {
                text: '🗑️',
                cls: 'task-action-btn delete'
            });
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                this.deleteTask(task.id);
            };

            // 任务详情
            if (task.description) {
                const descriptionEl = taskBody.createDiv('task-description');
                descriptionEl.textContent = task.description;
            }

            // 任务元数据
            const metadataEl = taskBody.createDiv('task-metadata');
            if (task.priority) {
                const priorityTag = metadataEl.createSpan('priority-tag');
                priorityTag.textContent = {
                    'high': '🔴 高优先级',
                    'medium': '🟡 中优先级',
                    'low': '🟢 低优先级'
                }[task.priority];
            }

            if (task.tags && task.tags.length > 0) {
                task.tags.forEach(tag => {
                    const tagEl = metadataEl.createSpan('task-tag');
                    tagEl.textContent = `#${tag}`;
                });
            }

            // 拖拽事件
            this.setupTaskDragEvents(taskCard, task);
        });
    }

    setupTaskDragEvents(taskEl, task) {
        taskEl.addEventListener('dragstart', (e) => {
            this.isDragging = true;
            this.draggedTask = task;
            e.dataTransfer.setData('text/plain', task.id);
            taskEl.addClass('dragging');
        });

        taskEl.addEventListener('dragend', () => {
            this.isDragging = false;
            this.draggedTask = null;
            taskEl.removeClass('dragging');
        });
    }

    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay(); // 0 = 周日
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    editTask(task) {
        const modal = new TaskEditModal(this.app, this, task, (updatedTask) => {
            Object.assign(task, updatedTask);
            this.saveTasks();
            this.renderMainContent();
        });
        modal.open();
    }

    deleteTask(taskId) {
        for (const [dateStr, tasks] of this.tasks.entries()) {
            const index = tasks.findIndex(t => t.id === taskId);
            if (index !== -1) {
                tasks.splice(index, 1);
                this.saveTasks();
                this.renderMainContent();
                new Notice('任务已删除');
                break;
            }
        }
    }

    async renderMiniCalendar() {
        const container = this.containerEl.children[1];

        // 头部 - 月份导航
        const header = container.createDiv('para-calendar-header');

        const prevBtn = header.createEl('button', {
            text: '‹',
            cls: 'para-nav-btn para-nav-prev'
        });

        const monthDisplay = header.createEl('span', {
            text: `${this.currentDate.getFullYear()}年${this.currentDate.getMonth() + 1}月`,
            cls: 'para-month-display'
        });

        const nextBtn = header.createEl('button', {
            text: '›',
            cls: 'para-nav-btn para-nav-next'
        });

        // 导航事件
        prevBtn.onclick = () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderMiniCalendar();
        };

        nextBtn.onclick = () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderMiniCalendar();
        };

        // 日历网格
        const calendar = container.createDiv('para-calendar-grid');

        // 星期标题
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        const weekHeader = calendar.createDiv('para-week-header');
        weekdays.forEach(day => {
            weekHeader.createEl('div', { text: day, cls: 'para-weekday' });
        });

        // 获取日历数据
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        // 获取已有日记
        const diaryFiles = this.app.vault.getMarkdownFiles()
            .filter(file => file.path.includes('/日记/'));
        const diaryDates = new Set();
        diaryFiles.forEach(file => {
            const match = file.name.match(/(\d{4}-\d{2}-\d{2})\.md/);
            if (match) diaryDates.add(match[1]);
        });

        // 生成日历天数
        const daysGrid = calendar.createDiv('para-days-grid');
        const today = this.plugin.getCurrentDate().toISOString().split('T')[0];

        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            if (date.getMonth() !== this.currentDate.getMonth()) continue;

            const dateStr = date.toISOString().split('T')[0];
            const isToday = dateStr === today;
            const hasDiary = diaryDates.has(dateStr);

            const dayEl = daysGrid.createEl('div', {
                text: date.getDate().toString(),
                cls: 'para-day'
            });

            if (isToday) dayEl.addClass('para-today');
            if (hasDiary) dayEl.addClass('para-has-diary');

            // 点击事件
            dayEl.onclick = async () => {
                await this.createOrOpenDiary(dateStr, date);
            };
        }

        // 快捷操作按钮区
        const quickActions = container.createDiv('para-quick-actions');

        // 今日日记按钮
        const todayBtn = quickActions.createEl('button', {
            text: '📝 今日日记',
            cls: 'para-action-btn para-primary'
        });
        todayBtn.onclick = () => this.plugin.createDailyDiary();

        // 本周周记按钮
        const weeklyBtn = quickActions.createEl('button', {
            text: '📅 本周周记',
            cls: 'para-action-btn para-secondary'
        });
        weeklyBtn.onclick = () => this.plugin.createWeeklyReview();

        // 本月月记按钮
        const monthlyBtn = quickActions.createEl('button', {
            text: '📊 本月月记',
            cls: 'para-action-btn para-secondary'
        });
        monthlyBtn.onclick = () => this.plugin.createMonthlyReview();

        // 年度总结按钮
        const yearlyBtn = quickActions.createEl('button', {
            text: '🎊 年度总结',
            cls: 'para-action-btn para-secondary'
        });
        yearlyBtn.onclick = () => this.plugin.createYearlyReview();
    }

    async createOrOpenDiary(dateStr, date) {
        const year = date.getFullYear();
        const fileName = `1-周期笔记/${year}/日记/${dateStr}.md`;

        // 确保年度文件夹存在
        await this.plugin.ensureYearFolderExists(year);

        const existingFile = this.app.vault.getAbstractFileByPath(fileName);

        if (existingFile) {
            // 在当前活动的标签页中打开已存在的日记
            const activeLeaf = this.app.workspace.activeLeaf;
            await activeLeaf.openFile(existingFile);
        } else {
            const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
            const weekday = '星期' + weekdays[date.getDay()];
            const dateTag = dateStr.replace(/-/g, '');

            const content = this.plugin.diaryTemplate
                .replace(/{{date}}/g, dateStr)
                .replace(/{{weekday}}/g, weekday)
                .replace(/{{dateTag}}/g, dateTag);

            try {
                const file = await this.app.vault.create(fileName, content);
                // 在当前活动的标签页中打开新创建的日记
                const activeLeaf = this.app.workspace.activeLeaf;
                await activeLeaf.openFile(file);
                new Notice(`创建了 ${dateStr} 的日记`);
                this.renderMainContent(); // 刷新日历
            } catch (error) {
                new Notice(`创建失败: ${error.message}`);
            }
        }
    }

    addEnhancedStyles() {
        const style = this.containerEl.createEl('style');
        style.textContent = `
            .para-calendar-container {
                padding: 8px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                height: 100%;
                display: flex;
                flex-direction: column;
                font-size: 12px;
            }

            /* 侧边栏适配样式 */
            .para-calendar-container {
                width: 100%;
                max-width: none;
                min-width: 280px;
            }

            /* 工具栏样式 - 侧边栏优化 */
            .para-calendar-toolbar {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 12px;
                padding: 6px 8px;
                background: var(--background-secondary);
                border-radius: 6px;
                border: 1px solid var(--background-modifier-border);
            }

            .view-mode-group {
                display: flex;
                gap: 4px;
                justify-content: space-between;
            }

            .view-mode-btn {
                background: var(--background-primary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                padding: 4px 6px;
                font-size: 10px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                color: var(--text-muted);
                flex: 1;
                text-align: center;
            }

            .view-mode-btn:hover {
                background: var(--background-modifier-hover);
                color: var(--text-normal);
            }

            .view-mode-btn.active {
                background: var(--interactive-accent);
                color: var(--text-on-accent);
                border-color: var(--interactive-accent);
            }

            .action-group {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .action-btn {
                padding: 4px 8px;
                border: none;
                border-radius: 4px;
                font-size: 10px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: center;
            }

            .action-btn.primary {
                background: var(--interactive-accent);
                color: var(--text-on-accent);
            }

            .action-btn.secondary {
                background: var(--background-primary);
                color: var(--text-normal);
                border: 1px solid var(--background-modifier-border);
            }

            .action-btn:hover {
                opacity: 0.9;
                transform: translateY(-1px);
            }

            /* 主要内容区域 */
            .main-content {
                flex: 1;
                overflow-y: auto;
                overflow-x: hidden;
            }

            /* 头部导航 - 紧凑版 */
            .para-calendar-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                padding: 4px 0;
            }

            .para-nav-btn {
                background: transparent;
                border: 1px solid var(--background-modifier-border);
                font-size: 14px;
                color: var(--text-muted);
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 4px;
                transition: all 0.2s ease;
                min-width: 30px;
            }

            .para-nav-btn:hover {
                background: var(--background-modifier-hover);
                color: var(--text-normal);
                border-color: var(--interactive-accent);
            }

            .para-month-display {
                font-weight: 600;
                color: var(--text-normal);
                font-size: 13px;
            }

            /* 月视图样式 - 侧边栏优化 */
            .para-calendar-grid.month-grid {
                border-radius: 6px;
                overflow: hidden;
                border: 1px solid var(--background-modifier-border);
                margin-bottom: 8px;
            }

            .para-week-header {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                background: var(--background-secondary);
            }

            .para-weekday {
                text-align: center;
                font-size: 9px;
                font-weight: 600;
                color: var(--text-muted);
                padding: 4px 0;
                border-right: 1px solid var(--background-modifier-border);
            }

            .para-weekday:last-child {
                border-right: none;
            }

            .para-days-grid {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 1px;
                background: var(--background-modifier-border);
            }

            .para-day.day-cell {
                background: var(--background-primary);
                padding: 4px 2px;
                cursor: pointer;
                color: var(--text-normal);
                transition: all 0.15s ease;
                min-height: 32px;
                display: flex;
                flex-direction: column;
                position: relative;
                border: 1px solid transparent;
                font-size: 10px;
            }

            .para-day.day-cell:hover {
                background: var(--background-modifier-hover);
                border-color: var(--interactive-accent);
            }

            .para-day.day-cell.para-today {
                background: var(--color-accent-1);
                color: var(--text-normal);
                font-weight: 600;
                border-color: var(--interactive-accent);
            }

            .para-day.day-cell.para-has-diary .date-number {
                color: var(--color-green);
                font-weight: 600;
            }

            .para-day.day-cell.drag-over {
                border-color: var(--color-orange);
                background: var(--background-modifier-hover);
            }

            .date-number {
                font-size: 10px;
                font-weight: 500;
                margin-bottom: 2px;
                text-align: center;
            }

            .diary-indicator {
                position: absolute;
                top: 2px;
                right: 2px;
                font-size: 8px;
                opacity: 0.7;
            }

            /* 任务相关样式 - 侧边栏优化 */
            .tasks-list {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 1px;
                overflow-y: hidden;
                max-height: 24px;
            }

            .task-item {
                background: var(--background-secondary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 2px;
                padding: 1px 2px;
                font-size: 8px;
                display: flex;
                align-items: center;
                gap: 2px;
                cursor: grab;
                transition: all 0.2s ease;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                line-height: 1.1;
            }

            .task-item:hover {
                background: var(--background-modifier-hover);
                border-color: var(--interactive-accent);
            }

            .task-item.dragging {
                opacity: 0.5;
                cursor: grabbing;
                transform: scale(0.95);
            }

            .task-item.priority-high {
                border-left: 2px solid var(--color-red);
            }

            .task-item.priority-medium {
                border-left: 2px solid var(--color-orange);
            }

            .task-item.priority-low {
                border-left: 2px solid var(--color-green);
            }

            .task-status {
                cursor: pointer;
                font-size: 8px;
            }

            .task-title {
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            /* 截止日期相关样式 */
            .task-content {
                display: flex;
                align-items: center;
                gap: 8px;
                flex: 1;
            }

            .overdue-task {
                border: 2px solid #dc2626 !important;
                background: #fef2f2;
                animation: pulse 2s infinite;
            }

            .due-date-badge {
                font-size: 10px;
                font-weight: 500;
                padding: 2px 6px;
                border-radius: 10px;
                white-space: nowrap;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .due-date-badge.overdue {
                background: #dc2626;
                color: white;
                animation: pulse 1.5s infinite;
            }

            .due-date-badge.due-today {
                background: #f59e0b;
                color: white;
                animation: pulse 2s infinite;
            }

            .due-date-badge.due-tomorrow {
                background: #f59e0b;
                color: white;
            }

            .due-date-badge.due-soon {
                background: #3b82f6;
                color: white;
            }

            .due-date-badge.due-normal {
                background: var(--background-modifier-border);
                color: var(--text-muted);
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }

            /* 看板视图样式 */
            .kanban-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
                padding: 8px 0;
            }

            .kanban-title {
                font-weight: 600;
                color: var(--text-normal);
                font-size: 14px;
                text-align: center;
                flex: 1;
            }

            .kanban-container {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 12px;
                margin-bottom: 16px;
                height: 400px;
            }

            .kanban-column {
                background: var(--background-primary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            .kanban-column-header {
                padding: 12px;
                border-bottom: 1px solid var(--background-modifier-border);
                position: relative;
            }

            .column-title {
                font-weight: 600;
                color: var(--text-normal);
                font-size: 12px;
                margin-bottom: 4px;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .column-description {
                font-size: 10px;
                color: var(--text-muted);
                line-height: 1.3;
            }

            .task-count-badge {
                position: absolute;
                top: 8px;
                right: 8px;
                background: var(--interactive-accent);
                color: var(--text-on-accent);
                border-radius: 12px;
                padding: 2px 6px;
                font-size: 9px;
                font-weight: 600;
                min-width: 16px;
                text-align: center;
            }

            .kanban-column-content {
                flex: 1;
                padding: 8px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 8px;
                min-height: 0;
            }

            .kanban-column-content.kanban-drag-over {
                background: var(--color-accent-1);
                border: 2px dashed var(--interactive-accent);
                border-radius: 6px;
            }

            .kanban-task-card {
                background: var(--background-secondary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                padding: 8px;
                cursor: grab;
                transition: all 0.2s ease;
                position: relative;
                overflow: hidden;
            }

            .kanban-task-card:hover {
                border-color: var(--interactive-accent);
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                transform: translateY(-1px);
            }

            .kanban-task-card.dragging {
                opacity: 0.5;
                cursor: grabbing;
                transform: rotate(3deg) scale(0.95);
            }

            .kanban-priority-bar {
                position: absolute;
                top: 0;
                left: 0;
                width: 4px;
                height: 100%;
                border-radius: 6px 0 0 6px;
            }

            .kanban-priority-bar.priority-high {
                background: var(--color-red);
            }

            .kanban-priority-bar.priority-medium {
                background: var(--color-orange);
            }

            .kanban-priority-bar.priority-low {
                background: var(--color-green);
            }

            .kanban-task-content {
                margin-left: 8px;
            }

            .kanban-task-title {
                font-weight: 600;
                color: var(--text-normal);
                font-size: 11px;
                line-height: 1.3;
                margin-bottom: 4px;
                word-wrap: break-word;
            }

            .kanban-task-description {
                font-size: 10px;
                color: var(--text-muted);
                line-height: 1.3;
                margin-bottom: 6px;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .kanban-task-meta {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                margin-bottom: 6px;
            }

            .task-date-tag {
                background: var(--color-accent-1);
                color: var(--text-normal);
                padding: 1px 4px;
                border-radius: 3px;
                font-size: 8px;
                font-weight: 500;
            }

            .kanban-task-tag {
                background: var(--background-modifier-border);
                color: var(--text-muted);
                padding: 1px 4px;
                border-radius: 3px;
                font-size: 8px;
                font-weight: 500;
            }

            .kanban-task-actions {
                display: flex;
                justify-content: flex-end;
                gap: 4px;
                opacity: 0;
                transition: opacity 0.2s ease;
            }

            .kanban-task-card:hover .kanban-task-actions {
                opacity: 1;
            }

            .kanban-action-btn {
                background: none;
                border: none;
                padding: 2px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 10px;
                transition: all 0.2s ease;
                color: var(--text-muted);
            }

            .kanban-action-btn:hover {
                background: var(--background-modifier-hover);
                color: var(--text-normal);
            }

            .kanban-action-btn.delete:hover {
                color: var(--color-red);
            }

            .kanban-add-task-btn {
                background: var(--background-modifier-border);
                border: 2px dashed var(--background-modifier-border);
                border-radius: 6px;
                padding: 8px;
                color: var(--text-muted);
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 10px;
                text-align: center;
                margin-top: auto;
            }

            .kanban-add-task-btn:hover {
                background: var(--background-modifier-hover);
                color: var(--text-normal);
                border-color: var(--interactive-accent);
                border-style: solid;
            }

            /* 周总结区域样式 */
            .week-summary-section {
                background: var(--background-secondary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 8px;
                padding: 12px;
                margin-top: 16px;
            }

            .summary-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 12px;
                font-size: 13px;
                font-weight: 600;
                color: var(--text-normal);
            }

            .summary-content {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .week-stats {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 12px;
                background: var(--background-primary);
                border-radius: 6px;
                border: 1px solid var(--background-modifier-border);
            }

            .stat-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 2px;
                min-width: 40px;
            }

            .stat-number {
                font-size: 16px;
                font-weight: 700;
                color: var(--text-normal);
            }

            .stat-label {
                font-size: 9px;
                color: var(--text-muted);
                text-align: center;
                line-height: 1.2;
            }

            .stat-separator {
                width: 1px;
                height: 30px;
                background: var(--background-modifier-border);
            }

            .completion-rate .stat-number {
                color: var(--color-green);
                font-size: 18px;
            }

            .quick-actions {
                display: flex;
                gap: 8px;
            }

            .quick-actions .action-btn {
                flex: 1;
                padding: 6px 12px;
                font-size: 10px;
            }

            /* 看板响应式设计 */
            @media (max-width: 600px) {
                .kanban-container {
                    grid-template-columns: repeat(2, 1fr);
                    height: auto;
                }

                .week-stats {
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .stat-item {
                    min-width: 30px;
                }

                .quick-actions {
                    flex-direction: column;
                }
            }

            @media (max-width: 400px) {
                .kanban-container {
                    grid-template-columns: 1fr;
                    gap: 8px;
                }

                .kanban-column {
                    max-height: 300px;
                }
            }

            /* 周视图样式 - 侧边栏优化 */
            .week-grid {
                display: flex;
                flex-direction: column;
                gap: 4px;
                height: 100%;
            }

            .week-day-column {
                background: var(--background-primary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                padding: 4px;
                min-height: 60px;
            }

            .week-day-column.today-column {
                border-color: var(--interactive-accent);
                background: var(--color-accent-1);
            }

            .day-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 4px;
                padding-bottom: 2px;
                border-bottom: 1px solid var(--background-modifier-border);
            }

            .weekday-name {
                font-size: 9px;
                font-weight: 600;
                color: var(--text-muted);
            }

            .day-number {
                font-size: 11px;
                font-weight: 600;
                color: var(--text-normal);
            }

            .day-tasks-area {
                display: flex;
                flex-direction: column;
                gap: 2px;
                min-height: 30px;
                border: 1px dashed transparent;
                border-radius: 2px;
                padding: 2px;
            }

            .day-tasks-area[data-date]:hover {
                border-color: var(--background-modifier-border);
            }

            .day-tasks-area.drag-over {
                border-color: var(--color-orange);
                background: var(--background-modifier-hover);
            }

            .add-task-btn {
                background: var(--background-secondary);
                border: 1px dashed var(--background-modifier-border);
                border-radius: 3px;
                padding: 2px 4px;
                font-size: 8px;
                color: var(--text-muted);
                cursor: pointer;
                transition: all 0.2s ease;
                margin-top: 2px;
            }

            .add-task-btn:hover {
                background: var(--background-modifier-hover);
                color: var(--text-normal);
                border-style: solid;
                border-color: var(--interactive-accent);
            }

            /* 日视图样式 - 侧边栏优化 */
            .day-view-container {
                padding: 8px;
            }

            .diary-section, .tasks-section {
                background: var(--background-primary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                margin-bottom: 8px;
                overflow: hidden;
            }

            .section-header {
                background: var(--background-secondary);
                padding: 6px 8px;
                font-size: 11px;
                font-weight: 600;
                color: var(--text-normal);
                border-bottom: 1px solid var(--background-modifier-border);
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .diary-content, .tasks-content {
                padding: 8px;
            }

            .add-task-big {
                width: 100%;
                padding: 6px;
                margin-top: 8px;
                font-size: 10px;
            }

            /* 任务卡片（日视图详细版） - 侧边栏优化 */
            .task-card.detailed {
                background: var(--background-primary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                margin-bottom: 6px;
                overflow: hidden;
                transition: all 0.2s ease;
                cursor: grab;
            }

            .task-card.detailed:hover {
                border-color: var(--interactive-accent);
                box-shadow: 0 1px 4px rgba(0,0,0,0.1);
            }

            .task-card.detailed.dragging {
                opacity: 0.6;
                cursor: grabbing;
                transform: rotate(1deg);
            }

            .priority-indicator {
                height: 2px;
                width: 100%;
            }

            .priority-indicator.priority-high {
                background: var(--color-red);
            }

            .priority-indicator.priority-medium {
                background: var(--color-orange);
            }

            .priority-indicator.priority-low {
                background: var(--color-green);
            }

            .task-body {
                padding: 6px;
            }

            .task-header-row {
                display: flex;
                align-items: center;
                gap: 4px;
                margin-bottom: 4px;
            }

            .task-status-btn {
                background: none;
                border: none;
                font-size: 12px;
                cursor: pointer;
                padding: 1px;
                border-radius: 2px;
                transition: all 0.2s ease;
            }

            .task-status-btn:hover {
                background: var(--background-modifier-hover);
            }

            .task-title-detailed {
                flex: 1;
                font-size: 11px;
                font-weight: 500;
                color: var(--text-normal);
                line-height: 1.2;
            }

            .task-title-detailed.completed {
                text-decoration: line-through;
                color: var(--text-muted);
            }

            .task-actions {
                display: flex;
                gap: 2px;
            }

            .task-action-btn {
                background: none;
                border: none;
                padding: 2px;
                border-radius: 2px;
                cursor: pointer;
                font-size: 10px;
                transition: all 0.2s ease;
                color: var(--text-muted);
            }

            .task-action-btn:hover {
                background: var(--background-modifier-hover);
                color: var(--text-normal);
            }

            .task-action-btn.delete:hover {
                color: var(--color-red);
            }

            .task-description {
                font-size: 9px;
                color: var(--text-muted);
                margin-bottom: 4px;
                line-height: 1.3;
            }

            .task-metadata {
                display: flex;
                flex-wrap: wrap;
                gap: 2px;
                align-items: center;
            }

            .priority-tag, .task-tag {
                font-size: 8px;
                padding: 1px 3px;
                border-radius: 2px;
                font-weight: 500;
            }

            .priority-tag {
                background: var(--background-secondary);
                color: var(--text-normal);
            }

            .task-tag {
                background: var(--color-accent-1);
                color: var(--text-normal);
            }

            /* 空状态 */
            .empty-state {
                text-align: center;
                padding: 20px 10px;
                color: var(--text-muted);
            }

            .empty-icon {
                font-size: 24px;
                margin-bottom: 4px;
            }

            .empty-text {
                font-size: 11px;
                font-weight: 500;
                margin-bottom: 2px;
            }

            .empty-subtext {
                font-size: 9px;
                opacity: 0.8;
            }

            /* LifeOS 风格时间块样式 - 侧边栏优化 */
            .lifeos-day-timeline {
                display: flex;
                height: 400px;
                background: var(--background-primary);
                border-radius: 4px;
                border: 1px solid var(--background-modifier-border);
                overflow: hidden;
            }

            .time-axis {
                width: 50px;
                background: var(--background-secondary);
                border-right: 1px solid var(--background-modifier-border);
                overflow-y: hidden;
            }

            .content-area {
                flex: 1;
                overflow-y: auto;
                position: relative;
            }

            .time-label {
                height: 30px;
                padding: 2px 4px;
                border-bottom: 1px solid var(--background-modifier-border);
                font-size: 8px;
                font-weight: 500;
                color: var(--text-muted);
                display: flex;
                align-items: flex-start;
                justify-content: center;
                line-height: 1.1;
            }

            .time-block {
                height: 30px;
                border-bottom: 1px solid var(--background-modifier-border);
                position: relative;
                cursor: pointer;
                transition: background-color 0.2s ease;
                background: var(--background-primary);
            }

            .time-block:hover {
                background: var(--background-modifier-hover);
            }

            .time-block.drag-hover {
                background: var(--color-accent-1);
                border-left: 2px solid var(--interactive-accent);
            }

            .half-hour-line {
                position: absolute;
                top: 15px;
                left: 0;
                right: 0;
                height: 1px;
                background: var(--background-modifier-border);
                opacity: 0.3;
            }

            .time-block-task {
                position: absolute;
                left: 2px;
                right: 2px;
                background: var(--interactive-accent);
                color: var(--text-on-accent);
                border-radius: 2px;
                padding: 1px 3px;
                font-size: 8px;
                cursor: grab;
                z-index: 10;
                box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                transition: all 0.2s ease;
                top: 1px;
                height: 28px;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                justify-content: center;
                line-height: 1.1;
            }

            .time-block-task:hover {
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                transform: translateY(-1px);
            }

            .time-block-task.dragging {
                opacity: 0.6;
                cursor: grabbing;
                transform: rotate(1deg);
                z-index: 100;
            }

            .time-block-task .task-title {
                font-weight: 600;
                line-height: 1.1;
                margin-bottom: 1px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .time-block-task .task-time {
                font-size: 7px;
                opacity: 0.9;
                line-height: 1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .priority-bar {
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 2px;
                border-radius: 1px 0 0 1px;
            }

            .priority-bar.priority-high {
                background: var(--color-red);
            }

            .priority-bar.priority-medium {
                background: var(--color-orange);
            }

            .priority-bar.priority-low {
                background: var(--color-green);
            }

            .quick-add-btn {
                position: fixed;
                bottom: 10px;
                right: 10px;
                background: var(--interactive-accent);
                color: var(--text-on-accent);
                border: none;
                border-radius: 15px;
                padding: 6px 10px;
                font-size: 9px;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 2px 6px rgba(0,0,0,0.15);
                transition: all 0.2s ease;
                z-index: 1000;
            }

            .quick-add-btn:hover {
                box-shadow: 0 3px 8px rgba(0,0,0,0.2);
                transform: translateY(-1px);
            }

            /* 响应式设计 - 侧边栏特定 */
            @media (max-width: 400px) {
                .para-calendar-container {
                    min-width: 250px;
                }

                .view-mode-btn {
                    font-size: 9px;
                    padding: 3px 4px;
                }

                .para-days-grid .para-day.day-cell {
                    min-height: 28px;
                    font-size: 9px;
                }
            }
        `;
    }

    async onClose() {
        // 清理
    }
}

// 日历模态框
class CalendarModal extends Modal {
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
        this.currentDate = new Date();
        this.currentMonth = this.currentDate.getMonth();
        this.currentYear = this.currentDate.getFullYear();
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: '📅 日记日历' });

        this.calendarContainer = contentEl.createDiv('calendar-container');
        this.renderCalendar();

        const buttonContainer = contentEl.createDiv('calendar-buttons');
        new Setting(buttonContainer)
            .addButton(btn => btn
                .setButtonText('今日日记')
                .setCta()
                .onClick(() => {
                    this.close();
                    this.plugin.createDailyDiary();
                })
            )
            .addButton(btn => btn
                .setButtonText('关闭')
                .onClick(() => this.close())
            );
    }

    async renderCalendar() {
        this.calendarContainer.empty();

        const header = this.calendarContainer.createDiv('calendar-header');

        const prevBtn = header.createEl('button', { text: '‹' });
        prevBtn.onclick = () => {
            this.currentMonth--;
            if (this.currentMonth < 0) {
                this.currentMonth = 11;
                this.currentYear--;
            }
            this.renderCalendar();
        };

        const monthYear = header.createEl('h3', {
            text: `${this.currentYear}年${this.currentMonth + 1}月`
        });

        const nextBtn = header.createEl('button', { text: '›' });
        nextBtn.onclick = () => {
            this.currentMonth++;
            if (this.currentMonth > 11) {
                this.currentMonth = 0;
                this.currentYear++;
            }
            this.renderCalendar();
        };

        const grid = this.calendarContainer.createDiv('calendar-grid');

        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        weekdays.forEach(day => {
            const dayHeader = grid.createDiv('calendar-weekday');
            dayHeader.textContent = day;
        });

        const firstDayOfMonth = new Date(this.currentYear, this.currentMonth, 1);
        const lastDayOfMonth = new Date(this.currentYear, this.currentMonth + 1, 0);
        const startDate = new Date(firstDayOfMonth);
        startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

        const diaryFiles = this.app.vault.getMarkdownFiles()
            .filter(file => file.path.includes('/日记/'));

        const diaryDates = new Set();
        diaryFiles.forEach(file => {
            const dateMatch = file.name.match(/(\d{4})-(\d{2})-(\d{2})\.md/);
            if (dateMatch) {
                diaryDates.add(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`);
            }
        });

        for (let week = 0; week < 6; week++) {
            for (let day = 0; day < 7; day++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + (week * 7) + day);

                if (currentDate > lastDayOfMonth && week > 3) continue;

                const dayElement = grid.createDiv('calendar-day');

                const dateStr = currentDate.toISOString().split('T')[0];
                const isCurrentMonth = currentDate.getMonth() === this.currentMonth;
                const isToday = dateStr === new Date().toISOString().split('T')[0];
                const hasDiary = diaryDates.has(dateStr);

                dayElement.textContent = currentDate.getDate().toString();

                if (!isCurrentMonth) {
                    dayElement.addClass('other-month');
                } else {
                    if (isToday) {
                        dayElement.addClass('today');
                    }
                    if (hasDiary) {
                        dayElement.addClass('has-diary');
                    }

                    dayElement.onclick = async () => {
                        const year = currentDate.getFullYear();
                        const fileName = `1-周期笔记/${year}/日记/${dateStr}.md`;

                        // 确保年度文件夹存在
                        await this.plugin.ensureYearFolderExists(year);

                        const existingFile = this.app.vault.getAbstractFileByPath(fileName);

                        if (existingFile) {
                            await this.app.workspace.getLeaf().openFile(existingFile);
                            this.close();
                        } else {
                            const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
                            const weekday = '星期' + weekdays[currentDate.getDay()];
                            const dateTag = dateStr.replace(/-/g, '');

                            const content = this.plugin.diaryTemplate
                                .replace(/{{date}}/g, dateStr)
                                .replace(/{{weekday}}/g, weekday)
                                .replace(/{{dateTag}}/g, dateTag);

                            try {
                                const file = await this.app.vault.create(fileName, content);
                                await this.app.workspace.getLeaf().openFile(file);
                                this.close();
                                new Notice(`已创建 ${dateStr} 的日记 📅`);
                            } catch (error) {
                                new Notice(`创建日记失败: ${error.message}`);
                            }
                        }
                    };
                }
            }
        }

        const style = this.calendarContainer.createEl('style');
        style.textContent = `
            .calendar-container {
                padding: 20px;
            }
            .calendar-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            .calendar-header button {
                background: var(--interactive-accent);
                color: var(--text-on-accent);
                border: none;
                padding: 5px 10px;
                border-radius: 4px;
                cursor: pointer;
            }
            .calendar-grid {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 2px;
                max-width: 400px;
                margin: 0 auto;
            }
            .calendar-weekday {
                text-align: center;
                font-weight: bold;
                padding: 10px;
                background: var(--background-secondary);
            }
            .calendar-day {
                text-align: center;
                padding: 10px;
                cursor: pointer;
                border: 1px solid var(--background-modifier-border);
                min-height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .calendar-day:hover {
                background: var(--background-modifier-hover);
            }
            .calendar-day.today {
                background: var(--interactive-accent);
                color: var(--text-on-accent);
                font-weight: bold;
            }
            .calendar-day.has-diary {
                background: var(--color-green);
                color: white;
            }
            .calendar-day.other-month {
                color: var(--text-faint);
                cursor: default;
            }
            .calendar-day.other-month:hover {
                background: transparent;
            }
            .calendar-buttons {
                margin-top: 20px;
                text-align: center;
            }
        `;
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

// 日记搜索模态框
class DiarySearchModal extends Modal {
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: '🔍 搜索日记' });

        const searchContainer = contentEl.createDiv();

        new Setting(searchContainer)
            .setName('搜索关键词')
            .setDesc('输入要搜索的内容')
            .addText(text => {
                text.setPlaceholder('关键词、日期或标签...');
                text.inputEl.focus();
                text.onChange(async (value) => {
                    await this.performSearch(value);
                });
            });

        this.resultsContainer = contentEl.createDiv('search-results');
    }

    async performSearch(query) {
        this.resultsContainer.empty();

        if (!query || query.length < 2) {
            this.resultsContainer.createEl('p', { text: '请输入至少2个字符进行搜索' });
            return;
        }

        const diaryFiles = this.app.vault.getMarkdownFiles()
            .filter(file => file.path.startsWith('周期笔记/') && file.path.includes('/日记/'));

        const results = [];

        for (const file of diaryFiles) {
            try {
                const content = await this.app.vault.read(file);
                const lines = content.split('\n');

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (line.toLowerCase().includes(query.toLowerCase())) {
                        results.push({
                            file: file,
                            lineNumber: i + 1,
                            content: line.trim(),
                            context: this.getContext(lines, i)
                        });
                    }
                }
            } catch (error) {
                console.error('Error searching file:', file.path, error);
            }
        }

        this.displayResults(results, query);
    }

    getContext(lines, index) {
        const start = Math.max(0, index - 1);
        const end = Math.min(lines.length, index + 2);
        return lines.slice(start, end).join('\n');
    }

    displayResults(results, query) {
        if (results.length === 0) {
            this.resultsContainer.createEl('p', { text: '没有找到相关内容' });
            return;
        }

        this.resultsContainer.createEl('h3', { text: `找到 ${results.length} 条结果` });

        results.slice(0, 20).forEach(result => {
            const resultItem = this.resultsContainer.createDiv('search-result-item');

            const header = resultItem.createDiv('result-header');
            const link = header.createEl('a', {
                text: `📅 ${result.file.basename}`,
                href: '#'
            });

            link.onclick = async (e) => {
                e.preventDefault();
                await this.app.workspace.getLeaf().openFile(result.file);
                this.close();
            };

            const content = resultItem.createDiv('result-content');
            content.createEl('p', { text: result.content });
        });

        if (results.length > 20) {
            this.resultsContainer.createEl('p', {
                text: `... 还有 ${results.length - 20} 条结果`,
                cls: 'more-results'
            });
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

// 日记统计模态框
class DiaryStatsModal extends Modal {
    constructor(app, stats) {
        super(app);
        this.stats = stats;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: '📊 日记统计' });

        const statsContainer = contentEl.createDiv('diary-stats');

        // 数量统计
        const countStats = statsContainer.createDiv('stat-group');
        countStats.createEl('h3', { text: '📝 写作统计' });

        countStats.createEl('p', { text: `总日记数量: ${this.stats.total} 篇` });
        countStats.createEl('p', { text: `今年已写: ${this.stats.thisYear} 篇` });
        countStats.createEl('p', { text: `本月已写: ${this.stats.thisMonth} 篇` });

        // 字数统计
        const wordStats = statsContainer.createDiv('stat-group');
        wordStats.createEl('h3', { text: '✍️ 文字统计' });
        wordStats.createEl('p', { text: `总字符数: ${this.stats.totalWords.toLocaleString()}` });
        wordStats.createEl('p', { text: `平均每篇: ${Math.round(this.stats.totalWords / Math.max(this.stats.total, 1))} 字符` });

        // 坚持天数
        const persistenceStats = statsContainer.createDiv('stat-group');
        persistenceStats.createEl('h3', { text: '🎯 坚持情况' });

        const today = new Date();
        const daysThisMonth = today.getDate();
        const monthProgress = Math.round((this.stats.thisMonth / daysThisMonth) * 100);

        persistenceStats.createEl('p', { text: `本月完成度: ${monthProgress}% (${this.stats.thisMonth}/${daysThisMonth})` });

        // 关闭按钮
        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('关闭')
                .onClick(() => this.close())
            );
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

// 时间状态显示模态框
class TimeStatusModal extends Modal {
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('time-status-modal');

        contentEl.createEl('h2', { text: '⏰ 网络时间状态' });

        const statusContainer = contentEl.createDiv('time-status-container');

        // 获取时间信息
        const timeInfo = this.plugin.getTimeStatusInfo();
        const now = this.plugin.getCurrentDate();
        const localNow = new Date();

        // 当前时间显示
        const currentSection = statusContainer.createDiv('status-section');
        currentSection.createEl('h3', { text: '🌐 当前时间' });

        const currentTime = currentSection.createDiv('current-time');
        currentTime.createEl('div', {
            text: `网络时间: ${now.toLocaleString()}`,
            cls: 'time-display network-time'
        });
        currentTime.createEl('div', {
            text: `本地时间: ${localNow.toLocaleString()}`,
            cls: 'time-display local-time'
        });

        // 同步状态
        const syncSection = statusContainer.createDiv('status-section');
        syncSection.createEl('h3', { text: '🔄 同步状态' });

        const syncInfo = syncSection.createDiv('sync-info');

        const offsetMs = Math.abs(timeInfo.offset);
        const offsetText = offsetMs < 1000 ?
            `${offsetMs}毫秒` :
            `${(offsetMs / 1000).toFixed(1)}秒`;

        syncInfo.createEl('div', { text: `时间偏移: ${offsetText}` });
        syncInfo.createEl('div', { text: `最后同步: ${timeInfo.lastSync}` });
        syncInfo.createEl('div', { text: `时区: ${timeInfo.timezone}` });
        syncInfo.createEl('div', { text: `数据源: ${this.getSourceDisplayName(timeInfo.source)}` });

        // 同步质量指示器
        const qualitySection = statusContainer.createDiv('status-section');
        qualitySection.createEl('h3', { text: '📊 同步质量' });

        const quality = this.getSyncQuality(timeInfo);
        const qualityIndicator = qualitySection.createDiv('quality-indicator');
        qualityIndicator.createEl('div', {
            text: `${quality.icon} ${quality.status}`,
            cls: `quality-status ${quality.level}`
        });
        qualityIndicator.createEl('div', {
            text: quality.description,
            cls: 'quality-description'
        });

        // 操作按钮
        const buttonGroup = statusContainer.createDiv('button-group');

        const syncBtn = buttonGroup.createEl('button', {
            text: '🔄 立即同步',
            cls: 'sync-btn primary'
        });
        syncBtn.onclick = async () => {
            syncBtn.textContent = '⏳ 同步中...';
            syncBtn.disabled = true;

            try {
                await this.plugin.forceTimeSync();
                this.close();
                new Notice('时间同步完成！');
            } catch (error) {
                syncBtn.textContent = '🔄 立即同步';
                syncBtn.disabled = false;
                new Notice(`同步失败: ${error.message}`);
            }
        };

        const closeBtn = buttonGroup.createEl('button', {
            text: '关闭',
            cls: 'close-btn secondary'
        });
        closeBtn.onclick = () => this.close();

        // 添加样式
        this.addTimeStatusStyles();

        // 实时更新时间
        this.updateInterval = setInterval(() => {
            const newNow = this.plugin.getCurrentDate();
            const newLocalNow = new Date();

            const networkTimeEl = contentEl.querySelector('.network-time');
            const localTimeEl = contentEl.querySelector('.local-time');

            if (networkTimeEl) networkTimeEl.textContent = `网络时间: ${newNow.toLocaleString()}`;
            if (localTimeEl) localTimeEl.textContent = `本地时间: ${newLocalNow.toLocaleString()}`;
        }, 1000);
    }

    getSourceDisplayName(source) {
        if (!source || source === '本地时间') return '本地时间';

        if (source.includes('worldtimeapi.org')) return 'WorldTime API';
        if (source.includes('worldclockapi.com')) return 'WorldClock API';
        return '网络时间服务';
    }

    getSyncQuality(timeInfo) {
        const offsetMs = Math.abs(timeInfo.offset);
        const syncAge = timeInfo.lastSync ? Date.now() - timeInfo.lastSync : Infinity;

        if (!timeInfo.lastSync || timeInfo.source === '本地时间') {
            return {
                level: 'poor',
                status: '未同步',
                description: '使用本地时间，建议进行网络时间同步',
                icon: '⚠️'
            };
        }

        if (syncAge > 2 * 60 * 60 * 1000) { // 2小时
            return {
                level: 'warning',
                status: '同步过期',
                description: '上次同步时间较久，建议重新同步',
                icon: '🟡'
            };
        }

        if (offsetMs < 100) {
            return {
                level: 'excellent',
                status: '精确同步',
                description: '时间精度极高，同步质量优秀',
                icon: '🟢'
            };
        } else if (offsetMs < 1000) {
            return {
                level: 'good',
                status: '良好同步',
                description: '时间精度较高，同步质量良好',
                icon: '🟢'
            };
        } else if (offsetMs < 5000) {
            return {
                level: 'fair',
                status: '一般同步',
                description: '时间精度一般，建议重新同步',
                icon: '🟡'
            };
        } else {
            return {
                level: 'poor',
                status: '同步异常',
                description: '时间偏差较大，建议检查网络或重新同步',
                icon: '🔴'
            };
        }
    }

    addTimeStatusStyles() {
        const style = this.contentEl.createEl('style');
        style.textContent = `
            .time-status-modal {
                min-width: 450px;
                max-width: 600px;
            }

            .time-status-container {
                padding: 20px 0;
            }

            .status-section {
                margin-bottom: 24px;
                padding: 16px;
                background: var(--background-secondary);
                border-radius: 8px;
                border: 1px solid var(--background-modifier-border);
            }

            .status-section h3 {
                margin: 0 0 12px 0;
                font-size: 14px;
                font-weight: 600;
                color: var(--text-normal);
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .current-time {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .time-display {
                font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
                font-size: 13px;
                padding: 8px 12px;
                border-radius: 6px;
                background: var(--background-primary);
                border: 1px solid var(--background-modifier-border);
            }

            .network-time {
                color: var(--color-green);
                font-weight: 600;
            }

            .local-time {
                color: var(--text-muted);
            }

            .sync-info {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                font-size: 13px;
            }

            .sync-info div {
                padding: 6px 8px;
                background: var(--background-primary);
                border-radius: 4px;
                border: 1px solid var(--background-modifier-border);
            }

            .quality-indicator {
                text-align: center;
            }

            .quality-status {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 8px;
            }

            .quality-status.excellent {
                color: var(--color-green);
            }

            .quality-status.good {
                color: var(--color-green);
            }

            .quality-status.fair {
                color: var(--color-orange);
            }

            .quality-status.warning {
                color: var(--color-orange);
            }

            .quality-status.poor {
                color: var(--color-red);
            }

            .quality-description {
                font-size: 12px;
                color: var(--text-muted);
                line-height: 1.4;
            }

            .button-group {
                display: flex;
                justify-content: center;
                gap: 12px;
                margin-top: 20px;
                padding-top: 16px;
                border-top: 1px solid var(--background-modifier-border);
            }

            .sync-btn, .close-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .sync-btn.primary {
                background: var(--interactive-accent);
                color: var(--text-on-accent);
            }

            .close-btn.secondary {
                background: var(--background-secondary);
                color: var(--text-normal);
                border: 1px solid var(--background-modifier-border);
            }

            .sync-btn:hover, .close-btn:hover {
                opacity: 0.9;
                transform: translateY(-1px);
            }

            .sync-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }

            @media (max-width: 500px) {
                .time-status-modal {
                    min-width: 95vw;
                }

                .sync-info {
                    grid-template-columns: 1fr;
                }

                .button-group {
                    flex-direction: column;
                }
            }
        `;
    }

    onClose() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        const { contentEl } = this;
        contentEl.empty();
    }
}

// 任务编辑模态框
class TaskEditModal extends Modal {
    constructor(app, calendarView, task, onSubmit) {
        super(app);
        this.calendarView = calendarView;
        this.task = task; // null for new task, existing task for editing
        this.onSubmit = onSubmit;
        this.isEditing = !!task;

        this.formData = {
            title: task?.title || '',
            description: task?.description || '',
            priority: task?.priority || 'medium',
            tags: task?.tags || [],
            completed: task?.completed || false,
            startTime: task?.startTime || '',
            duration: task?.duration || 60,
            dueDate: task?.dueDate || '' // 新增：截止日期
        };
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('task-edit-modal');

        // 标题
        contentEl.createEl('h2', {
            text: this.isEditing ? '✏️ 编辑任务' : '➕ 创建新任务'
        });

        // 表单
        const form = contentEl.createDiv('task-form');

        // 任务标题
        this.createFormField(form, {
            label: '任务标题',
            type: 'text',
            placeholder: '输入任务标题...',
            value: this.formData.title,
            required: true,
            onChange: (value) => { this.formData.title = value; }
        });

        // 任务描述
        this.createFormField(form, {
            label: '任务描述',
            type: 'textarea',
            placeholder: '详细描述任务内容...',
            value: this.formData.description,
            onChange: (value) => { this.formData.description = value; }
        });

        // 优先级选择
        this.createPriorityField(form);

        // 截止日期
        this.createDueDateField(form);

        // 时间设置
        this.createTimeFields(form);

        // 标签输入
        this.createTagsField(form);

        // 完成状态（编辑模式下显示）
        if (this.isEditing) {
            this.createFormField(form, {
                label: '完成状态',
                type: 'checkbox',
                checked: this.formData.completed,
                onChange: (checked) => { this.formData.completed = checked; }
            });
        }

        // 按钮组
        this.createButtonGroup(contentEl);

        // 添加样式
        this.addModalStyles();

        // 聚焦到标题输入框
        setTimeout(() => {
            const titleInput = contentEl.querySelector('input[type="text"]');
            if (titleInput) titleInput.focus();
        }, 100);
    }

    createFormField(container, config) {
        const fieldGroup = container.createDiv('form-field-group');

        // 标签
        const label = fieldGroup.createEl('label', {
            text: config.label,
            cls: 'form-field-label'
        });
        if (config.required) {
            label.createSpan('required-indicator').textContent = ' *';
        }

        // 输入控件
        let input;
        if (config.type === 'textarea') {
            input = fieldGroup.createEl('textarea', {
                cls: 'form-field-input',
                attr: {
                    placeholder: config.placeholder || '',
                    rows: '3'
                }
            });
            input.value = config.value || '';
        } else if (config.type === 'checkbox') {
            const checkboxContainer = fieldGroup.createDiv('checkbox-container');
            input = checkboxContainer.createEl('input', {
                type: 'checkbox',
                cls: 'form-field-checkbox'
            });
            input.checked = config.checked || false;
            checkboxContainer.createSpan('checkbox-label').textContent = '已完成';
        } else {
            input = fieldGroup.createEl('input', {
                type: config.type || 'text',
                cls: 'form-field-input',
                attr: {
                    placeholder: config.placeholder || ''
                }
            });
            input.value = config.value || '';
        }

        // 事件处理
        if (config.onChange) {
            if (config.type === 'checkbox') {
                input.addEventListener('change', () => config.onChange(input.checked));
            } else {
                input.addEventListener('input', () => config.onChange(input.value));
            }
        }

        return input;
    }

    createPriorityField(container) {
        const fieldGroup = container.createDiv('form-field-group');
        fieldGroup.createEl('label', {
            text: '优先级',
            cls: 'form-field-label'
        });

        const priorityContainer = fieldGroup.createDiv('priority-selector');
        const priorities = [
            { value: 'low', label: '🟢 低优先级', color: 'var(--color-green)' },
            { value: 'medium', label: '🟡 中优先级', color: 'var(--color-orange)' },
            { value: 'high', label: '🔴 高优先级', color: 'var(--color-red)' }
        ];

        priorities.forEach(priority => {
            const btn = priorityContainer.createEl('button', {
                text: priority.label,
                cls: `priority-btn priority-${priority.value} ${this.formData.priority === priority.value ? 'active' : ''}`
            });
            btn.style.borderColor = priority.color;

            btn.onclick = (e) => {
                e.preventDefault();
                // 移除其他按钮的活动状态
                priorityContainer.querySelectorAll('.priority-btn').forEach(b => b.removeClass('active'));
                // 激活当前按钮
                btn.addClass('active');
                this.formData.priority = priority.value;
            };
        });
    }

    createDueDateField(container) {
        const fieldGroup = container.createDiv('form-field-group');
        fieldGroup.createEl('label', {
            text: '📅 截止日期',
            cls: 'form-field-label'
        });

        const dueDateContainer = fieldGroup.createDiv('due-date-container');

        // 截止日期输入
        const dateInput = dueDateContainer.createEl('input', {
            type: 'date',
            cls: 'due-date-input',
            attr: { value: this.formData.dueDate }
        });

        dateInput.addEventListener('change', () => {
            this.formData.dueDate = dateInput.value;
            this.updateDueDateStatus(dueDateContainer, dateInput.value);
        });

        // 快速设置按钮
        const quickButtons = dueDateContainer.createDiv('quick-date-buttons');
        const quickOptions = [
            { label: '今天', days: 0 },
            { label: '明天', days: 1 },
            { label: '本周末', days: this.getDaysUntilWeekend() },
            { label: '下周', days: 7 },
            { label: '下月', days: 30 }
        ];

        quickOptions.forEach(option => {
            const btn = quickButtons.createEl('button', {
                text: option.label,
                cls: 'quick-date-btn',
                type: 'button'
            });

            btn.onclick = () => {
                const targetDate = new Date();
                targetDate.setDate(targetDate.getDate() + option.days);
                const dateStr = targetDate.toISOString().split('T')[0];
                dateInput.value = dateStr;
                this.formData.dueDate = dateStr;
                this.updateDueDateStatus(dueDateContainer, dateStr);
            };
        });

        // 清除按钮
        const clearBtn = dueDateContainer.createEl('button', {
            text: '清除',
            cls: 'clear-date-btn',
            type: 'button'
        });

        clearBtn.onclick = () => {
            dateInput.value = '';
            this.formData.dueDate = '';
            this.updateDueDateStatus(dueDateContainer, '');
        };

        // 初始状态显示
        if (this.formData.dueDate) {
            this.updateDueDateStatus(dueDateContainer, this.formData.dueDate);
        }
    }

    // 获取到周末的天数
    getDaysUntilWeekend() {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
        const daysUntilSaturday = 6 - dayOfWeek;
        return daysUntilSaturday < 1 ? 7 + daysUntilSaturday : daysUntilSaturday;
    }

    // 更新截止日期状态显示
    updateDueDateStatus(container, dateStr) {
        // 清除之前的状态显示
        const existingStatus = container.querySelector('.due-date-status');
        if (existingStatus) existingStatus.remove();

        if (!dateStr) return;

        const statusDiv = container.createDiv('due-date-status');
        const targetDate = new Date(dateStr);
        const today = new Date();
        const diffTime = targetDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let statusText, statusClass;

        if (diffDays < 0) {
            statusText = `⚠️ 已逾期 ${Math.abs(diffDays)} 天`;
            statusClass = 'overdue';
        } else if (diffDays === 0) {
            statusText = '🔥 今天到期';
            statusClass = 'due-today';
        } else if (diffDays === 1) {
            statusText = '⚡ 明天到期';
            statusClass = 'due-tomorrow';
        } else if (diffDays <= 3) {
            statusText = `⏰ ${diffDays} 天后到期`;
            statusClass = 'due-soon';
        } else {
            statusText = `📅 ${diffDays} 天后到期`;
            statusClass = 'due-normal';
        }

        statusDiv.textContent = statusText;
        statusDiv.className = `due-date-status ${statusClass}`;
    }

    createTimeFields(container) {
        const fieldGroup = container.createDiv('form-field-group');
        fieldGroup.createEl('label', {
            text: '时间安排',
            cls: 'form-field-label'
        });

        const timeContainer = fieldGroup.createDiv('time-fields-container');

        // 开始时间
        const startTimeGroup = timeContainer.createDiv('time-input-group');
        startTimeGroup.createEl('label', {
            text: '开始时间',
            cls: 'time-label'
        });

        const startTimeInput = startTimeGroup.createEl('input', {
            type: 'time',
            cls: 'time-input',
            attr: { value: this.formData.startTime }
        });

        startTimeInput.addEventListener('input', () => {
            this.formData.startTime = startTimeInput.value;
        });

        // 持续时间
        const durationGroup = timeContainer.createDiv('time-input-group');
        durationGroup.createEl('label', {
            text: '持续时间（分钟）',
            cls: 'time-label'
        });

        const durationInput = durationGroup.createEl('input', {
            type: 'number',
            cls: 'time-input',
            attr: {
                value: this.formData.duration,
                min: '5',
                max: '480',
                step: '5',
                placeholder: '60'
            }
        });

        durationInput.addEventListener('input', () => {
            this.formData.duration = parseInt(durationInput.value) || 60;
        });

        // 预设时间快捷按钮
        const presetsContainer = fieldGroup.createDiv('time-presets');
        const presets = [
            { label: '15分钟', value: 15 },
            { label: '30分钟', value: 30 },
            { label: '1小时', value: 60 },
            { label: '2小时', value: 120 }
        ];

        presets.forEach(preset => {
            const btn = presetsContainer.createEl('button', {
                text: preset.label,
                cls: 'preset-btn'
            });
            btn.onclick = (e) => {
                e.preventDefault();
                this.formData.duration = preset.value;
                durationInput.value = preset.value.toString();
            };
        });
    }

    createTagsField(container) {
        const fieldGroup = container.createDiv('form-field-group');
        fieldGroup.createEl('label', {
            text: '标签',
            cls: 'form-field-label'
        });

        const tagsContainer = fieldGroup.createDiv('tags-input-container');

        // 标签输入框
        const tagInput = tagsContainer.createEl('input', {
            type: 'text',
            cls: 'tags-input',
            attr: { placeholder: '输入标签后按回车添加...' }
        });

        // 标签显示区域
        const tagsDisplay = fieldGroup.createDiv('tags-display');

        // 渲染现有标签
        const renderTags = () => {
            tagsDisplay.empty();
            this.formData.tags.forEach((tag, index) => {
                const tagEl = tagsDisplay.createDiv('tag-item');
                tagEl.createSpan('tag-text').textContent = tag;
                const removeBtn = tagEl.createEl('button', {
                    text: '×',
                    cls: 'tag-remove-btn'
                });
                removeBtn.onclick = () => {
                    this.formData.tags.splice(index, 1);
                    renderTags();
                };
            });
        };

        renderTags();

        // 添加标签事件
        tagInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && tagInput.value.trim()) {
                e.preventDefault();
                const newTag = tagInput.value.trim();
                if (!this.formData.tags.includes(newTag)) {
                    this.formData.tags.push(newTag);
                    renderTags();
                }
                tagInput.value = '';
            }
        });
    }

    createButtonGroup(container) {
        const buttonGroup = container.createDiv('modal-button-group');

        // 确定按钮
        const submitBtn = buttonGroup.createEl('button', {
            text: this.isEditing ? '💾 保存更改' : '✅ 创建任务',
            cls: 'modal-btn modal-btn-primary'
        });

        submitBtn.onclick = () => {
            if (this.validateForm()) {
                this.onSubmit(this.formData);
                this.close();
            }
        };

        // 取消按钮
        const cancelBtn = buttonGroup.createEl('button', {
            text: '❌ 取消',
            cls: 'modal-btn modal-btn-secondary'
        });

        cancelBtn.onclick = () => this.close();

        // 删除按钮（仅编辑模式）
        if (this.isEditing) {
            const deleteBtn = buttonGroup.createEl('button', {
                text: '🗑️ 删除任务',
                cls: 'modal-btn modal-btn-danger'
            });

            deleteBtn.onclick = () => {
                if (confirm('确定要删除这个任务吗？')) {
                    this.calendarView.deleteTask(this.task.id);
                    this.close();
                }
            };
        }
    }

    validateForm() {
        if (!this.formData.title.trim()) {
            new Notice('请输入任务标题');
            return false;
        }
        return true;
    }

    addModalStyles() {
        const style = this.contentEl.createEl('style');
        style.textContent = `
            .task-edit-modal {
                min-width: 400px;
                max-width: 500px;
            }

            .task-form {
                margin: 20px 0;
            }

            .form-field-group {
                margin-bottom: 16px;
            }

            .form-field-label {
                display: block;
                font-size: 13px;
                font-weight: 500;
                color: var(--text-normal);
                margin-bottom: 6px;
            }

            .required-indicator {
                color: var(--color-red);
            }

            .form-field-input {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                background: var(--background-primary);
                color: var(--text-normal);
                font-size: 13px;
                transition: border-color 0.2s ease;
            }

            .form-field-input:focus {
                outline: none;
                border-color: var(--interactive-accent);
            }

            .checkbox-container {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .form-field-checkbox {
                width: auto !important;
            }

            .checkbox-label {
                font-size: 13px;
                color: var(--text-normal);
            }

            .priority-selector {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }

            .priority-btn {
                padding: 8px 12px;
                border: 2px solid var(--background-modifier-border);
                border-radius: 6px;
                background: var(--background-primary);
                color: var(--text-normal);
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .priority-btn:hover {
                background: var(--background-modifier-hover);
            }

            .priority-btn.active {
                background: var(--background-secondary);
                font-weight: 600;
            }

            .tags-input-container {
                margin-bottom: 8px;
            }

            .tags-input {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                background: var(--background-primary);
                color: var(--text-normal);
                font-size: 13px;
            }

            .tags-display {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                min-height: 20px;
            }

            .tag-item {
                display: flex;
                align-items: center;
                background: var(--color-accent-1);
                color: var(--text-normal);
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 11px;
                gap: 4px;
            }

            .tag-text {
                font-weight: 500;
            }

            .tag-remove-btn {
                background: none;
                border: none;
                color: var(--text-muted);
                cursor: pointer;
                font-size: 14px;
                line-height: 1;
                padding: 0;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .tag-remove-btn:hover {
                background: var(--background-modifier-hover);
                color: var(--text-normal);
            }

            .modal-button-group {
                display: flex;
                justify-content: flex-end;
                gap: 8px;
                margin-top: 20px;
                padding-top: 16px;
                border-top: 1px solid var(--background-modifier-border);
            }

            .modal-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .modal-btn-primary {
                background: var(--interactive-accent);
                color: var(--text-on-accent);
            }

            .modal-btn-secondary {
                background: var(--background-secondary);
                color: var(--text-normal);
                border: 1px solid var(--background-modifier-border);
            }

            .modal-btn-danger {
                background: var(--color-red);
                color: white;
            }

            .modal-btn:hover {
                opacity: 0.9;
                transform: translateY(-1px);
            }

            @media (max-width: 480px) {
                .task-edit-modal {
                    min-width: 90vw;
                }

                .priority-selector {
                    flex-direction: column;
                }

                .modal-button-group {
                    flex-direction: column-reverse;
                }

                .modal-btn {
                    width: 100%;
                }
            }

            /* 截止日期相关样式 */
            .due-date-container {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .due-date-input {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                background: var(--background-primary);
                color: var(--text-normal);
                font-size: 13px;
            }

            .due-date-input:focus {
                border-color: var(--interactive-accent);
                outline: none;
            }

            .quick-date-buttons {
                display: flex;
                gap: 4px;
                flex-wrap: wrap;
            }

            .quick-date-btn, .clear-date-btn {
                padding: 4px 8px;
                font-size: 11px;
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                background: var(--background-secondary);
                color: var(--text-normal);
                cursor: pointer;
                transition: all 0.2s;
            }

            .quick-date-btn:hover, .clear-date-btn:hover {
                background: var(--background-modifier-hover);
                border-color: var(--interactive-accent);
            }

            .clear-date-btn {
                background: var(--background-modifier-error);
                color: var(--text-error);
                border-color: var(--background-modifier-error);
            }

            .clear-date-btn:hover {
                background: var(--text-error);
                color: white;
            }

            .due-date-status {
                padding: 6px 10px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 500;
                text-align: center;
                margin-top: 4px;
            }

            .due-date-status.overdue {
                background: #fee2e2;
                color: #dc2626;
                border: 1px solid #fca5a5;
            }

            .due-date-status.due-today {
                background: #fef3c7;
                color: #d97706;
                border: 1px solid #fcd34d;
                animation: pulse 2s infinite;
            }

            .due-date-status.due-tomorrow {
                background: #fef3c7;
                color: #d97706;
                border: 1px solid #fcd34d;
            }

            .due-date-status.due-soon {
                background: #dbeafe;
                color: #2563eb;
                border: 1px solid #93c5fd;
            }

            .due-date-status.due-normal {
                background: #f3f4f6;
                color: var(--text-muted);
                border: 1px solid var(--background-modifier-border);
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }

            @media (max-width: 480px) {
                .quick-date-buttons {
                    grid-template-columns: repeat(2, 1fr);
                    gap: 6px;
                }

                .quick-date-btn, .clear-date-btn {
                    font-size: 10px;
                    padding: 6px 8px;
                }
            }
        `;
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

// 任务过滤模态框
class TaskFilterModal extends Modal {
    constructor(app, calendarView) {
        super(app);
        this.calendarView = calendarView;
        this.filters = {
            dueStatus: 'all',
            completionStatus: 'all',
            priority: 'all'
        };

        // 如果有现有过滤器，使用它们
        if (calendarView.currentFilters) {
            this.filters = { ...calendarView.currentFilters };
        }
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('task-filter-modal');

        // 标题
        contentEl.createEl('h2', { text: '🔍 任务过滤器' });

        // 表单
        const form = contentEl.createDiv('filter-form');

        // 截止日期状态过滤
        this.createFilterSection(form, {
            title: '📅 截止日期状态',
            key: 'dueStatus',
            options: [
                { value: 'all', label: '全部' },
                { value: 'overdue', label: '⚠️ 已逾期' },
                { value: 'due-today', label: '🔥 今天到期' },
                { value: 'due-soon', label: '⏰ 3天内到期' },
                { value: 'no-due-date', label: '📝 无截止日期' }
            ]
        });

        // 完成状态过滤
        this.createFilterSection(form, {
            title: '✅ 完成状态',
            key: 'completionStatus',
            options: [
                { value: 'all', label: '全部' },
                { value: 'pending', label: '⭕ 待完成' },
                { value: 'completed', label: '✅ 已完成' }
            ]
        });

        // 优先级过滤
        this.createFilterSection(form, {
            title: '🎯 优先级',
            key: 'priority',
            options: [
                { value: 'all', label: '全部' },
                { value: 'high', label: '🔴 高优先级' },
                { value: 'medium', label: '🟡 中优先级' },
                { value: 'low', label: '🟢 低优先级' }
            ]
        });

        // 预设快速过滤
        const quickFiltersSection = form.createDiv('quick-filters-section');
        quickFiltersSection.createEl('h3', { text: '⚡ 快速过滤', cls: 'section-title' });

        const quickFiltersGrid = quickFiltersSection.createDiv('quick-filters-grid');

        const quickFilters = [
            {
                label: '🚨 紧急任务',
                filters: { dueStatus: 'overdue', completionStatus: 'pending' }
            },
            {
                label: '📅 今日待办',
                filters: { dueStatus: 'due-today', completionStatus: 'pending' }
            },
            {
                label: '🎯 高优先级',
                filters: { priority: 'high', completionStatus: 'pending' }
            },
            {
                label: '✅ 最近完成',
                filters: { completionStatus: 'completed' }
            }
        ];

        quickFilters.forEach(quick => {
            const btn = quickFiltersGrid.createEl('button', {
                text: quick.label,
                cls: 'quick-filter-btn'
            });
            btn.onclick = () => {
                this.applyQuickFilter(quick.filters);
            };
        });

        // 按钮组
        const buttonGroup = form.createDiv('filter-button-group');

        const applyBtn = buttonGroup.createEl('button', {
            text: '应用过滤器',
            cls: 'mod-cta'
        });
        applyBtn.onclick = () => {
            this.applyFilters();
        };

        const clearBtn = buttonGroup.createEl('button', {
            text: '清除过滤器',
            cls: 'mod-secondary'
        });
        clearBtn.onclick = () => {
            this.clearFilters();
        };

        const cancelBtn = buttonGroup.createEl('button', {
            text: '取消',
            cls: 'mod-secondary'
        });
        cancelBtn.onclick = () => {
            this.close();
        };

        // 添加样式
        this.addStyles();

        // 显示当前过滤统计
        this.updateFilterStats(form);
    }

    createFilterSection(container, config) {
        const section = container.createDiv('filter-section');
        section.createEl('h3', { text: config.title, cls: 'filter-title' });

        const optionsContainer = section.createDiv('filter-options');

        config.options.forEach(option => {
            const optionEl = optionsContainer.createDiv('filter-option');

            const radio = optionEl.createEl('input', {
                type: 'radio',
                attr: {
                    name: config.key,
                    value: option.value,
                    id: `${config.key}-${option.value}`
                }
            });

            if (this.filters[config.key] === option.value) {
                radio.checked = true;
            }

            const label = optionEl.createEl('label', {
                text: option.label,
                attr: { for: `${config.key}-${option.value}` }
            });

            radio.onchange = () => {
                if (radio.checked) {
                    this.filters[config.key] = option.value;
                }
            };
        });
    }

    applyQuickFilter(quickFilters) {
        // 重置所有过滤器为默认值
        this.filters = {
            dueStatus: 'all',
            completionStatus: 'all',
            priority: 'all'
        };

        // 应用快速过滤器设置
        Object.assign(this.filters, quickFilters);

        // 更新UI
        this.updateRadioButtons();
        this.applyFilters();
    }

    updateRadioButtons() {
        Object.keys(this.filters).forEach(key => {
            const radio = this.contentEl.querySelector(`input[name="${key}"][value="${this.filters[key]}"]`);
            if (radio) {
                radio.checked = true;
            }
        });
    }

    applyFilters() {
        // 检查是否所有过滤器都是默认值
        const isDefaultFilter = Object.values(this.filters).every(value => value === 'all');

        if (isDefaultFilter) {
            this.calendarView.currentFilters = null;
        } else {
            this.calendarView.currentFilters = { ...this.filters };
        }

        this.calendarView.renderMainContent();
        new Notice('🔍 过滤器已应用');
        this.close();
    }

    clearFilters() {
        this.filters = {
            dueStatus: 'all',
            completionStatus: 'all',
            priority: 'all'
        };
        this.calendarView.currentFilters = null;
        this.calendarView.renderMainContent();
        new Notice('🗑️ 过滤器已清除');
        this.close();
    }

    updateFilterStats(container) {
        let totalTasks = 0;
        for (const tasks of this.calendarView.tasks.values()) {
            totalTasks += tasks.length;
        }

        const statsEl = container.createDiv('filter-stats');
        statsEl.innerHTML = `📊 总任务数: <strong>${totalTasks}</strong>`;
    }

    addStyles() {
        const style = this.contentEl.createEl('style');
        style.textContent = `
            .task-filter-modal {
                min-width: 400px;
                max-width: 500px;
            }

            .filter-form {
                margin: 20px 0;
            }

            .filter-section {
                margin-bottom: 20px;
                padding: 16px;
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
            }

            .filter-title {
                margin: 0 0 12px 0;
                color: var(--text-accent);
                font-size: 14px;
                font-weight: 600;
            }

            .filter-options {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .filter-option {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 4px;
            }

            .filter-option input[type="radio"] {
                margin: 0;
            }

            .filter-option label {
                cursor: pointer;
                flex: 1;
                font-size: 13px;
            }

            .quick-filters-section {
                margin: 20px 0;
                padding: 16px;
                background: var(--background-secondary);
                border-radius: 6px;
            }

            .section-title {
                margin: 0 0 12px 0;
                color: var(--text-accent);
                font-size: 14px;
                font-weight: 600;
            }

            .quick-filters-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
            }

            .quick-filter-btn {
                padding: 8px 12px;
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                background: var(--background-primary);
                color: var(--text-normal);
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s;
            }

            .quick-filter-btn:hover {
                background: var(--interactive-accent);
                color: var(--text-on-accent);
                border-color: var(--interactive-accent);
            }

            .filter-stats {
                margin: 16px 0;
                padding: 12px;
                background: var(--background-modifier-success);
                border-radius: 6px;
                text-align: center;
                font-size: 14px;
                color: var(--text-normal);
            }

            .filter-button-group {
                display: flex;
                justify-content: flex-end;
                gap: 8px;
                margin-top: 20px;
                padding-top: 16px;
                border-top: 1px solid var(--background-modifier-border);
            }

            @media (max-width: 480px) {
                .task-filter-modal {
                    min-width: 90vw;
                }

                .quick-filters-grid {
                    grid-template-columns: 1fr;
                }

                .filter-button-group {
                    flex-direction: column-reverse;
                }
            }
        `;
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

// 逾期任务详情模态框
class OverdueTasksModal extends Modal {
    constructor(app, overdueTasks, todayTasks) {
        super(app);
        this.overdueTasks = overdueTasks;
        this.todayTasks = todayTasks;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('overdue-tasks-modal');

        // 标题
        contentEl.createEl('h2', { text: '⚠️ 任务截止提醒', cls: 'modal-title' });

        // 逾期任务部分
        if (this.overdueTasks.length > 0) {
            this.renderTaskSection(contentEl, '🚨 逾期任务', this.overdueTasks, 'overdue-section');
        }

        // 今日到期任务部分
        if (this.todayTasks.length > 0) {
            this.renderTaskSection(contentEl, '🔥 今日到期', this.todayTasks, 'due-today-section');
        }

        // 关闭按钮
        const buttonGroup = contentEl.createDiv('modal-button-group');
        const closeBtn = buttonGroup.createEl('button', {
            text: '知道了',
            cls: 'mod-cta'
        });
        closeBtn.onclick = () => this.close();

        // 添加样式
        this.addStyles();
    }

    renderTaskSection(container, title, tasks, sectionClass) {
        const section = container.createDiv(`task-section ${sectionClass}`);
        section.createEl('h3', { text: title, cls: 'section-title' });

        const taskList = section.createDiv('task-list');

        tasks.forEach(task => {
            const taskItem = taskList.createDiv('task-item');

            // 任务标题
            const titleEl = taskItem.createDiv('task-title-area');
            titleEl.createEl('span', { text: task.title, cls: 'task-title-text' });

            // 任务信息
            const infoEl = taskItem.createDiv('task-info');

            // 截止日期信息
            if (task.dueDate) {
                const dueInfo = infoEl.createDiv('due-info');
                const dueDate = new Date(task.dueDate);
                const today = new Date();
                const diffTime = dueDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                let dueDateText, dueDateClass;
                if (diffDays < 0) {
                    dueDateText = `逾期 ${Math.abs(diffDays)} 天`;
                    dueDateClass = 'overdue-text';
                } else if (diffDays === 0) {
                    dueDateText = '今天到期';
                    dueDateClass = 'due-today-text';
                } else {
                    dueDateText = `${diffDays} 天后到期`;
                    dueDateClass = 'due-normal-text';
                }

                dueInfo.createEl('span', { text: dueDateText, cls: `due-text ${dueDateClass}` });
            }

            // 优先级
            if (task.priority) {
                const priorityEl = infoEl.createDiv('priority-info');
                const priorityText = {
                    high: '🔴 高优先级',
                    medium: '🟡 中优先级',
                    low: '🟢 低优先级'
                }[task.priority] || task.priority;
                priorityEl.textContent = priorityText;
            }

            // 原始日期
            if (task.originalDate) {
                const originalDateEl = infoEl.createDiv('original-date');
                originalDateEl.textContent = `创建于: ${task.originalDate}`;
                originalDateEl.className = 'original-date-text';
            }

            // 操作按钮
            const actionsEl = taskItem.createDiv('task-actions');

            const editBtn = actionsEl.createEl('button', {
                text: '编辑',
                cls: 'action-btn edit-btn'
            });
            editBtn.onclick = () => {
                // 这里可以添加编辑任务的逻辑
                new Notice('编辑功能需要在日历视图中进行');
                this.close();
            };

            const completeBtn = actionsEl.createEl('button', {
                text: '完成',
                cls: 'action-btn complete-btn'
            });
            completeBtn.onclick = () => {
                // 这里可以添加完成任务的逻辑
                new Notice(`任务"${task.title}"已标记为完成`);
                // 实际实现需要访问日历视图来更新任务状态
                this.close();
            };
        });
    }

    addStyles() {
        const style = this.contentEl.createEl('style');
        style.textContent = `
            .overdue-tasks-modal {
                min-width: 500px;
                max-width: 600px;
            }

            .modal-title {
                color: var(--text-error);
                text-align: center;
                margin-bottom: 20px;
                border-bottom: 2px solid var(--background-modifier-border);
                padding-bottom: 10px;
            }

            .task-section {
                margin-bottom: 24px;
                padding: 16px;
                border-radius: 8px;
            }

            .overdue-section {
                background: #fef2f2;
                border: 1px solid #fca5a5;
            }

            .due-today-section {
                background: #fffbeb;
                border: 1px solid #fcd34d;
            }

            .section-title {
                margin: 0 0 12px 0;
                font-size: 16px;
                font-weight: 600;
            }

            .overdue-section .section-title {
                color: #dc2626;
            }

            .due-today-section .section-title {
                color: #d97706;
            }

            .task-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .task-item {
                background: var(--background-primary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                padding: 12px;
            }

            .task-title-area {
                margin-bottom: 8px;
            }

            .task-title-text {
                font-weight: 500;
                color: var(--text-normal);
                font-size: 14px;
            }

            .task-info {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-bottom: 8px;
            }

            .due-info, .priority-info, .original-date {
                font-size: 12px;
                padding: 2px 6px;
                border-radius: 4px;
            }

            .overdue-text {
                background: #dc2626;
                color: white;
                font-weight: 500;
            }

            .due-today-text {
                background: #f59e0b;
                color: white;
                font-weight: 500;
            }

            .due-normal-text {
                background: var(--background-modifier-border);
                color: var(--text-muted);
            }

            .priority-info {
                background: var(--background-secondary);
                color: var(--text-muted);
            }

            .original-date-text {
                background: var(--background-secondary);
                color: var(--text-muted);
                font-style: italic;
            }

            .task-actions {
                display: flex;
                gap: 6px;
                justify-content: flex-end;
            }

            .action-btn {
                padding: 4px 8px;
                font-size: 11px;
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                background: var(--background-secondary);
                color: var(--text-normal);
                cursor: pointer;
                transition: all 0.2s;
            }

            .edit-btn:hover {
                background: var(--interactive-accent);
                color: var(--text-on-accent);
                border-color: var(--interactive-accent);
            }

            .complete-btn:hover {
                background: var(--color-green);
                color: white;
                border-color: var(--color-green);
            }

            .modal-button-group {
                text-align: center;
                margin-top: 20px;
                padding-top: 16px;
                border-top: 1px solid var(--background-modifier-border);
            }

            @media (max-width: 600px) {
                .overdue-tasks-modal {
                    min-width: 90vw;
                }

                .task-info {
                    flex-direction: column;
                    align-items: flex-start;
                }

                .task-actions {
                    justify-content: center;
                }
            }
        `;
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

// 时间记录模态框
class TimeRecordModal extends Modal {
    constructor(app, calendarView, date = null, record = null) {
        super(app);
        this.calendarView = calendarView;
        this.date = date || calendarView.plugin.getCurrentDate().toISOString().split('T')[0];
        this.record = record; // 编辑模式时传入
        this.isEditMode = !!record;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        // 标题
        const title = contentEl.createEl('h2', {
            text: this.isEditMode ? '⏱️ 编辑时间记录' : '⏱️ 添加时间记录',
            cls: 'modal-title'
        });

        // 表单
        const form = contentEl.createDiv('time-record-form');

        // 日期输入
        this.createFormField(form, {
            label: '日期',
            type: 'date',
            value: this.date,
            required: true,
            onChange: (value) => { this.date = value; }
        });

        // 项目输入
        this.createFormField(form, {
            label: '项目名称',
            type: 'text',
            placeholder: '请输入项目名称',
            value: this.record?.project || '',
            required: true,
            onChange: (value) => { this.project = value; }
        });

        // 时长输入
        this.createFormField(form, {
            label: '时长 (小时)',
            type: 'number',
            placeholder: '1.5',
            value: this.record?.duration || '',
            required: true,
            step: '0.1',
            min: '0.1',
            onChange: (value) => { this.duration = parseFloat(value) || 0; }
        });

        // 分类输入
        const categoryOptions = ['开发', '会议', '学习', '设计', '调研', '沟通', '其他'];
        this.createFormField(form, {
            label: '分类',
            type: 'select',
            options: categoryOptions,
            value: this.record?.category || '开发',
            onChange: (value) => { this.category = value; }
        });

        // 描述输入
        this.createFormField(form, {
            label: '描述',
            type: 'textarea',
            placeholder: '简单描述做了什么...',
            value: this.record?.description || '',
            onChange: (value) => { this.description = value; }
        });

        // 按钮组
        const buttonGroup = form.createDiv('button-group');

        const saveButton = buttonGroup.createEl('button', {
            text: this.isEditMode ? '💾 保存' : '➕ 添加',
            cls: 'mod-cta'
        });

        saveButton.onclick = () => {
            if (this.validateForm()) {
                const timeRecord = {
                    project: this.project,
                    duration: this.duration,
                    category: this.category || '开发',
                    description: this.description || ''
                };

                if (this.isEditMode) {
                    // 编辑模式：更新现有记录
                    Object.assign(this.record, timeRecord);
                    this.calendarView.saveTimeRecords();
                    this.calendarView.renderMainContent();
                    new Notice('⏱️ 时间记录已更新');
                } else {
                    // 新增模式
                    this.calendarView.addTimeRecord(this.date, timeRecord);
                }

                this.close();
            }
        };

        const cancelButton = buttonGroup.createEl('button', {
            text: '取消',
            cls: 'mod-secondary'
        });
        cancelButton.onclick = () => this.close();

        // 如果是编辑模式，添加删除按钮
        if (this.isEditMode) {
            const deleteButton = buttonGroup.createEl('button', {
                text: '🗑️ 删除',
                cls: 'mod-warning'
            });
            deleteButton.onclick = () => {
                if (confirm('确定要删除这条时间记录吗？')) {
                    this.calendarView.deleteTimeRecord(this.record.id);
                    this.close();
                }
            };
        }

        // 添加样式
        this.addStyles(contentEl);

        // 初始化表单值
        this.project = this.record?.project || '';
        this.duration = this.record?.duration || 0;
        this.category = this.record?.category || '开发';
        this.description = this.record?.description || '';

        // 聚焦到项目输入框
        setTimeout(() => {
            const projectInput = contentEl.querySelector('input[placeholder*="项目"]');
            if (projectInput && !this.isEditMode) projectInput.focus();
        }, 100);
    }

    createFormField(container, config) {
        const fieldGroup = container.createDiv('form-field-group');

        // 标签
        const label = fieldGroup.createEl('label', {
            text: config.label,
            cls: 'form-field-label'
        });
        if (config.required) {
            label.createSpan('required-indicator').textContent = ' *';
        }

        // 输入控件
        let input;
        if (config.type === 'textarea') {
            input = fieldGroup.createEl('textarea', {
                cls: 'form-field-input',
                attr: {
                    placeholder: config.placeholder || '',
                    rows: '3'
                }
            });
            input.value = config.value || '';
        } else if (config.type === 'select') {
            input = fieldGroup.createEl('select', {
                cls: 'form-field-input'
            });
            (config.options || []).forEach(option => {
                const optionEl = input.createEl('option', {
                    text: option,
                    value: option
                });
                if (option === config.value) {
                    optionEl.selected = true;
                }
            });
        } else {
            input = fieldGroup.createEl('input', {
                type: config.type,
                cls: 'form-field-input',
                attr: {
                    placeholder: config.placeholder || ''
                }
            });

            if (config.step) input.setAttribute('step', config.step);
            if (config.min) input.setAttribute('min', config.min);
            if (config.max) input.setAttribute('max', config.max);

            input.value = config.value || '';
        }

        // 绑定事件
        if (config.onChange) {
            input.addEventListener('input', () => {
                config.onChange(input.value);
            });
        }

        return input;
    }

    validateForm() {
        if (!this.project || this.project.trim() === '') {
            new Notice('❌ 请输入项目名称');
            return false;
        }

        if (!this.duration || this.duration <= 0) {
            new Notice('❌ 请输入有效的时长');
            return false;
        }

        if (!this.date) {
            new Notice('❌ 请选择日期');
            return false;
        }

        return true;
    }

    addStyles(container) {
        const style = container.createEl('style');
        style.textContent = `
            .time-record-form {
                padding: 20px 0;
            }

            .form-field-group {
                margin-bottom: 16px;
            }

            .form-field-label {
                display: block;
                margin-bottom: 6px;
                font-weight: 500;
                color: var(--text-normal);
            }

            .required-indicator {
                color: var(--text-error);
                font-weight: bold;
            }

            .form-field-input {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                background: var(--background-primary);
                color: var(--text-normal);
                font-family: var(--font-interface);
                font-size: 14px;
            }

            .form-field-input:focus {
                outline: none;
                border-color: var(--interactive-accent);
                box-shadow: 0 0 0 2px var(--interactive-accent-hover);
            }

            .button-group {
                display: flex;
                gap: 10px;
                margin-top: 20px;
                justify-content: flex-end;
            }

            .button-group button {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s;
            }

            .mod-cta {
                background: var(--interactive-accent);
                color: var(--text-on-accent);
            }

            .mod-cta:hover {
                background: var(--interactive-accent-hover);
            }

            .mod-secondary {
                background: var(--background-modifier-border);
                color: var(--text-muted);
            }

            .mod-secondary:hover {
                background: var(--background-modifier-border-hover);
                color: var(--text-normal);
            }

            .mod-warning {
                background: var(--text-error);
                color: white;
            }

            .mod-warning:hover {
                background: #d73a49;
            }

            /* 响应式设计 */
            @media (max-width: 600px) {
                .button-group {
                    flex-direction: column;
                }

                .button-group button {
                    width: 100%;
                }
            }
        `;
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

// 时间统计报告模态框
class TimeReportModal extends Modal {
    constructor(app, calendarView) {
        super(app);
        this.calendarView = calendarView;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        // 标题
        const title = contentEl.createEl('h2', {
            text: '📊 时间统计报告',
            cls: 'modal-title'
        });

        // 期间选择
        const periodSelector = contentEl.createDiv('period-selector');
        const periodLabel = periodSelector.createEl('label', { text: '统计期间:' });

        const periodSelect = periodSelector.createEl('select', { cls: 'period-select' });
        const periods = [
            { value: 'week', text: '本周' },
            { value: 'month', text: '本月' },
            { value: 'quarter', text: '本季度' },
            { value: 'year', text: '本年' }
        ];

        periods.forEach(period => {
            const option = periodSelect.createEl('option', {
                value: period.value,
                text: period.text
            });
        });

        // 报告内容容器
        const reportContainer = contentEl.createDiv('report-container');

        // 生成报告按钮
        const generateButton = periodSelector.createEl('button', {
            text: '📈 生成报告',
            cls: 'mod-cta'
        });

        generateButton.onclick = () => {
            this.generateReport(periodSelect.value, reportContainer);
        };

        // 关闭按钮
        const closeButton = contentEl.createEl('button', {
            text: '关闭',
            cls: 'mod-secondary close-button'
        });
        closeButton.onclick = () => this.close();

        // 添加样式
        this.addStyles(contentEl);

        // 默认生成本周报告
        this.generateReport('week', reportContainer);
    }

    generateReport(period, container) {
        container.empty();

        const report = this.calendarView.generateTimeReviewReport(period);

        // 创建报告内容
        const reportContent = container.createDiv('report-content');

        // 解析 markdown 并转换为 HTML
        const lines = report.split('\n');
        let currentContainer = reportContent;

        lines.forEach(line => {
            if (line.startsWith('# ')) {
                currentContainer.createEl('h1', { text: line.substring(2) });
            } else if (line.startsWith('## ')) {
                currentContainer.createEl('h2', { text: line.substring(3) });
            } else if (line.startsWith('**') && line.endsWith('**')) {
                currentContainer.createEl('p').createEl('strong', { text: line.slice(2, -2) });
            } else if (line.startsWith('- ')) {
                const ul = currentContainer.querySelector('ul:last-of-type') ||
                          currentContainer.createEl('ul');
                ul.createEl('li', { text: line.substring(2) });
            } else if (line.trim() === '---') {
                currentContainer.createEl('hr');
            } else if (line.trim() !== '') {
                currentContainer.createEl('p', { text: line });
            }
        });

        // 导出按钮
        const exportButton = container.createEl('button', {
            text: '📄 导出报告',
            cls: 'mod-cta export-button'
        });

        exportButton.onclick = () => {
            this.exportReport(report, period);
        };
    }

    async exportReport(reportContent, period) {
        try {
            const year = this.calendarView.plugin.getCurrentDate().getFullYear();
            const filename = `1-周期笔记/${year}/时间复盘报告-${period}-${new Date().toISOString().split('T')[0]}.md`;

            // 确保目录存在
            await this.calendarView.plugin.ensureYearFolderExists(year);

            // 创建文件
            const existingFile = this.app.vault.getAbstractFileByPath(filename);
            if (existingFile) {
                await this.app.vault.modify(existingFile, reportContent);
            } else {
                await this.app.vault.create(filename, reportContent);
            }

            new Notice(`📄 报告已导出: ${filename}`);
        } catch (error) {
            console.error('导出报告失败:', error);
            new Notice('❌ 导出报告失败');
        }
    }

    addStyles(container) {
        const style = container.createEl('style');
        style.textContent = `
            .period-selector {
                display: flex;
                gap: 10px;
                align-items: center;
                margin-bottom: 20px;
                padding: 16px;
                background: var(--background-secondary);
                border-radius: 6px;
            }

            .period-select {
                padding: 6px 12px;
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                background: var(--background-primary);
                color: var(--text-normal);
            }

            .report-container {
                max-height: 400px;
                overflow-y: auto;
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                padding: 20px;
                margin: 16px 0;
            }

            .report-content h1 {
                color: var(--text-accent);
                border-bottom: 2px solid var(--background-modifier-border);
                padding-bottom: 8px;
            }

            .report-content h2 {
                color: var(--text-normal);
                margin-top: 20px;
                margin-bottom: 10px;
            }

            .report-content ul {
                margin: 10px 0;
                padding-left: 20px;
            }

            .report-content li {
                margin: 6px 0;
                color: var(--text-normal);
            }

            .export-button, .close-button {
                margin: 10px;
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
            }

            .close-button {
                float: right;
                background: var(--background-modifier-border);
                color: var(--text-muted);
            }
        `;
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

// 输入模态框
class InputModal extends Modal {
    constructor(app, message, onSubmit) {
        super(app);
        this.message = message;
        this.onSubmit = onSubmit;
        this.result = '';
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h3', { text: this.message });

        new Setting(contentEl)
            .addText(text => {
                text.setPlaceholder('请输入...');
                text.inputEl.focus();
                text.onChange(value => this.result = value);
                text.inputEl.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        this.close();
                        this.onSubmit(this.result);
                    }
                });
            });

        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('确定')
                .setCta()
                .onClick(() => {
                    this.close();
                    this.onSubmit(this.result);
                }))
            .addButton(btn => btn
                .setButtonText('取消')
                .onClick(() => {
                    this.close();
                    this.onSubmit(null);
                })
            );
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

// 目标回顾模态框
class GoalsReviewModal extends Modal {
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('goals-review-modal');

        contentEl.createEl('h2', { text: '📊 目标回顾与跟踪' });

        this.renderGoalsOverview();
        this.addGoalsReviewStyles();
    }

    async renderGoalsOverview() {
        const container = this.contentEl.createDiv('goals-overview-container');

        // 获取当前时间信息
        const currentDate = this.plugin.getCurrentDate();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        const currentQuarter = Math.ceil(currentMonth / 3);

        // 年度目标概览
        await this.renderYearlyGoalsOverview(container, currentYear);

        // 季度目标概览
        await this.renderQuarterlyGoalsOverview(container, currentYear, currentQuarter);

        // 月度目标概览
        await this.renderMonthlyGoalsOverview(container, currentYear, currentMonth);

        // 操作按钮
        this.renderActionButtons(container);
    }

    async renderYearlyGoalsOverview(container, year) {
        const yearlySection = container.createDiv('goals-section yearly-goals');

        const header = yearlySection.createDiv('section-header');
        header.innerHTML = `<h3>🎯 ${year}年度目标</h3>`;

        const yearlyGoalsPath = `1-周期笔记/${year}/年终总结/${year}年度目标.md`;
        const yearlyFile = this.app.vault.getAbstractFileByPath(yearlyGoalsPath);

        if (yearlyFile) {
            try {
                const content = await this.app.vault.read(yearlyFile);
                const goals = this.extractGoalsFromContent(content);
                this.renderGoalsList(yearlySection, goals, 'yearly');

                const progressBtn = header.createEl('button', {
                    text: '📈 查看详情',
                    cls: 'view-details-btn'
                });
                progressBtn.onclick = async () => {
                    const activeLeaf = this.app.workspace.activeLeaf;
                    await activeLeaf.openFile(yearlyFile);
                    this.close();
                };
            } catch (error) {
                console.error('Error reading yearly goals:', error);
                yearlySection.createEl('p', { text: '读取年度目标失败', cls: 'error-message' });
            }
        } else {
            const createBtn = yearlySection.createEl('button', {
                text: '➕ 创建年度目标',
                cls: 'create-goals-btn primary'
            });
            createBtn.onclick = async () => {
                await this.plugin.createYearlyGoals();
                this.close();
            };
        }
    }

    async renderQuarterlyGoalsOverview(container, year, quarter) {
        const quarterlySection = container.createDiv('goals-section quarterly-goals');

        const header = quarterlySection.createDiv('section-header');
        header.innerHTML = `<h3>📈 ${year}年Q${quarter}季度目标</h3>`;

        const quarterlyGoalsPath = `1-周期笔记/${year}/年终总结/${year}年Q${quarter}季度目标.md`;
        const quarterlyFile = this.app.vault.getAbstractFileByPath(quarterlyGoalsPath);

        if (quarterlyFile) {
            try {
                const content = await this.app.vault.read(quarterlyFile);
                const goals = this.extractGoalsFromContent(content);
                this.renderGoalsList(quarterlySection, goals, 'quarterly');

                const progressBtn = header.createEl('button', {
                    text: '📊 查看进展',
                    cls: 'view-details-btn'
                });
                progressBtn.onclick = async () => {
                    const activeLeaf = this.app.workspace.activeLeaf;
                    await activeLeaf.openFile(quarterlyFile);
                    this.close();
                };
            } catch (error) {
                console.error('Error reading quarterly goals:', error);
                quarterlySection.createEl('p', { text: '读取季度目标失败', cls: 'error-message' });
            }
        } else {
            const createBtn = quarterlySection.createEl('button', {
                text: '➕ 创建季度目标',
                cls: 'create-goals-btn secondary'
            });
            createBtn.onclick = async () => {
                await this.plugin.createQuarterlyGoals();
                this.close();
            };
        }
    }

    async renderMonthlyGoalsOverview(container, year, month) {
        const monthlySection = container.createDiv('goals-section monthly-goals');

        const monthNames = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
        const header = monthlySection.createDiv('section-header');
        header.innerHTML = `<h3>🎯 ${year}年${monthNames[month]}月目标</h3>`;

        const monthlyGoalsPath = `1-周期笔记/${year}/月记/${year}年${month.toString().padStart(2, '0')}月目标.md`;
        const monthlyFile = this.app.vault.getAbstractFileByPath(monthlyGoalsPath);

        if (monthlyFile) {
            try {
                const content = await this.app.vault.read(monthlyFile);
                const goals = this.extractGoalsFromContent(content);
                this.renderGoalsList(monthlySection, goals, 'monthly');

                const progressBtn = header.createEl('button', {
                    text: '📋 查看详情',
                    cls: 'view-details-btn'
                });
                progressBtn.onclick = async () => {
                    const activeLeaf = this.app.workspace.activeLeaf;
                    await activeLeaf.openFile(monthlyFile);
                    this.close();
                };
            } catch (error) {
                console.error('Error reading monthly goals:', error);
                monthlySection.createEl('p', { text: '读取月度目标失败', cls: 'error-message' });
            }
        } else {
            const createBtn = monthlySection.createEl('button', {
                text: '➕ 创建月度目标',
                cls: 'create-goals-btn secondary'
            });
            createBtn.onclick = async () => {
                await this.plugin.createMonthlyGoals();
                this.close();
            };
        }
    }

    extractGoalsFromContent(content) {
        const goals = [];
        const lines = content.split('\n');

        let currentGoal = null;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // 检测目标标题 (numbered goals like "1. **目标名称**" or "### 主要目标")
            const goalMatch = line.match(/^(\d+\.\s*\*\*|###\s*)(.*?)(\*\*)?$/);
            if (goalMatch) {
                if (currentGoal) {
                    goals.push(currentGoal);
                }
                currentGoal = {
                    title: goalMatch[2].replace(/\*\*/g, '').trim(),
                    completed: false,
                    progress: 0,
                    description: '',
                    milestones: []
                };
            }

            // 检测完成状态 (checkboxes)
            if (currentGoal && line.includes('- [x]')) {
                currentGoal.completed = true;
                currentGoal.progress = 100;
            }

            // 收集描述信息
            if (currentGoal && line.startsWith('   -') && line.includes('具体描述：')) {
                currentGoal.description = line.replace(/.*具体描述：\s*/, '').trim();
            }

            // 估算进度 (基于完成的项目数量)
            if (currentGoal && line.includes('- [x]')) {
                currentGoal.completedItems = (currentGoal.completedItems || 0) + 1;
            }
            if (currentGoal && (line.includes('- [x]') || line.includes('- [ ]'))) {
                currentGoal.totalItems = (currentGoal.totalItems || 0) + 1;
            }
        }

        if (currentGoal) {
            goals.push(currentGoal);
        }

        // 计算进度百分比
        goals.forEach(goal => {
            if (goal.totalItems > 0) {
                goal.progress = Math.round(((goal.completedItems || 0) / goal.totalItems) * 100);
            }
        });

        return goals.slice(0, 5); // 显示前5个主要目标
    }

    renderGoalsList(container, goals, type) {
        const goalsContainer = container.createDiv('goals-list');

        if (goals.length === 0) {
            goalsContainer.createEl('p', {
                text: '暂无目标，点击上方按钮创建',
                cls: 'empty-goals-message'
            });
            return;
        }

        goals.forEach(goal => {
            const goalItem = goalsContainer.createDiv('goal-item');

            // 进度条
            const progressBar = goalItem.createDiv('goal-progress-bar');
            const progressFill = progressBar.createDiv('progress-fill');
            progressFill.style.width = `${goal.progress || 0}%`;

            // 根据进度设置颜色
            if (goal.progress >= 80) {
                progressFill.addClass('progress-excellent');
            } else if (goal.progress >= 60) {
                progressFill.addClass('progress-good');
            } else if (goal.progress >= 40) {
                progressFill.addClass('progress-fair');
            } else {
                progressFill.addClass('progress-poor');
            }

            // 目标信息
            const goalContent = goalItem.createDiv('goal-content');
            const titleRow = goalContent.createDiv('goal-title-row');

            const statusIcon = goal.completed ? '✅' : (goal.progress > 0 ? '🔄' : '⭕');
            titleRow.createSpan('goal-status').textContent = statusIcon;

            const title = titleRow.createSpan('goal-title');
            title.textContent = goal.title;
            if (goal.completed) title.addClass('completed');

            const progressText = titleRow.createSpan('goal-progress-text');
            progressText.textContent = `${goal.progress || 0}%`;

            if (goal.description) {
                const description = goalContent.createDiv('goal-description');
                description.textContent = goal.description;
            }
        });
    }

    renderActionButtons(container) {
        const buttonGroup = container.createDiv('modal-button-group');

        const quickCreateBtn = buttonGroup.createEl('button', {
            text: '⚡ 快速创建目标',
            cls: 'action-btn primary'
        });
        quickCreateBtn.onclick = () => {
            this.showQuickGoalCreationMenu();
        };

        const closeBtn = buttonGroup.createEl('button', {
            text: '关闭',
            cls: 'action-btn secondary'
        });
        closeBtn.onclick = () => this.close();
    }

    showQuickGoalCreationMenu() {
        const menu = this.contentEl.createDiv('quick-creation-menu');
        menu.innerHTML = `
            <h4>快速创建目标</h4>
            <div class="quick-options">
                <button class="quick-option" data-type="yearly">📅 年度目标</button>
                <button class="quick-option" data-type="quarterly">📈 季度目标</button>
                <button class="quick-option" data-type="monthly">🎯 月度目标</button>
            </div>
        `;

        menu.querySelectorAll('.quick-option').forEach(btn => {
            btn.onclick = async () => {
                const type = btn.getAttribute('data-type');
                switch (type) {
                    case 'yearly':
                        await this.plugin.createYearlyGoals();
                        break;
                    case 'quarterly':
                        await this.plugin.createQuarterlyGoals();
                        break;
                    case 'monthly':
                        await this.plugin.createMonthlyGoals();
                        break;
                }
                this.close();
            };
        });
    }

    addGoalsReviewStyles() {
        const style = this.contentEl.createEl('style');
        style.textContent = `
            .goals-review-modal {
                min-width: 600px;
                max-width: 800px;
                max-height: 80vh;
                overflow-y: auto;
            }

            .goals-overview-container {
                padding: 20px 0;
                display: flex;
                flex-direction: column;
                gap: 24px;
            }

            .goals-section {
                background: var(--background-secondary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 8px;
                padding: 16px;
                position: relative;
            }

            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
                padding-bottom: 8px;
                border-bottom: 1px solid var(--background-modifier-border);
            }

            .section-header h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: var(--text-normal);
            }

            .view-details-btn {
                background: var(--interactive-accent);
                color: var(--text-on-accent);
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .view-details-btn:hover {
                opacity: 0.9;
                transform: translateY(-1px);
            }

            .goals-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .goal-item {
                background: var(--background-primary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                padding: 12px;
                transition: all 0.2s ease;
            }

            .goal-item:hover {
                border-color: var(--interactive-accent);
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            .goal-progress-bar {
                width: 100%;
                height: 6px;
                background: var(--background-modifier-border);
                border-radius: 3px;
                margin-bottom: 8px;
                overflow: hidden;
            }

            .progress-fill {
                height: 100%;
                border-radius: 3px;
                transition: width 0.3s ease;
            }

            .progress-excellent { background: var(--color-green); }
            .progress-good { background: var(--color-blue); }
            .progress-fair { background: var(--color-orange); }
            .progress-poor { background: var(--color-red); }

            .goal-title-row {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 4px;
            }

            .goal-status {
                font-size: 14px;
            }

            .goal-title {
                flex: 1;
                font-size: 14px;
                font-weight: 500;
                color: var(--text-normal);
            }

            .goal-title.completed {
                text-decoration: line-through;
                color: var(--text-muted);
            }

            .goal-progress-text {
                font-size: 12px;
                font-weight: 600;
                color: var(--text-muted);
            }

            .goal-description {
                font-size: 12px;
                color: var(--text-muted);
                line-height: 1.4;
                margin-top: 4px;
                padding-left: 22px;
            }

            .create-goals-btn {
                width: 100%;
                padding: 12px;
                border: 2px dashed var(--background-modifier-border);
                border-radius: 6px;
                background: var(--background-primary);
                color: var(--text-muted);
                font-size: 13px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .create-goals-btn:hover {
                border-color: var(--interactive-accent);
                color: var(--text-normal);
                border-style: solid;
            }

            .create-goals-btn.primary {
                background: var(--interactive-accent);
                color: var(--text-on-accent);
                border: none;
            }

            .empty-goals-message {
                text-align: center;
                color: var(--text-muted);
                font-size: 13px;
                padding: 20px 0;
            }

            .error-message {
                color: var(--color-red);
                font-size: 13px;
                text-align: center;
                padding: 12px;
                background: var(--background-modifier-error);
                border-radius: 4px;
            }

            .modal-button-group {
                display: flex;
                justify-content: center;
                gap: 12px;
                padding-top: 20px;
                border-top: 1px solid var(--background-modifier-border);
            }

            .action-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .action-btn.primary {
                background: var(--interactive-accent);
                color: var(--text-on-accent);
            }

            .action-btn.secondary {
                background: var(--background-secondary);
                color: var(--text-normal);
                border: 1px solid var(--background-modifier-border);
            }

            .action-btn:hover {
                opacity: 0.9;
                transform: translateY(-1px);
            }

            .quick-creation-menu {
                position: absolute;
                top: 100%;
                left: 50%;
                transform: translateX(-50%);
                background: var(--background-primary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 8px;
                padding: 16px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.1);
                z-index: 1000;
                min-width: 200px;
            }

            .quick-creation-menu h4 {
                margin: 0 0 12px 0;
                font-size: 14px;
                text-align: center;
                color: var(--text-normal);
            }

            .quick-options {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .quick-option {
                background: var(--background-secondary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                padding: 8px 12px;
                color: var(--text-normal);
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: left;
            }

            .quick-option:hover {
                background: var(--background-modifier-hover);
                border-color: var(--interactive-accent);
            }

            @media (max-width: 600px) {
                .goals-review-modal {
                    min-width: 95vw;
                    max-height: 90vh;
                }

                .section-header {
                    flex-direction: column;
                    gap: 8px;
                    align-items: flex-start;
                }

                .view-details-btn {
                    width: 100%;
                }

                .modal-button-group {
                    flex-direction: column;
                }

                .action-btn {
                    width: 100%;
                }
            }
        `;
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

// 数据仪表盘模态框
class DashboardModal extends Modal {
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
        this.dashboardData = {};
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('dashboard-modal');

        contentEl.createEl('h2', { text: '📊 LifeOS 数据仪表盘' });

        // 显示加载状态
        const loadingDiv = contentEl.createDiv('dashboard-loading');
        loadingDiv.innerHTML = '<div class="loading-spinner">🔄</div><p>正在加载数据统计...</p>';

        this.loadDashboardData().then(() => {
            loadingDiv.remove();
            this.renderDashboard();
        }).catch(error => {
            loadingDiv.innerHTML = '<div class="error-message">❌ 数据加载失败</div>';
            console.error('Dashboard data loading failed:', error);
        });

        this.addDashboardStyles();
    }

    async loadDashboardData() {
        const currentDate = this.plugin.getCurrentDate();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;

        // 基础统计
        this.dashboardData.basicStats = await this.calculateBasicStats(currentYear);

        // 周期笔记统计
        this.dashboardData.periodicStats = await this.calculatePeriodicStats(currentYear);

        // 任务统计
        this.dashboardData.taskStats = await this.calculateTaskStats();

        // PARA结构统计
        this.dashboardData.paraStats = await this.calculatePARAStats();

        // 目标进度统计
        this.dashboardData.goalStats = await this.calculateGoalStats(currentYear);

        // 趋势数据
        this.dashboardData.trendData = await this.calculateTrendData(currentYear);
    }

    async calculateBasicStats(year) {
        const stats = {
            totalFiles: 0,
            totalWords: 0,
            createdThisMonth: 0,
            createdToday: 0,
            lastActiveDate: null
        };

        const allFiles = this.app.vault.getMarkdownFiles();
        const today = this.plugin.getCurrentDate().toISOString().split('T')[0];
        const thisMonth = `${year}-${(this.plugin.getCurrentDate().getMonth() + 1).toString().padStart(2, '0')}`;

        for (const file of allFiles) {
            stats.totalFiles++;

            // 计算字数
            try {
                const content = await this.app.vault.read(file);
                stats.totalWords += content.length;
            } catch (error) {
                console.error('Error reading file:', file.path);
            }

            // 创建日期统计
            const fileDate = new Date(file.stat.ctime).toISOString().split('T')[0];
            if (fileDate === today) {
                stats.createdToday++;
            }
            if (fileDate.startsWith(thisMonth)) {
                stats.createdThisMonth++;
            }

            // 最后活跃日期
            const modifiedDate = new Date(file.stat.mtime);
            if (!stats.lastActiveDate || modifiedDate > stats.lastActiveDate) {
                stats.lastActiveDate = modifiedDate;
            }
        }

        return stats;
    }

    async calculatePeriodicStats(year) {
        const stats = {
            dailyCount: 0,
            weeklyCount: 0,
            monthlyCount: 0,
            yearlyCount: 0,
            streakDays: 0,
            averageLength: 0
        };

        const periodicFiles = this.app.vault.getMarkdownFiles()
            .filter(file => file.path.startsWith('1-周期笔记/'));

        let totalLength = 0;
        const diaryDates = [];

        for (const file of periodicFiles) {
            if (file.path.includes('/日记/')) {
                stats.dailyCount++;
                const dateMatch = file.name.match(/(\d{4}-\d{2}-\d{2})/);
                if (dateMatch) {
                    diaryDates.push(dateMatch[1]);
                }
            } else if (file.path.includes('/周记/')) {
                stats.weeklyCount++;
            } else if (file.path.includes('/月记/')) {
                stats.monthlyCount++;
            } else if (file.path.includes('/年终总结/')) {
                stats.yearlyCount++;
            }

            try {
                const content = await this.app.vault.read(file);
                totalLength += content.length;
            } catch (error) {
                console.error('Error reading periodic file:', file.path);
            }
        }

        if (periodicFiles.length > 0) {
            stats.averageLength = Math.round(totalLength / periodicFiles.length);
        }

        // 计算连续天数
        stats.streakDays = this.calculateStreakDays(diaryDates);

        return stats;
    }

    calculateStreakDays(diaryDates) {
        if (diaryDates.length === 0) return 0;

        const sortedDates = diaryDates.sort().reverse();
        const today = this.plugin.getCurrentDate().toISOString().split('T')[0];

        let streak = 0;
        let currentDate = new Date(today);

        for (let i = 0; i < sortedDates.length; i++) {
            const dateStr = currentDate.toISOString().split('T')[0];

            if (sortedDates.includes(dateStr)) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    }

    async calculateTaskStats() {
        const stats = {
            totalTasks: 0,
            completedTasks: 0,
            pendingTasks: 0,
            inProgressTasks: 0,
            highPriorityTasks: 0,
            overdueTaskIds: []
        };

        // 获取任务数据
        const year = this.plugin.getCurrentDate().getFullYear();
        const taskStorePath = `1-周期笔记/${year}/任务数据.json`;
        const taskFile = this.app.vault.getAbstractFileByPath(taskStorePath);

        if (taskFile) {
            try {
                const content = await this.app.vault.read(taskFile);
                const data = JSON.parse(content);

                Object.values(data).forEach(dayTasks => {
                    if (Array.isArray(dayTasks)) {
                        dayTasks.forEach(task => {
                            stats.totalTasks++;

                            if (task.completed) {
                                stats.completedTasks++;
                            } else if (task.status === 'in_progress') {
                                stats.inProgressTasks++;
                            } else {
                                stats.pendingTasks++;
                            }

                            if (task.priority === 'high') {
                                stats.highPriorityTasks++;
                            }
                        });
                    }
                });
            } catch (error) {
                console.error('Error reading task data:', error);
            }
        }

        return stats;
    }

    async calculatePARAStats() {
        const stats = {
            projects: 0,
            areas: 0,
            resources: 0,
            archived: 0,
            totalPARAFiles: 0
        };

        const allFiles = this.app.vault.getMarkdownFiles();

        allFiles.forEach(file => {
            if (file.path.startsWith('2-项目/')) {
                stats.projects++;
                stats.totalPARAFiles++;
            } else if (file.path.startsWith('3-领域/')) {
                stats.areas++;
                stats.totalPARAFiles++;
            } else if (file.path.startsWith('4-资源/')) {
                stats.resources++;
                stats.totalPARAFiles++;
            } else if (file.path.startsWith('5-归档/')) {
                stats.archived++;
                stats.totalPARAFiles++;
            }
        });

        return stats;
    }

    async calculateGoalStats(year) {
        const stats = {
            yearlyGoalsCount: 0,
            quarterlyGoalsCount: 0,
            monthlyGoalsCount: 0,
            completedGoals: 0,
            totalGoalProgress: 0,
            avgProgress: 0
        };

        // 检查目标文件
        const goalFiles = this.app.vault.getMarkdownFiles()
            .filter(file => file.path.includes('目标') && file.path.includes(year.toString()));

        let totalProgress = 0;
        let goalCount = 0;

        for (const file of goalFiles) {
            try {
                const content = await this.app.vault.read(file);
                const goals = this.extractGoalsFromContent(content);

                if (file.name.includes('年度目标')) {
                    stats.yearlyGoalsCount += goals.length;
                } else if (file.name.includes('季度目标')) {
                    stats.quarterlyGoalsCount += goals.length;
                } else if (file.name.includes('月目标')) {
                    stats.monthlyGoalsCount += goals.length;
                }

                goals.forEach(goal => {
                    goalCount++;
                    totalProgress += goal.progress || 0;
                    if (goal.completed) {
                        stats.completedGoals++;
                    }
                });
            } catch (error) {
                console.error('Error reading goal file:', file.path);
            }
        }

        if (goalCount > 0) {
            stats.avgProgress = Math.round(totalProgress / goalCount);
        }
        stats.totalGoalProgress = totalProgress;

        return stats;
    }

    extractGoalsFromContent(content) {
        // 复用GoalsReviewModal中的方法
        const goals = [];
        const lines = content.split('\n');

        let currentGoal = null;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            const goalMatch = line.match(/^(\d+\.\s*\*\*|###\s*)(.*?)(\*\*)?$/);
            if (goalMatch) {
                if (currentGoal) {
                    goals.push(currentGoal);
                }
                currentGoal = {
                    title: goalMatch[2].replace(/\*\*/g, '').trim(),
                    completed: false,
                    progress: 0,
                    description: ''
                };
            }

            if (currentGoal && line.includes('- [x]')) {
                currentGoal.completed = true;
                currentGoal.progress = 100;
            }

            if (currentGoal && line.includes('- [x]')) {
                currentGoal.completedItems = (currentGoal.completedItems || 0) + 1;
            }
            if (currentGoal && (line.includes('- [x]') || line.includes('- [ ]'))) {
                currentGoal.totalItems = (currentGoal.totalItems || 0) + 1;
            }
        }

        if (currentGoal) {
            goals.push(currentGoal);
        }

        goals.forEach(goal => {
            if (goal.totalItems > 0) {
                goal.progress = Math.round(((goal.completedItems || 0) / goal.totalItems) * 100);
            }
        });

        return goals;
    }

    async calculateTrendData(year) {
        const trends = {
            monthlyActivity: new Array(12).fill(0),
            weeklyTaskCompletion: [],
            contentGrowth: []
        };

        // 月度活跃度
        const allFiles = this.app.vault.getMarkdownFiles();
        allFiles.forEach(file => {
            const fileDate = new Date(file.stat.ctime);
            if (fileDate.getFullYear() === year) {
                const month = fileDate.getMonth();
                trends.monthlyActivity[month]++;
            }
        });

        // 内容增长趋势
        let cumulativeFiles = 0;
        for (let i = 0; i < 12; i++) {
            cumulativeFiles += trends.monthlyActivity[i];
            trends.contentGrowth.push(cumulativeFiles);
        }

        return trends;
    }

    renderDashboard() {
        const container = this.contentEl.createDiv('dashboard-container');

        // 顶部概览卡片
        this.renderOverviewCards(container);

        // 图表区域
        this.renderChartsSection(container);

        // 详细统计
        this.renderDetailedStats(container);

        // 快速操作
        this.renderQuickActions(container);
    }

    renderOverviewCards(container) {
        const overviewSection = container.createDiv('overview-section');
        overviewSection.createEl('h3', { text: '📊 数据概览' });

        const cardsContainer = overviewSection.createDiv('overview-cards');

        // 基础统计卡片
        const basicCard = cardsContainer.createDiv('stat-card primary');
        basicCard.innerHTML = `
            <div class="stat-icon">📁</div>
            <div class="stat-content">
                <div class="stat-number">${this.dashboardData.basicStats.totalFiles}</div>
                <div class="stat-label">总文件数</div>
                <div class="stat-detail">${(this.dashboardData.basicStats.totalWords / 1000).toFixed(1)}K 字符</div>
            </div>
        `;

        // 周期笔记卡片
        const periodicCard = cardsContainer.createDiv('stat-card secondary');
        periodicCard.innerHTML = `
            <div class="stat-icon">📅</div>
            <div class="stat-content">
                <div class="stat-number">${this.dashboardData.periodicStats.dailyCount}</div>
                <div class="stat-label">日记数量</div>
                <div class="stat-detail">${this.dashboardData.periodicStats.streakDays} 天连续</div>
            </div>
        `;

        // 任务统计卡片
        const taskCard = cardsContainer.createDiv('stat-card success');
        const completionRate = this.dashboardData.taskStats.totalTasks > 0
            ? Math.round((this.dashboardData.taskStats.completedTasks / this.dashboardData.taskStats.totalTasks) * 100)
            : 0;
        taskCard.innerHTML = `
            <div class="stat-icon">✅</div>
            <div class="stat-content">
                <div class="stat-number">${completionRate}%</div>
                <div class="stat-label">任务完成率</div>
                <div class="stat-detail">${this.dashboardData.taskStats.completedTasks}/${this.dashboardData.taskStats.totalTasks}</div>
            </div>
        `;

        // 目标进度卡片
        const goalCard = cardsContainer.createDiv('stat-card warning');
        goalCard.innerHTML = `
            <div class="stat-icon">🎯</div>
            <div class="stat-content">
                <div class="stat-number">${this.dashboardData.goalStats.avgProgress}%</div>
                <div class="stat-label">平均目标进度</div>
                <div class="stat-detail">${this.dashboardData.goalStats.completedGoals} 已完成</div>
            </div>
        `;
    }

    renderChartsSection(container) {
        const chartsSection = container.createDiv('charts-section');
        chartsSection.createEl('h3', { text: '📈 趋势分析' });

        const chartsGrid = chartsSection.createDiv('charts-grid');

        // 月度活跃度图表
        const activityChart = chartsGrid.createDiv('chart-container');
        activityChart.innerHTML = `
            <h4>月度创建文件数</h4>
            <div class="chart-content">
                ${this.renderBarChart(this.dashboardData.trendData.monthlyActivity)}
            </div>
        `;

        // PARA分布图表
        const paraChart = chartsGrid.createDiv('chart-container');
        const paraData = [
            this.dashboardData.paraStats.projects,
            this.dashboardData.paraStats.areas,
            this.dashboardData.paraStats.resources,
            this.dashboardData.paraStats.archived
        ];
        paraChart.innerHTML = `
            <h4>PARA 文件分布</h4>
            <div class="chart-content para-distribution">
                <div class="para-item">
                    <span class="para-color projects"></span>
                    <span class="para-label">项目: ${paraData[0]}</span>
                </div>
                <div class="para-item">
                    <span class="para-color areas"></span>
                    <span class="para-label">领域: ${paraData[1]}</span>
                </div>
                <div class="para-item">
                    <span class="para-color resources"></span>
                    <span class="para-label">资源: ${paraData[2]}</span>
                </div>
                <div class="para-item">
                    <span class="para-color archived"></span>
                    <span class="para-label">归档: ${paraData[3]}</span>
                </div>
            </div>
        `;
    }

    renderBarChart(data) {
        const maxValue = Math.max(...data, 1);
        const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

        let chartHTML = '<div class="bar-chart">';
        data.forEach((value, index) => {
            const height = (value / maxValue) * 100;
            chartHTML += `
                <div class="bar-item">
                    <div class="bar" style="height: ${height}%" title="${months[index]}: ${value}"></div>
                    <div class="bar-label">${months[index]}</div>
                </div>
            `;
        });
        chartHTML += '</div>';

        return chartHTML;
    }

    renderDetailedStats(container) {
        const detailsSection = container.createDiv('details-section');
        detailsSection.createEl('h3', { text: '📋 详细统计' });

        const detailsGrid = detailsSection.createDiv('details-grid');

        // 周期笔记详情
        const periodicDetails = detailsGrid.createDiv('detail-card');
        periodicDetails.innerHTML = `
            <h4>📅 周期笔记</h4>
            <div class="detail-list">
                <div class="detail-item">
                    <span class="detail-label">日记</span>
                    <span class="detail-value">${this.dashboardData.periodicStats.dailyCount}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">周记</span>
                    <span class="detail-value">${this.dashboardData.periodicStats.weeklyCount}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">月记</span>
                    <span class="detail-value">${this.dashboardData.periodicStats.monthlyCount}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">年记</span>
                    <span class="detail-value">${this.dashboardData.periodicStats.yearlyCount}</span>
                </div>
                <div class="detail-item highlight">
                    <span class="detail-label">平均长度</span>
                    <span class="detail-value">${this.dashboardData.periodicStats.averageLength} 字符</span>
                </div>
            </div>
        `;

        // 任务详情
        const taskDetails = detailsGrid.createDiv('detail-card');
        taskDetails.innerHTML = `
            <h4>✅ 任务管理</h4>
            <div class="detail-list">
                <div class="detail-item">
                    <span class="detail-label">总任务</span>
                    <span class="detail-value">${this.dashboardData.taskStats.totalTasks}</span>
                </div>
                <div class="detail-item success">
                    <span class="detail-label">已完成</span>
                    <span class="detail-value">${this.dashboardData.taskStats.completedTasks}</span>
                </div>
                <div class="detail-item warning">
                    <span class="detail-label">进行中</span>
                    <span class="detail-value">${this.dashboardData.taskStats.inProgressTasks}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">待办</span>
                    <span class="detail-value">${this.dashboardData.taskStats.pendingTasks}</span>
                </div>
                <div class="detail-item priority">
                    <span class="detail-label">高优先级</span>
                    <span class="detail-value">${this.dashboardData.taskStats.highPriorityTasks}</span>
                </div>
            </div>
        `;

        // 目标详情
        const goalDetails = detailsGrid.createDiv('detail-card');
        goalDetails.innerHTML = `
            <h4>🎯 目标管理</h4>
            <div class="detail-list">
                <div class="detail-item">
                    <span class="detail-label">年度目标</span>
                    <span class="detail-value">${this.dashboardData.goalStats.yearlyGoalsCount}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">季度目标</span>
                    <span class="detail-value">${this.dashboardData.goalStats.quarterlyGoalsCount}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">月度目标</span>
                    <span class="detail-value">${this.dashboardData.goalStats.monthlyGoalsCount}</span>
                </div>
                <div class="detail-item success">
                    <span class="detail-label">已完成目标</span>
                    <span class="detail-value">${this.dashboardData.goalStats.completedGoals}</span>
                </div>
                <div class="detail-item highlight">
                    <span class="detail-label">平均进度</span>
                    <span class="detail-value">${this.dashboardData.goalStats.avgProgress}%</span>
                </div>
            </div>
        `;
    }

    renderQuickActions(container) {
        const actionsSection = container.createDiv('actions-section');
        actionsSection.createEl('h3', { text: '⚡ 快速操作' });

        const actionsGrid = actionsSection.createDiv('actions-grid');

        const actions = [
            {
                icon: '📅',
                title: '创建今日日记',
                description: '快速创建今天的日记',
                action: () => {
                    this.close();
                    this.plugin.createDailyDiary();
                }
            },
            {
                icon: '📋',
                title: '看板视图',
                description: '查看周任务看板',
                action: () => {
                    this.close();
                    // 打开日历并切换到看板模式的逻辑
                    this.plugin.openSidebarCalendarView();
                }
            },
            {
                icon: '🎯',
                title: '目标回顾',
                description: '查看和更新目标进度',
                action: () => {
                    this.close();
                    this.plugin.showGoalsReview();
                }
            },
            {
                icon: '📊',
                title: '日记统计',
                description: '查看详细的写作统计',
                action: () => {
                    this.close();
                    this.plugin.showDiaryStats();
                }
            }
        ];

        actions.forEach(action => {
            const actionCard = actionsGrid.createDiv('action-card');
            actionCard.innerHTML = `
                <div class="action-icon">${action.icon}</div>
                <div class="action-content">
                    <div class="action-title">${action.title}</div>
                    <div class="action-description">${action.description}</div>
                </div>
            `;
            actionCard.onclick = action.action;
        });

        // 关闭按钮
        const closeSection = actionsSection.createDiv('close-section');
        const closeBtn = closeSection.createEl('button', {
            text: '关闭仪表盘',
            cls: 'close-dashboard-btn'
        });
        closeBtn.onclick = () => this.close();
    }

    addDashboardStyles() {
        const style = this.contentEl.createEl('style');
        style.textContent = `
            .dashboard-modal {
                min-width: 900px;
                max-width: 1200px;
                max-height: 90vh;
                overflow-y: auto;
            }

            .dashboard-loading {
                text-align: center;
                padding: 40px 20px;
            }

            .loading-spinner {
                font-size: 24px;
                margin-bottom: 10px;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            .dashboard-container {
                padding: 20px 0;
                display: flex;
                flex-direction: column;
                gap: 24px;
            }

            /* 概览卡片 */
            .overview-section h3 {
                margin: 0 0 16px 0;
                color: var(--text-normal);
                font-size: 18px;
            }

            .overview-cards {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
                margin-bottom: 20px;
            }

            .stat-card {
                background: var(--background-secondary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 8px;
                padding: 16px;
                display: flex;
                align-items: center;
                gap: 12px;
                transition: all 0.2s ease;
                position: relative;
                overflow: hidden;
            }

            .stat-card:hover {
                border-color: var(--interactive-accent);
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                transform: translateY(-1px);
            }

            .stat-card.primary { border-left: 4px solid var(--color-blue); }
            .stat-card.secondary { border-left: 4px solid var(--color-green); }
            .stat-card.success { border-left: 4px solid var(--color-green); }
            .stat-card.warning { border-left: 4px solid var(--color-orange); }

            .stat-icon {
                font-size: 24px;
                opacity: 0.8;
            }

            .stat-content {
                flex: 1;
            }

            .stat-number {
                font-size: 24px;
                font-weight: 700;
                color: var(--text-normal);
                line-height: 1.2;
            }

            .stat-label {
                font-size: 12px;
                color: var(--text-muted);
                font-weight: 500;
                margin-bottom: 2px;
            }

            .stat-detail {
                font-size: 11px;
                color: var(--text-faint);
            }

            /* 图表区域 */
            .charts-section h3 {
                margin: 0 0 16px 0;
                color: var(--text-normal);
                font-size: 18px;
            }

            .charts-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
            }

            .chart-container {
                background: var(--background-secondary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 8px;
                padding: 16px;
            }

            .chart-container h4 {
                margin: 0 0 12px 0;
                font-size: 14px;
                color: var(--text-normal);
                font-weight: 600;
            }

            .bar-chart {
                display: flex;
                align-items: end;
                gap: 4px;
                height: 120px;
                padding: 0 8px;
            }

            .bar-item {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                height: 100%;
            }

            .bar {
                background: var(--interactive-accent);
                width: 100%;
                min-height: 2px;
                border-radius: 2px 2px 0 0;
                transition: all 0.2s ease;
                margin-bottom: 4px;
            }

            .bar:hover {
                background: var(--color-green);
            }

            .bar-label {
                font-size: 9px;
                color: var(--text-muted);
                writing-mode: vertical-rl;
                text-orientation: mixed;
                height: 40px;
                display: flex;
                align-items: center;
            }

            .para-distribution {
                padding: 16px 0;
            }

            .para-item {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
                font-size: 13px;
            }

            .para-color {
                width: 12px;
                height: 12px;
                border-radius: 2px;
            }

            .para-color.projects { background: var(--color-blue); }
            .para-color.areas { background: var(--color-green); }
            .para-color.resources { background: var(--color-orange); }
            .para-color.archived { background: var(--text-muted); }

            .para-label {
                color: var(--text-normal);
                font-weight: 500;
            }

            /* 详细统计 */
            .details-section h3 {
                margin: 0 0 16px 0;
                color: var(--text-normal);
                font-size: 18px;
            }

            .details-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 16px;
                margin-bottom: 20px;
            }

            .detail-card {
                background: var(--background-secondary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 8px;
                padding: 16px;
            }

            .detail-card h4 {
                margin: 0 0 12px 0;
                font-size: 14px;
                color: var(--text-normal);
                font-weight: 600;
            }

            .detail-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .detail-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 4px 0;
                border-bottom: 1px solid var(--background-modifier-border);
            }

            .detail-item:last-child {
                border-bottom: none;
            }

            .detail-label {
                font-size: 13px;
                color: var(--text-muted);
            }

            .detail-value {
                font-size: 13px;
                font-weight: 600;
                color: var(--text-normal);
            }

            .detail-item.success .detail-value { color: var(--color-green); }
            .detail-item.warning .detail-value { color: var(--color-orange); }
            .detail-item.priority .detail-value { color: var(--color-red); }
            .detail-item.highlight .detail-value { color: var(--interactive-accent); }

            /* 快速操作 */
            .actions-section h3 {
                margin: 0 0 16px 0;
                color: var(--text-normal);
                font-size: 18px;
            }

            .actions-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 12px;
                margin-bottom: 20px;
            }

            .action-card {
                background: var(--background-primary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                padding: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .action-card:hover {
                border-color: var(--interactive-accent);
                background: var(--background-modifier-hover);
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            .action-icon {
                font-size: 20px;
                opacity: 0.8;
            }

            .action-content {
                flex: 1;
            }

            .action-title {
                font-size: 13px;
                font-weight: 600;
                color: var(--text-normal);
                margin-bottom: 2px;
            }

            .action-description {
                font-size: 11px;
                color: var(--text-muted);
                line-height: 1.3;
            }

            .close-section {
                text-align: center;
                padding-top: 16px;
                border-top: 1px solid var(--background-modifier-border);
            }

            .close-dashboard-btn {
                background: var(--background-secondary);
                color: var(--text-normal);
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                padding: 8px 16px;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .close-dashboard-btn:hover {
                background: var(--background-modifier-hover);
                border-color: var(--interactive-accent);
            }

            /* 响应式设计 */
            @media (max-width: 900px) {
                .dashboard-modal {
                    min-width: 95vw;
                    max-width: 95vw;
                }

                .overview-cards {
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                }

                .charts-grid {
                    grid-template-columns: 1fr;
                }

                .details-grid {
                    grid-template-columns: 1fr;
                }

                .actions-grid {
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                }
            }

            @media (max-width: 600px) {
                .overview-cards {
                    grid-template-columns: 1fr 1fr;
                }

                .action-card {
                    flex-direction: column;
                    text-align: center;
                    gap: 8px;
                }

                .actions-grid {
                    grid-template-columns: 1fr 1fr;
                }
            }
        `;
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

module.exports = LifeOSPARACore;