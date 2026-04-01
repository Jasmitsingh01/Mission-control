import { Schema, model, Document, Types } from 'mongoose';

interface SelectedOption {
  optionName: string;
  optionValue: string;
}

export interface OrderItem {
  menuItemId: Types.ObjectId;
  name: string;
  quantity: number;
  priceAtOrder: number;
  selectedOptions?: SelectedOption[];
}

export interface OrderDocument extends Document {
  customerId?: Types.ObjectId;
  orderTimestamp: Date;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';
  totalAmount: number;
  items: OrderItem[];
}

const selectedOptionSchema = new Schema<SelectedOption>({
  optionName: { type: String, required: true },
  optionValue: { type: String, required: true },
});

const orderItemSchema = new Schema<OrderItem>({
  menuItemId: { type: Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  priceAtOrder: { type: Number, required: true },
  selectedOptions: [selectedOptionSchema],
});

const orderSchema = new Schema<OrderDocument>({
  customerId: { type: Types.ObjectId, ref: 'Customer' },
  orderTimestamp: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'],
    default: 'Pending',
  },
  totalAmount: { type: Number, required: true },
  items: [orderItemSchema],
});

export const Order = model<OrderDocument>('Order', orderSchema);
