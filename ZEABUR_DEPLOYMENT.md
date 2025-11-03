# Zeabur Deployment Guide

## 部署步驟 (Deployment Steps)

### 1. 準備 Zeabur 帳號
- 前往 [Zeabur](https://zeabur.com) 註冊或登入帳號
- 連接您的 GitHub/GitLab 帳號（如果使用 Git 部署）

### 2. 創建新專案
1. 在 Zeabur 控制台點擊 "Create Project"
2. 選擇部署方式：
   - **Git Repository**: 推薦，支持自動部署
   - **Deploy from template**: 快速部署

### 3. 配置環境變數 (Required Environment Variables)

在 Zeabur 專案設置中添加以下環境變數：

#### Supabase 配置
```
NEXT_PUBLIC_SUPABASE_URL=https://vzlkomvcotijjldlpfts.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6bGtvbXZjb3RpampsZGxwZnRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MzI1NzAsImV4cCI6MjA3NzIwODU3MH0.Og5-ifKKRIGosu0sue6PtuZVMiL8nqCL1l6FLN3TMnE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6bGtvbXZjb3RpampsZGxwZnRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTYzMjU3MCwiZXhwIjoyMDc3MjA4NTcwfQ.EJDfQAcf7hQHzkU1rTLyrLSsrM8ab6V9IttU4Oq_YUw
```

#### Admin 登入憑證
```
ADMIN_USERNAME=chituchitu
ADMIN_PASSWORD=1234567890
```

### 4. 構建配置 (Build Configuration)

Zeabur 會自動偵測 Next.js 專案，無需額外配置。但您可以確認：

- **Build Command**: `npm run build` 或 `bun run build`
- **Start Command**: `npm start` 或 `bun start`
- **Node Version**: 20.x (自動偵測)

### 5. 資料庫設置

確保 Supabase 資料庫已正確設置：

1. 執行 `supabase-schema.sql` 創建必要的表
2. 驗證 RLS (Row Level Security) 策略已啟用
3. 確認 API 金鑰有效且未過期

### 6. 部署

1. 點擊 "Deploy" 按鈕
2. 等待構建完成（通常 2-5 分鐘）
3. 構建成功後，Zeabur 會提供一個 URL

### 7. 驗證部署

訪問部署的 URL 並測試：

- ✅ 主頁加載正常
- ✅ 可以完成 4 步驟流程
- ✅ 圖片上傳功能正常
- ✅ Admin 面板可以登入 (`/admin/login`)
- ✅ 數據正確存儲到 Supabase

### 8. 綁定自定義域名（可選）

1. 在 Zeabur 專案設置中點擊 "Domains"
2. 添加您的自定義域名
3. 按照說明配置 DNS 記錄

## 故障排除 (Troubleshooting)

### 構建失敗
- 檢查 `package.json` 中的依賴是否完整
- 確認 Node.js 版本兼容（建議 20.x）

### 環境變數問題
- 確保所有環境變數都已正確添加
- 注意不要有多餘的空格或換行

### Supabase 連接失敗
- 驗證 Supabase URL 和 API 金鑰
- 檢查 Supabase 專案是否暫停（免費方案會自動暫停不活躍專案）

### 文件上傳失敗
- Zeabur 的文件系統是暫時的，文件會在容器重啟後消失
- 確保使用 Supabase Storage 儲存上傳的圖片（當前版本使用本地存儲作為備用）

## 效能優化建議

1. **啟用 CDN**: 在 Zeabur 設置中啟用 CDN 加速
2. **圖片優化**: 考慮使用 Supabase Storage 儲存圖片
3. **快取策略**: Next.js 已內建優化，無需額外配置

## 監控與日誌

- 在 Zeabur 控制台查看即時日誌
- 設置錯誤通知（可選）
- 監控資源使用情況

## 費用說明

- Zeabur 提供免費方案，適合開發和小型專案
- 根據流量和資源使用收費
- 詳細定價請參考 [Zeabur Pricing](https://zeabur.com/pricing)

---

## 快速部署按鈕

如果您想一鍵部署，可以使用以下按鈕（需要先設置環境變數）：

[![Deploy on Zeabur](https://zeabur.com/button.svg)](https://zeabur.com/templates)

---

**需要協助？**
- Zeabur 文檔: https://zeabur.com/docs
- Supabase 文檔: https://supabase.com/docs
