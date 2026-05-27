import express from 'express';
import cors from 'cors';
import './Models/db.js';
import AuthRouter from './Routes/AuthRouter.js';
import AdminRouter from './Routes/AdminRouter.js';
 import OrganizationRoutes from './Routes/OrganizationRoutes.js';
 import UserRoutes from './Routes/UserRouter.js';
//  import VendorRoutes from './Routes/VendorRouter.js';
import cookieParser from 'cookie-parser';

const app = express();
app.use(express.json());

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use("/auth", AuthRouter);
app.use("/admin", AdminRouter);
 app.use("/organization", OrganizationRoutes);
 app.use("/user",UserRoutes );
//  app.use("/vendor", VendorRoutes);

const port = process.env.PORT || 8080;

app.listen(port, () => {

  console.log("server started at PORT " + port);
})
