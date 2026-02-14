const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Company location (fixed)
const COMPANY_LAT = 30.5606667;
const COMPANY_LNG = 31.0100556;
const GEOFENCE_RADIUS = 50.0; // meters

// Haversine distance (meters)
function distanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000; // meters
    const toRad = (v) => (v * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// POST /api/attendance/checkin
app.post("/api/attendance/checkin", (req, res) => {
    const {
        latitude,
        longitude,
        accuracy = null, // optional
        type = "check_in", // optional
        timestamp = null,  // optional (client can send it)
    } = req.body;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
        return res.status(400).json({
            error: "latitude and longitude must be numbers",
        });
    }

    const dist = distanceMeters(latitude, longitude, COMPANY_LAT, COMPANY_LNG);

    // use server timestamp if client didn't send one
    const serverTimestamp = new Date().toISOString();
    const finalTimestamp = timestamp || serverTimestamp;

    const payload = {
        timestamp: finalTimestamp,
        latitude,
        longitude,
        distance: Number(dist.toFixed(2)),
        accuracy: accuracy !== null ? Number(accuracy) : null,
        type, // "check_in" or "check_out"
        companyLatitude: COMPANY_LAT,
        companyLongitude: COMPANY_LNG,
        geofenceRadius: GEOFENCE_RADIUS,
    };

    // If inside geofence -> success, else -> forbidden
    if (dist <= GEOFENCE_RADIUS) {
        return res.status(200).json({
            success: true,
            message: "تم تسجيل الحضور بنجاح ✅",
            ...payload,
        });
    } else {
        return res.status(403).json({
            success: false,
            message: "أنت لست داخل الشركة ❌",
            ...payload,
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

