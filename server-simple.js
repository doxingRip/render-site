const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

// Просто раздаём всё как статику
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
