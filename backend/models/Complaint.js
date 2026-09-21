import mongoose from 'mongoose';
const eventSchema=new mongoose.Schema({status:String,remark:String,by:{type:mongoose.Schema.Types.ObjectId,ref:'User'},at:{type:Date,default:Date.now}},{_id:false});
const schema=new mongoose.Schema({
 reference:{type:String,unique:true},title:{type:String,trim:true,default:'Pending AI Analysis'},description:{type:String,default:'Pending AI Analysis'},category:{type:String,default:'Pending AI Analysis'},images:[String],
 location:{
  address:{type:String,required:true},
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number] },
  latitude:Number,longitude:Number,ward:String,landmark:String
 },contactNumber:String,anonymous:{type:Boolean,default:false},
 status:{type:String,enum:['Submitted','Under Review','Assigned','Accepted','In Progress','Resolution Submitted','Resolved','Rejected','Exception'],default:'Submitted'},priority:{type:String,enum:['Low','Medium','High','Critical'],default:'Medium'},
 severity:{type:String,enum:['Low','Medium','High','Critical'],default:'Medium'},
 aiConfidence:{type:Number,min:0,max:1},
 aiAnalysis:{category:String,department:String,severity:String,priority:String,confidence:Number,reason:String,description:String,requiresException:{type:Boolean,default:false},analyzedAt:Date,error:String},
 createdBy:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},assignedTo:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
 department:{type:mongoose.Schema.Types.ObjectId,ref:'Department'},
 localAuthority:{type:mongoose.Schema.Types.ObjectId,ref:'LocalAuthority'},
 wardBoundary:{type:mongoose.Schema.Types.ObjectId,ref:'WardBoundary'},
 routingStatus:{type:String,enum:['Pending Review','Routed'],default:'Routed'},
 departmentRemarks:[{message:String,by:{type:mongoose.Schema.Types.ObjectId,ref:'User'},images:[String],createdAt:{type:Date,default:Date.now}}],
 resolutionDescription:String,beforeImage:String,afterImage:String,assignedAt:Date,acceptedAt:Date,startedAt:Date,resolutionSubmittedAt:Date,resolvedAt:Date,
 adminRemarks:[{message:String,by:{type:mongoose.Schema.Types.ObjectId,ref:'User'},createdAt:{type:Date,default:Date.now}}],timeline:[eventSchema],completionImage:String
},{timestamps:true});
schema.index({title:'text',description:'text','location.address':'text',category:'text'});
schema.index({ 'location.coordinates': '2dsphere' });
schema.index({ status: 1 });
schema.index({ department: 1 });
schema.index({ localAuthority: 1 });
schema.index({ assignedTo: 1 });
schema.index({ priority: 1, severity: 1 });
schema.index({ createdAt: -1 });
schema.pre('validate',function(next){if(!this.reference)this.reference=`CF-${new Date().getFullYear()}-${Math.floor(1000+Math.random()*9000)}`;if(this.isNew)this.timeline.push({status:'Submitted',remark:'Complaint received'});next()});
export default mongoose.model('Complaint',schema);
