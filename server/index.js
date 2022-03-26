const express = require('express');
const http = require('http');
const cors = require('cors');

const authRoutes = require('./routes/auth.js');

const app = express();
const PORT = process.env.PORT || 8080;

const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUT_TOKEN;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
const twilioClient = require('twilio')(accountSid, authToken);

io.on('connection', (socket) => {
  socket.emit('me', socket.id);

  socket.on('disconnect', () => {
    socket.broadcast.emit('callDisconnected', { disconnectedId: socket.id });
  });

  socket.on('endCall', (data) => {
    io.to(data.to).emit('callEnded', { callerId: socket.id });
  });

  socket.on('callUser', (data) => {
    io.to(data.userToCall).emit('callUser', { signal: data.signalData, from: data.from, name: data.name });
  });

  socket.on('answerCall', (data) => {
    io.to(data.to).emit('callAccepted', data.signal);
  });

  socket.on('declineCall', (data) => {
    io.to(data.to).emit('declineCall');
  });
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded());

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.post('/', (req, res) => {
  const { message, user: sender, type, members } = req.body;

  if (type === 'message.new') {
    members
      .filter((member) => member.user_id !== sender.id)
      .forEach(({ user }) => {
        if (!user.online) {
          twilioClient.messages
            .create({
              body: `Aveti un nou mesaj de la ${message.user.fullName} - ${message.text}`,
              messagingServiceSid: messagingServiceSid,
              to: user.phoneNumber,
            })
            .then(() => console.log('Mesajul a fost trimis!'))
            .catch((err) => console.log(err));
        }
      });

    return res.status(200).send('Mesajul a fost trimis!');
  }

  return res.status(200).send('Nu este un mesaj nou!');
});

app.use('/auth', authRoutes);

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
