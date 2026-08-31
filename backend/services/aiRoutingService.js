import Department from '../models/Department.js';
import User from '../models/User.js';
import { notify } from './notificationService.js';

export async function analyzeComplaint(input) {
  try {
    const response = await fetch('http://127.0.0.1:8000/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: input.title,
        description: input.description,
        category: input.category,
        location: input.location,
        images: input.images
      })
    });
    
    if (!response.ok) {
      throw new Error(`Python ML service returned ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to communicate with Python AI analyzer: ${error.message}`);
  }
}

export async function routeComplaint(complaint) {
  try {
    const analysis = await analyzeComplaint(complaint);
    const department = analysis.department
      ? await Department.findOne({ name: analysis.department, active: true })
      : null;

    if (analysis.title && (!complaint.title || complaint.title.trim() === '')) {
      complaint.title = analysis.title;
    }
    if (analysis.description && (!complaint.description || complaint.description.trim() === '')) {
      complaint.description = analysis.description;
    }

    complaint.category = analysis.category;
    complaint.priority = analysis.priority;
    complaint.severity = analysis.severity;
    complaint.aiConfidence = analysis.confidence;
    complaint.aiAnalysis = {
      ...analysis,
      description: analysis.aiReport || analysis.description,
      analyzedAt: new Date(),
      requiresException: !department
    };

    if (department) {
      complaint.department = department.id;
      complaint.status = 'Assigned';
      complaint.assignedAt = new Date();
      complaint.timeline.push({ status: 'Assigned', remark: `AI routed to ${department.name}` });
    } else {
      complaint.status = 'Exception';
      complaint.timeline.push({ status: 'Exception', remark: 'AI could not find an active department match' });
    }

    await complaint.save();

    if (department) {
      const users = await User.find({ role: 'department', department: department.id }).select('_id');
      await Promise.all(users.map(user => notify(user._id, `${complaint.reference} was automatically assigned to your department`, 'assigned', complaint.id)));
      await notify(complaint.createdBy, `${complaint.reference} was assigned to ${department.name}`, 'assigned', complaint.id);
    }

    return complaint;
  } catch (error) {
    complaint.status = 'Exception';
    complaint.aiAnalysis = {
      category: complaint.category,
      priority: complaint.priority,
      severity: complaint.severity,
      confidence: 0,
      requiresException: true,
      analyzedAt: new Date(),
      error: error.message,
      description: `### 🤖 AI Routing Exception\nAn error occurred during automated AI analysis:\n\n\`${error.message}\`\n\n*Please review this complaint manually to classify, set priority/severity, and route it to the appropriate department.*`
    };
    complaint.timeline.push({ status: 'Exception', remark: 'AI analysis failed; admin review required' });
    await complaint.save();
    return complaint;
  }
}
