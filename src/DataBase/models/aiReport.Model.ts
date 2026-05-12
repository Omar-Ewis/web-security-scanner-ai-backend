import { Schema, Types, model, Model, models } from "mongoose";

export enum ReportTypeEnum {
  ALL = "All",
  HIGH = "High",
  MEDIUM = "Medium",
  LOW = "Low",

}

export enum ReportStatusEnum {
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface IReport {
  scanId: Types.ObjectId;
  userId: Types.ObjectId;

  typeOfRisk: ReportTypeEnum;
  reportName: string;

  fileUrl?: string | null;
  cloudinaryPublicId?:string | null

  status: ReportStatusEnum;

  generationTimeMs?: number | null;

  failureReason?: string | null;
}

const reportSchema = new Schema<IReport>(
  {
    scanId: {
      type: Schema.Types.ObjectId,
      ref: "Scan",
      required: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    typeOfRisk: {
      type: String,
      enum: Object.values(ReportTypeEnum),
      required: true,
    },

    reportName: {
      type: String,
      required: true,
      trim: true,
    },

    fileUrl: {
      type: String,
      default: null,
    },

    cloudinaryPublicId: {
      type: String,
      default: null,
    },
    
    status: {
      type: String,
      enum: Object.values(ReportStatusEnum),
      default: ReportStatusEnum.PROCESSING,
      required: true,
    },

    generationTimeMs: {
      type: Number,
      default: null,
      min: 0,
    },

    failureReason: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ scanId: 1, createdAt: -1 });
reportSchema.index({ userId: 1, status: 1 });
reportSchema.index(
  { scanId: 1, userId: 1, typeOfRisk: 1 },
  { unique: true }
);

export const ReportModel: Model<IReport> =
  (models.Report as Model<IReport>) ||
  model<IReport>("Report", reportSchema);