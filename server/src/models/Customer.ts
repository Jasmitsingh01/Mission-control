import { Schema, model, Document } from 'mongoose';

export interface CustomerDocument extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: Date;
}

const customerSchema = new Schema<CustomerDocument>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  address: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Customer = model<CustomerDocument>('Customer', customerSchema);
