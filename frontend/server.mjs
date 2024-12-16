import { createServer } from 'https';
import next from 'next';
import fs from 'fs';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '1inf54-982-1a.inf.pucp.edu.pe';
const port = 443;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync('./1inf54-982-1a.inf.pucp.edu.pe+3-key.pem'),
  cert: fs.readFileSync('./1inf54-982-1a.inf.pucp.edu.pe+3.pem'),
};

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      await handle(req, res);
    } catch (err) {
      console.error('Error:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }).listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Ready on https://${hostname}`);
  });
});