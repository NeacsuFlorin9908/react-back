const { connect } = require('getstream');
const bcrypt = require('bcrypt');
const StreamChat = require('stream-chat').StreamChat;
const crypto = require('crypto');

require('dotenv').config();

const api_key = process.env.STREAM_API_KEY;
const api_secret = process.env.STREAM_API_SECRET;
const app_id = process.env.STREAM_APP_ID;

const signup = async (req, res) => {
  try {
    const { fullName, username, password, phoneNumber } = req.body;

    const userId = crypto.randomBytes(16).toString('hex');

    const serverClient = connect(api_key, api_secret, app_id);

    const clientServer = StreamChat.getInstance(api_key, api_secret);

    const usersResp = await clientServer.queryUsers({});

    const alreadyRegistered = usersResp.users.find((user) => user.name === username);

    if (alreadyRegistered) {
      res.status(409).json({ message: 'Utilizatorul este deja inregistrat' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const token = serverClient.createUserToken(userId);

    res.status(200).json({ token, fullName, username, userId, hashedPassword, phoneNumber });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error });
  }
};
const loginAuth = async (req, res) => {
  try {
    const { username, password } = req.body;

    const server = connect(api_key, api_secret, app_id);

    const clientServer = StreamChat.getInstance(api_key, api_secret);

    const { users } = await clientServer.queryUsers({ name: username });

    if (!users?.length) return res.status(403).json({ message: 'Utilizatorul nu a fost gasit!' });

    const successfulDecrypt = await bcrypt.compare(password, users[0].hashedPassword);

    const tokenSessionID = server.createUserToken(users[0].id);

    if (successfulDecrypt) {
      res.status(200).json({ token: tokenSessionID, fullName: users[0].fullName, username, userId: users[0].id });
    } else {
      res.status(500).json({ message: 'Parolă greșită!' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error });
  }
};

module.exports = { signup, loginAuth };
