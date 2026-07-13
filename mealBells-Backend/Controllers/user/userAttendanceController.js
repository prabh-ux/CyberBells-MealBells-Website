// Controllers/user/attendanceController.js
import { MenuSchedule } from "../../Models/menuSchedule.js";
import { Attendance }   from "../../Models/attendance.js";
import { userModel }    from "../../Models/user.js";
import { Delivery }     from "../../Models/delivery.js";   // ← add this
import { organizationModel } from "../../Models/organization.js";

const toUTCMidnight = (date = new Date()) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

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

     // ── Block if past org's daily cutoff time ────────────────────────────────
    const org = await organizationModel.findById(organizationId).select("cutoffTime").lean();
    if (org?.cutoffTime) {
      const [cutoffHour, cutoffMin] = org.cutoffTime.split(":").map(Number);

      // IST = UTC+5:30 — adjust if your org's cutoff is meant in a different tz
      const nowUTC   = new Date();
      const istOffsetMs = 5.5 * 60 * 60 * 1000;
      const nowIST   = new Date(nowUTC.getTime() + istOffsetMs);

      const cutoffIST = new Date(nowIST);
      cutoffIST.setUTCHours(cutoffHour, cutoffMin, 0, 0);

      if (nowIST > cutoffIST) {
        return res.status(403).json({
          success: false,
          msg: `Attendance cutoff has passed. Responses were due by ${org.cutoffTime}.`,
        });
      }
    }

    // ── Block if delivery is already completed ──────────────────────────────
    if (scheduleId) {
      const delivery = await Delivery.findOne({ scheduleId }).lean();
      if (delivery?.status === "handed_over") {
        return res.status(403).json({
          success: false,
          msg: "Attendance is locked — delivery has already been completed.",
        });
      }
    }
    // ───────────────────────────────────────────────────────────────────────

    const { start, end } = getUTCDayRange();

    await Attendance.findOneAndUpdate(
      { userId, date: { $gte: start, $lte: end } },
      {
        $set: {
          userId,
          organizationId,
          scheduleId: scheduleId ?? null,
          response,
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

     const org = await organizationModel.findById(organizationId).select("cutoffTime").lean();
    if (org?.cutoffTime) {
      const [cutoffHour, cutoffMin] = org.cutoffTime.split(":").map(Number);

      const istOffsetMs = 5.5 * 60 * 60 * 1000;
      const nowIST      = new Date(Date.now() + istOffsetMs);

      const scheduledIST = new Date(new Date(schedule.scheduledDate).getTime() + istOffsetMs);
      const cutoffIST    = new Date(scheduledIST);
      cutoffIST.setUTCHours(cutoffHour, cutoffMin, 0, 0);

      if (nowIST > cutoffIST) {
        return res.status(403).json({
          success: false,
          msg: `Attendance cutoff has passed. Responses were due by ${org.cutoffTime}.`,
        });
      }
    }

    // ── Block if delivery is already completed ──────────────────────────────
    const delivery = await Delivery.findOne({ scheduleId }).lean();
    if (delivery?.status === "handed_over") {
      return res.status(403).json({
        success: false,
        msg: "Attendance is locked — delivery has already been completed.",
      });
    }
    // ───────────────────────────────────────────────────────────────────────

    const { start, end } = getUTCDayRange(schedule.scheduledDate);

    await Attendance.findOneAndUpdate(
      { userId, date: { $gte: start, $lte: end } },
      {
        $set: {
          userId,
          organizationId,
          scheduleId,
          response,
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