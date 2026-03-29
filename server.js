const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'mysecret123';
const IG_TOKEN = process.env.INSTAGRAM_TOKEN;
const TRIGGER_WORD = (process.env.TRIGGER_WORD || 'Boy').toLowerCase();
const REPLY_MSG = process.env.REPLY_MESSAGE || 'Hey! Here are the details!';
const IG_ACCOUNT_ID = '17841477449163662';

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return res.send(challenge);
  }
  res.sendStatus(403);
});

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  const body = req.body;
  if (body.object !== 'instagram') return;
  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== 'comments') continue;
      const { text, from } = change.value;
      if (!text || !text.toLowerCase().includes(TRIGGER_WORD)) continue;
      console.log(`Trigger from @${from?.username}: "${text}"`);
      await sendDM(from.id, REPLY_MSG);
    }
  }
});

async function sendDM(userId, message) {
  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/${IG_ACCOUNT_ID}/messages`,
      {
        recipient: { id: userId },
        message: { text: message }
      },
      { params: { access_token: IG_TOKEN } }
    );
    console.log('DM sent to', userId);
  } catch (err) {
    console.error('DM failed:', err.response?.data || err.message);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));
