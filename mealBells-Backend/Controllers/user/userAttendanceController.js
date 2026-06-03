import { MenuSchedule } from "../../Models/menuSchedule.js";
import { Attendance }   from "../../Models/attendance.js";
import { userModel }    from "../../Models/user.js";

const getDayRange = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
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

    const { start, end } = getDayRange();

    await Attendance.findOneAndUpdate(
      { userId, date: { $gte: start, $lte: end } },
      { $set: { userId, organizationId, scheduleId: scheduleId ?? null, response, date: new Date() } },
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

    const { start, end } = getDayRange(schedule.scheduledDate);

    await Attendance.findOneAndUpdate(
      { userId, date: { $gte: start, $lte: end } },
      { $set: { userId, organizationId, scheduleId, response, date: new Date(schedule.scheduledDate) } },
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
