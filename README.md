# B-Market 服务器管理平台

🚀 一个基于 Astro 框架构建的现代化服务器资源管理平台，采用简约扁平化设计风格。

## ✨ 功能特点

- 📊 **卡片式展示** - 清晰展示服务器信息
- 🏷️ **智能标签** - 快速识别服务器特点
- ⏰ **到期提醒** - 智能显示剩余天数和状态
- 💰 **价值管控** - 实时显示续费价格和剩余价值
- 🔗 **快捷链接** - 一键访问管理控制台
- 📱 **响应式设计** - 完美适配各种设备
- 🎨 **简约美观** - 现代扁平化UI设计

## 🛠️ 技术栈

### 前端
- **Astro** - 现代静态站点生成器
- **HTML5 + CSS3** - 响应式布局
- **JavaScript** - 交互逻辑

### 后端
- **Node.js** - 运行环境
- **Express** - Web框架
- **CORS** - 跨域支持

## 📦 项目结构

```
B-Market/
├── src/
│   ├── components/          # 组件目录
│   │   └── ServerCard.astro # 服务器卡片组件
│   └── pages/              # 页面目录
│       └── index.astro     # 主页
├── api/                    # 后端API
│   ├── servers.js          # API服务器
│   └── package.json        # 后端依赖
├── public/                 # 静态资源
├── package.json            # 前端依赖
└── README.md              # 项目说明
```

## 🚀 快速开始

### 前端启动

1. 安装依赖
```bash
npm install
```

2. 启动开发服务器
```bash
npm run dev
```

3. 访问应用
```
http://localhost:4321
```

### 后端启动

1. 进入API目录
```bash
cd api
```

2. 安装依赖
```bash
npm install
```

3. 启动API服务器
```bash
npm run dev
```

4. API访问地址
```
http://localhost:3001/api/servers
```

## 📊 数据格式

### 服务器数据结构

```javascript
{
  "id": 1,
  "merchant": "阿里云",              // 商家名称
  "renewalPrice": "￥299.00",        // 续费价格
  "transactionDate": "2024-01-15",   // 交易日期
  "expirationDate": "2025-01-15",    // 到期日期
  "remainingValue": "￥2,988.00",    // 剩余价值
  "tags": ["ECS", "华东1", "2核4G"],  // 特点标签
  "relatedLinks": [                  // 相关链接
    {
      "name": "控制台",
      "url": "https://ecs.console.aliyun.com"
    }
  ]
}
```

## 🎨 设计特色

### 卡片设计
- 圆角设计，现代感十足
- 悬停效果，提升用户体验
- 状态徽章，直观显示到期状态
- 信息分组，结构清晰

### 颜色系统
- **绿色** (`#10b981`) - 正常状态
- **橙色** (`#f59e0b`) - 警告状态  
- **红色** (`#ef4444`) - 紧急状态
- **蓝色** (`#3b82f6`) - 链接和重点

### 响应式布局
- 桌面端：多列网格布局
- 平板端：两列布局
- 手机端：单列布局

## 🔧 自定义配置

### 修改数据源
所有服务器数据通过后端API管理，可通过管理页面添加或修改服务器信息。

### 调整样式
组件样式在各自的 `.astro` 文件中定义，支持完全自定义。

### API扩展
后端API支持扩展，可添加更多接口满足业务需求。

## 📋 API接口

### 获取服务器列表
```
GET /api/servers
```

响应格式：
```json
{
  "success": true,
  "data": [...],
  "total": 5
}
```

### 获取单个服务器
```
GET /api/servers/:id
```

### 健康检查
```
GET /health
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来改进项目！

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🆘 支持

如有问题或建议，请通过以下方式联系：

- 提交 [Issue](../../issues)
- 发送邮件至项目维护者

---

**B-Market** - 让服务器管理更简单 🎯

```sh
npm create astro@latest -- --template minimal
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/minimal)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/minimal)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/withastro/astro?devcontainer_path=.devcontainer/minimal/devcontainer.json)

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
