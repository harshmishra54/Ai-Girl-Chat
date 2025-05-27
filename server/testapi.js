const axios = require('axios');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MzQzYWI4NGUyZWYxMWJmZTRjYmE3NSIsImlhdCI6MTc0ODI5MzY1MiwiZXhwIjoxNzQ4ODk4NDUyfQ.GxMcdOS8wepYv3kUR4W8NfOijECuUNoLuTSjEzOnwDs'; // <-- replace this with a real token

axios.post('http://localhost:8080/api/chat/chat',  // NOTE: because in server.js you do `app.use('/api/chat', chatRoutes)`, and chatRoutes defines router.post('/chat')
  {
    message: 'Hello AI girlfriend!',
  },
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
)
.then(res => {
  console.log('AI Reply:', res.data.reply);
})
.catch(err => {
  console.error('API error:', err.response?.data || err.message);
});
