// Controllers/user/attendanceController.js
import { MenuSchedule } from "../../Models/menuSchedule.js";
import { Attendance }   from "../../Models/attendance.js";
import { userModel }    from "../../Models/user.js";

/**
 * Normalizes any date to UTC midnight (00:00:00.000Z).
 * This ensures date-only comparisons work regardless of server timezone.
 * e.g. 2026-06-08T14:32:00+05:30  →  2026-06-08T00:00:00.000Z
 */
const toUTCMidnight = (date = new Date()) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/**
 * Returns UTC start/end bounds for a given date.
 * start = 2026-06-08T00:00:00.000Z
 * end   = 2026-06-08T23:59:59.999Z
 */
const getUTCDayRange = (date = new Date()) => {
  const start = new Date(date); start.setUTCHours(0,  0,  0,   0);
  const end   = new Date(date); end.setUTCHours(23, 59, 59, 999);
  return { start, end };
};

// ── POST /user/attendance ─────────────────────────────────────────────────────
export const markAttendance = async (req, res) => {
  try {
    const { response, scheduleId } = req.body;
    const { id: userId, organizationId } = req.user;

    if (!["yes", "no"].includes(response)) {
      return res.status(400).json({ success: false, msg: 'response must be "yes" or "no"' });
    }

    const { start, end } = getUTCDayRange(); // today in UTC

    await Attendance.findOneAndUpdate(
      { userId, date: { $gte: start, $lte: end } },
      {
        $set: {
          userId,
          organizationId,
          scheduleId: scheduleId ?? null,
          response,
          // FIX: store UTC midnight so all analytics date-range queries match correctly
          date: toUTCMidnight(),
        },
      },
      { upsert: true, new: true }
    );

    const yesAttendances = await Attendance.find({
      organizationId,
      date:     { $gte: start, $lte: end },
      response: "yes",
    })
      .select("userId")
      .lean();

    const colleaguesEating = yesAttendances.length;

    const colleagueUserIds = yesAttendances
      .map(a => a.userId?.toString())
      .filter(id => id && id !== userId.toString())
      .slice(0, 3);

    const colleagueUsers = await userModel
      .find({ _id: { $in: colleagueUserIds } })
      .select("avatar name")
      .lean();

    const colleagueAvatars = colleagueUsers.map(u => u.avatar).filter(Boolean);

    return res.status(200).json({
      success: true,
      data: { myResponse: response, colleaguesEating, colleagueAvatars },
    });
  } catch (err) {
    console.error("markAttendance:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

// ── PATCH /user/attendance/:scheduleId ────────────────────────────────────────
export const markAttendanceForDay = async (req, res) => {
  try {
    const { scheduleId }  = req.params;
    const { response }    = req.body;
    const { id: userId, organizationId } = req.user;

    if (!["yes", "no"].includes(response)) {
      return res.status(400).json({ success: false, msg: 'response must be "yes" or "no"' });
    }

    const schedule = await MenuSchedule.findById(scheduleId).lean();
    if (!schedule) {
      return res.status(404).json({ success: false, msg: "Schedule not found" });
    }

    const { start, end } = getUTCDayRange(schedule.scheduledDate);

    await Attendance.findOneAndUpdate(
      { userId, date: { $gte: start, $lte: end } },
      {
        $set: {
          userId,
          organizationId,
          scheduleId,
          response,
          // FIX: normalize to UTC midnight of the scheduled date
          date: toUTCMidnight(schedule.scheduledDate),
        },
      },
      { upsert: true, new: true }
    );

    const colleaguesEating = await Attendance.countDocuments({
      organizationId,
      date:     { $gte: start, $lte: end },
      response: "yes",
    });

    return res.status(200).json({
      success: true,
      data: { myResponse: response, colleaguesEating },
    });
  } catch (err) {
    console.error("markAttendanceForDay:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};