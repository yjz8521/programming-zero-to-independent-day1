# Day 1 互動課堂｜分享版

這個資料夾是可以提供給其他人的靜態分享包，內容只包含 Day 1 互動頁面必要的 `HTML`、`CSS` 與 `JavaScript`，不包含正式 Repository、練習答案或 `solutions/`。

## 直接使用

用瀏覽器開啟 [index.html](index.html) 即可。若瀏覽器限制本機檔案的相對連結，請在這個資料夾啟動靜態伺服器：

```powershell
py -m http.server 8000
```

再開啟 <http://localhost:8000/>。

## 放到公開網址

將這個 `share` 資料夾的內容整個上傳到任何靜態網站主機即可，例如 Netlify Drop 或 GitHub Pages。上傳根目錄必須直接包含 `index.html`、`styles.css` 與 `app.js`；不要把上層的完整 Repository 一起公開，因為完整 Repository 內有分階段解答。

作答進度只保存於每位訪客自己的瀏覽器 `localStorage`，不會上傳到伺服器。檢查小測驗後，每一題會標示你的選項與正確答案；Output 題則會指出錯誤方向，並提供「查看正確 output」按鈕。這一版是 Day 1 示範課堂，不是完整 26 週課程入口。
