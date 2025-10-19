const express = require("express");
const app = express();
const port = 5000;  // بدل 3000 بخليها 5000


// راوت تجريبي
app.get("/api/test", (req, res) => {
  res.json({ message: "✅ Express شغال تمام" });
});

// تشغيل السيرفر
app.listen(port, () => {
  console.log(`🚀 السيرفر شغال على http://localhost:${port}`);
});
