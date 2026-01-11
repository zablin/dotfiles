const { Plugin, Notice, Modal, Setting, TFile, moment } = require('obsidian');

class LifeOSPARACore extends Plugin {

    constructor() {
        super(...arguments);

        // 简化的PARA文件夹结构
        this.paraStructure = {
            projects: { folder: '项目', icon: '📋' },
            areas: { folder: '领域', icon: '🏠' },
            resources: { folder: '资源', icon: '📚' },
            archive: { folder: '归档', icon: '📦' },
            diary: { folder: '日记', icon: '📅' }
        };

        // 日记模板
        this.diaryTemplate = `# {{date}} {{weekday}}

## 🎯 今日重点
1.
2.
3.

## ✅ 完成事项
- [x]
- [x]

## 📝 今日记录
### 工作
-

### 生活
-

### 学习
-

## 💭 思考感悟
-

## 🔗 相关链接
-

## 明日计划
- [ ]
- [ ]

---
#日记 #{{dateTag}}`;

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
    }

    async onload() {
        console.log('LifeOS PARA Core with Diary System loading...');

        // 自动初始化PARA结构
        await this.initializePARAStructure();

        // 注册命令
        this.registerCommands();

        // 添加状态栏
        this.addStatusBarItem().setText('PARA ✓');

        new Notice('LifeOS PARA Core 已就绪 📋');
    }

    async initializePARAStructure() {
        try {
            let foldersCreated = 0;

            // 创建PARA文件夹
            for (const [key, config] of Object.entries(this.paraStructure)) {
                const folder = config.folder;

                if (!this.app.vault.getAbstractFileByPath(folder)) {
                    await this.app.vault.createFolder(folder);
                    console.log(`Created: ${folder}`);
                    foldersCreated++;
                }
            }

            if (foldersCreated > 0) {
                new Notice(`PARA结构创建完成！新建了 ${foldersCreated} 个文件夹`);
            }

        } catch (error) {
            console.error('Error initializing PARA structure:', error);
            new Notice('PARA结构初始化失败，请查看控制台');
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

        // 重新初始化
        this.addCommand({
            id: 'reinit-para',
            name: '🔄 重新初始化PARA结构',
            callback: () => this.initializePARAStructure()
        });
    }

    async createProject() {
        const title = await this.promptForInput('请输入项目名称：');
        if (!title) return;

        const fileName = `项目/${title}.md`;
        const currentDate = new Date().toISOString().split('T')[0];
        const tag = title.replace(/\s+/g, '');

        const content = this.projectTemplate
            .replace(/{{title}}/g, title)
            .replace(/{{date}}/g, currentDate)
            .replace(/{{tag}}/g, tag);

        try {
            const file = await this.app.vault.create(fileName, content);
            await this.app.workspace.getLeaf().openFile(file);
            new Notice(`项目 "${title}" 创建成功 📋`);
        } catch (error) {
            new Notice(`创建项目失败: ${error.message}`);
        }
    }

    async createArea() {
        const title = await this.promptForInput('请输入领域名称：');
        if (!title) return;

        const fileName = `领域/${title}.md`;
        const tag = title.replace(/\s+/g, '');

        const content = this.areaTemplate
            .replace(/{{title}}/g, title)
            .replace(/{{tag}}/g, tag);

        try {
            const file = await this.app.vault.create(fileName, content);
            await this.app.workspace.getLeaf().openFile(file);
            new Notice(`领域 "${title}" 创建成功 🏠`);
        } catch (error) {
            new Notice(`创建领域失败: ${error.message}`);
        }
    }

    async createResource() {
        const title = await this.promptForInput('请输入资源标题：');
        if (!title) return;

        const fileName = `资源/${title}.md`;
        const currentDate = new Date().toISOString().split('T')[0];
        const tag = title.replace(/\s+/g, '');

        const content = this.resourceTemplate
            .replace(/{{title}}/g, title)
            .replace(/{{date}}/g, currentDate)
            .replace(/{{tag}}/g, tag);

        try {
            const file = await this.app.vault.create(fileName, content);
            await this.app.workspace.getLeaf().openFile(file);
            new Notice(`资源 "${title}" 创建成功 📚`);
        } catch (error) {
            new Notice(`创建资源失败: ${error.message}`);
        }
    }

    async createDailyDiary() {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        const weekday = '星期' + weekdays[today.getDay()];
        const fileName = `日记/${dateStr}.md`;

        // 检查是否已存在
        const existingFile = this.app.vault.getAbstractFileByPath(fileName);
        if (existingFile) {
            await this.app.workspace.getLeaf().openFile(existingFile);
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
            await this.app.workspace.getLeaf().openFile(file);
            new Notice('今日日记创建成功 📅');
        } catch (error) {
            new Notice(`创建今日日记失败: ${error.message}`);
        }
    }

    async searchDiary() {
        const modal = new DiarySearchModal(this.app, this);
        modal.open();
    }

    async showDiaryStats() {
        const diaryFiles = this.app.vault.getMarkdownFiles()
            .filter(file => file.path.startsWith('日记/'));

        const stats = {
            total: diaryFiles.length,
            thisMonth: 0,
            thisYear: 0,
            totalWords: 0
        };

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        for (const file of diaryFiles) {
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

    async promptForInput(message) {
        return new Promise((resolve) => {
            const modal = new InputModal(this.app, message, resolve);
            modal.open();
        });
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
            .filter(file => file.path.startsWith('日记/'));

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

module.exports = LifeOSPARACore;