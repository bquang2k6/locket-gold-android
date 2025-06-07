// api/downloads.js
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Cho phép CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Lấy dữ liệu thống kê
      const downloads = await kv.get('app_downloads') || {};
      const totalDownloads = Object.values(downloads).reduce((sum, count) => sum + count, 0);
      const todayKey = new Date().toISOString().split('T')[0];
      const todayDownloads = await kv.get(`daily_${todayKey}`) || 0;
      
      return res.status(200).json({
        downloads,
        totalDownloads,
        todayDownloads,
        onlineUsers: Math.floor(Math.random() * 50) + 10 // Giả lập
      });
    }

    if (req.method === 'POST') {
      // Tăng số lượt tải cho app
      const { appName } = req.body;
      
      if (!appName) {
        return res.status(400).json({ error: 'App name is required' });
      }

      // Lấy dữ liệu hiện tại
      const downloads = await kv.get('app_downloads') || {};
      
      // Tăng số lượt tải
      downloads[appName] = (downloads[appName] || 0) + 1;
      
      // Lưu lại
      await kv.set('app_downloads', downloads);
      
      // Cập nhật thống kê hôm nay
      const todayKey = new Date().toISOString().split('T')[0];
      const todayCount = await kv.get(`daily_${todayKey}`) || 0;
      await kv.set(`daily_${todayKey}`, todayCount + 1);
      
      return res.status(200).json({
        success: true,
        appName,
        newCount: downloads[appName],
        totalDownloads: Object.values(downloads).reduce((sum, count) => sum + count, 0)
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}