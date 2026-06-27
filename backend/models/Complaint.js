import mongoose from 'mongoose';
const eventSchema=new mongoose.Schema({status:String,remark:String,by:{type:mongoose.Schema.Types.ObjectId,ref:'User'},at:{type:Date,default:Date.now}},{_id:false});
const schema=new mongoose.Schema({
 reference:{type:String,unique:true},title:{type:String,required:true,trim:true},description:{type:String,required:true},category:{type:String,required:true},images:[String],
 location:{address:{type:String,required:true},latitude:Number,longitude:Number,ward:String,landmark:String},contactNumber:String,anonymous:{type:Boolean,default:false},
 status:{type:String,enum:['Submitted','Under Review','Assigned','In Progress','Resolved','Rejected'],default:'Submitted'},priority:{type:String,enum:['Low','Medium','High','Critical'],default:'Medium'},
 createdBy:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},assignedTo:{type:mongoose.Schema.Types.ObjectId,ref:'User'},department:{type:mongoose.Schema.Types.ObjectId,ref:'Department'},adminRemarks:[{message:String,by:{type:mongoose.Schema.Types.ObjectId,ref:'User'},createdAt:{type:Date,default:Date.now}}],timeline:[eventSchema],completionImage:String
},{timestamps:true});
schema.index({title:'text',description:'text','location.address':'text',category:'text'});
schema.pre('validate',function(next){if(!this.reference)this.reference=`CF-${new Date().getFullYear()}-${Math.floor(1000+Math.random()*9000)}`;if(this.isNew)this.timeline.push({status:'Submitted',remark:'Complaint received'});next()});
export default mongoose.model('Complaint',schema);
