# 游戏统一后台

萌兵军棋、干瞪眼、魂斗罗2026 和大闹天宫联机服务运行在同一个 Node.js 进程、同一个端口，统一部署到腾讯云。其他游戏是静态页面，无需后台。

| 路径 | 服务 |
| --- | --- |
| `/healthz` | 统一健康检查与各游戏状态 |
| `/games/junqi/ws` | 军棋 WebSocket；兼容原 `/ws` |
| `/games/gandengyan/socket.io` | 干瞪眼 Socket.IO，支持 WebSocket 与轮询 |
| `/games/contra2026/ws` | 魂斗罗2026 双人房间、按键与画面快照同步 |
| `/games/wukong/ws` | 大闹天宫独立双人房间、天宫首章按键与画面同步 |

魂斗罗2026 的房间保存在内存中，不使用账号或持久化存档。更新后台后，Nginx 还需应用 `backend/deploy/nginx-locations.conf` 中的 `/games/contra2026/ws` 配置。前端调用 `backend-config.js` 中的 `contraPath`，本地预览使用当前服务地址。运行方法和联机范围见 [魂斗罗说明](../games/contra2026/README.md)。

大闹天宫复用相同联机协议，但通过独立 WebSocket 路径隔离房间，不能与魂斗罗互相加入。`backend-config.js` 的 `wukongPath` 和 Nginx 的 `/games/wukong/ws` 需随后台一起更新；当前只开放第一章。共享引擎和样式从 `/games/shared/` 提供。

两款游戏保留原来的账号、对局和计分逻辑，各自存档。此次统一的是运行与部署服务；账号体系尚未合并。

当前生产后台为 `https://api.tangletang.top`，健康检查为 `/games-backend/healthz`。腾讯云实例使用独立 Node.js 22 运行时、systemd 服务 `tangtang-games` 和现有 Nginx HTTPS 入口；前端继续由合集站点提供。

## 本地运行

在仓库根目录使用 Node.js 22 或更高版本：

```sh
npm ci
npm start
# http://localhost:3000 同时提供合集首页和两款游戏后台
npm test
```

`npm run preview` 也会挂载相同后台，并模拟 Vercel 路由。本地 HTTP 预览自动连接当前服务；生产 HTTPS 前端连接 `backend-config.js` 中配置的统一后台地址。

## 腾讯云部署

服务器需安装 Docker 和 Compose。为后台域名添加指向服务器的 A 记录，并在腾讯云安全组放行 TCP 80、443；3000 端口只在容器网络中使用。

在服务器上的仓库根目录执行：

```sh
cp backend/.env.example backend/.env
# 编辑 BACKEND_DOMAIN 与 GAMES_ALLOWED_ORIGINS 为真实域名
docker compose --env-file backend/.env up -d --build
docker compose --env-file backend/.env logs --tail=100 backend caddy
curl https://你的后台域名/healthz
```

Caddy 自动提供 HTTPS 和 WebSocket 反向代理。随后将前端 `backend-config.js` 的 `url` 设置为 `https://你的后台域名`，发布合集前端；军棋和干瞪眼会同时连接这个后台，无需分别配置。

也可直接访问后台域名使用完整合集，此时 `url` 留空。若直接访问后台域名，将该来源也加入 `GAMES_ALLOWED_ORIGINS`。

运行数据写入 Docker 命名卷 `game-data`：军棋为 `junqi/players.json`，干瞪眼为 `gandengyan/db.json`。更新镜像保留此卷，备份时备份整个卷。进程退出前刷新两款游戏的存档；服务重启会结束内存里的进行中对局。

## 服务器已有 Nginx 的部署方式

若 80/443 已由 Nginx 提供服务，可复用现有证书，只启动后台容器：

```sh
docker compose --env-file backend/.env -f compose.yaml -f backend/deploy/compose.nginx.yaml up -d --build backend
```

后台仅绑定 `127.0.0.1:3030`。将 `backend/deploy/nginx-locations.conf` 安装到 `/etc/nginx/snippets/games-backend.conf`，并在对应域名的 Nginx `server` 块中添加 `include /etc/nginx/snippets/games-backend.conf;`。先备份现有配置，再执行 `sudo nginx -t`，成功后执行 `sudo systemctl reload nginx`。

外部健康检查路径为 `/games-backend/healthz`，两款游戏的连接路径与上表一致。这些路径可以与域名下的现有应用共存。

## systemd 运行方式

也可使用独立的 Node.js 22 运行时和 `backend/deploy/tangtang-games.service`，无需更改服务器上其他应用使用的 Node.js。此模板约定：代码在 `/home/ubuntu/tangtang-games/app`，运行时为 `/home/ubuntu/tangtang-games/runtime/node/bin/node`，持久化数据在 `/home/ubuntu/tangtang-games/data`。如路径或用户不同，安装前修改模板。

```sh
# 在 app 目录，使用独立运行时安装依赖
PATH=/home/ubuntu/tangtang-games/runtime/node/bin:$PATH npm ci --omit=dev
sudo install -m 644 backend/deploy/tangtang-games.service /etc/systemd/system/tangtang-games.service
sudo systemctl daemon-reload
sudo systemctl enable --now tangtang-games
curl http://127.0.0.1:3030/healthz
```

对外访问仍使用上面的 Nginx 路径配置。更新时将 GitHub `main` 对应的后台源码同步到 app 目录，安装依赖后执行 `sudo systemctl restart tangtang-games`；数据目录保持不变。若使用 Git 检出，可直接拉取 `main`；若通过源码归档部署，保留 `app/REVISION` 记录部署的提交号。

## 已有数据迁移

首次上线前，若旧服务已有玩家数据，将 `games/junqi/data/players.json` 与 `games/gandengyan/data/db.json` 分别复制到统一数据目录对应路径。保留原文件，勿覆盖已经有玩家的新后台存档。

不用 Docker 时可设置 `GAMES_DATA_DIR` 指向固定目录，`PORT`、`HOST` 设置监听地址。生产环境仅运行一个后台实例；匹配房间在内存中，多个实例之间未做房间同步。
