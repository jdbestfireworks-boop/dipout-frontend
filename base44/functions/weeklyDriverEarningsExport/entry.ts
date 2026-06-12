import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Helper: find or create a spreadsheet by name
async function getOrCreateSpreadsheet(accessToken, title) {
    const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name%3D'${encodeURIComponent(title)}'%20and%20mimeType%3D'application%2Fvnd.google-apps.spreadsheet'%20and%20trashed%3Dfalse`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const searchData = await searchRes.json();
    if (searchData.files?.length > 0) return searchData.files[0].id;

    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ properties: { title } })
    });
    const sheet = await createRes.json();
    return sheet.spreadsheetId;
}

// Helper: get or add a sheet tab by name, returns sheetId
async function getOrAddTab(accessToken, spreadsheetId, tabName) {
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    const meta = await metaRes.json();
    const existing = meta.sheets?.find(s => s.properties.title === tabName);
    if (existing) return existing.properties.sheetId;

    const addRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ addSheet: { properties: { title: tabName } } }] })
    });
    const addData = await addRes.json();
    return addData.replies[0].addSheet.properties.sheetId;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

        // Determine the week window (last 7 days ending yesterday)
        const now = new Date();
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - 1);
        weekEnd.setHours(23, 59, 59, 999);
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0);

        const weekLabel = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        console.log('Exporting earnings for:', weekLabel);

        // Fetch all completed+paid rides in the window
        const allRides = await base44.asServiceRole.entities.Ride.filter({ status: 'completed', payment_status: 'paid' });
        const rides = allRides.filter(r => {
            const d = new Date(r.created_date);
            return d >= weekStart && d <= weekEnd;
        });

        if (rides.length === 0) {
            console.log('No completed rides in this period.');
            return Response.json({ success: true, message: 'No rides in period', weekLabel });
        }

        // Aggregate by driver
        const driverMap = {};
        for (const ride of rides) {
            const email = ride.driver_email || 'Unassigned';
            if (!driverMap[email]) {
                driverMap[email] = { trips: 0, gross: 0, earnings: 0 };
            }
            driverMap[email].trips += 1;
            driverMap[email].gross += ride.fare || 0;
            // Driver gets 80% (matches default commission)
            driverMap[email].earnings += (ride.fare || 0) * 0.8;
        }

        // Build rows: header + one row per driver + totals
        const headers = ['Driver Email', 'Trips Completed', 'Gross Fare ($)', 'Driver Payout (80%) ($)', 'Platform Cut (20%) ($)'];
        const rows = Object.entries(driverMap).map(([email, d]) => [
            email,
            d.trips,
            d.gross.toFixed(2),
            d.earnings.toFixed(2),
            (d.gross * 0.2).toFixed(2),
        ]);
        rows.sort((a, b) => b[1] - a[1]); // sort by trip count desc

        const totalGross = Object.values(driverMap).reduce((s, d) => s + d.gross, 0);
        const totalEarnings = Object.values(driverMap).reduce((s, d) => s + d.earnings, 0);
        const totalsRow = ['TOTAL', rides.length, totalGross.toFixed(2), totalEarnings.toFixed(2), (totalGross * 0.2).toFixed(2)];

        const allRows = [
            [`Dip Out — Weekly Driver Earnings Report`],
            [weekLabel],
            [],
            headers,
            ...rows,
            [],
            totalsRow,
        ];

        // Get spreadsheet and tab
        const spreadsheetId = await getOrCreateSpreadsheet(accessToken, 'Dip Out - Driver Earnings');
        const tabName = weekEnd.toISOString().slice(0, 10); // e.g. "2026-06-11"
        await getOrAddTab(accessToken, spreadsheetId, tabName);

        // Clear tab and write fresh data
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tabName)}:clear`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const writeRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tabName)}?valueInputOption=USER_ENTERED`,
            {
                method: 'PUT',
                headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ values: allRows })
            }
        );

        if (!writeRes.ok) {
            const err = await writeRes.json();
            throw new Error(err.error?.message || 'Failed to write to Sheets');
        }

        const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
        console.log('Weekly export complete:', sheetUrl);

        return Response.json({
            success: true,
            weekLabel,
            drivers: Object.keys(driverMap).length,
            total_trips: rides.length,
            total_payout: totalEarnings.toFixed(2),
            sheet_url: sheetUrl
        });
    } catch (error) {
        console.error('weeklyDriverEarningsExport error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});