import { platformSettingsModel } from "../../Models/platformSettings.js";
import { organizationModel }     from "../../Models/organization.js";
import { userModel }             from "../../Models/user.js";

// ── GET /super-admin/settings ─────────────────────────────────────────────────
export const getSuperAdminSettings = async (req, res) => {
  try {
    // Upsert: create the doc if it doesn't exist yet (singleton pattern)
    let settings = await platformSettingsModel.findOne();
    if (!settings) {
      settings = await platformSettingsModel.create({});
    }

    // Live stats — cheap counts, not aggregations
    const [totalVendors, totalOrgs, totalMembers] = await Promise.all([
      userModel.countDocuments({ type: "vendor" }),
      organizationModel.countDocuments(),
      userModel.countDocuments({ type: "user" }),
    ]);

    return res.status(200).json({
      success: true,
      settings: {
        defaults: {
          defaultMealTime:          settings.defaultMealTime,
          defaultCutoffTime:        settings.defaultCutoffTime,
          defaultCapacity:          settings.defaultCapacity,
          defaultBillingPlan:       settings.defaultBillingPlan,
          defaultAllowDishRequests: settings.defaultAllowDishRequests,
        },
        limits: {
          maxOrgsPerVendor:      settings.maxOrgsPerVendor,
          maxMembersPerOrg:      settings.maxMembersPerOrg,
          maxDishRequestsPerDay: settings.maxDishRequestsPerDay,
          attendanceLockHours:   settings.attendanceLockHours,
        },
        flags: {
          vendorOnboarding:     settings.vendorOnboarding,
          selfServeOrgCreation: settings.selfServeOrgCreation,
          emailNotifications:   settings.emailNotifications,
          maintenanceMode:      settings.maintenanceMode,
        },
        meta: {
          supportEmail:    settings.supportEmail,
          platformVersion: settings.platformVersion,
        },
        stats: {
          totalVendors,
          totalOrgs,
          totalMembers,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ msg: "Internal error: " + err.message });
  }
};

// ── PUT /super-admin/settings ─────────────────────────────────────────────────
export const updateSuperAdminSettings = async (req, res) => {
  try {
    const { defaults = {}, limits = {}, flags = {}, meta = {} } = req.body;

    const updates = {
      // defaults
      ...(defaults.defaultMealTime          !== undefined && { defaultMealTime:          defaults.defaultMealTime }),
      ...(defaults.defaultCutoffTime        !== undefined && { defaultCutoffTime:        defaults.defaultCutoffTime }),
      ...(defaults.defaultCapacity          !== undefined && { defaultCapacity:          Number(defaults.defaultCapacity) }),
      ...(defaults.defaultBillingPlan       !== undefined && { defaultBillingPlan:       defaults.defaultBillingPlan }),
      ...(defaults.defaultAllowDishRequests !== undefined && { defaultAllowDishRequests: defaults.defaultAllowDishRequests }),
      // limits
      ...(limits.maxOrgsPerVendor      !== undefined && { maxOrgsPerVendor:      Number(limits.maxOrgsPerVendor) }),
      ...(limits.maxMembersPerOrg      !== undefined && { maxMembersPerOrg:      Number(limits.maxMembersPerOrg) }),
      ...(limits.maxDishRequestsPerDay !== undefined && { maxDishRequestsPerDay: Number(limits.maxDishRequestsPerDay) }),
      ...(limits.attendanceLockHours   !== undefined && { attendanceLockHours:   Number(limits.attendanceLockHours) }),
      // flags
      ...(flags.vendorOnboarding     !== undefined && { vendorOnboarding:     flags.vendorOnboarding }),
      ...(flags.selfServeOrgCreation !== undefined && { selfServeOrgCreation: flags.selfServeOrgCreation }),
      ...(flags.emailNotifications   !== undefined && { emailNotifications:   flags.emailNotifications }),
      ...(flags.maintenanceMode      !== undefined && { maintenanceMode:      flags.maintenanceMode }),
      // meta
      ...(meta.supportEmail !== undefined && { supportEmail: meta.supportEmail }),
    };

    const settings = await platformSettingsModel.findOneAndUpdate(
      {},
      updates,
      { new: true, upsert: true }
    );

    // Return same shape as GET so the frontend slice stays consistent
    return res.status(200).json({
      success: true,
      settings: {
        defaults: {
          defaultMealTime:          settings.defaultMealTime,
          defaultCutoffTime:        settings.defaultCutoffTime,
          defaultCapacity:          settings.defaultCapacity,
          defaultBillingPlan:       settings.defaultBillingPlan,
          defaultAllowDishRequests: settings.defaultAllowDishRequests,
        },
        limits: {
          maxOrgsPerVendor:      settings.maxOrgsPerVendor,
          maxMembersPerOrg:      settings.maxMembersPerOrg,
          maxDishRequestsPerDay: settings.maxDishRequestsPerDay,
          attendanceLockHours:   settings.attendanceLockHours,
        },
        flags: {
          vendorOnboarding:     settings.vendorOnboarding,
          selfServeOrgCreation: settings.selfServeOrgCreation,
          emailNotifications:   settings.emailNotifications,
          maintenanceMode:      settings.maintenanceMode,
        },
        meta: {
          supportEmail:    settings.supportEmail,
          platformVersion: settings.platformVersion,
        },
        // Re-fetch stats so the UI reflects reality after save
        stats: {
          totalVendors:  await userModel.countDocuments({ type: "vendor" }),
          totalOrgs:     await organizationModel.countDocuments(),
          totalMembers:  await userModel.countDocuments({ type: "user" }),
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ msg: "Internal error: " + err.message });
  }
};