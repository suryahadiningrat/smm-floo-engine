Bangun sebuah REST API Service yang siap digunakan (ready-to-hit) menggunakan Node.js (Express). API ini bertindak sebagai middleware untuk menarik data dari Metricool API dan memformatnya sesuai kebutuhan dashboard internal kantor.

PENTING: Struktur Endpoint: Jangan buat satu endpoint raksasa. Tolong pecah menjadi endpoint spesifik per platform agar modular. Buatlah route berikut:

GET /api/v1/facebook/analytics

GET /api/v1/twitter/analytics

GET /api/v1/instagram/analytics (Wajib include data Feed & Stories)

GET /api/v1/tiktok/analytics

GET /api/v1/youtube/analytics

GET /api/v1/linkedin/analytics

Requirements Teknis:

Framework: Node.js + Express.

HTTP Client: Axios.

Config: Gunakan dotenv untuk menyimpan METRICOOL_USER_TOKEN dan METRICOOL_BLOG_ID.

Parameters: Semua endpoint harus menerima query params from (start date) dan to (end date).

Data Mapping & Transformation (Wajib Sesuai Checklist): Setiap endpoint harus mengembalikan JSON yang sudah dibersihkan (bukan raw data Metricool yang berantakan). Pastikan field berikut ada di response JSON masing-masing endpoint:

Facebook:

metrics: Post count, Page Views, Followers (Community), Reach, Impressions.

interactions: Clicks, Likes, Comments, Shares (sebagai Repost).

Twitter (X):

metrics: Tweets count, Profile Views, Followers, Reach, Impressions.

interactions: Likes, Replies (Comments), Retweets (Repost), Quotes.

Instagram (Gabungkan Data Feed & Story):

metrics: Posts count, Profile Views, Followers, Reach (Total), Impressions (Total).

interactions: Likes, Comments, Saves, Shares.

SPECIAL REQUIREMENT: Wajib ambil data Stories secara spesifik (Reach & Impressions) dan sertakan dalam response object terpisah di dalam endpoint ini.

TikTok:

metrics: Video count, Profile Views, Followers, Reach, Impressions.

interactions: Likes, Comments, Shares (Repost), Saves.

YouTube:

metrics: Video count, Views, Subscribers (Follower), Reach (jika ada), Impressions.

interactions: Likes, Comments, Shares, Dislikes (Cari field dislike/negative feedback di API response).

LinkedIn:

metrics: Post count, Views, Followers, Reach, Impressions.

interactions: Likes, Comments, Shares, Reposts.

Deliverables (Code Structure): Tolong berikan kode lengkap untuk file-file berikut:

.env.example (template variabel environment).

server.js (entry point).

routes/analyticsRoutes.js (definisi routing endpoint di atas).

controllers/analyticsController.js (logika pemanggilan axios ke Metricool dan logic mapping data JSON-nya).

Tolong pastikan kode rapi, error handling terpasang (misal: jika API Metricool timeout), dan siap dijalankan dengan npm start.