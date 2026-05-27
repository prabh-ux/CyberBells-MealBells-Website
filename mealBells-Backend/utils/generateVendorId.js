import { userModel } from "../Models/user.js";

export const generateVendorId = async () => {
  while (true) {
    const random   = Math.floor(1000 + Math.random() * 9000); // 1000–9999
    const vendorId = `VLM-${random}`;

    // ✅ search DB — if no match, this ID is safe to use
    const exists = await userModel.findOne({ vendorId });
    if (!exists) return vendorId;

    // if match found, loop and try a new random number
  }
};