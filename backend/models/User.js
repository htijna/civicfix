import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
const schema=new mongoose.Schema({
 name:{type:String,required:true,trim:true},
 email:{type:String,required:true,unique:true,lowercase:true,trim:true},
 password:{type:String,required:true,minlength:8,select:false},
 phone:String,address:String,ward:String,
 role:{type:String,enum:['citizen','admin'],default:'citizen'},
 avatar:String,
 language:{type:String,enum:['en','ml'],default:'en'},
 resetPasswordToken:{type:String,select:false},
 resetPasswordExpires:{type:Date,select:false}
},{timestamps:true});
schema.pre('save',async function(next){if(this.isModified('password'))this.password=await bcrypt.hash(this.password,12);next()});
schema.methods.verifyPassword=function(value){return bcrypt.compare(value,this.password)};
export default mongoose.model('User',schema);
