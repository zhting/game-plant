# 后台服务

一个 Node.js 进程、一个端口，同时提供：
- 入口页、两款游戏的静态文件；
- 两款游戏的双人联机 WebSocket。

- Studio：创作工具界面 `/studio/`、API `/api/*`、项目试玩页 `/play/<项目>/`。

| 路径 | 服务 |
| --- | --- |
| `/` | 入口页（内置模板列表） |
| `/healthz` | 健康检查，返回各游戏的房间数和在线人数 |
| `/games/contra2026/` | 魂斗罗2026 |
| `/games/contra2026/ws` | 魂斗罗双人房间：按键和画面快照同步 |
| `/games/wukong/` | 大闹天宫 |
| `/games/wukong/ws` | 大闹天宫独立双人房间（和魂斗罗的房间互不相通） |
| `/studio/` | Studio 界面（需要先 `npm run studio:install && npm run studio:build`；Docker 镜像会自动构建） |
| `/api/*` | Studio API；设置了 `STUDIO_TOKEN` 时需要口令（`/api/projects/<id>/game.json`、`modules.json` 和 `files/...` 的 GET 除外，试玩页要用） |
| `/api/projects/<id>/modules.json` | 项目代码模块清单（`?rev=` 指定版本，默认最新），试玩页据此加载 `modules/*.mjs` |
| `/api/projects/<id>/files/<modules\|assets>/<文件名>` | 读取项目文件；PUT（原始内容，`x-message` 头写版本说明）/DELETE 需要口令。模块保存前会做静态检查和隔离加载检查，不通过返回 422 |
| `/play/<项目>/` | 用项目的 game.json 和代码模块运行游戏，`?rev=<版本>` 试玩历史版本；公开，可以直接发给测试的人 |

房间只保存在内存里，没有账号，也没有持久化存档；服务重启会结束正在进行的对局。只对外提供各游戏的 `assets/`、`css/`、`js/` 和 `index.html`，`design/`、`tools/` 等源码目录一律返回 404。

`backend-config.js` 默认让游戏连接**同源**后台。如果前端和后台分开部署，把其中的 `url` 改成后台的 HTTPS 地址。

## 本地运行

```sh
npm ci
npm run studio:install && npm run studio:build
GEMINI_API_KEY=你的key npm start   # http://localhost:3000/studio/
npm test
npm run studio:dev   # 改 Studio 界面时用：http://localhost:5173/studio/（代理到 3000）
```

项目数据在 `backend/data/projects/<id>/`（每个项目一个 git 仓库：`game.json`、`modules/`、`assets/`），AI 用量记在 `backend/data/ai-usage.json`。模型在 `backend/config/ai.json` 里配置，也可以用环境变量 `GEMINI_MODEL_AGENT` 等覆盖。

生图用 `models.image`（`quality: pro` 时用 `models.imagePro`），风格参考图和存储倍率在 `ai.json` 的 `image` 里配置（`styleRef` 是仓库内的图片路径）。

需要 **Node.js 24**：AI 写的代码模块在独立子进程里试玩（`sim/isolated.mjs`），用 `node --permission` 禁止写文件、开子进程和读环境变量，并有超时强杀。这是内测级别的隔离，不是对抗恶意代码的沙箱，Studio 口令只发给可信的人。

## 云服务器部署（Docker + Caddy）

服务器需要安装 Docker 和 Compose。给域名添加指向服务器的 A 记录，并在安全组放行 TCP 80 和 443。

```sh
cp backend/.env.example backend/.env
# 编辑 BACKEND_DOMAIN、GAMES_ALLOWED_ORIGINS、GEMINI_API_KEY、STUDIO_TOKEN
docker compose --env-file backend/.env up -d --build
docker compose --env-file backend/.env logs --tail=100 backend caddy
curl https://你的域名/healthz
```

Caddy 会自动申请 HTTPS 证书，并反向代理 WebSocket。镜像里不包含 `design/`、`tools/`、测试和 png 源图（运行时只加载 webp）。

内测期间如果需要限制访问，可以在 `backend/deploy/Caddyfile` 里加 `basic_auth`。

### 服务器已有 Nginx

只启动后台容器，让它监听 `127.0.0.1:3030`：

```sh
docker compose --env-file backend/.env -f compose.yaml -f backend/deploy/compose.nginx.yaml up -d --build backend
```

把 `backend/deploy/nginx-locations.conf` 引入对应域名的 `server` 块，执行 `sudo nginx -t` 检查通过后再 `sudo systemctl reload nginx`。

## systemd 运行方式

也可以不用 Docker，直接用 `backend/deploy/tangtang-games.service` 运行。安装前先按实际情况修改模板里的路径和用户：

```sh
npm ci --omit=dev
sudo install -m 644 backend/deploy/tangtang-games.service /etc/systemd/system/tangtang-games.service
sudo systemctl daemon-reload
sudo systemctl enable --now tangtang-games
curl http://127.0.0.1:3030/healthz
```

生产环境只运行一个实例，房间不会在多个实例之间同步。
