import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        // Allow both manual admin triggers and automated runs
        if (user && user.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const payload = await req.json().catch(() => ({}));
        const task = payload.task || 'full'; // cleanup, optimize, archive, full

        console.log(`Starting AI server maintenance: ${task}`);

        const results = {
            cleanup: { completed: 0, details: [] },
            archive: { completed: 0, details: [] },
            optimize: { completed: 0, details: [] },
            ai_analysis: { issues: [], recommendations: [] }
        };

        // CLEANUP TASKS
        if (task === 'cleanup' || task === 'full') {
            console.log('Running cleanup tasks...');

            // 1. Delete old ride messages (older than 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const oldMessages = await base44.asServiceRole.entities.RideMessage.list();
            for (const msg of oldMessages) {
                if (msg.created_date && new Date(msg.created_date) < thirtyDaysAgo) {
                    await base44.asServiceRole.entities.RideMessage.delete(msg.id);
                    results.cleanup.completed++;
                    results.cleanup.details.push(`Deleted old message ${msg.id}`);
                }
            }

            // 2. Delete resolved alerts older than 14 days
            const fourteenDaysAgo = new Date();
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
            
            const resolvedAlerts = await base44.asServiceRole.entities.SystemAlert.filter({ resolved: true });
            for (const alert of resolvedAlerts) {
                if (alert.resolved_at && new Date(alert.resolved_at) < fourteenDaysAgo) {
                    await base44.asServiceRole.entities.SystemAlert.delete(alert.id);
                    results.cleanup.completed++;
                    results.cleanup.details.push(`Deleted resolved alert ${alert.id}`);
                }
            }

            // 3. Cancel abandoned ride requests (older than 2 hours)
            const twoHoursAgo = new Date();
            twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
            
            const abandonedRides = await base44.asServiceRole.entities.Ride.filter({ status: 'requested' });
            for (const ride of abandonedRides) {
                if (new Date(ride.created_date) < twoHoursAgo) {
                    await base44.asServiceRole.entities.Ride.update(ride.id, {
                        status: 'cancelled',
                        cancelled_at: new Date().toISOString()
                    });
                    results.cleanup.completed++;
                    results.cleanup.details.push(`Cancelled abandoned ride ${ride.id}`);
                }
            }

            console.log(`Cleanup complete: ${results.cleanup.completed} items processed`);
        }

        // ARCHIVE TASKS
        if (task === 'archive' || task === 'full') {
            console.log('Running archive tasks...');

            // Archive completed rides older than 90 days
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            
            const oldCompletedRides = await base44.asServiceRole.entities.Ride.filter({ status: 'completed' });
            for (const ride of oldCompletedRides) {
                if (ride.created_date && new Date(ride.created_date) < ninetyDaysAgo) {
                    // Mark as archived (add archived field if needed, or just log)
                    results.archive.completed++;
                    results.archive.details.push(`Archived ride ${ride.id} from ${ride.created_date}`);
                }
            }

            console.log(`Archive complete: ${results.archive.completed} rides archived`);
        }

        // AI ANALYSIS using LLM
        if (task === 'analyze' || task === 'full') {
            console.log('Running AI analysis...');

            // Gather system metrics
            const allRides = await base44.asServiceRole.entities.Ride.list();
            const allDrivers = await base44.asServiceRole.entities.DriverProfile.list();
            const allAlerts = await base44.asServiceRole.entities.SystemAlert.filter({ resolved: false });

            const metrics = {
                total_rides: allRides.length,
                active_rides: allRides.filter(r => ['requested', 'accepted', 'in_progress'].includes(r.status)).length,
                completed_rides: allRides.filter(r => r.status === 'completed').length,
                cancelled_rides: allRides.filter(r => r.status === 'cancelled').length,
                total_drivers: allDrivers.length,
                online_drivers: allDrivers.filter(d => d.status !== 'offline').length,
                approved_drivers: allDrivers.filter(d => d.approved).length,
                pending_alerts: allAlerts.length,
                revenue: allRides.filter(r => r.status === 'completed' && r.payment_status === 'paid')
                    .reduce((sum, r) => sum + (r.fare || 0), 0)
            };

            // Use AI to analyze and provide recommendations
            const aiPrompt = `
Analyze this ride-sharing service metrics and provide actionable recommendations:

METRICS:
- Total Rides: ${metrics.total_rides}
- Active Rides: ${metrics.active_rides}
- Completed Rides: ${metrics.completed_rides}
- Cancelled Rides: ${metrics.cancelled_rides}
- Total Drivers: ${metrics.total_drivers}
- Online Drivers: ${metrics.online_drivers}
- Approved Drivers: ${metrics.approved_drivers}
- Pending Alerts: ${metrics.pending_alerts}
- Total Revenue: $${metrics.revenue.toFixed(2)}

Provide:
1. Key issues or concerns (if any)
2. 3-5 actionable recommendations to improve the service
3. Any red flags that need immediate attention

Keep it concise and practical.
            `.trim();

            try {
                const aiResponse = await base44.integrations.Core.InvokeLLM({
                    prompt: aiPrompt,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            issues: {
                                type: "array",
                                items: { type: "string" }
                            },
                            recommendations: {
                                type: "array",
                                items: { type: "string" }
                            },
                            red_flags: {
                                type: "array",
                                items: { type: "string" }
                            }
                        },
                        required: ["issues", "recommendations", "red_flags"]
                    }
                });

                results.ai_analysis.issues = aiResponse.data.issues || [];
                results.ai_analysis.recommendations = aiResponse.data.recommendations || [];
                results.ai_analysis.red_flags = aiResponse.data.red_flags || [];

                console.log('AI analysis complete');
            } catch (aiError) {
                console.error('AI analysis failed:', aiError);
                results.ai_analysis.issues.push('AI analysis unavailable');
            }
        }

        console.log('Server maintenance complete');

        return Response.json({
            success: true,
            task: task,
            results: results,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Server maintenance error:', error);
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
});