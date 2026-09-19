# جارچیا ماژولار

## معماری
- **هسته جارچیا** (Node/Express): auth، پروژه‌ها، پرداخت، بات‌ها، کمپین، صفحات UI
- **دروازه آشا** (`backend/modules/asha-gateway.js`): فرانت آشا + پروکسی API به سرویس Python جدا

## مسیرهای مهم
| مسیر | نقش |
|------|-----|
| `/` `/generator` `/studio` `/dashboard` `/admin` `/login` `/bots` `/pricing` | UI جارچیا |
| `/ai` | چت آشا |
| `/panel` | پنل ادمین آشا |
| `/my` | پنل مشتری / فکتوری آشا |
| `/api/*` | API جارچیا |
| `/chat` `/factory` `/stats` `/payment` `/admin/*` | پروکسی به آشا |

## راه‌اندازی
1. جارچیا را روی Render دیپلوی کن (همان Start: `cd backend && npm start`)
2. آشا را جداگانه دیپلوی کن (Python/FastAPI)
3. در جارچیا env بگذار: `ASHA_API_URL=https://...asha...onrender.com`
4. در آشا CORS باز است (`allow_origins=["*"]`) — برای پروکسی کافی است

## توسعه ماژول جدید
فایل در `backend/modules/` بساز و از `server.js` صدا بزن؛ API جارچیا را در `jarchiya-api.js` ثبت کن.
