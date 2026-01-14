import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import router from './routes/auth.routes';
import path from 'path';

dotenv.config();

const app = express();
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use(helmet());
app.use(
  cors({
    origin: '*',
    credentials:true
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(compression());

app.use('/',router);
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.get('/', (req, res) => res.send('Server is running ✅'));

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server listening on port ${process.env.PORT}`);
});
