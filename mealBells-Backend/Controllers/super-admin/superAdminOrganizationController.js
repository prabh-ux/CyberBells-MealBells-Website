// Controllers/super-admin/superAdminOrganizationController.js
import mongoose               from "mongoose";
import { organizationModel }  from "../../Models/organization.js";
import { userModel }          from "../../Models/user.js";

// ── GET /super-admin/organizations ───────────────────────────────────────────
/**
 * Query params:
 *   search   — string (searches companyName, contactEmail)
 *   status   — "active" | "inactive" | "all"  (default "all")
 *   page     — number (default 1)
 *   limit    — number (default 20)
 *   sortBy   — "name" | "users" | "createdAt"  (default "createdAt")
 *   sortDir  — "asc" | "desc"  (default "desc")
 */
export const getSuperOrganizations = async (req, res) => {
  try {
    const {
      search   = "",
      status   = "all",
      page     = 1,
      limit    = 20,
      sortBy   = "createdAt",
      sortDir  = "desc",
    } = req.query;

    // ── Build filter ──────────────────────────────────────────────────────────
    const filter = {};

    if (search.trim()) {
      filter.$or = [
        { companyName:   { $regex: search.trim(), $options: "i" } },
        { contactEmail:  { $regex: search.trim(), $options: "i" } },
        { officeAddress: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (status === "active")   filter.status = true;
    if (status === "inactive") filter.status = false;

    // ── Sort ──────────────────────────────────────────────────────────────────
    const SORT_MAP = { name: "companyName", users: "capacity", createdAt: "createdAt" };
    const sortField = SORT_MAP[sortBy] ?? "createdAt";
    const sort = { [sortField]: sortDir === "asc" ? 1 : -1 };

    // ── Paginate ──────────────────────────────────────────────────────────────
    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const [orgs, total] = await Promise.all([
      organizationModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate({ path: "createdBy", select: "name email" })
        .lean(),
      organizationModel.countDocuments(filter),
    ]);

    // ── Attach user counts per org ────────────────────────────────────────────
    const orgIds = orgs.map(o => o._id);

    const userCounts = await userModel.aggregate([
      { $match: { type: "user", active: true, organizationId: { $in: orgIds } } },
      { $unwind: "$organizationId" },
      { $match: { organizationId: { $in: orgIds } } },
      { $group: { _id: "$organizationId", count: { $sum: 1 } } },
    ]);

    const countMap = Object.fromEntries(userCounts.map(u => [u._id.toString(), u.count]));

    const enriched = orgs.map(org => ({
      ...org,
      userCount: countMap[org._id.toString()] ?? 0,
    }));

    // ── Summary counts (always over full collection, ignore pagination) ───────
    const [activeCount, inactiveCount] = await Promise.all([
      organizationModel.countDocuments({ status: true }),
      organizationModel.countDocuments({ status: false }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        organizations: enriched,
        pagination: {
          total,
          page:       pageNum,
          limit:      limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
        summary: {
          total:    total,
          active:   activeCount,
          inactive: inactiveCount,
        },
      },
    });
  } catch (err) {
    console.error("[getSuperOrganizations]", err);
    return res.status(500).json({ success: false, msg: "Internal server error." });
  }
};

// ── GET /super-admin/organizations/:id ───────────────────────────────────────
export const getSuperOrganizationById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, msg: "Invalid organization id." });

    const org = await organizationModel
      .findById(id)
      .populate({ path: "createdBy", select: "name email" })
      .lean();

    if (!org) return res.status(404).json({ success: false, msg: "Organization not found." });

    const userCount = await userModel.countDocuments({
      type: "user", active: true, organizationId: id,
    });

    return res.status(200).json({ success: true, data: { ...org, userCount } });
  } catch (err) {
    console.error("[getSuperOrganizationById]", err);
    return res.status(500).json({ success: false, msg: "Internal server error." });
  }
};

// ── POST /super-admin/organizations ──────────────────────────────────────────
export const createSuperOrganization = async (req, res) => {
  try {
    const {
      companyName, contactEmail, officeAddress,
      mealTime, cutoffTime, allowDishRequests, capacity, status,
    } = req.body;

    if (!companyName?.trim())
      return res.status(400).json({ success: false, msg: "Company name is required." });
    if (!contactEmail?.trim())
      return res.status(400).json({ success: false, msg: "Contact email is required." });

    const exists = await organizationModel.findOne({ contactEmail: contactEmail.toLowerCase().trim() });
    if (exists)
      return res.status(409).json({ success: false, msg: "An organization with this email already exists." });

    const org = await organizationModel.create({
      companyName:       companyName.trim(),
      contactEmail:      contactEmail.toLowerCase().trim(),
      officeAddress:     officeAddress?.trim() ?? "",
      mealTime:          mealTime   ?? "12:30",
      cutoffTime:        cutoffTime ?? "09:00",
      allowDishRequests: allowDishRequests !== undefined ? Boolean(allowDishRequests) : true,
      capacity:          capacity ? Number(capacity) : 0,
      status:            status !== undefined ? Boolean(status) : true,
      createdBy:         req.user._id,
    });

    return res.status(201).json({ success: true, msg: "Organization created.", data: org });
  } catch (err) {
    console.error("[createSuperOrganization]", err);
    return res.status(500).json({ success: false, msg: "Internal server error." });
  }
};

// ── PUT /super-admin/organizations/:id ───────────────────────────────────────
export const updateSuperOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, msg: "Invalid organization id." });

    const {
      companyName, contactEmail, officeAddress,
      mealTime, cutoffTime, allowDishRequests, capacity, status,
    } = req.body;

    const org = await organizationModel.findById(id);
    if (!org) return res.status(404).json({ success: false, msg: "Organization not found." });

    if (companyName)            org.companyName       = companyName.trim();
    if (contactEmail)           org.contactEmail      = contactEmail.toLowerCase().trim();
    if (officeAddress !== undefined) org.officeAddress = officeAddress?.trim() ?? "";
    if (mealTime)               org.mealTime          = mealTime;
    if (cutoffTime)             org.cutoffTime        = cutoffTime;
    if (allowDishRequests !== undefined) org.allowDishRequests = Boolean(allowDishRequests);
    if (capacity !== undefined) org.capacity          = Number(capacity);
    if (status !== undefined)   org.status            = Boolean(status);

    await org.save();

    return res.status(200).json({ success: true, msg: "Organization updated.", data: org });
  } catch (err) {
    console.error("[updateSuperOrganization]", err);
    return res.status(500).json({ success: false, msg: "Internal server error." });
  }
};

// ── PATCH /super-admin/organizations/:id/status ───────────────────────────────
export const toggleSuperOrganizationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, msg: "Invalid organization id." });

    const org = await organizationModel.findById(id);
    if (!org) return res.status(404).json({ success: false, msg: "Organization not found." });

    org.status = !org.status;
    await org.save();

    return res.status(200).json({
      success: true,
      msg:     `Organization ${org.status ? "activated" : "deactivated"}.`,
      data:    { _id: org._id, status: org.status },
    });
  } catch (err) {
    console.error("[toggleSuperOrganizationStatus]", err);
    return res.status(500).json({ success: false, msg: "Internal server error." });
  }
};

// ── DELETE /super-admin/organizations/:id ─────────────────────────────────────
export const deleteSuperOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, msg: "Invalid organization id." });

    const org = await organizationModel.findByIdAndDelete(id);
    if (!org) return res.status(404).json({ success: false, msg: "Organization not found." });

    return res.status(200).json({ success: true, msg: "Organization deleted." });
  } catch (err) {
    console.error("[deleteSuperOrganization]", err);
    return res.status(500).json({ success: false, msg: "Internal server error." });
  }
};