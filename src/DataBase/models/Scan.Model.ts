import { Schema, model, models, Types, Model } from "mongoose";

export enum ScanStatusEnum {
  QUEUED = "queued",
  PREPARING = "preparing",
  SCANNING = "scanning",
  COMPLETED = "completed",
  FAILED = "failed",
  STOPPED = "stopped",
}

export enum ScanTypeEnum {
  NORMAL = "normal",
  DEEP = "deep",
}

interface IResultSummary {
  high: number;
  medium: number;
  low: number;
  informational: number;
}

interface IResult {
  baseUrl: string;
  alertsCount: number;
  summaryTotal: number;
  summary: IResultSummary;
}

export interface IScan {
  target: string;
  userId: Types.ObjectId;

  scanType: ScanTypeEnum;

  jobId?: string | null;
  monitorJobId?: string | null;

  zapScanId?: number | null;

  status: ScanStatusEnum;
  progress?: number | null;

  startedAt?: Date | null;
  finishedAt?: Date | null;

  failureReason?: string | null;

  result?: IResult | null;
}

const resultSchema = new Schema<IResult>(
  {
    baseUrl: {
      type: String,
      trim: true,
    },
    alertsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    summaryTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    summary: {
      high: {
        type: Number,
        default: 0,
        min: 0,
      },
      medium: {
        type: Number,
        default: 0,
        min: 0,
      },
      low: {
        type: Number,
        default: 0,
        min: 0,
      },
      informational: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  },
  {
    _id: false,
  }
);

const scanSchema = new Schema<IScan>(
  {
    target: {
      type: String,
      required: true,
      trim: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    scanType: {
      type: String,
      enum: Object.values(ScanTypeEnum),
      default:ScanTypeEnum.NORMAL,
      required: true,
    },

    jobId: {
      type: String,
      default: null,
    },

    monitorJobId: {
      type: String,
      default: null,
    },

    zapScanId: {
      type: Number,
      default: null,
    },

    status: {
      type: String,
      enum: Object.values(ScanStatusEnum),
      default: ScanStatusEnum.QUEUED,
    },

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    finishedAt: {
      type: Date,
      default: null,
    },

    failureReason: {
      type: String,
      default: null,
    },

    result: {
      type: resultSchema,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const ScanModel: Model<IScan> =
  (models.Scan as Model<IScan>) || model<IScan>("Scan", scanSchema);