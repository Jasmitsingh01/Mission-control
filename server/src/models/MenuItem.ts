import { Schema, model, Document } from 'mongoose';

interface Option {
  optionName: string;
  optionValues: string[];
}

export interface MenuItemDocument extends Document {
  name: string;
  category: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  options?: Option[];
}

const optionSchema = new Schema<Option>({
  optionName: { type: String, required: true },
  optionValues: [{ type: String, required: true }],
});

const menuItemSchema = new Schema<MenuItemDocument>({
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  imageUrl: { type: String },
  isAvailable: { type: Boolean, default: true },
  options: [optionSchema],
});

export const MenuItem = model<MenuItemDocument>('MenuItem', menuItemSchema);
