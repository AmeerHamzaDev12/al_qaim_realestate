import express from 'express';
import { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import authRouter from './routes/auth.routes';
import customerRouter from './routes/customers.routes';
// import path from 'path';

dotenv.config();

const app = express();
// app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

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

app.use('/', authRouter);
app.use('/', customerRouter);
app.use((req: Request, res: Response) => {
  return res.status(404).json({
    success: false,
    message: 'Route not found',
    data: {
      method: req.method,
      path: req.originalUrl
    }
  });
});
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.get('/', (req, res) => res.send('Server is running ✅'));

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server listening on port ${process.env.PORT}`);
});
