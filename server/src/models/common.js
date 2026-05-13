import mongoose from 'mongoose';

export const createSchema = (definition, options = {}) =>
  new mongoose.Schema(definition, {
    timestamps: false,
    minimize: false,
    ...options,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        delete ret._id;
        return ret;
      },
      ...(options.toJSON || {}),
    },
  });
