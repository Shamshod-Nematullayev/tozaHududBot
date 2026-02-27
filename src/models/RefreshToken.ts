import { Schema, model } from 'mongoose';

export interface RefreshToken {
  userId: Schema.Types.ObjectId;
  tokenHash: string;
  userAgent: string;
  ip: string;
  expiresAt: Date;
  revoked: boolean;
  replacedByToken: string;
}

const refreshTokenSchema = new Schema<RefreshToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'admin',
      required: true,
      index: true,
    },

    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },

    userAgent: {
      type: String,
    },

    ip: {
      type: String,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    revoked: {
      type: Boolean,
      default: false,
    },

    replacedByToken: {
      type: String, // new token hash
    },
  },
  {
    timestamps: true,
  }
);

// TTL – muddati o‘tganda avtomatik o‘chadi
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = model('RefreshToken', refreshTokenSchema);
