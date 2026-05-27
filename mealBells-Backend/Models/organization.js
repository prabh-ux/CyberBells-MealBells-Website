import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    companyName: {
      type:     String,
      required: true,
      trim:     true,
      default:  "",
    },
    contactEmail: {
      type:      String,
      lowercase: true,
      trim:      true,
      default:   "",
    },
    officeAddress: {
      type:    String,
      trim:    true,
      default: "",
    },
  },
  {
    timestamps:  true,
    collection: "organizations",
  }
);

export const organizationModel = mongoose.model("organizations", organizationSchema);