import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import userRoutes from './routes/userRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import { sanitizeInput } from './middleware/sanitize.js';
if(process.env.NODE_ENV==='production'&&!process.env.JWT_SECRET)throw new Error('JWT_SECRET is required in production');

const app=express();
const __dirname=path.dirname(fileURLToPath(import.meta.url));
app.set('trust proxy',1);
const allowedOrigins=(process.env.CLIENT_URL||'http://localhost:5173').split(',').map(x=>x.trim());
app.use(helmet(),cors({
 origin(origin,callback){if(!origin||process.env.NODE_ENV !== 'production'||allowedOrigins.includes(origin))return callback(null,true);callback(new Error('Origin not allowed by CORS'))},
 credentials:true
}),express.json({limit:'2mb'}),sanitizeInput,morgan(process.env.NODE_ENV==='production'?'combined':'dev'));
app.use('/uploads',express.static(path.join(__dirname,'uploads'),{maxAge:'7d'}));
app.use('/api',rateLimit({windowMs:15*60*1000,limit:200,standardHeaders:true,legacyHeaders:false}));
app.get('/api/health',(_,res)=>res.json({
 status:'ok',
 service:'CivicFix API',
 database:mongoose.connection.readyState===1?'connected':'disconnected'
}));
app.get('/api/stats',async(_,res,next)=>{
 try{
  if(mongoose.connection.readyState!==1)return res.status(503).json({message:'Database is not connected'});
  const Complaint=(await import('./models/Complaint.js')).default;
  const [total,resolved,pending,active,highPriority,resolution]=await Promise.all([
   Complaint.countDocuments(),
   Complaint.countDocuments({status:'Resolved'}),
   Complaint.countDocuments({status:{$in:['Submitted','Under Review']}}),
   Complaint.countDocuments({status:{$in:['Assigned','In Progress']}}),
   Complaint.countDocuments({priority:{$in:['High','Critical']}}),
   Complaint.aggregate([
    {$match:{status:'Resolved'}},
    {$project:{days:{$divide:[{$subtract:['$updatedAt','$createdAt']},86400000]}}},
    {$group:{_id:null,average:{$avg:'$days'}}}
   ])
  ]);
  res.json({total,resolved,pending,active,highPriority,resolutionRate:total?Math.round(resolved/total*100):0,averageResolutionDays:resolution[0]?.average?Number(resolution[0].average.toFixed(1)):0});
 }catch(e){next(e)}
});
app.use('/api',(req,res,next)=>{
 if(mongoose.connection.readyState!==1){
  return res.status(503).json({
   message:'Database is not connected. Start MongoDB or set MONGODB_URI in server/.env.'
  });
 }
 next();
});
app.use('/api/auth',authRoutes);
app.use('/api/uploads',uploadRoutes);
app.use('/api/complaints',complaintRoutes);
app.use('/api/notifications',notificationRoutes);
app.use('/api/departments',departmentRoutes);
app.use('/api/users',userRoutes);
app.use('/api/reports',reportRoutes);
app.use((err,req,res,next)=>res.status(err.status||500).json({message:err.message||'Something went wrong'}));
const port=process.env.PORT||5000;
app.listen(port,()=>console.log(`CivicFix API running on http://localhost:${port}`));

mongoose.connect(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017/civicfix',{
 serverSelectionTimeoutMS:5000
}).then(()=>console.log('MongoDB connected'))
 .catch(err=>console.warn(`MongoDB unavailable (${err.message}). Demo mode remains active.`));
