import app from './app';
import { connectDb } from './database/mongodb';
import { CONSTANTS } from './configs/constant';

async function bootstrap() {
  await connectDb();
  app.listen(CONSTANTS.PORT, () => {
    console.log(`Server running on http://localhost:${CONSTANTS.PORT}`);
  });
}

bootstrap();