import Department from '../models/Department.js';
import LocalAuthority from '../models/LocalAuthority.js';
import User from '../models/User.js';
import { notify } from './notificationService.js';
import { departmentForCategory, departmentNameCandidates } from './routingRules.js';

export async function analyzeComplaint(input) {
  try {
    const response = await fetch('http://127.0.0.1:8000/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: input.title === 'Pending AI Analysis' ? '' : input.title,
        description: input.description === 'Pending AI Analysis' ? '' : input.description,
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
    
    let localAuthorityId = null;
    let department = null;
    let assignedOfficer = null;
    let routingStatus = 'Pending Review';
    const mappedDepartment = departmentForCategory(analysis.category);

    if (complaint.location && complaint.location.coordinates && complaint.location.coordinates.length === 2) {
      const [longitude, latitude] = complaint.location.coordinates;
      const authority = await LocalAuthority.findOne({
        boundary: {
          $geoIntersects: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude]
            }
          }
        },
        status: true
      });

      if (authority) {
        localAuthorityId = authority._id;
        const departmentNames = departmentNameCandidates(mappedDepartment, analysis.category);
        const departmentQuery = {
          localAuthority: authority._id,
          active: true,
          $or: [
            { categories: analysis.category },
            { name: { $in: departmentNames } }
          ]
        };

        department = await Department.findOne(departmentQuery);

        if (department) {
          assignedOfficer = await User.findOne({
            role: 'department_officer',
            department: department._id,
            localAuthority: authority._id,
            active: true
          }).sort('createdAt').select('_id');
          if (assignedOfficer) routingStatus = 'Routed';
        }
      }
    }

    if (analysis.title && (!complaint.title || complaint.title.trim() === '' || complaint.title === 'Pending AI Analysis')) {
      complaint.title = analysis.title;
    }
    if (analysis.description && (!complaint.description || complaint.description.trim() === '' || complaint.description === 'Pending AI Analysis')) {
      complaint.description = analysis.description;
    }

    complaint.category = analysis.category;
    complaint.priority = analysis.priority;
    complaint.severity = analysis.severity;
    complaint.aiConfidence = analysis.confidence;
    complaint.localAuthority = localAuthorityId;
    complaint.routingStatus = routingStatus;
    complaint.assignedTo = assignedOfficer?._id;
    complaint.aiAnalysis = {
      ...analysis,
      department: mappedDepartment || analysis.department,
      description: analysis.aiReport || analysis.description,
      analyzedAt: new Date(),
      requiresException: routingStatus === 'Pending Review'
    };

    if (department && assignedOfficer && routingStatus === 'Routed') {
      complaint.department = department.id;
      complaint.status = 'Assigned';
      complaint.assignedAt = new Date();
      complaint.timeline.push({ status: 'Assigned', remark: `Automatically routed to ${department.name}` });
    } else {
      complaint.status = 'Under Review';
      complaint.timeline.push({ status: 'Under Review', remark: 'Automatic routing could not find a matching service-area officer' });
    }

    await complaint.save();

    if (department && assignedOfficer && routingStatus === 'Routed') {
      await notify(assignedOfficer._id, `${complaint.reference} was automatically assigned to your department dashboard`, 'assigned', complaint.id);
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
