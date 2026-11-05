# 后台服务

一个 Node.js 进程、一个端口，同时提供：
- 入口页、两款游戏的静态文件；
- 两款游戏的双人联机 WebSocket。

以后 Studio 的 API 也会挂在这里。

| 路径 | 服务 |
| --- | --- |
| `/` | 入口页（内置模板列表） |
| `/healthz` | 健康检查，返回各游戏的房间数和在线人数 |
| `/games/contra2026/` | 魂斗罗2026 |
| `/games/contra2026/ws` | 魂斗罗双人房间：按键和画面快照同步 |
| `/games/wukong/` | 大闹天宫 |
| `/games/wukong/ws` | 大闹天宫独立双人房间（和魂斗罗的房间互不相通） |

房间只保存在内存里，没有账号，也没有持久化存档；服务重启会结束正在进行的对局。只对外提供各游戏的 `assets/`、`css/`、`js/` 和 `index.html`，`design/`、`tools/` 等源码目录一律返回 404。

`backend-config.js` 默认让游戏连接**同源**后台。如果前端和后台分开部署，把其中的 `url` 改成后台的 HTTPS 地址。

## 本地运行

```sh
npm ci
npm start      # http://localhost:3000
npm test
```

## 云服务器部署（Docker + Caddy）

服务器需要安装 Docker 和 Compose。给域名添加指向服务器的 A 记录，并在安全组放行 TCP 80 和 443。

```sh
cp backend/.env.example backend/.env
# 编辑 BACKEND_DOMAIN 与 GAMES_ALLOWED_ORIGINS
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
